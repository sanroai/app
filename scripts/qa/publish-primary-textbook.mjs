#!/usr/bin/env node
/**
 * Publishes the primary-class (1-4) English chapters to the textbook CDN.
 *
 * Classes 1-4 are not extracted into the local `books/` tree, so their chapters
 * had no pages and the app said "No textbook available". Their English chapters
 * are exactly the units of the NCERT Marigold books (`aemr1`, `bemr1`, `cesa1`,
 * `desa1`), one seeded chapter per unit, so the official chapter PDF is the right
 * textbook for each of them.
 *
 * Downloads each chapter PDF, renders it to 1240 px JPEGs in the same
 * `<CHAPTER_CODE>/pNNN.jpg` layout the other classes use, and merges the page
 * numbers into `chapter-pages-manifest.json`.
 *
 * Usage: node scripts/qa/publish-primary-textbook.mjs [--out <dir>]
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
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
const CACHE = join(ROOT, 'artifacts', 'qa', '2026-11-02', 'ncert-cache');

/**
 * Seeded chapter code -> the NCERT Marigold unit PDF that holds it.
 *
 * Class 1-4 English is seeded one chapter per Marigold unit, named after the unit's
 * poem, so the numbering lines up 1:1 (`ENG-1-3` -> `aemr103.pdf`).
 */
const CHAPTERS = [
  ['ENG-1-1', 'aemr101'], ['ENG-1-2', 'aemr102'], ['ENG-1-3', 'aemr103'],
  ['ENG-1-4', 'aemr104'], ['ENG-1-5', 'aemr105'],
  ['ENG-2-1', 'bemr101'], ['ENG-2-2', 'bemr102'], ['ENG-2-3', 'bemr103'],
  ['ENG-2-4', 'bemr104'], ['ENG-2-5', 'bemr105'],
  ['ENG-3-1', 'cesa101'], ['ENG-3-2', 'cesa102'], ['ENG-3-3', 'cesa103'],
  ['ENG-3-4', 'cesa104'], ['ENG-3-5', 'cesa105'],
  ['ENG-4-1', 'desa101'], ['ENG-4-2', 'desa102'], ['ENG-4-3', 'desa103'],
  ['ENG-4-4', 'desa104'], ['ENG-4-5', 'desa105'],
];

const WIDTH = 1240;
const QUALITY = 70;

mkdirSync(CACHE, { recursive: true });

async function download(file) {
  const target = join(CACHE, `${file}.pdf`);
  if (existsSync(target)) return target;
  const url = `https://ncert.nic.in/textbook/pdf/${file}.pdf`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(target));
  return target;
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
let totalPages = 0;

for (const [code, file] of CHAPTERS) {
  const dir = join(OUT, code);
  mkdirSync(dir, { recursive: true });
  const pdf = await download(file);
  const parser = new PDFParse({ data: new Uint8Array(readFileSync(pdf)), ...pdfjsAssetOptions() });
  try {
    const text = await parser.getText({ pageJoiner: '\n' });
    const count = (text.pages || []).length;
    const pages = [];
    const BATCH = 8;
    for (let start = 1; start <= count; start += BATCH) {
      const partial = [];
      for (let n = start; n < Math.min(start + BATCH, count + 1); n += 1) partial.push(n);
      const shots = await parser.getScreenshot({ partial, desiredWidth: WIDTH, imageBuffer: true, imageDataUrl: false });
      for (const shot of shots.pages) {
        const target = join(dir, `p${String(shot.pageNumber).padStart(3, '0')}.jpg`);
        await sharp(Buffer.from(shot.data)).jpeg({ quality: QUALITY, mozjpeg: true, progressive: true }).toFile(target);
        pages.push(shot.pageNumber);
      }
    }
    manifest[code] = pages.sort((a, b) => a - b);
    totalPages += pages.length;
    console.log(`${code} <- ${file}.pdf  ${pages.length} pages`);
  } finally {
    await parser.destroy?.();
  }
}

writeFileSync(MANIFEST, `${JSON.stringify(manifest)}\n`);
console.log(`\ndone: ${CHAPTERS.length} chapters, ${totalPages} pages, manifest now ${Object.keys(manifest).length} chapters`);
