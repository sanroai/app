import { Injectable, ForbiddenException } from '@nestjs/common';
import {
  AccountBlockState,
  EntitlementBlockReason,
  EntitlementSource,
  Role,
  SubscriptionStatus,
} from '@sanro/types';
import { BLOCKED_ACCOUNT_MESSAGES, SUBSCRIPTION } from '@sanro/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestUser } from '../types/auth-context';
import { SubscriptionAccessService } from './subscription-access.service';
import { SystemInstitutionService } from './system-institution.service';

export interface DirectSubscriptionSummary {
  planKey: string | null;
  status: SubscriptionStatus;
  endsAt: Date | null;
}

export interface ChildEntitlement {
  studentId: string;
  name: string;
  institutionId: string | null;
  source: EntitlementSource;
  expiresAt: Date | null;
  enrolledGrade: string | null;
}

export interface UserEntitlement {
  allowed: boolean;
  reason?: EntitlementBlockReason;
  source: EntitlementSource;
  directSubscription?: DirectSubscriptionSummary | null;
  institutionName?: string | null;
  expiresAt: Date | null;
  children: ChildEntitlement[];
  blockState?: string;
  message?: string;
}

type SubWithPlan = Prisma.SubscriptionGetPayload<{ include: { plan: true } }>;

const DIRECT_MESSAGES: Record<
  'NO_ENTITLEMENT' | 'DIRECT_SUBSCRIPTION_EXPIRED' | 'DIRECT_SUBSCRIPTION_SUSPENDED',
  string
> = {
  NO_ENTITLEMENT:
    'No active SANRO entitlement found. Please subscribe to continue using SANRO.',
  DIRECT_SUBSCRIPTION_EXPIRED:
    'Your SANRO subscription has expired. Please renew your subscription to continue.',
  DIRECT_SUBSCRIPTION_SUSPENDED:
    'Your SANRO subscription has been suspended. Please contact SANRO support.',
};

const ENTITLED_DIRECT_STATUSES: readonly SubscriptionStatus[] = ['ACTIVE', 'TRIAL'];

/**
 * Platform-wide entitlement oracle for "can this RequestUser act RIGHT NOW?".
 *
 * Precedence (§4 of docs/PEOPLE_MANAGEMENT_CONTRACT.md):
 *  1. SUPER_ADMIN — always allowed.
 *  2. Institution context (institutionId claim) — delegated entirely to
 *     SubscriptionAccessService; this service NEVER re-implements the
 *     institution + subscription + membership chain.
 *  3. PARENT without institution context — entitlement derived via linked
 *     children (each child is institution- or direct-entitled on its own).
 *  4. Other direct SANRO users (students) — direct Subscription owned by the
 *     user (Subscription.userId).
 *
 * Mirrors the short-TTL cache used by SubscriptionAccessService.
 */
@Injectable()
export class EntitlementService {
  private readonly cache = new Map<
    string,
    { at: number; value: UserEntitlement }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionAccess: SubscriptionAccessService,
    private readonly systemInstitution: SystemInstitutionService,
  ) {}

  /**
   * Mirrors the guard's direct-vs-institution routing: a user is a direct
   * SANRO customer when they have no institution or belong to the SANRO AI
   * system institution (falling back to null-only detection if the system
   * institution cannot be resolved).
   */
  async isDirectUser(user: { institutionId?: string | null }): Promise<boolean> {
    if (!user.institutionId) return true;
    try {
      return (
        user.institutionId === (await this.systemInstitution.systemInstitutionId())
      );
    } catch {
      return false;
    }
  }

  /**
   * Contract name (§4). `evaluateUser` is an alias for the same operation.
   */
  evaluateEntitlement(user: RequestUser): Promise<UserEntitlement> {
    return this.evaluateUser(user);
  }

  /**
   * Evaluates a user's current entitlement. Reads from a short-TTL cache to
   * avoid per-request DB work; admin mutations should call `invalidate`.
   */
  async evaluateUser(user: RequestUser, force = false): Promise<UserEntitlement> {
    const cached = this.cache.get(user.sub);
    if (!force && cached && Date.now() - cached.at < SUBSCRIPTION.ENTITLEMENT_CACHE_TTL_MS) {
      return cached.value;
    }
    const value = await this.computeEntitlement(user);
    this.cache.set(user.sub, { at: Date.now(), value });
    return value;
  }

  invalidate(userId: string): void {
    this.cache.delete(userId);
  }

  clearCache(): void {
    this.cache.clear();
  }

  /**
   * The entitlement gate. Throws ForbiddenException (AccountBlockState +
   * human message) when the user cannot act right now.
   */
  async assertCanAccess(user: RequestUser): Promise<void> {
    const result = await this.evaluateUser(user);
    if (result.allowed) return;
    throw new ForbiddenException({
      code: result.blockState ?? result.reason ?? 'NO_ENTITLEMENT',
      message: result.message ?? DIRECT_MESSAGES.NO_ENTITLEMENT,
      details: {
        source: result.source,
        expiresAt: result.expiresAt ? result.expiresAt.toISOString() : null,
        children: result.children.map((child) => ({
          studentId: child.studentId,
          source: child.source,
          expiresAt: child.expiresAt ? child.expiresAt.toISOString() : null,
        })),
      },
    });
  }

  private async computeEntitlement(user: RequestUser): Promise<UserEntitlement> {
    if (user.role === Role.SUPER_ADMIN) {
      return {
        allowed: true,
        source: EntitlementSource.INSTITUTION,
        directSubscription: null,
        expiresAt: null,
        children: [],
      };
    }

    if (await this.isDirectUser(user)) {
      if (user.role === Role.PARENT) {
        return this.parentEntitlement(user);
      }
      return this.directStudentEntitlement(user);
    }

    return this.institutionEntitlement(user);
  }

  private async institutionEntitlement(user: RequestUser): Promise<UserEntitlement> {
    const entitlement = await this.subscriptionAccess.evaluate(user.institutionId!);
    const allowed = entitlement.access;
    const blockState = entitlement.blockState;
    return {
      allowed,
      reason: blockState ? (blockState as EntitlementBlockReason) : undefined,
      source: EntitlementSource.INSTITUTION,
      institutionName: entitlement.institutionName || null,
      expiresAt: entitlement.expiresAt,
      children: [],
      blockState: blockState ?? undefined,
      message: blockState ? entitlement.blockMessage ?? undefined : undefined,
    };
  }

  private async directStudentEntitlement(user: RequestUser): Promise<UserEntitlement> {
    const active = await this.userActive(user.sub);
    if (active === false) {
      return {
        allowed: false,
        reason: 'USER_DISABLED',
        source: EntitlementSource.DIRECT_SANRO,
        directSubscription: null,
        expiresAt: null,
        children: [],
        blockState: 'USER_DISABLED',
        message: BLOCKED_ACCOUNT_MESSAGES.USER_DISABLED,
      };
    }

    const subscription = await this.findDirectSubscription(user.sub);
    const outcome = this.directSubscriptionOutcome(subscription);

    return {
      allowed: outcome.allowed,
      reason: outcome.reason,
      source: EntitlementSource.DIRECT_SANRO,
      directSubscription: outcome.summary,
      expiresAt: outcome.summary?.endsAt ?? null,
      children: [],
      blockState: outcome.blockState,
      message: outcome.message,
    };
  }

  private async parentEntitlement(user: RequestUser): Promise<UserEntitlement> {
    const active = await this.userActive(user.sub);
    if (active === false) {
      return {
        allowed: false,
        reason: 'USER_DISABLED',
        source: EntitlementSource.DIRECT_SANRO,
        directSubscription: null,
        expiresAt: null,
        children: [],
        blockState: 'USER_DISABLED',
        message: BLOCKED_ACCOUNT_MESSAGES.USER_DISABLED,
      };
    }

    const parent = await this.prisma.parent.findUnique({
      where: { userId: user.sub },
      include: {
        studentLinks: {
          include: { student: true },
          orderBy: { id: 'asc' },
        },
      },
    });

    const links = parent?.studentLinks ?? [];
    if (links.length === 0) {
      return {
        allowed: false,
        reason: 'NO_ENTITLEMENT',
        source: EntitlementSource.DIRECT_SANRO,
        directSubscription: null,
        expiresAt: null,
        children: [],
        blockState: 'NO_ENTITLEMENT',
        message:
          'No linked children found. Please contact SANRO support to link your child.',
      };
    }

    const children: ChildEntitlement[] = [];
    let allowed = false;
    let maxExpiresAt: Date | null = null;

    for (const link of links) {
      const child = await this.childEntitlement(link.student);
      children.push(child.entitlement);
      if (child.allowed) {
        allowed = true;
        if (
          child.entitlement.expiresAt &&
          (!maxExpiresAt || child.entitlement.expiresAt > maxExpiresAt)
        ) {
          maxExpiresAt = child.entitlement.expiresAt;
        }
      }
    }

    return {
      allowed,
      reason: allowed ? undefined : 'NO_ENTITLEMENT',
      source: EntitlementSource.DIRECT_SANRO,
      directSubscription: null,
      expiresAt: maxExpiresAt,
      children,
      blockState: allowed ? undefined : 'NO_ENTITLEMENT',
      message: allowed
        ? undefined
        : 'None of your linked children currently have an active SANRO entitlement.',
    };
  }

  private async childEntitlement(
    student: Prisma.StudentGetPayload<Record<string, never>>,
  ): Promise<{ entitlement: ChildEntitlement; allowed: boolean }> {
    const base = {
      studentId: student.id,
      name: student.name,
      institutionId: student.institutionId,
      enrolledGrade: student.grade,
    };

    if (await this.isDirectUser(student)) {
      if (!student.userId) {
        return {
          entitlement: {
            ...base,
            source: EntitlementSource.DIRECT_SANRO,
            expiresAt: null,
          },
          allowed: false,
        };
      }

      const subscription = await this.findDirectSubscription(student.userId);
      const outcome = this.directSubscriptionOutcome(subscription);
      return {
        entitlement: {
          ...base,
          source: EntitlementSource.DIRECT_SANRO,
          expiresAt: outcome.summary?.endsAt ?? null,
        },
        allowed: outcome.allowed,
      };
    }

    const result = await this.subscriptionAccess.evaluate(student.institutionId!);
    return {
      entitlement: {
        ...base,
        source: EntitlementSource.INSTITUTION,
        expiresAt: result.expiresAt,
      },
      allowed: result.access,
    };
  }

  private async findDirectSubscription(userId: string): Promise<SubWithPlan | null> {
    return this.prisma.subscription.findFirst({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private directSubscriptionOutcome(
    subscription: SubWithPlan | null,
  ): {
    allowed: boolean;
    reason?: EntitlementBlockReason;
    summary: DirectSubscriptionSummary | null;
    blockState?: AccountBlockState;
    message?: string;
  } {
    if (!subscription) {
      return {
        allowed: false,
        reason: 'NO_ENTITLEMENT',
        summary: null,
        blockState: 'NO_ENTITLEMENT',
        message: DIRECT_MESSAGES.NO_ENTITLEMENT,
      };
    }

    const planKey = subscription.plan.key;
    const endsAt = subscription.endsAt;
    const now = Date.now();
    const lapsed =
      !!endsAt &&
      endsAt.getTime() < now &&
      ENTITLED_DIRECT_STATUSES.includes(subscription.status as SubscriptionStatus);

    let status: SubscriptionStatus;
    let allowed: boolean;
    let blockState: AccountBlockState | undefined;
    let message: string | undefined;

    if (lapsed || subscription.status === 'EXPIRED') {
      status = 'EXPIRED';
      allowed = false;
      blockState = 'DIRECT_SUBSCRIPTION_EXPIRED';
      message = DIRECT_MESSAGES.DIRECT_SUBSCRIPTION_EXPIRED;
    } else if (subscription.status === 'SUSPENDED' || subscription.status === 'PAST_DUE') {
      status = subscription.status as SubscriptionStatus;
      allowed = false;
      blockState = 'DIRECT_SUBSCRIPTION_SUSPENDED';
      message = DIRECT_MESSAGES.DIRECT_SUBSCRIPTION_SUSPENDED;
    } else if (!ENTITLED_DIRECT_STATUSES.includes(subscription.status as SubscriptionStatus)) {
      status = subscription.status as SubscriptionStatus;
      allowed = false;
      blockState = 'NO_ENTITLEMENT';
      message = DIRECT_MESSAGES.NO_ENTITLEMENT;
    } else {
      status = subscription.status as SubscriptionStatus;
      allowed = true;
    }

    return {
      allowed,
      reason: allowed ? undefined : (blockState as EntitlementBlockReason),
      summary: { planKey, status, endsAt },
      blockState,
      message,
    };
  }

  private async userActive(userId: string): Promise<boolean | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });
    return user?.isActive ?? null;
  }
}