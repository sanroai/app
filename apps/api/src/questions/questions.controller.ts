import { Body, Controller, Delete, Get, Param, Patch, Post, Query, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { QuestionSource, QuestionType, Role } from '@sanro/types';
import { QuestionsService } from './questions.service';
import { AiService } from '../ai/ai.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/auth.decorators';
import { RequestUser } from '../common/types/auth-context';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('questions')
@Controller('questions')
export class QuestionsController {
  constructor(
    private readonly service: QuestionsService,
    private readonly ai: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() q: Record<string, string | undefined>) {
    return this.service.list(user, q as Record<string, string | undefined>);
  }

  @Get(':id')
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.detail(user, id);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.service.create(user, body as Parameters<typeof this.service.create>[1]);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Patch(':id')
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(user, id, body);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Delete(':id')
  delete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.delete(user, id);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post(':id/review')
  review(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: { action: 'APPROVE' | 'REJECT' | 'ARCHIVE' }) {
    return this.service.review(user, id, body.action);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post('ai-generate')
  async aiGenerate(
    @CurrentUser() user: RequestUser,
    @Body() body: { count?: number; chapterId: string; conceptId?: string; topicId?: string; difficulty?: string },
  ) {
    if (!this.ai.available()) {
      throw new ServiceUnavailableException('AI generation is temporarily unavailable.');
    }
    const chapter = await this.prisma.chapter.findUnique({
      where: { id: body.chapterId },
      include: { subject: true },
    });
    if (!chapter) throw new Error('Chapter not found');

    let conceptName: string | undefined;
    if (body.conceptId) {
      conceptName = (await this.prisma.concept.findUnique({ where: { id: body.conceptId } }))?.name;
    }

    const aiQuestions = await this.ai.generateQuestionSet(
      {
        userId: user.sub,
        institutionId: user.institutionId,
        grade: chapter.grade,
        subjectName: chapter.subject.name,
        chapterName: chapter.name,
        conceptName,
      },
      Math.min(body.count ?? 5, 20),
    );

    const created = [];
    for (const aq of aiQuestions) {
      created.push(
        await this.service.create(user, {
          type: aq.type ?? QuestionType.MCQ,
          boardId: chapter.subject.boardId,
          grade: chapter.grade,
          subjectId: chapter.subjectId,
          chapterId: chapter.id,
          topicId: body.topicId,
          conceptId: body.conceptId,
          difficulty: aq.difficulty ?? 'MEDIUM',
          marks: aq.marks,
          text: aq.text,
          options: aq.options,
          answer: aq.answer,
          explanation: aq.explanation,
          source: QuestionSource.AI,
          aiGenerated: true,
        }),
      );
    }
    return { data: created, note: 'Generated questions are DRAFT and require teacher review before approval.' };
  }
}