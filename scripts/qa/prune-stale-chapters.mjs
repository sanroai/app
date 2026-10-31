// Delete chapters that exist in the database but are no longer in the seed.
//
//   node scripts/qa/prune-stale-chapters.mjs [--grades 5,6,7] [--db sanro_dev] [--all] [--apply]
//
// Needed after a curriculum realignment: the seed upserts chapters by code, so a
// chapter that was replaced ("Forces and Energy" -> the real class-5 book chapters)
// stays behind in the database with its topics, concepts and lessons. `--all` deletes
// every chapter in scope (used when a grade is rebuilt from scratch, because a reused
// code would otherwise keep the old chapter's topics alongside the new ones).
//
// Order matters because `Question.chapterId` is a required relation without a cascade:
// questions first, then content items, then the chapter (topics and concepts cascade).
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const APPLY = argv.includes('--apply');
const ALL = argv.includes('--all');
const db = arg('--db', 'sanro_dev');
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const seed = fs.readFileSync('apps/api/prisma/seed.ts', 'utf8');
const seedCodes = new Set(Array.from(seed.matchAll(/\bcode: '([A-Z]{2,3}-\d+(?:P\d)?-\d+)'/g), (m) => m[1]));

const grades = arg('--grades', '')
  .split(',')
  .map((g) => g.trim())
  .filter(Boolean);

const prisma = new PrismaClient();
try {
  const chapters = await prisma.chapter.findMany({
    where: grades.length ? { grade: { in: grades } } : {},
    select: { id: true, code: true, name: true, grade: true, _count: { select: { topics: true, questions: true } } },
    orderBy: { code: 'asc' },
  });
  const stale = ALL ? chapters : chapters.filter((c) => !seedCodes.has(c.code));
  console.log(`  database : ${db}`);
  console.log(`  chapters : ${chapters.length} in scope, ${stale.length} to delete${ALL ? ' (--all)' : ' (not in the seed)'}`);
  for (const c of stale) {
    console.log(`  - ${c.code.padEnd(12)} grade ${c.grade}  ${c.name}  (topics ${c._count.topics}, questions ${c._count.questions})`);
  }
  if (stale.length === 0) {
    console.log('  nothing to prune');
    process.exit(0);
  }
  if (!APPLY) {
    console.log('  dry run - pass --apply to delete these chapters');
    process.exit(0);
  }
  let questions = 0;
  let items = 0;
  for (const c of stale) {
    const q = await prisma.question.deleteMany({ where: { chapterId: c.id } });
    const i = await prisma.contentItem.deleteMany({ where: { chapterId: c.id } });
    questions += q.count;
    items += i.count;
    await prisma.chapter.delete({ where: { id: c.id } });
  }
  console.log(`  deleted ${stale.length} chapter(s), ${questions} question(s), ${items} content item(s)`);
} finally {
  await prisma.$disconnect();
}
