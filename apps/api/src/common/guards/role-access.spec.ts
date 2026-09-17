import { describe, it, expect } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { Role } from '@sanro/types';
import { ParentContentGuard, PARENT_RESTRICTED_KEY } from './parent-content.guard';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/auth.decorators';

function contextFor(user: { role: string } | undefined): any {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  };
}

function reflectorReturning(value: unknown): any {
  return {
    getAllAndOverride: () => value,
  };
}

describe('ParentContentGuard', () => {
  it('allows access when the route is not parent-restricted', () => {
    const guard = new ParentContentGuard(reflectorReturning(false));
    expect(guard.canActivate(contextFor({ role: Role.PARENT }))).toBe(true);
  });

  it('blocks parents from parent-restricted learning routes', () => {
    const guard = new ParentContentGuard(reflectorReturning(true));
    expect(() => guard.canActivate(contextFor({ role: Role.PARENT }))).toThrow(ForbiddenException);
  });

  it('allows students on parent-restricted routes', () => {
    const guard = new ParentContentGuard(reflectorReturning(true));
    expect(guard.canActivate(contextFor({ role: Role.STUDENT }))).toBe(true);
  });

  it('throws when there is no authenticated user', () => {
    const guard = new ParentContentGuard(reflectorReturning(true));
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(ForbiddenException);
  });

  it('uses the expected metadata key', () => {
    expect(PARENT_RESTRICTED_KEY).toBe('parentRestricted');
  });
});

describe('RolesGuard', () => {
  it('allows when no roles are required', () => {
    const guard = new RolesGuard(reflectorReturning([]));
    expect(guard.canActivate(contextFor({ role: Role.STUDENT }))).toBe(true);
  });

  it('allows a user whose role is permitted', () => {
    const guard = new RolesGuard(reflectorReturning([Role.INSTITUTION_ADMIN, Role.TEACHER]));
    expect(guard.canActivate(contextFor({ role: Role.TEACHER }))).toBe(true);
  });

  it('denies a user whose role is not permitted', () => {
    const guard = new RolesGuard(reflectorReturning([Role.INSTITUTION_ADMIN, Role.TEACHER]));
    expect(() => guard.canActivate(contextFor({ role: Role.STUDENT }))).toThrow(ForbiddenException);
  });

  it('denies when there is no authenticated user', () => {
    const guard = new RolesGuard(reflectorReturning([Role.STUDENT]));
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(ForbiddenException);
  });

  it('uses the expected roles metadata key', () => {
    expect(ROLES_KEY).toBe('sanro:roles');
  });
});
