#!/usr/bin/env node
/**
 * Publishes the whole class 3/4 textbooks (EVS + Mathematics) to the CDN.
 *
 * Classes 1-4 Science and Mathematics are Sanro's own lesson sets, not NCERT
 * chapter-for-chapter, so there is no per-chapter PDF to map them onto. What does
 * exist is the class's real NCERT textbook, so the reader falls back to that as a
 * **subject-level book**: the student reads the actual Class 3 Mathematics book
 * rather than being told there is no textbook at all.
 *
 * Chapters are concatenated in order into a single page sequence under a book key
 * (`BOOK-MAT-3`, ...) which `chapterPageRemoteUrls` looks up for a chapter whose
 * own code has no book.
 *
 * Usage: node scripts/qa/publish-primary-books.mjs [--out <dir>]
 * Requires the PDFs to be downloaded first into artifacts/qa/2026-11-02/primary-book-cache
 * (PowerShell - Node's fetch is reset by ncert.nic.in).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFParse } from 'pdf-parse';
import sharp from 'sharp';
import { pdfjsAssetOptions } from '../books/pdfjs-assets.cjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const MANIFEST = join(ROOT, 'apps', 'api', 'src', 'common', 'books', 'chapter-pages-manifest.json');

const args = process.argv.slice(2);
const outArg = args.indexOf('--out');
const OUT = outArg >= 0 ? args[outArg + 1] : join(ROOT, 'artifacts', 'qa', '2026-11-02', 'textbook-cdn');
const CACHE = join(ROOT, 'artifacts', 'qa', '2026-11-02', 'primary-book-cache');

/**
 * NCERT prefix -> the book key published to the CDN.
 *
 * `ceev1` = Class 3 EVS, `cemm1` = Class 3 Mathematics,
 * `deev1` = Class 4 EVS, `demm1` = Class 4 Mathematics.
 */
const BOOKS = [
  { prefix: 'ceev1', key: 'BOOK-SCI-3' },
  { prefix: 'cemm1', key: 'BOOK-MAT-3' },
  { prefix: 'deev1', key: 'BOOK-SCI-4' },
  { prefix: 'demm1', key: 'BOOK-MAT-4' },
];

const WIDTH = 1240;
const QUALITY = 70;

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
let grandTotal = 0;

for (const book of BOOKS) {
  const dir = join(CACHE, book.prefix);
  if (!existsSync(dir)) {
    console.log(`${book.key}: no cache at ${dir}, skipped`);
    continue;
  }
  const pdfs = readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith('.pdf'))
    .sort();
  if (!pdfs.length) {
    console.log(`${book.key}: no PDFs, skipped`);
    continue;
  }

  const outDir = join(OUT, book.key);
  mkdirSync(outDir, { recursive: true });

  let page = 0;
  for (const pdf of pdfs) {
    const parser = new PDFParse({ data: new Uint8Array(readFileSync(join(dir, pdf))), ...pdfjsAssetOptions() });
    try {
      const text = await parser.getText({ pageJoiner: '\n' });
      const count = (text.pages || []).length;
      const BATCH = 8;
      for (let start = 1; start <= count; start += BATCH) {
        const partial = [];
        for (let n = start; n < Math.min(start + BATCH, count + 1); n += 1) partial.push(n);
        const shots = await parser.getScreenshot({ partial, desiredWidth: WIDTH, imageBuffer: true, imageDataUrl: false });
        for (const shot of shots.pages) {
          page += 1;
          await sharp(Buffer.from(shot.data))
            .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
            .toFile(join(outDir, `p${String(page).padStart(3, '0')}.jpg`));
        }
      }
    } finally {
      await parser.destroy?.();
    }
  }

  manifest[book.key] = Array.from({ length: page }, (_, i) => i + 1);
  grandTotal += page;
  console.log(`${book.key}: ${pdfs.length} chapters -> ${page} pages`);
}

writeFileSync(MANIFEST, `${JSON.stringify(manifest)}\n`);
console.log(`\ndone: ${grandTotal} pages, manifest now ${Object.keys(manifest).length} entries`);
