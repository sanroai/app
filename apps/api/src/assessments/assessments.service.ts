import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssessmentMode, AssessmentStatus } from '@sanro/types';
import { Prisma } from '@prisma/client';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { AuditService, NotificationsService } from '../common/services/audit-notifications.service';
import { StudentIdentityService } from '../common/services/student-identity.service';
import { MasteryService, normaliseAnswerToOptionText } from '../diagnosis/mastery.service';
import { awardStudentXp } from '../common/xp';
import { RemediationService } from '../remediation/remediation.service';
import { snapshotQuestions } from './assessment.snapshot';

type AssessmentCreateInput = {
  title: string;
  subjectId: string;
  chapterId?: string;
  totalMarks?: number;
  durationMinutes?: number;
  status?: string;
  mode?: string;
  attemptsAllowed?: number;
  dueAt?: string;
  startsAt?: string;
  autoSubmitOnExpiry?: boolean;
  sourcePaperId?: string;
  questionIds?: string[];
  teacherId?: string;
  institutionId?: string;
};

interface SnapshotSource {
  id: string;
  text: string;
  type: string;
  marks: number;
  answer: string;
  explanation?: string | null;
  conceptId?: string | null;
  options?: unknown;
}

function mapSnapshot(q: {
  id: string;
  text: string;
  type: string;
  marks?: number | null;
  answer: string;
  explanation?: string | null;
  conceptId?: string | null;
  options?: unknown[] | null;
}): SnapshotSource {
  return {
    id: q.id,
    text: q.text,
    type: q.type,
    marks: q.marks ?? 1,
    answer: q.answer,
    explanation: q.explanation ?? null,
    conceptId: q.conceptId ?? null,
    options: q.options ?? [],
  };
}

function sanitizeOptions(options: unknown) {
  if (!Array.isArray(options)) return [];
  return options.map((o: { text?: string; order?: number }) => ({
    text: o.text ?? '',
    order: o.order ?? 0,
  }));
}

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly mastery: MasteryService,
    private readonly remediation: RemediationService,
    private readonly identity: StudentIdentityService,
  ) {}

  private async requireStaffRole(user: RequestUser): Promise<void> {
    if (user.role !== 'INSTITUTION_ADMIN' && user.role !== 'TEACHER' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only teachers and admins can manage assessments');
    }
  }

  async list(user: RequestUser, institutionId?: string) {
    const resolvedId = this.tenant.assertInstitutionAccess(user, institutionId);
    await this.requireStaffRole(user);
    const where: Prisma.AssessmentWhereInput = { status: { not: 'ARCHIVED' } };
    if (resolvedId) where.institutionId = resolvedId;
    return this.prisma.assessment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        subject: { select: { name: true } },
        _count: { select: { assignments: true, attempts: true } },
      },
    });
  }

  async detail(user: RequestUser, id: string) {
    const resolvedId = this.tenant.assertInstitutionAccess(user);
    await this.requireStaffRole(user);
    const where: Prisma.AssessmentWhereInput = { id };
    if (resolvedId) where.institutionId = resolvedId;
    const assessment = await this.prisma.assessment.findFirst({
      where,
      include: { subject: true, sourcePaper: { select: { title: true } }, teacher: { select: { user: { select: { name: true } } } } },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');
    const questions = await this.prisma.assessmentQuestion.findMany({
      where: { assessmentId: id },
      orderBy: { order: 'asc' },
    });
    return { assessment, questions };
  }

  async create(user: RequestUser, data: AssessmentCreateInput) {
    const institutionId = this.tenant.assertInstitutionAccess(user, data.institutionId);
    if (!institutionId) throw new BadRequestException('Institution ID is required');
    await this.requireStaffRole(user);

    const questions: SnapshotSource[] = [];
    let paperSubjectId: string | null = null;
    if (data.sourcePaperId && data.sourcePaperId.length > 0) {
      const paper = await this.prisma.questionPaper.findFirst({
        where: { id: data.sourcePaperId, institutionId },
        include: {
          questions: {
            orderBy: [{ sectionOrder: 'asc' }, { order: 'asc' }],
            include: { question: { include: { options: { orderBy: { order: 'asc' } } } } },
          },
        },
      });
      if (!paper) throw new NotFoundException('Paper not found');
      paperSubjectId = (paper as any).subjectId ?? null;
      for (const pq of paper.questions) {
        questions.push(mapSnapshot(pq.question));
      }
    } else if (data.questionIds && data.questionIds.length > 0) {
      const found = await this.prisma.question.findMany({
        where: {
          id: { in: data.questionIds },
          OR: [{ institutionId }, { institutionId: null }],
          status: { not: 'ARCHIVED' },
        },
        include: { options: { orderBy: { order: 'asc' } } },
      });
      const byId = new Map(found.map((q) => [q.id, q]));
      for (const qid of data.questionIds) {
        const q = byId.get(qid);
        if (q) questions.push(mapSnapshot(q));
      }
      if (questions.length === 0) throw new BadRequestException('No valid questions found');
    } else {
      throw new BadRequestException('Provide a paper or question ids to build the assessment');
    }

    const subjectId = data.subjectId || paperSubjectId || undefined;
    const totalMarks = data.totalMarks ?? questions.reduce((a, q) => a + q.marks, 0);
    const assessment = await this.prisma.assessment.create({
      data: {
        institutionId,
        sourcePaperId: data.sourcePaperId || null,
        title: data.title,
        subjectId,
        chapterId: data.chapterId ?? null,
        totalMarks,
        durationMinutes: data.durationMinutes ?? 40,
        status: (data.status as AssessmentStatus) ?? 'DRAFT',
        mode: (data.mode as AssessmentMode) ?? 'DIGITAL',
        attemptsAllowed: data.attemptsAllowed ?? 1,
        teacherId: data.teacherId ?? null,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        autoSubmitOnExpiry: data.autoSubmitOnExpiry ?? true,
        createdById: user.sub,
      },
    });

    await snapshotQuestions(this.prisma, assessment.id, questions);

    await this.audit.log({
      userId: user.sub,
      institutionId,
      action: 'ASSESSMENT_PUBLISHED',
      entityType: 'Assessment',
      entityId: assessment.id,
      metadata: { title: assessment.title, totalMarks: assessment.totalMarks },
    });
    return this.detail(user, assessment.id);
  }

  async publish(user: RequestUser, id: string, groupIds: string[], studentIds: string[]) {
    const resolvedId = this.tenant.assertInstitutionAccess(user);
    await this.requireStaffRole(user);
    const where: Prisma.AssessmentWhereInput = { id };
    if (resolvedId) where.institutionId = resolvedId;
    const assessment = await this.prisma.assessment.findFirst({ where });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const targets = new Map<string, { id: string; userId: string | null }>();
    if (groupIds.length > 0) {
      const members = await this.prisma.groupMembership.findMany({
        where: { groupId: { in: groupIds }, student: { status: 'ACTIVE' } },
        include: { student: { select: { id: true, userId: true } } },
      });
      for (const m of members) targets.set(m.studentId, { id: m.studentId, userId: m.student.userId });
    }
    if (studentIds.length > 0) {
      const explicit = await this.prisma.student.findMany({
        where: { id: { in: studentIds }, institutionId: assessment.institutionId, status: 'ACTIVE' },
        select: { id: true, userId: true },
      });
      for (const s of explicit) targets.set(s.id, s);
    }
    if (targets.size === 0) throw new BadRequestException('No students assigned to this assessment');

    for (const s of targets.values()) {
      await this.prisma.assessmentAssignment.upsert({
        where: { assessmentId_studentId: { assessmentId: id, studentId: s.id } },
        create: { assessmentId: id, studentId: s.id },
        update: {},
      });
    }

    await this.prisma.assessment.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        startsAt: assessment.startsAt ?? new Date(),
        dueAt: assessment.dueAt ?? new Date(Date.now() + assessment.durationMinutes * 60000),
      },
    });

    for (const s of targets.values()) {
      if (s.userId) {
        await this.notifications.create({
          recipientUserId: s.userId,
          type: 'ASSESSMENT_ASSIGNED',
          title: assessment.title,
          body: 'A new test has been assigned to you.',
          entityType: 'Assessment',
          entityId: id,
        });
      }
    }

    await this.audit.log({
      userId: user.sub,
      institutionId: assessment.institutionId,
      action: 'ASSESSMENT_PUBLISHED',
      entityType: 'Assessment',
      entityId: id,
      metadata: { assignedTo: targets.size },
    });
    return { ok: true, assigned: targets.size };
  }

  async myAssignments(user: RequestUser) {
    const student = await this.identity.requireForUser(user);
    const rows = await this.prisma.assessmentAssignment.findMany({
      where: { studentId: student.id },
      include: {
        assessment: { include: { subject: { select: { name: true } } } },
      },
      orderBy: { assignedAt: 'desc' },
    });
    const attempts = await this.prisma.assessmentAttempt.findMany({
      where: { studentId: student.id },
      orderBy: { attemptIndex: 'asc' },
    });
    return {
      studentId: student.id,
      assignments: rows.map((r) => ({
        ...r,
        questionCount: 0,
        attempts: attempts.filter((a) => a.assessmentId === r.assessmentId).map((a) => ({
          id: a.id,
          attemptIndex: a.attemptIndex,
          status: a.status,
          score: a.score,
          maxScore: a.maxScore,
          startedAt: a.startedAt,
          submittedAt: a.submittedAt,
        })),
      })),
    };
  }

  private async getStudentAttempt(user: RequestUser) {
    return this.identity.requireForUser(user);
  }

  async startAttempt(user: RequestUser, assessmentId: string) {
    const student = await this.getStudentAttempt(user);
    const assessment = await this.prisma.assessment.findFirst({
      where: student.institutionId ? { id: assessmentId, institutionId: student.institutionId } : { id: assessmentId },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const assignment = await this.prisma.assessmentAssignment.findUnique({
      where: { assessmentId_studentId: { assessmentId, studentId: student.id } },
    });
    if (!assignment) throw new ForbiddenException('This assessment was not assigned to you');

    const now = new Date();
    if (assessment.startsAt && now < assessment.startsAt) {
      throw new ForbiddenException(`Assessment opens at ${assessment.startsAt.toISOString()}`);
    }
    if (assessment.status !== 'PUBLISHED') throw new ForbiddenException('Assessment is not open yet');
    if (assessment.dueAt && now > assessment.dueAt) {
      throw new ForbiddenException('Assessment deadline has passed');
    }

    const attemptCount = await this.prisma.assessmentAttempt.count({
      where: { assessmentId, studentId: student.id },
    });
    if (attemptCount >= assessment.attemptsAllowed) {
      throw new ForbiddenException('Attempt limit reached for this assessment');
    }

    const attemptIndex = attemptCount + 1;
    const existing = await this.prisma.assessmentAttempt.findUnique({
      where: {
        assessmentId_studentId_attemptIndex: { assessmentId, studentId: student.id, attemptIndex },
      },
    });
    const attempt =
      existing && existing.status === 'IN_PROGRESS'
        ? existing
        : await this.prisma.assessmentAttempt.create({
            data: { assessmentId, studentId: student.id, attemptIndex, status: 'IN_PROGRESS', startedAt: now },
          });

    const questions = await this.prisma.assessmentQuestion.findMany({
      where: { assessmentId },
      orderBy: { order: 'asc' },
    });
    return {
      attemptId: attempt.id,
      attemptIndex,
      durationMinutes: assessment.durationMinutes,
      dueAt: assessment.dueAt,
      autoSubmitOnExpiry: assessment.autoSubmitOnExpiry,
      questions: questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        marks: q.marks,
        order: q.order,
        options: sanitizeOptions(q.options),
      })),
    };
  }

  async saveAnswers(
    user: RequestUser,
    attemptId: string,
    answers: Array<{ snapshotQuestionId: string; answer: string }>,
  ) {
    const student = await this.getStudentAttempt(user);
    const attempt = await this.prisma.assessmentAttempt.findFirst({
      where: { id: attemptId, studentId: student.id },
      include: { assessment: { include: { questions: true } } },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status !== 'IN_PROGRESS') throw new ConflictException('Attempt is already submitted');

    const allowedIds = new Set(attempt.assessment.questions.map((q) => q.id));
    const marksById = new Map(attempt.assessment.questions.map((q) => [q.id, q.marks]));
    for (const a of answers) {
      if (!allowedIds.has(a.snapshotQuestionId)) throw new BadRequestException('Question not in this assessment');
      await this.prisma.studentAnswer.upsert({
        where: {
          attemptId_assessmentQuestionId: { attemptId, assessmentQuestionId: a.snapshotQuestionId },
        },
        create: {
          attemptId,
          assessmentQuestionId: a.snapshotQuestionId,
          answer: a.answer || null,
          maxMarks: marksById.get(a.snapshotQuestionId) ?? 1,
        },
        update: { answer: a.answer || null },
      });
    }
    return { ok: true };
  }

  async submitAttempt(user: RequestUser, attemptId: string) {
    const student = await this.getStudentAttempt(user);
    const attempt = await this.prisma.assessmentAttempt.findFirst({
      where: { id: attemptId, studentId: student.id },
      include: {
        assessment: { include: { questions: true } },
        answers: true,
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status === 'SUBMITTED' || attempt.status === 'AUTO_SUBMITTED') {
      throw new ConflictException('Attempt already submitted');
    }

    const submittedAt = new Date();
    const timeSpentSeconds = attempt.startedAt
      ? Math.round((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000)
      : 0;

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let pendingCount = 0;
    const conceptEvidence = new Map<string, { conceptId: string; questions: number; correct: number }>();

    const answersByQuestion = new Map(attempt.answers.map((a) => [a.assessmentQuestionId, a]));

    for (const aq of attempt.assessment.questions) {
      const studentAns = answersByQuestion.get(aq.id);

      if (!this.mastery.isObjectiveType(aq.type)) {
        if (studentAns?.answer) {
          pendingCount++;
          await this.prisma.studentAnswer.update({
            where: { id: studentAns.id },
            data: { maxMarks: aq.marks },
          });
        } else {
          skippedCount++;
        }
        continue;
      }

      if (!studentAns || !studentAns.answer) {
        skippedCount++;
        continue;
      }

      // The graded answer is the option text; resolve an option id sent by a client
      // so a correct answer can never be marked wrong.
      const gradedAnswer = normaliseAnswerToOptionText(
        { options: (aq.options ?? []) as Array<{ id: string; text: string }> },
        studentAns.answer,
      );
      const graded = this.mastery.gradeAssessmentQuestion(
        { id: aq.id, type: aq.type, marks: aq.marks, answer: aq.answer, options: aq.options },
        gradedAnswer,
      );
      const isCorrect = graded?.correct ?? false;
      const marksAwarded = isCorrect ? aq.marks : 0;
      await this.prisma.studentAnswer.update({
        where: { id: studentAns.id },
        data: { isCorrect, marksAwarded, maxMarks: aq.marks, gradedByTeacher: false },
      });

      score += marksAwarded;
      if (isCorrect) correctCount++;
      else wrongCount++;

      if (aq.conceptId) {
        const ev = conceptEvidence.get(aq.conceptId) ?? { conceptId: aq.conceptId, questions: 0, correct: 0 };
        ev.questions += 1;
        ev.correct += isCorrect ? 1 : 0;
        conceptEvidence.set(aq.conceptId, ev);
      }
    }

    const maxScore = attempt.assessment.totalMarks;
    const diagnosis = await this.mastery.applyAttemptEvidence(student.id, { attemptId: attempt.id }, [...conceptEvidence.values()]);

    const weak = diagnosis.filter((d) => d.weak).map((d) => ({ conceptId: d.conceptId }));
    if (weak.length > 0) {
      await this.remediation.createPlans(student.id, weak, student.userId ?? undefined);
    }

    const updated = await this.prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'SUBMITTED',
        submittedAt,
        score,
        maxScore,
        correctCount,
        wrongCount,
        skippedCount,
        accuracy:
          correctCount + wrongCount > 0 ? Math.round((correctCount / (correctCount + wrongCount)) * 10000) / 100 : 0,
        timeSpentSeconds,
      },
    });

    // one implementation of the XP + streak rules (the old inline copy reset the
    // streak to 1 whenever a student did a second activity on the same day)
    await awardStudentXp(this.prisma, student.id, score, 'ASSESSMENT_COMPLETED');

    if (student.userId) {
      await this.notifications.create({
        recipientUserId: student.userId,
        type: 'ASSESSMENT_RESULT',
        title: 'Result ready',
        body: `You scored ${score} out of ${maxScore} on "${attempt.assessment.title}".`,
        entityType: 'AssessmentAttempt',
        entityId: attempt.id,
      });
    }

    return {
      attempt: updated,
      score,
      maxScore,
      correctCount,
      wrongCount,
      skippedCount,
      pendingGrading: pendingCount,
      diagnosis,
      note: pendingCount > 0 ? 'Subjective answers are being reviewed by your teacher.' : 'All questions graded.',
    };
  }

  async attemptsForAssessment(user: RequestUser, assessmentId: string) {
    const resolvedId = this.tenant.assertInstitutionAccess(user);
    await this.requireStaffRole(user);
    const where: Prisma.AssessmentAttemptWhereInput = { assessment: { id: assessmentId } };
    if (resolvedId) where.assessment = { id: assessmentId, institutionId: resolvedId };
    const attempts = await this.prisma.assessmentAttempt.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, rollNumber: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
    const attemptsWithPending = await Promise.all(
      attempts.map(async (a) => {
        const pending = await this.prisma.studentAnswer.count({
          where: { attemptId: a.id, answer: { not: null }, marksAwarded: null },
        });
        return { ...a, pendingGrading: pending };
      }),
    );
    return attemptsWithPending;
  }

  async attemptDetail(user: RequestUser, attemptId: string) {
    const resolvedId = this.tenant.assertInstitutionAccess(user);
    const attemptWhere: Prisma.AssessmentAttemptWhereInput = { id: attemptId };
    // Only staff may read another user's attempt. Students (and any non-staff
    // role) are scoped to attempts whose Student row is linked to their own
    // account — the previous `OR student.institutionId` clause let any
    // same-tenant student read a classmate's attempt, name and roll number.
    const isStaff = user.role === 'INSTITUTION_ADMIN' || user.role === 'TEACHER' || user.role === 'SUPER_ADMIN';
    if (isStaff && resolvedId) {
      attemptWhere.OR = [{ student: { institutionId: resolvedId } }, { student: { userId: user.sub } }];
    } else {
      attemptWhere.student = { userId: user.sub };
    }
    const attempt = await this.prisma.assessmentAttempt.findFirst({
      where: attemptWhere,
      include: {
        assessment: { include: { subject: true } },
        student: { select: { id: true, name: true, rollNumber: true, userId: true } },
        answers: true,
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');

    const isStudentOwner = user.role === 'STUDENT' && attempt.student.userId === user.sub;
    const questions = await this.prisma.assessmentQuestion.findMany({
      where: { assessmentId: attempt.assessmentId },
      orderBy: { order: 'asc' },
    });
    const answerMap = new Map(attempt.answers.map((a) => [a.assessmentQuestionId, a]));
    const showResult = isStudentOwner && attempt.status === 'SUBMITTED';

    // What to fix next: the concepts behind the questions the student got wrong.
    // The result screen used to end at the score, which left the DIAGNOSE step of
    // ASSESS -> DIAGNOSE -> FIX with no way forward.
    let weakConcepts: Array<{ id: string; name: string }> = [];
    if (showResult) {
      const wrongConceptIds = [
        ...new Set(
          questions
            .filter((q) => q.conceptId && answerMap.get(q.id)?.isCorrect === false)
            .map((q) => q.conceptId as string),
        ),
      ];
      if (wrongConceptIds.length > 0) {
        weakConcepts = await this.prisma.concept.findMany({
          where: { id: { in: wrongConceptIds } },
          select: { id: true, name: true },
          take: 6,
        });
      }
    }

    return {
      attempt: {
        id: attempt.id,
        status: attempt.status,
        score: attempt.score,
        maxScore: attempt.maxScore,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        skippedCount: attempt.skippedCount,
        accuracy: attempt.accuracy ? Number(attempt.accuracy) : null,
        timeSpentSeconds: attempt.timeSpentSeconds,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
      },
      assessment: {
        title: attempt.assessment.title,
        subject: attempt.assessment.subject?.name ?? 'General',
        totalMarks: attempt.assessment.totalMarks,
      },
      student: isStudentOwner ? undefined : attempt.student,
      weakConcepts,
      questions: questions.map((q) => {
        const a = answerMap.get(q.id);
        return {
          id: q.id,
          text: q.text,
          type: q.type,
          marks: q.marks,
          order: q.order,
          options: isStudentOwner ? sanitizeOptions(q.options) : q.options,
          yourAnswer: a?.answer ?? null,
          correctAnswer: showResult ? q.answer : isStudentOwner ? null : q.answer,
          isCorrect: a?.isCorrect ?? null,
          marksAwarded: a?.marksAwarded ?? null,
          maxMarks: a?.maxMarks ?? q.marks,
          gradedByTeacher: a?.gradedByTeacher ?? false,
          conceptId: isStudentOwner ? undefined : q.conceptId,
        };
      }),
    };
  }

  /**
   * The question paper as the student will see it, before starting.
   *
   * `startAttempt` already returns the questions, but only after an attempt row
   * exists - so a student could not look at a paper (sections, marks, duration)
   * without committing to an attempt. This returns the same questions with no
   * attempt, no answers and no `isCorrect` flags.
   */
  async paperForStudent(user: RequestUser, assessmentId: string) {
    const student = await this.getStudentAttempt(user);
    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        ...(student.institutionId ? { institutionId: student.institutionId } : {}),
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        chapter: { select: { id: true, name: true, grade: true } },
        questions: { orderBy: { order: 'asc' } },
      },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const assignment = await this.prisma.assessmentAssignment.findUnique({
      where: { assessmentId_studentId: { assessmentId, studentId: student.id } },
    });
    if (!assignment) throw new ForbiddenException('This assessment was not assigned to you');

    const attemptsUsed = await this.prisma.assessmentAttempt.count({
      where: { assessmentId, studentId: student.id },
    });
    const now = new Date();
    const opensAt = assessment.startsAt;
    const isOpen =
      assessment.status === 'PUBLISHED' &&
      (!opensAt || now >= opensAt) &&
      (!assessment.dueAt || now <= assessment.dueAt);

    return {
      id: assessment.id,
      title: assessment.title,
      subject: assessment.subject ? { id: assessment.subject.id, name: assessment.subject.name, code: assessment.subject.code } : null,
      chapter: assessment.chapter ? { id: assessment.chapter.id, name: assessment.chapter.name, grade: assessment.chapter.grade } : null,
      totalMarks: assessment.totalMarks,
      durationMinutes: assessment.durationMinutes,
      status: assessment.status,
      mode: assessment.mode,
      startsAt: assessment.startsAt,
      dueAt: assessment.dueAt,
      attemptsAllowed: assessment.attemptsAllowed,
      attemptsUsed,
      attemptsLeft: Math.max(0, assessment.attemptsAllowed - attemptsUsed),
      isOpen,
      questionCount: assessment.questions.length,
      questions: assessment.questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        marks: q.marks,
        order: q.order,
        options: sanitizeOptions(q.options),
      })),
    };
  }

  async gradeAnswer(user: RequestUser, attemptId: string, answerId: string, marksAwarded: number) {
    const resolvedId = this.tenant.assertInstitutionAccess(user);
    await this.requireStaffRole(user);
    const attemptWhere: Prisma.AssessmentAttemptWhereInput = { id: attemptId };
    if (resolvedId) attemptWhere.student = { institutionId: resolvedId };
    const attempt = await this.prisma.assessmentAttempt.findFirst({
      where: attemptWhere,
      include: { student: true },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');

    const answerRow = await this.prisma.studentAnswer.findUnique({
      where: { id: answerId },
      include: { question: true },
    });
    if (!answerRow || answerRow.attemptId !== attempt.id) throw new NotFoundException('Answer not found');

    const maxMarks = answerRow.maxMarks ?? answerRow.question.marks;
    const awarded = Math.max(0, Math.min(marksAwarded, maxMarks));
    const isCorrect = awarded >= Math.ceil(maxMarks / 2);

    await this.prisma.studentAnswer.update({
      where: { id: answerId },
      data: { marksAwarded: awarded, isCorrect, gradedByTeacher: true, gradedById: user.sub, gradedAt: new Date() },
    });

    const answers = await this.prisma.studentAnswer.findMany({ where: { attemptId: attempt.id } });
    const score = answers.reduce((a, x) => a + (x.marksAwarded ?? 0), 0);
    const graded = answers.filter((x) => x.marksAwarded !== null);
    const correct = answers.filter((x) => x.isCorrect === true).length;
    const wrong = graded.filter((x) => x.isCorrect === false).length;
    const skipped = answers.filter((x) => !x.answer).length;
    const pending = answers.filter((x) => x.answer && x.marksAwarded === null).length;

    await this.prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        score,
        correctCount: correct,
        wrongCount: wrong,
        skippedCount: skipped,
        accuracy: correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 10000) / 100 : 0,
      },
    });

    if (answerRow.question.conceptId && answerRow.answer) {
      await this.mastery.applyAttemptEvidence(attempt.studentId, { attemptId: attempt.id }, [
        {
          conceptId: answerRow.question.conceptId,
          questions: 1,
          correct: isCorrect ? 1 : 0,
        },
      ]);
    }

    await this.audit.log({
      userId: user.sub,
      institutionId: attempt.student.institutionId ?? resolvedId,
      action: 'RESULT_MODIFIED',
      entityType: 'StudentAnswer',
      entityId: answerId,
      metadata: { marksAwarded: awarded, pendingRemaining: pending },
    });
    return { ok: true, score, pendingGrading: pending };
  }
}