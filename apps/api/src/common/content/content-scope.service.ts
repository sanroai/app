import { Injectable } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { SystemInstitutionService } from '../security/system-institution.service';
import { RequestUser } from '../types/auth-context';

export const STUDENT_VISIBLE_STATUSES = ['APPROVED', 'PUBLISHED'] as const;

let systemInstitutionService: SystemInstitutionService | null = null;
let systemId: string | null = null;
let resolving: Promise<void> | null = null;

function ensureSystemId(): void {
  if (resolving !== null) return;
  resolving = (async () => {
    try {
      systemId = (await systemInstitutionService?.systemInstitutionId()) || null;
    } catch {
      systemId = null;
    } finally {
      resolving = null;
    }
  })();
}

function isDirectUser(user: RequestUser): boolean {
  if (!user.institutionId) return true;
  if (systemId !== null) return user.institutionId === systemId;
  return false;
}

/**
 * Builds the Prisma where-clause that scopes `ContentItem` reads to the
 * content a given user may actually consume:
 *  - Institution-bound users see institution-owned content belonging to their
 *    institution plus platform content explicitly assigned to their institution.
 *  - Institution-less (DIRECT SANRO) users — including members of the SANRO AI
 *    system institution — see platform content that is marked available on the
 *    direct product plus institution-owned content of the system institution.
 *  - Only APPROVED / PUBLISHED content is ever consumer-visible.
 */
@Injectable()
export class ContentScopeService {
  constructor(systemInstitution: SystemInstitutionService) {
    systemInstitutionService = systemInstitution;
    if (systemId === null) {
      ensureSystemId();
    }
  }

  buildContentWhere(user: RequestUser): Prisma.ContentItemWhereInput {
    const statusIn: ContentStatus[] = [...STUDENT_VISIBLE_STATUSES];
    if (user.institutionId && !isDirectUser(user)) {
      return {
        status: { in: statusIn },
        OR: [
          { ownerType: 'INSTITUTION', institutionId: user.institutionId },
          { ownerType: 'PLATFORM', assignments: { some: { institutionId: user.institutionId } } },
        ],
      };
    }
    if (systemId === null) {
      ensureSystemId();
    }
    const or: Prisma.ContentItemWhereInput[] = [{ ownerType: 'PLATFORM', directSanroAvailable: true }];
    if (systemId !== null) {
      or.push({ ownerType: 'INSTITUTION', institutionId: systemId });
    }
    return {
      status: { in: statusIn },
      OR: or,
    };
  }
}