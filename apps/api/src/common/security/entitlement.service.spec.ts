import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { Role, EntitlementSource } from '@sanro/types';
import { EntitlementService } from './entitlement.service';

const DAY = 86400000;

describe('EntitlementService', () => {
  let prisma: any;
  let subAccess: any;
  let service: EntitlementService;

  const makeDirectSubscription = (overrides: Record<string, any> = {}) => ({
    id: 'sub-direct-1',
    planId: 'plan-1',
    status: 'ACTIVE',
    startedAt: new Date(Date.now() - 10 * DAY),
    endsAt: new Date(Date.now() + 30 * DAY),
    seatLimit: 1,
    createdAt: new Date(),
    plan: { id: 'plan-1', key: 'STUDENT_YEARLY', name: 'Direct SANRO Plan', active: true },
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(async () => ({ isActive: true })),
      },
      parent: {
        findUnique: vi.fn(async () => null),
      },
      subscription: {
        findFirst: vi.fn(async () => makeDirectSubscription()),
      },
    };
    subAccess = {
      evaluate: vi.fn(async () => ({
        access: true,
        blockState: null,
        institutionName: 'QA School',
        expiresAt: new Date(Date.now() + 30 * DAY),
        institutionStatus: 'ACTIVE',
        seatLimit: 25,
        usagePct: 0,
        limitExceeded: false,
        subscription: null,
        billableUsers: 0,
        blockMessage: '',
      })),
      invalidate: vi.fn(),
    };
    service = new EntitlementService(prisma, subAccess);
  });

  describe('evaluateUser — SUPER_ADMIN', () => {
    it('returns full access without reading the store', async () => {
      const user = { sub: 'u-super', role: Role.SUPER_ADMIN } as any;

      const result = await service.evaluateUser(user);

      expect(result.allowed).toBe(true);
      expect(result.source).toBe(EntitlementSource.INSTITUTION);
      expect(result.expiresAt).toBeNull();
      expect(result.children).toEqual([]);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.subscription.findFirst).not.toHaveBeenCalled();
      expect(subAccess.evaluate).not.toHaveBeenCalled();
    });

    it('serves a cached entitlement without a second compute inside the TTL', async () => {
      const user = { sub: 'u-super', role: Role.SUPER_ADMIN } as any;

      await service.evaluateUser(user);
      await service.evaluateUser(user);

      expect(prisma.subscription.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('evaluateUser — INSTITUTION user', () => {
    it('returns access when the institution entitlement is healthy', async () => {
      const user = { sub: 'u-inst', role: Role.STUDENT, institutionId: 'inst-1' } as any;

      const result = await service.evaluateUser(user);

      expect(result.allowed).toBe(true);
      expect(result.source).toBe(EntitlementSource.INSTITUTION);
      expect(result.institutionName).toBe('QA School');
      expect(result.blockState).toBeUndefined();
      expect(subAccess.evaluate).toHaveBeenCalledWith('inst-1');
    });

    it('exposes the block state when the entitlement engine denies an institution user', async () => {
      subAccess.evaluate.mockResolvedValueOnce({
        access: false,
        blockState: 'INSTITUTION_SUSPENDED',
        institutionName: 'QA School',
        expiresAt: null,
        blockMessage: 'This institution has been suspended.',
      });
      const user = { sub: 'u-inst', role: Role.STUDENT, institutionId: 'inst-1' } as any;

      const result = await service.evaluateUser(user);

      expect(result.allowed).toBe(false);
      expect(result.source).toBe(EntitlementSource.INSTITUTION);
      expect(result.blockState).toBe('INSTITUTION_SUSPENDED');

      const error = await service.assertCanAccess(user).catch((e: any) => e);
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error.getResponse() as any).code).toBe('INSTITUTION_SUSPENDED');
    });
  });

  describe('evaluateUser — institution-less DIRECT SANRO user', () => {
    it('blocks a disabled user with USER_DISABLED before consulting subscription', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ isActive: false });
      const user = { sub: 'u-direct', role: Role.STUDENT } as any;

      const result = await service.evaluateUser(user);

      expect(result.allowed).toBe(false);
      expect(result.source).toBe(EntitlementSource.DIRECT_SANRO);
      expect(result.blockState).toBe('USER_DISABLED');
      expect(prisma.subscription.findFirst).not.toHaveBeenCalled();

      const error = await service.assertCanAccess(user).catch((e: any) => e);
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error.getResponse() as any).code).toBe('USER_DISABLED');
    });

    it('blocks a direct user with no subscription as NO_ENTITLEMENT', async () => {
      prisma.subscription.findFirst.mockResolvedValueOnce(null);
      const user = { sub: 'u-direct', role: Role.STUDENT } as any;

      const result = await service.evaluateUser(user);

      expect(result.allowed).toBe(false);
      expect(result.source).toBe(EntitlementSource.DIRECT_SANRO);
      expect(result.blockState).toBe('NO_ENTITLEMENT');
      expect(result.directSubscription).toBeNull();
    });

    it('returns access for a direct user with an ACTIVE DIRECT_SANRO subscription', async () => {
      const endsAt = new Date(Date.now() + 30 * DAY);
      prisma.subscription.findFirst.mockResolvedValueOnce(makeDirectSubscription({ endsAt }));
      const user = { sub: 'u-direct', role: Role.STUDENT } as any;

      const result = await service.evaluateUser(user);

      expect(result.allowed).toBe(true);
      expect(result.source).toBe(EntitlementSource.DIRECT_SANRO);
      expect(result.directSubscription?.status).toBe('ACTIVE');
      expect(result.directSubscription?.planKey).toBe('STUDENT_YEARLY');
      expect(result.expiresAt?.getTime()).toBe(endsAt.getTime());
    });

    it('blocks a lapsed direct subscription as DIRECT_SUBSCRIPTION_EXPIRED', async () => {
      prisma.subscription.findFirst.mockResolvedValueOnce(
        makeDirectSubscription({ status: 'ACTIVE', endsAt: new Date(Date.now() - DAY) }),
      );
      const user = { sub: 'u-direct', role: Role.STUDENT } as any;

      const result = await service.evaluateUser(user);

      expect(result.allowed).toBe(false);
      expect(result.blockState).toBe('DIRECT_SUBSCRIPTION_EXPIRED');
      expect(result.directSubscription?.status).toBe('EXPIRED');
    });
  });

  describe('evaluateUser — parent with linked children', () => {
    it('grants a parent entitlement through a DIRECT_SANRO child', async () => {
      const childEndsAt = new Date(Date.now() + 20 * DAY);
      prisma.parent.findUnique.mockResolvedValueOnce({
        id: 'parent-1',
        userId: 'u-parent',
        name: 'QA Parent',
        studentLinks: [
          {
            id: 'link-1',
            parentId: 'parent-1',
            studentId: 'child-1',
            student: {
              id: 'child-1',
              name: 'QA Kid',
              grade: '8',
              status: 'ACTIVE',
              institutionId: null,
              userId: 'child-user-1',
            },
          },
        ],
      });
      prisma.subscription.findFirst.mockResolvedValueOnce(
        makeDirectSubscription({ endsAt: childEndsAt }),
      );
      const user = { sub: 'u-parent', role: Role.PARENT } as any;

      const result = await service.evaluateUser(user);

      expect(result.allowed).toBe(true);
      expect(result.source).toBe(EntitlementSource.DIRECT_SANRO);
      expect(result.children).toHaveLength(1);
      expect(result.children[0].studentId).toBe('child-1');
      expect(result.children[0].source).toBe(EntitlementSource.DIRECT_SANRO);
      expect(result.children[0].expiresAt?.getTime()).toBe(childEndsAt.getTime());
      expect(result.expiresAt?.getTime()).toBe(childEndsAt.getTime());
    });

    it('derives entitlement for a parent whose child belongs to an ACTIVE institution', async () => {
      prisma.parent.findUnique.mockResolvedValueOnce({
        id: 'parent-2',
        userId: 'u-parent-2',
        name: 'QA Parent',
        studentLinks: [
          {
            id: 'link-2',
            parentId: 'parent-2',
            studentId: 'child-2',
            student: {
              id: 'child-2',
              name: 'QA Kid',
              grade: '10',
              status: 'ACTIVE',
              institutionId: 'inst-1',
              userId: 'child-user-2',
            },
          },
        ],
      });
      const user = { sub: 'u-parent-2', role: Role.PARENT } as any;

      const result = await service.evaluateUser(user);

      expect(result.allowed).toBe(true);
      expect(result.children[0].source).toBe(EntitlementSource.INSTITUTION);
      expect(subAccess.evaluate).toHaveBeenCalledWith('inst-1');
    });

    it('blocks a parent whose direct child has an expired subscription', async () => {
      prisma.parent.findUnique.mockResolvedValueOnce({
        id: 'parent-3',
        userId: 'u-parent-3',
        name: 'QA Parent',
        studentLinks: [
          {
            id: 'link-3',
            parentId: 'parent-3',
            studentId: 'child-3',
            student: {
              id: 'child-3',
              name: 'QA Kid',
              grade: '7',
              status: 'ACTIVE',
              institutionId: null,
              userId: 'child-user-3',
            },
          },
        ],
      });
      prisma.subscription.findFirst.mockResolvedValueOnce(
        makeDirectSubscription({ status: 'ACTIVE', endsAt: new Date(Date.now() - DAY) }),
      );
      const user = { sub: 'u-parent-3', role: Role.PARENT } as any;

      const result = await service.evaluateUser(user);

      expect(result.allowed).toBe(false);
      expect(result.blockState).toBe('NO_ENTITLEMENT');
      expect(result.children[0].source).toBe(EntitlementSource.DIRECT_SANRO);
      expect(result.children[0].expiresAt?.getTime()).toBeLessThan(Date.now());

      const error = await service.assertCanAccess(user).catch((e: any) => e);
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error.getResponse() as any).code).toBe('NO_ENTITLEMENT');
    });

    it('blocks a parent with no linked children as NO_ENTITLEMENT', async () => {
      prisma.parent.findUnique.mockResolvedValueOnce({
        id: 'parent-4',
        userId: 'u-parent-4',
        name: 'QA Parent',
        studentLinks: [],
      });
      const user = { sub: 'u-parent-4', role: Role.PARENT } as any;

      const result = await service.evaluateUser(user);

      expect(result.allowed).toBe(false);
      expect(result.blockState).toBe('NO_ENTITLEMENT');
      expect(prisma.subscription.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('evaluateEntitlement alias', () => {
    it('agrees with evaluateUser for a SUPER_ADMIN', async () => {
      const user = { sub: 'u-super', role: Role.SUPER_ADMIN } as any;

      const direct = await service.evaluateUser(user);
      const aliased = await service.evaluateEntitlement(user);

      expect(direct).toEqual(aliased);
      expect(aliased.allowed).toBe(true);
    });
  });
});