// Does the seeded curriculum match the NCERT books chapter for chapter?
//
//   node scripts/qa/audit-book-alignment.mjs
//
// Every chapter of the extracted books (classes 5-10) must exist in the
// seed under the code that points at its PDF, with the book's own title.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { SUBJECTS } = require('../books/subjects.cjs');

const SEED = 'apps/api/prisma/seed.ts';

/** the code prefix -> the book's file prefix (the API uses the same mapping) */
const PREFIX = {
  5: { SCI: 'eeev1', MAT: 'eemm1', ENG: 'eesa1' },
  6: { SCI: 'fecu1', MAT: 'fegp1', ENG: 'fepr1' },
  7: { SCI: 'gecu1', MAT: 'gegp1', ENG: 'gepr1' },
  8: { SCI: 'hecu1', MAT: 'hegp1', ENG: 'hepr1' },
  9: { SCI: 'iesc1', MAT: 'iemh1', ENG: 'iebe1' },
  10: { SCI: 'jesc1', MAT: 'jemh1', ENG: 'jeff1' },
};
/** the file prefix of the second volume of a split book, per class */
const PART_PREFIX = {
  7: { MAT: 'gegp2' },
  8: { MAT: 'hegp2' },
};
/** the subject key of the seed for each book subject */
const SUBJECT_OF = { science: 'SCI', mathematics: 'MAT', english: 'ENG' };

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** the words that carry the meaning of a chapter title */
const STOP = new Set(['and', 'the', 'of', 'a', 'an', 'to', 'in', 'for', 'with', 'some']);
const words = (s) =>
  norm(s)
    .replace(/\((?:[^)]*)\)\s*$/, '') // a trailing qualifier: "(Unit 1)", "(with Answer Key)"
    .split(' ')
    .filter((w) => w.length >= 4 && !STOP.has(w));

/** true when the two titles point at the same chapter (only the wording differs) */
const sameChapter = (a, b) => {
  const wa = words(a);
  const wb = words(b);
  if (!wa.length || !wb.length) return wa.length === wb.length;
  return wa.some((w) => wb.includes(w));
};

const seed = fs.readFileSync(SEED, 'utf8');
const chapters = [...seed.matchAll(/name:\s*'((?:[^'\\]|\\.)*)',\s*\n\s*code:\s*'([A-Z]+-\d+(?:P\d)?-\d+)'/g)].map((m) => ({
  name: m[1].replace(/\\'/g, "'"),
  code: m[2],
}));

let checked = 0;
const missing = [];
const mismatched = [];
const wording = [];

for (const [subject, def] of Object.entries(SUBJECTS)) {
  const code3 = SUBJECT_OF[subject];
  if (!code3) continue;
  for (const cls of [5, 6, 7, 8, 9, 10]) {
    const list = def.chapters?.[cls];
    if (!list) continue;
    for (const [file, slug, title] of list) {
      // skip the front matter, the answers and the annexures
      if (/ps\.pdf$/.test(file) || /an\.pdf$/.test(file) || /a\d\.pdf$/.test(file)) continue;

      // the code that points at this PDF
      const match = /^(.*?)(\d{2})\.pdf$/.exec(file);
      if (!match) continue;
      const [, filePrefix, numberText] = match;
      const number = Number(numberText);
      const grade = String(cls);
      const part = PART_PREFIX[cls]?.[code3] === filePrefix ? 'P2' : '';
      const code = `${code3}-${grade}${part}-${number}`;

      const chapter = chapters.find((c) => c.code === code);
      checked += 1;
      if (!chapter) {
        missing.push(`${code}  ${title}  (${file})`);
        continue;
      }
      if (norm(chapter.name) === norm(title)) continue;
      if (sameChapter(chapter.name, title)) {
        wording.push(`${code}  seed: "${chapter.name}"  book: "${title}"`);
      } else {
        mismatched.push(`${code}  seed: "${chapter.name}"  book: "${title}"`);
      }
    }
  }
}

console.log(`  book chapters checked : ${checked}`);
console.log(`  missing from the seed  : ${missing.length}`);
for (const m of missing) console.log('    missing:', m);
console.log(`  wrong chapter          : ${mismatched.length}`);
for (const m of mismatched) console.log('    wrong:  ', m);
console.log(`  different wording      : ${wording.length}`);
for (const m of wording) console.log('    wording:', m);

if (missing.length || mismatched.length) process.exitCode = 1;
