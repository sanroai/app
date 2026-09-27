import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { $Enums } from '@prisma/client';
import { MasteryLevel } from '@sanro/types';
import { isWeakLevel } from '../diagnosis/mastery.service';
import { snapshotQuestions } from '../assessments/assessment.snapshot';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { NotificationsService } from '../common/services/audit-notifications.service';
import { StudentIdentityService } from '../common/services/student-identity.service';

@Injectable()
export class RemediationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly notifications: NotificationsService,
    private readonly identity: StudentIdentityService,
  ) {}

  private async studentBelongs(institutionId: string, studentId: string): Promise<void> {
    const student = await this.prisma.student.findFirst({ where: { id: studentId, institutionId } });
    if (!student) throw new NotFoundException('Student not found');
  }

  /**
   * Creates remediation plans for weak concepts detected after an assessment.
   * Items are built from approved content for the concept, plus a practice task.
   */
  async createPlans(studentId: string, weakConcepts: Array<{ conceptId: string }>, createdById?: string) {
    for (const w of weakConcepts) {
      const existing = await this.prisma.remediationPlan.findFirst({
        where: { studentId, conceptId: w.conceptId, status: 'ACTIVE' },
      });
      if (existing) continue;

      const content = await this.prisma.contentItem.findMany({
        where: { conceptId: w.conceptId, status: 'APPROVED' },
        orderBy: { createdAt: 'asc' },
        take: 4,
      });
      const practiceQuestions = await this.prisma.question.findMany({
        where: { conceptId: w.conceptId, status: 'APPROVED' },
        take: 5,
      });

      const plan = await this.prisma.remediationPlan.create({
        data: {
          studentId,
          conceptId: w.conceptId,
          status: 'ACTIVE',
          createdById: createdById ?? null,
          items: {
            create: [
              ...content.map((c, i) => ({
                order: i,
                contentType: c.type,
                contentId: c.id,
                title: `Watch/Read: ${c.title}`,
                status: 'PENDING' as $Enums.RemediationItemStatus,
              })),
              {
                order: content.length,
                contentType: 'PRACTICE_SET' as $Enums.ContentType,
                contentId: null,
                title: 'Practice weak concepts (Q&A)',
                status: 'PENDING' as $Enums.RemediationItemStatus,
              },
            ],
          },
        },
        include: { items: true },
      });

      const student = await this.prisma.student.findUnique({ where: { id: studentId }, select: { userId: true } });
      await this.notifications.create({
        recipientUserId: student?.userId ?? '',
        type: 'REMEDIATION_ASSIGNED',
        title: 'Remediation plan assigned',
        body: 'You have a new learning plan. Focus on strengthening this concept.',
        entityType: 'RemediationPlan',
        entityId: plan.id,
      });
    }
  }

  async listForStudent(user: RequestUser) {
    const student = await this.identity.requireForUser(user);
    const plans = await this.prisma.remediationPlan.findMany({
      where: { studentId: student.id },
      include: {
        concept: true,
        items: { orderBy: { order: 'asc' } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return plans.map((p) => {
      const completed = p.items.filter((i) => i.status === 'COMPLETED').length;
      const total = p.items.length || 1;
      return { ...p, progress: Math.round((completed / total) * 100), completedItems: completed };
    });
  }

  async listForTeacher(user: RequestUser, studentId?: string) {
    const institutionId = this.tenant.requireInstitution(user);
    if (user.role === 'STUDENT' || user.role === 'PARENT') throw new ForbiddenException('Not allowed');
    if (studentId) await this.studentBelongs(institutionId, studentId);
    const where = studentId ? { studentId } : { student: { institutionId } };
    return this.prisma.remediationPlan.findMany({
      where,
      include: {
        concept: true,
        student: { select: { id: true, name: true, rollNumber: true } },
        items: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateItemStatus(user: RequestUser, itemId: string, status: 'COMPLETED' | 'SKIPPED') {
    const item = await this.prisma.remediationItem.findUnique({ where: { id: itemId }, include: { plan: true } });
    if (!item) throw new NotFoundException('Item not found');

    const isStudentOwner =
      user.role === 'STUDENT' &&
      (await this.prisma.student.findFirst({ where: { id: item.plan.studentId, userId: user.sub } }));
    if (!isStudentOwner && user.role !== 'INSTITUTION_ADMIN' && user.role !== 'TEACHER') {
      throw new ForbiddenException('Not allowed');
    }

    await this.prisma.remediationItem.update({
      where: { id: itemId },
      data: { status, completedAt: status === 'COMPLETED' ? new Date() : null },
    });

    const items = await this.prisma.remediationItem.findMany({ where: { planId: item.planId } });
    const allDone = items.every((i) => i.status === 'COMPLETED' || i.status === 'SKIPPED');
    if (allDone && item.plan.status === 'ACTIVE') {
      await this.prisma.remediationPlan.update({
        where: { id: item.planId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }
    return { ok: true };
  }

  async createRetest(user: RequestUser, requestedStudentId: string | undefined, conceptIds: string[]) {
    const institutionId = this.tenant.requireInstitution(user);
    if (user.role === 'PARENT') throw new ForbiddenException('Not allowed');

    let studentId = requestedStudentId;
    if (user.role === 'STUDENT') {
      const self = await this.identity.resolveForUser(user);
      if (!self) throw new ForbiddenException('Not allowed');
      if (studentId && studentId !== self.id) {
        throw new ForbiddenException('You can only request a retest for yourself');
      }
      studentId = self.id;
    } else {
      if (!studentId) throw new BadRequestException('studentId is required');
      await this.studentBelongs(institutionId, studentId);
    }

    if (conceptIds.length === 0) throw new BadRequestException('Select at least one concept to retest');

    const questions = await this.prisma.question.findMany({
      where: { status: 'APPROVED', OR: [{ institutionId: null }, { institutionId }], conceptId: { in: conceptIds } },
      include: { options: { orderBy: { order: 'asc' } } },
      take: 10,
    });
    if (questions.length === 0) throw new BadRequestException('No questions available for the selected concepts');

    const subjectId = questions[0].subjectId;
    const assessment = await this.prisma.assessment.create({
      data: {
        institutionId,
        title: 'Retest',
        subjectId,
        totalMarks: questions.reduce((a, q) => a + (q.marks ?? 1), 0),
        durationMinutes: 30,
        status: 'PUBLISHED',
        attemptsAllowed: 1,
        createdById: user.sub,
      },
    });
    await snapshotQuestions(
      this.prisma,
      assessment.id,
      questions.map((q) => ({ ...q, marks: q.marks ?? 1 })),
    );
    await this.prisma.assessmentAssignment.create({
      data: { assessmentId: assessment.id, studentId },
    });

    if (user.role !== 'STUDENT') {
      const studentUser = await this.prisma.student.findUnique({
        where: { id: studentId },
        select: { userId: true },
      });
      await this.notifications.create({
        recipientUserId: studentUser?.userId ?? '',
        type: 'RETEST_AVAILABLE',
        title: 'Retest available',
        body: 'A retest for your weak areas is now available. Give it your best!',
        entityType: 'Assessment',
        entityId: assessment.id,
      });
    }

    return { id: assessment.id, title: assessment.title };
  }

  async detectWeakConcepts(user: RequestUser, studentId: string) {
    const institutionId = this.tenant.requireInstitution(user);
    await this.studentBelongs(institutionId, studentId);
    const latests = await this.prisma.diagnosticResult.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const latestPerConcept = new Map<string, { score: number; level: string; conceptId: string }>();
    for (const r of latests) {
      if (!latestPerConcept.has(r.conceptId)) latestPerConcept.set(r.conceptId, r);
    }
    const weak = [...latestPerConcept.values()].filter((r) => isWeakLevel(r.level as MasteryLevel));
    const concepts = await this.prisma.concept.findMany({
      where: { id: { in: weak.map((w) => w.conceptId) } },
      select: { id: true, name: true, topicId: true },
    });
    return concepts.map((c) => {
      const w = latestPerConcept.get(c.id);
      return { ...c, score: w?.score ?? 0, level: w?.level ?? MasteryLevel.INSUFFICIENT_EVIDENCE, weak: true };
    });
  }
}