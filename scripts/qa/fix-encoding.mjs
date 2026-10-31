// Repairs double-encoded UTF-8 ("â€™" for "’") in the seed and in the database.
//
//   node scripts/qa/fix-encoding.mjs [--apply] [db]
//
// The corruption is a UTF-8 byte sequence that was read as CP1252 and written
// back as UTF-8. The repair re-encodes the CP1252 characters to their bytes and
// decodes them as UTF-8; a string is only touched when that round-trip is exact
// (valid UTF-8, fewer mojibake markers, byte-identical otherwise).
//
// Concept names are unique per topic, so a name that would collide with an
// existing concept is merged into it (questions are repointed) instead of being
// renamed.
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const apply = process.argv.includes('--apply');
const db = process.argv.slice(2).filter((a) => !a.startsWith('--')).at(-1) ?? 'sanro_dev';
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const CP1252 = new Map(
  Object.entries({
    '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87,
    'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e,
    '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97,
    '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
  }),
);
const MOJI = /(Ã[\u0080-\u00bf]|â€[\u0080-\u009f™œ“”–—¢šž]|Ã¢â€)/;

function encodeCp1252(text) {
  const bytes = [];
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code <= 0xff) bytes.push(code);
    else if (CP1252.has(ch)) bytes.push(CP1252.get(ch));
    else return null;
  }
  return Buffer.from(bytes);
}

function decodeOnce(text) {
  const bytes = encodeCp1252(text);
  if (!bytes) return null;
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function repair(text) {
  let cur = text;
  for (let i = 0; i < 3; i += 1) {
    if (!MOJI.test(cur)) break;
    const next = decodeOnce(cur);
    if (!next || next === cur) break;
    cur = next;
  }
  return cur;
}

const seedPath = 'apps/api/prisma/seed.ts';
const seed = fs.readFileSync(seedPath, 'utf8');
const seedLines = seed.split('\n');
let seedChanged = 0;
const seedRepaired = seedLines.map((line) => {
  if (!MOJI.test(line)) return line;
  const fixed = repair(line);
  if (fixed !== line) seedChanged += 1;
  return fixed;
});

console.log(`  seed lines repaired : ${seedChanged}`);

const prisma = new PrismaClient();
let conceptRenamed = 0;
let conceptMerged = 0;
let questionFixed = 0;
let optionFixed = 0;
let contentFixed = 0;
let topicFixed = 0;
try {
  // Concepts: rename when the repaired name is free in that topic, else merge.
  const concepts = await prisma.concept.findMany({ select: { id: true, name: true, topicId: true } });
  for (const concept of concepts) {
    if (!MOJI.test(concept.name)) continue;
    const name = repair(concept.name);
    if (name === concept.name) continue;
    const clash = await prisma.concept.findFirst({
      where: { topicId: concept.topicId, name, NOT: { id: concept.id } },
      select: { id: true },
    });
    if (apply) {
      if (clash) {
        await prisma.$transaction([
          prisma.question.updateMany({ where: { conceptId: concept.id }, data: { conceptId: clash.id } }),
          prisma.concept.delete({ where: { id: concept.id } }),
        ]);
        conceptMerged += 1;
      } else {
        await prisma.concept.update({ where: { id: concept.id }, data: { name } });
        conceptRenamed += 1;
      }
    } else if (clash) {
      conceptMerged += 1;
    } else {
      conceptRenamed += 1;
    }
  }

  for (const [model, field] of [
    ['question', 'text'],
    ['question', 'answer'],
    ['questionOption', 'text'],
    ['contentItem', 'description'],
    ['contentItem', 'title'],
    ['topic', 'name'],
  ]) {
    const rows = await prisma[model].findMany({ select: { id: true, [field]: true } });
    for (const row of rows) {
      const value = row[field];
      if (typeof value !== 'string' || !MOJI.test(value)) continue;
      const fixed = repair(value);
      if (fixed === value) continue;
      if (apply) await prisma[model].update({ where: { id: row.id }, data: { [field]: fixed } });
      if (model === 'question') questionFixed += 1;
      else if (model === 'questionOption') optionFixed += 1;
      else if (model === 'contentItem') contentFixed += 1;
      else if (model === 'topic') topicFixed += 1;
    }
  }

  console.log(`  concepts renamed    : ${conceptRenamed}`);
  console.log(`  concepts merged     : ${conceptMerged}`);
  console.log(`  questions repaired  : ${questionFixed}`);
  console.log(`  options repaired    : ${optionFixed}`);
  console.log(`  content repaired    : ${contentFixed}`);
  console.log(`  topics repaired     : ${topicFixed}`);
  if (!apply) console.log('  dry run - re-run with --apply');
} finally {
  await prisma.$disconnect();
}

if (apply && seedChanged > 0) {
  fs.writeFileSync(seedPath, seedRepaired.join('\n'));
  console.log('  seed written');
}
