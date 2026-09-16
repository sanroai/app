import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../common/services/storage.service';
import { ContentLifecycleStatus, ProcessingJobStatus } from '@prisma/client';

@Injectable()
export class ContentProcessorService {
  private readonly logger = new Logger(ContentProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async processKnowledgeBase(kbId: string) {
    const kb = await this.prisma.knowledgeBase.findUnique({
      where: { id: kbId },
      include: { jobs: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!kb) throw new Error('Knowledge base not found');
    if (kb.status === 'PROCESSING') return { alreadyProcessing: true };

    const job = await this.prisma.processingJob.create({
      data: {
        knowledgeBaseId: kbId,
        status: 'PROCESSING' as ProcessingJobStatus,
        inputType: kb.sourceType,
        outputType: 'CHUNKS',
        startedAt: new Date(),
      },
    });

    await this.prisma.knowledgeBase.update({
      where: { id: kbId },
      data: { status: 'PROCESSING' as ContentLifecycleStatus },
    });

    try {
      const metadata = kb.metadata as any;
      const grade = metadata?.grade || '10';
      const subject = metadata?.subject || '';
      const board = metadata?.board || 'CBSE';
      const chapter = metadata?.chapter || '';

      if (kb.sourceType === 'YOUTUBE') {
        await this.processYouTube(kb, grade, subject, board, chapter);
      } else if (kb.sourceType === 'PDF_BOOK') {
        await this.processPdf(kb, grade, subject, board, chapter);
      } else if (kb.sourceType === 'NOTES') {
        await this.processNotes(kb, grade, subject, board, chapter);
      } else if (kb.sourceType === 'VIDEO') {
        await this.processVideo(kb, grade, subject, board, chapter);
      }

      await this.prisma.processingJob.update({
        where: { id: job.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      await this.prisma.knowledgeBase.update({
        where: { id: kbId },
        data: { status: 'PROCESSED' as ContentLifecycleStatus },
      });

      return { success: true, jobId: job.id };
    } catch (err) {
      this.logger.error(`Processing failed for KB ${kbId}: ${(err as Error).message}`);
      await this.prisma.processingJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', error: (err as Error).message },
      });
      await this.prisma.knowledgeBase.update({
        where: { id: kbId },
        data: { status: 'DRAFT' as ContentLifecycleStatus },
      });
      return { success: false, error: (err as Error).message };
    }
  }

  private async processYouTube(kb: any, grade: string, subject: string, board: string, chapter: string) {
    const metadata = kb.metadata as any;
    const videoId = metadata?.videoId || '';
    const chunks = [
      {
        content: `YouTube Video: ${kb.name}\n${kb.description || ''}\n\nThis is a video lesson covering key concepts. Watch the video and take notes on the following topics.`,
        chapter,
        topic: kb.name,
        concept: kb.name,
        grade,
        subject,
        board,
        metadata: { videoId, embedUrl: metadata?.embedUrl, thumbnailUrl: metadata?.thumbnailUrl },
      },
    ];

    await this.prisma.knowledgeChunk.createMany({
      data: chunks.map((c) => ({
        knowledgeBaseId: kb.id,
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
  }

  private async processPdf(kb: any, grade: string, subject: string, board: string, chapter: string) {
    if (!kb.storageKey) {
      throw new Error('PDF file not found in storage');
    }

    const buffer = await this.storage.read('content', kb.storageKey.replace('content/', ''));
    const text = await this.extractTextFromPdf(buffer);

    const sections = this.chunkText(text, 1000, 200);

    const chunks = sections.map((section, i) => ({
      content: section,
      chapter,
      topic: `Page section ${i + 1}`,
      concept: this.extractConceptFromChunk(section),
      grade,
      subject,
      board,
      metadata: { sectionIndex: i, totalSections: sections.length },
    }));

    await this.prisma.knowledgeChunk.createMany({
      data: chunks.map((c) => ({
        knowledgeBaseId: kb.id,
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
  }

  private async processNotes(kb: any, grade: string, subject: string, board: string, chapter: string) {
    if (!kb.storageKey) {
      throw new Error('Notes file not found in storage');
    }

    const buffer = await this.storage.read('content', kb.storageKey.replace('content/', ''));
    const text = buffer.toString('utf-8');

    const sections = this.chunkText(text, 800, 150);

    const chunks = sections.map((section, i) => ({
      content: section,
      chapter,
      topic: this.extractTopicFromChunk(section),
      concept: this.extractConceptFromChunk(section),
      grade,
      subject,
      board,
      metadata: { sectionIndex: i, totalSections: sections.length },
    }));

    await this.prisma.knowledgeChunk.createMany({
      data: chunks.map((c) => ({
        knowledgeBaseId: kb.id,
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
  }

  private async processVideo(kb: any, grade: string, subject: string, board: string, chapter: string) {
    const metadata = kb.metadata as any;
    const chunks = [
      {
        content: `Video: ${kb.name}\n${kb.description || ''}\n\nThis video covers the following topics. Watch carefully and take notes.`,
        chapter,
        topic: kb.name,
        concept: kb.name,
        grade,
        subject,
        board,
        metadata: { mimeType: metadata?.mimeType, sizeBytes: metadata?.sizeBytes },
      },
    ];

    await this.prisma.knowledgeChunk.createMany({
      data: chunks.map((c) => ({
        knowledgeBaseId: kb.id,
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
  }

  private async extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = await import('pdf-parse');
      const mod = pdfParse as any;
      const fn = typeof mod === 'function' ? mod : mod.default;
      if (typeof fn === 'function') {
        const data = await fn(buffer);
        return data.text || '';
      }
      return '[PDF text extraction unavailable]';
    } catch {
      return '[PDF text extraction unavailable — pdf-parse not installed]';
    }
  }

  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= chunkSize) return [cleaned];

    const chunks: string[] = [];
    let start = 0;
    while (start < cleaned.length) {
      const end = Math.min(start + chunkSize, cleaned.length);
      chunks.push(cleaned.slice(start, end));
      start = end - overlap;
      if (start + overlap >= cleaned.length) break;
    }
    return chunks;
  }

  private extractConceptFromChunk(text: string): string {
    const lines = text.split('\n').filter((l) => l.trim());
    const firstLine = lines[0] || '';
    if (firstLine.length <= 100) return firstLine.trim();
    return firstLine.substring(0, 100).trim();
  }

  private extractTopicFromChunk(text: string): string {
    const headingMatch = text.match(/^#{1,3}\s+(.+)/m);
    if (headingMatch) return headingMatch[1].trim();
    const firstLine = text.split('\n')[0] || '';
    if (firstLine.length <= 80) return firstLine.trim();
    return firstLine.substring(0, 80).trim();
  }
}
