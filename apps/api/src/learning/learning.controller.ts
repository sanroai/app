import { Controller, Get, NotFoundException, Param, Post, Delete, Body, Query, UseGuards, Res, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LearningService, clampQuestionCount } from './learning.service';
import { PdfTicketService } from './pdf-ticket.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles, SubscriptionRequired } from '../common/decorators/auth.decorators';
import { RequestUser } from '../common/types/auth-context';
import { ParentContentGuard, PARENT_RESTRICTED_KEY } from '../common/guards/parent-content.guard';
import { SetMetadata } from '@nestjs/common';
import { Response } from 'express';
import { readFileSync } from 'node:fs';

@ApiTags('learning')
@Controller('learning')
@UseGuards(ParentContentGuard)
@SubscriptionRequired()
export class LearningController {
  constructor(
    private readonly service: LearningService,
    private readonly pdfTickets: PdfTicketService,
  ) {}

  private uuidOrBadRequest(value: string): void {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      throw new NotFoundException('Resource not found');
    }
  }

  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Get('home')
  home(@CurrentUser() user: RequestUser) {
    return this.service.getLearningHome(user);
  }

  /**
   * Ready-made exams for the student's classes: term-wise and class-test papers
   * generated from the approved question bank, so a class always has something to
   * solve without waiting for a teacher to author a paper.
   */
  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Get('exams')
  exams(@CurrentUser() user: RequestUser) {
    return this.service.listExams(user);
  }

  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Post('exams/:key/start')
  startExam(@CurrentUser() user: RequestUser, @Param('key') key: string) {
    return this.service.startExam(user, key);
  }

  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Get('boards/:boardId/grades/:grade/subjects/:subjectId/chapters')
  chapters(
    @CurrentUser() user: RequestUser,
    @Param('boardId') boardId: string,
    @Param('grade') grade: string,
    @Param('subjectId') subjectId: string,
  ) {
    return this.service.getChapters(user, boardId, grade, subjectId);
  }

  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Get('chapters/:chapterId')
  chapterDetail(@CurrentUser() user: RequestUser, @Param('chapterId') chapterId: string) {
    this.uuidOrBadRequest(chapterId);
    return this.service.getChapterDetail(user, chapterId);
  }

  /**
   * The NCERT PDF of a chapter. 404 when the book is not on disk, so the
   * client can show a graceful "not available" state.
   */
  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Get('chapters/:chapterId/pdf')
  async chapterPdf(
    @CurrentUser() user: RequestUser,
    @Param('chapterId') chapterId: string,
    @Res() res: Response,
  ): Promise<void> {
    this.uuidOrBadRequest(chapterId);
    const pdf = await this.service.getChapterPdf(user, chapterId);
    if (!pdf) {
      throw new NotFoundException('Chapter PDF not available');
    }
    const data = readFileSync(pdf.path);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': String(data.length),
      'Content-Disposition': `inline; filename="${pdf.fileName}"`,
      'Cache-Control': 'private, max-age=3600',
    });
    res.end(data);
  }

  /**
   * A signed, ten-minute link to the same PDF.
   *
   * Browsers and the platform PDF viewer cannot send the bearer token, and
   * Android's WebView cannot render PDFs, so the client asks for this link and
   * opens it with the system viewer. Issuing it runs the same grade check as the
   * direct download, and the link is bound to this chapter only.
   */
  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Post('chapters/:chapterId/pdf-link')
  async chapterPdfLink(
    @CurrentUser() user: RequestUser,
    @Param('chapterId') chapterId: string,
  ): Promise<{ path: string; expiresAt: string }> {
    this.uuidOrBadRequest(chapterId);
    const pdf = await this.service.getChapterPdf(user, chapterId);
    if (!pdf) throw new NotFoundException('Chapter PDF not available');
    return this.pdfTickets.issue(chapterId);
  }

  /**
   * The rendered pages of this chapter's textbook.
   *
   * Clients read the book as images (a WebView cannot render PDF on Android, and
   * a PDF link downloads). `pages` are short-lived signed image URLs, so an
   * `<img>`/`<Image>` tag works without attaching the bearer token.
   */
  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Get('chapters/:chapterId/pages')
  async chapterPages(
    @CurrentUser() user: RequestUser,
    @Param('chapterId') chapterId: string,
  ): Promise<{ count: number; pages: Array<{ index: number; path: string }>; expiresAt: string }> {
    this.uuidOrBadRequest(chapterId);
    const { files } = await this.service.getChapterPages(user, chapterId);
    const { paths, expiresAt } = this.pdfTickets.chapterPages(chapterId, files.length);
    return {
      count: files.length,
      expiresAt,
      pages: paths.map((path, index) => ({ index: index + 1, path })),
    };
  }

  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Get('concepts/:conceptId')
  conceptDetail(@CurrentUser() user: RequestUser, @Param('conceptId') conceptId: string) {
    this.uuidOrBadRequest(conceptId);
    return this.service.getConceptDetail(user, conceptId);
  }

  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Post('content/:contentId/complete')
  completeContent(@CurrentUser() user: RequestUser, @Param('contentId') contentId: string) {
    return this.service.completeContent(user, contentId);
  }

  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Delete('content/:contentId/complete')
  uncompleteContent(@CurrentUser() user: RequestUser, @Param('contentId') contentId: string) {
    this.uuidOrBadRequest(contentId);
    return this.service.uncompleteContent(user, contentId);
  }

  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Get('progress')
  progress(@CurrentUser() user: RequestUser) {
    return this.service.getLearningProgress(user);
  }

  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Get('path')
  path(@CurrentUser() user: RequestUser) {
    return this.service.getLearningPath(user);
  }

  @Roles('STUDENT')
  @SetMetadata(PARENT_RESTRICTED_KEY, true)
  @Post('practice/start')
  startPractice(
    @CurrentUser() user: RequestUser,
    @Body() body: { conceptId?: string; chapterId?: string; questionCount?: number },
  ) {
    if (body?.chapterId) {
      this.uuidOrBadRequest(body.chapterId);
      return this.service.startChapterPractice(
        user,
        body.chapterId,
        clampQuestionCount(body.questionCount, 10),
      );
    }
    if (!body?.conceptId) {
      throw new BadRequestException('conceptId or chapterId is required');
    }
    return this.service.startPractice(
      user,
      body.conceptId,
      clampQuestionCount(body.questionCount, 5),
    );
  }

  @Roles('STUDENT')
  @Get('practice/:practiceId')
  getPractice(
    @CurrentUser() user: RequestUser,
    @Param('practiceId') practiceId: string,
  ) {
    return this.service.getPractice(user, practiceId);
  }

  @Roles('STUDENT')
  @Post('practice/:practiceId/answer')
  savePracticeAnswer(
    @CurrentUser() user: RequestUser,
    @Param('practiceId') practiceId: string,
    @Body() body: { questionId: string; answer: string },
  ) {
    return this.service.savePracticeAnswer(user, practiceId, body.questionId, body.answer);
  }

  @Roles('STUDENT')
  @Post('practice/:practiceId/submit')
  submitPractice(
    @CurrentUser() user: RequestUser,
    @Param('practiceId') practiceId: string,
  ) {
    return this.service.submitPractice(user, practiceId);
  }

  @Get('gamification/profile')
  gamificationProfile(@CurrentUser() user: RequestUser) {
    return this.service.getGamificationProfile(user);
  }

  @Get('gamification/leaderboard')
  leaderboard(
    @CurrentUser() user: RequestUser,
    @Query('period') period?: string,
    @Query('groupId') groupId?: string,
  ) {
    const allowed = ['weekly', 'monthly', 'all', 'alltime'];
    if (period && !allowed.includes(period.toLowerCase())) {
      throw new BadRequestException(`period must be one of ${allowed.join(', ')}`);
    }
    return this.service.getLeaderboard(user, period ?? 'weekly', groupId);
  }

  @Get('gamification/achievements')
  achievements(@CurrentUser() user: RequestUser) {
    return this.service.getAchievements(user);
  }
}
