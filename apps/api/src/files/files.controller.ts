import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import { Response } from 'express';
import { PdfService } from '../pdf/pdf.service';
import { Public } from '../common/decorators/auth.decorators';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly pdf: PdfService) {}

  @Public()
  @Get('pdfs/:name')
  getPdf(@Param('name') name: string, @Res({ passthrough: true }) res: Response): StreamableFile {
    const safe = name.replace(/[^a-zA-Z0-9.\-]/g, '');
    const file = createReadStream(join(this.pdf.getPdfDir(), safe));
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${safe}"`,
    });
    return new StreamableFile(file);
  }
}