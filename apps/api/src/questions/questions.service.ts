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

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantAccessService,
    private readonly audit: AuditService,
  ) {}

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
    const institutionId = this.tenant.requireInstitution(user);
    const where: Prisma.QuestionWhereInput = {
      OR: [{ institutionId }, { institutionId: null }],
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
    const institutionId = this.tenant.requireInstitution(user);
    const question = await this.prisma.question.findFirst({
      where: { id, OR: [{ institutionId }, { institutionId: null }] },
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
    const institutionId = this.tenant.requireInstitution(user);
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
    const institutionId = this.tenant.requireInstitution(user);
    const question = await this.prisma.question.findFirst({
      where: { id, institutionId },
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
    const institutionId = this.tenant.requireInstitution(user);
    const question = await this.prisma.question.findFirst({
      where: { id, institutionId },
    });
    if (!question) throw new NotFoundException('Question not found');
    if (question.status === 'APPROVED') {
      throw new ForbiddenException('Approved questions cannot be deleted; archive instead');
    }
    await this.prisma.question.delete({ where: { id } });
    return { ok: true };
  }

  async review(user: RequestUser, id: string, action: 'APPROVE' | 'REJECT' | 'ARCHIVE') {
    const institutionId = this.tenant.requireInstitution(user);
    if (user.role !== 'INSTITUTION_ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only admins can approve questions');
    }
    const question = await this.prisma.question.findFirst({
      where: { id, OR: [{ institutionId }, { institutionId: null }] },
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
}