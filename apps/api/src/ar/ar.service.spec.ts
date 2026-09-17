import { describe, it, expect, beforeEach } from 'vitest';
import { ArService } from './ar.service';
import { RequestUser } from '../common/types/auth-context';
import { Role } from '@sanro/types';

const INSTITUTION = 'inst-1';

const superAdmin: RequestUser = { sub: 'u-super', role: 'SUPER_ADMIN' as Role, jti: 'j-1' };
const institutionAdmin: RequestUser = {
  sub: 'u-admin',
  role: 'INSTITUTION_ADMIN' as Role,
  institutionId: INSTITUTION,
  jti: 'j-2',
};

function buildService() {
  const contentWhere: any[] = [];
  const activityWhere: any[] = [];
  const record = (list: any[]) => (args: any) => list.push(args?.where);

  const prisma: any = {
    arContent: {
      findMany: async (args: any) => {
        record(contentWhere)(args);
        return [];
      },
      groupBy: async (args: any) => {
        record(contentWhere)(args);
        return [];
      },
      count: async (args: any) => {
        record(contentWhere)(args);
        return 0;
      },
    },
    arActivity: {
      groupBy: async (args: any) => {
        record(activityWhere)(args);
        return [];
      },
    },
    concept: { findMany: async () => [] },
  };

  const service = new ArService(
    prisma,
    { requireInstitution: () => INSTITUTION } as any,
    { resolveForUser: async () => null } as any,
    {} as any,
    {} as any,
  );

  return { service, contentWhere, activityWhere };
}

describe('ArService admin scoping', () => {
  let ctx: ReturnType<typeof buildService>;

  beforeEach(() => {
    ctx = buildService();
  });

  it('super admin lists every AR item with no institution filter', async () => {
    await ctx.service.adminList(superAdmin);
    expect(ctx.contentWhere[0]).toEqual({});
  });

  it('institution admin lists global and own AR content but not other institutions', async () => {
    await ctx.service.adminList(institutionAdmin);
    expect(ctx.contentWhere[0]).toEqual({
      OR: [{ institutionId: null }, { institutionId: INSTITUTION }],
    });
  });

  it('institution usage counts global + own content and only own activity', async () => {
    await ctx.service.institutionUsage(institutionAdmin);
    expect(ctx.contentWhere.length).toBeGreaterThan(0);
    for (const where of ctx.contentWhere) {
      expect(where.OR).toEqual([{ institutionId: null }, { institutionId: INSTITUTION }]);
      expect(where.institutionId).toBeUndefined();
    }
    expect(ctx.activityWhere[0]).toEqual({ institutionId: INSTITUTION });
  });

  it('super admin usage is unscoped, or scoped to a requested institution', async () => {
    await ctx.service.institutionUsage(superAdmin);
    expect(ctx.contentWhere[0]).toEqual({});
    expect(ctx.activityWhere[0]).toEqual({});

    const requested = buildService();
    await requested.service.institutionUsage(superAdmin, INSTITUTION);
    expect(requested.contentWhere[0]).toEqual({ institutionId: INSTITUTION });
    expect(requested.activityWhere[0]).toEqual({ institutionId: INSTITUTION });
  });
});
