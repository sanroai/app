import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { StorageService } from '../common/services/storage.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly storage: StorageService,
  ) {}

  async create(user: any, data: {
    name: string;
    description?: string;
    sourceType: string;
    sourceUrl?: string;
    storageKey?: string;
    metadata?: any;
  }) {
    return this.prisma.knowledgeBase.create({
      data: {
        name: data.name,
        description: data.description,
        sourceType: data.sourceType as any,
        sourceUrl: data.sourceUrl,
        storageKey: data.storageKey,
        institutionId: user.institutionId,
        creatorId: user.id,
        metadata: data.metadata,
      },
    });
  }

  async findAll(user: any, filters?: { status?: string; sourceType?: string }) {
    const where: Prisma.KnowledgeBaseWhereInput = {
      institutionId: user.institutionId,
    };
    if (filters?.status) where.status = filters.status as any;
    if (filters?.sourceType) where.sourceType = filters.sourceType as any;

    return this.prisma.knowledgeBase.findMany({
      where,
      include: { _count: { select: { chunks: true, jobs: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: any) {
    const kb = await this.prisma.knowledgeBase.findFirst({
      where: { id, institutionId: user.institutionId },
      include: {
        chunks: { orderBy: { createdAt: 'asc' }, take: 50 },
        jobs: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { chunks: true, jobs: true } },
      },
    });
    if (!kb) throw new NotFoundException('Knowledge base not found');
    return kb;
  }

  async addChunks(kbId: string, user: any, chunks: Array<{
    content: string;
    chapter?: string;
    topic?: string;
    concept?: string;
    grade?: string;
    subject?: string;
    board?: string;
    metadata?: any;
  }>) {
    const kb = await this.prisma.knowledgeBase.findFirst({
      where: { id: kbId, institutionId: user.institutionId },
    });
    if (!kb) throw new NotFoundException('Knowledge base not found');

    const created = await this.prisma.knowledgeChunk.createMany({
      data: chunks.map((c) => ({
        knowledgeBaseId: kbId,
        content: c.content,
        chapter: c.chapter,
        topic: c.topic,
        concept: c.concept,
        grade: c.grade,
        subject: c.subject,
        board: c.board,
        tokenCount: Math.ceil(c.content.length / 4),
        metadata: c.metadata,
      })),
    });

    return { count: created.count };
  }

  async search(user: any, query: string, filters?: { grade?: string; subject?: string; board?: string }) {
    const where: Prisma.KnowledgeChunkWhereInput = {
      knowledgeBase: { institutionId: user.institutionId },
    };
    if (filters?.grade) where.grade = filters.grade;
    if (filters?.subject) where.subject = filters.subject;
    if (filters?.board) where.board = filters.board;

    return this.prisma.knowledgeChunk.findMany({
      where: {
        ...where,
        content: { contains: query, mode: 'insensitive' },
      },
      include: { knowledgeBase: { select: { name: true, sourceType: true } } },
      take: 20,
    });
  }

  async updateStatus(id: string, user: any, status: string) {
    const kb = await this.prisma.knowledgeBase.findFirst({
      where: { id, institutionId: user.institutionId },
    });
    if (!kb) throw new NotFoundException('Knowledge base not found');

    return this.prisma.knowledgeBase.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async delete(id: string, user: any) {
    const kb = await this.prisma.knowledgeBase.findFirst({
      where: { id, institutionId: user.institutionId },
    });
    if (!kb) throw new NotFoundException('Knowledge base not found');

    if (kb.storageKey) {
      const parts = kb.storageKey.split('/');
      await this.storage.delete(parts[0], parts.slice(1).join('/'));
    }

    await this.prisma.knowledgeBase.delete({ where: { id } });
    return { deleted: true };
  }

  async getStats(user: any) {
    const institutionId = user.institutionId;
    const [totalKB, totalChunks, byStatus, bySourceType] = await Promise.all([
      this.prisma.knowledgeBase.count({ where: { institutionId } }),
      this.prisma.knowledgeChunk.count({ where: { knowledgeBase: { institutionId } } }),
      this.prisma.knowledgeBase.groupBy({ by: ['status'], where: { institutionId }, _count: true }),
      this.prisma.knowledgeBase.groupBy({ by: ['sourceType'], where: { institutionId }, _count: true }),
    ]);

    return {
      totalKnowledgeBases: totalKB,
      totalChunks,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      bySourceType: Object.fromEntries(bySourceType.map((s) => [s.sourceType, s._count])),
    };
  }
}
