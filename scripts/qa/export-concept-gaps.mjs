// Exports, per class+subject, the concepts that still have no question of their
// own, so practice can be concept-exact instead of falling back to the chapter.
//
//   node scripts/qa/export-concept-gaps.mjs [--grades 5,6,7] [--dir artifacts/qa/<date>] [db]
//
// Writes <dir>/concept-gaps.json plus one markdown brief per (grade, subject):
// <dir>/brief-gaps-<grade>-<subject>.md
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const argv = process.argv.slice(2);
const gradeArg = (() => {
  const i = argv.indexOf('--grades');
  return i >= 0 && argv[i + 1] ? argv[i + 1] : '5,6,7,8,9,10';
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

function bookPath(subject, grade, code) {
  const key = String(subject ?? '').toUpperCase();
  const part = /P(\d)-/.exec(code ?? '');
  if (key === 'MATHEMATICS' && part) return `class-${grade}/math ${part[1]}`;
  return BOOKS[key]?.[grade] ?? null;
}

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
const rows = [];
try {
  const chapters = await prisma.chapter.findMany({
    where: { grade: { in: grades } },
    orderBy: [{ grade: 'asc' }, { code: 'asc' }],
    include: {
      subject: { select: { name: true } },
      topics: {
        orderBy: { order: 'asc' },
        include: { concepts: { orderBy: { order: 'asc' }, select: { name: true, id: true } } },
      },
    },
  });

  for (const ch of chapters) {
    const counts = await prisma.question.groupBy({
      by: ['conceptId'],
      where: { chapterId: ch.id, conceptId: { not: null } },
      _count: { _all: true },
    });
    const have = new Map(counts.map((c) => [c.conceptId, c._count._all]));
    const gaps = [];
    for (const topic of ch.topics) {
      for (const concept of topic.concepts) {
        if ((have.get(concept.id) ?? 0) === 0) gaps.push({ concept: concept.name, topic: topic.name });
      }
    }
    if (gaps.length === 0) continue;
    rows.push({
      code: ch.code,
      grade: ch.grade,
      subject: ch.subject.name,
      chapter: ch.name,
      bookText: chapterDir(ch.subject.name, ch.grade, ch.code),
      concepts: gaps,
    });
  }

  const outJson = path.join(outDir, 'concept-gaps.json');
  fs.writeFileSync(outJson, JSON.stringify(rows, null, 2));

  const byKey = new Map();
  for (const r of rows) {
    const key = `${r.grade}|${r.subject}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(r);
  }

  console.log('  gaps per class+subject');
  const briefs = [];
  for (const [key, list] of [...byKey].sort()) {
    const [grade, subject] = key.split('|');
    const conceptCount = list.reduce((n, c) => n + c.concepts.length, 0);
    const slug = subject.toLowerCase().replace(/\s+/g, '-');
    const file = path.join(outDir, `brief-gaps-${grade}-${slug}.md`);
    const lines = [
      `# Concept question gaps - ${subject}, class ${grade}`,
      '',
      `${conceptCount} concept(s) across ${list.length} chapter(s) have no question of their own.`,
      'Author **one question per concept** (two where the concept is broad), strictly',
      'answerable from that concept. Read the chapter text first:',
      '',
      '```json',
      '{ "questions": [ {',
      `  "grade": "${grade}", "subject": "${subject}", "chapter": "<exact chapter name below>",`,
      '  "concept": "<exact concept name below>", "type": "MCQ",',
      '  "text": "question text", "answer": "exact option text of the correct answer",',
      '  "marks": 1, "difficulty": "EASY|MEDIUM|HARD",',
      '  "options": [ { "text": "...", "isCorrect": true }, { "text": "...", "isCorrect": false },',
      '               { "text": "...", "isCorrect": false }, { "text": "...", "isCorrect": false } ]',
      '} ] }',
      '```',
      '',
      '- `type` is `MCQ` or `SHORT_ANSWER`; a SHORT_ANSWER has no `options` and must be single-valued.',
      '- For an MCQ the `answer` MUST be one of the option texts, verbatim, with exactly one `isCorrect: true`.',
      '- No page numbers, no "according to the chapter", no picture references.',
      '- The concept name must match the list below exactly (copy/paste).',
      '- Write your fragment to `' + path.join(outDir, `questions-gaps-${grade}-${slug}.json`).replace(/\\/g, '/') + '`.',
      '',
    ];
    for (const c of list) {
      lines.push(`## ${c.code} - ${c.chapter}`);
      lines.push('');
      if (c.bookText) lines.push(`Book text: \`${c.bookText}/text.txt\``);
      else lines.push('Book: none on disk');
      lines.push('');
      for (const g of c.concepts) lines.push(`- concept: \`${g.concept}\` (topic: ${g.topic})`);
      lines.push('');
    }
    fs.writeFileSync(file, lines.join('\n'));
    briefs.push({ grade, subject, chapters: list.length, concepts: conceptCount, brief: file });
    console.log(`    class ${grade} ${subject.padEnd(12)} ${String(list.length).padStart(2)} chapters  ${String(conceptCount).padStart(3)} concepts  -> ${path.basename(file)}`);
  }

  fs.writeFileSync(path.join(outDir, 'concept-gaps-summary.json'), JSON.stringify(briefs, null, 2));
  const total = rows.reduce((n, r) => n + r.concepts.length, 0);
  console.log(`  total: ${total} concept gaps in ${rows.length} chapters`);
  console.log(`  written: ${outJson}`);
} finally {
  await prisma.$disconnect();
}
