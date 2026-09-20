import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { Role } from '@sanro/types';
import { ContentSourceType, ContentOwnerType, ContentLifecycleStatus, Prisma } from '@prisma/client';
import { Roles } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/services/storage.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { ContentPipelineService } from './content-pipeline.service';

const IngestBodySchema = z
  .object({
    title: z.string().trim().min(3).max(300),
    description: z.string().trim().max(3000).optional(),
    sourceType: z.enum(['YOUTUBE', 'VIDEO', 'PDF_BOOK', 'NOTES']),
    sourceUrl: z.string().trim().url().max(1000).optional(),
    videoId: z.string().trim().max(40).optional(),
    grade: z.string().trim().max(10).optional(),
    boardId: z.string().uuid().optional(),
    subjectId: z.string().uuid().optional(),
    chapterId: z.string().uuid().optional(),
    topicId: z.string().uuid().optional(),
    conceptId: z.string().uuid().optional(),
    directSanroAvailable: z.coerce.boolean().default(false),
    autoApprove: z.coerce.boolean().default(false),
  })
  .strict();
type IngestBody = z.infer<typeof IngestBodySchema>;

const SourceToMeta: Record<string, ContentSourceType> = {
  YOUTUBE: 'YOUTUBE',
  VIDEO: 'VIDEO',
  PDF_BOOK: 'PDF_BOOK',
  NOTES: 'NOTES',
};

@ApiTags('content-ingest')
@Controller('content/ingest')
@Roles(Role.SUPER_ADMIN, Role.INSTITUTION_ADMIN, Role.TEACHER)
export class ContentIngestController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly tenant: TenantAccessService,
    private readonly pipeline: ContentPipelineService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async ingest(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body(
      new ZodValidationPipe(
        IngestBodySchema.transform((b) => ({ ...b, sourceType: SourceToMeta[b.sourceType] })),
      ),
    )
    body: IngestBody & { sourceType: ContentSourceType },
  ) {
    const isSuper = user.role === 'SUPER_ADMIN';
    const institutionId = isSuper ? null : this.tenant.requireInstitution(user);

    if (body.sourceType === 'YOUTUBE' && !body.videoId) {
      const parsed = this.parseYouTubeUrl(body.sourceUrl ?? '');
      if (!parsed) throw new BadRequestException('YouTube source requires a valid watch/short/embed URL');
      body.videoId = parsed;
    }
    if (body.sourceType === 'YOUTUBE' && !body.sourceUrl) {
      throw new BadRequestException('sourceUrl is required for YouTube');
    }
    const needsFile = ['PDF_BOOK', 'NOTES', 'VIDEO'].includes(body.sourceType);
    if (needsFile && !file) throw new BadRequestException('file is required for PDF_BOOK / NOTES / VIDEO');
    if (file && file.size > 10 * 1024 * 1024) throw new BadRequestException('File exceeds 10MB limit');

    const kb = await this.prisma.knowledgeBase.create({
      data: {
        name: body.title,
        description: body.description ?? null,
        sourceType: body.sourceType,
        sourceUrl: body.sourceUrl ?? null,
        ownerType: (isSuper ? 'PLATFORM' : 'INSTITUTION') as ContentOwnerType,
        institutionId,
        creatorId: user.sub,
        status: 'PROCESSING',
        stage: 'UPLOADED',
        metadata: {
          grade: body.grade ?? null,
          boardId: body.boardId ?? null,
          subjectId: body.subjectId ?? null,
          chapterId: body.chapterId ?? null,
          topicId: body.topicId ?? null,
          conceptId: body.conceptId ?? null,
          directSanroAvailable: body.directSanroAvailable,
          autoApprove: body.autoApprove,
          videoId: body.videoId ?? null,
        } as object,
      },
    });

    if (file) {
      const safeName = file.originalname.replace(/[^\w.\-]/g, '_');
      await this.storage.upload('content', `${kb.id}/${safeName}`, file.buffer, file.mimetype || 'application/octet-stream');
      await this.prisma.knowledgeBase.update({
        where: { id: kb.id },
        data: { storageKey: `content/${kb.id}/${safeName}` },
      });
    }

    await this.pipeline.enqueue(kb.id, 'VALIDATING');

    return { id: kb.id, name: kb.name, status: 'PROCESSING', stage: 'VALIDATING' };
  }

  @Get()
  list(@CurrentUser() user: RequestUser, @Query('status') status?: string) {
    const isSuper = user.role === 'SUPER_ADMIN';
    const where: Prisma.KnowledgeBaseWhereInput = {
      ...(isSuper ? {} : { institutionId: user.institutionId }),
      ...(status ? { status: status as ContentLifecycleStatus } : {}),
    };
    return this.prisma.knowledgeBase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        _count: { select: { chunks: true, jobs: true } },
      },
    });
  }

  @Get(':id')
  async status(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const kb = await this.requireOwned(user, id);
    const jobs = await this.prisma.processingJob.findMany({
      where: { knowledgeBaseId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const chunks = await this.prisma.knowledgeChunk.count({ where: { knowledgeBaseId: id } });
    return {
      id: kb.id,
      name: kb.name,
      sourceType: kb.sourceType,
      status: kb.status,
      stage: kb.stage,
      chunks,
      jobs,
    };
  }

  @Post(':id/approve')
  async approve(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.requireOwned(user, id);
    return this.pipeline.approve(id);
  }

  @Post(':id/reject')
  async reject(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(z.object({ reason: z.string().trim().min(3).max(500) }).strict())) body: { reason: string },
  ) {
    await this.requireOwned(user, id);
    return this.pipeline.reject(id, body.reason);
  }

  private parseYouTubeUrl(url: string): string | null {
    const patterns = [
      /youtube\.com\/watch\?v=([\w-]{6,})/,
      /youtu\.be\/([\w-]{6,})/,
      /youtube\.com\/shorts\/([\w-]{6,})/,
      /youtube\.com\/embed\/([\w-]{6,})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  }

  private async requireOwned(user: RequestUser, id: string) {
    const isSuper = user.role === 'SUPER_ADMIN';
    const kb = await this.prisma.knowledgeBase.findUnique({ where: { id } });
    if (!kb) throw new BadRequestException('Knowledge base not found');
    if (!isSuper && kb.institutionId !== user.institutionId) {
      throw new ForbiddenException('Not your institution content');
    }
    return kb;
  }
}