// Rebuild question fragments from the database, in the format that
// merge-question-fragments.mjs consumes.
//
//   node scripts/qa/export-question-fragments.mjs [--grades 8,9,10] [--dir artifacts/qa/<date>]
//
// Useful when the authored fragments were lost but the seed/database still hold the
// questions: the exported file re-validates and re-merges idempotently (by text).
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
const db = arg('--db', 'sanro_dev');
const dir = arg('--dir', path.join('artifacts', 'qa', new Date().toISOString().slice(0, 10)));
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;
const grades = arg('--grades', '8,9,10').split(',').map((g) => g.trim()).filter(Boolean);

const prisma = new PrismaClient();
try {
  fs.mkdirSync(dir, { recursive: true });
  for (const grade of grades) {
    const questions = await prisma.question.findMany({
      where: { grade },
      orderBy: [{ chapterId: 'asc' }, { createdAt: 'asc' }],
      include: {
        options: { orderBy: { order: 'asc' } },
        concept: { select: { name: true } },
        chapter: { select: { name: true } },
        subject: { select: { name: true } },
      },
    });
    const out = {
      questions: questions.map((q) => ({
        grade: q.grade,
        subject: q.subject.name,
        chapter: q.chapter.name,
        concept: q.concept?.name ?? '',
        type: q.type === 'MCQ' ? 'MCQ' : q.type,
        text: q.text,
        answer: q.answer,
        marks: q.marks ?? 1,
        difficulty: q.difficulty,
        ...(q.type === 'MCQ'
          ? { options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) }
          : {}),
      })),
    };
    const name = path.join(dir, `questions-db-grade-${grade}.json`);
    fs.writeFileSync(name, JSON.stringify(out, null, 2), 'utf8');
    console.log(`  grade ${grade}: ${out.questions.length} question(s) -> ${name}`);
  }
} finally {
  await prisma.$disconnect();
}
