// Exports the chapters that have no practice questions, with the exact concept names an
// authored question must be mapped to.
//
//   node scripts/qa/export-question-outline.mjs [--all] [--grades 8,9] [--dir artifacts/qa/<date>] [db]
//
// Writes artifacts/qa/<date>/question-outline-<grades>.json plus one markdown brief per
// subject that the authoring agents read. Without --all only chapters with zero seeded
// questions are listed.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const argv = process.argv.slice(2);
const all = argv.includes('--all');
const gradeArg = (() => {
  const i = argv.indexOf('--grades');
  return i >= 0 && argv[i + 1] ? argv[i + 1] : '8,9';
})();
const grades = gradeArg.split(',').map((g) => g.trim()).filter(Boolean);
const dirArg = (() => {
  const i = argv.indexOf('--dir');
  return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
})();
const db = argv.filter((a) => !a.startsWith('--') && a !== gradeArg && a !== dirArg).at(-1) ?? 'sanro_dev';
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const date = new Date().toISOString().slice(0, 10);
const outDir = dirArg ?? path.join('artifacts', 'qa', date);
fs.mkdirSync(outDir, { recursive: true });

const BOOKS = {
  SCIENCE: {
    5: 'class-5/world',
    6: 'class-6/science',
    7: 'class-7/science',
    8: 'class-8/science',
    9: 'class-9/science',
    10: 'class-10/science',
  },
  MATHEMATICS: {
    5: 'class-5/math',
    6: 'class-6/math',
    7: 'class-7/math 1',
    8: 'class-8',
    9: 'class-9/math',
    10: 'class-10/mathematics',
  },
  ENGLISH: {
    5: 'class-5/english',
    6: 'class-6/english',
    7: 'class-7/english',
    8: 'class-8/english',
    9: 'class-9/english',
    10: 'class-10/english',
  },
};

/** the book folder for a chapter, honouring the volume code (MAT-7P2-3 -> math 2) */
function bookPath(subject, grade, code) {
  const key = String(subject ?? '').toUpperCase();
  const part = /P(\d)-/.exec(code ?? '');
  if (key === 'MATHEMATICS' && part) return `class-${grade}/math ${part[1]}`;
  return BOOKS[key]?.[grade] ?? null;
}

/** the exact chapter folder of the extracted book (text.txt lives there) */
function chapterDir(subject, grade, code) {
  const folder = bookPath(subject, grade, code);
  const n = Number(/(\d+)$/.exec(code ?? '')?.[1]);
  if (!folder || !n) return null;
  const dir = path.join('books', 'cbse', folder, 'chapters');
  if (!fs.existsSync(dir)) return null;
  const dirs = fs
    .readdirSync(dir)
    .filter((d) => /^\d\d-/.test(d) && !d.startsWith('00-'))
    .sort();
  const hit = dirs[n - 1];
  return hit ? path.join(dir, hit).replace(/\\/g, '/') : null;
}

const prisma = new PrismaClient();
try {
  const chapters = await prisma.chapter.findMany({
    where: { grade: { in: grades } },
    orderBy: [{ grade: 'asc' }],
    include: {
      subject: { select: { name: true } },
      topics: { orderBy: { order: 'asc' }, include: { concepts: { orderBy: { order: 'asc' }, select: { name: true, id: true } } } },
    },
  });

  const withCounts = [];
  for (const ch of chapters) {
    const questions = await prisma.question.count({ where: { concept: { topic: { chapterId: ch.id } } } });
    const concepts = ch.topics.flatMap((t) => t.concepts.map((c) => ({ concept: c.name, topic: t.name })));
    withCounts.push({
      code: ch.code,
      grade: ch.grade,
      subject: ch.subject.name,
      chapter: ch.name,
      questions,
      concepts,
    });
  }

  const selected = (all ? withCounts : withCounts.filter((c) => c.questions === 0)).sort(
    (a, b) => a.subject.localeCompare(b.subject) || a.grade.localeCompare(b.grade) || a.code.localeCompare(b.code),
  );

  const suffix = grades.join('');
  fs.writeFileSync(path.join(outDir, `question-outline-${suffix}.json`), JSON.stringify(selected, null, 2));

  const bySubject = new Map();
  for (const c of selected) {
    if (!bySubject.has(c.subject)) bySubject.set(c.subject, []);
    bySubject.get(c.subject).push(c);
  }

  for (const [subject, list] of bySubject) {
    const withBook = list.some((c) => bookPath(c.subject, c.grade, c.code));
    const lines = [
      `# Question authoring brief - ${subject}`,
      '',
      `${list.length} chapter(s) with no practice questions.`,
      '',
      ...(withBook
        ? [
            'Source every question from the chapter text of the textbook (read',
            'chapters/NN-slug/text.merged.txt) and write one JSON fragment per subject:',
          ]
        : [
            'These grades have **no textbook on disk** (books/ covers classes 5-10 only), so',
            'author from the CBSE curriculum for that class: keep every question answerable',
            'from the chapter title and the concepts listed below, prefer universally true',
            'facts (counting, place value, plant and animal parts, water, air, food) and avoid',
            'textbook-specific stories, page references or local trivia. Write one JSON',
            'fragment per subject:',
          ]),
      '',
      '```json',
      '{ "questions": [ {',
      '  "grade": "8", "subject": "Science", "chapter": "<exact chapter name below>",',
      '  "concept": "<exact concept name below>", "type": "MCQ",',
      '  "text": "question text", "answer": "exact option text of the correct answer",',
      '  "marks": 1, "difficulty": "EASY|MEDIUM|HARD",',
      '  "options": [ { "text": "...", "isCorrect": true }, { "text": "...", "isCorrect": false },',
      '               { "text": "...", "isCorrect": false }, { "text": "...", "isCorrect": false } ]',
      '} ] }',
      '```',
      '',
      '- `type` is `MCQ` or `SHORT_ANSWER` (SHORT_ANSWER questions have no `options` and are not auto-graded).',
      '- For MCQ the `answer` MUST be one of the option texts, verbatim.',
      '- 4 questions per chapter: 2 MCQ, 1 SHORT_ANSWER, 1 application/HOTS MCQ.',
      '- The concept name must match the list below exactly (copy/paste, including quotes).',
      '',
    ];
    for (const c of list) {
      lines.push(`## ${c.code} - ${c.chapter} (class ${c.grade})`);
      lines.push('');
      if (chapterDir(c.subject, c.grade, c.code)) lines.push(`Book text: \`${chapterDir(c.subject, c.grade, c.code)}/text.txt\``);
      else if (bookPath(c.subject, c.grade, c.code)) lines.push(`Book: \`books/cbse/${bookPath(c.subject, c.grade, c.code)}\``);
      else lines.push('Book: none on disk - use the CBSE curriculum for this class');
      lines.push('');
      for (const k of c.concepts) lines.push(`- concept: \`${k.concept}\` (topic: ${k.topic})`);
      lines.push('');
    }
    const name = subject.toLowerCase().replace(/[^a-z]+/g, '-');
    fs.writeFileSync(path.join(outDir, `brief-${name}-${grades.join('')}.md`), lines.join('\n'));
  }

  console.log(`  database        : ${db}`);
  console.log(`  chapters (${grades.join(', ')}) : ${withCounts.length}`);
  console.log(`  without questions: ${withCounts.filter((c) => c.questions === 0).length}`);
  console.log(`  exported        : ${selected.length} -> ${outDir}`);
  for (const [subject, list] of bySubject) console.log(`    ${subject.padEnd(12)} ${list.length} chapter(s)`);
} finally {
  await prisma.$disconnect();
}
