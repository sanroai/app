import { Body, Controller, Get, Logger, Param, Patch, Post, Query, Res, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaperStatus, Role } from '@sanro/types';
import { PapersService } from './papers.service';
import { paperHTML } from './paper.template';
import { PdfService } from '../pdf/pdf.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles, SubscriptionRequired } from '../common/decorators/auth.decorators';
import { RequestUser } from '../common/types/auth-context';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreatePaperSchema, RegeneratePaperQuestionsSchema } from '@sanro/validation';
import { Response } from 'express';

@ApiTags('papers')
@Controller('papers')
@SubscriptionRequired()
export class PapersController {
  private readonly logger = new Logger(PapersController.name);
  constructor(
    private readonly service: PapersService,
    private readonly pdf: PdfService,
  ) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.service.list(user);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post()
  create(@CurrentUser() user: RequestUser, @Body(new ZodValidationPipe(CreatePaperSchema)) body: unknown) {
    return this.service.generate(user, body as Parameters<typeof this.service.generate>[1]);
  }

  @Get(':id')
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.detail(user, id);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post(':id/duplicate')
  duplicate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.duplicate(user, id);
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post(':id/regenerate')
  regenerate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body(new ZodValidationPipe(RegeneratePaperQuestionsSchema)) body: { questionId: string }) {
    return this.service.regenerateQuestion(user, id, body.questionId);
  }

  @Get(':id/validate')
  validate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.validatePaper(user.institutionId!, id);
  }

  @Get(':id/preview')
  async preview(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Query('kind') kind: 'STUDENT' | 'ANSWER_KEY',
    @Res({ passthrough: true }) res: Response,
  ) {
    const paper = await this.service.resolvePaper(user.institutionId!, id);
    const html = paperHTML(paper, kind ?? 'STUDENT');
    res.set('Content-Type', 'text/html; charset=utf-8');
    return html;
  }

  @Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Post(':id/export')
  async exportPdf(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: { kind: 'STUDENT' | 'ANSWER_KEY' },
  ) {
    const kind = body.kind ?? 'STUDENT';
    const paper = await this.service.resolvePaper(user.institutionId!, id);
    const html = paperHTML(paper, kind);
    try {
      const name = `${paper.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${kind}_${Date.now()}.pdf`;
      const result = await this.pdf.renderHtmlToPdf(html, name);
      await this.service.setStatus(user, id, 'EXPORTED' as PaperStatus, kind);
      return { url: result.url, file: result.path, engine: 'playwright' };
    } catch (err) {
      this.logger.warn(`Playwright PDF failed, falling back to HTML preview: ${(err as Error).message}`);
      const previewUrl = `/api/v1/papers/${id}/preview?kind=${kind}`;
      return { url: previewUrl, html, engine: 'html-fallback' };
    }
  }

@Roles(Role.INSTITUTION_ADMIN, Role.TEACHER)
  @Patch(':id/status')
  setStatus(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: { status: PaperStatus }) {
    return this.service.setStatus(user, id, body.status, 'STUDENT');
  }
}
