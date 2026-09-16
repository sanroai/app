import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { ContentType, ContentStatus, Visibility } from '@prisma/client';

export interface GeneratedFlashcard {
  front: string;
  back: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface GeneratedNotes {
  title: string;
  content: string;
  summary: string;
  keyPoints: string[];
}

@Injectable()
export class ContentGeneratorService {
  private readonly logger = new Logger(ContentGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
  ) {}

  async generateFlashcards(user: any, knowledgeBaseId: string, options: { count?: number; grade?: string; subject?: string }) {
    const institutionId = this.tenant.requireInstitution(user);
    const kb = await this.prisma.knowledgeBase.findFirst({
      where: { id: knowledgeBaseId, institutionId },
      include: { chunks: { take: 20 } },
    });
    if (!kb) throw new NotFoundException('Knowledge base not found');
    if (kb.chunks.length === 0) throw new NotFoundException('No content chunks available');

    const count = Math.min(options.count ?? 10, 30);
    const flashcards: GeneratedFlashcard[] = [];

    for (const chunk of kb.chunks.slice(0, count)) {
      const sentences = chunk.content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
      for (const sentence of sentences.slice(0, 2)) {
        const trimmed = sentence.trim();
        const words = trimmed.split(' ');
        if (words.length < 5) continue;

        const keyTerm = words.find((w) => w.length > 5 && /^[A-Z]/.test(w)) || words[Math.floor(words.length / 2)];
        const front = `What is ${keyTerm}?`;
        const back = trimmed;

        flashcards.push({
          front,
          back,
          difficulty: words.length > 15 ? 'HARD' : words.length > 8 ? 'MEDIUM' : 'EASY',
        });
      }
    }

    const contentItem = await this.prisma.contentItem.create({
      data: {
        type: 'QUIZ',
        status: ContentStatus.DRAFT,
        visibility: Visibility.INSTITUTION_ONLY,
        title: `Flashcards: ${kb.name}`,
        description: `Auto-generated flashcards from "${kb.name}"`,
        institutionId,
        createdById: user.id,
      },
    });

    return {
      contentId: contentItem.id,
      flashcards: flashcards.slice(0, count),
      source: kb.name,
      note: 'Flashcards created as DRAFT content. Review and publish when ready.',
    };
  }

  async generateNotes(user: any, knowledgeBaseId: string, options: { title?: string; grade?: string; subject?: string }) {
    const institutionId = this.tenant.requireInstitution(user);
    const kb = await this.prisma.knowledgeBase.findFirst({
      where: { id: knowledgeBaseId, institutionId },
      include: { chunks: { take: 30 } },
    });
    if (!kb) throw new NotFoundException('Knowledge base not found');
    if (kb.chunks.length === 0) throw new NotFoundException('No content chunks available');

    const allContent = kb.chunks.map((c) => c.content).join('\n\n');
    const sentences = allContent.split(/[.!?]+/).filter((s) => s.trim().length > 30);
    const keyPoints = sentences.slice(0, 10).map((s) => s.trim());

    const paragraphs = allContent.split(/\n\n+/).filter((p) => p.trim().length > 50);
    const sections = paragraphs.slice(0, 5).map((p, i) => ({
      heading: `Section ${i + 1}`,
      content: p.trim().substring(0, 500),
    }));

    const notesContent = sections.map((s) => `## ${s.heading}\n\n${s.content}`).join('\n\n');
    const summary = keyPoints.slice(0, 5).join('. ') + '.';

    const contentItem = await this.prisma.contentItem.create({
      data: {
        type: 'NOTES',
        status: ContentStatus.DRAFT,
        visibility: Visibility.INSTITUTION_ONLY,
        title: options.title || `Notes: ${kb.name}`,
        description: `Auto-generated study notes from "${kb.name}"`,
        institutionId,
        createdById: user.id,
      },
    });

    return {
      contentId: contentItem.id,
      notes: {
        title: options.title || `Notes: ${kb.name}`,
        content: notesContent,
        summary,
        keyPoints,
        sections,
      },
      source: kb.name,
      note: 'Notes created as DRAFT content. Review and publish when ready.',
    };
  }

  async generateSummary(user: any, knowledgeBaseId: string) {
    const institutionId = this.tenant.requireInstitution(user);
    const kb = await this.prisma.knowledgeBase.findFirst({
      where: { id: knowledgeBaseId, institutionId },
      include: { chunks: { take: 50 } },
    });
    if (!kb) throw new NotFoundException('Knowledge base not found');

    const totalChunks = kb.chunks.length;
    const totalWords = kb.chunks.reduce((acc, c) => acc + c.content.split(/\s+/).length, 0);
    const grades = [...new Set(kb.chunks.map((c) => c.grade).filter(Boolean))];
    const subjects = [...new Set(kb.chunks.map((c) => c.subject).filter(Boolean))];
    const chapters = [...new Set(kb.chunks.map((c) => c.chapter).filter(Boolean))];

    return {
      knowledgeBase: kb.name,
      totalChunks,
      totalWords,
      grades,
      subjects,
      chapters,
      metadata: kb.metadata,
    };
  }
}
