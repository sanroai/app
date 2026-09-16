import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/auth-context';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ChatSchema } from '@sanro/validation';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('explain')
  async explain(
    @CurrentUser() user: RequestUser,
    @Body() body: { conceptId?: string; chapterId?: string },
  ) {
    if (!body.conceptId && !body.chapterId) {
      throw new NotFoundException('Provide conceptId or chapterId');
    }
    let conceptName: string | undefined;
    let chapterName: string | undefined;
    let subjectName: string | undefined;
    if (body.conceptId) {
      const concept = await this.prisma.concept.findUnique({
        where: { id: body.conceptId },
        include: { topic: { include: { chapter: { include: { subject: true } } } } },
      });
      conceptName = concept?.name;
      chapterName = concept?.topic?.chapter?.name;
      subjectName = concept?.topic?.chapter?.subject?.name;
    }
    return {
      explanation: await this.ai.generateExplanation({
        userId: user.sub,
        institutionId: user.institutionId,
        conceptName,
        chapterName,
        subjectName,
      }),
    };
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(ChatSchema)) body: { message: string; context?: { conceptId?: string; questionId?: string; assessmentId?: string } }) {
    const context = await this.buildContext(user, body.context);
    return this.ai.answerChat({
      userId: user.sub,
      institutionId: user.institutionId,
      role: this.effectiveRole(user.role),
      message: body.message,
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

  async buildContext(user: RequestUser, ctx?: { conceptId?: string; questionId?: string; assessmentId?: string }) {
    if (!ctx) return undefined;
    const result: { conceptName?: string; questionText?: string; relatedContent?: string[] } = {};
    if (ctx.conceptId) {
      const concept = await this.prisma.concept.findUnique({
        where: { id: ctx.conceptId },
        include: { topic: { include: { chapter: { include: { subject: { include: { board: true } } } } } } },
      });
      if (!concept) return result;
      result.conceptName = concept.name;
      const content = await this.prisma.contentItem.findMany({
        where: { conceptId: ctx.conceptId, status: 'APPROVED' },
        select: { title: true },
        take: 3,
      });
      result.relatedContent = content.map((c) => c.title);
    }
    if (ctx.questionId) {
      const question = await this.prisma.question.findUnique({ where: { id: ctx.questionId } });
      result.questionText = question?.text;
    }
    return result;
  }
}