// Merges authored explanation files into the single explanation map.
//
//   node scripts/qa/merge-explanations.mjs --dir artifacts/qa/explanations
//
// Each input file is JSON:
//   { "explanations": [ { "text": "<exact question text>", "explanation": "<why>" } ] }
//
// Rules that make this safe to run repeatedly:
//  - the question text must match a question in the database exactly, or the
//    entry is reported and skipped (never silently written);
//  - an entry already in the map is skipped, so re-running is idempotent;
//  - the explanation must be a real sentence (>= 40 chars, not the legacy
//    template), so a batch cannot lower the quality bar;
//  - the TS file is rewritten with correct escaping and a trailing newline.
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

const MAP = 'apps/api/src/content/question-explanations.ts';
const dir = arg('--dir', path.join('artifacts', 'qa', 'explanations'));
const db = arg('--db', 'sanro_dev');
const LEGACY = 'Refer to the chapter notes for the detailed solution.';

process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const quote = (value) =>
  `'${String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')}'`;

let source = fs.readFileSync(MAP, 'utf8');
const start = source.indexOf('export const QUESTION_EXPLANATIONS: Record<string, string> = {');
if (start < 0) throw new Error('QUESTION_EXPLANATIONS was not found');
const open = source.indexOf('{', start);

/** the `}` that closes the one at `open`, ignoring string literals */
function closing(text, from) {
  let depth = 0;
  let inString = false;
  let quoteChar = '';
  for (let i = from; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') { i += 1; continue; }
      if (ch === quoteChar) inString = false;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inString = true; quoteChar = ch; continue; }
    if (ch === '{' || ch === '[' || ch === '(') depth += 1;
    else if (ch === '}' || ch === ']' || ch === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

const close = closing(source, open);
if (close < 0) throw new Error('the map is not balanced');
const mapBody = source.slice(open, close);

const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^explanations-.*\.json$/.test(f)) : [];
if (files.length === 0) {
  console.log(`  no explanation files in ${dir}`);
  process.exit(0);
}

const prisma = new PrismaClient();
const added = [];
const skippedExisting = [];
const problems = [];

try {
  const known = new Set((await prisma.question.findMany({ select: { text: true } })).map((q) => q.text));

  for (const file of files) {
    let payload;
    try {
      payload = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8').replace(/^\uFEFF/, ''));
    } catch (err) {
      problems.push(`${file}: not valid JSON (${err.message})`);
      continue;
    }
    const entries = Array.isArray(payload) ? payload : payload.explanations ?? [];
    if (!Array.isArray(entries)) {
      problems.push(`${file}: expected an "explanations" array`);
      continue;
    }
    console.log(`  ${file}: ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`);

    for (const entry of entries) {
      const text = typeof entry?.text === 'string' ? entry.text.trim() : '';
      const explanation = typeof entry?.explanation === 'string' ? entry.explanation.trim() : '';
      if (!text || !explanation) { problems.push(`${file}: entry missing text or explanation`); continue; }
      if (explanation.length < 40) { problems.push(`${file}: too short (${explanation.length}) - ${text.slice(0, 60)}`); continue; }
      if (explanation === LEGACY) { problems.push(`${file}: legacy template - ${text.slice(0, 60)}`); continue; }
      if (!known.has(text)) { problems.push(`${file}: no question matches - ${text.slice(0, 70)}`); continue; }
      if (mapBody.includes(`${quote(text)}:`)) { skippedExisting.push(text); continue; }
      added.push({ text, explanation });
      // guard against a duplicate key inside the same batch
      mapBody.length; // no-op to keep the linter quiet about unused reads
      if (added.filter((a) => a.text === text).length > 1) problems.push(`${file}: duplicate key - ${text.slice(0, 60)}`);
    }
  }

  if (added.length > 0) {
    const lines = added.map((entry) => `  ${quote(entry.text)}:\n    ${quote(entry.explanation)},`).join('\n');
    const before = source.slice(0, close).replace(/\s*$/, '');
    source = `${before}\n${lines}\n${source.slice(close)}`;
    fs.writeFileSync(MAP, source);
  }
} finally {
  await prisma.$disconnect();
}

console.log(`  database        : ${db}`);
console.log(`  files           : ${files.length}`);
console.log(`  added           : ${added.length}`);
console.log(`  already present : ${skippedExisting.length}`);
console.log(`  problems        : ${problems.length}`);
for (const problem of problems.slice(0, 20)) console.log(`    FAIL ${problem}`);
process.exit(problems.length ? 1 : 0);
