// Writes the authoring input for concept micro-notes.
//
//   node scripts/qa/export-concept-notes-input.mjs --list
//   node scripts/qa/export-concept-notes-input.mjs --grade 10 --out artifacts/qa/concept-notes/input-a.json
//   node scripts/qa/export-concept-notes-input.mjs --codes SCI-10-1,SCI-10-2 --out file.json
//
// 847 of the 1,089 concepts have no content of their own, so their page shows the
// *chapter's* notes - which are written for the chapter as a whole and often do
// not answer "what is this concept?". A micro-note is three short blocks for that
// one concept: what it is, the idea that makes it work, and the mistake students
// actually make.
//
// The output carries everything needed to write them: the concept name, its
// chapter, and its questions (which show what the syllabus expects the student to
// be able to do).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const flag = (name) => argv.includes(name);

const db = arg('--db', 'sanro_dev');
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const grade = arg('--grade');
const codes = arg('--codes');
const out = arg('--out');

const prisma = new PrismaClient();
try {
  const concepts = await prisma.concept.findMany({
    where: {
      ...(codes ? { topic: { chapter: { code: { in: codes.split(',').map((c) => c.trim()) } } } } : {}),
      ...(grade ? { topic: { chapter: { grade } } } : {}),
    },
    select: {
      id: true,
      name: true,
      topic: { select: { chapter: { select: { code: true, name: true, grade: true, subject: { select: { code: true } } } } } },
      content: { select: { id: true } },
      questions: { select: { text: true, answer: true }, take: 3 },
    },
    orderBy: [{ topic: { chapter: { code: 'asc' } } }, { name: 'asc' }],
  });

  const rows = concepts.map((concept) => ({
    code: concept.topic.chapter.code,
    chapter: concept.topic.chapter.name,
    grade: concept.topic.chapter.grade,
    subject: concept.topic.chapter.subject.code,
    concept: concept.name,
    hasOwnContent: concept.content.length > 0,
    questions: concept.questions.map((q) => ({ text: q.text, answer: q.answer })),
  }));

  if (flag('--list')) {
    const byGrade = new Map();
    for (const row of rows) {
      const bucket = byGrade.get(row.grade) ?? { total: 0, missing: 0 };
      bucket.total += 1;
      if (!row.hasOwnContent) bucket.missing += 1;
      byGrade.set(row.grade, bucket);
    }
    for (const cls of [...byGrade.keys()].sort((a, b) => Number(a) - Number(b))) {
      const bucket = byGrade.get(cls);
      console.log(`  class ${cls.padStart(2)}: ${String(bucket.missing).padStart(4)}/${String(bucket.total).padStart(4)} concepts without their own content`);
    }
    console.log(`\n  ${rows.filter((r) => !r.hasOwnContent).length} concepts need a micro-note`);
    process.exit(0);
  }

  if (!out) {
    console.error('  --out <file> is required (or use --list)');
    process.exit(1);
  }

  const payload = rows.filter((row) => !row.hasOwnContent);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(payload, null, 2));
  console.log(`  wrote ${out}: ${payload.length} concept(s)`);
} finally {
  await prisma.$disconnect();
}
