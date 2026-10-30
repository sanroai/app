import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { APP_CONFIG_TOKEN } from '../common/common.constants';
import type { AppConfig } from '../config/app.config';

/**
 * Short-lived, capability-style links to a chapter PDF.
 *
 * The PDF route is behind the JWT guard, which a browser navigation (Chrome,
 * the system PDF viewer, `Linking.openURL`) cannot satisfy - it sends no
 * Authorization header. Android's WebView cannot render PDFs at all, so the
 * in-app WebView attempt used to end in "Download unsuccessful".
 *
 * The app therefore asks for a signed link (`POST /learning/chapters/:id/pdf-link`),
 * which is only issued after the normal authenticated + grade checks, and hands
 * the resulting URL to the platform viewer. The link is an HMAC over
 * `chapterId.exp` with the API's auth secret, valid for 10 minutes, so it cannot
 * be forged, reused for another chapter, or used as a permanent credential.
 */
const TTL_SECONDS = 600;
const PAGES_TTL_SECONDS = 3600;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class PdfTicketService {
  constructor(@Inject(APP_CONFIG_TOKEN) private readonly config: AppConfig) {}

  private sign(chapterId: string, exp: number): string {
    return createHmac('sha256', this.config.AUTH_SECRET)
      .update(`${chapterId}.${exp}`)
      .digest('base64url')
      .slice(0, 43);
  }

  issue(chapterId: string): { path: string; expiresAt: string } {
    const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
    const sig = this.sign(chapterId, exp);
    return {
      path: `/learning/pdf/${chapterId}?exp=${exp}&sig=${sig}`,
      expiresAt: new Date(exp * 1000).toISOString(),
    };
  }

  /**
   * One signed path per rendered page.
   *
   * A longer window than the PDF: a student reads for twenty minutes or more, and
   * every page image is fetched lazily as it scrolls into view.
   */
  chapterPages(chapterId: string, count: number): { expiresAt: string; paths: string[] } {
    const exp = Math.floor(Date.now() / 1000) + PAGES_TTL_SECONDS;
    const sig = this.sign(chapterId, exp);
    return {
      expiresAt: new Date(exp * 1000).toISOString(),
      paths: Array.from(
        { length: count },
        (_, index) => `/learning/pdf/${chapterId}/pages/${index + 1}?exp=${exp}&sig=${sig}`,
      ),
    };
  }

  verify(chapterId: string, exp: number, sig: string): void {
    if (!UUID.test(chapterId)) throw new UnauthorizedException('Invalid PDF link');
    if (!Number.isFinite(exp) || exp * 1000 < Date.now()) {
      throw new UnauthorizedException('PDF link expired - open the chapter again');
    }
    const expected = Buffer.from(this.sign(chapterId, exp));
    const received = Buffer.from(String(sig ?? ''));
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      throw new UnauthorizedException('Invalid PDF link');
    }
  }
}
