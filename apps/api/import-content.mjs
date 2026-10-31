// Imports the lesson content items from the local export into Neon, resolving
// chapter/subject/concept by their natural keys (ids differ between databases).
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

const rows = JSON.parse(fs.readFileSync('../../artifacts/qa/2026-10-30/content-export.json', 'utf8'));
const url = process.env.DATABASE_URL;
const prisma = new PrismaClient({ datasources: { db: { url } } });

const admin = await prisma.user.findFirst({ where: { isSuperAdmin: true }, select: { id: true } });
if (!admin) {
  console.error('no super admin on the target database');
  process.exit(1);
}

const chapters = await prisma.chapter.findMany({ select: { id: true, code: true, subjectId: true, subject: { select: { boardId: true } } } });
const chapterByCode = new Map(chapters.map((c) => [c.code, c]));

let created = 0;
let skipped = 0;
let failed = 0;

for (const [index, row] of rows.entries()) {
  if (!row.chapterCode) {
    skipped += 1;
    continue;
  }
  const chapter = chapterByCode.get(row.chapterCode);
  if (!chapter) {
    skipped += 1;
    continue;
  }
  try {
    const concept = row.conceptName
      ? await prisma.concept.findFirst({
          where: { name: row.conceptName, topic: { chapterId: chapter.id } },
          select: { id: true },
        })
      : null;
    const existing = await prisma.contentItem.findFirst({
      where: { title: row.title, chapterId: chapter.id },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }
    await prisma.contentItem.create({
      data: {
        type: row.type,
        status: row.status,
        visibility: row.visibility,
        ownerType: row.ownerType,
        title: row.title,
        durationSeconds: row.durationSeconds ?? 0,
        url: row.url,
        description: row.description,
        segments: row.segments ?? undefined,
        directSanroAvailable: true,
        boardId: chapter.subject.boardId,
        subjectId: chapter.subjectId,
        chapterId: chapter.id,
        conceptId: concept?.id ?? null,
        createdById: admin.id,
      },
    });
    created += 1;
  } catch (error) {
    failed += 1;
    if (failed <= 3) console.log('failed row', index, String(error).slice(0, 140));
  }
  if ((index + 1) % 50 === 0) console.log(`progress ${index + 1}/${rows.length} created=${created} skipped=${skipped}`);
}

console.log(`done: created=${created} skipped=${skipped} failed=${failed}`);
await prisma.$disconnect();
