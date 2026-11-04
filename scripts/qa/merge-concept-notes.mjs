// Merges authored concept micro-notes into one map.
//
//   node scripts/qa/merge-concept-notes.mjs --dir artifacts/qa/concept-notes
//
// Each input file is JSON:
//   { "notes": [ { "code": "SCI-10-1", "concept": "Law of Conservation of Mass",
//                  "notes": "**What it is:** ... **Why it works:** ... **Common mistake:** ..." } ] }
//
// The key is `<chapter code>|<concept name>` - concept names repeat across
// chapters ("Number Play" exists in several classes), so the chapter is part of
// the key. Every entry is checked against the database before it is written:
// a concept that does not exist is reported, never silently added. Re-running is
// idempotent, and an entry whose note already exists is skipped.
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

const MAP = 'apps/api/src/content/concept-notes.ts';
const dir = arg('--dir', path.join('artifacts', 'qa', 'concept-notes'));
const db = arg('--db', 'sanro_dev');
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const quote = (value) =>
  `'${String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')}'`;

const HEADER = `/**
 * Concept micro-notes: three short blocks for the concepts that have no content
 * of their own.
 *
 * 847 of the 1,089 concepts have nothing attached, so their page shows the
 * *chapter's* notes - written for the chapter as a whole, which rarely answers
 * "what is this concept?". A micro-note answers exactly that in three lines:
 * what it is, why it works, and the mistake students actually make.
 *
 * Keyed by \`<chapter code>|<concept name>\` because concept names repeat across
 * chapters. Applied to a database by \`ContentService.syncConceptNotes\` (and by
 * the seed on a fresh install); the note becomes a NOTES content item on that
 * concept.
 */
export const CONCEPT_MICRO_NOTES: Record<string, string> = {
`;

const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^notes-.*\.json$/.test(f)) : [];
if (files.length === 0) {
  console.log(`  no note files in ${dir}`);
  process.exit(0);
}

const existing = fs.existsSync(MAP) ? fs.readFileSync(MAP, 'utf8') : HEADER + '};\n';

const prisma = new PrismaClient();
const added = [];
const skipped = [];
const problems = [];

try {
  const concepts = await prisma.concept.findMany({
    select: { name: true, topic: { select: { chapter: { select: { code: true } } } } },
  });
  const known = new Set(concepts.map((c) => `${c.topic.chapter.code}|${c.name}`));

  for (const file of files) {
    const payload = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8').replace(/^\uFEFF/, ''));
    const entries = Array.isArray(payload) ? payload : payload.notes ?? [];
    console.log(`  ${file}: ${entries.length} note(s)`);
    for (const entry of entries) {
      const key = `${String(entry.code ?? '').trim()}|${String(entry.concept ?? '').trim()}`;
      const notes = String(entry.notes ?? '').trim();
      if (!notes) { problems.push(`${file}: empty note for ${key}`); continue; }
      if (notes.length < 120) { problems.push(`${file}: note too short (${notes.length}) - ${key}`); continue; }
      if (!known.has(key)) { problems.push(`${file}: no such concept - ${key}`); continue; }
      const marker = `${quote(key)}:`;
      if (existing.includes(marker) || added.some((a) => a.key === key)) { skipped.push(key); continue; }
      added.push({ key, notes });
    }
  }

  if (added.length > 0) {
    const lines = added.map((entry) => `  ${quote(entry.key)}:\n    ${quote(entry.notes)},`).join('\n');
    const close = existing.lastIndexOf('};');
    if (close < 0) throw new Error('the map is not terminated');
    const before = existing.slice(0, close).replace(/\s*$/, '');
    fs.writeFileSync(MAP, `${before}\n${lines}\n${existing.slice(close)}`);
  }
} finally {
  await prisma.$disconnect();
}

console.log(`  database        : ${db}`);
console.log(`  files           : ${files.length}`);
console.log(`  added           : ${added.length}`);
console.log(`  already present : ${skipped.length}`);
console.log(`  problems        : ${problems.length}`);
for (const problem of problems.slice(0, 20)) console.log(`    FAIL ${problem}`);
process.exit(problems.length ? 1 : 0);
