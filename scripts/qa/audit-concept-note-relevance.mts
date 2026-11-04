// Which concepts show notes that are not about them?
//
//   npx tsx scripts/qa/audit-concept-note-relevance.mts
//
// "Has notes" is not the same as "has notes about this concept". A concept can carry
// a NOTES item whose title and body are about a different part of the chapter
// ("Law of Conservation of Mass" showed "Balancing Equations - Practice Problems").
// A micro-note is recognisable: it is titled "<concept> - Key Idea" and its body
// starts with "What it is:". Anything else is checked for whether the concept is
// named at all - a cheap proxy that catches a note written for the wrong idea.
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const argv = process.argv.slice(2);
const db = argv.includes('--db') ? argv[argv.indexOf('--db') + 1] : 'sanro_dev';
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const prisma = new PrismaClient();
try {
  const concepts = await prisma.concept.findMany({
    select: {
      name: true,
      topic: { select: { chapter: { select: { code: true, grade: true, name: true } } } },
      content: { where: { type: 'NOTES', status: 'APPROVED' }, select: { title: true, description: true } },
      questions: {
        where: { status: 'APPROVED' },
        select: { text: true, answer: true },
        take: 3,
      },
    },
    orderBy: [{ topic: { chapter: { code: 'asc' } } }, { name: 'asc' }],
  });

  const normalise = (text) =>
    String(text ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  let micro = 0;
  let mentions = 0;
  const silent = [];

  for (const concept of concepts) {
    if (concept.content.length === 0) {
      silent.push({ code: concept.topic.chapter.code, concept: concept.name, why: 'no notes at all' });
      continue;
    }
    const hasMicro = concept.content.some((c) => String(c.title).endsWith(' - Key Idea'));
    if (hasMicro) {
      micro += 1;
      continue;
    }
    // The concept must appear in the notes it carries, in title or body.
    const name = normalise(concept.name);
    const named = concept.content.some(
      (c) => normalise(c.title).includes(name) || normalise(c.description).includes(name),
    );
    if (named) {
      mentions += 1;
      continue;
    }
    // Concept names are multi-word; a note can cover the idea without naming it.
    // Require at least two thirds of the name's words to appear.
    const wanted = name.split(' ').filter((w) => w.length > 3);
    const body = normalise(concept.content.map((c) => `${c.title} ${c.description ?? ''}`).join(' '));
    const hit = wanted.filter((w) => body.includes(w)).length;
    const ratio = wanted.length ? hit / wanted.length : 1;
    if (ratio >= 0.66 && wanted.length > 0) {
      mentions += 1;
      continue;
    }
    silent.push({
      code: concept.topic.chapter.code,
      concept: concept.name,
      why: `notes title "${concept.content[0].title.slice(0, 60)}" never mentions it`,
    });
  }

  const byGrade = new Map();
  for (const row of silent) {
    const grade = concepts.find((c) => c.topic.chapter.code === row.code)?.topic.chapter.grade;
    byGrade.set(grade, (byGrade.get(grade) ?? 0) + 1);
  }

  console.log(`  database               : ${db}`);
  console.log(`  concepts               : ${concepts.length}`);
  console.log(`  micro-note (own note)  : ${micro}`);
  console.log(`  notes name the concept : ${mentions}`);
  console.log(`  notes about something else: ${silent.length}`);
  for (const grade of [...byGrade.keys()].sort((a, b) => Number(a) - Number(b))) {
    console.log(`    class ${String(grade).padStart(2)}: ${byGrade.get(grade)}`);
  }
  for (const row of silent.slice(0, 25)) console.log(`    ${row.code} | ${row.concept} | ${row.why}`);

  // --out writes the authoring input for these concepts: one micro-note each, in the
  // same shape `merge-concept-notes.mjs` accepts after authoring.
  const outIndex = argv.indexOf('--out');
  if (outIndex >= 0 && argv[outIndex + 1]) {
    const out = argv[outIndex + 1];
    const silentKeys = new Set(silent.map((row) => `${row.code}|${row.concept}`));
    const payload = concepts
      .filter((c) => silentKeys.has(`${c.topic.chapter.code}|${c.name}`))
      .map((c) => ({
        code: c.topic.chapter.code,
        chapter: c.topic.chapter.name,
        grade: c.topic.chapter.grade,
        concept: c.name,
        // what the concept currently shows instead - the author must not repeat it
        wrongNoteTitle: c.content[0]?.title ?? null,
        questions: c.questions.map((q) => ({ text: q.text, answer: q.answer })),
      }));
    const fs = await import('node:fs');
    const path = await import('node:path');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(payload, null, 2));
    console.log(`\n  wrote ${out}: ${payload.length} concept(s)`);
  }
} finally {
  await prisma.$disconnect();
}
