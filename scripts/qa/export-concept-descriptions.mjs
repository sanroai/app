// Exports every concept with its chapter and textbook path, so an authoring
// agent can write a one-line summary per concept ("Quick Revision" on the
// concept page).
//
//   node scripts/qa/export-concept-descriptions.mjs [--grades 5,6,7] [--dir artifacts/qa/<date>] [--gaps] [db]
//
// Writes <dir>/concept-descriptions-outline.json and one brief per
// (grade, subject): <dir>/brief-desc-<grade>-<subject>.md
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
const grades = arg('--grades', '5,6,7,8,9,10').split(',').map((g) => g.trim()).filter(Boolean);
const dirArg = arg('--dir', null);
const onlyMissing = argv.includes('--gaps');
const db = argv.filter((a) => !a.startsWith('--') && a !== arg('--grades', '') && a !== (dirArg ?? '')).at(-1) ?? 'sanro_dev';
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const outDir = dirArg ?? path.join('artifacts', 'qa', new Date().toISOString().slice(0, 10));
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
try {
  const chapters = await prisma.chapter.findMany({
    where: { grade: { in: grades } },
    orderBy: [{ grade: 'asc' }, { code: 'asc' }],
    include: {
      subject: { select: { name: true } },
      topics: { orderBy: { order: 'asc' }, include: { concepts: { orderBy: { order: 'asc' }, select: { name: true, description: true } } } },
    },
  });

  const rows = [];
  for (const ch of chapters) {
    const concepts = ch.topics.flatMap((t) => t.concepts.map((c) => ({ name: c.name, topic: t.name, description: c.description })));
    const pending = onlyMissing ? concepts.filter((c) => !c.description) : concepts;
    if (pending.length === 0) continue;
    rows.push({
      code: ch.code,
      grade: ch.grade,
      subject: ch.subject.name,
      chapter: ch.name,
      bookText: chapterDir(ch.subject.name, ch.grade, ch.code),
      concepts: pending,
    });
  }

  fs.writeFileSync(path.join(outDir, 'concept-descriptions-outline.json'), JSON.stringify(rows, null, 2));

  const byKey = new Map();
  for (const r of rows) {
    const key = `${r.grade}|${r.subject}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(r);
  }

  const summary = [];
  for (const [key, list] of [...byKey].sort()) {
    const [grade, subject] = key.split('|');
    const slug = subject.toLowerCase().replace(/\s+/g, '-');
    const total = list.reduce((n, c) => n + c.concepts.length, 0);
    const file = path.join(outDir, `brief-desc-${grade}-${slug}.md`);
    const lines = [
      `# Concept summaries - ${subject}, class ${grade}`,
      '',
      `${total} concept(s) across ${list.length} chapter(s). Write **one or two sentences** per`,
      'concept: what it is, and the one thing a student must remember. Read the chapter',
      'text so the wording matches the book (no page numbers, no figure references,',
      'no "according to the chapter"). 20-400 characters each, plain sentences, no',
      'markdown headings.',
      '',
      '```json',
      '{ "descriptions": [ {',
      `  "grade": "${grade}", "subject": "${subject}",`,
      '  "chapter": "<exact chapter name below>", "concept": "<exact concept name below>",',
      '  "description": "one or two sentences"',
      '} ] }',
      '```',
      '',
      `- Write to \`${path.join(outDir, `concept-descriptions-${grade}-${slug}.json`).replace(/\\/g, '/')}\`.`,
      '- Copy every `chapter` and `concept` string exactly (they are the database keys).',
      '',
    ];
    for (const c of list) {
      lines.push(`## ${c.code} - ${c.chapter}`);
      lines.push('');
      if (c.bookText) lines.push(`Book text: \`${c.bookText}/text.txt\``);
      else lines.push('Book: none on disk');
      lines.push('');
      for (const k of c.concepts) lines.push(`- concept: \`${k.name}\` (topic: ${k.topic})`);
      lines.push('');
    }
    fs.writeFileSync(file, lines.join('\n'));
    summary.push({ grade, subject, chapters: list.length, concepts: total, brief: file });
    console.log(`    class ${grade} ${subject.padEnd(12)} ${String(list.length).padStart(2)} chapters ${String(total).padStart(4)} concepts -> ${path.basename(file)}`);
  }
  fs.writeFileSync(path.join(outDir, 'concept-descriptions-summary.json'), JSON.stringify(summary, null, 2));
  console.log(`  total concepts: ${rows.reduce((n, r) => n + r.concepts.length, 0)}`);
} finally {
  await prisma.$disconnect();
}
