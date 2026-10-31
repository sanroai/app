import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { chapterPagesDir } from './chapter-pdf';

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
