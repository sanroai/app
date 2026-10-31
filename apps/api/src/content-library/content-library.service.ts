import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, ContentType, Visibility, Prisma } from '@prisma/client';
import { AuditAction } from '@sanro/types';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { AuditService } from '../common/services/audit-notifications.service';
import { RequestUser } from '../common/types/auth-context';
import { canonicalTypeMembers } from '../common/content/content-types';

export type ContentRole = 'SUPER_ADMIN' | 'INSTITUTION_ADMIN' | 'TEACHER';

export interface ContentQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  boardId?: string;
  grade?: string;
  subjectId?: string;
  chapterId?: string;
  conceptId?: string;
  type?: ContentType;
  status?: ContentStatus;
  ownerType?: 'PLATFORM' | 'INSTITUTION';
  institutionId?: string;
  availableOnDirect?: boolean;
}

export interface CreateContentInput {
  type: ContentType;
  title: string;
  description?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
  url?: string;
  videoId?: string;
  grade?: string;
  boardId?: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  conceptId?: string;
  visibility?: Visibility;
  language?: string;
  order?: number;
  storageKey?: string;
  sourceType?: string;
  directSanroAvailable?: boolean;
}

const ALLOWED_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  DRAFT: ['REVIEW', 'APPROVED', 'ARCHIVED'],
  REVIEW: ['APPROVED', 'DRAFT', 'ARCHIVED'],
  APPROVED: ['REVIEW', 'PUBLISHED', 'ARCHIVED', 'DRAFT'],
  PUBLISHED: ['ARCHIVED', 'DRAFT'],
  ARCHIVED: ['DRAFT', 'REVIEW'],
};

const INSTITUTION_ROLES = new Set(['INSTITUTION_ADMIN', 'TEACHER']);

@Injectable()
export class ContentLibraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly audit: AuditService,
  ) {}

  private manageScope(user: RequestUser): Prisma.ContentItemWhereInput {
    if (user.role === 'SUPER_ADMIN') return {};
    const institutionId = this.tenant.requireInstitution(user);
    return {
      OR: [
        { ownerType: 'INSTITUTION', institutionId },
        { ownerType: 'PLATFORM', assignments: { some: { institutionId } } },
      ],
    };
  }

  private async assertCanManage(user: RequestUser, item?: { institutionId: string | null; ownerType: string; id?: string }) {
    if (user.role === 'SUPER_ADMIN') return;
    const institutionId = this.tenant.requireInstitution(user);
    if (!item) return;
    if (item.ownerType === 'INSTITUTION') {
      if (item.institutionId !== institutionId) throw new ForbiddenException('Not your institution content');
      return;
    }
    const assigned = await this.prisma.contentAssignment.findUnique({
      where: { contentId_institutionId: { contentId: item.id as unknown as string, institutionId } },
    });
    if (!assigned) throw new ForbiddenException('Platform content is not assigned to your institution');
  }

  async list(user: RequestUser, q: ContentQuery) {
    const page = q.page ?? 1;
    const pageSize = Math.min(q.pageSize ?? 20, 100);
    const scope = this.manageScope(user);

    const where: Prisma.ContentItemWhereInput = { ...scope };
    if (q.type) where.type = { in: canonicalTypeMembers(q.type) };
    if (q.status) where.status = q.status;
    if (q.ownerType) where.ownerType = q.ownerType;
    if (q.grade) where.grade = q.grade;
    if (q.boardId) where.subject = { boardId: q.boardId };
    if (q.subjectId) where.subjectId = q.subjectId;
    if (q.chapterId) where.chapterId = q.chapterId;
    if (q.conceptId) where.conceptId = q.conceptId;
    if (q.availableOnDirect !== undefined) where.directSanroAvailable = q.availableOnDirect;
    if (user.role === 'SUPER_ADMIN' && q.institutionId) {
      where.institutionId = q.institutionId;
    }
    if (q.search) {
      where.OR = [
        ...(where.OR && Array.isArray(where.OR) ? (where.OR as Prisma.ContentItemWhereInput[]) : []),
        { title: { contains: q.search, mode: 'insensitive' } },
        { description: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.contentItem.count({ where }),
      this.prisma.contentItem.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          subject: { select: { id: true, name: true } },
          chapter: { select: { id: true, name: true, grade: true } },
          concept: { select: { id: true, name: true } },
          institution: { select: { id: true, name: true } },
          _count: { select: { assignments: true, progress: true } },
        },
      }),
    ]);

    return { total, page, pageSize, rows };
  }

  async detail(user: RequestUser, id: string) {
    const item = await this.prisma.contentItem.findUnique({
      where: { id },
      include: {
        subject: true,
        chapter: true,
        concept: true,
        institution: { select: { id: true, name: true, code: true } },
        assignments: { include: { institution: { select: { id: true, name: true } } } },
        versions: { orderBy: { version: 'desc' }, take: 20 },
        _count: { select: { progress: true } },
      },
    });
    if (!item) throw new NotFoundException('Content not found');
    await this.assertCanManage(user, item);
    return item;
  }

  async create(user: RequestUser, input: CreateContentInput) {
    const isSuper = user.role === 'SUPER_ADMIN';
    const isInstitutionRole = INSTITUTION_ROLES.has(user.role);
    if (!isSuper && !isInstitutionRole) throw new ForbiddenException('Only admins can create content');

    let institutionId: string | null = null;
    let ownerType: 'PLATFORM' | 'INSTITUTION' = 'PLATFORM';
    if (isInstitutionRole) {
      institutionId = this.tenant.requireInstitution(user);
      ownerType = 'INSTITUTION';
    }

    let grade = input.grade ?? null;
    if (!grade && input.chapterId) {
      const chapter = await this.prisma.chapter.findUnique({ where: { id: input.chapterId } });
      if (chapter) grade = chapter.grade;
    }

    const item = await this.prisma.contentItem.create({
      data: {
        type: input.type,
        status: ContentStatus.DRAFT,
        visibility: input.visibility ?? (isSuper ? Visibility.PUBLIC : Visibility.INSTITUTION_ONLY),
        title: input.title.trim(),
        description: input.description?.trim() || null,
        durationSeconds: input.durationSeconds ?? null,
        thumbnailUrl: input.thumbnailUrl?.trim() || null,
        url: input.url?.trim() || null,
        videoId: input.videoId || null,
        order: input.order ?? 0,
        ownerType,
        directSanroAvailable: isSuper ? (input.directSanroAvailable ?? false) : false,
        institutionId,
        boardId: input.boardId ?? null,
        subjectId: input.subjectId ?? null,
        chapterId: input.chapterId ?? null,
        topicId: input.topicId ?? null,
        conceptId: input.conceptId ?? null,
        grade,
        storageKey: input.storageKey || null,
        sourceType: (input.sourceType as Prisma.ContentItemCreateInput['sourceType']) ?? null,
        language: (input.language ?? 'EN') as 'EN',
        createdById: user.sub,
      },
    });

    await this.audit.log({
      userId: user.sub,
      institutionId,
      action: AuditAction.CONTENT_CREATED,
      entityType: 'CONTENT',
      entityId: item.id,
      metadata: { title: item.title, type: item.type },
    });

    return item;
  }

  async update(user: RequestUser, id: string, input: Record<string, unknown>) {
    const current = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Content not found');
    await this.assertCanManage(user, current);

    const allowedFields: (keyof Prisma.ContentItemUpdateInput)[] = [
      'title', 'description', 'durationSeconds', 'thumbnailUrl', 'url', 'videoId', 'order',
      'visibility', 'language', 'reviewNote', 'storageKey', 'directSanroAvailable',
    ];
    const data: Prisma.ContentItemUncheckedUpdateInput = {
      version: { increment: 1 },
    };
    for (const field of allowedFields) {
      if (field in input && input[field] !== undefined) {
        (data as Record<string, unknown>)[field] = input[field] === null ? null : input[field];
      }
    }
    if (current.ownerType === 'PLATFORM' && user.role === 'SUPER_ADMIN') {
      if ('grade' in input) data.grade = (input.grade as string) || null;
      if ('boardId' in input) data.boardId = (input.boardId as string) || null;
      if ('subjectId' in input) data.subjectId = (input.subjectId as string) || null;
      if ('chapterId' in input) data.chapterId = (input.chapterId as string) || null;
      if ('topicId' in input) data.topicId = (input.topicId as string) || null;
      if ('conceptId' in input) data.conceptId = (input.conceptId as string) || null;
    }

    const item = await this.prisma.contentItem.update({ where: { id }, data });

    await this.prisma.contentVersion.create({
      data: {
        contentId: id,
        version: item.version,
        title: current.title,
        description: current.description,
        url: current.url,
        snapshot: {
          title: current.title,
          description: current.description,
          url: current.url,
          status: current.status,
          visibility: current.visibility,
        },
        createdById: user.sub,
      },
    });

    await this.audit.log({
      userId: user.sub,
      institutionId: current.institutionId,
      action: AuditAction.CONTENT_UPDATED,
      entityType: 'CONTENT',
      entityId: id,
      metadata: { title: item.title },
    });

    return { ...item, version: current.version };
  }

  async transition(user: RequestUser, id: string, to: ContentStatus, note?: string) {
    const item = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Content not found');
    await this.assertCanManage(user, item);

    const allowed = ALLOWED_TRANSITIONS[item.status];
    if (!allowed?.includes(to)) {
      throw new BadRequestException(`Cannot transition from ${item.status} to ${to}`);
    }

    const data: Prisma.ContentItemUpdateInput = { status: to, version: { increment: 1 } };
    if (to === 'APPROVED' || to === 'PUBLISHED') {
      data.reviewedById = user.sub;
    }
    if (to === 'PUBLISHED') data.publishedAt = new Date();
    if (to === 'ARCHIVED') data.archivedAt = new Date();
    if (note) data.reviewNote = note;

    const updated = await this.prisma.contentItem.update({ where: { id }, data });

    await this.audit.log({
      userId: user.sub,
      institutionId: item.institutionId,
      action: to === 'PUBLISHED' ? AuditAction.CONTENT_PUBLISHED : AuditAction.CONTENT_STATUS_CHANGED,
      entityType: 'CONTENT',
      entityId: id,
      metadata: { from: item.status, to, note },
    });

    return updated;
  }

  async archive(user: RequestUser, id: string) {
    return this.transition(user, id, ContentStatus.ARCHIVED);
  }

  async assign(user: RequestUser, id: string, institutionId: string) {
    const item = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Content not found');
    if (item.ownerType === 'INSTITUTION') {
      if (item.institutionId !== (user.role === 'SUPER_ADMIN' ? institutionId : user.institutionId)) {
        throw new BadRequestException('Institution-owned content cannot be assigned elsewhere');
      }
      return { alreadyOwner: true, assigned: true };
    }

    const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institution not found');

    if (user.role !== 'SUPER_ADMIN' && user.institutionId !== institutionId) {
      throw new ForbiddenException('Cannot assign to another institution');
    }
    if (item.status === 'ARCHIVED' || item.status === 'DRAFT') {
      throw new BadRequestException(`Cannot assign ${item.status} content; publish it first`);
    }
    if (item.visibility === Visibility.PRIVATE) {
      throw new BadRequestException('Private content cannot be assigned');
    }

    await this.prisma.contentAssignment.upsert({
      where: { contentId_institutionId: { contentId: id, institutionId } },
      create: { contentId: id, institutionId, assignedById: user.sub },
      update: {},
    });

    await this.audit.log({
      userId: user.sub,
      institutionId,
      action: AuditAction.CONTENT_ASSIGNED,
      entityType: 'CONTENT',
      entityId: id,
      metadata: { contentTitle: item.title, toInstitutionId: institutionId },
    });

    return { assigned: true, contentId: id, institutionId };
  }

  async unassign(user: RequestUser, id: string, institutionId: string) {
    const item = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Content not found');
    await this.assertCanManage(user, item);

    const result = await this.prisma.contentAssignment.deleteMany({
      where: { contentId: id, institutionId },
    });

    await this.audit.log({
      userId: user.sub,
      institutionId,
      action: AuditAction.CONTENT_UNASSIGNED,
      entityType: 'CONTENT',
      entityId: id,
      metadata: { contentTitle: item.title, fromInstitutionId: institutionId },
    });

    return { unassigned: result.count, contentId: id, institutionId };
  }

  async setAvailability(user: RequestUser, id: string, directSanroAvailable: boolean) {
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Only super admin can change availability');
    const item = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Content not found');
    if (item.ownerType !== 'PLATFORM') {
      throw new BadRequestException('Availability applies to platform content only');
    }
    return this.prisma.contentItem.update({ where: { id }, data: { directSanroAvailable } });
  }

  async remove(user: RequestUser, id: string) {
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Only super admin can delete content');
    const item = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Content not found');
    await this.prisma.contentAssignment.deleteMany({ where: { contentId: id } });
    await this.prisma.contentItem.delete({ where: { id } });

    await this.audit.log({
      userId: user.sub,
      institutionId: item.institutionId,
      action: AuditAction.CONTENT_DELETED,
      entityType: 'CONTENT',
      entityId: id,
      metadata: { title: item.title },
    });

    return { deleted: true };
  }

  async listAssignments(user: RequestUser, institutionId?: string) {
    const isSuper = user.role === 'SUPER_ADMIN';
    if (!isSuper && institutionId && institutionId !== user.institutionId) {
      throw new ForbiddenException('Cannot view assignments of another institution');
    }
    const scope = institutionId ?? (isSuper ? undefined : user.institutionId);
    if (!scope && !isSuper) {
      throw new ForbiddenException('institutionId is required');
    }
    const rows = await this.prisma.contentAssignment.findMany({
      where: { institutionId: scope },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            grade: true,
            ownerType: true,
            directSanroAvailable: true,
            subject: { select: { name: true } },
            chapter: { select: { name: true, grade: true } },
            concept: { select: { name: true } },
          },
        },
        institution: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows;
  }
}