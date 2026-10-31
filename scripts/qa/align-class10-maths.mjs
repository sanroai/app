// Realigns the class-10 mathematics chapters with the 2026 NCERT book.
//
// The book has 14 chapters (Constructions was dropped when the contents were
// rationalised), so the seed's codes pointed at the wrong PDFs: MAT-10-12
// "Areas Related to Circles" opened the PDF of Surface Areas and Volumes.
//
// The codes become the book's chapter numbers; Constructions keeps its content
// but moves to the end and has no textbook PDF any more (the route 404s).
//
//   node scripts/qa/align-class10-maths.mjs
import fs from 'node:fs';

const SEED = 'apps/api/prisma/seed.ts';
let seed = fs.readFileSync(SEED, 'utf8');

// the book's chapter order: the name decides, the code follows the book
const BOOK_ORDER = [
  'Real Numbers',
  'Polynomials',
  'Pair of Linear Equations in Two Variables',
  'Quadratic Equations',
  'Arithmetic Progressions',
  'Triangles',
  'Coordinate Geometry',
  'Introduction to Trigonometry',
  'Applications of Trigonometry',
  'Circles',
  'Areas Related to Circles',
  'Surface Areas and Volumes',
  'Statistics',
  'Probability',
  'Constructions',
];

let changed = 0;
BOOK_ORDER.forEach((name, index) => {
  const target = `MAT-10-${index + 1}`;
  // the code group is replaced as a whole, so a broken value cannot survive
  const re = new RegExp(`(name: '${name.replace(/'/g, "\\'")}',\\s*\\n\\s*code: ')[^']*(')`);
  const hit = seed.match(re);
  if (!hit) {
    console.log(`  ${name}: not found - skipped`);
    return;
  }
  const current = hit[1].concat(hit[2]).match(/code: '([^']*)'/)?.[1];
  if (current === target) return;
  seed = seed.replace(re, `$1${target}$2`);
  changed += 1;
  console.log(`  ${current} -> ${target}  ${name}`);
});

fs.writeFileSync(SEED, seed);
console.log(`  class-10 maths: ${changed} chapter code(s) realigned with the book`);
