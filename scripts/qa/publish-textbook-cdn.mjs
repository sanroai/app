#!/usr/bin/env node
/**
 * Publishes the extracted NCERT textbook pages to the static CDN.
 *
 * The `books/` tree is git-ignored, so a deployed API has no files on disk and the
 * in-app textbook reader had nothing to show. This script renders the same pages
 * as compact JPEGs into a plain directory tree (`<CHAPTER_CODE>/pNNN.jpg`) that is
 * uploaded to Cloudflare Pages, and writes the manifest the API uses to answer
 * `/learning/chapters/:id/pages` without touching the disk.
 *
 * Usage: node scripts/qa/publish-textbook-cdn.mjs [--out <dir>] [--quality 70]
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');

const args = process.argv.slice(2);
const outArg = args.indexOf('--out');
const OUT = outArg >= 0 ? args[outArg + 1] : join(ROOT, 'artifacts', 'qa', '2026-11-02', 'textbook-cdn');
const qualityArg = args.indexOf('--quality');
const QUALITY = qualityArg >= 0 ? Number(args[qualityArg + 1]) : 70;

/** `books/cbse/class-<n>/<folder>` -> the subject code the chapter code uses. */
const FOLDER_SUBJECT = {
  'class-1': { english: 'ENG' },
  'class-2': { english: 'ENG' },
  'class-3': { world: 'SCI', math: 'MAT', english: 'ENG' },
  'class-4': { world: 'SCI', math: 'MAT', english: 'ENG' },
  'class-5': { world: 'SCI', math: 'MAT', english: 'ENG' },
  'class-6': { science: 'SCI', math: 'MAT', english: 'ENG' },
  'class-7': { science: 'SCI', 'math 1': 'MAT', 'math 2': 'MAT', english: 'ENG' },
  'class-8': { science: 'SCI', 'math part 1': 'MAT', 'math part 2': 'MAT', english: 'ENG' },
  'class-9': { science: 'SCI', math: 'MAT', english: 'ENG' },
  'class-10': { science: 'SCI', mathematics: 'MAT', english: 'ENG' },
};

/** The second volume of a split book needs the `Pn` namespace (`MAT-8P2-3`). */
const SECOND_VOLUME = new Set(['math 2', 'math part 2']);

const CHAPTER_FOLDER = /^(\d{1,2})-/;

function chapterCodeFor(classDir, folder, chapterNumber) {
  const subject = FOLDER_SUBJECT[classDir]?.[folder];
  if (!subject) return null;
  const grade = classDir.replace('class-', '');
  const volume = SECOND_VOLUME.has(folder) ? 'P2' : '';
  return `${subject}-${grade}${volume}-${chapterNumber}`;
}

async function mapLimit(items, limit, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const booksRoot = join(ROOT, 'books', 'cbse');
if (!existsSync(booksRoot)) {
  console.error(`No books tree at ${booksRoot}`);
  process.exit(1);
}

/** Every (code, page png) pair in the tree. */
const jobs = [];
for (const classDir of readdirSync(booksRoot, { withFileTypes: true })) {
  if (!classDir.isDirectory()) continue;
  const classPath = join(booksRoot, classDir.name);
  for (const subjectDir of readdirSync(classPath, { withFileTypes: true })) {
    if (!subjectDir.isDirectory()) continue;
    const chaptersDir = join(classPath, subjectDir.name, 'chapters');
    if (!existsSync(chaptersDir)) continue;
    for (const chapterDir of readdirSync(chaptersDir, { withFileTypes: true })) {
      if (!chapterDir.isDirectory()) continue;
      const match = CHAPTER_FOLDER.exec(chapterDir.name);
      if (!match) continue;
      const code = chapterCodeFor(classDir.name, subjectDir.name, Number(match[1]));
      if (!code) continue;
      const shots = join(chaptersDir, chapterDir.name, 'screenshots');
      if (!existsSync(shots)) continue;
      const pages = readdirSync(shots)
        .map((name) => {
          const m = /^p(\d+)\.png$/i.exec(name);
          return m ? { name, order: Number(m[1]) } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.order - b.order);
      for (const page of pages) jobs.push({ code, order: page.order, file: join(shots, page.name) });
    }
  }
}

console.log(`rendering ${jobs.length} pages at ${QUALITY}% into ${OUT}`);

const manifest = {};
let done = 0;
let bytes = 0;
const started = Date.now();

await mapLimit(jobs, 8, async (job) => {
  const dir = join(OUT, job.code);
  mkdirSync(dir, { recursive: true });
  const target = join(dir, `p${String(job.order).padStart(3, '0')}.jpg`);
  await sharp(job.file)
    .resize({ width: 1240, withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
    .toFile(target);
  bytes += statSync(target).size;
  (manifest[job.code] ??= []).push(job.order);
  done += 1;
  if (done % 400 === 0) {
    const secs = (Date.now() - started) / 1000;
    console.log(`  ${done}/${jobs.length}  ${(bytes / 1048576).toFixed(0)} MB  ${(done / secs).toFixed(1)}/s`);
  }
});

for (const code of Object.keys(manifest)) manifest[code].sort((a, b) => a - b);

writeFileSync(
  join(OUT, '_headers'),
  [
    '/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '  Access-Control-Allow-Origin: *',
    '  X-Content-Type-Options: nosniff',
    '',
  ].join('\n'),
);

const manifestPath = join(ROOT, 'apps', 'api', 'src', 'common', 'books', 'chapter-pages-manifest.json');
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 0)}\n`);

const secs = ((Date.now() - started) / 1000).toFixed(0);
console.log(
  `done: ${Object.keys(manifest).length} chapters, ${jobs.length} pages, ${(bytes / 1048576).toFixed(0)} MB, ${secs}s`,
);
console.log(`manifest -> ${manifestPath}`);
