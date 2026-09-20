import { Injectable } from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { RequestUser } from '../types/auth-context';

export const STUDENT_VISIBLE_STATUSES = ['APPROVED', 'PUBLISHED'] as const;

/**
 * Builds the Prisma where-clause that scopes `ContentItem` reads to the
 * content a given user may actually consume:
 *  - Institution-bound users see institution-owned content belonging to their
 *    institution plus platform content explicitly assigned to their institution.
 *  - Institution-less (DIRECT SANRO) users see platform content that is marked
 *    available on the direct product.
 *  - Only APPROVED / PUBLISHED content is ever consumer-visible.
 */
@Injectable()
export class ContentScopeService {
  buildContentWhere(user: RequestUser): Prisma.ContentItemWhereInput {
    const statusIn: ContentStatus[] = [...STUDENT_VISIBLE_STATUSES];
    if (user.institutionId) {
      return {
        status: { in: statusIn },
        OR: [
          { ownerType: 'INSTITUTION', institutionId: user.institutionId },
          { ownerType: 'PLATFORM', assignments: { some: { institutionId: user.institutionId } } },
        ],
      };
    }
    return {
      status: { in: statusIn },
      OR: [{ ownerType: 'PLATFORM', directSanroAvailable: true }],
    };
  }
}