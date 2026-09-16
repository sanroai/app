import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { ContentType, ContentStatus, Visibility } from '@prisma/client';
import { StudentIdentityService } from '../common/services/student-identity.service';

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly identity: StudentIdentityService,
  ) {}

  async list(user: RequestUser, query: Record<string, string | undefined> = {}) {
    const institutionId = this.tenant.requireInstitution(user);
    const where: Record<string, unknown> = {
      status: 'APPROVED',
      OR: [
        { visibility: 'PUBLIC' },
        { visibility: 'INSTITUTION_ONLY', institutionId },
      ],
    };
    if (query.type) where.type = query.type;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.chapterId) where.chapterId = query.chapterId;
    if (query.conceptId) where.conceptId = query.conceptId;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.grade) {
      where.chapter = { grade: query.grade };
    }

    return this.prisma.contentItem.findMany({
      where: where as object,
      orderBy: { createdAt: 'desc' },
      take: 100,
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
    const institutionId = this.tenant.requireInstitution(user);
    const item = await this.prisma.contentItem.findFirst({
      where: {
        id,
        status: 'APPROVED',
        OR: [{ visibility: Visibility.PUBLIC }, { visibility: Visibility.INSTITUTION_ONLY, institutionId }],
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
    },
  ) {
    const institutionId = this.tenant.requireInstitution(user);
    if (user.role === 'STUDENT' || user.role === 'PARENT') {
      throw new ForbiddenException('Students and parents cannot create content');
    }
    return this.prisma.contentItem.create({
      data: {
        type: data.type,
        status: user.role === 'SUPER_ADMIN' ? ContentStatus.APPROVED : ContentStatus.DRAFT,
        visibility:
          data.visibility ??
          (user.role === 'SUPER_ADMIN' ? Visibility.PUBLIC : Visibility.INSTITUTION_ONLY),
        title: data.title,
        description: data.description ?? null,
        durationSeconds: data.durationSeconds ?? null,
        thumbnailUrl: data.thumbnailUrl ?? null,
        url: data.url ?? null,
        institutionId: user.role === 'SUPER_ADMIN' ? null : institutionId,
        subjectId: data.subjectId ?? null,
        chapterId: data.chapterId ?? null,
        topicId: data.topicId ?? null,
        conceptId: data.conceptId ?? null,
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
    const institutionId = this.tenant.requireInstitution(user);
    if (user.role !== 'INSTITUTION_ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only admins can change content status');
    }
    const item = await this.prisma.contentItem.findFirst({
      where: { id, institutionId },
    });
    if (!item) throw new NotFoundException('Content not found');

    const allowedTransitions: Record<ContentStatus, ContentStatus[]> = {
      DRAFT: ['REVIEW', 'APPROVED', 'ARCHIVED'],
      REVIEW: ['APPROVED', 'DRAFT', 'ARCHIVED'],
      APPROVED: ['ARCHIVED', 'DRAFT'],
      ARCHIVED: ['DRAFT'],
    };
    if (!allowedTransitions[item.status]?.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${item.status} to ${status}`);
    }

    return this.prisma.contentItem.update({
      where: { id },
      data: { status },
    });
  }

  async completenessMatrix(user: RequestUser, boardId?: string, grade?: string) {
    const institutionId = this.tenant.requireInstitution(user);

    const where: any = { institutionId };
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
      where: { institutionId, status: 'APPROVED' },
      _count: true,
    });

    const matrix = chapters.map((ch) => {
      const totalConcepts = ch.topics.reduce((acc, t) => acc + t.concepts.length, 0);
      const conceptsCovered = new Set(
        contentCounts
          .filter((c) => c.chapterId === ch.id && c.status === 'APPROVED')
          .map((c) => c.conceptId)
          .filter(Boolean)
      ).size;

      const contentByType: Record<string, number> = {};
      contentCounts
        .filter((c) => c.chapterId === ch.id && c.status === 'APPROVED')
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
              (cc) => cc.conceptId === c.id && cc.chapterId === ch.id && cc.status === 'APPROVED'
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
    const institutionId = this.tenant.requireInstitution(user);

    const [total, byStatus, byType, recentlyUpdated, withoutDescription, withoutDuration, withoutThumbnail] = await Promise.all([
      this.prisma.contentItem.count({ where: { institutionId } }),
      this.prisma.contentItem.groupBy({ by: ['status'], where: { institutionId }, _count: true }),
      this.prisma.contentItem.groupBy({ by: ['type'], where: { institutionId, status: 'APPROVED' }, _count: true }),
      this.prisma.contentItem.findMany({
        where: { institutionId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: { id: true, title: true, type: true, status: true, updatedAt: true },
      }),
      this.prisma.contentItem.count({ where: { institutionId, description: null } }),
      this.prisma.contentItem.count({ where: { institutionId, durationSeconds: null, type: 'VIDEO' } }),
      this.prisma.contentItem.count({ where: { institutionId, thumbnailUrl: null } }),
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