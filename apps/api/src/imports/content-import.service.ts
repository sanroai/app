import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { StorageService } from '../common/services/storage.service';
import { Prisma, ContentSourceType, ContentLifecycleStatus } from '@prisma/client';

@Injectable()
export class ContentImportService {
  private readonly logger = new Logger(ContentImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly storage: StorageService,
  ) {}

  async uploadContent(user: any, file: Express.Multer.File, data: {
    name: string;
    description?: string;
    sourceType: string;
    grade?: string;
    subject?: string;
    board?: string;
    chapter?: string;
  }) {
    const institutionId = this.tenant.requireInstitution(user);

    if (!file) throw new BadRequestException('File is required');
    if (file.size > 50 * 1024 * 1024) throw new BadRequestException('File exceeds 50MB limit');

    const allowedTypes: Record<string, string[]> = {
      PDF_BOOK: ['application/pdf'],
      VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
      NOTES: ['text/plain', 'text/markdown', 'application/pdf'],
    };

    const allowed = allowedTypes[data.sourceType] || [];
    if (allowed.length > 0 && !allowed.some((t) => file.mimetype.includes(t.split('/')[1]))) {
      throw new BadRequestException(`File type ${file.mimetype} not allowed for ${data.sourceType}`);
    }

    const ext = file.originalname.split('.').pop() || 'bin';
    const filename = `${data.sourceType.toLowerCase()}_${Date.now()}.${ext}`;
    const result = await this.storage.upload('content', filename, file.buffer, file.mimetype);

    const kb = await this.prisma.knowledgeBase.create({
      data: {
        name: data.name,
        description: data.description,
        sourceType: data.sourceType as ContentSourceType,
        sourceUrl: result.url,
        storageKey: result.key,
        institutionId,
        creatorId: user.id,
        status: 'DRAFT' as ContentLifecycleStatus,
        metadata: {
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          grade: data.grade,
          subject: data.subject,
          board: data.board,
          chapter: data.chapter,
        },
      },
    });

    const job = await this.prisma.processingJob.create({
      data: {
        knowledgeBaseId: kb.id,
        status: 'PENDING',
        inputType: data.sourceType,
        outputType: 'CHUNKS',
        metadata: { filename, sizeBytes: file.size },
      },
    });

    return {
      knowledgeBase: kb,
      job,
      message: 'Content uploaded successfully. Processing will begin shortly.',
    };
  }

  async uploadMultiple(user: any, files: Express.Multer.File[], data: {
    names: string[];
    sourceType: string;
    grade?: string;
    subject?: string;
    board?: string;
  }) {
    const results = [];
    for (let i = 0; i < files.length; i++) {
      const name = data.names[i] || files[i].originalname.replace(/\.[^.]+$/, '');
      try {
        const result = await this.uploadContent(user, files[i], {
          name,
          sourceType: data.sourceType,
          grade: data.grade,
          subject: data.subject,
          board: data.board,
        });
        results.push({ success: true, filename: files[i].originalname, ...result });
      } catch (err) {
        results.push({ success: false, filename: files[i].originalname, error: (err as Error).message });
      }
    }
    return { results, total: files.length, succeeded: results.filter((r) => r.success).length };
  }

  async addYouTubeContent(user: any, data: {
    name: string;
    url: string;
    description?: string;
    grade?: string;
    subject?: string;
    board?: string;
    chapter?: string;
  }) {
    const institutionId = this.tenant.requireInstitution(user);

    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = data.url.match(youtubeRegex);
    if (!match) throw new BadRequestException('Invalid YouTube URL');

    const videoId = match[1];
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    const kb = await this.prisma.knowledgeBase.create({
      data: {
        name: data.name,
        description: data.description,
        sourceType: 'YOUTUBE',
        sourceUrl: data.url,
        institutionId,
        creatorId: user.id,
        status: 'PUBLISHED' as ContentLifecycleStatus,
        metadata: {
          videoId,
          embedUrl,
          thumbnailUrl,
          grade: data.grade,
          subject: data.subject,
          board: data.board,
          chapter: data.chapter,
        },
      },
    });

    return { knowledgeBase: kb, embedUrl, thumbnailUrl };
  }

  async getImports(user: any) {
    const institutionId = this.tenant.requireInstitution(user);
    return this.prisma.knowledgeBase.findMany({
      where: { institutionId },
      include: { _count: { select: { chunks: true, jobs: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getImportDetail(id: string, user: any) {
    const institutionId = this.tenant.requireInstitution(user);
    const kb = await this.prisma.knowledgeBase.findFirst({
      where: { id, institutionId },
      include: {
        chunks: { orderBy: { createdAt: 'asc' } },
        jobs: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!kb) throw new NotFoundException('Import not found');
    return kb;
  }

  async processContent(id: string, user: any) {
    const institutionId = this.tenant.requireInstitution(user);
    const kb = await this.prisma.knowledgeBase.findFirst({
      where: { id, institutionId },
    });
    if (!kb) throw new NotFoundException('Knowledge base not found');

    await this.prisma.processingJob.create({
      data: {
        knowledgeBaseId: id,
        status: 'PENDING',
        inputType: kb.sourceType,
        outputType: 'CHUNKS',
      },
    });

    await this.prisma.knowledgeBase.update({
      where: { id },
      data: { status: 'PROCESSING' },
    });

    return { message: 'Processing queued', knowledgeBaseId: id };
  }
}
