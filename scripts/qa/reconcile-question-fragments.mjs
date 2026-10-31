// Re-points authored questions at the chapter that actually owns their concept.
//
//   node scripts/qa/reconcile-question-fragments.mjs --dir artifacts/qa/<date> [--apply] [db]
//
// Authoring agents read the database as it was before the stale-topic prune, so a
// question can name the chapter a concept used to hang under. When the concept now
// lives in exactly one chapter of the same class+subject, the chapter is rewritten
// to that one; anything ambiguous is reported and left alone.
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
const dir = arg('--dir', path.join('artifacts', 'qa', new Date().toISOString().slice(0, 10)));
const apply = argv.includes('--apply');
const dropUnknown = argv.includes('--drop-unknown');
const positional = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--dir');
const db = positional.find((a) => /^(sanro|postgres)[a-z0-9_]*$/i.test(a)) ?? 'sanro_dev';
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^questions-.*\.json$/.test(f)) : [];
if (!files.length) {
  console.log(`  no question fragments in ${dir}`);
  process.exit(0);
}

const prisma = new PrismaClient();
try {
  const chapters = await prisma.chapter.findMany({
    include: {
      subject: { select: { name: true } },
      topics: { include: { concepts: { select: { name: true } } } },
    },
  });

  // (grade|subject) -> concept name -> chapters that contain it
  const owners = new Map();
  const chapterNames = new Map();
  for (const ch of chapters) {
    const key = `${ch.grade}|${ch.subject.name.toLowerCase()}`;
    if (!chapterNames.has(key)) chapterNames.set(key, new Set());
    chapterNames.get(key).add(ch.name);
    for (const topic of ch.topics) {
      for (const concept of topic.concepts) {
        if (!owners.has(key)) owners.set(key, new Map());
        const m = owners.get(key);
        if (!m.has(concept.name)) m.set(concept.name, new Set());
        m.get(concept.name).add(ch.name);
      }
    }
  }

  let total = 0;
  let rewritten = 0;
  let dropped = 0;
  const problems = [];
  const droppedList = [];
  for (const file of files) {
    const full = path.join(dir, file);
    const payload = JSON.parse(fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, ''));
    let changed = 0;
    const kept = [];
    for (const q of payload.questions ?? []) {
      total += 1;
      const key = `${q.grade}|${String(q.subject ?? '').toLowerCase()}`;
      const known = chapterNames.get(key);
      if (!known || !known.has(q.chapter)) {
        problems.push(`${file}: no class-${q.grade} ${q.subject} chapter "${q.chapter}"`);
        kept.push(q);
        continue;
      }
      const map = owners.get(key) ?? new Map();
      const homes = map.get(q.concept);
      if (!homes) {
        if (dropUnknown) {
          dropped += 1;
          droppedList.push(`${file}: ${q.concept} - ${String(q.text).slice(0, 60)}`);
          continue;
        }
        problems.push(`${file}: unknown concept "${q.concept}" (class ${q.grade} ${q.subject})`);
        kept.push(q);
        continue;
      }
      if (homes.has(q.chapter)) {
        kept.push(q);
        continue;
      }
      if (homes.size !== 1) {
        problems.push(`${file}: "${q.concept}" lives in ${homes.size} chapters (${[...homes].join(', ')}), chapter left as "${q.chapter}"`);
        kept.push(q);
        continue;
      }
      const target = [...homes][0];
      q.chapter = target;
      changed += 1;
      kept.push(q);
      console.log(`    ${file}: ${q.concept} -> ${target}`);
    }
    payload.questions = kept;
    if (changed || payload.questions.length !== total) {
      rewritten += changed;
      if (apply) fs.writeFileSync(full, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    }
    console.log(`  ${file}: ${changed} chapter rewrite(s)${apply ? '' : ' (dry run)'}`);
  }

  console.log(`  fragments     : ${files.length}`);
  console.log(`  questions     : ${total}`);
  console.log(`  rewritten     : ${rewritten}`);
  console.log(`  dropped       : ${dropped}`);
  for (const d of droppedList.slice(0, 12)) console.log(`    - ${d}`);
  console.log(`  problems      : ${problems.length}`);
  for (const p of problems.slice(0, 20)) console.log(`    FAIL ${p}`);
  if (!apply && (rewritten || dropped)) console.log('  dry run - re-run with --apply to write the fragments');
} finally {
  await prisma.$disconnect();
}
