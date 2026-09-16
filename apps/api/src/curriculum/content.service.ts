import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
}