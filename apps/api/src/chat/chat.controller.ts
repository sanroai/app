import { Body, Controller, ForbiddenException, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AiService } from '../ai/ai.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubscriptionRequired } from '../common/decorators/auth.decorators';
import { RequestUser } from '../common/types/auth-context';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ChatSchema } from '@sanro/validation';
import { PrismaService } from '../prisma/prisma.service';
import { StudentIdentityService } from '../common/services/student-identity.service';
import { StudentGradeAccessService } from '../common/services/student-grade-access.service';

/**
 * The chat request accepts a chapter next to the concept: the chapter hub has
 * an "Ask SANRO AI about this chapter" button, and the answer must be about the
 * whole chapter (its name, its subject and its concepts), not one concept.
 *
 * `chapterId` is accepted at the top level and inside `context`, so either
 * client shape works.
 */
const ChatRequestSchema = ChatSchema.extend({
  chapterId: z.string().uuid().optional(),
  context: ChatSchema.shape.context
    .unwrap()
    .extend({ chapterId: z.string().uuid().optional() })
    .optional(),
});

interface ChatContextInput {
  conceptId?: string;
  questionId?: string;
  assessmentId?: string;
  chapterId?: string;
}

interface ChatContextPayload {
  conceptName?: string;
  questionText?: string;
  relatedContent?: string[];
  chapterName?: string;
  subjectName?: string;
  chapterConcepts?: string[];
  chapterDescription?: string;
  boardName?: string;
  grade?: string;
}

@ApiTags('chat')
@Controller('chat')
@SubscriptionRequired()
export class ChatController {
  constructor(
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
    private readonly identity: StudentIdentityService,
    private readonly gradeAccess: StudentGradeAccessService,
  ) {}

  @Post('ask-sanro')
  async ask(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(ChatRequestSchema)) body: { message: string; history?: Array<{ role: 'user' | 'assistant'; content: string }>; chapterId?: string; context?: ChatContextInput },
  ) {
    const context = await this.buildContext(user, {
      ...body.context,
      chapterId: body.context?.chapterId ?? body.chapterId,
    });
    return this.ai.answerChat({
      userId: user.sub,
      institutionId: user.institutionId,
      role: this.effectiveRole(user.role),
      message: body.message,
      history: body.history,
      context,
    });
  }

  private effectiveRole(role: RequestUser['role']): 'STUDENT' | 'TEACHER' | 'PARENT' {
    switch (role) {
      case 'STUDENT':
        return 'STUDENT';
      case 'PARENT':
        return 'PARENT';
      default:
        return 'TEACHER';
    }
  }

  private async buildContext(user: RequestUser, ctx?: ChatContextInput): Promise<ChatContextPayload | undefined> {
    if (!ctx) return undefined;
    const result: ChatContextPayload = {};

    if (ctx.chapterId) {
      await this.addChapterContext(user, ctx.chapterId, result);
    }

    if (ctx.conceptId) {
      const concept = await this.prisma.concept.findUnique({
        where: { id: ctx.conceptId },
        include: { topic: { include: { chapter: { include: { subject: { include: { board: true } } } } } } },
      });
      if (concept) {
        result.conceptName = concept.name;
        const chapter = concept.topic.chapter;
        this.gradeAccess.assert(await this.gradeAccess.forUser(user), chapter.grade);
        result.boardName = chapter.subject.board?.name;
        result.grade = chapter.grade;
        const content = await this.prisma.contentItem.findMany({
          where: { conceptId: ctx.conceptId, status: 'APPROVED' },
          select: { title: true },
          take: 3,
        });
        result.relatedContent = content.map((c) => c.title);
      }
    }

    if (ctx.questionId) {
      const question = await this.prisma.question.findUnique({ where: { id: ctx.questionId } });
      result.questionText = question?.text;
    }

    return result;
  }

  /**
   * The chapter the student is on: its name, its subject and its concepts, so
   * "Ask SANRO AI about this chapter" is answered about the whole chapter.
   */
  private async addChapterContext(
    user: RequestUser,
    chapterId: string,
    result: ChatContextPayload,
  ): Promise<void> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        subject: { select: { name: true, board: { select: { name: true } } } },
        topics: { select: { concepts: { select: { id: true, name: true } } } },
      },
    });
    if (!chapter) return;

    // A student may only ask about a class they are enrolled in.
    this.gradeAccess.assert(await this.gradeAccess.forUser(user), chapter.grade);

    result.chapterName = chapter.name;
    result.subjectName = chapter.subject.name;
    result.boardName = chapter.subject.board?.name;
    result.grade = chapter.grade;
    result.chapterConcepts = chapter.topics.flatMap((t) => t.concepts.map((c) => c.name));
    result.chapterDescription = chapter.description ?? undefined;
  }
}
