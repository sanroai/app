// Reports what a student would actually read after answering: how many
// questions carry an authored explanation, how many fall back to a sentence
// quoted from the lesson notes, and how many only get the answer restated.
//
//   npx tsx scripts/qa/audit-question-explanations.mts [db] [--chapter CODE] [--grade 10]
//
// The numbers are the authoring backlog. `answer` is the only bucket that does
// not teach, and it should trend to zero as explanations are written.
//
// It runs the real resolver (`apps/api/src/learning/question-feedback.ts`), so
// the audit can never disagree with what the API sends to the app.
import { createRequire } from 'node:module';
import { resolveQuestionFeedback } from '../../apps/api/src/learning/question-feedback.ts';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const argv = process.argv.slice(2);
const arg = (name: string, def?: string) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const positional = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--chapter' && argv[i - 1] !== '--grade');
const db = positional.find((a) => /^(sanro|postgres)[a-z0-9_]*$/i.test(a)) ?? 'sanro_dev';
const chapterCode = arg('--chapter');
const grade = arg('--grade');
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const prisma = new PrismaClient();

try {
  const chapterWhere = {
    ...(chapterCode ? { code: chapterCode } : {}),
    ...(grade ? { grade } : {}),
  };
  const chapterIds = chapterCode || grade
    ? (await prisma.chapter.findMany({ where: chapterWhere, select: { id: true } })).map((c) => c.id)
    : undefined;

  const questions = await prisma.question.findMany({
    where: chapterIds ? { chapterId: { in: chapterIds } } : {},
    select: {
      id: true,
      type: true,
      text: true,
      answer: true,
      explanation: true,
      conceptId: true,
      chapterId: true,
      grade: true,
    },
  });

  if (questions.length === 0) {
    console.log(`  no questions matched${chapterCode ? ` chapter ${chapterCode}` : grade ? ` class ${grade}` : ''}`);
    process.exit(1);
  }

  const conceptIds = [...new Set(questions.map((q) => q.conceptId).filter((id): id is string => Boolean(id)))];
  const usedChapterIds = [...new Set(questions.map((q) => q.chapterId))];

  const [concepts, chapters, notes] = await Promise.all([
    prisma.concept.findMany({ where: { id: { in: conceptIds } }, select: { id: true, name: true } }),
    prisma.chapter.findMany({ where: { id: { in: usedChapterIds } }, select: { id: true, name: true } }),
    prisma.contentItem.findMany({
      where: { chapterId: { in: usedChapterIds }, status: { in: ['APPROVED', 'PUBLISHED'] } },
      select: { chapterId: true, conceptId: true, type: true, description: true },
    }),
  ]);

  const conceptName = new Map(concepts.map((c) => [c.id, c.name]));
  const chapterName = new Map(chapters.map((c) => [c.id, c.name]));

  const notesByConcept = new Map<string, string[]>();
  const notesByChapter = new Map<string, string[]>();
  for (const note of notes) {
    if (note.type !== 'NOTES' || !note.description) continue;
    const byConcept = note.conceptId ? notesByConcept.get(note.conceptId) ?? [] : null;
    if (byConcept) {
      byConcept.push(note.description);
      notesByConcept.set(note.conceptId!, byConcept);
    }
    const list = notesByChapter.get(note.chapterId) ?? [];
    list.push(note.description);
    notesByChapter.set(note.chapterId, list);
  }

  const counts = { authored: 0, notes: 0, answer: 0 };
  const legacy: string[] = [];
  const answerOnly: Array<{ text: string; chapter: string }> = [];
  const byGrade = new Map<string, { total: number; authored: number; notes: number; answer: number }>();

  for (const q of questions) {
    const result = resolveQuestionFeedback(
      {
        id: q.id,
        type: q.type,
        text: q.text,
        answer: q.answer,
        explanation: q.explanation,
        conceptId: q.conceptId,
        chapterId: q.chapterId,
      },
      {
        conceptName: q.conceptId ? conceptName.get(q.conceptId) ?? null : null,
        chapterName: chapterName.get(q.chapterId) ?? null,
        notes: [
          ...(q.conceptId ? notesByConcept.get(q.conceptId) ?? [] : []),
          ...(notesByChapter.get(q.chapterId) ?? []),
        ],
      },
    );
    counts[result.source] += 1;
    if (q.explanation === 'Refer to the chapter notes for the detailed solution.') legacy.push(q.id);
    if (result.source === 'answer') {
      answerOnly.push({ text: q.text.slice(0, 80), chapter: chapterName.get(q.chapterId) ?? '?' });
    }
    const bucket = byGrade.get(q.grade) ?? { total: 0, authored: 0, notes: 0, answer: 0 };
    bucket.total += 1;
    bucket[result.source] += 1;
    byGrade.set(q.grade, bucket);
  }

  const pct = (n: number) => `${((n / questions.length) * 100).toFixed(1)}%`;
  console.log(`  database      : ${db}`);
  console.log(`  scope         : ${chapterCode ? `chapter ${chapterCode}` : grade ? `class ${grade}` : 'every class'}`);
  console.log(`  questions     : ${questions.length}`);
  console.log(`    authored    : ${counts.authored} (${pct(counts.authored)})  a written explanation`);
  console.log(`    notes       : ${counts.notes} (${pct(counts.notes)})  a sentence quoted from the lesson notes`);
  console.log(`    answer only : ${counts.answer} (${pct(counts.answer)})  restates the answer - authoring backlog`);
  console.log(`  legacy template still stored: ${legacy.length}`);

  console.log('  by class      :');
  for (const cls of [...byGrade.keys()].sort((a, b) => Number(a) - Number(b))) {
    const b = byGrade.get(cls)!;
    console.log(
      `    class ${cls.padStart(2)}: ${String(b.total).padStart(4)} questions - authored ${String(b.authored).padStart(3)}, notes ${String(b.notes).padStart(4)}, answer-only ${String(b.answer).padStart(3)}`,
    );
  }

  if (answerOnly.length) {
    console.log(`  answer-only questions (first 10):`);
    for (const q of answerOnly.slice(0, 10)) console.log(`    - ${q.chapter}: ${q.text}`);
  }

  // An explanation authored into the map survives only while its question text
  // is unchanged; a rename orphans it silently without this check.
  const seedText = require('node:fs').readFileSync('apps/api/src/content/question-explanations.ts', 'utf8');
  const mapStart = seedText.indexOf('export const QUESTION_EXPLANATIONS: Record<string, string> = {');
  if (mapStart >= 0) {
    const body = seedText.slice(mapStart, seedText.indexOf('\n};', mapStart));
    const keys = [...body.matchAll(/^ {2}'((?:[^'\\]|\\.)*)':/gm)].map((m) => m[1]);
    const texts = new Set(questions.map((q) => q.text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")));
    const orphans = keys.filter((k) => !texts.has(k));
    console.log(`  seed map keys : ${keys.length}${orphans.length ? `, ${orphans.length} orphaned` : ''}`);
    for (const orphan of orphans.slice(0, 5)) console.log(`    ORPHAN ${orphan.slice(0, 90)}`);
  }
} finally {
  await prisma.$disconnect();
}
