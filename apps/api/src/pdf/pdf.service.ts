import { Injectable, Inject, Logger, ServiceUnavailableException } from '@nestjs/common';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AppConfig } from '../config/app.config';
import { APP_CONFIG_TOKEN } from '../common/common.constants';
import { StorageService } from '../common/services/storage.service';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    @Inject(APP_CONFIG_TOKEN) private readonly config: AppConfig,
    private readonly storage: StorageService,
  ) {}

  async renderHtmlToPdf(html: string, filename?: string): Promise<{ path: string; url: string; key: string }> {
    if (this.config.PDF_ENGINE === 'none') {
      throw new ServiceUnavailableException('PDF engine not available.');
    }
    const name = filename ?? `${randomUUID()}.pdf`;

    let browser;
    try {
      browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage({ deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: 'load' });
      await page.emulateMedia({ media: 'print' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
        preferCSSPageSize: true,
      });

      const result = await this.storage.upload('pdfs', name, pdfBuffer, 'application/pdf');
      return { path: result.key, url: result.url, key: result.key };
    } catch (err) {
      this.logger.error(`PDF generation failed: ${(err as Error).message}`);
      throw new ServiceUnavailableException('Unable to generate the paper right now.');
    } finally {
      if (browser) await browser.close();
    }
  }

  async getPdfUrl(key: string): Promise<string> {
    return this.storage.getSignedUrl(key);
  }
}
