// Does every curriculum chapter code in the seed map to an NCERT PDF that is
// actually on disk? The chapter hub's "textbook PDF" button 404s when it does not.
//
//   node scripts/qa/audit-chapter-pdfs.mjs
import fs from 'node:fs';
import path from 'node:path';

const SEED = 'apps/api/prisma/seed.ts';

/** the same book prefixes the API uses (apps/api/src/common/books/chapter-pdf.ts) */
const BOOKS = {
  '8': { SCI: ['hecu1', 'science'], MAT: ['hegp1', 'math part 1'], ENG: ['hepr1', 'english'] },
  '9': { SCI: ['iesc1', 'science'], MAT: ['iemh1', 'math'], ENG: ['iebe1', 'english'] },
  '10': { SCI: ['jesc1', 'science'], MAT: ['jemh1', 'mathematics'], ENG: ['jeff1', 'english'] },
};
const PART_BOOKS = { MAT: ['hegp2', 'math part 2'] };

function findBooksRoot() {
  let dir = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\//, '')), '../..');
  for (let i = 0; i < 8; i += 1) {
    const candidate = path.join(dir, 'books', 'cbse');
    if (fs.existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  const cwd = path.join(process.cwd(), 'books', 'cbse');
  return fs.existsSync(cwd) ? cwd : null;
}

const seed = fs.readFileSync(SEED, 'utf8');
const codes = [...new Set([...seed.matchAll(/code:\s*'([A-Z]+-\d+(?:P\d)?-\d+)'/g)].map((m) => m[1]))];
const root = findBooksRoot();

if (!root) {
  console.log('  books/cbse is not on disk - the PDFs are local-only, skipping');
  process.exit(0);
}

let ok = 0;
let noBook = 0;
const missing = [];
for (const code of codes) {
  const part = /^([A-Z]+)-(\d{1,2})P(\d)-(\d+)$/.exec(code);
  const plain = /^([A-Z]+)-(\d{1,2})-(\d+)$/.exec(code);
  let grade;
  let subject;
  let number;
  let book;
  if (part) {
    [, subject, grade, , number] = part;
    book = PART_BOOKS[subject];
  } else if (plain) {
    [, subject, grade, number] = plain;
    book = BOOKS[grade]?.[subject];
  }
  if (!book) {
    // classes 1-7 have no extracted book yet - not a failure
    noBook += 1;
    continue;
  }
  const [prefix, folder] = book;
  const file = `${prefix}${String(Number(number)).padStart(2, '0')}.pdf`;
  const classDir = path.join(root, `class-${grade}`, folder);
  const candidates = [path.join(classDir, 'source', file), path.join(classDir, file)];
  if (candidates.some((c) => fs.existsSync(c))) ok += 1;
  else missing.push(`${code} -> ${file} (not in books/cbse/class-${grade}/${folder})`);
}

console.log(`  chapter codes in the seed : ${codes.length}`);
console.log(`  with a PDF on disk         : ${ok}`);
console.log(`  without a book (classes 1-7): ${noBook}`);
console.log(`  without a PDF              : ${missing.length}`);
for (const m of missing) console.log('    missing:', m);
if (missing.length) process.exitCode = 1;
