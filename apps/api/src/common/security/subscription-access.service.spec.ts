import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { SubscriptionAccessService } from './subscription-access.service';
import { Role } from '@sanro/types';

const DAY = 86400000;

describe('SubscriptionAccessService', () => {
  let institution: Record<string, any>;
  let subscription: Record<string, any>;
  let prisma: any;
  let service: SubscriptionAccessService;

  beforeEach(() => {
    subscription = {
      id: 'sub-1',
      planId: 'plan-1',
      status: 'ACTIVE',
      startedAt: new Date(Date.now() - 10 * DAY),
      endsAt: new Date(Date.now() + 30 * DAY),
      seatLimit: 25,
      createdAt: new Date(),
      plan: { id: 'plan-1', key: 'INSTITUTION', name: 'Institution Plan', active: true },
    };
    institution = {
      id: 'inst-1',
      name: 'QA School',
      type: 'SCHOOL',
      status: 'ACTIVE',
      seatLimit: null,
      gracePeriodDays: 0,
      expiredAt: null,
      suspendedAt: null,
      archivedAt: null,
      subscriptions: [subscription],
    };

    prisma = {
      institution: {
        findUnique: vi.fn(async () => institution),
        update: vi.fn(async (args: any) => {
          institution = { ...institution, ...args.data };
          return institution;
        }),
      },
      subscription: {
        findFirst: vi.fn(async () => subscription),
        update: vi.fn(async (args: any) => {
          subscription = { ...subscription, ...args.data };
          return subscription;
        }),
      },
      $transaction: vi.fn(async (ops: any[]) => {
        for (const op of ops) await op;
        return [];
      }),
      student: { count: vi.fn(async () => 10) },
      teacher: { count: vi.fn(async () => 3) },
      parent: { count: vi.fn(async () => 2) },
      institutionMember: {
        count: vi.fn(async () => 1),
        findUnique: vi.fn(async () => ({ status: 'ACTIVE' })),
      },
      user: { findUnique: vi.fn(async () => ({ isActive: true })) },
    };

    service = new SubscriptionAccessService(prisma, {} as any);
  });

  describe('evaluate', () => {
    it('returns access=true with subscription data for a healthy ACTIVE institution', async () => {
      const result = await service.evaluate('inst-1');
      expect(result.access).toBe(true);
      expect(result.blockState).toBeNull();
      expect(result.institutionStatus).toBe('ACTIVE');
      expect(result.seatLimit).toBe(25);
      expect(result.subscription?.status).toBe('ACTIVE');
      expect(result.subscription?.expiringSoon).toBe(true);
      expect(result.billableUsers).toBe(16);
      expect(result.usagePct).toBe(64);
      expect(result.limitExceeded).toBe(false);
    });

    it('lazy-expires an ended ACTIVE subscription and blocks on the next read', async () => {
      subscription.endsAt = new Date(Date.now() - DAY);

      // Current lazy semantics: the call that triggers the transition still
      // reports access for the in-flight request; subsequent reads block.
      const first = await service.evaluate('inst-1');
      expect(first.access).toBe(true);
      expect(first.blockState).toBeNull();

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'sub-1' }, data: { status: 'EXPIRED' } }),
      );
      expect(prisma.institution.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'inst-1' }, data: expect.objectContaining({ status: 'EXPIRED' }) }),
      );

      service.invalidate('inst-1');
      const second = await service.evaluate('inst-1');
      expect(second.access).toBe(false);
      expect(second.blockState).toBe('SUBSCRIPTION_EXPIRED');
      expect(second.institutionStatus).toBe('EXPIRED');
    });

    it('does not touch an already suspended institution during lazy expiry', async () => {
      institution.status = 'SUSPENDED';
      subscription.endsAt = new Date(Date.now() - DAY);

      const result = await service.evaluate('inst-1');
      expect(result.blockState).toBe('INSTITUTION_SUSPENDED');
      expect(prisma.institution.update).not.toHaveBeenCalled();
    });

    it('reports INSTITUTION_ARCHIVED for an archived institution', async () => {
      institution.status = 'ARCHIVED';
      const result = await service.evaluate('inst-1');
      expect(result.access).toBe(false);
      expect(result.blockState).toBe('INSTITUTION_ARCHIVED');
    });

    it('falls back to INSTITUTION_ARCHIVED when the institution is missing', async () => {
      prisma.institution.findUnique.mockResolvedValueOnce(null);
      const result = await service.evaluate('inst-1');
      expect(result.access).toBe(false);
      expect(result.blockState).toBe('INSTITUTION_ARCHIVED');
      expect(result.institutionName).toBe('');
    });

    it('treats a null seat limit as unlimited', async () => {
      subscription.seatLimit = null;
      institution.seatLimit = null;
      const result = await service.evaluate('inst-1');
      expect(result.seatLimit).toBeNull();
      expect(result.usagePct).toBe(0);
      expect(result.limitExceeded).toBe(false);
    });

    it('flags limitExceeded when billable users exceed the seat limit', async () => {
      subscription.seatLimit = 5;
      const result = await service.evaluate('inst-1');
      expect(result.limitExceeded).toBe(true);
    });

    it('serves a cached entitlement without a second DB read inside the TTL', async () => {
      await service.evaluate('inst-1');
      await service.evaluate('inst-1');
      expect(prisma.institution.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('countBillableUsers', () => {
    it('sums ACTIVE students, ACTIVE teachers, parents and ACTIVE INSTITUTION_ADMIN memberships', async () => {
      const total = await service.countBillableUsers('inst-1');
      expect(total).toBe(16);
      expect(prisma.student.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { institutionId: 'inst-1', status: 'ACTIVE' } }),
      );
      expect(prisma.institutionMember.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { institutionId: 'inst-1', status: 'ACTIVE', role: 'INSTITUTION_ADMIN' } }),
      );
    });
  });

  describe('assertSeatAvailable', () => {
    it('resolves when the seat limit is null (unlimited)', async () => {
      subscription.seatLimit = null;
      institution.seatLimit = null;
      await expect(service.assertSeatAvailable('inst-1')).resolves.toBeUndefined();
    });

    it('resolves when there is capacity for the requested seats', async () => {
      await expect(service.assertSeatAvailable('inst-1', 2)).resolves.toBeUndefined();
    });

    it('throws USER_LIMIT_REACHED when there is no remaining capacity', async () => {
      subscription.seatLimit = 15; // 16 billable already
      const error = await service.assertSeatAvailable('inst-1').catch((e: any) => e);
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error.getResponse() as any).code).toBe('USER_LIMIT_REACHED');
      expect((error.getResponse() as any).details).toEqual({ current: 16, requested: 1, limit: 15 });
    });
  });

  describe('assertCanAccess', () => {
    it('always allows SUPER_ADMIN without hitting the store', async () => {
      const user = { sub: 'u-1', role: Role.SUPER_ADMIN, institutionId: undefined } as any;
      await expect(service.assertCanAccess(user)).resolves.toBeUndefined();
      expect(prisma.institution.findUnique).not.toHaveBeenCalled();
    });

    it('blocks a disabled user with USER_DISABLED', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ isActive: false });
      const user = { sub: 'u-1', role: Role.TEACHER, institutionId: 'inst-1' } as any;
      const error = await service.assertCanAccess(user).catch((e: any) => e);
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error.getResponse() as any).code).toBe('USER_DISABLED');
    });

    it('blocks a deactivated membership with MEMBERSHIP_DEACTIVATED', async () => {
      prisma.institutionMember.findUnique.mockResolvedValueOnce({ status: 'INACTIVE' });
      const user = { sub: 'u-1', role: Role.TEACHER, institutionId: 'inst-1' } as any;
      const error = await service.assertCanAccess(user).catch((e: any) => e);
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error.getResponse() as any).code).toBe('MEMBERSHIP_DEACTIVATED');
    });

    it('blocks a suspended institution with INSTITUTION_SUSPENDED', async () => {
      institution.status = 'SUSPENDED';
      const user = { sub: 'u-1', role: Role.TEACHER, institutionId: 'inst-1' } as any;
      const error = await service.assertCanAccess(user).catch((e: any) => e);
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error.getResponse() as any).code).toBe('INSTITUTION_SUSPENDED');
    });

    it('resolves for a healthy active member', async () => {
      const user = { sub: 'u-1', role: Role.TEACHER, institutionId: 'inst-1' } as any;
      await expect(service.assertCanAccess(user)).resolves.toBeUndefined();
    });
  });

  describe('getAccountState', () => {
    it('returns unbound access for SUPER_ADMIN', async () => {
      const state = await service.getAccountState('u-1', Role.SUPER_ADMIN);
      expect(state.access).toBe(true);
      expect(state.institution).toBeNull();
    });

    it('returns MEMBERSHIP_DEACTIVATED without an institution context', async () => {
      const state = await service.getAccountState('u-1', Role.STUDENT);
      expect(state.access).toBe(false);
      expect(state.state).toBe('MEMBERSHIP_DEACTIVATED');
    });

    it('returns USER_DISABLED for an inactive user', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ isActive: false });
      const state = await service.getAccountState('u-1', Role.STUDENT, 'inst-1');
      expect(state.access).toBe(false);
      expect(state.state).toBe('USER_DISABLED');
    });

    it('exposes the entitlement state for a blocked institution', async () => {
      institution.status = 'SUSPENDED';
      const state = await service.getAccountState('u-1', Role.STUDENT, 'inst-1');
      expect(state.access).toBe(false);
      expect(state.state).toBe('INSTITUTION_SUSPENDED');
      expect(state.institution?.status).toBe('SUSPENDED');
    });

    it('returns access=true with a snapshot for a healthy institution', async () => {
      const state = await service.getAccountState('u-1', Role.STUDENT, 'inst-1');
      expect(state.access).toBe(true);
      expect(state.state).toBeNull();
      expect(state.institution?.id).toBe('inst-1');
      expect((state.institution?.subscription as any)?.['status']).toBe('ACTIVE');
      expect((state.institution as any).seatLimit).toBe(25);
    });
  });
});