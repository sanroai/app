// Writes the authoring input for a batch of chapters.
//
//   node scripts/qa/export-explanations-input.mjs --list
//   node scripts/qa/export-explanations-input.mjs --codes SCI-8-1,SCI-8-2 --out artifacts/qa/explanations/input-a.json
//   node scripts/qa/export-explanations-input.mjs --grade 8 --subject SCI --out artifacts/qa/explanations/input-b.json
//
// `--list` prints, per chapter, how many questions still have no authored
// explanation, so a batch can be chosen by size.
//
// The output is exactly what an author (or an agent) needs and nothing else:
// the question text, its type, the correct answer and the distractors. Writing
// the explanation should not require reading the database.
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
const subject = arg('--subject');
const codes = arg('--codes');
const out = arg('--out');

const prisma = new PrismaClient();
try {
  const chapters = await prisma.chapter.findMany({
    where: {
      ...(grade ? { grade } : {}),
      ...(subject ? { subject: { code: subject } } : {}),
      ...(codes ? { code: { in: codes.split(',').map((c) => c.trim()).filter(Boolean) } } : {}),
    },
    select: { id: true, code: true, name: true, grade: true, subject: { select: { code: true } } },
  });

  const rows = [];
  for (const chapter of chapters) {
    const questions = await prisma.question.findMany({
      where: { chapterId: chapter.id },
      orderBy: { createdAt: 'asc' },
      select: {
        text: true,
        answer: true,
        type: true,
        explanation: true,
        options: { select: { text: true, isCorrect: true } },
      },
    });
    const missing = questions.filter(
      (q) => !q.explanation || q.explanation.startsWith('Refer to the chapter notes'),
    );
    rows.push({ chapter, total: questions.length, missing });
  }

  rows.sort((a, b) => a.chapter.code.localeCompare(b.chapter.code, undefined, { numeric: true }));

  if (flag('--list')) {
    console.log('  code        questions  no-authored  chapter');
    let totalMissing = 0;
    for (const row of rows) {
      totalMissing += row.missing.length;
      if (row.missing.length === 0) continue;
      console.log(
        `  ${row.chapter.code.padEnd(11)} ${String(row.total).padStart(9)} ${String(row.missing.length).padStart(12)}  ${row.chapter.name}`,
      );
    }
    console.log(`\n  ${rows.length} chapters, ${totalMissing} questions still to author`);
    process.exit(0);
  }

  if (!out) {
    console.error('  --out <file> is required (or use --list)');
    process.exit(1);
  }

  const payload = rows
    .filter((row) => row.missing.length > 0)
    .map((row) => ({
      code: row.chapter.code,
      chapter: row.chapter.name,
      grade: row.chapter.grade,
      subject: row.chapter.subject.code,
      questions: row.missing.map((q) => ({
        text: q.text,
        type: q.type,
        answer: q.answer,
        wrong: q.options.filter((o) => !o.isCorrect).map((o) => o.text),
      })),
    }));

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(payload, null, 2));
  const count = payload.reduce((sum, chapter) => sum + chapter.questions.length, 0);
  console.log(`  wrote ${out}: ${payload.length} chapter(s), ${count} question(s)`);
} finally {
  await prisma.$disconnect();
}
