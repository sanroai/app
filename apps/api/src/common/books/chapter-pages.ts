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
 * `<grade>-<subject>` -> the whole class textbook, for subjects whose chapters are
 * Sanro's own lesson sets rather than NCERT chapters.
 *
 * Classes 1-4 Science and Mathematics have no per-chapter textbook to map onto, but
 * the class does have a real NCERT book (published by
 * `scripts/qa/publish-primary-books.mjs`). Rather than tell a student there is no
 * textbook, the reader falls back to that whole book. Class 1-2 Science has no
 * NCERT book at all (EVS starts at class 3), so those chapters stay honest.
 */
const FULL_BOOKS: Record<string, string> = {
  '3-SCI': 'BOOK-SCI-3',
  '3-MAT': 'BOOK-MAT-3',
  '4-SCI': 'BOOK-SCI-4',
  '4-MAT': 'BOOK-MAT-4',
};

function pageUrls(key: string, pages: number[]): string[] {
  const dir = `${TEXTBOOK_CDN}/${key}`;
  return pages.map((page) => `${dir}/p${String(page).padStart(3, '0')}.jpg`);
}

/** The whole-class book this chapter falls back to, or null. */
function fullBookKey(code: string | null | undefined): string | null {
  const parsed = /^([A-Z]+)-(\d{1,2})(?:P\d)?-/.exec(code ?? '');
  if (!parsed) return null;
  return FULL_BOOKS[`${parsed[2]}-${parsed[1]}`] ?? null;
}

/** True when a chapter is served from its class's whole textbook, not its own pages. */
export function chapterPagesAreBookLevel(code: string | null | undefined): boolean {
  if (REMOTE_PAGES[code ?? '']?.length) return false;
  const key = fullBookKey(code);
  return Boolean(key && REMOTE_PAGES[key]?.length);
}

/**
 * Public CDN URLs of a chapter's page images, in reading order.
 *
 * Empty when neither the chapter nor its class has a published book. These URLs
 * need no signature: they are public NCERT pages, and a plain `<img>`/`<Image>`
 * tag has to be able to fetch them.
 */
export function chapterPageRemoteUrls(code: string | null | undefined): string[] {
  if (!code) return [];
  const own = REMOTE_PAGES[code];
  if (own?.length) return pageUrls(code, own);

  const key = fullBookKey(code);
  const book = key ? REMOTE_PAGES[key] : undefined;
  return book?.length ? pageUrls(key as string, book) : [];
}
