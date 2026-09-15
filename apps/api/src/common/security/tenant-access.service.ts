import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@sanro/types';
import { RequestUser } from '../types/auth-context';

/**
 * Service-layer multi-tenant enforcement.
 *
 * Every institution-scoped flow must pass the requested `institutionId`
 * (from the JWT-bound tenant for non-super-admins) through this guard.
 * SUPER_ADMIN bypasses tenant scoping; every other role is bound to the
 * single institution encoded in their access token, which is re-issued on
 * context switch. This is defense-in-depth on top of DB-scoped queries.
 */
@Injectable()
export class TenantAccessService {
  assertInstitutionAccess(user: RequestUser, institutionId?: string): string {
    if (user.role === Role.SUPER_ADMIN) {
      return institutionId ?? '';
    }
    if (!user.institutionId) {
      throw new ForbiddenException('No institution context');
    }
    if (institutionId && user.institutionId !== institutionId) {
      throw new ForbiddenException('Access to another institution is forbidden');
    }
    return user.institutionId;
  }

  requireInstitution(user: RequestUser): string {
    if (user.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin is not bound to an institution');
    }
    if (!user.institutionId) {
      throw new ForbiddenException('No institution context');
    }
    return user.institutionId;
  }

  assertCanManageGroup(user: RequestUser, institutionId: string): void {
    this.assertInstitutionAccess(user, institutionId);
  }
}