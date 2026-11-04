// Writes the authoring input for the concepts that hold fewer than three
// *distinct* questions.
//
//   npx tsx scripts/qa/export-distinct-question-input.mts --out artifacts/qa/questions/distinct-a.json
//
// Mastery needs three pieces of evidence, and a set credits a concept once per
// question, so a concept whose three rows are really two questions can never leave
// INSUFFICIENT_EVIDENCE. The fix is one genuinely different question for that
// concept - this file carries what the author needs: the chapter, the concept, its
// existing questions (to avoid overlap) and the concept's micro-note (the idea it
// must test).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { questionFingerprint } from '../../apps/api/src/learning/question-fingerprint';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};

const db = arg('--db', 'sanro_dev');
const out = arg('--out');
if (!out) {
  console.error('  --out <file> is required');
  process.exit(1);
}
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const prisma = new PrismaClient();
try {
  const concepts = await prisma.concept.findMany({
    select: {
      name: true,
      topic: {
        select: {
          chapter: {
            select: { code: true, name: true, grade: true, subject: { select: { name: true, code: true } } },
          },
        },
      },
      questions: {
        where: { status: 'APPROVED' },
        select: { text: true, answer: true, type: true, options: { select: { text: true, isCorrect: true } } },
      },
      content: { where: { type: 'NOTES' }, select: { description: true }, take: 1 },
    },
    orderBy: [{ topic: { chapter: { code: 'asc' } } }, { name: 'asc' }],
  });

  const rows = [];
  for (const concept of concepts) {
    const distinct = new Set(concept.questions.map((q) => questionFingerprint(q.text)));
    if (distinct.size >= 3) continue;
    const chapter = concept.topic.chapter;
    rows.push({
      grade: chapter.grade,
      subject: chapter.subject.name,
      subjectCode: chapter.subject.code,
      chapterCode: chapter.code,
      chapter: chapter.name,
      concept: concept.name,
      distinctQuestions: distinct.size,
      existing: concept.questions.map((q) => ({
        text: q.text,
        answer: q.answer,
        type: q.type,
        options: q.options.map((o) => o.text),
      })),
      microNote: concept.content[0]?.description ?? null,
    });
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(rows, null, 2));
  console.log(`  wrote ${out}: ${rows.length} concept(s) need one more distinct question`);
} finally {
  await prisma.$disconnect();
}
