// Validates authored question fragments against the live curriculum before they
// are merged into the seed.
//
//   node scripts/qa/validate-question-fragments.mjs [--dir artifacts/qa/<date>] [db]
//
// Checks, per question: the chapter exists at that grade, the concept belongs to
// that chapter, an MCQ has exactly four options with exactly one correct one and
// an `answer` equal to that option's text, a SHORT_ANSWER has no options, and no
// text is duplicated inside the fragments or against the questions already in
// the database. Exit code 1 when anything fails, so it can gate a merge.
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
const dir = arg('--dir', path.join('artifacts', 'qa', new Date().toISOString().slice(0, 10)));
const positional = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--dir');
const db = positional.find((a) => /^(sanro|postgres)[a-z0-9_]*$/i.test(a)) ?? 'sanro_dev';
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^questions-.*\.json$/.test(f)) : [];
if (!files.length) {
  console.log(`  no question fragments in ${dir}`);
  process.exit(0);
}

const prisma = new PrismaClient();
const problems = [];
const alreadySeeded = [];
const seen = new Map();
let total = 0;

try {
  const chapters = await prisma.chapter.findMany({
    include: {
      subject: { select: { name: true } },
      topics: { include: { concepts: { select: { name: true } } } },
    },
  });
  const index = new Map();
  for (const ch of chapters) {
    const key = `${ch.grade}|${ch.subject.name.toLowerCase()}|${ch.name}`;
    index.set(key, new Set(ch.topics.flatMap((t) => t.concepts.map((c) => c.name))));
  }

  const existingTexts = new Set((await prisma.question.findMany({ select: { text: true } })).map((q) => q.text));

  for (const file of files) {
    const frag = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8').replace(/^\uFEFF/, ''));
    const questions = frag.questions ?? [];
    console.log(`  ${file}: ${questions.length} question(s)`);
    for (const [i, q] of questions.entries()) {
      total += 1;
      const where = `${file}[${i}] ${q.chapter ?? '?'} / ${q.concept ?? '?'}`;
      if (!q.text || !q.text.trim()) problems.push(`${where}: empty question text`);
      if (!q.answer || !q.answer.trim()) problems.push(`${where}: empty answer`);
      if (!['MCQ', 'SHORT_ANSWER'].includes(q.type)) problems.push(`${where}: type "${q.type}" is not MCQ|SHORT_ANSWER`);

      const key = `${q.grade}|${String(q.subject ?? '').toLowerCase()}|${q.chapter}`;
      const concepts = index.get(key);
      if (!concepts) problems.push(`${where}: no class-${q.grade} ${q.subject} chapter named "${q.chapter}"`);
      else if (!concepts.has(q.concept)) problems.push(`${where}: concept "${q.concept}" is not in that chapter`);

      if (q.type === 'MCQ') {
        const options = Array.isArray(q.options) ? q.options : [];
        if (options.length !== 4) problems.push(`${where}: ${options.length} options (expected 4)`);
        const correct = options.filter((o) => o.isCorrect);
        if (correct.length !== 1) problems.push(`${where}: ${correct.length} correct options (expected 1)`);
        else if (correct[0].text !== q.answer) problems.push(`${where}: answer "${q.answer}" is not the correct option "${correct[0].text}"`);
        if (new Set(options.map((o) => o.text)).size !== options.length) problems.push(`${where}: duplicate option texts`);
      } else {
        if (Array.isArray(q.options) && q.options.length) problems.push(`${where}: a written question must not carry options`);
        if (Number(q.marks) < 2) problems.push(`${where}: a written question should be worth 2 marks`);
      }

      if (q.text) {
        if (seen.has(q.text)) problems.push(`${where}: duplicate of ${seen.get(q.text)}`);
        else if (existingTexts.has(q.text)) alreadySeeded.push(where);
        else seen.set(q.text, where);
      }
    }
  }

  console.log(`  database        : ${db}`);
  console.log(`  fragments       : ${files.length}`);
  console.log(`  questions       : ${total}`);
  console.log(`  already seeded  : ${alreadySeeded.length} (the merge skips these - not a failure)`);
  console.log(`  problems        : ${problems.length}`);
  for (const p of problems.slice(0, 40)) console.log(`    FAIL ${p}`);
  if (problems.length > 40) console.log(`    ... ${problems.length - 40} more`);
} finally {
  await prisma.$disconnect();
}

process.exit(problems.length ? 1 : 0);
