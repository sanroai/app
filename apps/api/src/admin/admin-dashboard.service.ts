import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SystemInstitutionService } from '../common/security/system-institution.service';

export type DashboardRange = 'today' | '7d' | '30d' | 'month';

const DAY_MS = 86400000;
const EXPIRING_SOON_DAYS = 30;

type SubWithPlan = Prisma.SubscriptionGetPayload<{ include: { plan: true } }>;

export interface AttentionItem {
  id: string;
  name: string;
  type: string;
  status: string;
}

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemInstitution: SystemInstitutionService,
  ) {}

  private sinceFor(range: DashboardRange): Date {
    const now = new Date();
    switch (range) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case '7d':
        return new Date(now.getTime() - 7 * DAY_MS);
      case '30d':
        return new Date(now.getTime() - 30 * DAY_MS);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return now;
    }
  }

  private effectiveSeatLimit(
    inst: { seatLimit: number | null },
    subs: SubWithPlan[],
  ): number | null {
    const active = subs.find((s) => s.status === 'ACTIVE' || s.status === 'TRIAL');
    return active?.seatLimit ?? inst.seatLimit ?? active?.plan?.perSeat ?? null;
  }

  private subscriptionStatus(latest: SubWithPlan | null, count: number): string {
    if (count === 0 || !latest) return 'NONE';
    if (
      (latest.status === 'ACTIVE' || latest.status === 'TRIAL') &&
      latest.endsAt &&
      latest.endsAt.getTime() < Date.now()
    ) {
      return 'EXPIRED';
    }
    return latest.status;
  }

  private attentionLabels(
    inst: { status: string; seatLimit: number | null },
    subs: SubWithPlan[],
    studentCount: number,
  ): string[] {
    const labels: string[] = [];
    const now = Date.now();
    const expiring = subs.some(
      (s) =>
        (s.status === 'ACTIVE' || s.status === 'TRIAL') &&
        s.endsAt !== null &&
        s.endsAt.getTime() >= now &&
        s.endsAt.getTime() <= now + EXPIRING_SOON_DAYS * DAY_MS,
    );
    if (expiring) labels.push('expiringSoon');
    if (inst.status === 'SUSPENDED') labels.push('suspended');
    if (inst.status === 'EXPIRED') labels.push('expired');
    const seatLimit = this.effectiveSeatLimit(inst, subs);
    if (seatLimit !== null && seatLimit > 0 && studentCount >= seatLimit) {
      labels.push('overSeatLimit');
    }
    if (subs.some((s) => s.status === 'PAST_DUE')) labels.push('pastDue');
    if ((inst.status === 'ACTIVE' || inst.status === 'PENDING') && subs.length === 0) {
      labels.push('noSubscription');
    }
    return labels;
  }

  private async boundUserIds(): Promise<Set<string>> {
    const [students, teachers, parents, members] = await Promise.all([
      this.prisma.student.findMany({
        where: { userId: { not: null }, institutionId: { not: null } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.teacher.findMany({
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.parent.findMany({
        where: { userId: { not: null }, institutionId: { not: null } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.institutionMember.findMany({
        select: { userId: true },
        distinct: ['userId'],
      }),
    ]);
    const ids = new Set<string>();
    for (const row of students) if (row.userId) ids.add(row.userId);
    for (const row of teachers) if (row.userId) ids.add(row.userId);
    for (const row of parents) if (row.userId) ids.add(row.userId);
    for (const row of members) if (row.userId) ids.add(row.userId);
    return ids;
  }

  async overview(range: DashboardRange) {
    const now = new Date();
    const since = this.sinceFor(range);
    const systemId = await this.systemInstitution.systemInstitutionId().catch(() => null);

    const [
      institutionTotal,
      institutionActive,
      institutionSuspended,
      systemCount,
      totalAttempts,
      conductedAttempts,
      gradedAttempts,
      activeStudents,
      newStudentsInRange,
      newUsersInRange,
      capacityAgg,
    ] = await Promise.all([
      this.prisma.institution.count(),
      this.prisma.institution.count({ where: { status: 'ACTIVE' } }),
      this.prisma.institution.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.institution.count({ where: { isSystemInstitution: true } }),
      this.prisma.assessmentAttempt.count(),
      this.prisma.assessmentAttempt.count({ where: { createdAt: { gte: since } } }),
      this.prisma.assessmentAttempt.count({
        where: { createdAt: { gte: since }, score: { not: null } },
      }),
      this.prisma.student.count({ where: { status: 'ACTIVE', institutionId: { not: null } } }),
      this.prisma.student.count({
        where: { institutionId: { not: null }, createdAt: { gte: since } },
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: since },
          OR: [
            { student: { is: { institutionId: { not: null } } } },
            { parent: { is: { institutionId: { not: null } } } },
            { teacher: { isNot: null } },
            { memberships: { some: {} } },
          ],
        },
      }),
      this.prisma.institution.aggregate({
        where: { status: 'ACTIVE', isSystemInstitution: false, seatLimit: { not: null } },
        _sum: { seatLimit: true },
      }),
    ]);

    const [boundIds, expiringSubs] = await Promise.all([
      this.boundUserIds(),
      this.prisma.subscription.findMany({
        where: {
          status: { in: ['ACTIVE', 'TRIAL'] },
          endsAt: { gte: now, lte: new Date(now.getTime() + EXPIRING_SOON_DAYS * DAY_MS) },
        },
        select: { institutionId: true },
        distinct: ['institutionId'],
      }),
    ]);

    const expiringSoon = expiringSubs.filter(
      (s) => s.institutionId !== null && s.institutionId !== systemId,
    ).length;

    const seatsUsed = activeStudents;
    const seatsCapacity = capacityAgg._sum.seatLimit ?? 0;
    const utilizationPct = seatsCapacity > 0 ? Math.round((seatsUsed / seatsCapacity) * 100) : 0;

    return {
      range,
      generatedAt: now.toISOString(),
      institutions: {
        total: institutionTotal,
        active: institutionActive,
        suspended: institutionSuspended,
        expiringSoon,
        systemCount,
      },
      users: {
        total: boundIds.size,
        newInRange: newUsersInRange,
      },
      students: {
        active: activeStudents,
        newInRange: newStudentsInRange,
      },
      assessments: {
        total: totalAttempts,
        conductedInRange: conductedAttempts,
        gradedInRange: gradedAttempts,
      },
      seats: {
        used: seatsUsed,
        capacity: seatsCapacity,
        utilizationPct,
      },
    };
  }

  async health(range: DashboardRange, includeSystem: boolean) {
    const rows = await this.prisma.institution.findMany({
      where: includeSystem ? {} : { isSystemInstitution: false },
      orderBy: { lastActivityAt: 'desc' },
      include: {
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 5, include: { plan: true } },
        _count: {
          select: { members: true, students: true, teachers: true, parents: true },
        },
      },
    });

    return {
      range,
      generatedAt: new Date().toISOString(),
      rows: rows.map((inst) => {
        const subs = inst.subscriptions as unknown as SubWithPlan[];
        const active = subs.find((s) => s.status === 'ACTIVE' || s.status === 'TRIAL');
        const latest = subs[0] ?? null;
        const picked = active ?? latest;
        const seatLimit = this.effectiveSeatLimit(inst, subs);
        return {
          id: inst.id,
          name: inst.name,
          type: inst.type,
          status: inst.status,
          isSystemInstitution: inst.isSystemInstitution,
          memberCount: inst._count.members,
          studentCount: inst._count.students,
          teacherCount: inst._count.teachers,
          parentCount: inst._count.parents,
          seatLimit,
          seatsUsed: inst._count.students,
          planKey: picked?.plan.key ?? null,
          planName: picked?.plan.name ?? null,
          subscriptionStatus: this.subscriptionStatus(latest, subs.length),
          nextRenewalAt: picked?.endsAt ? picked.endsAt.toISOString() : null,
          lastActivityAt: inst.lastActivityAt.toISOString(),
          attention: this.attentionLabels(inst, subs, inst._count.students),
        };
      }),
    };
  }

  async attention() {
    const rows = await this.prisma.institution.findMany({
      where: { isSystemInstitution: false },
      include: {
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 5, include: { plan: true } },
        _count: { select: { students: true } },
      },
    });

    const expiringSoon: AttentionItem[] = [];
    const suspended: AttentionItem[] = [];
    const expired: AttentionItem[] = [];
    const overSeatLimit: AttentionItem[] = [];
    const pastDue: AttentionItem[] = [];
    const noSubscription: AttentionItem[] = [];

    for (const inst of rows) {
      const subs = inst.subscriptions as unknown as SubWithPlan[];
      const labels = this.attentionLabels(inst, subs, inst._count.students);
      const item: AttentionItem = { id: inst.id, name: inst.name, type: inst.type, status: inst.status };
      if (labels.includes('expiringSoon')) expiringSoon.push(item);
      if (labels.includes('suspended')) suspended.push(item);
      if (labels.includes('expired')) expired.push(item);
      if (labels.includes('overSeatLimit')) overSeatLimit.push(item);
      if (labels.includes('pastDue')) pastDue.push(item);
      if (labels.includes('noSubscription')) noSubscription.push(item);
    }

    return { expiringSoon, suspended, expired, overSeatLimit, pastDue, noSubscription };
  }

  async activity(range: DashboardRange, limit: number) {
    const since = this.sinceFor(range);
    const rows = await this.prisma.auditLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { email: true, name: true } },
        institution: { select: { name: true } },
      },
    });

    return {
      generatedAt: new Date().toISOString(),
      items: rows.map((r) => ({
        id: r.id,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        actorEmail: r.user.email ?? r.user.name ?? null,
        actorName: r.user.name ?? null,
        institutionId: r.institutionId,
        institutionName: r.institution?.name ?? null,
        createdAt: r.createdAt.toISOString(),
        metadata: (r.metadata ?? {}) as Record<string, unknown>,
      })),
    };
  }
}