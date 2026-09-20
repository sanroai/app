import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { ContentScopeService, STUDENT_VISIBLE_STATUSES } from '../common/content/content-scope.service';
import { ContentType, ContentStatus, Visibility, Prisma } from '@prisma/client';
import { StudentIdentityService } from '../common/services/student-identity.service';

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly identity: StudentIdentityService,
    private readonly scope: ContentScopeService,
  ) {}

  private visibleWhere(user: RequestUser): Prisma.ContentItemWhereInput {
    const base = this.scope.buildContentWhere(user);
    const where: Prisma.ContentItemWhereInput = { ...base };
    return where;
  }

  async list(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const ands: Prisma.ContentItemWhereInput[] = [this.visibleWhere(user)];
    if (query.type) ands.push({ type: query.type as ContentType });
    if (query.subjectId) ands.push({ subjectId: query.subjectId });
    if (query.chapterId) ands.push({ chapterId: query.chapterId });
    if (query.conceptId) ands.push({ conceptId: query.conceptId });
    if (query.grade) ands.push({ grade: query.grade });
    if (query.search) {
      ands.push({
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }

    return this.prisma.contentItem.findMany({
      where: { AND: ands },
      orderBy: [{ conceptId: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
      take: Math.min(Number(query.pageSize) || 50, 100),
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        durationSeconds: true,
        thumbnailUrl: true,
        url: true,
        language: true,
        subjectId: true,
        chapterId: true,
        conceptId: true,
        concept: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true } },
      },
    });
  }

  async detail(user: RequestUser, id: string) {
    const item = await this.prisma.contentItem.findFirst({
      where: {
        id,
        ...this.visibleWhere(user),
      },
      include: {
        concept: true,
        chapter: true,
        subject: true,
        progress: { where: { studentId: user.sub } },
      },
    });
    if (!item) throw new NotFoundException('Content not found');
    return item;
  }

  async getVersionHistory(user: RequestUser, contentId: string) {
    let item: { id: string } | null;
    if (user.role === 'SUPER_ADMIN') {
      item = await this.prisma.contentItem.findUnique({ where: { id: contentId }, select: { id: true } });
    } else {
      const institutionId = this.tenant.requireInstitution(user);
      item = await this.prisma.contentItem.findFirst({
        where: { id: contentId, institutionId },
        select: { id: true },
      });
    }
    if (!item) throw new NotFoundException('Content not found');

    const versions = await this.prisma.contentVersion.findMany({
      where: { contentId },
      orderBy: { version: 'desc' },
      take: 20,
    });

    const content = await this.prisma.contentItem.findUnique({ where: { id: contentId }, select: { version: true } });
    return { currentVersion: content?.version ?? 1, versions };
  }

  async restoreVersion(user: RequestUser, contentId: string, version: number) {
    const institutionId = this.tenant.requireInstitution(user);
    if (user.role !== 'INSTITUTION_ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only admins can restore versions');
    }

    const item = user.role === 'SUPER_ADMIN'
      ? await this.prisma.contentItem.findUnique({ where: { id: contentId } })
      : await this.prisma.contentItem.findFirst({ where: { id: contentId, institutionId } });
    if (!item) throw new NotFoundException('Content not found');

    const versionRecord = await this.prisma.contentVersion.findFirst({
      where: { contentId, version },
    });
    if (!versionRecord) throw new NotFoundException('Version not found');

    const snapshot = versionRecord.snapshot as any;
    const newVersion = item.version + 1;

    await this.prisma.contentVersion.create({
      data: {
        contentId,
        version: newVersion,
        title: item.title,
        description: item.description,
        url: item.url,
        snapshot: { title: item.title, description: item.description, url: item.url, status: item.status },
        createdById: user.sub,
      },
    });

    return this.prisma.contentItem.update({
      where: { id: contentId },
      data: {
        title: snapshot.title,
        description: snapshot.description,
        url: snapshot.url,
        version: newVersion,
      },
    });
  }

  async create(
    user: RequestUser,
    data: {
      type: ContentType;
      title: string;
      description?: string;
      durationSeconds?: number;
      thumbnailUrl?: string;
      url?: string;
      visibility?: Visibility;
      subjectId?: string;
      chapterId?: string;
      topicId?: string;
      conceptId?: string;
      language?: string;
      grade?: string;
    },
  ) {
    const isSuper = user.role === 'SUPER_ADMIN';
    let institutionId: string | null = null;
    if (!isSuper) {
      institutionId = this.tenant.requireInstitution(user);
      if (user.role === 'STUDENT' || user.role === 'PARENT') {
        throw new ForbiddenException('Students and parents cannot create content');
      }
    }

    let grade = data.grade ?? null;
    if (!grade && data.chapterId) {
      const chapter = await this.prisma.chapter.findUnique({ where: { id: data.chapterId } });
      if (chapter) grade = chapter.grade;
    }

    return this.prisma.contentItem.create({
      data: {
        type: data.type,
        status: isSuper ? ContentStatus.APPROVED : ContentStatus.DRAFT,
        visibility:
          data.visibility ??
          (isSuper ? Visibility.PUBLIC : Visibility.INSTITUTION_ONLY),
        title: data.title,
        description: data.description ?? null,
        durationSeconds: data.durationSeconds ?? null,
        thumbnailUrl: data.thumbnailUrl ?? null,
        url: data.url ?? null,
        ownerType: isSuper ? 'PLATFORM' : 'INSTITUTION',
        directSanroAvailable: false,
        institutionId,
        subjectId: data.subjectId ?? null,
        chapterId: data.chapterId ?? null,
        topicId: data.topicId ?? null,
        conceptId: data.conceptId ?? null,
        grade,
        language: (data.language as 'EN' | 'MR' | 'HI') ?? 'EN',
        createdById: user.sub,
      },
    });
  }

  async recordProgress(
    user: RequestUser,
    contentId: string,
    body: { state: string; secondsWatched?: number },
  ) {
    const student = await this.identity.resolveForUser(user);
    if (!student) throw new ForbiddenException('Only students track progress');
    const states = ['NOT_STARTED', 'STARTED', 'QUARTER', 'HALF', 'THREE_QUARTER', 'COMPLETED'] as const;
    const state = states.includes(body.state as (typeof states)[number])
      ? (body.state as (typeof states)[number])
      : 'STARTED';
    await this.prisma.contentProgress.upsert({
      where: { contentId_studentId: { contentId, studentId: student.id } },
      create: { contentId, studentId: student.id, state, secondsWatched: body.secondsWatched ?? null },
      update: { state, secondsWatched: body.secondsWatched ?? undefined },
    });
    return { ok: true };
  }

  async updateStatus(user: RequestUser, id: string, status: ContentStatus) {
    if (user.role !== 'INSTITUTION_ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only admins can change content status');
    }
    const item = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Content not found');
    if (user.role === 'INSTITUTION_ADMIN') {
      const institutionId = this.tenant.requireInstitution(user);
      if (item.institutionId !== institutionId) throw new ForbiddenException('Not your institution content');
    }

    const allowedTransitions: Record<ContentStatus, ContentStatus[]> = {
      DRAFT: ['REVIEW', 'APPROVED', 'ARCHIVED'],
      REVIEW: ['APPROVED', 'DRAFT', 'ARCHIVED'],
      APPROVED: ['REVIEW', 'PUBLISHED', 'ARCHIVED', 'DRAFT'],
      PUBLISHED: ['ARCHIVED', 'DRAFT'],
      ARCHIVED: ['DRAFT', 'REVIEW'],
    };
    if (!allowedTransitions[item.status]?.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${item.status} to ${status}`);
    }

    const data: Prisma.ContentItemUpdateInput = { status, version: { increment: 1 } };
    if (status === 'PUBLISHED') data.publishedAt = new Date();
    if (status === 'ARCHIVED') data.archivedAt = new Date();
    if (status === 'APPROVED' || status === 'PUBLISHED') data.reviewedById = user.sub;

    return this.prisma.contentItem.update({
      where: { id },
      data,
    });
  }

  async completenessMatrix(user: RequestUser, boardId?: string, grade?: string) {
    const isSuper = user.role === 'SUPER_ADMIN';
    const institutionId = isSuper ? null : this.tenant.requireInstitution(user);

    const where: any = institutionId ? { institutionId } : { ownerType: 'PLATFORM' };
    if (boardId) where.boardId = boardId;

    const chapters = await this.prisma.chapter.findMany({
      where: grade ? { grade } : {},
      include: {
        topics: {
          include: {
            concepts: true,
          },
        },
        subject: { select: { id: true, name: true, boardId: true } },
      },
      orderBy: [{ subject: { name: 'asc' } }, { order: 'asc' }],
    });

    const contentCounts = await this.prisma.contentItem.groupBy({
      by: ['chapterId', 'conceptId', 'type', 'status'],
      where: { ...where, status: { in: ['APPROVED', 'PUBLISHED'] } },
      _count: true,
    });

    const matrix = chapters.map((ch) => {
      const totalConcepts = ch.topics.reduce((acc, t) => acc + t.concepts.length, 0);
      const conceptsCovered = new Set(
        contentCounts
          .filter((c) => c.chapterId === ch.id && c.status !== 'DRAFT' && c.status !== 'ARCHIVED')
          .map((c) => c.conceptId)
          .filter(Boolean)
      ).size;

      const contentByType: Record<string, number> = {};
      contentCounts
        .filter((c) => c.chapterId === ch.id && c.status !== 'DRAFT' && c.status !== 'ARCHIVED')
        .forEach((c) => {
          contentByType[c.type] = (contentByType[c.type] || 0) + c._count;
        });

      return {
        chapterId: ch.id,
        chapterName: ch.name,
        subjectName: ch.subject?.name,
        grade: ch.grade,
        totalConcepts,
        conceptsCovered,
        coveragePercent: totalConcepts > 0 ? Math.round((conceptsCovered / totalConcepts) * 100) : 0,
        totalContent: Object.values(contentByType).reduce((a, b) => a + b, 0),
        contentByType,
        topics: ch.topics.map((t) => ({
          topicId: t.id,
          topicName: t.name,
          concepts: t.concepts.map((c) => ({
            conceptId: c.id,
            conceptName: c.name,
            hasContent: contentCounts.some(
              (cc) => cc.conceptId === c.id && cc.chapterId === ch.id && cc.status !== 'DRAFT' && cc.status !== 'ARCHIVED'
            ),
          })),
        })),
      };
    });

    const overallTotalConcepts = matrix.reduce((a, m) => a + m.totalConcepts, 0);
    const overallCovered = matrix.reduce((a, m) => a + m.conceptsCovered, 0);

    return {
      matrix,
      summary: {
        totalChapters: matrix.length,
        totalConcepts: overallTotalConcepts,
        conceptsCovered: overallCovered,
        overallCoverage: overallTotalConcepts > 0 ? Math.round((overallCovered / overallTotalConcepts) * 100) : 0,
      },
    };
  }

  async qualityReport(user: RequestUser) {
    const isSuper = user.role === 'SUPER_ADMIN';
    const institutionId = isSuper ? null : this.tenant.requireInstitution(user);
    const scope: Prisma.ContentItemWhereInput = institutionId ? { institutionId } : { ownerType: 'PLATFORM' };

    const [total, byStatus, byType, recentlyUpdated, withoutDescription, withoutDuration, withoutThumbnail] = await Promise.all([
      this.prisma.contentItem.count({ where: scope }),
      this.prisma.contentItem.groupBy({ by: ['status'], where: scope, _count: true }),
      this.prisma.contentItem.groupBy({ by: ['type'], where: { ...scope, status: { in: ['APPROVED', 'PUBLISHED'] } }, _count: true }),
      this.prisma.contentItem.findMany({
        where: scope,
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: { id: true, title: true, type: true, status: true, updatedAt: true },
      }),
      this.prisma.contentItem.count({ where: { ...scope, description: null } }),
      this.prisma.contentItem.count({ where: { ...scope, durationSeconds: null, type: 'VIDEO' } }),
      this.prisma.contentItem.count({ where: { ...scope, thumbnailUrl: null } }),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      byType: Object.fromEntries(byType.map((t) => [t.type, t._count])),
      recentlyUpdated,
      qualityIssues: {
        withoutDescription,
        withoutDuration,
        withoutThumbnail,
        totalIssues: withoutDescription + withoutDuration + withoutThumbnail,
      },
    };
  }
}