import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QuestionStatus, QuestionType } from '@sanro/types';
import { QuestionSource, Question, Prisma } from '@prisma/client';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';
import { TenantAccessService } from '../common/security/tenant-access.service';
import { AuditService } from '../common/services/audit-notifications.service';
import { QUESTION_EXPLANATIONS } from '../content/question-explanations';
import { QUESTION_ADDITIONS } from '../content/question-additions';
import { repairMojibake } from '../common/text/repair-encoding';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Inserts the authored question additions into this database.
   *
   * The seed is the only thing that ever created questions, and a deployment is
   * never re-seeded - so a question authored after a deployment had no path into
   * it. This does the insert; the seed calls the same map on a fresh install.
   *
   * Idempotent: a question whose text already exists is skipped, so re-running
   * changes nothing. Every entry is resolved through its chapter code and concept
   * name (never an id), and an entry that does not resolve is reported rather than
   * silently skipped.
   */
  async syncQuestionAdditions() {
    let created = 0;
    let skipped = 0;
    const unresolved: string[] = [];

    for (const addition of QUESTION_ADDITIONS) {
      const chapter = await this.prisma.chapter.findFirst({
        where: { code: addition.chapterCode },
        select: { id: true, grade: true, subjectId: true, subject: { select: { boardId: true } } },
      });
      if (!chapter) {
        unresolved.push(`${addition.chapterCode}: no such chapter`);
        continue;
      }

      const concept = await this.prisma.concept.findFirst({
        where: { name: addition.concept, topic: { chapterId: chapter.id } },
        select: { id: true, topicId: true },
      });
      if (!concept) {
        unresolved.push(`${addition.chapterCode}: no concept "${addition.concept}"`);
        continue;
      }

      const existing = await this.prisma.question.findFirst({
        where: { text: addition.text },
        select: { id: true },
      });
      if (existing) {
        skipped += 1;
        continue;
      }

      await this.prisma.question.create({
        data: {
          boardId: chapter.subject.boardId,
          grade: chapter.grade,
          subjectId: chapter.subjectId,
          chapterId: chapter.id,
          topicId: concept.topicId,
          conceptId: concept.id,
          type: addition.type as QuestionType,
          status: 'APPROVED',
          source: QuestionSource.SEED,
          difficulty: addition.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
          marks: addition.marks,
          text: addition.text,
          answer: addition.answer,
          explanation: addition.explanation,
          language: 'EN',
          options: { create: addition.options },
        },
        select: { id: true },
      });
      created += 1;
    }

    return {
      authored: QUESTION_ADDITIONS.length,
      created,
      skipped,
      unresolved: unresolved.length,
      unresolvedEntries: unresolved.slice(0, 10),
    };
  }

  /**
   * Applies the authored explanations (the shared QUESTION_EXPLANATIONS map) to
   * this database.
   *
   * The curriculum is seeded once and is never re-seeded on a deployment, so a
   * corrected explanation has no path to production without an explicit sync.
   * Idempotent: only the rows whose explanation differs are written, and a
   * teacher-authored (non-SEED) question keeps its own wording. The response
   * reports the map keys that no longer match a question, which is how an edited
   * question text shows up instead of silently losing its explanation.
   */
  async syncAuthoredExplanations() {
    let updated = 0;
    let alreadyCorrect = 0;
    let skipped = 0;
    const orphaned: string[] = [];

    for (const [text, explanation] of Object.entries(QUESTION_EXPLANATIONS)) {
      const existing = await this.prisma.question.findFirst({
        where: { text },
        select: { id: true, explanation: true, source: true },
      });
      if (!existing) {
        orphaned.push(text);
        continue;
      }
      if (existing.explanation === explanation) {
        alreadyCorrect += 1;
        continue;
      }
      if (existing.source !== QuestionSource.SEED) {
        skipped += 1;
        continue;
      }
      await this.prisma.question.update({ where: { id: existing.id }, data: { explanation } });
      updated += 1;
    }

    return {
      authored: Object.keys(QUESTION_EXPLANATIONS).length,
      updated,
      alreadyCorrect,
      skipped,
      orphaned: orphaned.length,
      orphanedTexts: orphaned.slice(0, 20),
    };
  }

  /**
   * Repairs question and option text that was decoded with the wrong codec.
   *
   * A handful of questions were authored with their UTF-8 bytes read as
   * Windows-1252, so a student sees `â†' CaCO3` instead of `→ CaCO3`. The fix is
   * mechanical and reversible (see `common/text/repair-encoding.ts`), and it is
   * exposed as an endpoint because the curriculum is never re-seeded in
   * production - there is no other path to fix those rows there.
   *
   * Idempotent: rows that are already correct are not written.
   */
  async repairQuestionEncoding() {
    let questions = 0;
    let options = 0;

    const questionRows = await this.prisma.question.findMany({ select: { id: true, text: true, answer: true } });
    for (const row of questionRows) {
      const text = repairMojibake(row.text);
      const answer = repairMojibake(row.answer);
      if (text === row.text && answer === row.answer) continue;
      await this.prisma.question.update({ where: { id: row.id }, data: { text, answer } });
      questions += 1;
    }

    const optionRows = await this.prisma.questionOption.findMany({ select: { id: true, text: true } });
    for (const option of optionRows) {
      const text = repairMojibake(option.text);
      if (text === option.text) continue;
      await this.prisma.questionOption.update({ where: { id: option.id }, data: { text } });
      options += 1;
    }

    return { questions, options };
  }

  async list(user: RequestUser, query: {
    boardId?: string;
    grade?: string;
    subjectId?: string;
    chapterId?: string;
    conceptId?: string;
    type?: QuestionType;
    difficulty?: string;
    status?: string;
    search?: string;
    source?: string;
    page?: number;
    pageSize?: number;
  }) {
    const institutionId = this.tenant.assertInstitutionAccess(user);
    const where: Prisma.QuestionWhereInput = {
      ...(institutionId ? { OR: [{ institutionId }, { institutionId: null }] } : {}),
      status: { not: 'ARCHIVED' },
      ...(query.grade ? { grade: query.grade } : {}),
      ...(query.boardId ? { boardId: query.boardId } : {}),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(query.chapterId ? { chapterId: query.chapterId } : {}),
      ...(query.conceptId ? { conceptId: query.conceptId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.difficulty ? { difficulty: query.difficulty as Question['difficulty'] } : {}),
      ...(query.status ? { status: query.status as QuestionStatus } : {}),
      ...(query.source ? { source: query.source as QuestionSource } : {}),
      ...(query.search
        ? { text: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, 100);
    const [total, rows] = await Promise.all([
      this.prisma.question.count({ where }),
      this.prisma.question.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          options: { orderBy: { order: 'asc' } },
          chapter: { select: { name: true } },
          subject: { select: { name: true } },
          concept: { select: { name: true } },
        },
      }),
    ]);
    return { data: rows, total, page, pageSize, pages: Math.ceil(total / pageSize) };
  }

  async detail(user: RequestUser, id: string) {
    const institutionId = this.tenant.assertInstitutionAccess(user);
    const question = await this.prisma.question.findFirst({
      where: {
        id,
        ...(institutionId ? { OR: [{ institutionId }, { institutionId: null }] } : {}),
      },
      include: {
        options: { orderBy: { order: 'asc' } },
        chapter: true,
        topic: true,
        concept: true,
        subject: true,
        createdBy: { select: { name: true, email: true } },
      },
    });
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  async create(
    user: RequestUser,
    data: {
      type: QuestionType;
      boardId: string;
      grade: string;
      subjectId: string;
      chapterId: string;
      topicId?: string;
      conceptId?: string;
      difficulty: string;
      marks?: number;
      text: string;
      options?: Array<{ text: string; isCorrect: boolean }>;
      answer: string;
      explanation?: string;
      hint?: string;
      language?: string;
      source?: QuestionSource;
      aiGenerated?: boolean;
    },
  ) {
    const institutionId = this.tenant.assertInstitutionAccess(user) || null;
    if (user.role === 'STUDENT' || user.role === 'PARENT') {
      throw new ForbiddenException('Students and parents cannot create questions');
    }

    const type = data.type as QuestionType;
    if (type === 'MCQ' || type === 'MULTI_SELECT' || type === 'TRUE_FALSE') {
      if (!data.options || data.options.filter((o) => o.isCorrect).length === 0) {
        throw new BadRequestException('Objective questions must include at least one correct option');
      }
    }

    const question = await this.prisma.question.create({
      data: {
        institutionId,
        boardId: data.boardId,
        grade: data.grade,
        subjectId: data.subjectId,
        chapterId: data.chapterId,
        topicId: data.topicId ?? null,
        conceptId: data.conceptId ?? null,
        type,
        status: QuestionStatus.DRAFT,
        source: data.source ?? 'MANUAL',
        difficulty: data.difficulty as Question['difficulty'],
        marks: data.marks ?? null,
        text: data.text,
        hint: data.hint ?? null,
        explanation: data.explanation ?? null,
        answer: data.answer,
        language: (data.language as 'EN' | 'MR' | 'HI') ?? 'EN',
        aiGenerated: data.aiGenerated ?? false,
        createdById: user.sub,
        options: {
          create: (data.options ?? []).map((o, i) => ({
            text: o.text,
            isCorrect: o.isCorrect,
            order: i,
          })),
        },
      },
      include: { options: true },
    });

    if (data.source === 'AI') {
      await this.audit.log({
        userId: user.sub,
        institutionId,
        action: 'QUESTION_GENERATED',
        entityType: 'Question',
        entityId: question.id,
        metadata: { aiGenerated: true },
      });
    }
    return question;
  }

  async update(user: RequestUser, id: string, data: Record<string, unknown>) {
    const institutionId = this.tenant.assertInstitutionAccess(user);
    const question = await this.prisma.question.findFirst({
      where: { id, ...(institutionId ? { institutionId } : {}) },
    });
    if (!question) throw new NotFoundException('Question not found');
    if (question.status === 'APPROVED' && data.status !== 'ARCHIVED') {
      throw new ForbiddenException('Approved questions cannot be edited; create a new version instead');
    }
    const { options, ...rest } = data;
    const updated = await this.prisma.$transaction(async (tx) => {
      const q = await tx.question.update({
        where: { id },
        data: rest as Prisma.QuestionUpdateInput,
      });
      if (Array.isArray(options)) {
        await tx.questionOption.deleteMany({ where: { questionId: id } });
        await tx.questionOption.createMany({
          data: (options as Array<{ text: string; isCorrect: boolean }>).map((o, i) => ({
            questionId: id,
            text: o.text,
            isCorrect: o.isCorrect,
            order: i,
          })),
        });
      }
      return q;
    });
    return updated;
  }

  async delete(user: RequestUser, id: string) {
    const institutionId = this.tenant.assertInstitutionAccess(user);
    const question = await this.prisma.question.findFirst({
      where: { id, ...(institutionId ? { institutionId } : {}) },
    });
    if (!question) throw new NotFoundException('Question not found');
    if (question.status === 'APPROVED') {
      throw new ForbiddenException('Approved questions cannot be deleted; archive instead');
    }
    await this.prisma.question.delete({ where: { id } });
    return { ok: true };
  }

  async review(user: RequestUser, id: string, action: 'APPROVE' | 'REJECT' | 'ARCHIVE') {
    const institutionId = this.tenant.assertInstitutionAccess(user);
    if (user.role !== 'INSTITUTION_ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only admins can approve questions');
    }
    const question = await this.prisma.question.findFirst({
      where: {
        id,
        ...(institutionId ? { OR: [{ institutionId }, { institutionId: null }] } : {}),
      },
    });
    if (!question) throw new NotFoundException('Question not found');

    const statusMap: Record<string, QuestionStatus> = {
      APPROVE: QuestionStatus.APPROVED,
      REJECT: QuestionStatus.DRAFT,
      ARCHIVE: QuestionStatus.ARCHIVED,
    };
    await this.prisma.question.update({ where: { id }, data: { status: statusMap[action] } });
    if (action === 'APPROVE') {
      await this.audit.log({
        userId: user.sub,
        institutionId,
        action: 'QUESTION_APPROVED',
        entityType: 'Question',
        entityId: id,
      });
    }
    return { ok: true, status: statusMap[action] };
  }

  async generateFromKnowledgeBase(
    user: RequestUser,
    knowledgeBaseId: string,
    options: { count?: number; grade?: string; subject?: string; board?: string },
  ) {
    const institutionId = this.tenant.assertInstitutionAccess(user);
    if (user.role === 'STUDENT' || user.role === 'PARENT') {
      throw new ForbiddenException('Students and parents cannot generate questions');
    }

    const kb = await this.prisma.knowledgeBase.findFirst({
      where: { id: knowledgeBaseId, ...(institutionId ? { institutionId } : {}) },
      include: { chunks: { take: 50 } },
    });
    if (!kb) throw new NotFoundException('Knowledge base not found');
    if (kb.chunks.length === 0) throw new BadRequestException('Knowledge base has no chunks to generate from');

    const count = Math.min(options.count ?? 5, 20);
    const chunks = kb.chunks.slice(0, count);
    const created = [];

    for (const chunk of chunks) {
      created.push(
        await this.create(user, {
          type: QuestionType.SHORT_ANSWER,
          boardId: chunk.board || 'cbse',
          grade: options.grade || chunk.grade || '10',
          subjectId: chunk.subject || '',
          chapterId: chunk.chapter || '',
          difficulty: 'MEDIUM',
          text: `Based on the content: "${chunk.content.substring(0, 100)}..." — Write a question about this topic.`,
          answer: 'To be filled by teacher',
          source: QuestionSource.AI,
          aiGenerated: true,
        }),
      );
    }

    return { data: created, note: `Generated ${created.length} draft questions from knowledge base "${kb.name}". Teachers must review and edit before approval.` };
  }
}