import { Body, Controller, Get, Param, Patch, Post, Query, Res, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaperStatus } from '@sanro/types';
import { PapersService } from './papers.service';
import { paperHTML } from './paper.template';
import { PdfService } from '../pdf/pdf.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/auth-context';
import { Response } from 'express';

@ApiTags('papers')
@Controller('papers')
export class PapersController {
  constructor(
    private readonly service: PapersService,
    private readonly pdf: PdfService,
  ) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.service.list(user);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.service.generate(user, body as Parameters<typeof this.service.generate>[1]);
  }

  @Get(':id')
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.detail(user, id);
  }

  @Post(':id/duplicate')
  duplicate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.service.duplicate(user, id);
  }

  @Post(':id/regenerate')
  regenerate(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: { questionId: string }) {
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
      return { url: result.url, file: result.path };
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      throw new ServiceUnavailableException('Unable to generate the paper right now.');
    }
  }

  @Patch(':id/status')
  setStatus(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: { status: PaperStatus }) {
    return this.service.setStatus(user, id, body.status, 'STUDENT');
  }
}
