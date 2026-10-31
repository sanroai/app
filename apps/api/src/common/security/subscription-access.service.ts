import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  AccountBlockState,
  SubscriptionStatus,
  Role,
} from '@sanro/types';
import {
  BLOCKED_ACCOUNT_MESSAGES,
  SUBSCRIPTION,
} from '@sanro/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestUser } from '../types/auth-context';
import { APP_CONFIG_TOKEN } from '../common.constants';
import { Inject } from '@nestjs/common';
import { AppConfig } from '../../config/app.config';

export interface SubscriptionInfoResult {
  id: string | null;
  planId: string | null;
  planKey: string | null;
  planName: string | null;
  status: SubscriptionStatus | null;
  startedAt: Date | null;
  endsAt: Date | null;
  seatLimit: number | null;
  daysRemaining: number | null;
  expiringSoon: boolean;
  expired: boolean;
}

export interface EntitlementResult {
  institutionId: string;
  institutionName: string;
  institutionType: string;
  institutionStatus: string;
  access: boolean;
  blockState: AccountBlockState | null;
  blockMessage: string | null;
  subscription: SubscriptionInfoResult | null;
  seatLimit: number | null;
  billableUsers: number;
  usagePct: number;
  limitExceeded: boolean;
  expiresAt: Date | null;
  gracePeriodDays: number;
}

type DbClient = PrismaService | Prisma.TransactionClient;

const BILLABLE_ROLES: Role[] = ['INSTITUTION_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];

/**
 * Centralized subscription / institution entitlement engine.
 *
 * Single source of truth for:
 *  - effective (current) subscription of an institution
 *  - account/session access rules (expired / suspended / archived / pending / disabled)
 *  - user-seat (billing) limits
 *
 * Used by the API access guard, the auth flow (login/refresh/switch-context),
 * the super-admin institutions module, and web/mobile account-state checks.
 *
 * Time is always server UTC. Client devices never decide validity.
 */
@Injectable()
export class SubscriptionAccessService {
  private readonly cache = new Map<
    string,
    { at: number; value: EntitlementResult }
  >();
  private readonly userCache = new Map<
    string,
    { at: number; active: boolean; membership: string | null }
  >();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(APP_CONFIG_TOKEN) private readonly config: AppConfig,
  ) {}

  invalidate(institutionId: string): void {
    this.cache.delete(institutionId);
    for (const key of this.userCache.keys()) {
      if (key.startsWith(`${institutionId}:`)) this.userCache.delete(key);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Evaluates the entitlement of an institution. Reads from a short TTL cache
   * to avoid a DB round-trip on every protected request; sensitive admin
   * mutations invalidate the entry explicitly.
   */
  async evaluate(institutionId: string, force = false): Promise<EntitlementResult> {
    const cached = this.cache.get(institutionId);
    if (!force && cached && Date.now() - cached.at < SUBSCRIPTION.ENTITLEMENT_CACHE_TTL_MS) {
      return cached.value;
    }
    const value = await this.computeEntitlement(institutionId);
    this.cache.set(institutionId, { at: Date.now(), value });
    return value;
  }

  private async computeEntitlement(institutionId: string): Promise<EntitlementResult> {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
      include: { subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' } } },
    });
    const fallback: EntitlementResult = {
      institutionId,
      institutionName: '',
      institutionType: 'OTHER',
      institutionStatus: 'ARCHIVED',
      access: false,
      blockState: 'INSTITUTION_ARCHIVED',
      blockMessage: BLOCKED_ACCOUNT_MESSAGES.INSTITUTION_ARCHIVED,
      subscription: null,
      seatLimit: null,
      billableUsers: 0,
      usagePct: 0,
      limitExceeded: false,
      expiresAt: null,
      gracePeriodDays: 0,
    };
    if (!institution) {
      this.cache.set(institutionId, { at: Date.now(), value: fallback });
      return fallback;
    }

    // Lazy expiry transition: an institution ACTIVE with an ended subscription
    // becomes EXPIRED automatically. Never touches data; only lifecycle flags.
    await this.holdExpiryState(institution.id, institution.status, institution.subscriptions);

    const refreshed = await this.prisma.subscription.findFirst({
      where: { institutionId, status: { in: ['ACTIVE', 'TRIAL'] } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    const subscription = this.buildSubscriptionInfo(refreshed);
    const seatLimit = refreshed?.seatLimit ?? institution.seatLimit ?? null;
    const billable = await this.countBillableUsers(institutionId);
    const usagePct = seatLimit ? Math.round((billable / seatLimit) * 100) : 0;
    const limitExceeded = seatLimit != null && billable > seatLimit;
    const gracePeriodDays = institution.gracePeriodDays ?? SUBSCRIPTION.DEFAULT_GRACE_PERIOD_DAYS;

    let access = true;
    let blockState: AccountBlockState | null = null;
    let blockMessage: string | null = null;

    if (institution.status === 'ARCHIVED') {
      access = false;
      blockState = 'INSTITUTION_ARCHIVED';
      blockMessage = BLOCKED_ACCOUNT_MESSAGES.INSTITUTION_ARCHIVED;
    } else if (institution.status === 'SUSPENDED') {
      access = false;
      blockState = 'INSTITUTION_SUSPENDED';
      blockMessage = BLOCKED_ACCOUNT_MESSAGES.INSTITUTION_SUSPENDED;
    } else if (institution.status === 'PENDING') {
      access = false;
      blockState = 'INSTITUTION_PENDING';
      blockMessage = BLOCKED_ACCOUNT_MESSAGES.INSTITUTION_PENDING;
    } else if (institution.status === 'EXPIRED' || subscription?.expired) {
      access = false;
      blockState = 'SUBSCRIPTION_EXPIRED';
      blockMessage = BLOCKED_ACCOUNT_MESSAGES.SUBSCRIPTION_EXPIRED;
    }

    return {
      institutionId: institution.id,
      institutionName: institution.name,
      institutionType: institution.type,
      institutionStatus: institution.status,
      access,
      blockState,
      blockMessage,
      subscription,
      seatLimit,
      billableUsers: billable,
      usagePct,
      limitExceeded,
      expiresAt: subscription?.endsAt ?? null,
      gracePeriodDays,
    };
  }

  private buildSubscriptionInfo(
    sub: (Prisma.SubscriptionGetPayload<{ include: { plan: true } }> & { plan: { name: string; key: string } }) | null,
  ): SubscriptionInfoResult | null {
    if (!sub) return null;
    const now = Date.now();
    const endsAt = sub.endsAt;
    const expired =
      !!endsAt && endsAt.getTime() < now && (sub.status === 'ACTIVE' || sub.status === 'TRIAL');
    const daysRemaining = endsAt
      ? Math.floor((endsAt.getTime() - now) / 86400000)
      : null;
    const effectiveStatus: SubscriptionStatus | null = expired
      ? 'EXPIRED'
      : (sub.status as SubscriptionStatus | null);
    return {
      id: sub.id,
      planId: sub.planId,
      planKey: (sub.plan.key as string) ?? null,
      planName: sub.plan.name ?? null,
      status: effectiveStatus,
      startedAt: sub.startedAt,
      endsAt: sub.endsAt,
      seatLimit: sub.seatLimit,
      daysRemaining,
      expiringSoon:
        !expired &&
        daysRemaining != null &&
        daysRemaining <= SUBSCRIPTION.EXPIRING_SOON_DAYS,
      expired,
    };
  }

  /**
   * Lazy lifecycle transition — flips ACTIVE/TRIAL subscriptions that have
   * ended to EXPIRED and marks the institution EXPIRED (unless it is already
   * suspended/archived which take precedence).
   */
  private async holdExpiryState(
    institutionId: string,
    institutionStatus: string,
    subscriptions: Array<{ id: string; status: string; endsAt: Date | null }>,
  ): Promise<void> {
    const now = new Date();
    const active = subscriptions.find(
      (s) => (s.status === 'ACTIVE' || s.status === 'TRIAL') && s.endsAt && s.endsAt < now,
    );
    if (!active) return;
    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id: active.id },
        data: { status: 'EXPIRED' },
      }),
      ...(institutionStatus === 'ACTIVE'
        ? [
            this.prisma.institution.update({
              where: { id: institutionId },
              data: { status: 'EXPIRED', expiredAt: now },
            }),
          ]
        : []),
    ]);
  }

  /**
   * Billable seat rule (documented in docs/INSTITUTION_MANAGEMENT.md):
   * one seat per ACTIVE student record + ACTIVE teacher record + every parent
   * record + every ACTIVE institution-admin membership. SUPER_ADMIN platform
   * accounts and archived records are never counted.
   */
  async countBillableUsers(institutionId: string, tx?: DbClient): Promise<number> {
    const client = tx ?? this.prisma;
    const [students, teachers, parents, admins] = await Promise.all([
      client.student.count({ where: { institutionId, status: 'ACTIVE' } }),
      client.teacher.count({ where: { institutionId, status: 'ACTIVE' } }),
      client.parent.count({ where: { institutionId } }),
      client.institutionMember.count({
        where: { institutionId, status: 'ACTIVE', role: 'INSTITUTION_ADMIN' },
      }),
    ]);
    return students + teachers + parents + admins;
  }

  /**
   * Enforces the user seat limit before creating/importing additional people.
   * Throws USER_LIMIT_REACHED when the institution has no remaining seats.
   */
  async assertSeatAvailable(
    institutionId: string,
    additional = 1,
    tx?: DbClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    const student = await client.institution.findUnique({ where: { id: institutionId } });
    if (!student) throw new BadRequestException('Institution not found');
    const subscription = await client.subscription.findFirst({
      where: { institutionId, status: { in: ['ACTIVE', 'TRIAL'] } },
      orderBy: { createdAt: 'desc' },
    });
    const limit = subscription?.seatLimit ?? student.seatLimit ?? null;
    if (limit == null) return;
    const current = await this.countBillableUsers(institutionId, client);
    if (current + additional > limit) {
      throw new BadRequestException({
        code: 'USER_LIMIT_REACHED',
        message:
          'User limit reached. Please contact your SANRO administrator to increase your subscription limit.',
        details: { current, requested: additional, limit, available: Math.max(0, limit - current) },
      });
    }
  }

  /**
   * Non-throwing variant used by bulk imports so the caller can reject safely
   * before committing any rows.
   */
  async seatAvailability(
    institutionId: string,
    requested: number,
    tx?: DbClient,
  ): Promise<{ current: number; available: number | null; requested: number; allowed: boolean; limit: number | null }> {
    const client = tx ?? this.prisma;
    const current = await this.countBillableUsers(institutionId, client);
    const institution = await client.institution.findUnique({ where: { id: institutionId } });
    const subscription = await client.subscription.findFirst({
      where: { institutionId, status: { in: ['ACTIVE', 'TRIAL'] } },
      orderBy: { createdAt: 'desc' },
    });
    const limit = subscription?.seatLimit ?? institution?.seatLimit ?? null;
    const available = limit == null ? null : Math.max(0, limit - current);
    return {
      current,
      requested,
      available,
      allowed: limit == null || current + requested <= limit,
      limit,
    };
  }

  /**
   * Access gate for a JWT request user. SUPER_ADMIN has no institution
   * binding and is always allowed. Non-super users are validated against the
   * institution entitlement, their own account state and active membership.
   */
  async assertCanAccess(user: RequestUser): Promise<void> {
    if (user.role === Role.SUPER_ADMIN) return;
    if (!user.institutionId) {
      throw new ForbiddenException('No institution context');
    }

    const entitlement = await this.evaluate(user.institutionId);
    const userState = await this.getUserState(user.institutionId, user.sub);

    if (!userState.active) {
      throw new ForbiddenException({
        code: 'USER_DISABLED',
        message: BLOCKED_ACCOUNT_MESSAGES.USER_DISABLED,
      });
    }
    if (userState.membership && userState.membership !== 'ACTIVE') {
      throw new ForbiddenException({
        code: 'MEMBERSHIP_DEACTIVATED',
        message: BLOCKED_ACCOUNT_MESSAGES.MEMBERSHIP_DEACTIVATED,
      });
    }
    if (!entitlement.access) {
      throw new ForbiddenException({
        code: entitlement.blockState ?? 'INSTITUTION_ARCHIVED',
        message: entitlement.blockMessage,
        details: {
          institutionId: entitlement.institutionId,
          institutionName: entitlement.institutionName,
          expiresAt: entitlement.expiresAt,
        },
      });
    }
  }

  private async getUserState(
    institutionId: string,
    userId: string,
  ): Promise<{ active: boolean; membership: string | null }> {
    const key = `${institutionId}:${userId}`;
    const cached = this.userCache.get(key);
    if (cached && Date.now() - cached.at < SUBSCRIPTION.ENTITLEMENT_CACHE_TTL_MS) {
      return { active: cached.active, membership: cached.membership };
    }
    const [userRecord, membership] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } }),
      this.prisma.institutionMember.findUnique({
        where: { institutionId_userId: { institutionId, userId } },
        select: { status: true },
      }),
    ]);
    const state = {
      active: userRecord?.isActive ?? false,
      membership: membership?.status ?? null,
    };
    this.userCache.set(key, {
      at: Date.now(),
      active: state.active,
      membership: state.membership,
    });
    return state;
  }

  /**
   * Returns a normalized `{access, state, institution}` describing the current
   * account for web/mobile. Returns access=true without institution data for
   * SUPER_ADMIN.
   */
  async getAccountState(
    userId: string,
    role: Role,
    institutionId?: string,
  ): Promise<{
    access: boolean;
    state?: AccountBlockState | null;
    message?: string | null;
    institution?: Record<string, unknown> | null;
  }> {
    if (role === Role.SUPER_ADMIN) {
      return { access: true, state: null, message: null, institution: null };
    }
    if (!institutionId) {
      return { access: false, state: 'MEMBERSHIP_DEACTIVATED', message: BLOCKED_ACCOUNT_MESSAGES.MEMBERSHIP_DEACTIVATED };
    }
    const entitlement = await this.evaluate(institutionId);
    const userRecord = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });
    if (!userRecord?.isActive) {
      return {
        access: false,
        state: 'USER_DISABLED',
        message: BLOCKED_ACCOUNT_MESSAGES.USER_DISABLED,
        institution: this.publicInstitutionSnapshot(entitlement),
      };
    }
    return {
      access: entitlement.access,
      state: entitlement.blockState,
      message: entitlement.blockMessage,
      institution: this.publicInstitutionSnapshot(entitlement),
    };
  }

  private publicInstitutionSnapshot(entitlement: EntitlementResult): Record<string, unknown> {
    return {
      id: entitlement.institutionId,
      name: entitlement.institutionName,
      type: entitlement.institutionType,
      status: entitlement.institutionStatus,
      expiresAt: entitlement.expiresAt ? entitlement.expiresAt.toISOString() : null,
      gracePeriodDays: entitlement.gracePeriodDays,
      subscription: entitlement.subscription
        ? {
            id: entitlement.subscription.id,
            planKey: entitlement.subscription.planKey,
            planName: entitlement.subscription.planName,
            status: entitlement.subscription.status,
            startedAt: entitlement.subscription.startedAt
              ? entitlement.subscription.startedAt.toISOString()
              : null,
            endsAt: entitlement.subscription.endsAt
              ? entitlement.subscription.endsAt.toISOString()
              : null,
            seatLimit: entitlement.subscription.seatLimit,
            daysRemaining: entitlement.subscription.daysRemaining,
            expiringSoon: entitlement.subscription.expiringSoon,
            expired: entitlement.subscription.expired,
          }
        : null,
      seatLimit: entitlement.seatLimit,
      billableUsers: entitlement.billableUsers,
      limitExceeded: entitlement.limitExceeded,
    };
  }
}