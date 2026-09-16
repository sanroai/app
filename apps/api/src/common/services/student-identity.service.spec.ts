import { describe, it, expect, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { StudentIdentityService } from './student-identity.service';
import { RequestUser } from '../types/auth-context';
import { Role } from '@sanro/types';

function buildMocks(overrides: Record<string, unknown> = {}) {
  const calls: unknown[] = [];
  const prisma: any = {
    student: {
      findFirst: async ({ where }: any) => {
        calls.push(where);
        return overrides.student ?? null;
      },
      update: async ({ where, data }: any) => ({ id: where.id, ...data }),
    },
    user: {
      findUnique: async () => overrides.profile ?? { email: 's@school.edu', phone: null },
    },
    ...(overrides.prisma ?? {}),
  };
  return { prisma, calls };
}

const studentUser: RequestUser = {
  sub: 'u-1',
  role: Role.STUDENT,
  institutionId: 'inst-1',
  name: 'Aarav',
  email: 's@school.edu',
  jti: 'jti-1',
};

describe('StudentIdentityService', () => {
  it('returns the Student linked by userId', async () => {
    const { prisma } = buildMocks({ student: { id: 's-1', userId: 'u-1' } });
    const svc = new StudentIdentityService(prisma);
    const result = await svc.resolveForUser(studentUser);
    expect(result).toEqual({ id: 's-1', userId: 'u-1' });
  });

  it('links an unlinked Student to the account by email and returns it', async () => {
    const db = [{ id: 's-7', institutionId: 'inst-1', userId: null, email: 's@school.edu' }];
    const prisma: any = {
      student: {
        findFirst: async ({ where }: any) =>
          (db.find((r) => (where?.userId ? r.userId === where.userId : r.userId === null)) ?? null),
        update: async ({ where, data }: any) => {
          const row = db.find((r) => r.id === where.id);
          if (!row) throw new Error('missing');
          Object.assign(row, data);
          return row;
        },
      },
      user: { findUnique: async () => ({ email: 's@school.edu', phone: null }) },
    };
    const svc = new StudentIdentityService(prisma);
    const first = await svc.resolveForUser(studentUser);
    expect(first).toMatchObject({ id: 's-7', userId: 'u-1' });
    const second = await svc.resolveForUser(studentUser);
    expect(second).toMatchObject({ id: 's-7', userId: 'u-1' });
  });

  it.each([Role.TEACHER, Role.PARENT, Role.SUPER_ADMIN])(
    'returns null for role %s without a Student link',
    async (role) => {
      const { prisma } = buildMocks({ student: null, profile: { email: null, phone: null } });
      const svc = new StudentIdentityService(prisma);
      const result = await svc.resolveForUser({ ...studentUser, role });
      expect(result).toBeNull();
    },
  );

  it('requireForUser throws a meaningful 404 when genuinely unresolvable', async () => {
    const { prisma } = buildMocks({ student: null, profile: { email: null, phone: null } });
    const svc = new StudentIdentityService(prisma);
    await expect(svc.requireForUser(studentUser)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('StudentIdentityService does not scan outside the user institution', () => {
  it('filters candidate students by the account institution', async () => {
    const { prisma, calls } = buildMocks({ student: null });
    const svc = new StudentIdentityService(prisma);
    await svc.resolveForUser(studentUser);
    expect(calls[1]).toMatchObject({ institutionId: 'inst-1', userId: null });
  });
});