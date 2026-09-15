import { Injectable, Inject, Logger, ServiceUnavailableException } from '@nestjs/common';
import { chromium } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AppConfig } from '../config/app.config';
import { APP_CONFIG_TOKEN } from '../common/common.module';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(@Inject(APP_CONFIG_TOKEN) private readonly config: AppConfig) {}

  getPdfDir(): string {
    return join(process.cwd(), 'storage', 'pdfs');
  }

  async renderHtmlToPdf(html: string, filename?: string): Promise<{ path: string; url: string }> {
    if (this.config.PDF_ENGINE === 'none') {
      throw new ServiceUnavailableException('Unable to generate the paper right now.');
    }
    const dir = this.getPdfDir();
    mkdirSync(dir, { recursive: true });
    const name = filename ?? `${randomUUID()}.pdf`;
    const path = join(dir, name);

    let browser;
    try {
      browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage({ deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: 'load' });
      await page.emulateMedia({ media: 'print' });
      await page.pdf({
        path,
        format: 'A4',
        printBackground: true,
        margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
        preferCSSPageSize: true,
      });
    } catch (err) {
      this.logger.error(`PDF generation failed: ${(err as Error).message}`);
      if (existsSync(path)) {
        await import('node:fs').then((fs) => fs.unlinkSync(path));
      }
      throw new ServiceUnavailableException('Unable to generate the paper right now.');
    } finally {
      if (browser) await browser.close();
    }

    const url = `/api/v1/files/pdfs/${name}`;
    return { path, url };
  }

  async saveHtmlReport(filename: string, html: string): Promise<string> {
    const dir = this.getPdfDir();
    mkdirSync(dir, { recursive: true });
    const path = join(dir, filename);
    writeFileSync(path, html, 'utf8');
    return `/api/v1/files/pdfs/${filename}`;
  }
}