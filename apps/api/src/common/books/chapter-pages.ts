import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { chapterPagesDir } from './chapter-pdf';
import pageManifest from './chapter-pages-manifest.json';

/**
 * The rendered NCERT pages of a chapter (`books/.../chapters/<slug>/screenshots/pNNN.png`).
 *
 * The extractor already renders every page of every extracted book to a 1240 px
 * PNG, so the textbook can be read in the app without a PDF plugin: an Android
 * WebView cannot render PDF at all, and handing the file to Chrome downloads it
 * instead of showing it. The pages are the same content, one image per page.
 *
 * Everything is disk-derived and best-effort (the `books/` tree is git-ignored and
 * local-only), so callers must treat `[]` as "no textbook on this deployment".
 */
const PAGE_FILE = /^p(\d+)\.png$/i;

/** Absolute paths of a chapter's page images, in reading order. */
export function chapterPageFiles(code: string | null | undefined): string[] {
  const dir = chapterPagesDir(code);
  if (!dir) return [];

  return readdirSync(dir)
    .map((name) => {
      const match = PAGE_FILE.exec(name);
      return match ? { name, order: Number(match[1]) } : null;
    })
    .filter((entry): entry is { name: string; order: number } => entry !== null)
    .sort((a, b) => a.order - b.order)
    .map((page) => join(dir, page.name));
}

/**
 * Base URL of the static textbook CDN (a Cloudflare Pages project).
 *
 * The `books/` tree is git-ignored, so no deployment ever has the page images on
 * disk. `scripts/qa/publish-textbook-cdn.mjs` renders them to compact JPEGs and
 * uploads them as `<CHAPTER_CODE>/pNNN.jpg`; this constant is where they live.
 * Override with `TEXTBOOK_CDN_URL` to point at a staging deployment.
 */
const TEXTBOOK_CDN = (process.env.TEXTBOOK_CDN_URL ?? 'https://books.sanroai.com').replace(/\/+$/, '');

/** Chapter code -> the 1-based page numbers published for it. */
const REMOTE_PAGES: Record<string, number[]> = pageManifest as Record<string, number[]>;

/**
 * Public CDN URLs of a chapter's page images, in reading order.
 *
 * Empty when the chapter has no published book (classes 1-2 carry no NCERT book at
 * all, and a handful of chapters have none). These URLs need no signature: they are
 * public NCERT pages, and a plain `<img>`/`<Image>` tag has to be able to fetch them.
 */
export function chapterPageRemoteUrls(code: string | null | undefined): string[] {
  if (!code) return [];
  const pages = REMOTE_PAGES[code];
  if (!pages?.length) return [];

  const dir = `${TEXTBOOK_CDN}/${code}`;
  return pages.map((page) => `${dir}/p${String(page).padStart(3, '0')}.jpg`);
}
