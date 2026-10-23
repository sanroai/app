// Does every curriculum chapter code in the seed map to an NCERT PDF that is
// actually on disk? The chapter hub's "textbook PDF" button 404s when it does not.
//
//   node scripts/qa/audit-chapter-pdfs.mjs
import fs from 'node:fs';
import path from 'node:path';

const SEED = 'apps/api/prisma/seed.ts';

/** the same book prefixes the API uses (apps/api/src/common/books/chapter-pdf.ts) */
const BOOKS = {
  '5': { SCI: ['eeev1', 'world'], MAT: ['eemm1', 'math'], ENG: ['eesa1', 'english'] },
  '6': { SCI: ['fecu1', 'science'], MAT: ['fegp1', 'math'], ENG: ['fepr1', 'english'] },
  '7': { SCI: ['gecu1', 'science'], MAT: ['gegp1', 'math 1'], ENG: ['gepr1', 'english'] },
  '8': { SCI: ['hecu1', 'science'], MAT: ['hegp1', 'math part 1'], ENG: ['hepr1', 'english'] },
  '9': { SCI: ['iesc1', 'science'], MAT: ['iemh1', 'math'], ENG: ['iebe1', 'english'] },
  '10': { SCI: ['jesc1', 'science'], MAT: ['jemh1', 'mathematics'], ENG: ['jeff1', 'english'] },
};
/** the second volume of a split book, per class */
const PART_BOOKS = {
  '7': { MAT: ['gegp2', 'math 2'] },
  '8': { MAT: ['hegp2', 'math part 2'] },
};

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
const beyond = [];
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
    book = PART_BOOKS[grade]?.[subject];
  } else if (plain) {
    [, subject, grade, number] = plain;
    book = BOOKS[grade]?.[subject];
  }
  if (!book) {
    // a chapter of a class with no extracted book - not a failure
    noBook += 1;
    continue;
  }
  const [prefix, folder] = book;
  const file = `${prefix}${String(Number(number)).padStart(2, '0')}.pdf`;
  const classDir = path.join(root, `class-${grade}`, folder);
  const candidates = [path.join(classDir, 'source', file), path.join(classDir, file)];
  if (candidates.some((c) => fs.existsSync(c))) {
    ok += 1;
    continue;
  }
  // a number past the book's last chapter is a platform-only chapter (the book
  // dropped it) - the PDF route answers 404 and the UI hides the button
  const prefixPattern = new RegExp(`^${prefix}(\\d{2})\\.pdf$`);
  const numbers = fs
    .readdirSync(fs.existsSync(path.join(classDir, 'source')) ? path.join(classDir, 'source') : classDir)
    .map((n) => prefixPattern.exec(n)?.[1])
    .filter(Boolean)
    .map(Number);
  if (numbers.length && Number(number) > Math.max(...numbers)) beyond.push(`${code} ${file}`);
  else missing.push(`${code} -> ${file} (not in books/cbse/class-${grade}/${folder})`);
}

console.log(`  chapter codes in the seed : ${codes.length}`);
console.log(`  with a PDF on disk         : ${ok}`);
console.log(`  without a book (classes 1-4): ${noBook}`);
console.log(`  past the book's last chapter: ${beyond.length}`);
for (const b of beyond) console.log('    beyond:', b);
console.log(`  without a PDF              : ${missing.length}`);
for (const m of missing) console.log('    missing:', m);
if (missing.length) process.exitCode = 1;
