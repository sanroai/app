// Imports the local question bank into another database, resolving chapter and
// concept by natural key. Idempotent: a question is skipped when the same text
// already exists in the same chapter.
//
// Everything is preloaded (chapters, concepts, existing texts) and the missing
// rows are written in batches, so this is a handful of round trips instead of
// two per question - the per-row version took ~5 s a question through a pooled
// Neon connection.
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const rows = JSON.parse(fs.readFileSync('../../artifacts/qa/2026-10-30/question-export.json', 'utf8'));
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

const started = Date.now();
const step = (label) => console.log(`[${((Date.now() - started) / 1000).toFixed(1)}s] ${label}`);

const admin = await prisma.user.findFirst({ where: { isSuperAdmin: true }, select: { id: true } });
if (!admin) {
  console.error('no super admin on the target database');
  process.exit(1);
}
step('connected');

const chapters = await prisma.chapter.findMany({
  select: { id: true, code: true, grade: true, subjectId: true, subject: { select: { boardId: true } } },
});
const chapterByCode = new Map(chapters.map((c) => [c.code, c]));
step(`chapters ${chapters.length}`);

const concepts = await prisma.concept.findMany({
  select: { id: true, name: true, topic: { select: { chapterId: true } } },
});
const conceptKey = new Map(concepts.map((c) => [`${c.topic.chapterId}::${c.name}`, c.id]));
step(`concepts ${concepts.length}`);

const existing = await prisma.question.findMany({ select: { chapterId: true, text: true } });
const existingKeys = new Set(existing.map((q) => `${q.chapterId}::${q.text}`));
step(`existing questions ${existing.length}`);

const pending = [];
for (const row of rows) {
  const chapter = chapterByCode.get(row.chapterCode);
  if (!chapter) continue;
  if (existingKeys.has(`${chapter.id}::${row.text}`)) continue;
  pending.push({ row, chapter });
}
step(`missing ${pending.length}`);
if (!pending.length) {
  console.log('nothing to do');
  await prisma.$disconnect();
  process.exit(0);
}

const CHUNK = 50;
let created = 0;
let options = 0;

for (let start = 0; start < pending.length; start += CHUNK) {
  const slice = pending.slice(start, start + CHUNK);

  const questionRows = slice.map(({ row, chapter }) => ({
    id: randomUUID(),
    boardId: chapter.subject.boardId,
    subjectId: chapter.subjectId,
    chapterId: chapter.id,
    conceptId: row.conceptName ? (conceptKey.get(`${chapter.id}::${row.conceptName}`) ?? null) : null,
    grade: chapter.grade,
    type: row.type,
    status: row.status,
    source: row.source,
    difficulty: row.difficulty,
    marks: row.marks ?? null,
    text: row.text,
    hint: row.hint ?? null,
    explanation: row.explanation ?? null,
    answer: row.answer,
    language: row.language,
    createdById: admin.id,
  }));

  await prisma.question.createMany({ data: questionRows });

  const optionRows = [];
  for (const [index, { row }] of slice.entries()) {
    for (const option of row.options ?? []) {
      optionRows.push({
        id: randomUUID(),
        questionId: questionRows[index].id,
        text: option.text,
        isCorrect: option.isCorrect,
        order: option.order,
      });
    }
  }
  if (optionRows.length) await prisma.questionOption.createMany({ data: optionRows });

  created += questionRows.length;
  options += optionRows.length;
  step(`progress ${Math.min(start + CHUNK, pending.length)}/${pending.length} created=${created} options=${options}`);
}

const total = await prisma.question.count();
step(`done: created=${created} options=${options} total=${total}`);
await prisma.$disconnect();
