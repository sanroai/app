import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@sanro/types';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { RequestUser } from '../common/types/auth-context';
import { toCsv } from './csv';

type Scope = { institutionId: string; groupIds: string[] };

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
  ) {}

private async resolveScope(user: RequestUser, institutionId?: string): Promise<Scope> {
    if (user.role !== Role.INSTITUTION_ADMIN && user.role !== Role.SUPER_ADMIN) {
      const teacherInstitutionId = this.tenant.requireInstitution(user);
      const teacher = await this.prisma.teacher.findFirst({ where: { userId: user.sub, institutionId: teacherInstitutionId } });
      if (!teacher) return { institutionId: teacherInstitutionId, groupIds: [] };

      const links = await this.prisma.teacherGroup.findMany({
        where: { teacherId: teacher.id },
        select: { groupId: true },
      });
      return { institutionId: teacherInstitutionId, groupIds: links.map((l) => l.groupId) };
    }

    const resolvedInstitutionId = this.tenant.assertInstitutionAccess(user, institutionId);
    if (!resolvedInstitutionId) {
      const allGroups = await this.prisma.group.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });
      return { institutionId: '', groupIds: allGroups.map((g) => g.id) };
    }
    const groups = await this.prisma.group.findMany({
      where: { institutionId: resolvedInstitutionId, status: 'ACTIVE' },
      select: { id: true },
    });
    return { institutionId: resolvedInstitutionId, groupIds: groups.map((g) => g.id) };
  }

  private async assertGroupInScope(scope: Scope, groupId: string): Promise<void> {
    if (!scope.groupIds.includes(groupId)) {
      throw new ForbiddenException('No access to this class');
    }
  }

  private async resolveStudentIdsInScope(scope: Scope): Promise<Set<string>> {
    if (scope.groupIds.length === 0) return new Set();
    const memberships = await this.prisma.groupMembership.findMany({
      where: { groupId: { in: scope.groupIds }, student: { status: 'ACTIVE' } },
      select: { studentId: true },
    });
    return new Set(memberships.map((m) => m.studentId));
  }

  async classReport(user: RequestUser, groupId: string, institutionId?: string) {
    const scope = await this.resolveScope(user, institutionId);
    
    await this.assertGroupInScope(scope, groupId);

    const [group, memberships] = await Promise.all([
      this.prisma.group.findUnique({ where: { id: groupId } }),
      this.prisma.groupMembership.findMany({
        where: { groupId, student: { status: 'ACTIVE' } },
        include: {
          student: {
            select: { id: true, name: true, rollNumber: true, grade: true },
          },
        },
        orderBy: { student: { name: 'asc' } },
      }),
    ]);

    if (!group) throw new NotFoundException('Class not found');

    const studentIds = memberships.map((m) => m.student.id);
    const [mastery, attempts, plans] = await Promise.all([
      studentIds.length > 0
        ? this.prisma.conceptMastery.findMany({
            where: { studentId: { in: studentIds } },
            include: {
              concept: {
                select: { name: true, topic: { select: { chapter: { select: { subject: { select: { name: true } } } } } } },
              },
            },
          })
        : Promise.resolve([]),
      studentIds.length > 0
        ? this.prisma.assessmentAttempt.findMany({
            where: { studentId: { in: studentIds }, submittedAt: { not: null } },
            select: { studentId: true, score: true, maxScore: true },
          })
        : Promise.resolve([]),
      studentIds.length > 0
        ? this.prisma.remediationPlan.findMany({
            where: { studentId: { in: studentIds } },
            include: { _count: { select: { items: true } } },
          })
        : Promise.resolve([]),
    ]);

    const perStudent = new Map<string, { masteryTotal: number; masteryCount: number; weak: Set<string>; assessmentTotal: number; assessmentCount: number; plansTotal: number; plansCompleted: number }>();
    for (const m of mastery) {
      const s = perStudent.get(m.studentId) ?? { masteryTotal: 0, masteryCount: 0, weak: new Set<string>(), assessmentTotal: 0, assessmentCount: 0, plansTotal: 0, plansCompleted: 0 };
      s.masteryTotal += m.score;
      s.masteryCount += 1;
      if (m.score < 50) s.weak.add(m.concept.name);
      perStudent.set(m.studentId, s);
    }
    for (const a of attempts) {
      const s = perStudent.get(a.studentId);
      if (s && a.score != null && a.maxScore != null) {
        s.assessmentTotal += a.score;
        s.assessmentCount += 1;
      }
    }
    for (const p of plans) {
      const s = perStudent.get(p.studentId);
      if (s) {
        s.plansTotal += 1;
        if (p.status === 'COMPLETED') s.plansCompleted += 1;
      }
    }

    const students = memberships.map((m) => {
      const s = perStudent.get(m.student.id);
      const avgMastery = s && s.masteryCount > 0 ? Math.round(s.masteryTotal / s.masteryCount) : 0;
      const avgAssessment = s && s.assessmentCount > 0 ? Math.round(s.assessmentTotal / s.assessmentCount) : 0;
      const weakCount = s?.weak.size ?? 0;
      const needsHelp = avgMastery < 50 || weakCount > 0;
      return {
        studentId: m.student.id,
        name: m.student.name,
        rollNumber: m.student.rollNumber,
        grade: m.student.grade,
        avgMastery,
        avgAssessmentScore: avgAssessment,
        weakConceptCount: weakCount,
        weakConcepts: s ? [...s.weak].slice(0, 5) : [],
        completionRate: s ? Math.round((s.plansCompleted / Math.max(s.plansTotal, 1)) * 100) : 0,
        remediationPlans: s?.plansTotal ?? 0,
        status: needsHelp ? 'NEEDS_HELP' : avgMastery >= 70 ? 'ON_TRACK' : 'EARLY',
      };
    });

    const summary = {
      groupId: group.id,
      className: group.name,
      grade: group.grade,
      studentCount: students.length,
      avgMastery: students.length ? Math.round(students.reduce((a, s) => a + s.avgMastery, 0) / students.length) : 0,
      needsHelpCount: students.filter((s) => s.status === 'NEEDS_HELP').length,
    };

    const csv = toCsv(
      students.map((s) => ({
        'Roll Number': s.rollNumber,
        'Student Name': s.name,
        Grade: s.grade,
        'Average Mastery (%)': s.avgMastery,
        'Average Assessment (%)': s.avgAssessmentScore,
        'Weak Concepts': s.weakConcepts.join('; '),
        'Weak Concept Count': s.weakConceptCount,
        'Remediation Plans': s.remediationPlans,
        'Remediation Completion (%)': s.completionRate,
        Status: s.status,
      })),
    );

    return {
      summary,
      students,
      csv: { fileName: `class-${group.name.replace(/[^\w]+/g, '-').toLowerCase()}.csv`, content: csv },
    };
  }

  async studentReport(user: RequestUser, studentId: string, institutionId?: string) {
    const scope = await this.resolveScope(user, institutionId);
    
    const scopedIds = await this.resolveStudentIdsInScope(scope);
    if (!scopedIds.has(studentId)) {
      throw new ForbiddenException('No access to this student');
    }

    const [student, mastery, attempts, plans] = await Promise.all([
      this.prisma.student.findUnique({
        where: { id: studentId },
        include: { user: { select: { name: true, email: true } }, groupMemberships: { where: { group: { status: 'ACTIVE' } }, select: { group: { select: { name: true, grade: true } } } } },
      }),
      this.prisma.conceptMastery.findMany({
        where: { studentId },
        include: {
          concept: {
            select: { name: true, topic: { select: { chapter: { select: { subject: { select: { name: true } } } } } } },
          },
        },
        orderBy: { score: 'asc' },
      }),
      this.prisma.assessmentAttempt.findMany({
        where: { studentId, submittedAt: { not: null } },
        orderBy: { submittedAt: 'desc' },
        take: 50,
        include: {
          assessment: { select: { title: true, subject: { select: { name: true } } } },
        },
      }),
      this.prisma.remediationPlan.findMany({
        where: { studentId },
        include: {
          concept: { select: { name: true } },
          items: { select: { status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!student) throw new NotFoundException('Student not found');

    const conceptRows = mastery.map((m) => ({
      subject: m.concept.topic.chapter.subject?.name ?? 'General',
      concept: m.concept.name,
      score: m.score,
      level: m.level,
      evidenceCount: m.evidenceCount,
      lastUpdatedAt: m.lastUpdatedAt,
    }));

    const attemptRows = attempts.map((a) => ({
      assessment: a.assessment.title,
      subject: a.assessment.subject?.name ?? 'General',
      date: a.submittedAt,
      score: a.score,
      maxScore: a.maxScore,
      pct: a.maxScore && a.score != null ? Math.round((a.score / a.maxScore) * 100) : null,
      status: a.status,
      accuracy: a.accuracy ? Number(a.accuracy) : null,
      timeSpentSeconds: a.timeSpentSeconds,
    }));

    const planRows = plans.map((p) => ({
      concept: p.concept.name,
      status: p.status,
      completedItems: p.items.filter((i) => i.status === 'COMPLETED').length,
      totalItems: p.items.length,
      createdAt: p.createdAt,
      completedAt: p.completedAt,
    }));

    const avgMastery = conceptRows.length ? Math.round(conceptRows.reduce((a, r) => a + r.score, 0) / conceptRows.length) : 0;

    const evidence = attempts[0]?.assessment.title ?? null;

    const csv = toCsv(conceptRows.map((c) => ({
      Subject: c.subject,
      Concept: c.concept,
      'Mastery Score (%)': c.score,
      Level: c.level,
      'Evidence Count': c.evidenceCount,
    })));

    return {
      student: {
        id: student.id,
        name: student.user?.name ?? student.name,
        rollNumber: student.rollNumber,
        grade: student.grade,
        groups: student.groupMemberships.map((g) => g.group.name),
      },
      summary: {
        overallMastery: avgMastery,
        conceptsAssessed: conceptRows.length,
        weakConcepts: conceptRows.filter((c) => c.score < 50).length,
        assessmentsTaken: attemptRows.length,
        averageScore: attemptRows.length ? Math.round(attemptRows.reduce((a, r) => a + (r.pct ?? 0), 0) / attemptRows.length) : 0,
        lastAssessment: evidence,
      },
      conceptMastery: conceptRows.slice(0, 20),
      attempts: attemptRows,
      remediationPlans: planRows,
      csv: { fileName: `student-${(student.user?.name ?? student.name).replace(/[^\w]+/g, '-').toLowerCase()}.csv`, content: csv },
    };
  }

  async assessmentReport(user: RequestUser, assessmentId: string, institutionId?: string) {
    const scope = await this.resolveScope(user, institutionId);
    

    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        assignments: { select: { groupId: true, studentId: true } },
        subject: { select: { name: true } },
      },
    });
    if (!assessment || (scope.institutionId && assessment.institutionId !== scope.institutionId)) {
      throw new NotFoundException('Assessment not found');
    }

    const scopedIds = await this.resolveStudentIdsInScope(scope);
    const assignedStudentIds = [...new Set(assessment.assignments.map((a) => a.studentId))];
    const allowed = scopedIds.size > 0 ? assignedStudentIds.filter((id) => scopedIds.has(id)) : assignedStudentIds;

    const [students, attempts] = await Promise.all([
      this.prisma.student.findMany({
        where: { id: { in: allowed } },
        select: { id: true, name: true, rollNumber: true },
      }),
      this.prisma.assessmentAttempt.findMany({
        where: { assessmentId, studentId: { in: allowed } },
        include: { student: { select: { name: true, rollNumber: true } } },
      }),
    ]);

    const attemptByStudent = new Map(attempts.map((a) => [a.studentId, a]));
    const rows = students.map((s) => {
      const attempt = attemptByStudent.get(s.id);
      const submitted = Boolean(attempt?.submittedAt);
      const pct = attempt?.score != null && attempt?.maxScore ? Math.round((attempt.score / attempt.maxScore) * 100) : null;
      return {
        studentId: s.id,
        rollNumber: s.rollNumber,
        name: s.name,
        status: submitted ? 'SUBMITTED' : attempt?.status ?? 'NOT_STARTED',
        score: attempt?.score ?? null,
        maxScore: attempt?.maxScore ?? assessment.totalMarks,
        pct,
        accuracy: attempt?.accuracy ? Number(attempt.accuracy) : null,
        submittedAt: attempt?.submittedAt ?? null,
      };
    });

    const submitted = rows.filter((r) => r.status === 'SUBMITTED');
    const summary = {
      assessmentId: assessment.id,
      title: assessment.title,
      subject: assessment.subject?.name ?? 'General',
      totalMarks: assessment.totalMarks,
      assignedStudents: rows.length,
      submittedStudents: submitted.length,
      completionRate: rows.length ? Math.round((submitted.length / rows.length) * 100) : 0,
      avgScore: submitted.length ? Math.round(submitted.reduce((a, r) => a + (r.pct ?? 0), 0) / submitted.length) : 0,
    };

    const csv = toCsv(rows.map((r) => ({
      'Roll Number': r.rollNumber,
      'Student Name': r.name,
      Status: r.status,
      'Score': r.score ?? '-',
      'Max Score': r.maxScore,
      'Percentage': r.pct ?? '-',
      'Accuracy (%)': r.accuracy ?? '-',
      'Submitted At': r.submittedAt ? r.submittedAt.toISOString() : '-',
    })));

    return {
      summary,
      rows,
      csv: { fileName: `assessment-${assessment.title.replace(/[^\w]+/g, '-').toLowerCase()}.csv`, content: csv },
    };
  }

  async improvementReport(user: RequestUser, institutionId?: string) {
    const scope = await this.resolveScope(user, institutionId);
    
    const studentIds = await this.resolveStudentIdsInScope(scope);
    if (studentIds.size === 0) return { groups: 0, students: [], csv: { fileName: 'improvement-report.csv', content: '' } };

    const [groups, mastery, attempts, plans] = await Promise.all([
      this.prisma.group.findMany({ where: { id: { in: scope.groupIds } }, select: { id: true, name: true, grade: true } }),
      this.prisma.conceptMastery.findMany({
        where: { studentId: { in: [...studentIds] } },
        include: {
          student: { select: { id: true, name: true, rollNumber: true, groupMemberships: { where: { groupId: { in: scope.groupIds } }, select: { group: { select: { name: true } } } } } },
          concept: { select: { name: true } },
        },
      }),
      this.prisma.assessmentAttempt.findMany({
        where: { studentId: { in: [...studentIds] }, submittedAt: { not: null } },
        select: { studentId: true, score: true, maxScore: true },
      }),
      this.prisma.remediationPlan.findMany({
        where: { studentId: { in: [...studentIds] } },
        select: { studentId: true, status: true },
      }),
    ]);

    const perStudent = new Map<string, { weak: { concept: string; score: number }[]; assessmentTotal: number; assessmentCount: number; plansCompleted: number }>();
    for (const m of mastery) {
      if (m.score >= 50) continue;
      const s = perStudent.get(m.studentId) ?? { weak: [], assessmentTotal: 0, assessmentCount: 0, plansCompleted: 0 };
      s.weak.push({ concept: m.concept.name, score: m.score });
      perStudent.set(m.studentId, s);
    }
    for (const a of attempts) {
      const s = perStudent.get(a.studentId);
      if (s && a.score != null && a.maxScore != null) {
        s.assessmentTotal += a.score;
        s.assessmentCount += 1;
      }
    }
    for (const p of plans) {
      const s = perStudent.get(p.studentId);
      if (s && p.status === 'COMPLETED') s.plansCompleted += 1;
    }

    const students = [...perStudent.entries()].map(([studentId, s]) => {
      const evidence = mastery.find((m) => m.studentId === studentId);
      const student = evidence?.student;
      const avg = s.assessmentCount ? Math.round(s.assessmentTotal / s.assessmentCount) : 0;
      return {
        studentId,
        rollNumber: student?.rollNumber,
        name: student?.name ?? 'Unknown',
        className: student?.groupMemberships[0]?.group.name ?? null,
        weakConcepts: s.weak.slice(0, 5),
        weakConceptCount: s.weak.length,
        avgAssessmentScore: avg,
        remediationPlansCompleted: s.plansCompleted,
        needsHelp: true,
      };
    }).sort((a, b) => a.avgAssessmentScore - b.avgAssessmentScore);

    const csv = toCsv(students.map((s) => ({
      'Roll Number': s.rollNumber,
      'Student Name': s.name,
      Class: s.className ?? '',
      'Weak Concepts': s.weakConcepts.map((w) => `${w.concept} (${w.score}%)`).join('; '),
      'Average Assessment (%)': s.avgAssessmentScore,
      'Remediation Plans Completed': s.remediationPlansCompleted,
    })));

    return {
      groups: groups.length,
      students,
      csv: { fileName: 'improvement-report.csv', content: csv },
    };
  }

  async conceptPerformance(user: RequestUser, institutionId?: string) {
    const scope = await this.resolveScope(user, institutionId);
    
    const studentIds = await this.resolveStudentIdsInScope(scope);
    if (studentIds.size === 0) return { concepts: [] };

    const mastery = await this.prisma.conceptMastery.findMany({
      where: { studentId: { in: [...studentIds] } },
      include: {
        concept: {
          select: { id: true, name: true, topic: { select: { chapter: { select: { subject: { select: { name: true } } } } } } },
        },
      },
    });

    const byConcept = new Map<string, { conceptId: string; concept: string; subject: string; scores: number[] }>();
    for (const m of mastery) {
      const key = m.conceptId;
      const entry = byConcept.get(key) ?? {
        conceptId: m.conceptId,
        concept: m.concept.name,
        subject: m.concept.topic.chapter.subject?.name ?? 'General',
        scores: [],
      };
      entry.scores.push(m.score);
      byConcept.set(key, entry);
    }

    const concepts = [...byConcept.values()].map((e) => {
      const avg = Math.round(e.scores.reduce((a, s) => a + s, 0) / e.scores.length);
      return {
        conceptId: e.conceptId,
        concept: e.concept,
        subject: e.subject,
        studentsAssessed: e.scores.length,
        avgScore: avg,
        needsIntervention: e.scores.filter((s) => s < 50).length,
      };
    }).sort((a, b) => a.avgScore - b.avgScore);

    const csv = toCsv(concepts.map((c) => ({
      Subject: c.subject,
      Concept: c.concept,
      'Students Assessed': c.studentsAssessed,
      'Average Score (%)': c.avgScore,
      'Needing Intervention': c.needsIntervention,
    })));

    return { concepts, csv: { fileName: 'concept-performance.csv', content: csv } };
  }
}