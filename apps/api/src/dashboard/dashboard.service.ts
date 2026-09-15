import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
  ) {}

  async studentHome(user: RequestUser) {
    const student = await this.prisma.student.findUnique({ where: { userId: user.sub } });
    if (!student) throw new Error('STUDENT_PROFILE_NOT_FOUND');

    const [mastery, attempts, assignments, gamification, plans] = await Promise.all([
      this.prisma.conceptMastery.findMany({
        where: { studentId: student.id },
        include: { concept: { include: { topic: { include: { chapter: true } } } } },
        orderBy: { score: 'asc' },
        take: 8,
      }),
      this.prisma.assessmentAttempt.findMany({
        where: { studentId: student.id, submittedAt: { not: null } },
        orderBy: { submittedAt: 'desc' },
        take: 5,
        include: { assessment: { select: { title: true, subject: { select: { name: true } } } } },
      }),
      this.prisma.assessmentAssignment.findMany({
        where: { studentId: student.id, assessment: { status: 'PUBLISHED' } },
        include: { assessment: { select: { id: true, title: true, dueAt: true, subject: { select: { name: true } } } } },
        take: 6,
      }),
      this.prisma.gamificationProfile.findUnique({ where: { studentId: student.id } }),
      this.prisma.remediationPlan.findMany({
        where: { studentId: student.id, status: 'ACTIVE' },
        include: { concept: { select: { name: true } }, _count: { select: { items: true } } },
        take: 5,
      }),
    ]);

    const avgScore = mastery.length
      ? Math.round((mastery.reduce((a, m) => a + m.score, 0) / mastery.length) * 10) / 10
      : 0;
    const weakCount = mastery.filter((m) => m.level === 'WEAK' || m.level === 'NEEDS_INTERVENTION').length;

    return {
      profile: { name: student.name, rollNumber: student.rollNumber, grade: student.grade ?? undefined },
      gamification,
      masterySummary: { avgScore, weakCount, conceptCount: mastery.length },
      weakContacts: mastery.filter((m) => m.level === 'WEAK' || m.level === 'NEEDS_INTERVENTION').slice(0, 4),
      recentAttempts: attempts,
      pendingAssignments: assignments,
      activeRemediationPlans: plans.map((p) => ({
        id: p.id,
        concept: p.concept.name,
        totalItems: p._count.items,
      })),
    };
  }

  async teacherHome(user: RequestUser) {
    const institutionId = this.tenant.requireInstitution(user);

    const teacher = await this.prisma.teacher.findFirst({
      where: { userId: user.sub, institutionId },
      include: {
        user: { select: { name: true, email: true } },
        subjects: { include: { subject: { select: { id: true, name: true } } } },
      },
    });

    if (!teacher) {
      return { teacher: null, classes: [], pendingWork: [], subjectStats: [] };
    }

    const teacherGroupRecords = await this.prisma.teacherGroup.findMany({
      where: { teacherId: teacher.id },
      select: { groupId: true },
    });
    const groupIds = teacherGroupRecords.map((tg) => tg.groupId);

    if (groupIds.length === 0) {
      return {
        teacher: {
          name: teacher.user.name,
          email: teacher.user.email,
          subjects: teacher.subjects.map((ts) => ({ id: ts.subject.id, name: ts.subject.name })),
        },
        classes: [],
        pendingWork: [],
        subjectStats: [],
      };
    }

    const groupMemberships = await this.prisma.groupMembership.findMany({
      where: { groupId: { in: groupIds } },
      select: { groupId: true, student: { select: { id: true, name: true } } },
    });

    const studentIds = [...new Set(groupMemberships.map((gm) => gm.student.id))];

    const groupStudentMap = new Map<string, Array<{ id: string; name: string }>>();
    for (const gm of groupMemberships) {
      const list = groupStudentMap.get(gm.groupId) ?? [];
      list.push(gm.student);
      groupStudentMap.set(gm.groupId, list);
    }

    const [groups, allMastery, assessmentsForGroups, assessmentAssignments, pendingGradingCount, pendingPaperCount, subjectTeachers] =
      await Promise.all([
        this.prisma.group.findMany({
          where: { id: { in: groupIds }, status: 'ACTIVE' },
          include: { _count: { select: { memberships: true } } },
        }),
        studentIds.length > 0
          ? this.prisma.conceptMastery.findMany({
              where: { studentId: { in: studentIds } },
              include: {
                concept: {
                  select: {
                    name: true,
                    topic: { select: { chapter: { select: { subjectId: true } } } },
                  },
                },
              },
            })
          : Promise.resolve([]),
        this.prisma.assessment.findMany({
          where: {
            institutionId,
            status: 'PUBLISHED',
            assignments: { some: { groupId: { in: groupIds } } },
          },
          include: {
            attempts: {
              where: { submittedAt: { not: null } },
              select: { score: true, maxScore: true, studentId: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        this.prisma.assessmentAssignment.findMany({
          where: { groupId: { in: groupIds } },
          select: { assessmentId: true, groupId: true },
        }),
        this.prisma.studentAnswer.count({
          where: { answer: { not: null }, marksAwarded: null, attempt: { submittedAt: { not: null } } },
        }),
        this.prisma.questionPaper.count({
          where: { institutionId, status: 'DRAFT' },
        }),
        this.prisma.teacherSubject.findMany({
          where: { teacherId: teacher.id },
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                _count: { select: { content: true, questions: true } },
              },
            },
          },
        }),
      ]);

    const assessmentToGroups = new Map<string, Set<string>>();
    for (const aa of assessmentAssignments) {
      if (!aa.groupId) continue;
      const g = assessmentToGroups.get(aa.assessmentId) ?? new Set<string>();
      g.add(aa.groupId);
      assessmentToGroups.set(aa.assessmentId, g);
    }

    const studentMasteryMap = new Map<string, { total: number; count: number; weakConcepts: string[] }>();
    for (const m of allMastery) {
      const existing = studentMasteryMap.get(m.studentId) ?? { total: 0, count: 0, weakConcepts: [] };
      existing.total += m.score;
      existing.count += 1;
      if (m.score < 50) existing.weakConcepts.push(m.concept.name);
      studentMasteryMap.set(m.studentId, existing);
    }

    const subjectMasteryMap = new Map<string, { total: number; count: number }>();
    for (const m of allMastery) {
      const subjectId = m.concept.topic.chapter.subjectId;
      const existing = subjectMasteryMap.get(subjectId) ?? { total: 0, count: 0 };
      existing.total += m.score;
      existing.count += 1;
      subjectMasteryMap.set(subjectId, existing);
    }

    const classes = groups.map((group) => {
      const students = groupStudentMap.get(group.id) ?? [];
      const studentIdsInGroup = new Set(students.map((s) => s.id));

      const groupAssessments = assessmentsForGroups
        .filter((a) => assessmentToGroups.get(a.id)?.has(group.id))
        .slice(0, 5)
        .map((a) => {
          const groupScores = a.attempts.filter((at) => studentIdsInGroup.has(at.studentId)).map((at) => at.score ?? 0);
          const avgScore = groupScores.length ? Math.round(groupScores.reduce((s, v) => s + v, 0) / groupScores.length) : 0;
          const uniqueSubmitted = new Set(a.attempts.filter((at) => studentIdsInGroup.has(at.studentId)).map((at) => at.studentId)).size;
          const completionRate = students.length > 0 ? Math.round((uniqueSubmitted / students.length) * 100) : 0;
          return { id: a.id, title: a.title, avgScore, completionRate, date: a.createdAt };
        });

      const studentAvgs = students.map((s) => {
        const m = studentMasteryMap.get(s.id);
        const avgMastery = m && m.count > 0 ? Math.round(m.total / m.count) : 0;
        return { id: s.id, name: s.name, avgMastery, weakConcepts: m?.weakConcepts.slice(0, 3) ?? [] };
      });

      const sorted = [...studentAvgs].sort((a, b) => b.avgMastery - a.avgMastery);
      const topStudents = sorted.slice(0, 5).map((s) => ({
        id: s.id,
        name: s.name,
        avgMastery: s.avgMastery,
        trend: (s.avgMastery >= 70 ? 'up' : s.avgMastery >= 50 ? 'stable' : 'down') as 'up' | 'stable' | 'down',
      }));
      const strugglingStudents = sorted
        .filter((s) => s.avgMastery < 50 || s.weakConcepts.length > 0)
        .slice(0, 5)
        .map((s) => ({ id: s.id, name: s.name, avgMastery: s.avgMastery, weakConcepts: s.weakConcepts }));

      return {
        id: group.id,
        name: group.name,
        grade: group.grade,
        studentCount: students.length,
        recentAssessments: groupAssessments,
        topStudents,
        strugglingStudents,
      };
    });

    const subjectStats = subjectTeachers.map((ts) => {
      const m = subjectMasteryMap.get(ts.subject.id);
      return {
        subjectId: ts.subject.id,
        name: ts.subject.name,
        avgMastery: m && m.count > 0 ? Math.round(m.total / m.count) : 0,
        totalQuestions: ts.subject._count.questions,
        contentCount: ts.subject._count.content,
      };
    });

    return {
      teacher: {
        name: teacher.user.name,
        email: teacher.user.email,
        subjects: teacher.subjects.map((ts) => ({ id: ts.subject.id, name: ts.subject.name })),
      },
      classes,
      pendingWork: [
        { type: 'PAPER_REVIEW' as const, count: pendingPaperCount },
        { type: 'UNGRADED_ATTEMPTS' as const, count: pendingGradingCount },
      ],
      subjectStats,
    };
  }

  async institutionHome(user: RequestUser) {
    const institutionId = this.tenant.requireInstitution(user);
    const [institution, studentCount, teacherCount, groupCount, assessmentCount, recentImports, activePlan] =
      await Promise.all([
        this.prisma.institution.findUnique({ where: { id: institutionId } }),
        this.prisma.student.count({ where: { institutionId, status: 'ACTIVE' } }),
        this.prisma.teacher.count({ where: { institutionId } }),
        this.prisma.group.count({ where: { institutionId, status: 'ACTIVE' } }),
        this.prisma.assessment.count({ where: { institutionId } }),
        this.prisma.importJob.findMany({
          where: { institutionId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        this.prisma.subscription.findFirst({
          where: { institutionId, status: { in: ['ACTIVE', 'TRIAL'] } },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    return {
      institution,
      usage: {
        activeStudents: studentCount,
        activeTeachers: teacherCount,
        groups: groupCount,
        assessments: assessmentCount,
        seatLimit: institution?.seatLimit ?? activePlan?.seatLimit ?? 0,
        seatUtilizationPct: institution?.seatLimit
          ? Math.round((studentCount / institution.seatLimit) * 100)
          : null,
      },
      subscription: activePlan,
      recentImports,
      seatAlert: institution?.seatLimit ? studentCount >= institution.seatLimit : false,
    };
  }

  async parentHome(user: RequestUser) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId: user.sub },
      include: {
        user: { select: { name: true, email: true } },
        studentLinks: {
          include: {
            student: {
              include: {
                mastery: {
                  include: { concept: { select: { name: true } } },
                },
                attempts: {
                  where: { submittedAt: { not: null } },
                  orderBy: { submittedAt: 'desc' },
                  take: 5,
                  include: { assessment: { select: { title: true, subject: { select: { name: true } } } } },
                },
              },
            },
          },
          take: 10,
        },
      },
    });

    if (!parent) {
      return { parent: null, children: [] };
    }

    const childIds = parent.studentLinks.map((l) => l.student.id);

    const [upcomingAssignments, attemptedRecords] = await Promise.all([
      childIds.length > 0
        ? this.prisma.assessmentAssignment.findMany({
            where: {
              studentId: { in: childIds },
              assessment: { status: 'PUBLISHED' },
            },
            include: {
              assessment: { select: { id: true, title: true, dueAt: true, subject: { select: { name: true } } } },
            },
            take: 30,
          })
        : Promise.resolve([]),
      childIds.length > 0
        ? this.prisma.assessmentAttempt.findMany({
            where: { studentId: { in: childIds }, submittedAt: { not: null } },
            select: { studentId: true, assessmentId: true },
          })
        : Promise.resolve([]),
    ]);

    const attemptedSet = new Set(attemptedRecords.map((a) => `${a.studentId}:${a.assessmentId}`));

    const upcomingByStudent = new Map<string, Array<{ title: string; date: Date | null; subject: string }>>();
    for (const ua of upcomingAssignments) {
      if (!attemptedSet.has(`${ua.studentId}:${ua.assessmentId}`)) {
        const list = upcomingByStudent.get(ua.studentId) ?? [];
        if (list.length < 5) {
          list.push({ title: ua.assessment.title, date: ua.assessment.dueAt, subject: ua.assessment.subject.name });
        }
        upcomingByStudent.set(ua.studentId, list);
      }
    }

    const children = parent.studentLinks.map((link) => {
      const student = link.student;
      const masteryEntries = student.mastery;
      const avgMastery =
        masteryEntries.length > 0 ? Math.round(masteryEntries.reduce((s, m) => s + m.score, 0) / masteryEntries.length) : 0;

      const weakConcepts = masteryEntries
        .filter((m) => m.score < 50)
        .sort((a, b) => a.score - b.score)
        .slice(0, 5)
        .map((m) => ({ name: m.concept.name, score: m.score, level: m.level }));

      const recentActivity = student.attempts.map((a) => ({
        type: 'ASSESSMENT' as const,
        title: a.assessment.title,
        score: a.score != null && a.maxScore != null ? Math.round((a.score / a.maxScore) * 100) : null,
        date: a.submittedAt,
      }));

      return {
        id: student.id,
        name: student.name,
        grade: student.grade,
        overallMastery: avgMastery,
        recentActivity,
        weakConcepts,
        upcomingAssessments: upcomingByStudent.get(student.id) ?? [],
      };
    });

    return {
      parent: { name: parent.user?.name ?? parent.name, email: parent.user?.email ?? parent.email },
      children,
    };
  }
}