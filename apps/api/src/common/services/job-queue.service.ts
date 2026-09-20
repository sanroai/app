import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type JobType = 'CONTENT_PROCESSING' | 'QUESTION_GENERATION' | 'FLASHCARD_GENERATION' | 'NOTES_GENERATION' | 'CONTENT_PIPELINE';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface JobPayload {
  knowledgeBaseId: string;
  institutionId: string;
  userId: string;
  options?: Record<string, any>;
}

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  payload: JobPayload;
  result?: any;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export type JobHandler = (job: Job) => Promise<any>;

@Injectable()
export class JobQueueService {
  private readonly logger = new Logger(JobQueueService.name);
  private queue: Job[] = [];
  private processing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly handlers = new Map<JobType, JobHandler>();

  constructor(private readonly prisma: PrismaService) {
    void this.restorePendingJobs();
    this.startProcessor();
  }

  registerHandler(type: JobType, handler: JobHandler): void {
    this.handlers.set(type, handler);
    this.logger.log(`Registered handler for job type ${type}`);
  }

  isKnownType(type: string): boolean {
    return this.handlers.has(type as JobType) || ['CONTENT_PROCESSING', 'QUESTION_GENERATION', 'FLASHCARD_GENERATION', 'NOTES_GENERATION', 'CONTENT_PIPELINE'].includes(type);
  }

  private async restorePendingJobs() {
    try {
      const rows = await this.prisma.processingJob.findMany({
        where: { status: { in: ['PENDING', 'PROCESSING'] } },
      });

      for (const row of rows) {
        if (!this.isKnownType(row.inputType)) {
          continue;
        }
        const metadata = (row.metadata ?? {}) as Partial<JobPayload>;
        const job: Job = {
          id: row.id,
          type: row.inputType as JobType,
          status: 'PENDING',
          payload: {
            knowledgeBaseId: row.knowledgeBaseId,
            institutionId: metadata.institutionId ?? '',
            userId: metadata.userId ?? '',
            options: metadata.options,
          },
          attempts: row.attempts ?? 0,
          maxAttempts: row.maxAttempts ?? 3,
          createdAt: row.createdAt,
        };
        this.queue.push(job);

        if (row.status === 'PROCESSING') {
          await this.prisma.processingJob.update({
            where: { id: row.id },
            data: { status: 'PENDING', startedAt: null },
          });
        }
      }

      if (rows.length > 0) {
        this.logger.log(`Restored ${rows.length} job(s) from database after restart`);
      }
    } catch (error) {
      this.logger.error(`Failed to restore jobs from database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private startProcessor() {
    this.processingInterval = setInterval(() => this.processNext(), 2000);
  }

  private stopProcessor() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  async addJob(type: JobType, payload: JobPayload, maxAttempts = 3): Promise<Job> {
    const created = await this.prisma.processingJob.create({
      data: {
        knowledgeBaseId: payload.knowledgeBaseId,
        inputType: type,
        status: 'PENDING',
        attempts: 0,
        maxAttempts,
        stage: (payload.options?.stage as any) ?? null,
        metadata: payload as any,
      },
    });

    const job: Job = {
      id: created.id,
      type,
      status: 'PENDING',
      payload,
      attempts: 0,
      maxAttempts,
      createdAt: created.createdAt,
    };

    this.queue.push(job);
    this.logger.log(`Job ${job.id} added to queue (${type})`);

    return job;
  }

  getJob(id: string): Job | undefined {
    return this.queue.find((j) => j.id === id);
  }

  getQueue(): Job[] {
    return [...this.queue];
  }

  getStats() {
    return {
      total: this.queue.length,
      pending: this.queue.filter((j) => j.status === 'PENDING').length,
      processing: this.queue.filter((j) => j.status === 'PROCESSING').length,
      completed: this.queue.filter((j) => j.status === 'COMPLETED').length,
      failed: this.queue.filter((j) => j.status === 'FAILED').length,
    };
  }

  private async processNext() {
    if (this.processing) return;

    const nextJob = this.queue.find((j) => j.status === 'PENDING');
    if (!nextJob) return;

    this.processing = true;
    nextJob.status = 'PROCESSING';
    nextJob.startedAt = new Date();
    nextJob.attempts++;

    try {
      await this.prisma.processingJob.update({
        where: { id: nextJob.id },
        data: { status: 'PROCESSING', startedAt: nextJob.startedAt, attempts: nextJob.attempts },
      });

      const result = await this.executeJob(nextJob);
      nextJob.status = 'COMPLETED';
      nextJob.result = result;
      nextJob.completedAt = new Date();

      await this.prisma.processingJob.update({
        where: { id: nextJob.id },
        data: {
          status: 'COMPLETED',
          completedAt: nextJob.completedAt,
        },
      });

      this.logger.log(`Job ${nextJob.id} completed`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Job ${nextJob.id} failed: ${message}`);

      if (nextJob.attempts < nextJob.maxAttempts) {
        nextJob.status = 'PENDING';
        this.logger.log(`Job ${nextJob.id} will retry (${nextJob.attempts}/${nextJob.maxAttempts})`);
      } else {
        nextJob.status = 'FAILED';
        nextJob.error = message;
        nextJob.completedAt = new Date();

        await this.prisma.processingJob.update({
          where: { id: nextJob.id },
          data: {
            status: 'FAILED',
            error: message,
            completedAt: nextJob.completedAt,
          },
        });
      }
    } finally {
      this.processing = false;
    }
  }

  private async executeJob(job: Job): Promise<any> {
    const handler = this.handlers.get(job.type);
    if (handler) {
      return handler(job);
    }
    switch (job.type) {
      case 'CONTENT_PROCESSING':
        return this.processContent(job);
      case 'QUESTION_GENERATION':
        return this.generateQuestions(job);
      case 'FLASHCARD_GENERATION':
        return this.generateFlashcards(job);
      case 'NOTES_GENERATION':
        return this.generateNotes(job);
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  private async processContent(job: Job): Promise<any> {
    const { knowledgeBaseId } = job.payload;
    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: { knowledgeBaseId },
      orderBy: { createdAt: 'asc' },
    });

    let processed = 0;
    for (const chunk of chunks) {
      if (!chunk.grade && chunk.content) {
        const gradeMatch = chunk.content.match(/class\s+(\d+)/i);
        if (gradeMatch) {
          await this.prisma.knowledgeChunk.update({
            where: { id: chunk.id },
            data: { grade: gradeMatch[1] },
          });
        }
      }
      processed++;
    }

    return { chunksProcessed: processed, total: chunks.length };
  }

  private async generateQuestions(job: Job): Promise<any> {
    const { knowledgeBaseId, options } = job.payload;
    const count = options?.count || 10;

    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: { knowledgeBaseId },
      take: 5,
    });

    const questions: any[] = [];
    for (const chunk of chunks) {
      const sentences = chunk.content.split(/[.!?]+/).filter((s: string) => s.trim().length > 30);
      for (const sentence of sentences.slice(0, 2)) {
        questions.push({
          text: `Based on the text, what is described?`,
          type: 'SHORT_ANSWER',
          difficulty: 'MEDIUM',
          marks: 1,
        });
      }
    }

    return { questionsGenerated: questions.length, questions: questions.slice(0, count) };
  }

  private async generateFlashcards(job: Job): Promise<any> {
    const { knowledgeBaseId, options } = job.payload;
    const count = options?.count || 10;

    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: { knowledgeBaseId },
      take: 10,
    });

    const flashcards: any[] = [];
    for (const chunk of chunks) {
      const words = chunk.content.split(/\s+/).filter((w: string) => w.length > 5);
      for (const word of words.slice(0, 2)) {
        flashcards.push({
          front: `Define: ${word}`,
          back: chunk.content.substring(0, 200),
          difficulty: 'MEDIUM',
        });
      }
    }

    return { flashcardsGenerated: flashcards.length, flashcards: flashcards.slice(0, count) };
  }

  private async generateNotes(job: Job): Promise<any> {
    const { knowledgeBaseId } = job.payload;

    const chunks = await this.prisma.knowledgeChunk.findMany({
      where: { knowledgeBaseId },
      take: 20,
    });

    const content = chunks.map((c: any) => c.content).join('\n\n');
    const sections = content.split(/\n\n+/).filter((p: string) => p.trim().length > 50);

    return {
      notesGenerated: true,
      sections: sections.length,
      wordCount: content.split(/\s+/).length,
    };
  }

  onModuleDestroy() {
    this.stopProcessor();
  }
}
