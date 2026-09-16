import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { StorageService } from '../common/services/storage.service';
import { Public } from '../common/decorators/auth.decorators';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  @Public()
  @Get('pdfs/:name')
  async getPdf(@Param('name') name: string, @Res({ passthrough: true }) res: Response) {
    const safe = name.replace(/[^a-zA-Z0-9.\-]/g, '');
    const key = `pdfs/${safe}`;

    if (this.storage.getStorageType() === 'local') {
      const { createReadStream } = await import('node:fs');
      const { join } = await import('node:path');
      const file = createReadStream(join(process.cwd(), 'storage', key));
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${safe}"`,
      });
      return file;
    }

    const signedUrl = await this.storage.getSignedUrl(key);
    res.redirect(signedUrl);
  }
}
