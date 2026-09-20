import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InstitutionType, Role } from '@sanro/types';
import * as bcrypt from 'bcryptjs';
import { $Enums, Prisma } from '@prisma/client';
import { SUBSCRIPTION } from '@sanro/config';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionAccessService } from '../common/security/subscription-access.service';
import { toCsv } from '../reports/csv';

type DbClient = PrismaService | Prisma.TransactionClient;

type SubscriptionWithPlan = Prisma.SubscriptionGetPayload<{ include: { plan: true } }>;

const DAY_MS = 86400000;

export interface InstitutionStats {
  id: string;
  name: string;
  type: InstitutionType;
  status: $Enums.InstitutionStatusEnum;
  code: string | null;
  city: string | null;
  state: string | null;
  primaryPhone: string | null;
  primaryEmail: string | null;
  seatLimit: number | null;
  billableUsers: number;
  usagePct: number;
  limitExceeded: boolean;
  createdAt: Date;
  lastActivityAt: Date;
  archivedAt: Date | null;
  suspendedAt: Date | null;
  expiredAt: Date | null;
  primaryAdmin: { id: string; name: string; email: string } | null;
  subscription: ReturnType<AdminService['toSubscriptionView']> | null;
  subscriptionStatus: string;
  planKey: string | null;
  gracePeriodDays: number;
  counts: {
    students: number;
    teachers: number;
    parents: number;
    groups: number;
    assessments: number;
    papers: number;
    questions: number;
    members: number;
    admins: number;
  };
}

interface ListFilters {
  search?: string;
  type?: string;
  status?: string;
  subscriptionStatus?: string;
  plan?: string;
  limitExceeded?: boolean;
  from?: string;
  to?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionAccess: SubscriptionAccessService,
  ) {}

  private requireSuperAdmin(user: RequestUser): void {
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Super admin access only');
  }

  private async writeAudit(
    tx: DbClient,
    user: RequestUser,
    data: {
      action: $Enums.AuditAction;
      institutionId?: string | null;
      entityType?: string;
      entityId?: string | null;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    await tx.auditLog.create({
      data: {
        action: data.action,
        userId: user.sub,
        institutionId: data.institutionId ?? null,
        entityType: data.entityType ?? 'INSTITUTION',
        entityId: data.entityId ?? null,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  private async writeHistory(
    tx: DbClient,
    user: RequestUser,
    data: {
      institutionId: string;
      subscriptionId?: string | null;
      action: $Enums.SubscriptionHistoryAction;
      oldPlanId?: string | null;
      newPlanId?: string | null;
      oldStatus?: $Enums.SubscriptionStatus | null;
      newStatus?: $Enums.SubscriptionStatus | null;
      oldSeatLimit?: number | null;
      newSeatLimit?: number | null;
      oldStartsAt?: Date | null;
      oldEndsAt?: Date | null;
      newStartsAt?: Date | null;
      newEndsAt?: Date | null;
      reason?: string | null;
    },
  ): Promise<void> {
    await tx.subscriptionHistory.create({
      data: {
        institutionId: data.institutionId,
        subscriptionId: data.subscriptionId ?? null,
        action: data.action,
        changedById: user.sub,
        oldPlanId: data.oldPlanId ?? null,
        newPlanId: data.newPlanId ?? null,
        oldStatus: data.oldStatus ?? null,
        newStatus: data.newStatus ?? null,
        oldSeatLimit: data.oldSeatLimit ?? null,
        newSeatLimit: data.newSeatLimit ?? null,
        oldStartsAt: data.oldStartsAt ?? null,
        oldEndsAt: data.oldEndsAt ?? null,
        newStartsAt: data.newStartsAt ?? null,
        newEndsAt: data.newEndsAt ?? null,
        reason: data.reason ?? null,
      },
    });
  }

  private normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  toSubscriptionView(sub: SubscriptionWithPlan) {
    const now = Date.now();
    const expired =
      !!sub.endsAt && sub.endsAt.getTime() < now && (sub.status === 'ACTIVE' || sub.status === 'TRIAL');
    const daysRemaining = sub.endsAt ? Math.floor((sub.endsAt.getTime() - now) / DAY_MS) : null;
    const status = expired ? 'EXPIRED' : sub.status;
    return {
      id: sub.id,
      institutionId: sub.institutionId,
      planId: sub.planId,
      status,
      startedAt: sub.startedAt.toISOString(),
      endsAt: sub.endsAt ? sub.endsAt.toISOString() : null,
      seatLimit: sub.seatLimit,
      plan: {
        id: sub.plan.id,
        key: sub.plan.key,
        name: sub.plan.name,
        priceMonthly: sub.plan.priceMonthly,
        priceYearly: sub.plan.priceYearly,
        perSeat: sub.plan.perSeat,
        active: sub.plan.active,
      },
      daysRemaining,
      expiringSoon: !expired && daysRemaining != null && daysRemaining <= SUBSCRIPTION.EXPIRING_SOON_DAYS,
      expired,
    };
  }

  private seatLimitFor(inst: { seatLimit: number | null }, subs: SubscriptionWithPlan[]): number {
    const active = subs.find((s) => s.status === 'ACTIVE' || s.status === 'TRIAL') ?? subs[0];
    return (
      active?.seatLimit ??
      inst.seatLimit ??
      active?.plan?.perSeat ??
      SUBSCRIPTION.TRIAL_SEAT_LIMIT
    );
  }

  private effectiveSubscriptionStatus(
    subCount: number,
    subs: SubscriptionWithPlan[],
    now: number,
  ): string {
    if (subCount === 0) return 'NONE';
    const latest = subs[0];
    if (!latest) return 'NONE';
    const ended =
      !!latest.endsAt &&
      latest.endsAt.getTime() < now &&
      (latest.status === 'ACTIVE' || latest.status === 'TRIAL');
    if (ended) return 'EXPIRED';
    if (latest.status === 'ACTIVE' || latest.status === 'TRIAL') {
      const days = latest.endsAt ? Math.ceil((latest.endsAt.getTime() - now) / DAY_MS) : null;
      if (days != null && days <= SUBSCRIPTION.EXPIRING_SOON_DAYS) return 'EXPIRING_SOON';
      return latest.status;
    }
    return latest.status;
  }

  private async countBillableByIds(ids: string[]): Promise<Map<string, number>> {
    const [students, teachers, parents, admins] = await Promise.all([
      this.prisma.student.groupBy({
        by: ['institutionId'],
        where: { institutionId: { in: ids }, status: 'ACTIVE' },
        _count: { _all: true },
      }),
      this.prisma.teacher.groupBy({
        by: ['institutionId'],
        where: { institutionId: { in: ids }, status: 'ACTIVE' },
        _count: { _all: true },
      }),
      this.prisma.parent.groupBy({
        by: ['institutionId'],
        where: { institutionId: { in: ids } },
        _count: { _all: true },
      }),
      this.prisma.institutionMember.groupBy({
        by: ['institutionId'],
        where: { institutionId: { in: ids }, status: 'ACTIVE', role: 'INSTITUTION_ADMIN' },
        _count: { _all: true },
      }),
    ]);
    const map = new Map<string, number>();
    for (const g of students) map.set(g.institutionId, (map.get(g.institutionId) ?? 0) + g._count._all);
    for (const g of teachers) map.set(g.institutionId, (map.get(g.institutionId) ?? 0) + g._count._all);
    for (const g of parents) map.set(g.institutionId, (map.get(g.institutionId) ?? 0) + g._count._all);
    for (const g of admins) map.set(g.institutionId, (map.get(g.institutionId) ?? 0) + g._count._all);
    return map;
  }

  private async latestAuditByIds(ids: string[]): Promise<Map<string, Date>> {
    const rows = await this.prisma.auditLog.groupBy({
      by: ['institutionId'],
      where: { institutionId: { in: ids } },
      _max: { createdAt: true },
    });
    const map = new Map<string, Date>();
    for (const r of rows) {
      if (r.institutionId) map.set(r.institutionId, r._max.createdAt ?? new Date(0));
    }
    return map;
  }

  private async subscriptionCountsByIds(ids: string[]): Promise<Map<string, number>> {
    const rows = await this.prisma.subscription.groupBy({
      by: ['institutionId'],
      where: { institutionId: { in: ids } },
      _count: { _all: true },
    });
    return new Map(rows.map((r) => [r.institutionId, r._count._all]));
  }

  private cleanListFilters(f: ListFilters): ListFilters {
    return {
      search: f.search?.trim() || undefined,
      type: f.type,
      status: f.status,
      subscriptionStatus: f.subscriptionStatus,
      plan: f.plan,
      limitExceeded: f.limitExceeded,
      from: f.from,
      to: f.to,
      sortBy: f.sortBy ?? 'createdAt',
      sortDir: f.sortDir ?? 'desc',
    };
  }

  // ---------- Institutions (tenants) ----------

  async listInstitutions(user: RequestUser, raw: ListFilters & { page?: number; pageSize?: number }): Promise<{
    total: number;
    page: number;
    pageSize: number;
    items: InstitutionStats[];
  }> {
    this.requireSuperAdmin(user);
    const f = this.cleanListFilters(raw);
    const page = raw.page ?? 1;
    const pageSize = Math.min(100, Math.max(1, raw.pageSize ?? 20));
    const now = Date.now();

    const where: Prisma.InstitutionWhereInput = {};
    if (f.search) {
      where.OR = [
        { name: { contains: f.search, mode: 'insensitive' } },
        { code: { contains: f.search, mode: 'insensitive' } },
        { primaryEmail: { contains: f.search, mode: 'insensitive' } },
        { members: { some: { user: { email: { contains: f.search, mode: 'insensitive' } } } } },
      ];
    }
    if (f.type) where.type = f.type as $Enums.InstitutionType;
    if (f.status) where.status = f.status as $Enums.InstitutionStatusEnum;
    if (f.plan) {
      where.subscriptions = { some: { plan: { key: f.plan as $Enums.SubscriptionPlanKey } } };
    }
    if (f.from || f.to) {
      where.createdAt = {
        ...(f.from ? { gte: new Date(f.from) } : {}),
        ...(f.to ? { lte: new Date(f.to) } : {}),
      };
    }

    const rows = await this.prisma.institution.findMany({
      where,
      include: {
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 5, include: { plan: true } },
        members: {
          where: { role: 'INSTITUTION_ADMIN', status: 'ACTIVE' },
          orderBy: { joinedAt: 'asc' },
          take: 1,
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: {
          select: {
            students: true,
            teachers: true,
            groups: true,
            assessments: true,
            papers: true,
            questions: true,
            parents: true,
            members: true,
          },
        },
      },
    });

    const ids = rows.map((r) => r.id);
    const [billableMap, auditMap, subCounts] = await Promise.all([
      this.countBillableByIds(ids),
      this.latestAuditByIds(ids),
      this.subscriptionCountsByIds(ids),
    ]);

    const items = rows.map<InstitutionStats>((inst) => {
      const subs = inst.subscriptions as SubscriptionWithPlan[];
      const sub = subs.find((s) => s.status === 'ACTIVE' || s.status === 'TRIAL') ?? subs[0] ?? null;
      const billableUsers = billableMap.get(inst.id) ?? 0;
      const seatLimit = this.seatLimitFor(inst, subs);
      const usagePct = seatLimit > 0 ? Math.round((billableUsers / seatLimit) * 100) : 0;
      const limitExceeded = billableUsers > seatLimit;
      const lastActivity = new Date(
        Math.max(
          inst.lastActivityAt.getTime(),
          auditMap.get(inst.id)?.getTime() ?? inst.lastActivityAt.getTime(),
        ),
      );
      const primaryAdmin = inst.members[0]?.user
        ? { id: inst.members[0].user.id, name: inst.members[0].user.name, email: inst.members[0].user.email }
        : null;
      return {
        id: inst.id,
        name: inst.name,
        type: inst.type,
        status: inst.status,
        code: inst.code,
        city: inst.city,
        state: inst.state,
        primaryPhone: inst.primaryPhone,
        primaryEmail: inst.primaryEmail,
        seatLimit,
        billableUsers,
        usagePct,
        limitExceeded,
        createdAt: inst.createdAt,
        lastActivityAt: lastActivity,
        archivedAt: inst.archivedAt,
        suspendedAt: inst.suspendedAt,
        expiredAt: inst.expiredAt,
        primaryAdmin,
        subscription: sub ? this.toSubscriptionView(sub) : null,
        subscriptionStatus: this.effectiveSubscriptionStatus(subCounts.get(inst.id) ?? 0, subs, now),
        planKey: sub?.plan?.key ?? null,
        gracePeriodDays: inst.gracePeriodDays,
        counts: {
          students: inst._count.students,
          teachers: inst._count.teachers,
          groups: inst._count.groups,
          assessments: inst._count.assessments,
          papers: inst._count.papers,
          questions: inst._count.questions,
          parents: inst._count.parents,
          members: inst._count.members,
          admins: inst.members.length,
        },
      };
    });

    let filtered = items;
    if (f.subscriptionStatus) {
      filtered = filtered.filter((i) => i.subscriptionStatus === f.subscriptionStatus);
    }
    if (f.limitExceeded !== undefined) {
      filtered = filtered.filter((i) => i.limitExceeded === f.limitExceeded);
    }

    const sortDir = (f.sortDir ?? 'desc') === 'asc' ? 1 : -1;
    const extract = (i: InstitutionStats): string | number | Date | null => {
      switch (f.sortBy ?? 'createdAt') {
        case 'name':
          return i.name;
        case 'createdAt':
          return i.createdAt.getTime();
        case 'expiry':
          return i.subscription?.endsAt ? new Date(i.subscription.endsAt).getTime() : null;
        case 'users':
          return i.billableUsers;
        case 'limit':
          return i.seatLimit ?? null;
        case 'activity':
          return i.lastActivityAt.getTime();
        case 'type':
          return i.type;
        case 'status':
          return i.status;
        default:
          return i.createdAt.getTime();
      }
    };
    filtered.sort((a, b) => {
      const av = extract(a);
      const bv = extract(b);
      if (av == null && bv == null) return a.id < b.id ? -1 : 1;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av === bv) return a.id < b.id ? -1 : 1;
      if (typeof av === 'string' || typeof bv === 'string') {
        return String(av).localeCompare(String(bv)) * sortDir;
      }
      return ((av as number) - (bv as number)) * sortDir;
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    return {
      total,
      page,
      pageSize,
      items: filtered.slice(start, start + pageSize),
    };
  }

  async getInstitution(user: RequestUser, id: string) {
    this.requireSuperAdmin(user);
    const inst = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 5, include: { plan: true } },
        members: {
          where: { role: 'INSTITUTION_ADMIN' },
          orderBy: { joinedAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, lastLoginAt: true } },
          },
        },
        _count: {
          select: {
            students: true,
            teachers: true,
            groups: true,
            assessments: true,
            papers: true,
            questions: true,
            parents: true,
            members: true,
          },
        },
      },
    });
    if (!inst) throw new NotFoundException('Institution not found');

    const [auditRows, historyRows, planIds] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { institutionId: id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { name: true, email: true } } },
      }),
      this.prisma.subscriptionHistory.findMany({
        where: { institutionId: id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { changedBy: { select: { name: true, email: true } } },
      }),
      this.prisma.subscriptionHistory.findMany({
        where: { institutionId: id },
        select: { oldPlanId: true, newPlanId: true },
        take: 5,
      }),
    ]);

    const planIdSet = new Set<string>();
    for (const h of planIds) {
      if (h.oldPlanId) planIdSet.add(h.oldPlanId);
      if (h.newPlanId) planIdSet.add(h.newPlanId);
    }
    const plans = await this.prisma.plan.findMany({ where: { id: { in: [...planIdSet] } } });
    const planById = new Map(plans.map((p) => [p.id, p]));

    const subsection = inst.subscriptions as SubscriptionWithPlan[];
    const sub = subsection.find((s) => s.status === 'ACTIVE' || s.status === 'TRIAL') ?? subsection[0] ?? null;
    const billableUsers = await this.subscriptionAccess.countBillableUsers(id);
    const seatLimit = this.seatLimitFor(inst, subsection);
    const usagePct = seatLimit > 0 ? Math.round((billableUsers / seatLimit) * 100) : 0;
    const limitExceeded = billableUsers > seatLimit;
    const lastAudit = auditRows[0]?.createdAt ?? null;
    const lastActivityAt = lastAudit
      ? new Date(Math.max(inst.lastActivityAt.getTime(), lastAudit.getTime()))
      : inst.lastActivityAt;

    return {
      id: inst.id,
      name: inst.name,
      type: inst.type,
      status: inst.status,
      code: inst.code,
      city: inst.city,
      state: inst.state,
      primaryPhone: inst.primaryPhone,
      primaryEmail: inst.primaryEmail,
      description: inst.description,
      address: inst.address,
      country: inst.country,
      website: inst.website,
      contactPerson: inst.contactPerson,
      gracePeriodDays: inst.gracePeriodDays,
      seatLimit,
      billableUsers,
      usagePct,
      limitExceeded,
      planKey: sub?.plan?.key ?? null,
      primaryAdmin:
        inst.members.find((m) => m.user) ? { id: inst.members[0].user.id, name: inst.members[0].user.name, email: inst.members[0].user.email } : null,
      subscription: sub ? this.toSubscriptionView(sub) : null,
      subscriptionStatus: this.effectiveSubscriptionStatus(
        subsection.length,
        subsection,
        Date.now(),
      ),
      createdAt: inst.createdAt,
      lastActivityAt,
      archivedAt: inst.archivedAt,
      suspendedAt: inst.suspendedAt,
      expiredAt: inst.expiredAt,
      admins: inst.members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        phone: m.user.phone,
        status: m.status,
        lastLoginAt: m.user.lastLoginAt ? m.user.lastLoginAt.toISOString() : null,
      })),
      counts: {
        students: inst._count.students,
        teachers: inst._count.teachers,
        parents: inst._count.parents,
        groups: inst._count.groups,
        assessments: inst._count.assessments,
        papers: inst._count.papers,
        questions: inst._count.questions,
        members: inst._count.members,
        admins: inst.members.length,
      },
      subscriptionHistory: historyRows.map((h) => ({
        id: h.id,
        action: h.action,
        institutionId: h.institutionId,
        subscriptionId: h.subscriptionId,
        changedById: h.changedById,
        changedBy: h.changedBy
          ? { name: h.changedBy.name, email: h.changedBy.email }
          : null,
        oldPlan: h.oldPlanId ? planById.get(h.oldPlanId) ?? null : null,
        newPlan: h.newPlanId ? planById.get(h.newPlanId) ?? null : null,
        oldStatus: h.oldStatus,
        newStatus: h.newStatus,
        oldSeatLimit: h.oldSeatLimit,
        newSeatLimit: h.newSeatLimit,
        oldStartsAt: h.oldStartsAt ? h.oldStartsAt.toISOString() : null,
        oldEndsAt: h.oldEndsAt ? h.oldEndsAt.toISOString() : null,
        newStartsAt: h.newStartsAt ? h.newStartsAt.toISOString() : null,
        newEndsAt: h.newEndsAt ? h.newEndsAt.toISOString() : null,
        reason: h.reason,
        createdAt: h.createdAt.toISOString(),
      })),
      recentAudit: auditRows.map((r) => ({
        id: r.id,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        metadata: r.metadata as Record<string, unknown>,
        createdAt: r.createdAt.toISOString(),
        user: r.user ? { name: r.user.name, email: r.user.email } : null,
      })),
    };
  }

  async createInstitution(
    user: RequestUser,
    data: {
      name: string;
      type: string;
      code?: string;
      description?: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      website?: string;
      contactPerson?: string;
      primaryPhone?: string;
      primaryEmail?: string;
      seatLimit?: number;
      gracePeriodDays?: number;
      adminName?: string;
      adminEmail?: string;
      adminPhone?: string;
      adminPassword?: string;
      assignUserId?: string;
      status?: string;
      planKey?: string;
      startsAt?: string;
      endsAt?: string;
    },
  ) {
    this.requireSuperAdmin(user);
    const normalizedName = this.normalizeName(data.name);

    if (data.code) {
      const existingCode = await this.prisma.institution.findUnique({
        where: { code: data.code },
        select: { id: true },
      });
      if (existingCode) {
        throw new ConflictException({
          code: 'DUPLICATE_INSTITUTION',
          message: `Institution code "${data.code}" is already in use`,
        });
      }
    }

    const sameName = await this.prisma.institution.findFirst({
      where: { name: { mode: 'insensitive', equals: normalizedName } },
      select: { id: true, name: true, primaryEmail: true },
    });
    let warning: string | undefined;
    if (sameName) {
      const sameAdminEmail =
        !!data.adminEmail &&
        (sameName.primaryEmail ?? '').toLowerCase() === data.adminEmail.toLowerCase();
      if (sameAdminEmail) {
        throw new ConflictException({
          code: 'DUPLICATE_INSTITUTION',
          message: `An institution with the name "${data.name}" and this admin email already exists`,
        });
      }
      warning = `Institution name may be a duplicate of "${sameName.name}" (${sameName.id})`;
    }

    const institution = await this.prisma.$transaction(async (tx) => {
      const inst = await tx.institution.create({
        data: {
          name: data.name,
          type: data.type as InstitutionType,
          code: data.code ?? this.normalizeName(data.name).slice(0, 3).toUpperCase(),
          description: data.description ?? null,
          address: data.address ?? null,
          city: data.city ?? null,
          state: data.state ?? null,
          country: data.country ?? null,
          website: data.website ?? null,
          contactPerson: data.contactPerson ?? null,
          primaryPhone: data.primaryPhone ?? null,
          primaryEmail: data.primaryEmail ?? data.adminEmail ?? null,
          seatLimit: data.seatLimit ?? null,
          gracePeriodDays: data.gracePeriodDays ?? SUBSCRIPTION.DEFAULT_GRACE_PERIOD_DAYS,
          status: 'ACTIVE',
          lastActivityAt: new Date(),
          createdById: user.sub,
        },
      });

      await this.writeAudit(tx, user, {
        action: 'INSTITUTION_CREATED',
        institutionId: inst.id,
        metadata: {
          name: inst.name,
          code: inst.code,
          type: inst.type,
          warning: warning ?? null,
          adminEmail: data.adminEmail ?? null,
        },
      });

      let adminMembershipUserId: string | null = null;
      if (data.assignUserId) {
        const assignee = await tx.user.findUnique({ where: { id: data.assignUserId } });
        if (!assignee) throw new BadRequestException('assignUserId does not reference a known user');
        await tx.institutionMember.upsert({
          where: { institutionId_userId: { institutionId: inst.id, userId: assignee.id } },
          create: { institutionId: inst.id, userId: assignee.id, role: 'INSTITUTION_ADMIN', status: 'ACTIVE' },
          update: { role: 'INSTITUTION_ADMIN', status: 'ACTIVE' },
        });
        adminMembershipUserId = assignee.id;
      } else if (data.adminEmail) {
        const email = data.adminEmail.toLowerCase();
        let adminUser = await tx.user.findUnique({ where: { email } });
        if (!adminUser) {
          const passwordHash = data.adminPassword
            ? await bcrypt.hash(data.adminPassword, 10)
            : '';
          adminUser = await tx.user.create({
            data: {
              name: data.adminName ?? data.name,
              email,
              phone: data.adminPhone ?? null,
              passwordHash,
              isSuperAdmin: false,
            },
          });
        }
        await tx.institutionMember.upsert({
          where: { institutionId_userId: { institutionId: inst.id, userId: adminUser.id } },
          create: { institutionId: inst.id, userId: adminUser.id, role: 'INSTITUTION_ADMIN', status: 'ACTIVE' },
          update: { role: 'INSTITUTION_ADMIN', status: 'ACTIVE' },
        });
        adminMembershipUserId = adminUser.id;
      }

      const plan = data.planKey
        ? await tx.plan.findUnique({ where: { key: data.planKey as $Enums.SubscriptionPlanKey } })
        : await tx.plan.findUnique({ where: { key: 'INSTITUTION' } });
      if (!plan) throw new BadRequestException(`Unknown plan "${data.planKey ?? 'INSTITUTION'}"`);
      const status = (data.status ?? (data.planKey ? 'ACTIVE' : 'TRIAL')) as $Enums.SubscriptionStatus;
      const startsAt = data.startsAt ? new Date(data.startsAt) : new Date();
      const endsAt = data.endsAt
        ? new Date(data.endsAt)
        : status === 'ACTIVE'
          ? new Date(Date.now() + SUBSCRIPTION.RENEW_DURATION_DAYS * DAY_MS)
          : status === 'TRIAL'
            ? new Date(Date.now() + 30 * DAY_MS)
            : null;
      const sub = await tx.subscription.create({
        data: {
          institutionId: inst.id,
          planId: plan.id,
          status,
          startedAt: startsAt,
          endsAt,
          seatLimit: data.seatLimit ?? inst.seatLimit ?? plan.perSeat ?? SUBSCRIPTION.TRIAL_SEAT_LIMIT,
        },
      });

      await this.writeHistory(tx, user, {
        institutionId: inst.id,
        subscriptionId: sub.id,
        action: 'CREATED',
        newPlanId: plan.id,
        newStatus: status,
        newSeatLimit: sub.seatLimit,
        newStartsAt: startsAt,
        newEndsAt: endsAt,
      });
      await this.writeAudit(tx, user, {
        action: 'SUBSCRIPTION_CREATED',
        institutionId: inst.id,
        metadata: { planKey: plan.key, status, seatLimit: sub.seatLimit },
      });

      return { inst, adminMembershipUserId };
    });

    this.subscriptionAccess.invalidate(institution.inst.id);
    const detail = await this.getInstitution(user, institution.inst.id);
    return { institution: detail, ...(warning ? { warning } : {}) };
  }

  async updateInstitution(
    user: RequestUser,
    id: string,
    data: Record<string, unknown>,
  ): Promise<{ institution: Awaited<ReturnType<AdminService['getInstitution']>> }> {
    this.requireSuperAdmin(user);
    const existing = await this.prisma.institution.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Institution not found');

    if (data.code && data.code !== existing.code) {
      const dup = await this.prisma.institution.findUnique({ where: { code: data.code as string } });
      if (dup) {
        throw new ConflictException({
          code: 'DUPLICATE_INSTITUTION',
          message: `Institution code "${data.code}" is already in use`,
        });
      }
    }

    const patch: Prisma.InstitutionUpdateInput = {
      ...(data.name !== undefined ? { name: data.name as string } : {}),
      ...(data.type !== undefined ? { type: data.type as InstitutionType } : {}),
      ...(data.code !== undefined ? { code: data.code as string } : {}),
      ...(data.description !== undefined ? { description: data.description as string | null } : {}),
      ...(data.address !== undefined ? { address: data.address as string | null } : {}),
      ...(data.city !== undefined ? { city: data.city as string | null } : {}),
      ...(data.state !== undefined ? { state: data.state as string | null } : {}),
      ...(data.country !== undefined ? { country: data.country as string | null } : {}),
      ...(data.website !== undefined ? { website: data.website as string | null } : {}),
      ...(data.contactPerson !== undefined ? { contactPerson: data.contactPerson as string | null } : {}),
      ...(data.primaryPhone !== undefined ? { primaryPhone: data.primaryPhone as string | null } : {}),
      ...(data.primaryEmail !== undefined ? { primaryEmail: data.primaryEmail as string | null } : {}),
      ...(data.seatLimit !== undefined ? { seatLimit: data.seatLimit as number } : {}),
      ...(data.gracePeriodDays !== undefined ? { gracePeriodDays: data.gracePeriodDays as number } : {}),
      lastActivityAt: new Date(),
    };
    await this.prisma.$transaction(async (tx) => {
      await tx.institution.update({ where: { id }, data: patch });
      await this.writeAudit(tx, user, {
        action: 'INSTITUTION_UPDATED',
        institutionId: id,
        metadata: { ...patch, code: undefined },
      });
    });
    const detail = await this.getInstitution(user, id);
    return { institution: detail };
  }

  async updateStatus(
    user: RequestUser,
    id: string,
    data: { status: $Enums.InstitutionStatusEnum; reason?: string },
  ): Promise<{ institution: Awaited<ReturnType<AdminService['getInstitution']>> }> {
    this.requireSuperAdmin(user);
    const inst = await this.prisma.institution.findUnique({ where: { id } });
    if (!inst) throw new NotFoundException('Institution not found');
    const now = new Date();
    const reason = data.reason;

    const patch: Prisma.InstitutionUpdateInput = { status: data.status, lastActivityAt: now };
    const auditAction: $Enums.AuditAction = 'INSTITUTION_UPDATED';
    if (data.status === 'ACTIVE') {
      patch.suspendedAt = null;
      patch.expiredAt = null;
      patch.archivedAt = null;
      patch.deletedAt = null;
    }
    if (data.status === 'SUSPENDED') patch.suspendedAt = now;
    if (data.status === 'ARCHIVED') {
      patch.deletedAt = now;
      patch.archivedAt = now;
    }
    if (data.status === 'EXPIRED') patch.expiredAt = now;

    await this.prisma.$transaction(async (tx) => {
      await tx.institution.update({ where: { id }, data: patch });
      const historyAction = data.status === 'EXPIRED'
        ? 'EXPIRED'
        : data.status === 'SUSPENDED'
          ? 'SUSPENDED'
          : data.status === 'ACTIVE'
            ? 'ACTIVATED'
            : null;
      if (historyAction) {
        await this.writeHistory(tx, user, {
          institutionId: id,
          action: historyAction,
          newStatus: data.status as unknown as $Enums.SubscriptionStatus,
          reason,
        });
      }
      await this.writeAudit(tx, user, {
        action: auditAction,
        institutionId: id,
        metadata: { status: data.status, reason: reason ?? null },
      });
    });
    this.subscriptionAccess.invalidate(id);
    const detail = await this.getInstitution(user, id);
    return { institution: detail };
  }

  async activate(user: RequestUser, id: string, reason?: string) {
    this.requireSuperAdmin(user);
    const inst = await this.prisma.institution.findUnique({ where: { id } });
    if (!inst) throw new NotFoundException('Institution not found');
    await this.prisma.$transaction(async (tx) => {
      await tx.institution.update({
        where: { id },
        data: { status: 'ACTIVE', suspendedAt: null, expiredAt: null, archivedAt: null, deletedAt: null, lastActivityAt: new Date() },
      });
      await this.writeHistory(tx, user, { institutionId: id, action: 'ACTIVATED', newStatus: 'ACTIVE', reason });
      await this.writeAudit(tx, user, {
        action: 'INSTITUTION_ACTIVATED',
        institutionId: id,
        metadata: { reason: reason ?? null },
      });
    });
    this.subscriptionAccess.invalidate(id);
    return { institution: await this.getInstitution(user, id) };
  }

  async suspend(user: RequestUser, id: string, reason?: string) {
    this.requireSuperAdmin(user);
    const inst = await this.prisma.institution.findUnique({ where: { id } });
    if (!inst) throw new NotFoundException('Institution not found');
    await this.prisma.$transaction(async (tx) => {
      await tx.institution.update({
        where: { id },
        data: { status: 'SUSPENDED', suspendedAt: new Date(), lastActivityAt: new Date() },
      });
      await this.writeHistory(tx, user, { institutionId: id, action: 'SUSPENDED', newStatus: 'SUSPENDED', reason });
      await this.writeAudit(tx, user, {
        action: 'INSTITUTION_SUSPENDED',
        institutionId: id,
        metadata: { reason: reason ?? null },
      });
    });
    this.subscriptionAccess.invalidate(id);
    return { institution: await this.getInstitution(user, id) };
  }

  async archive(user: RequestUser, id: string, reason?: string) {
    this.requireSuperAdmin(user);
    const inst = await this.prisma.institution.findUnique({ where: { id } });
    if (!inst) throw new NotFoundException('Institution not found');
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.institution.update({
        where: { id },
        data: { status: 'ARCHIVED', deletedAt: now, archivedAt: now, lastActivityAt: now },
      });
      await this.writeAudit(tx, user, {
        action: 'INSTITUTION_ARCHIVED',
        institutionId: id,
        metadata: { reason: reason ?? null },
      });
    });
    this.subscriptionAccess.invalidate(id);
    return { institution: await this.getInstitution(user, id) };
  }

  async restore(user: RequestUser, id: string, reason?: string) {
    this.requireSuperAdmin(user);
    const inst = await this.prisma.institution.findUnique({ where: { id } });
    if (!inst) throw new NotFoundException('Institution not found');
    await this.prisma.$transaction(async (tx) => {
      await tx.institution.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          deletedAt: null,
          archivedAt: null,
          suspendedAt: null,
          expiredAt: null,
          lastActivityAt: new Date(),
        },
      });
      await this.writeAudit(tx, user, {
        action: 'INSTITUTION_RESTORED',
        institutionId: id,
        metadata: { reason: reason ?? null },
      });
    });
    this.subscriptionAccess.invalidate(id);
    return { institution: await this.getInstitution(user, id) };
  }

  async expire(user: RequestUser, id: string, reason?: string) {
    this.requireSuperAdmin(user);
    const inst = await this.prisma.institution.findUnique({ where: { id } });
    if (!inst) throw new NotFoundException('Institution not found');
    await this.prisma.$transaction(async (tx) => {
      await tx.institution.update({
        where: { id },
        data: { status: 'EXPIRED', expiredAt: new Date(), lastActivityAt: new Date() },
      });
      await this.writeHistory(tx, user, { institutionId: id, action: 'EXPIRED', newStatus: 'EXPIRED', reason });
      await this.writeAudit(tx, user, {
        action: 'INSTITUTION_EXPIRED',
        institutionId: id,
        metadata: { reason: reason ?? null },
      });
    });
    this.subscriptionAccess.invalidate(id);
    return { institution: await this.getInstitution(user, id) };
  }

  async setSubscription(
    user: RequestUser,
    institutionId: string,
    data: {
      planKey: $Enums.SubscriptionPlanKey;
      status?: $Enums.SubscriptionStatus;
      startsAt?: string;
      endsAt?: string;
      seatLimit?: number;
      reason?: string;
    },
  ): Promise<{
    subscription: ReturnType<AdminService['toSubscriptionView']>;
  }> {
    this.requireSuperAdmin(user);
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');
    const plan = await this.prisma.plan.findUnique({ where: { key: data.planKey } });
    if (!plan) throw new BadRequestException(`Unknown plan "${data.planKey}"`);

    const status: $Enums.SubscriptionStatus = data.status ?? 'ACTIVE';
    const startsAt = data.startsAt ? new Date(data.startsAt) : new Date();
    const endsAt = data.endsAt
      ? new Date(data.endsAt)
      : status === 'ACTIVE'
        ? new Date(Date.now() + SUBSCRIPTION.RENEW_DURATION_DAYS * DAY_MS)
        : status === 'TRIAL'
          ? new Date(Date.now() + 30 * DAY_MS)
          : null;
    const seatLimit =
      data.seatLimit ?? institution.seatLimit ?? plan.perSeat ?? SUBSCRIPTION.TRIAL_SEAT_LIMIT;

    const created = await this.prisma.$transaction(async (tx) => {
      const current = await tx.subscription.findFirst({
        where: { institutionId, status: { in: ['ACTIVE', 'TRIAL'] } },
        orderBy: { createdAt: 'desc' },
      });
      if (current) {
        await tx.subscription.update({
          where: { id: current.id },
          data: { status: 'CANCELLED' },
        });
        await this.writeHistory(tx, user, {
          institutionId,
          subscriptionId: current.id,
          action: 'CANCELLED',
          oldPlanId: current.planId,
          oldStatus: current.status,
          oldSeatLimit: current.seatLimit,
          oldStartsAt: current.startedAt,
          oldEndsAt: current.endsAt,
          newStatus: 'CANCELLED',
          reason: data.reason,
        });
      }
      const sub = await tx.subscription.create({
        data: {
          institutionId,
          planId: plan.id,
          status,
          startedAt: startsAt,
          endsAt,
          seatLimit,
        },
        include: { plan: true },
      });
      await this.writeHistory(tx, user, {
        institutionId,
        subscriptionId: sub.id,
        action: 'CREATED',
        newPlanId: plan.id,
        newStatus: status,
        newSeatLimit: seatLimit,
        newStartsAt: startsAt,
        newEndsAt: endsAt,
        reason: data.reason,
      });
      await this.writeAudit(tx, user, {
        action: current ? 'SUBSCRIPTION_PLAN_CHANGED' : 'SUBSCRIPTION_CREATED',
        institutionId,
        metadata: {
          planKey: plan.key,
          status,
          seatLimit,
          previousSubscriptionId: current?.id ?? null,
          reason: data.reason ?? null,
        },
      });
      await tx.institution.update({
        where: { id: institutionId },
        data: { lastActivityAt: new Date() },
      });
      return sub;
    });

    this.subscriptionAccess.invalidate(institutionId);
    return { subscription: this.toSubscriptionView(created) };
  }

  async renewSubscription(
    user: RequestUser,
    institutionId: string,
    data: {
      endDate: string;
      planKey?: $Enums.SubscriptionPlanKey;
      seatLimit?: number;
      startsAt?: string;
      reason?: string;
    },
  ): Promise<{
    subscription: ReturnType<AdminService['toSubscriptionView']>;
    previousExpiry: string | null;
    newExpiry: string;
  }> {
    this.requireSuperAdmin(user);
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');

    const endRaw = new Date(data.endDate);
    if (Number.isNaN(endRaw.getTime())) throw new BadRequestException('Invalid endDate');
    const endAt = new Date(Date.UTC(endRaw.getUTCFullYear(), endRaw.getUTCMonth(), endRaw.getUTCDate()));

    const plan = data.planKey
      ? await this.prisma.plan.findUnique({ where: { key: data.planKey } })
      : null;
    if (data.planKey && !plan) throw new BadRequestException(`Unknown plan "${data.planKey}"`);

    const result = await this.prisma.$transaction(async (tx) => {
      let current = await tx.subscription.findFirst({
        where: { institutionId, status: { in: ['ACTIVE', 'TRIAL'] } },
        orderBy: { createdAt: 'desc' },
        include: { plan: true },
      });
      const previousExpiry = current?.endsAt ? current.endsAt.toISOString() : null;
      const planId = plan?.id ?? current?.planId;

      if (!current && !planId) {
        throw new BadRequestException('Institution has no current subscription and no plan provided');
      }

      if (current) {
        const oldPlanId = current.planId;
        const oldSeatLimit = current.seatLimit;
        const oldEndsAt = current.endsAt;
        const oldStartsAt = current.startedAt;
        current = await tx.subscription.update({
          where: { id: current.id },
          data: {
            ...(planId ? { planId } : {}),
            ...(data.startsAt ? { startedAt: new Date(data.startsAt) } : {}),
            ...(data.seatLimit !== undefined ? { seatLimit: data.seatLimit } : {}),
            endsAt: endAt,
          },
          include: { plan: true },
        });
        await this.writeHistory(tx, user, {
          institutionId,
          subscriptionId: current.id,
          action: 'RENEWED',
          oldPlanId,
          newPlanId: current.planId,
          oldStatus: current.status,
          newStatus: current.status,
          oldSeatLimit,
          newSeatLimit: current.seatLimit,
          oldStartsAt,
          newStartsAt: current.startedAt,
          oldEndsAt,
          newEndsAt: endAt,
          reason: data.reason,
        });
      } else {
        const resolvedPlan = await tx.plan.findUniqueOrThrow({ where: { id: planId! } });
        current = await tx.subscription.create({
          data: {
            institutionId,
            planId: resolvedPlan.id,
            status: 'ACTIVE',
            startedAt: data.startsAt ? new Date(data.startsAt) : new Date(),
            endsAt: endAt,
            seatLimit: data.seatLimit ?? institution.seatLimit ?? resolvedPlan.perSeat ?? SUBSCRIPTION.TRIAL_SEAT_LIMIT,
          },
          include: { plan: true },
        });
        await this.writeHistory(tx, user, {
          institutionId,
          subscriptionId: current.id,
          action: 'CREATED',
          newPlanId: resolvedPlan.id,
          newStatus: 'ACTIVE',
          newSeatLimit: current.seatLimit,
          newStartsAt: current.startedAt,
          newEndsAt: endAt,
          reason: data.reason,
        });
      }

      await this.writeAudit(tx, user, {
        action: 'SUBSCRIPTION_RENEWED',
        institutionId,
        metadata: {
          previousExpiry,
          newExpiry: endAt.toISOString(),
          planKey: current.plan.key,
          reason: data.reason ?? null,
        },
      });
      await tx.institution.update({
        where: { id: institutionId },
        data: { lastActivityAt: new Date() },
      });
      return { subscription: current, previousExpiry, newExpiry: endAt.toISOString() };
    });

    this.subscriptionAccess.invalidate(institutionId);
    return {
      subscription: this.toSubscriptionView(result.subscription),
      previousExpiry: result.previousExpiry,
      newExpiry: result.newExpiry,
    };
  }

  async expireSubscription(user: RequestUser, institutionId: string, reason?: string): Promise<{
    subscription: ReturnType<AdminService['toSubscriptionView']>;
  }> {
    this.requireSuperAdmin(user);
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');
    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.subscription.findFirst({
        where: { institutionId, status: { in: ['ACTIVE', 'TRIAL'] } },
        orderBy: { createdAt: 'desc' },
        include: { plan: true },
      });
      if (!current) throw new BadRequestException('Institution has no active or trial subscription');
      const updated = await tx.subscription.update({
        where: { id: current.id },
        data: { status: 'EXPIRED' },
        include: { plan: true },
      });
      await this.writeHistory(tx, user, {
        institutionId,
        subscriptionId: current.id,
        action: 'EXPIRED',
        oldStatus: current.status,
        newStatus: 'EXPIRED',
        oldStartsAt: current.startedAt,
        oldEndsAt: current.endsAt,
        newStartsAt: updated.startedAt,
        newEndsAt: updated.endsAt,
        reason,
      });
      await this.writeAudit(tx, user, {
        action: 'SUBSCRIPTION_EXPIRED',
        institutionId,
        metadata: { subscriptionId: current.id, reason: reason ?? null },
      });
      await tx.institution.update({
        where: { id: institutionId },
        data: { status: 'EXPIRED', expiredAt: new Date(), lastActivityAt: new Date() },
      });
      await this.writeAudit(tx, user, {
        action: 'INSTITUTION_EXPIRED',
        institutionId,
        metadata: { reason: reason ?? null },
      });
      return updated;
    });
    this.subscriptionAccess.invalidate(institutionId);
    return { subscription: this.toSubscriptionView(result) };
  }

  async changeUserLimit(
    user: RequestUser,
    institutionId: string,
    data: { seatLimit: number; reason?: string },
  ): Promise<{ seatLimit: number; usage: number; exceeded: boolean }> {
    this.requireSuperAdmin(user);
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');

    await this.prisma.$transaction(async (tx) => {
      const current = await tx.subscription.findFirst({
        where: { institutionId, status: { in: ['ACTIVE', 'TRIAL'] } },
        orderBy: { createdAt: 'desc' },
      });
      const oldLimit = current?.seatLimit ?? institution.seatLimit;
      await tx.institution.update({
        where: { id: institutionId },
        data: { seatLimit: data.seatLimit, lastActivityAt: new Date() },
      });
      if (current) {
        await tx.subscription.update({
          where: { id: current.id },
          data: { seatLimit: data.seatLimit },
        });
        await this.writeHistory(tx, user, {
          institutionId,
          subscriptionId: current.id,
          action: 'LIMIT_CHANGED',
          oldStatus: current.status,
          newStatus: current.status,
          oldSeatLimit: oldLimit,
          newSeatLimit: data.seatLimit,
          reason: data.reason,
        });
      }
      await this.writeAudit(tx, user, {
        action: 'USER_LIMIT_CHANGED',
        institutionId,
        metadata: { oldSeatLimit: oldLimit, newSeatLimit: data.seatLimit, reason: data.reason ?? null },
      });
    });
    this.subscriptionAccess.invalidate(institutionId);
    const usage = await this.subscriptionAccess.countBillableUsers(institutionId);
    return { seatLimit: data.seatLimit, usage, exceeded: usage > data.seatLimit };
  }

  async listUsers(user: RequestUser, institutionId: string): Promise<{
    users: Array<{
      userId: string;
      name: string;
      email: string;
      phone?: string | null;
      role: string;
      status: string;
      isActive: boolean;
      joinedAt: string;
      lastLoginAt?: string | null;
    }>;
  }> {
    this.requireSuperAdmin(user);
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');
    const memberships = await this.prisma.institutionMember.findMany({
      where: { institutionId },
      orderBy: { joinedAt: 'desc' },
      take: 500,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, isActive: true, lastLoginAt: true } },
      },
    });
    return {
      users: memberships.map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        phone: m.user.phone,
        role: m.role,
        status: m.status,
        isActive: m.user.isActive,
        joinedAt: m.joinedAt.toISOString(),
        lastLoginAt: m.user.lastLoginAt ? m.user.lastLoginAt.toISOString() : null,
      })),
    };
  }

  async changeAdmin(
    user: RequestUser,
    institutionId: string,
    data: {
      assignUserId?: string;
      adminEmail?: string;
      adminName?: string;
      reason?: string;
    },
  ): Promise<{ admin: { userId: string; name: string; email: string } }> {
    this.requireSuperAdmin(user);
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');

    let adminUser: { id: string; name: string; email: string };
    if (data.assignUserId) {
      const u = await this.prisma.user.findUnique({ where: { id: data.assignUserId } });
      if (!u) throw new BadRequestException('assignUserId does not reference a known user');
      adminUser = u;
    } else {
      if (!data.adminEmail) throw new BadRequestException('adminEmail is required');
      const email = data.adminEmail.toLowerCase();
      adminUser =
        (await this.prisma.user.findUnique({ where: { email } })) ??
        (await this.prisma.user.create({
          data: {
            name: data.adminName ?? `Admin ${email}`,
            email,
            passwordHash: '',
            isSuperAdmin: false,
          },
        }));
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.institutionMember.upsert({
        where: { institutionId_userId: { institutionId, userId: adminUser.id } },
        create: { institutionId, userId: adminUser.id, role: 'INSTITUTION_ADMIN', status: 'ACTIVE' },
        update: { role: 'INSTITUTION_ADMIN', status: 'ACTIVE' },
      });
      await this.writeAudit(tx, user, {
        action: 'INSTITUTION_ADMIN_CHANGED',
        institutionId,
        metadata: { assignUserId: adminUser.id, assignEmail: adminUser.email, reason: data.reason ?? null },
      });
      await tx.institution.update({
        where: { id: institutionId },
        data: { lastActivityAt: new Date() },
      });
      return adminUser;
    });
    this.subscriptionAccess.invalidate(institutionId);
    return { admin: { userId: result.id, name: result.name, email: result.email } };
  }

  async disableUser(
    user: RequestUser,
    institutionId: string,
    targetUserId: string,
    reason?: string,
  ): Promise<{ ok: true }> {
    this.requireSuperAdmin(user);
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: targetUserId }, data: { isActive: false } });
      await this.writeAudit(tx, user, {
        action: 'USER_DISABLED',
        institutionId,
        entityType: 'USER',
        entityId: targetUserId,
        metadata: { email: target.email, reason: reason ?? null },
      });
    });
    this.subscriptionAccess.invalidate(institutionId);
    return { ok: true };
  }

  async enableUser(
    user: RequestUser,
    institutionId: string,
    targetUserId: string,
    reason?: string,
  ): Promise<{ ok: true }> {
    this.requireSuperAdmin(user);
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found');
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: targetUserId }, data: { isActive: true } });
      await this.writeAudit(tx, user, {
        action: 'USER_ENABLED',
        institutionId,
        entityType: 'USER',
        entityId: targetUserId,
        metadata: { email: target.email, reason: reason ?? null },
      });
    });
    this.subscriptionAccess.invalidate(institutionId);
    return { ok: true };
  }

  async subscriptionHistory(user: RequestUser, institutionId: string): Promise<{
    rows: Array<Record<string, unknown>>;
  }> {
    this.requireSuperAdmin(user);
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');
    const rows = await this.prisma.subscriptionHistory.findMany({
      where: { institutionId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { changedBy: { select: { name: true, email: true } } },
    });
    const planIds = new Set<string>();
    for (const r of rows) {
      if (r.oldPlanId) planIds.add(r.oldPlanId);
      if (r.newPlanId) planIds.add(r.newPlanId);
    }
    const plans = await this.prisma.plan.findMany({ where: { id: { in: [...planIds] } } });
    const planById = new Map(plans.map((p) => [p.id, p]));
    return {
      rows: rows.map((h) => ({
        id: h.id,
        action: h.action,
        institutionId: h.institutionId,
        subscriptionId: h.subscriptionId,
        changedById: h.changedById,
        changedBy: h.changedBy ? { name: h.changedBy.name, email: h.changedBy.email } : null,
        oldPlan: h.oldPlanId ? planById.get(h.oldPlanId) ?? null : null,
        newPlan: h.newPlanId ? planById.get(h.newPlanId) ?? null : null,
        oldStatus: h.oldStatus,
        newStatus: h.newStatus,
        oldSeatLimit: h.oldSeatLimit,
        newSeatLimit: h.newSeatLimit,
        oldStartsAt: h.oldStartsAt ? h.oldStartsAt.toISOString() : null,
        oldEndsAt: h.oldEndsAt ? h.oldEndsAt.toISOString() : null,
        newStartsAt: h.newStartsAt ? h.newStartsAt.toISOString() : null,
        newEndsAt: h.newEndsAt ? h.newEndsAt.toISOString() : null,
        reason: h.reason,
        createdAt: h.createdAt.toISOString(),
      })),
    };
  }

  async institutionAudit(
    user: RequestUser,
    institutionId: string,
    page = 1,
    pageSize = 25,
  ): Promise<{
    total: number;
    page: number;
    pageSize: number;
    rows: Array<{
      id: string;
      action: string;
      entityType?: string | null;
      entityId?: string | null;
      metadata: Record<string, unknown>;
      createdAt: string;
      user?: { name: string; email: string } | null;
    }>;
  }> {
    this.requireSuperAdmin(user);
    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');
    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count({ where: { institutionId } }),
      this.prisma.auditLog.findMany({
        where: { institutionId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);
    return {
      total,
      page,
      pageSize,
      rows: rows.map((r) => ({
        id: r.id,
        action: r.action,
        entityType: r.entityType,
        entityId: r.entityId,
        metadata: r.metadata as Record<string, unknown>,
        createdAt: r.createdAt.toISOString(),
        user: r.user ? { name: r.user.name, email: r.user.email } : null,
      })),
    };
  }

  async plans(user: RequestUser) {
    this.requireSuperAdmin(user);
    return this.prisma.plan.findMany({
      where: { active: true },
      orderBy: { priceMonthly: 'desc' },
    });
  }

  async dashboard(user: RequestUser) {
    this.requireSuperAdmin(user);
    const now = Date.now();
    const soon = new Date(now + SUBSCRIPTION.EXPIRING_SOON_DAYS * DAY_MS);

    const [
      total,
      active,
      pending,
      expired,
      suspended,
      archived,
      expiringSoon,
      students,
      teachers,
      parents,
    ] = await Promise.all([
      this.prisma.institution.count(),
      this.prisma.institution.count({ where: { status: 'ACTIVE' } }),
      this.prisma.institution.count({ where: { status: 'PENDING' } }),
      this.prisma.institution.count({ where: { status: 'EXPIRED' } }),
      this.prisma.institution.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.institution.count({ where: { status: 'ARCHIVED' } }),
      this.prisma.institution.count({
        where: {
          subscriptions: {
            some: {
              status: { in: ['ACTIVE', 'TRIAL'] },
              endsAt: { gte: new Date(now), lte: soon },
            },
          },
        },
      }),
      this.prisma.student.count(),
      this.prisma.teacher.count(),
      this.prisma.parent.count(),
    ]);

    const rows = await this.prisma.institution.findMany({
      select: { id: true, seatLimit: true, subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    const ids = rows.map((r) => r.id);
    const billable = await this.countBillableByIds(ids);
    let limitExceeded = 0;
    for (const r of rows) {
      const sub = r.subscriptions[0];
      const limit = sub?.seatLimit ?? r.seatLimit ?? SUBSCRIPTION.TRIAL_SEAT_LIMIT;
      if ((billable.get(r.id) ?? 0) > limit) limitExceeded += 1;
    }

    return {
      institutions: {
        total,
        active,
        pending,
        expiringSoon,
        expired,
        suspended,
        archived,
        limitExceeded,
      },
      users: { total: students + teachers + parents, students, teachers, parents },
    };
  }

  async exportInstitutions(user: RequestUser, raw: ListFilters): Promise<string> {
    this.requireSuperAdmin(user);
    const f = this.cleanListFilters(raw);
    const now = Date.now();

    const where: Prisma.InstitutionWhereInput = {};
    if (f.search) {
      where.OR = [
        { name: { contains: f.search, mode: 'insensitive' } },
        { code: { contains: f.search, mode: 'insensitive' } },
        { primaryEmail: { contains: f.search, mode: 'insensitive' } },
        { members: { some: { user: { email: { contains: f.search, mode: 'insensitive' } } } } },
      ];
    }
    if (f.type) where.type = f.type as $Enums.InstitutionType;
    if (f.status) where.status = f.status as $Enums.InstitutionStatusEnum;
    if (f.plan) {
      where.subscriptions = { some: { plan: { key: f.plan as $Enums.SubscriptionPlanKey } } };
    }
    if (f.from || f.to) {
      where.createdAt = {
        ...(f.from ? { gte: new Date(f.from) } : {}),
        ...(f.to ? { lte: new Date(f.to) } : {}),
      };
    }

    const rows = await this.prisma.institution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5000,
      include: {
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 5, include: { plan: true } },
        _count: { select: { students: true, teachers: true, groups: true, assessments: true, papers: true, questions: true, parents: true, members: true } },
      },
    });
    const ids = rows.map((r) => r.id);
    const [billable, subCounts] = await Promise.all([
      this.countBillableByIds(ids),
      this.subscriptionCountsByIds(ids),
    ]);

    const lines = rows.map((inst) => {
      const subs = inst.subscriptions as SubscriptionWithPlan[];
      const sub = subs.find((s) => s.status === 'ACTIVE' || s.status === 'TRIAL') ?? subs[0] ?? null;
      const seatLimit = this.seatLimitFor(inst, subs);
      const usage = billable.get(inst.id) ?? 0;
      return {
        id: inst.id,
        name: inst.name,
        type: inst.type,
        code: inst.code ?? '',
        status: inst.status,
        plan: sub?.plan?.key ?? '',
        subscriptionStatus: this.effectiveSubscriptionStatus(subCounts.get(inst.id) ?? 0, subs, now),
        endsAt: sub?.endsAt ? sub.endsAt.toISOString() : '',
        seatLimit,
        usage,
        billableUsers: usage,
        createdAt: inst.createdAt.toISOString(),
        lastActivityAt: inst.lastActivityAt.toISOString(),
      };
    });
    return toCsv(lines);
  }

  // ---------- Curriculum management ----------

  async createBoard(user: RequestUser, data: { name: string; code: string }) {
    this.requireSuperAdmin(user);
    return this.prisma.board.create({ data: { name: data.name, code: data.code.toUpperCase() } });
  }

  async createGrade(user: RequestUser, boardId: string, data: { name: string; order?: number }) {
    this.requireSuperAdmin(user);
    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    return this.prisma.grade.create({ data: { boardId, name: data.name, order: data.order ?? 0 } });
  }

  async createSubject(user: RequestUser, data: { boardId: string; name: string; code: string; color?: string }) {
    this.requireSuperAdmin(user);
    return this.prisma.subject.create({
      data: { boardId: data.boardId, name: data.name, code: data.code, color: data.color ?? null },
    });
  }

  async createChapter(user: RequestUser, data: { subjectId: string; name: string; code: string; grade: string; order?: number }) {
    this.requireSuperAdmin(user);
    const subject = await this.prisma.subject.findUnique({ where: { id: data.subjectId } });
    if (!subject) throw new NotFoundException('Subject not found');
    return this.prisma.chapter.create({
      data: { subjectId: data.subjectId, name: data.name, code: data.code, grade: data.grade, order: data.order ?? 0 },
    });
  }

  async createTopic(user: RequestUser, data: { chapterId: string; name: string; order?: number }) {
    this.requireSuperAdmin(user);
    return this.prisma.topic.create({ data: { chapterId: data.chapterId, name: data.name, order: data.order ?? 0 } });
  }

  async createConcept(user: RequestUser, data: { topicId: string; name: string; order?: number }) {
    this.requireSuperAdmin(user);
    const topic = await this.prisma.topic.findUnique({ where: { id: data.topicId } });
    if (!topic) throw new NotFoundException('Topic not found');
    return this.prisma.concept.create({ data: { topicId: data.topicId, name: data.name, order: data.order ?? 0 } });
  }

  async curriculumTree(user: RequestUser) {
    this.requireSuperAdmin(user);
    return this.prisma.board.findMany({
      include: {
        grades: true,
        subjects: {
          include: {
            chapters: {
              orderBy: { order: 'asc' },
              include: { topics: { orderBy: { order: 'asc' }, include: { concepts: { orderBy: { order: 'asc' } } } } },
            },
          },
        },
      },
    });
  }

  // ---------- Audit ----------

  async auditLogs(user: RequestUser, page = 1, pageSize = 50) {
    this.requireSuperAdmin(user);
    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { name: true, email: true } }, institution: { select: { name: true } } },
      }),
    ]);
    return { total, page, pageSize, rows };
  }

  async subscriptions(user: RequestUser) {
    this.requireSuperAdmin(user);
    return this.prisma.subscription.findMany({
      include: { institution: { select: { name: true, code: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async contactLeads(user: RequestUser, limit: number) {
    this.requireSuperAdmin(user);
    const total = await this.prisma.contactLead.count();
    const rows = await this.prisma.contactLead.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
    });
    return { total, rows };
  }
}