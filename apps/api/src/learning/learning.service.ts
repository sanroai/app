import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { MasteryService } from '../diagnosis/mastery.service';
import { StudentIdentityService } from '../common/services/student-identity.service';

@Injectable()
export class LearningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly mastery: MasteryService,
    private readonly identity: StudentIdentityService,
  ) {}

  async getLearningHome(user: RequestUser) {
    const institutionId = this.tenant.requireInstitution(user);

    // For students, get their assigned grade for filtering
    let studentGrade: string | null = null;
    if (user.role === 'STUDENT') {
      const student = await this.identity.resolveForUser(user);
      if (student?.grade) {
        studentGrade = student.grade;
      }
    }

    const boards = await this.prisma.board.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: {
        grades: { orderBy: { order: 'asc' } },
        subjects: {
          where: { active: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    // Count content per subject per grade through chapters
    const allApprovedContent = await this.prisma.contentItem.findMany({
      where: {
        status: 'APPROVED',
        subjectId: { not: null },
        chapterId: { not: null },
        OR: [
          { visibility: 'PUBLIC' },
          { visibility: 'INSTITUTION_ONLY', institutionId },
        ],
      },
      select: { id: true, subjectId: true, chapterId: true },
    });

    // Map chapterId → grade
    const chapterIds = [...new Set(allApprovedContent.map((c) => c.chapterId!))];
    const chapters = await this.prisma.chapter.findMany({
      where: { id: { in: chapterIds } },
      select: { id: true, grade: true },
    });
    const chapterGradeMap = new Map(chapters.map((c) => [c.id, c.grade]));

    // Count total content per subject per grade
    const subjectGradeCountMap = new Map<string, number>();
    for (const item of allApprovedContent) {
      const grade = chapterGradeMap.get(item.chapterId!);
      if (grade) {
        const key = `${item.subjectId}|${grade}`;
        subjectGradeCountMap.set(key, (subjectGradeCountMap.get(key) ?? 0) + 1);
      }
    }

    // Count completed content
    const completedCounts = await this.prisma.contentProgress.groupBy({
      by: ['contentId'],
      where: {
        state: 'COMPLETED',
        content: {
          subjectId: { not: null },
          status: 'APPROVED',
          OR: [
            { visibility: 'PUBLIC' },
            { visibility: 'INSTITUTION_ONLY', institutionId },
          ],
        },
      },
      _count: { id: true },
    });

    // Count completed content per subject per grade
    const completedByContent = new Map<string, number>();
    for (const c of completedCounts) {
      completedByContent.set(c.contentId, c._count.id);
    }

    const subjectGradeCompletedMap = new Map<string, number>();
    for (const item of allApprovedContent) {
      const grade = chapterGradeMap.get(item.chapterId!);
      if (grade && completedByContent.has(item.id)) {
        const key = `${item.subjectId}|${grade}`;
        subjectGradeCompletedMap.set(key, (subjectGradeCompletedMap.get(key) ?? 0) + 1);
      }
    }

    // Get subjects for grade filtering
    const subjects = await this.prisma.subject.findMany({
      where: { active: true },
      select: { id: true },
    });
    const subjectIds = subjects.map((s) => s.id);

    // Get mastery per subject per grade
    const student = await this.identity.resolveForUser(user);
    let averageMasteryMap = new Map<string, number>();
    if (student) {
      const masteryByConcept = await this.prisma.conceptMastery.findMany({
        where: { studentId: student.id },
        select: { conceptId: true, score: true },
      });
      const conceptIds = masteryByConcept.map((m) => m.conceptId);
      if (conceptIds.length > 0) {
        const conceptTopics = await this.prisma.concept.findMany({
          where: { id: { in: conceptIds } },
          select: { id: true, topic: { select: { chapter: { select: { subjectId: true, grade: true } } } } },
        });
        for (const m of masteryByConcept) {
          const c = conceptTopics.find((ct) => ct.id === m.conceptId);
          if (c) {
            const key = `${c.topic.chapter.subjectId}|${c.topic.chapter.grade}`;
            const scores: number[] = averageMasteryMap.has(key) ? [] : [];
            // We'll aggregate below
          }
        }
        // Simple approach: group by subject+grade
        const scoreMap = new Map<string, number[]>();
        for (const m of masteryByConcept) {
          const c = conceptTopics.find((ct) => ct.id === m.conceptId);
          if (c) {
            const key = `${c.topic.chapter.subjectId}|${c.topic.chapter.grade}`;
            if (!scoreMap.has(key)) scoreMap.set(key, []);
            scoreMap.get(key)!.push(m.score);
          }
        }
        for (const [key, scores] of scoreMap) {
          averageMasteryMap.set(key, Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
        }
      }
    }

    return {
      boards: boards.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        grades: b.grades
          .filter((g) => !studentGrade || g.name === studentGrade)
          .map((g) => ({
          id: g.id,
          grade: g.name,
          boardId: b.id,
          subjects: b.subjects
            .filter((s) => subjectGradeCountMap.has(`${s.id}|${g.name}`))
            .map((s) => {
              const key = `${s.id}|${g.name}`;
              return {
                id: s.id,
                name: s.name,
                code: s.code,
                gradeId: g.id,
                completedContent: subjectGradeCompletedMap.get(key) ?? 0,
                totalContent: subjectGradeCountMap.get(key) ?? 0,
                averageMastery: averageMasteryMap.get(key) ?? 0,
              };
            }),
        })),
      })),
    };
  }

  async getChapters(user: RequestUser, boardId: string, grade: string, subjectId: string) {
    this.tenant.requireInstitution(user);

    // For students, verify they can only access their assigned grade
    if (user.role === 'STUDENT') {
      const student = await this.identity.resolveForUser(user);
      if (student?.grade && student.grade !== grade) {
        throw new ForbiddenException('You can only access content for your assigned grade');
      }
    }

    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, boardId, active: true },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    const chapters = await this.prisma.chapter.findMany({
      where: { subjectId, grade },
      orderBy: { order: 'asc' },
      include: {
        topics: {
          orderBy: { order: 'asc' },
          include: { concepts: { orderBy: { order: 'asc' }, select: { id: true } } },
        },
      },
    });

    const chapterIds = chapters.map((c) => c.id);

    const contentByChapter = await this.prisma.contentItem.groupBy({
      by: ['chapterId'],
      where: {
        chapterId: { in: chapterIds },
        status: 'APPROVED',
      },
      _count: { id: true },
    });

    const contentCountMap = new Map(
      contentByChapter.map((c) => [c.chapterId, c._count.id]),
    );

    const allChapterContent = await this.prisma.contentItem.findMany({
      where: {
        chapterId: { in: chapterIds },
        status: 'APPROVED',
      },
      select: { id: true, chapterId: true },
    });

    const student = await this.identity.resolveForUser(user);

    let completedSet = new Set<string>();
    if (student) {
      const allContentIds = allChapterContent.map((c) => c.id);
      if (allContentIds.length > 0) {
        const completed = await this.prisma.contentProgress.findMany({
          where: {
            studentId: student.id,
            contentId: { in: allContentIds },
            state: 'COMPLETED',
          },
          select: { contentId: true },
        });
        completedSet = new Set(completed.map((c) => c.contentId));
      }
    }

    const completedByChapter = new Map<string, number>();
    for (const item of allChapterContent) {
      if (item.chapterId && completedSet.has(item.id)) {
        completedByChapter.set(
          item.chapterId,
          (completedByChapter.get(item.chapterId) ?? 0) + 1,
        );
      }
    }

    // Get mastery for all concepts in these chapters
    const allConceptIds = chapters.flatMap((c) => c.topics.flatMap((t) => t.concepts.map((co) => co.id)));
    let masteryByConcept = new Map<string, number>();
    if (student && allConceptIds.length > 0) {
      const masteryRecords = await this.prisma.conceptMastery.findMany({
        where: { studentId: student.id, conceptId: { in: allConceptIds } },
        select: { conceptId: true, score: true },
      });
      for (const m of masteryRecords) {
        masteryByConcept.set(m.conceptId, m.score);
      }
    }

    return {
      subject: { id: subject.id, name: subject.name, code: subject.code },
      grade,
      chapters: chapters.map((c) => {
        const total = contentCountMap.get(c.id) ?? 0;
        const completed = completedByChapter.get(c.id) ?? 0;
        const conceptIds = c.topics.flatMap((t) => t.concepts.map((co) => co.id));
        const masteryScores = conceptIds.map((id) => masteryByConcept.get(id)).filter((s): s is number => s != null);
        const avgMastery = masteryScores.length > 0 ? Math.round(masteryScores.reduce((a, b) => a + b, 0) / masteryScores.length) : 0;
        return {
          id: c.id,
          name: c.name,
          code: c.code,
          order: c.order,
          description: c.description,
          topicCount: c.topics.length,
          conceptCount: c.topics.reduce((a, t) => a + t.concepts.length, 0),
          totalContent: total,
          completedContent: completed,
          percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
          averageMastery: avgMastery,
        };
      }),
    };
  }

  async getChapterDetail(user: RequestUser, chapterId: string) {
    this.tenant.requireInstitution(user);

    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        topics: {
          orderBy: { order: 'asc' },
          include: {
            concepts: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
    if (!chapter) throw new NotFoundException('Chapter not found');

    // For students, verify they can only access their assigned grade
    if (user.role === 'STUDENT') {
      const student = await this.identity.resolveForUser(user);
      if (student?.grade && student.grade !== chapter.grade) {
        throw new ForbiddenException('You can only access content for your assigned grade');
      }
    }

    const conceptIds = chapter.topics.flatMap((t) => t.concepts.map((c) => c.id));
    const allContent = await this.prisma.contentItem.findMany({
      where: { chapterId, status: 'APPROVED' },
      select: { id: true, conceptId: true },
    });

    const contentByConcept = new Map<string, number>();
    const allContentIds: string[] = [];
    for (const item of allContent) {
      allContentIds.push(item.id);
      if (item.conceptId) {
        contentByConcept.set(
          item.conceptId,
          (contentByConcept.get(item.conceptId) ?? 0) + 1,
        );
      }
    }

    const student = await this.identity.resolveForUser(user);

    let completedByConcept = new Map<string, number>();
    let masteryMap = new Map<string, { score: number; level: string; attempts: number; correct: number }>();

    if (student) {
      if (allContentIds.length > 0) {
        const completed = await this.prisma.contentProgress.findMany({
          where: {
            studentId: student.id,
            contentId: { in: allContentIds },
            state: 'COMPLETED',
          },
          select: { contentId: true },
        });
        const completedSet = new Set(completed.map((c) => c.contentId));
        for (const item of allContent) {
          if (item.conceptId && completedSet.has(item.id)) {
            completedByConcept.set(
              item.conceptId,
              (completedByConcept.get(item.conceptId) ?? 0) + 1,
            );
          }
        }
      }

      if (conceptIds.length > 0) {
        const mastery = await this.prisma.conceptMastery.findMany({
          where: { studentId: student.id, conceptId: { in: conceptIds } },
          select: { conceptId: true, score: true, level: true, attempts: true, correct: true },
        });
        for (const m of mastery) {
          masteryMap.set(m.conceptId, { score: m.score, level: m.level, attempts: m.attempts, correct: m.correct });
        }
      }
    }

    return {
      id: chapter.id,
      name: chapter.name,
      code: chapter.code,
      grade: chapter.grade,
      order: chapter.order,
      description: chapter.description,
      subject: chapter.subject,
      topics: chapter.topics.map((t) => ({
        id: t.id,
        name: t.name,
        order: t.order,
        concepts: t.concepts.map((c) => {
          const total = contentByConcept.get(c.id) ?? 0;
          const completed = completedByConcept.get(c.id) ?? 0;
          return {
            id: c.id,
            name: c.name,
            order: c.order,
            description: c.description,
            totalContent: total,
            completedContent: completed,
            mastery: masteryMap.get(c.id) ?? null,
          };
        }),
      })),
    };
  }

async getConceptDetail(user: RequestUser, conceptId: string) {
    this.tenant.requireInstitution(user);
    const concept = await this.prisma.concept.findUnique({
      where: { id: conceptId },
      include: {
        topic: {
          include: {
            chapter: { select: { id: true, name: true, grade: true } },
          },
        },
      },
    });
    if (!concept) throw new NotFoundException('Concept not found');

    // For students, verify they can only access their assigned grade
    if (user.role === 'STUDENT') {
      const student = await this.identity.resolveForUser(user);
      if (student?.grade && student.grade !== concept.topic.chapter.grade) {
        throw new ForbiddenException('You can only access content for your assigned grade');
      }
    }

    const contentItems = await this.prisma.contentItem.findMany({
      where: { conceptId, status: 'APPROVED' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        durationSeconds: true,
        thumbnailUrl: true,
        url: true,
        language: true,
      },
    });

    const student = await this.identity.resolveForUser(user);

    let progressMap = new Map<string, { state: string; secondsWatched: number | null; completedAt: Date | null }>();
    let mastery: { score: number; level: string; attempts: number; correct: number; evidenceCount: number } | null = null;

    if (student) {
      if (contentItems.length > 0) {
        const progress = await this.prisma.contentProgress.findMany({
          where: {
            studentId: student.id,
            contentId: { in: contentItems.map((c) => c.id) },
          },
          select: { contentId: true, state: true, secondsWatched: true, completedAt: true },
        });
        for (const p of progress) {
          progressMap.set(p.contentId, { state: p.state, secondsWatched: p.secondsWatched, completedAt: p.completedAt });
        }
      }

      const m = await this.prisma.conceptMastery.findUnique({
        where: { studentId_conceptId: { studentId: student.id, conceptId } },
        select: { score: true, level: true, attempts: true, correct: true, evidenceCount: true },
      });
      if (m) {
        mastery = { score: m.score, level: m.level, attempts: m.attempts, correct: m.correct, evidenceCount: m.evidenceCount };
      }
    }

    const practiceQuestions = await this.prisma.question.findMany({
      where: { conceptId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        difficulty: true,
        text: true,
        answer: true,
        explanation: true,
        marks: true,
        options: { orderBy: { order: 'asc' }, select: { id: true, text: true, order: true, isCorrect: true } },
      },
    });

    let flashcardRatings: Record<string, string> = {};
    if (student && practiceQuestions.length > 0) {
      const ratings = await this.prisma.flashcardRating.findMany({
        where: { studentId: student.id, questionId: { in: practiceQuestions.map((q) => q.id) } },
        select: { questionId: true, rating: true },
      });
      flashcardRatings = Object.fromEntries(ratings.map((r) => [r.questionId, r.rating]));
    }

    return {
      id: concept.id,
      name: concept.name,
      description: concept.description,
      order: concept.order,
      topic: { id: concept.topic.id, name: concept.topic.name },
      chapter: concept.topic.chapter,
      content: contentItems.map((item) => ({
        ...item,
        progress: progressMap.get(item.id) ?? { state: 'NOT_STARTED', secondsWatched: null, completedAt: null },
      })),
      mastery,
      practiceQuestions,
      flashcardRatings,
    };
  }

  async rateFlashcard(user: RequestUser, questionId: string, rating: string) {
    this.tenant.requireInstitution(user);

    const allowed = ['AGAIN', 'HARD', 'GOOD', 'EASY'];
    if (!allowed.includes(rating)) throw new BadRequestException('Invalid flashcard rating');

    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students can rate flashcards');

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true, conceptId: true, institutionId: true, grade: true },
    });
    if (!question) throw new NotFoundException('Question not found');

    if (student.grade && question.grade && student.grade !== question.grade) {
      throw new ForbiddenException('You can only access content for your assigned grade');
    }

    const result = await this.prisma.flashcardRating.upsert({
      where: { studentId_questionId: { studentId: student.id, questionId } },
      create: { studentId: student.id, questionId, conceptId: question.conceptId, rating },
      update: { rating },
    });

    return { ok: true, rating: result.rating };
  }

  async completeContent(user: RequestUser, contentId: string) {
    this.tenant.requireInstitution(user);

    const content = await this.prisma.contentItem.findUnique({ where: { id: contentId } });
    if (!content) throw new NotFoundException('Content not found');

    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students can track learning progress');

    const result = await this.prisma.contentProgress.upsert({
      where: { contentId_studentId: { contentId, studentId: student.id } },
      create: {
        contentId,
        studentId: student.id,
        state: 'COMPLETED',
        completedAt: new Date(),
      },
      update: {
        state: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return { ok: true, progress: result };
  }

  async getLearningProgress(user: RequestUser) {
    this.tenant.requireInstitution(user);

    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students can track learning progress');

    const [totalContent, completedProgress, masterySummary] = await Promise.all([
      this.prisma.contentItem.count({
        where: { status: 'APPROVED', subjectId: { not: null } },
      }),
      this.prisma.contentProgress.findMany({
        where: { studentId: student.id, state: 'COMPLETED' },
        select: { contentId: true, completedAt: true },
      }),
      this.prisma.conceptMastery.aggregate({
        where: { studentId: student.id },
        _avg: { score: true },
        _count: { id: true },
      }),
    ]);

    const completedSet = new Set(completedProgress.map((p) => p.contentId));
    const completedContent = completedSet.size;

    const levelCounts = await this.prisma.conceptMastery.groupBy({
      by: ['level'],
      where: { studentId: student.id },
      _count: { id: true },
    });

    const masteryByLevel: Record<string, number> = {};
    for (const l of levelCounts) {
      masteryByLevel[l.level] = l._count.id;
    }

    const recentActivity = await this.prisma.contentProgress.findMany({
      where: { studentId: student.id, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      take: 10,
      include: {
        content: { select: { id: true, title: true, type: true, subjectId: true, chapterId: true, conceptId: true } },
      },
    });

    return {
      student: { id: student.id, name: student.name, grade: student.grade },
      contentProgress: {
        totalContent,
        completedContent,
        percentComplete: totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0,
      },
      mastery: {
        averageScore: masterySummary._avg.score ?? 0,
        totalConcepts: masterySummary._count.id,
        byLevel: masteryByLevel,
      },
      recentActivity: recentActivity.map((r) => ({
        contentId: r.contentId,
        title: r.content.title,
        type: r.content.type,
        completedAt: r.completedAt,
      })),
    };
  }

  async startPractice(user: RequestUser, conceptId: string, questionCount: number) {
    this.tenant.requireInstitution(user);

    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students can practice');

    const concept = await this.prisma.concept.findUnique({ where: { id: conceptId } });
    if (!concept) throw new NotFoundException('Concept not found');

    const questions = await this.prisma.question.findMany({
      where: { conceptId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: questionCount,
      select: {
        id: true,
        text: true,
        type: true,
        marks: true,
        options: { orderBy: { order: 'asc' }, select: { id: true, text: true, order: true } },
      },
    });

    if (questions.length === 0) {
      throw new BadRequestException('No practice questions available for this concept');
    }

    const shuffled = [...questions].sort(() => Math.random() - 0.5);

    const practiceSet = await this.prisma.practiceSet.create({
      data: {
        studentId: student.id,
        conceptId,
        conceptIds: [conceptId],
        questionIds: shuffled.map((q) => q.id),
        status: 'IN_PROGRESS',
        total: shuffled.length,
        startedAt: new Date(),
      },
    });

    return {
      practiceId: practiceSet.id,
      questions: shuffled.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        marks: q.marks ?? 1,
        options: q.options.map((o) => ({ id: o.id, text: o.text, order: o.order })),
      })),
    };
  }

  async getPractice(user: RequestUser, practiceId: string) {
    this.tenant.requireInstitution(user);

    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students can practice');

    const practiceSet = await this.prisma.practiceSet.findUnique({ where: { id: practiceId } });
    if (!practiceSet) throw new NotFoundException('Practice set not found');
    if (practiceSet.studentId !== student.id) throw new ForbiddenException('Not your practice set');

    const questionIds = practiceSet.questionIds as string[];
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: {
        id: true,
        text: true,
        type: true,
        marks: true,
        options: { orderBy: { order: 'asc' }, select: { id: true, text: true, order: true } },
      },
    });

    const ordered = questionIds.map((id) => questions.find((q) => q.id === id)).filter(Boolean);

    return {
      practiceId: practiceSet.id,
      status: practiceSet.status,
      conceptId: practiceSet.conceptId,
      score: practiceSet.score,
      correctCount: practiceSet.correctCount,
      total: practiceSet.total,
      startedAt: practiceSet.startedAt,
      completedAt: practiceSet.completedAt,
      questions: ordered.map((q) => ({
        id: q!.id,
        text: q!.text,
        type: q!.type,
        marks: q!.marks ?? 1,
        options: q!.options.map((o) => ({ id: o.id, text: o.text, order: o.order })),
      })),
    };
  }

  async savePracticeAnswer(
    user: RequestUser,
    practiceId: string,
    questionId: string,
    answer: string,
  ) {
    this.tenant.requireInstitution(user);

    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students can practice');

    const practiceSet = await this.prisma.practiceSet.findUnique({ where: { id: practiceId } });
    if (!practiceSet) throw new NotFoundException('Practice set not found');
    if (practiceSet.studentId !== student.id) throw new ForbiddenException('Not your practice set');
    if (practiceSet.status !== 'IN_PROGRESS') throw new ConflictException('Practice set is already completed');

    const questionIds = practiceSet.questionIds as string[];
    if (!questionIds.includes(questionId)) {
      throw new BadRequestException('Question not in this practice set');
    }

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { options: { orderBy: { order: 'asc' } } },
    });
    if (!question) throw new NotFoundException('Question not found');

    let isCorrect: boolean | null = null;
    let correctAnswer: string | undefined;

    if (this.mastery.isObjectiveType(question.type)) {
      const graded = this.mastery.gradeAssessmentQuestion(
        { id: question.id, type: question.type, marks: question.marks ?? 1, answer: question.answer, options: question.options },
        answer,
      );
      isCorrect = graded?.correct ?? false;
      correctAnswer = question.answer;
    }

    await this.prisma.practiceAnswer.upsert({
      where: { practiceSetId_questionId: { practiceSetId: practiceId, questionId } },
      create: { practiceSetId: practiceId, questionId, answer, isCorrect },
      update: { answer, isCorrect },
    });

    return { correct: isCorrect, correctAnswer };
  }

  async submitPractice(user: RequestUser, practiceId: string) {
    this.tenant.requireInstitution(user);

    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students can practice');

    const practiceSet = await this.prisma.practiceSet.findUnique({
      where: { id: practiceId },
      include: { answers: true },
    });
    if (!practiceSet) throw new NotFoundException('Practice set not found');
    if (practiceSet.studentId !== student.id) throw new ForbiddenException('Not your practice set');
    if (practiceSet.status !== 'IN_PROGRESS') throw new ConflictException('Practice set is already completed');

    const totalQuestions = (practiceSet.questionIds as string[]).length;
    const correctAnswers = practiceSet.answers.filter((a) => a.isCorrect === true).length;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    await this.prisma.practiceSet.update({
      where: { id: practiceId },
      data: {
        status: 'COMPLETED',
        score,
        correctCount: correctAnswers,
        completedAt: new Date(),
      },
    });

    let masteryUpdate = null;
    if (practiceSet.conceptId) {
      const conceptId = practiceSet.conceptId;
      const conceptEvidence = [{
        conceptId,
        questions: totalQuestions,
        correct: correctAnswers,
      }];

      const results = await this.mastery.applyAttemptEvidence(student.id, practiceId, conceptEvidence);
      if (results.length > 0) {
        masteryUpdate = { level: results[0].level, score: results[0].score };
      }
    }

    return { score, totalQuestions, correctAnswers, masteryUpdate };
  }

  async getGamificationProfile(user: RequestUser) {
    this.tenant.requireInstitution(user);
    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students have gamification profiles');

    const profile = await this.prisma.gamificationProfile.findUnique({
      where: { studentId: student.id },
    });

    const xp = profile?.xp ?? 0;
    const level = Math.floor(xp / 500) + 1;
    const xpInLevel = xp % 500;
    const xpForLevel = 500;

    // Compute rank within institution
    const members = await this.prisma.institutionMember.findMany({
      where: { institutionId: this.tenant.requireInstitution(user), role: 'STUDENT', status: 'ACTIVE' },
      select: { userId: true },
    });
    const allStudentUserIds = members.map((m) => m.userId);
    const allStudents = await this.prisma.student.findMany({
      where: { userId: { in: allStudentUserIds }, institutionId: this.tenant.requireInstitution(user) },
      select: { id: true },
    });
    const allStudentIds = allStudents.map((s) => s.id);
    const allProfiles = await this.prisma.gamificationProfile.findMany({
      where: { studentId: { in: allStudentIds } },
      select: { studentId: true, xp: true },
    });
    const sorted = allProfiles.sort((a, b) => b.xp - a.xp);
    const rank = sorted.findIndex((p) => p.studentId === student.id) + 1 || 1;

    const achievementCount = await this.prisma.studentAchievement.count({
      where: { studentId: student.id },
    });

    const recentAchievements = await this.prisma.studentAchievement.findMany({
      where: { studentId: student.id },
      orderBy: { unlockedAt: 'desc' },
      take: 5,
      include: { achievement: true },
    });

    return {
      xp,
      level,
      xpInLevel,
      xpForLevel,
      rank,
      streakDays: profile?.streakDays ?? 0,
      achievementCount,
      recentAchievements: recentAchievements.map((a) => ({
        id: a.achievement.id,
        name: a.achievement.name,
        description: a.achievement.description,
        icon: a.achievement.icon,
        unlockedAt: a.unlockedAt,
      })),
    };
  }

  async getLeaderboard(user: RequestUser, period: string) {
    const institutionId = this.tenant.requireInstitution(user);

    const members = await this.prisma.institutionMember.findMany({
      where: { institutionId, role: 'STUDENT', status: 'ACTIVE' },
      select: { userId: true },
    });
    const userIds = members.map((m) => m.userId);

    const students = await this.prisma.student.findMany({
      where: { userId: { in: userIds }, institutionId },
      select: { id: true, userId: true, name: true },
    });

    const studentIds = students.map((s) => s.id);
    const profiles = await this.prisma.gamificationProfile.findMany({
      where: { studentId: { in: studentIds } },
      select: { studentId: true, xp: true, streakDays: true },
    });

    const profileMap = new Map(profiles.map((p) => [p.studentId, p]));
    const entries = students
      .map((s) => {
        const p = profileMap.get(s.id);
        return {
          userId: s.userId,
          name: s.name,
          xp: p?.xp ?? 0,
          level: Math.floor((p?.xp ?? 0) / 500) + 1,
          streakDays: p?.streakDays ?? 0,
        };
      })
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 20)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    const myEntry = entries.find((e) => e.userId === user.sub);
    const myRank = myEntry?.rank ?? 0;

    return { entries, myRank, period };
  }

  async getAchievements(user: RequestUser) {
    this.tenant.requireInstitution(user);
    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students have achievements');

    const allAchievements = await this.prisma.achievement.findMany({
      orderBy: { name: 'asc' },
    });

    const earned = await this.prisma.studentAchievement.findMany({
      where: { studentId: student.id },
      include: { achievement: true },
    });

    const earnedIds = new Set(earned.map((e) => e.achievementId));

    return {
      earned: earned.map((e) => ({
        id: e.achievement.id,
        name: e.achievement.name,
        description: e.achievement.description,
        icon: e.achievement.icon,
        key: e.achievement.key,
        unlockedAt: e.unlockedAt,
      })),
      locked: allAchievements
        .filter((a) => !earnedIds.has(a.id))
        .map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description,
          icon: a.icon,
          key: a.key,
        })),
    };
  }
}
