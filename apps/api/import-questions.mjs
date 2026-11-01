// Imports the local question bank into another database, resolving chapter and
// concept by natural key. Idempotent: a question is skipped when the same text
// already exists in the same chapter.
//
// The whole target state is preloaded in two queries and only the missing rows
// are written, so this is ~N writes instead of 2N round trips.
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

const rows = JSON.parse(fs.readFileSync('../../artifacts/qa/2026-10-30/question-export.json', 'utf8'));
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

const started = Date.now();
const step = (label) => console.log(`[${((Date.now() - started) / 1000).toFixed(1)}s] ${label}`);

const admin = await prisma.user.findFirst({ where: { isSuperAdmin: true }, select: { id: true } });
step(`connected; super admin ${admin ? 'found' : 'MISSING'}`);
if (!admin) process.exit(1);

const chapters = await prisma.chapter.findMany({
  select: { id: true, code: true, grade: true, subjectId: true, subject: { select: { boardId: true } } },
});
const chapterByCode = new Map(chapters.map((c) => [c.code, c]));
step(`chapters ${chapters.length}`);

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

let created = 0;
let failed = 0;
for (const [index, { row, chapter }] of pending.entries()) {
  try {
    const concept = row.conceptName
      ? await prisma.concept.findFirst({
          where: { name: row.conceptName, topic: { chapterId: chapter.id } },
          select: { id: true },
        })
      : null;

    await prisma.question.create({
      data: {
        boardId: chapter.subject.boardId,
        subjectId: chapter.subjectId,
        chapterId: chapter.id,
        conceptId: concept?.id ?? null,
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
        options: {
          create: (row.options ?? []).map((o) => ({ text: o.text, isCorrect: o.isCorrect, order: o.order })),
        },
      },
    });
    created += 1;
  } catch (error) {
    failed += 1;
    console.log('failed:', String(error).slice(0, 200));
  }
  if ((index + 1) % 10 === 0) step(`progress ${index + 1}/${pending.length} created=${created} failed=${failed}`);
}

const total = await prisma.question.count();
step(`done: created=${created} failed=${failed} total=${total}`);
await prisma.$disconnect();
