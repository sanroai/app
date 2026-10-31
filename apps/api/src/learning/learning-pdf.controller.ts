import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createReadStream } from 'node:fs';
import type { Response } from 'express';
import { Public } from '../common/decorators/auth.decorators';
import { LearningService } from './learning.service';
import { PdfTicketService } from './pdf-ticket.service';

/**
 * Serves a chapter PDF to a browser / system viewer through a signed link.
 *
 * Public by design: the signature *is* the credential (see PdfTicketService).
 * The link can only be minted by an authenticated request that already passed
 * the grade/scope checks, so this route leaks nothing that the app could not
 * already show, and it expires after ten minutes.
 */
@ApiTags('learning')
@Controller('learning/pdf')
export class LearningPdfController {
  constructor(
    private readonly service: LearningService,
    private readonly tickets: PdfTicketService,
  ) {}

  @Public()
  @Get(':chapterId')
  async open(
    @Param('chapterId') chapterId: string,
    @Query('exp') exp: string,
    @Query('sig') sig: string,
    @Res() res: Response,
  ): Promise<void> {
    this.tickets.verify(chapterId, Number(exp), sig);
    const pdf = await this.service.getChapterPdfFile(chapterId);
    if (!pdf) throw new NotFoundException('Chapter PDF not available');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${pdf.fileName}"`,
      'Cache-Control': 'private, max-age=600',
    });
    await new Promise<void>((resolve, reject) => {
      const stream = createReadStream(pdf.path);
      stream.on('error', reject);
      stream.on('end', () => resolve());
      stream.pipe(res);
    }).catch(() => {
      if (!res.headersSent) throw new UnauthorizedException('Chapter PDF could not be read');
    });
  }

  /**
   * One rendered textbook page as a PNG.
   *
   * Same ticket as the PDF: the signature already proves an authenticated,
   * grade-checked user asked for this chapter, and the page index is validated
   * against the files that exist, so no path can be walked.
   */
  @Public()
  @Get(':chapterId/pages/:page')
  async page(
    @Param('chapterId') chapterId: string,
    @Param('page') page: string,
    @Query('exp') exp: string,
    @Query('sig') sig: string,
    @Res() res: Response,
  ): Promise<void> {
    this.tickets.verify(chapterId, Number(exp), sig);

    const index = Number(page);
    if (!Number.isInteger(index) || index < 1) throw new NotFoundException('Page not available');

    const file = await this.service.getChapterPageFile(chapterId, index);
    if (!file) throw new NotFoundException('Page not available');

    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'private, max-age=3600',
      // Helmet defaults every response to `same-origin`, which makes the browser
      // refuse the image when the web app runs on another origin (localhost:3000
      // vs the API, and app.sanroai.com vs api.sanroai.com in production). The
      // signature above is what protects this file, so it may cross origins.
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });
    await new Promise<void>((resolve, reject) => {
      const stream = createReadStream(file);
      stream.on('error', reject);
      stream.on('end', () => resolve());
      stream.pipe(res);
    }).catch(() => {
      if (!res.headersSent) throw new NotFoundException('Page not available');
    });
  }
}
