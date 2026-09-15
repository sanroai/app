import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QuestionType, PaperStatus } from '@sanro/types';
import { QuestionSource, Prisma } from '@prisma/client';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { AuditService } from '../common/services/audit-notifications.service';
import { AiService } from '../ai/ai.service';

export interface DistributionEntry {
  type: QuestionType;
  count: number;
  marks: number;
}

export interface PaperGenerateConfig {
  title: string;
  examName: string;
  boardId: string;
  grade: string;
  subjectId: string;
  chapterIds?: string[];
  topicIds?: string[];
  conceptIds?: string[];
  totalMarks?: number;
  durationMinutes?: number;
  date?: string;
  instructions?: string;
  language?: 'EN' | 'MR' | 'HI';
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  distribution: Record<string, { count: number; marks: number }>;
  autoGenerateWithAI?: boolean;
}

function asDistribution(entries: PaperGenerateConfig['distribution']): DistributionEntry[] {
  return Object.entries(entries).map(([type, v]) => ({
    type: type as QuestionType,
    count: v.count,
    marks: v.marks,
  }));
}

export const SECTION_LABELS: Record<string, string> = {
  MCQ: 'Multiple Choice Questions',
  TRUE_FALSE: 'True or False',
  MULTI_SELECT: 'Multiple Select Questions',
  FILL_BLANK: 'Fill in the Blanks',
  VERY_SHORT_ANSWER: 'Very Short Answer Questions',
  SHORT_ANSWER: 'Short Answer Questions',
  LONG_ANSWER: 'Long Answer Questions',
  NUMERICAL: 'Numerical Problems',
};

@Injectable()
export class PapersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly audit: AuditService,
    private readonly ai: AiService,
  ) {}

  async generate(user: RequestUser, cfg: PaperGenerateConfig) {
    const institutionId = this.tenant.requireInstitution(user);
    if (user.role === 'STUDENT' || user.role === 'PARENT') {
      throw new ForbiddenException('Students and parents cannot generate papers');
    }
    const distribution = asDistribution(cfg.distribution);
    if (distribution.length === 0) throw new BadRequestException('Paper distribution is required');

    const totalMarks = cfg.totalMarks ?? 50;
    this.assertBlueprint(cfg, totalMarks);

    const subject = await this.prisma.subject.findUnique({ where: { id: cfg.subjectId } });
    if (!subject) throw new BadRequestException('Subject not found');

    const paper = await this.prisma.questionPaper.create({
      data: {
        institutionId,
        title: cfg.title,
        examName: cfg.examName,
        boardId: cfg.boardId,
        grade: cfg.grade,
        subjectId: cfg.subjectId,
        totalMarks,
        durationMinutes: cfg.durationMinutes ?? 120,
        date: cfg.date ? new Date(cfg.date) : null,
        instructions: cfg.instructions ?? null,
        language: cfg.language ?? 'EN',
        distribution: cfg.distribution as object,
        status: 'DRAFT',
        createdById: user.sub,
      },
    });

    const warnings: string[] = [];
    const usedIds = new Set<string>();

    for (let i = 0; i < distribution.length; i++) {
      const entry = distribution[i];
      const sectionName = `Section ${String.fromCharCode(65 + i)}`;
      const picked = await this.pickQuestions(institutionId, cfg, entry, [...usedIds]);

      let rows = picked.map((q) => ({
        questionId: q.id,
        sectionName,
        sectionOrder: i + 1,
        marks: entry.marks,
      }));

      if (rows.length < entry.count) {
        if (cfg.autoGenerateWithAI && this.ai.available()) {
          const chapterId = await this.resolveChapterContext(cfg);
          if (!chapterId) {
            warnings.push(
              `${sectionName}: AI generation needs a chapter context; add chapter filters to generate remaining questions`,
            );
          } else {
            const missing = entry.count - rows.length;
            const generated = await this.ai.generateQuestionSet(
              {
                userId: user.sub,
                institutionId,
                grade: cfg.grade,
                subjectName: subject.name,
                chapterName: undefined,
              },
              missing,
            );
            for (const g of generated) {
              const q = await this.prisma.question.create({
                data: {
                  institutionId,
                  boardId: cfg.boardId,
                  grade: cfg.grade,
                  subjectId: cfg.subjectId,
                  chapterId,
                  topicId: cfg.topicIds?.[0] ?? null,
                  conceptId: cfg.conceptIds?.[0] ?? null,
                  type: g.type ?? QuestionType.MCQ,
                  status: 'DRAFT',
                  source: QuestionSource.AI,
                  difficulty: g.difficulty ?? cfg.difficulty ?? 'MEDIUM',
                  marks: entry.marks,
                  text: g.text,
                  answer: g.answer,
                  explanation: g.explanation ?? null,
                  language: cfg.language ?? 'EN',
                  aiGenerated: true,
                  createdById: user.sub,
                  options: {
                    create: (g.options ?? []).map((o, idx) => ({
                      text: o.text,
                      isCorrect: o.isCorrect,
                      order: idx,
                    })),
                  },
                },
              });
              rows.push({
                questionId: q.id,
                sectionName,
                sectionOrder: i + 1,
                marks: entry.marks,
              });
            }
            warnings.push(
              `${sectionName}: ${
                rows.length - picked.length
              } question(s) generated by AI and are DRAFT - review before export`,
            );
          }
        } else {
          warnings.push(
            `${sectionName}: only ${rows.length} of ${entry.count} questions available in the question bank`,
          );
        }
      }

      let order = 1;
      for (const r of rows) {
        await this.prisma.questionPaperQuestion.create({
          data: {
            paperId: paper.id,
            questionId: r.questionId,
            sectionName,
            sectionOrder: i + 1,
            order: order++,
            marks: entry.marks,
          },
        });
      }
    }

    const validation = await this.validatePaper(institutionId, paper.id);
    return { paper, validation, warnings };
  }

  private async resolveChapterContext(cfg: PaperGenerateConfig): Promise<string | null> {
    if (cfg.chapterIds?.length) return cfg.chapterIds[0];
    const chapter = await this.prisma.chapter.findFirst({
      where: { subjectId: cfg.subjectId, grade: cfg.grade },
      orderBy: { order: 'asc' },
    });
    return chapter?.id ?? null;
  }

  private assertBlueprint(cfg: PaperGenerateConfig, totalMarks: number): void {
    const computed = asDistribution(cfg.distribution).reduce((acc, e) => acc + e.count * e.marks, 0);
    if (computed !== totalMarks) {
      throw new BadRequestException(
        `Blueprint mismatch: distribution sums to ${computed} marks but totalMarks is ${totalMarks}. Fix the distribution so it adds up to the total.`,
      );
    }
  }

  private async pickQuestions(
    institutionId: string,
    cfg: PaperGenerateConfig,
    entry: DistributionEntry,
    excludeIds: string[],
  ) {
    const where: Prisma.QuestionWhereInput = {
      status: 'APPROVED',
      OR: [{ institutionId: null }, { institutionId }],
      boardId: cfg.boardId,
      grade: cfg.grade,
      subjectId: cfg.subjectId,
      type: this.mapQuestionType(entry.type),
      ...(cfg.chapterIds?.length ? { chapterId: { in: cfg.chapterIds } } : {}),
      ...(cfg.conceptIds?.length ? { conceptId: { in: cfg.conceptIds } } : {}),
      ...(cfg.difficulty ? { difficulty: cfg.difficulty } : {}),
      ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
    };
    const candidates = await this.prisma.question.findMany({
      where,
      include: { options: { orderBy: { order: 'asc' } } },
      take: Math.min(entry.count * 5, 200),
    });
    return this.shuffle(candidates).slice(0, entry.count);
  }

  private mapQuestionType(type: string): QuestionType {
    const map: Record<string, QuestionType> = {
      MCQ: QuestionType.MCQ,
      SHORT: QuestionType.SHORT_ANSWER,
      LONG: QuestionType.LONG_ANSWER,
      VERY_SHORT: QuestionType.VERY_SHORT_ANSWER,
      NUMERICAL: QuestionType.NUMERICAL,
      TRUE_FALSE: QuestionType.TRUE_FALSE,
      FILL_BLANK: QuestionType.FILL_BLANK,
      MULTI_SELECT: QuestionType.MULTI_SELECT,
    };
    return map[type] ?? (type as QuestionType);
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  async list(user: RequestUser) {
    const institutionId = this.tenant.requireInstitution(user);
    return this.prisma.questionPaper.findMany({
      where: { institutionId, status: { not: 'ARCHIVED' } },
      orderBy: { createdAt: 'desc' },
      include: {
        subject: { select: { name: true, code: true } },
        createdBy: { select: { name: true } },
        _count: { select: { questions: true } },
      },
    });
  }

  async detail(user: RequestUser, id: string) {
    const institutionId = this.tenant.requireInstitution(user);
    const paper = await this.prisma.questionPaper.findFirst({
      where: { id, institutionId },
      include: {
        institution: { select: { name: true, logoUrl: true, address: true, city: true, state: true } },
        subject: true,
        createdBy: { select: { name: true } },
      },
    });
    if (!paper) throw new NotFoundException('Paper not found');
    const questions = await this.prisma.questionPaperQuestion.findMany({
      where: { paperId: id },
      orderBy: [{ sectionOrder: 'asc' }, { order: 'asc' }],
      include: { question: { include: { options: { orderBy: { order: 'asc' } }, concept: true } } },
    });
    return { paper, questions };
  }

  async validatePaper(institutionId: string, paperId: string) {
    const paper = await this.prisma.questionPaper.findFirst({
      where: { id: paperId, institutionId },
      include: { questions: { include: { question: true } } },
    });
    if (!paper) throw new NotFoundException('Paper not found');

    const distribution = asDistribution(paper.distribution as Record<string, { count: number; marks: number }>);
    const expected = distribution.reduce((acc, e) => acc + e.count * e.marks, 0);
    const actual = paper.questions.reduce((acc, q) => acc + q.marks, 0);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (expected !== paper.totalMarks) {
      errors.push(`Distribution sums to ${expected} but totalMarks is ${paper.totalMarks}`);
    }
    if (actual !== paper.totalMarks) {
      errors.push(`Paper questions sum to ${actual} but totalMarks is ${paper.totalMarks}`);
    }

    const ids = paper.questions.map((q) => q.questionId);
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errors.push('Duplicate question detected in the paper');
      seen.add(id);
    }
    for (const q of paper.questions) {
      if (!q.question) {
        errors.push(`Question ${q.questionId} no longer exists`);
        continue;
      }
      if (!q.question.answer) errors.push(`Question "${q.question.text.slice(0, 40)}..." is missing an answer`);
      if (q.question.status !== 'APPROVED') {
        warnings.push(`Question "${q.question.text.slice(0, 40)}..." is ${q.question.status} (not approved)`);
      }
    }

    return {
      valid: errors.length === 0,
      totalMarks: actual,
      expectedMarks: paper.totalMarks,
      errors,
      warnings,
    };
  }

  async duplicate(user: RequestUser, id: string) {
    const institutionId = this.tenant.requireInstitution(user);
    const source = await this.prisma.questionPaper.findFirst({
      where: { id, institutionId },
      include: { questions: true },
    });
    if (!source) throw new NotFoundException('Paper not found');

    const distribution = asDistribution(source.distribution as Record<string, { count: number; marks: number }>);
    const usedIds = source.questions.map((q) => q.questionId);
    const cfg: PaperGenerateConfig = {
      title: `${source.title} Version B`,
      examName: source.examName,
      boardId: source.boardId,
      grade: source.grade,
      subjectId: source.subjectId,
      totalMarks: source.totalMarks,
      durationMinutes: source.durationMinutes,
      instructions: source.instructions ?? undefined,
      language: source.language as 'EN' | 'MR' | 'HI',
      difficulty: undefined,
      distribution: Object.fromEntries(distribution.map((d) => [d.type, { count: d.count, marks: d.marks }])),
    };
    const result = await this.generate(user, cfg);
    await this.prisma.questionPaper.update({
      where: { id: result.paper.id },
      data: { sourcePaperId: id, versionName: 'Version B' },
    });
    return result;
  }

  async regenerateQuestion(user: RequestUser, paperId: string, questionId: string) {
    const institutionId = this.tenant.requireInstitution(user);
    const paper = await this.prisma.questionPaper.findFirst({
      where: { id: paperId, institutionId },
      include: { questions: { include: { question: true } } },
    });
    if (!paper) throw new NotFoundException('Paper not found');

    const current = paper.questions.find((q) => q.questionId === questionId);
    if (!current) throw new NotFoundException('Question not in this paper');

    const excludeIds = paper.questions.map((q) => q.questionId).filter((id) => id !== questionId);
    const distribution = asDistribution(paper.distribution as Record<string, { count: number; marks: number }>);
    const entry = distribution.find((d) => d.type === current.question.type);

    const cfg: PaperGenerateConfig = {
      title: paper.title,
      examName: paper.examName,
      boardId: paper.boardId,
      grade: paper.grade,
      subjectId: paper.subjectId,
      totalMarks: paper.totalMarks,
      durationMinutes: paper.durationMinutes,
      distribution: paper.distribution as Record<string, { count: number; marks: number }>,
    };
    const candidates = await this.pickQuestions(
      institutionId,
      cfg,
      entry ?? { type: current.question.type as QuestionType, count: 1, marks: current.marks },
      excludeIds,
    );
    const replacement = candidates[0];
    if (!replacement) {
      throw new BadRequestException('No replacement question available in the question bank');
    }
    await this.prisma.questionPaperQuestion.delete({
      where: { paperId_questionId: { paperId, questionId } },
    });
    await this.prisma.questionPaperQuestion.create({
      data: {
        paperId,
        questionId: replacement.id,
        sectionName: current.sectionName,
        sectionOrder: current.sectionOrder,
        order: current.order,
        marks: current.marks,
      },
    });
    return this.detail(user, paperId);
  }

  async setStatus(user: RequestUser, paperId: string, status: PaperStatus, kind: 'STUDENT' | 'ANSWER_KEY') {
    const institutionId = this.tenant.requireInstitution(user);
    const paper = await this.prisma.questionPaper.findFirst({ where: { id: paperId, institutionId } });
    if (!paper) throw new NotFoundException('Paper not found');
    await this.prisma.questionPaper.update({
      where: { id: paperId },
      data: { status, exportedAt: status === 'EXPORTED' ? new Date() : paper.exportedAt },
    });
    await this.audit.log({
      userId: user.sub,
      institutionId,
      action: 'PAPER_EXPORTED',
      entityType: 'QuestionPaper',
      entityId: paperId,
      metadata: { kind },
    });
    return { ok: true };
  }

  async resolvePaper(institutionId: string, paperId: string) {
    const paper = await this.prisma.questionPaper.findFirst({
      where: { id: paperId, institutionId },
      include: {
        institution: { select: { name: true, logoUrl: true, address: true, city: true, state: true } },
        subject: true,
        questions: {
          orderBy: [{ sectionOrder: 'asc' }, { order: 'asc' }],
          include: { question: { include: { options: { orderBy: { order: 'asc' } }, concept: true } } },
        },
      },
    });
    if (!paper) throw new NotFoundException('Paper not found');
    return paper;
  }
}