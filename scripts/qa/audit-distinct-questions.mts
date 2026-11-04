// Counts the concepts that do not hold three *distinct* questions.
//
//   npx tsx scripts/qa/audit-distinct-questions.mts
//
// Mastery needs three pieces of evidence before it will report a level
// (`MASTERY_EVIDENCE_MIN_QUESTIONS = 3`), and a practice set credits the concept
// once per question. So a concept whose three rows contain two rewrites of the
// same question can never leave INSUFFICIENT_EVIDENCE, no matter how well the
// student does - the bank has to gain a genuinely different question there, not
// just a third row.
//
// The same fingerprint the practice selector uses decides what counts as distinct.
import { createRequire } from 'node:module';
import { questionFingerprint } from '../../apps/api/src/learning/question-fingerprint';

const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const db = process.argv.includes('--db') ? process.argv[process.argv.indexOf('--db') + 1] : 'sanro_dev';
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const MIN = 3;
const prisma = new PrismaClient();
try {
  const concepts = await prisma.concept.findMany({
    select: {
      name: true,
      topic: { select: { chapter: { select: { code: true, grade: true } } } },
      questions: { where: { status: 'APPROVED' }, select: { text: true } },
    },
    orderBy: [{ topic: { chapter: { code: 'asc' } } }, { name: 'asc' }],
  });

  const short = [];
  let totalQuestions = 0;
  for (const concept of concepts) {
    totalQuestions += concept.questions.length;
    const distinct = new Set(concept.questions.map((q) => questionFingerprint(q.text)));
    if (distinct.size < MIN) {
      short.push({
        code: concept.topic.chapter.code,
        grade: concept.topic.chapter.grade,
        concept: concept.name,
        rows: concept.questions.length,
        distinct: distinct.size,
      });
    }
  }

  const byGrade = new Map();
  for (const row of short) byGrade.set(row.grade, (byGrade.get(row.grade) ?? 0) + 1);

  console.log(`  database           : ${db}`);
  console.log(`  concepts           : ${concepts.length}`);
  console.log(`  approved questions : ${totalQuestions}`);
  console.log(`  below ${MIN} distinct  : ${short.length}`);
  for (const grade of [...byGrade.keys()].sort((a, b) => Number(a) - Number(b))) {
    console.log(`    class ${grade.padStart(2)}: ${byGrade.get(grade)}`);
  }
  for (const row of short) {
    console.log(`    ${row.code} | ${row.concept} | rows=${row.rows} distinct=${row.distinct}`);
  }
} finally {
  await prisma.$disconnect();
}
