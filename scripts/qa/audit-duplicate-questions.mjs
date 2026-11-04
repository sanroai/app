// Finds near-duplicate questions in the bank.
//
//   node scripts/qa/audit-duplicate-questions.mjs
//   node scripts/qa/audit-duplicate-questions.mjs --db sanro_test --threshold 0.8
//
// Why this matters: practice selection avoids a question the student answered
// correctly in the last three days *while an alternative exists*. Two questions
// that ask the same thing are not an alternative - they are the same evidence
// twice, which inflates mastery and makes a set feel padded. Authoring runs
// (especially the AI-assisted batches) are where they creep in.
//
// Two questions are a duplicate when, inside the same concept, their normalised
// text agrees closely (Jaccard over word tokens) AND they have the same answer.
// Same text with a *different* answer is reported separately: at a high score that
// is one question written twice (only the wording differs), and at a lower score
// it is usually two genuinely different questions that happen to share structure
// (different figures) - read the text before acting on it.
//
// This script only reports. The duplicates are left in the bank on purpose: most
// sit on concepts that carry exactly the three questions mastery needs, so
// removing one would leave that concept unable to produce enough evidence in a
// single session. What actually matters is that one *set* never contains both -
// `withoutRepeats` in `apps/api/src/learning/question-fingerprint.ts` does that.
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};

const db = arg('--db', 'sanro_dev');
const threshold = Number(arg('--threshold', '0.72'));

process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const STOP = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'of', 'in', 'on', 'to', 'for', 'and',
  'which', 'what', 'when', 'that', 'this', 'it', 'as', 'by', 'with', 'from', 'be',
]);

function normalise(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9.]+/g, ' ')
    .split(' ')
    .filter((w) => w && !STOP.has(w));
}

function jaccard(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  let shared = 0;
  for (const w of setA) if (setB.has(w)) shared += 1;
  const union = setA.size + setB.size - shared;
  return union === 0 ? 1 : shared / union;
}

const answerKey = (question) => String(question.answer ?? '').trim().toLowerCase();

const prisma = new PrismaClient();
try {
  const questions = await prisma.question.findMany({
    where: { status: 'APPROVED' },
    select: {
      id: true,
      text: true,
      answer: true,
      type: true,
      conceptId: true,
      chapterId: true,
      concept: { select: { name: true } },
      chapter: { select: { code: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const byConcept = new Map();
  for (const question of questions) {
    const key = question.conceptId ?? `chapter:${question.chapterId}`;
    if (!byConcept.has(key)) byConcept.set(key, []);
    byConcept.get(key).push(question);
  }

  const duplicates = [];
  const conflicts = [];

  for (const [, group] of byConcept) {
    const prepared = group.map((q) => ({ ...q, tokens: normalise(q.text), key: answerKey(q) }));
    for (let i = 0; i < prepared.length; i += 1) {
      for (let j = i + 1; j < prepared.length; j += 1) {
        const a = prepared[i];
        const b = prepared[j];
        const score = jaccard(a.tokens, b.tokens);
        if (score < threshold) continue;
        if (a.key !== b.key) conflicts.push({ a, b, score });
        else duplicates.push({ a, b, score });
      }
    }
  }

  const show = (row, withAnswers) =>
    `${row.a.chapter?.code ?? '?'} | ${row.a.concept?.name ?? '?'} | ${(row.score * 100).toFixed(0)}%\n` +
    `      keep: ${row.a.text.slice(0, 110)}\n` +
    `      dupe: ${row.b.text.slice(0, 110)}` +
    (withAnswers ? `\n      answers: ${String(row.a.answer).slice(0, 70)}  ||  ${String(row.b.answer).slice(0, 70)}` : '');

  console.log(`  database        : ${db}`);
  console.log(`  questions       : ${questions.length}`);
  console.log(`  concepts covered: ${byConcept.size}`);
  console.log(`  threshold       : ${threshold}`);
  console.log(`  duplicates      : ${duplicates.length}  (same answer - the set filter drops the second)`);
  console.log(`  answer differs  : ${conflicts.length}  (read them: rewording, or two different questions)`);

  const byChapter = new Map();
  for (const row of duplicates) {
    const code = row.a.chapter?.code ?? '?';
    byChapter.set(code, (byChapter.get(code) ?? 0) + 1);
  }
  for (const [code, count] of [...byChapter].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
    console.log(`    ${String(count).padStart(4)}  ${code}`);
  }

  for (const row of duplicates.slice(0, 25)) console.log(`  DUPE ${show(row)}`);
  for (const row of conflicts.slice(0, 15)) console.log(`  DIFF ${show(row, true)}`);
} finally {
  await prisma.$disconnect();
}
