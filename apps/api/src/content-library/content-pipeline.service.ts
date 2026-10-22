import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ContentLifecycleStatus, ContentProcessingStage, ContentSourceType, Prisma } from '@prisma/client';
import { APP_CONFIG_TOKEN } from '../common/common.constants';
import { AppConfig } from '../config/app.config';
import { JobQueueService, Job, JobType } from '../common/services/job-queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/services/storage.service';
import { EmbeddingService } from './embedding.service';

export type PipelineStage = ContentProcessingStage;

interface StageOptions {
  kbId: string;
  stage: PipelineStage;
}

const VERB_STAGES: PipelineStage[] = [
  'VALIDATING',
  'EXTRACTING',
  'PARSING',
  'MAPPING',
  'CHUNKING',
  'EMBEDDING',
  'GENERATING',
  'REVIEW',
  'COMPLETED',
];

@Injectable()
export class ContentPipelineService implements OnModuleInit {
  private readonly logger = new Logger(ContentPipelineService.name);

  constructor(
    private readonly jobs: JobQueueService,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly embeddings: EmbeddingService,
    @Inject(APP_CONFIG_TOKEN) private readonly config: AppConfig,
  ) {}

  async onModuleInit() {
    this.jobs.registerHandler('CONTENT_PIPELINE' as JobType, (job) => this.processStage(job));
  }

  private nextStage(stage: PipelineStage): PipelineStage | null {
    const idx = VERB_STAGES.indexOf(stage);
    return idx >= 0 && idx < VERB_STAGES.length - 1 ? VERB_STAGES[idx + 1] : null;
  }

  async enqueue(kbId: string, stage: PipelineStage): Promise<void> {
    const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
    if (!kb) throw new Error('KnowledgeBase not found');
    const job = await this.jobs.addJob('CONTENT_PIPELINE' as JobType, {
      knowledgeBaseId: kbId,
      institutionId: kb.institutionId ?? '',
      userId: kb.creatorId ?? '',
      options: { kbId, stage } as StageOptions,
    });
    this.logger.log(`Enqueued CONTENT_PIPELINE stage ${stage} for KB ${kbId} (job ${job.id})`);
  }

  async processStage(job: Job): Promise<Record<string, unknown>> {
    const options = (job.payload?.options ?? {}) as unknown as StageOptions;
    const kbId = options.kbId || job.payload.knowledgeBaseId;
    if (!kbId) throw new Error('Pipeline job missing knowledgeBaseId');

    await this.prisma.knowledgeBase.update({
      where: { id: kbId },
      data: {
        stage: options.stage,
        status: 'PROCESSING' as ContentLifecycleStatus,
      },
    });

    const error = await this.runStage(kbId, options.stage);
    if (error) {
      await this.prisma.knowledgeBase.update({
        where: { id: kbId },
        data: { stage: 'PARTIAL' as ContentProcessingStage, status: 'DRAFT' as ContentLifecycleStatus },
      });
      throw new Error(error);
    }

    if (options.stage === 'REVIEW') {
      const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
      if (kb && (kb.metadata as Record<string, unknown> | null)?.autoApprove === true) {
        await this.approve(kbId);
        return { stage: 'COMPLETED', autoApproved: true };
      }
      return { stage: 'REVIEW', awaitingReview: true };
    }

    if (options.stage === 'COMPLETED') {
      return { stage: 'COMPLETED' };
    }

    const next = this.nextStage(options.stage);
    if (next) {
      await this.enqueue(kbId, next);
    }
    return { stage: options.stage, next: next ?? null };
  }

  private mergeMetadata(optionsMetadata: unknown): Record<string, unknown> | undefined {
    return optionsMetadata as Record<string, unknown> | undefined;
  }

  private async runStage(kbId: string, stage: PipelineStage): Promise<string | null> {
    const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
    if (!kb) throw new Error('KnowledgeBase not found');

    try {
      switch (stage) {
        case 'VALIDATING': {
          if (kb.sourceType === 'YOUTUBE' && !kb.sourceUrl) return 'YouTube source requires a sourceUrl';
          if (kb.sourceType === 'PDF_BOOK' && !kb.storageKey) return 'PDF source requires a storageKey';
          if (kb.sourceType === 'NOTES' && !kb.storageKey) return 'Notes source requires a storageKey';
          return null;
        }
        case 'EXTRACTING': {
          if (kb.sourceType === 'YOUTUBE' || kb.sourceType === 'VIDEO') return null;
          const text = await this.extractText(kb);
          const key = await this.storage.upload('content', `${kb.id}/extracted.txt`, Buffer.from(text, 'utf-8'), 'text/plain');
          await this.prisma.knowledgeBase.update({
            where: { id: kbId },
            data: { metadata: this.withMeta(kb, { extractedStorageKey: key.key, charCount: text.length }) },
          });
          return null;
        }
        case 'PARSING': {
          const sections = await this.parseSections(kb);
          await this.prisma.knowledgeBase.update({
            where: { id: kbId },
            data: { metadata: this.withMeta(kb, { sectionCount: sections.length }) },
          });
          return null;
        }
        case 'MAPPING': {
          const mapping = await this.resolveMapping(kb);
          await this.prisma.knowledgeBase.update({
            where: { id: kbId },
            data: { metadata: this.withMeta(kb, { mapping }) },
          });
          return null;
        }
        case 'CHUNKING': {
          await this.chunk(kb);
          return null;
        }
        case 'EMBEDDING': {
          if (!this.embeddings.enabled()) {
            await this.prisma.knowledgeBase.update({
              where: { id: kbId },
              data: { metadata: this.withMeta(kb, { embeddingSkipped: true }) },
            });
            return null;
          }
          const chunks = await this.prisma.knowledgeChunk.findMany({
            where: { knowledgeBaseId: kbId, embedding: undefined },
            select: { id: true, content: true },
            orderBy: { sourcePage: 'asc' },
          });
          let embedded = 0;
          for (const chunk of chunks) {
            const vector = await this.embeddings.embed(chunk.content);
            if (vector) {
              await this.prisma.knowledgeChunk.update({
                where: { id: chunk.id },
                data: { embedding: vector as unknown as Prisma.InputJsonValue },
              });
              embedded++;
            }
          }
          await this.prisma.knowledgeBase.update({
            where: { id: kbId },
            data: { metadata: this.withMeta(kb, { embeddedChunks: embedded }) },
          });
          return null;
        }
        case 'GENERATING': {
          if (this.config.AI_PROVIDER === 'mock' || !this.config.AI_API_KEY) {
            await this.prisma.knowledgeBase.update({
              where: { id: kbId },
              data: { metadata: this.withMeta(kb, { aiGenerated: false }) },
            });
            return null;
          }
          const chunks = await this.prisma.knowledgeChunk.findMany({
            where: { knowledgeBaseId: kbId },
            select: { content: true },
            take: 10,
          });
          const sample = chunks.map((c) => c.content).join('\n').slice(0, 4000);
          await this.prisma.knowledgeBase.update({
            where: { id: kbId },
            data: { metadata: this.withMeta(kb, { aiGenerated: true, sampleLength: sample.length, tokenCount: Math.ceil(sample.length / 4) }) },
          });
          return null;
        }
        case 'REVIEW':
        case 'COMPLETED':
          return null;
        default:
          return `Unknown pipeline stage: ${stage}`;
      }
    } catch (err) {
      this.logger.error(`Pipeline stage ${stage} failed for KB ${kbId}: ${(err as Error).message}`);
      return (err as Error).message;
    }
  }

  private withMeta(kb: { metadata: Prisma.JsonValue | null }, patch: Record<string, unknown>): Prisma.InputJsonValue {
    const current = (kb.metadata ?? {}) as Record<string, unknown>;
    return { ...current, ...patch } as Prisma.InputJsonValue;
  }

  private async extractText(kb: { id: string; storageKey: string | null; sourceType: ContentSourceType }): Promise<string> {
    if (!kb.storageKey) return '';
    const parts = kb.storageKey.split('/');
    const filename = parts.length > 1 ? parts.slice(1).join('/') : parts[0];
    const buffer = await this.storage.read('content', filename);

    if (kb.sourceType === 'PDF_BOOK') {
      const text = await this.extractPdfText(buffer);
      if (text.trim()) return text;
      return `[PDF content for ${kb.id} — text extraction returned empty output]`;
    }
    return buffer.toString('utf-8');
  }

  private async extractPdfText(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = (await import('pdf-parse')) as unknown as {
        default?: (b: Buffer) => Promise<{ text: string }>;
      };
      const fn = pdfParse?.default ?? pdfParse;
      if (typeof fn === 'function') {
        const data = await fn(buffer);
        return data.text || '';
      }
      return '';
    } catch (err) {
      this.logger.warn(`pdf-parse failed: ${(err as Error).message}`);
      return '';
    }
  }

  private async parseSections(kb: {
    id: string;
    name: string;
    description: string | null;
    sourceType: ContentSourceType;
    metadata: Prisma.JsonValue | null;
  }): Promise<string[]> {
    if (kb.sourceType === 'YOUTUBE' || kb.sourceType === 'VIDEO') {
      return [`${kb.name}\n${kb.description ?? ''}`.trim()];
    }
    const meta = (kb.metadata ?? {}) as Record<string, unknown>;
    const extractedKey = meta.extractedStorageKey as string | undefined;
    let text = '';
    if (extractedKey) {
      try {
        const filename = extractedKey.split('/').slice(1).join('/');
        text = (await this.storage.read('content', filename)).toString('utf-8');
      } catch {
        text = '';
      }
    }
    if (!text) return [];
    return this.chunkText(text, 1000, 150);
  }

  private async resolveMapping(kb: { metadata: Prisma.JsonValue | null }) {
    const meta = (kb.metadata ?? {}) as Record<string, unknown>;
    const mapping: Record<string, string | null> = {
      grade: (meta.grade as string) ?? null,
      subjectId: (meta.subjectId as string) ?? null,
      chapterId: (meta.chapterId as string) ?? null,
      topicId: (meta.topicId as string) ?? null,
      conceptId: (meta.conceptId as string) ?? null,
      boardId: (meta.boardId as string) ?? null,
      subject: null,
      chapter: null,
      topic: null,
      concept: null,
      board: null,
    };

    const subject = mapping.subjectId
      ? await this.prisma.subject.findUnique({ where: { id: mapping.subjectId } })
      : null;
    if (subject) {
      mapping.subject = subject.name;
      mapping.board = (await this.prisma.board.findUnique({ where: { id: subject.boardId } }))?.name ?? null;
      if (subject.boardId) mapping.boardId = subject.boardId;
    }
    const chapter = mapping.chapterId
      ? await this.prisma.chapter.findUnique({ where: { id: mapping.chapterId } })
      : null;
    if (chapter) {
      mapping.chapter = chapter.name;
      if (!mapping.grade) mapping.grade = chapter.grade;
    }
    const topic = mapping.topicId ? await this.prisma.topic.findUnique({ where: { id: mapping.topicId } }) : null;
    if (topic) mapping.topic = topic.name;
    const concept = mapping.conceptId ? await this.prisma.concept.findUnique({ where: { id: mapping.conceptId } }) : null;
    if (concept) mapping.concept = concept.name;
    return mapping;
  }

  private async chunk(kb: {
    id: string;
    metadata: Prisma.JsonValue | null;
  }) {
    const meta = (kb.metadata ?? {}) as Record<string, unknown>;
    const mapping = (meta.mapping ?? {}) as Record<string, string | null>;
    const sections = (await this.parseSections(kb as Parameters<typeof this.parseSections>[0])) as string[];

    await this.prisma.knowledgeChunk.deleteMany({ where: { knowledgeBaseId: kb.id } });

    if (sections.length === 0) {
      throw new Error('No sections produced during parsing; nothing to chunk');
    }

    await this.prisma.knowledgeChunk.createMany({
      data: sections.map((section, i) => ({
        knowledgeBaseId: kb.id,
        content: section,
        board: mapping.board ?? null,
        grade: mapping.grade ?? null,
        subject: mapping.subject ?? null,
        chapter: mapping.chapter ?? null,
        topic: mapping.topic ?? null,
        concept: mapping.concept ?? null,
        tokenCount: Math.ceil(section.length / 4),
        sourcePage: i + 1,
        metadata: { sectionIndex: i, totalSections: sections.length },
      })),
    });
  }

  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= chunkSize) return cleaned ? [cleaned] : [];
    const chunks: string[] = [];
    let start = 0;
    while (start < cleaned.length) {
      const end = Math.min(start + chunkSize, cleaned.length);
      chunks.push(cleaned.slice(start, end));
      if (end === cleaned.length) break;
      start = end - overlap;
    }
    return chunks;
  }

  async approve(kbId: string): Promise<Record<string, unknown>> {
    const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
    if (!kb) throw new Error('KnowledgeBase not found');
    if (kb.stage !== 'REVIEW') throw new Error(`KB is at stage ${kb.stage}; only REVIEW can be approved`);

    const meta = (kb.metadata ?? {}) as Record<string, unknown>;
    const mapping = (meta.mapping ?? {}) as Record<string, string | null>;

    const updated = await this.prisma.knowledgeBase.update({
      where: { id: kbId },
      data: { stage: 'COMPLETED' as ContentProcessingStage, status: 'PUBLISHED' as ContentLifecycleStatus },
    });

    const contentType =
      kb.sourceType === 'YOUTUBE' || kb.sourceType === 'VIDEO' ? 'VIDEO' : 'NOTES';

    const item = await this.prisma.contentItem.create({
      data: {
        type: contentType,
        title: kb.name,
        description: kb.description ?? null,
        status: 'APPROVED',
        visibility: 'PUBLIC',
        ownerType: kb.ownerType ?? 'INSTITUTION',
        directSanroAvailable: (meta.directSanroAvailable as boolean) ?? false,
        institutionId: kb.institutionId ?? null,
        createdById: kb.creatorId ?? undefined,
        storageKey: kb.storageKey,
        url: kb.sourceUrl,
        grade: mapping.grade ?? (meta.grade as string | undefined) ?? null,
        subjectId: mapping.subjectId || (meta.subjectId as string) || null,
        chapterId: mapping.chapterId || (meta.chapterId as string) || null,
        topicId: mapping.topicId || (meta.topicId as string) || null,
        conceptId: mapping.conceptId || (meta.conceptId as string) || null,
        language: 'EN',
      },
    });

    await this.prisma.knowledgeBase.update({
      where: { id: kbId },
      data: { metadata: this.withMeta(kb, { contentItemId: item.id }) },
    });

    return { stage: 'COMPLETED', contentItemId: item.id };
  }

  async reject(kbId: string, reason: string): Promise<Record<string, unknown>> {
    const kb = await this.prisma.knowledgeBase.findUnique({ where: { id: kbId } });
    if (!kb) throw new Error('KnowledgeBase not found');
    await this.prisma.knowledgeBase.update({
      where: { id: kbId },
      data: { stage: 'FAILED' as ContentProcessingStage, status: 'DRAFT' as ContentLifecycleStatus, metadata: this.withMeta(kb, { rejectionReason: reason }) },
    });
    return { stage: 'FAILED', rejectionReason: reason };
  }
}