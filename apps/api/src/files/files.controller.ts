import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { StorageService } from '../common/services/storage.service';
import { Public } from '../common/decorators/auth.decorators';

const MIME: Record<string, string> = {
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.usdz': 'model/vnd.usdz+zip',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  @Public()
  @Get('pdfs/:name')
  getPdf(@Param('name') name: string, @Res() res: Response) {
    const safe = name.replace(/[^a-zA-Z0-9.\-]/g, '');
    this.sendFile(`pdfs/${safe}`, 'application/pdf', res);
  }

  @Public()
  @Get('ar/models/:name')
  getArModel(@Param('name') name: string, @Res() res: Response) {
    const safe = name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const ext = safe.includes('.') ? safe.slice(safe.lastIndexOf('.')) : '.glb';
    this.sendFile(`ar/models/${safe}`, MIME[ext] ?? 'application/octet-stream', res);
  }

  @Public()
  @Get('ar/previews/:name')
  getArPreview(@Param('name') name: string, @Res() res: Response) {
    const safe = name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const ext = safe.includes('.') ? safe.slice(safe.lastIndexOf('.')) : '.png';
    this.sendFile(`ar/previews/${safe}`, MIME[ext] ?? 'application/octet-stream', res);
  }

  private sendFile(key: string, contentType: string, res: Response) {
    if (this.storage.getStorageType() === 'local') {
      const filePath = join(process.cwd(), 'storage', key);
      if (!existsSync(filePath)) {
        res.status(404).json({ message: 'File not found' });
        return;
      }
      const data = readFileSync(filePath);
      const ext = key.includes('.') ? key.slice(key.lastIndexOf('.')) : '';
      res.set({
        'Content-Type': contentType,
        'Content-Length': String(data.length),
        'Cache-Control': 'public, max-age=86400',
        ...(ext === '.glb' ? { 'Content-Disposition': 'inline' } : {}),
      });
      res.end(data);
      return;
    }

    this.storage.getSignedUrl(key).then((signedUrl) => res.redirect(signedUrl));
  }
}
