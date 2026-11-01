// Imports every question from the local export into the target database,
// resolving chapter/concept by natural key. Idempotent: a question is skipped
// when the same text already exists in the same chapter.
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

const rows = JSON.parse(fs.readFileSync('../../artifacts/qa/2026-10-30/question-export.json', 'utf8'));
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });

const admin = await prisma.user.findFirst({ where: { isSuperAdmin: true }, select: { id: true } });
if (!admin) {
  console.error('no super admin on the target database');
  process.exit(1);
}

const chapters = await prisma.chapter.findMany({
  select: { id: true, code: true, grade: true, subjectId: true, subject: { select: { boardId: true } } },
});
const chapterByCode = new Map(chapters.map((c) => [c.code, c]));

let created = 0;
let skipped = 0;
let failed = 0;
let options = 0;

for (const [index, row] of rows.entries()) {
  const chapter = chapterByCode.get(row.chapterCode);
  if (!chapter) {
    skipped += 1;
    continue;
  }
  try {
    const existing = await prisma.question.findFirst({
      where: { text: row.text, chapterId: chapter.id },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

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
    options += row.options?.length ?? 0;
  } catch (error) {
    failed += 1;
    if (failed <= 3) console.log('failed row', index, String(error).slice(0, 160));
  }
  if ((index + 1) % 100 === 0) console.log(`progress ${index + 1}/${rows.length} created=${created} skipped=${skipped}`);
}

console.log(`done: created=${created} options=${options} skipped=${skipped} failed=${failed}`);
await prisma.$disconnect();
