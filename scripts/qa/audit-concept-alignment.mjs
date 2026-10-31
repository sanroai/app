// Does every concept actually belong to the chapter it is filed under?
//
//   node scripts/qa/audit-concept-alignment.mjs [--grades 5,6,7,8,9,10] [db]
//
// Compares each concept name with the chapter's own textbook text (the PDF text
// layer under books/). Three outcomes:
//   exact  - the name appears verbatim in the chapter text
//   words  - every significant word of the name appears somewhere in the text
//   absent - the name (and at least one of its words) is nowhere in the text,
//            i.e. the concept probably belongs to another chapter or to a
//            syllabus that the book no longer has
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
const db = argv.filter((a) => !a.startsWith('--') && a !== arg('--grades', '')).at(-1) ?? 'sanro_dev';
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const BOOKS = {
  SCIENCE: { 5: 'class-5/world', 6: 'class-6/science', 7: 'class-7/science', 8: 'class-8/science', 9: 'class-9/science', 10: 'class-10/science' },
  MATHEMATICS: { 5: 'class-5/math', 6: 'class-6/math', 7: 'class-7/math 1', 8: 'class-8', 9: 'class-9/math', 10: 'class-10/mathematics' },
  ENGLISH: { 5: 'class-5/english', 6: 'class-6/english', 7: 'class-7/english', 8: 'class-8/english', 9: 'class-9/english', 10: 'class-10/english' },
};

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const STOP = new Set(['and', 'or', 'of', 'the', 'a', 'an', 'in', 'to', 'with', 'for', 'on', 'by', 'its', 'their', 'from', 'at', 'as']);

function bookDir(subject, grade, code) {
  const key = String(subject ?? '').toUpperCase();
  const part = /P(\d)-/.exec(code ?? '');
  const folder = key === 'MATHEMATICS' && part ? `class-${grade}/math ${part[1]}` : BOOKS[key]?.[grade];
  const n = Number(/(\d+)$/.exec(code ?? '')?.[1]);
  if (!folder || !n) return null;
  const dir = path.join('books', 'cbse', folder, 'chapters');
  if (!fs.existsSync(dir)) return null;
  const dirs = fs.readdirSync(dir).filter((d) => /^\d\d-/.test(d) && !d.startsWith('00-')).sort();
  const hit = dirs[n - 1];
  return hit ? path.join(dir, hit) : null;
}

function chapterText(dir) {
  for (const name of ['text.merged.txt', 'text.txt']) {
    const file = path.join(dir, name);
    if (fs.existsSync(file)) return norm(fs.readFileSync(file, 'utf8'));
  }
  return '';
}

const prisma = new PrismaClient();
try {
  const chapters = await prisma.chapter.findMany({
    where: { grade: { in: grades } },
    orderBy: [{ grade: 'asc' }, { code: 'asc' }],
    include: { subject: { select: { name: true } }, topics: { include: { concepts: { select: { name: true } } } } },
  });

  const report = [];
  const texts = new Map();
  for (const ch of chapters) {
    const dir = bookDir(ch.subject.name, ch.grade, ch.code);
    if (!dir) continue;
    const text = chapterText(dir);
    if (text) texts.set(ch.id, { code: ch.code, chapter: ch.name, grade: ch.grade, subject: ch.subject.name, text });
  }

  for (const ch of chapters) {
    const dir = bookDir(ch.subject.name, ch.grade, ch.code);
    if (!dir) continue;
    const text = chapterText(dir);
    if (!text) continue;
    for (const topic of ch.topics) {
      for (const concept of topic.concepts) {
        const name = norm(concept.name);
        if (!name) continue;
        let verdict = 'absent';
        if (text.includes(name)) verdict = 'exact';
        else {
          const words = name.split(' ').filter((w) => w.length > 2 && !STOP.has(w));
          if (words.length > 0 && words.every((w) => text.includes(w))) verdict = 'words';
        }
        if (verdict === 'exact') continue;
        // Where else does this exact name appear in the same class+subject?
        const elsewhere = [];
        if (name.split(' ').filter((w) => w.length > 2).length >= 2) {
          for (const [id, other] of texts) {
            if (id === ch.id) continue;
            if (other.grade !== ch.grade || other.subject !== ch.subject.name) continue;
            if (other.text.includes(name)) elsewhere.push(other.code);
          }
        }
        report.push({
          grade: ch.grade,
          code: ch.code,
          chapter: ch.name,
          topic: topic.name,
          concept: concept.name,
          verdict: elsewhere.length ? 'misplaced' : 'thematic',
          foundIn: elsewhere,
        });
      }
    }
  }

  const counts = { misplaced: 0, thematic: 0, words: 0 };
  for (const r of report) counts[r.verdict === 'misplaced' ? 'misplaced' : r.verdict === 'thematic' ? 'thematic' : 'words'] += 1;
  console.log('  concepts not found verbatim in their chapter text');
  console.log(`    found in a different chapter : ${counts.misplaced}`);
  console.log(`    nowhere in the subject book  : ${counts.thematic}`);
  console.log(`    too many partial matches     : ${counts.words}`);
  console.log(`  total: ${report.length}`);

  const outDir = path.join('artifacts', 'qa', new Date().toISOString().slice(0, 10));
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, 'concept-alignment.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`  written: ${out}`);
  for (const r of report.filter((x) => x.verdict === 'absent').slice(0, 20)) {
    console.log(`    ABSENT ${r.grade} ${r.code} ${r.chapter} / ${r.concept}`);
  }
} finally {
  await prisma.$disconnect();
}
