import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

export { CHAPTER_SEGMENT_LIMIT } from './chapter-segments';
export type { ChapterSegment } from './chapter-segments';

interface SubjectBook {
  /** The NCERT file-name prefix, e.g. `jesc1` -> `jesc104.pdf`. */
  prefix: string;
  /** The folder under `books/cbse/class-<grade>/` that holds the book. */
  folder: string;
}

/**
 * Curriculum chapter code -> the NCERT PDF that contains it, per class.
 *
 * `SCI-10-4`  -> class 10 science `jesc104.pdf`
 * `SCI-9-4`   -> class 9 science `iesc104.pdf`
 * `MAT-10-12` -> class 10 mathematics `jemh112.pdf`
 * `MAT-9-3`   -> class 9 mathematics `iemh103.pdf` (the class-9 folder is `math`)
 * `ENG-10-3`  -> class 10 english `jeff103.pdf`
 * `ENG-9-3`   -> class 9 english `iebe103.pdf`
 * `SCI-7-4`   -> class 7 science `gecu104.pdf`
 * `SCI-5-1`   -> class 5 EVS `eeev101.pdf` (the class-5 folder is `world`)
 */
const CLASS_BOOKS: Record<string, Record<string, SubjectBook>> = {
  '5': {
    SCI: { prefix: 'eeev1', folder: 'world' },
    MAT: { prefix: 'eemm1', folder: 'math' },
    ENG: { prefix: 'eesa1', folder: 'english' },
  },
  '6': {
    SCI: { prefix: 'fecu1', folder: 'science' },
    MAT: { prefix: 'fegp1', folder: 'math' },
    ENG: { prefix: 'fepr1', folder: 'english' },
  },
  '7': {
    SCI: { prefix: 'gecu1', folder: 'science' },
    MAT: { prefix: 'gegp1', folder: 'math 1' },
    ENG: { prefix: 'gepr1', folder: 'english' },
  },
  '8': {
    SCI: { prefix: 'hecu1', folder: 'science' },
    MAT: { prefix: 'hegp1', folder: 'math part 1' },
    ENG: { prefix: 'hepr1', folder: 'english' },
  },
  '9': {
    SCI: { prefix: 'iesc1', folder: 'science' },
    MAT: { prefix: 'iemh1', folder: 'math' },
    ENG: { prefix: 'iebe1', folder: 'english' },
  },
  '10': {
    SCI: { prefix: 'jesc1', folder: 'science' },
    MAT: { prefix: 'jemh1', folder: 'mathematics' },
    ENG: { prefix: 'jeff1', folder: 'english' },
  },
};

/**
 * Books that are split into two volumes number their chapters from 1 in each volume, so
 * the plain code cannot say which volume it means. A namespaced code (`MAT-7P2-3`)
 * selects volume 2; a plain `MAT-7-3` is volume 1.
 */
const PART_CODE = /^([A-Z]+)-(\d{1,2})P(\d)-(\d+)$/;

const PART_BOOKS: Record<string, Record<string, SubjectBook>> = {
  '7': { MAT: { prefix: 'gegp2', folder: 'math 2' } },
  '8': { MAT: { prefix: 'hegp2', folder: 'math part 2' } },
};

const CHAPTER_CODE = /^([A-Z]+)-(\d{1,2})-(\d+)$/;

interface ParsedChapterCode {
  grade: string;
  book: SubjectBook;
  chapterNumber: number;
}

let booksRoot: string | null | undefined;

/**
 * Locates `books/cbse` by walking up from this file.
 *
 * The module runs from `src/common/books` in dev and from `dist/common/books`
 * after a build, and the API may also be started from another working
 * directory - a fixed `../../..` chain silently points at the wrong place, so
 * the root is discovered instead. The answer is cached: the tree does not move
 * while the process runs.
 */
function findBooksRoot(): string | null {
  if (booksRoot !== undefined) return booksRoot;

  const candidates: string[] = [];
  let dir = __dirname;
  for (let depth = 0; depth < 8; depth += 1) {
    candidates.push(dir);
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  candidates.push(process.cwd());

  for (const base of candidates) {
    const root = join(base, 'books', 'cbse');
    if (existsSync(root)) {
      booksRoot = root;
      return booksRoot;
    }
  }

  booksRoot = null;
  return booksRoot;
}

function parseChapterCode(code: string | null | undefined): ParsedChapterCode | null {
  if (!code) return null;
  const trimmed = code.trim();

  // a namespaced code selects one volume of a split book (MAT-8P2-3 -> maths part 2)
  const partMatch = PART_CODE.exec(trimmed);
  if (partMatch) {
    const [, subject, grade, volume, chapter] = partMatch;
    const book = PART_BOOKS[grade]?.[subject];
    if (!book) return null;
    return { grade, book, chapterNumber: Number(chapter) };
  }

  const match = CHAPTER_CODE.exec(trimmed);
  if (!match) return null;
  const [, subject, grade, chapter] = match;
  const book = CLASS_BOOKS[grade]?.[subject];
  if (!book) return null;
  return { grade, book, chapterNumber: Number(chapter) };
}

/** The PDF file name for a chapter code, or null when the code is not a book chapter. */
export function chapterBookFile(code: string | null | undefined): string | null {
  const parsed = parseChapterCode(code);
  if (!parsed) return null;
  return `${parsed.book.prefix}${String(parsed.chapterNumber).padStart(2, '0')}.pdf`;
}

/**
 * The official NCERT URL of a chapter PDF, or null when the code is not a book chapter.
 *
 * The book tree is git-ignored and local-only, so a deployed API has no files on
 * disk. NCERT publishes every chapter under the same file name the book tree uses
 * (`jesc104.pdf`, `iemh103.pdf`), so a deployment can still send a student to the
 * real textbook instead of showing "not available".
 */
export function chapterPdfRemoteUrl(code: string | null | undefined): string | null {
  const file = chapterBookFile(code);
  if (!file) return null;
  return `https://ncert.nic.in/textbook/pdf/${file}`;
}

/** The absolute path of a chapter PDF on disk, or null when it is not available. */
export function chapterPdfPath(code: string | null | undefined): string | null {
  const parsed = parseChapterCode(code);
  const file = chapterBookFile(code);
  const root = findBooksRoot();
  if (!parsed || !file || !root) return null;

  const classDir = join(root, `class-${parsed.grade}`, parsed.book.folder);
  const candidates = [join(classDir, 'source', file), join(classDir, file)];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * The screenshots folder of a chapter (`chapters/NN-slug/screenshots`), or null.
 *
 * Chapter folders are numbered `NN-slugified-title`, so the chapter number from the
 * code picks the folder. The class-8 maths volumes both number 1-7; the book
 * folder (`math part 1` / `math part 2`) keeps them apart.
 */
export function chapterPagesDir(code: string | null | undefined): string | null {
  const parsed = parseChapterCode(code);
  const root = findBooksRoot();
  if (!parsed || !root) return null;

  const chaptersDir = join(root, `class-${parsed.grade}`, parsed.book.folder, 'chapters');
  if (!existsSync(chaptersDir)) return null;

  const prefix = `${String(parsed.chapterNumber).padStart(2, '0')}-`;
  const folder = readdirSync(chaptersDir, { withFileTypes: true }).find(
    (entry) => entry.isDirectory() && entry.name.startsWith(prefix),
  );
  if (!folder) return null;

  const shots = join(chaptersDir, folder.name, 'screenshots');
  return existsSync(shots) ? shots : null;
}

/** A readable file name for the chapter PDF download (no path traversal). */
export function chapterPdfFileName(chapterName: string | null | undefined, code: string | null | undefined): string {
  const safeName = (chapterName ?? 'Chapter')
    .replace(/[^a-zA-Z0-9 \-_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  const safeCode = (code ?? '').replace(/[^a-zA-Z0-9\-_]/g, '');
  const base = safeName || 'Chapter';
  return safeCode ? `${base} (${safeCode}).pdf` : `${base}.pdf`;
}
