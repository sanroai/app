// Applies the seed's authored explanations to questions that already exist.
//
//   node scripts/qa/apply-question-explanations.mjs [db]
//
// The seed writes QUESTION_EXPLANATIONS on a fresh install, and re-seeding an
// existing database applies them too - but a full `db:seed:demo` also clears the
// demo students' XP ledger, which is not something to do just to refresh a
// sentence. This script reads the same map and updates only the explanation
// column, so it is safe to run against a database that already holds history.
//
// It is idempotent: a question whose explanation already matches is not written.
// Exit code 1 when a key in the map no longer matches any question, because that
// means the question text changed and its explanation is now orphaned.
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const argv = process.argv.slice(2);
const db = argv.find((a) => /^(sanro|postgres)[a-z0-9_]*$/i.test(a)) ?? 'sanro_dev';
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const SEED = 'apps/api/src/content/question-explanations.ts';
const source = fs.readFileSync(SEED, 'utf8');
const start = source.indexOf('export const QUESTION_EXPLANATIONS: Record<string, string> = {');
if (start < 0) throw new Error('QUESTION_EXPLANATIONS was not found');

/** the `}` that closes the one at `open`, ignoring string literals */
function closing(text, open) {
  let depth = 0;
  let inString = false;
  let quote = '';
  for (let i = open; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') { i += 1; continue; }
      if (ch === quote) inString = false;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inString = true; quote = ch; continue; }
    if (ch === '{' || ch === '[' || ch === '(') depth += 1;
    else if (ch === '}' || ch === ']' || ch === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

const open = source.indexOf('{', start);
const close = closing(source, open);
if (close < 0) throw new Error('QUESTION_EXPLANATIONS is not balanced');

// The map body is plain JS (single-quoted strings, no TS syntax), so it can be
// evaluated directly - no parser, no duplication of the strings.
const map = new Function(`"use strict"; return (${source.slice(open, close + 1)});`)();

const prisma = new PrismaClient();
let updated = 0;
let unchanged = 0;
const missing = [];

try {
  for (const [text, explanation] of Object.entries(map)) {
    const question = await prisma.question.findFirst({
      where: { text },
      select: { id: true, explanation: true, source: true },
    });
    if (!question) { missing.push(text); continue; }
    if (question.explanation === explanation) { unchanged += 1; continue; }
    // A teacher-authored question keeps its own explanation.
    if (question.source !== 'SEED') { unchanged += 1; continue; }
    await prisma.question.update({ where: { id: question.id }, data: { explanation } });
    updated += 1;
  }
} finally {
  await prisma.$disconnect();
}

console.log(`  database        : ${db}`);
console.log(`  authored map    : ${Object.keys(map).length}`);
console.log(`  updated         : ${updated}`);
console.log(`  already correct : ${unchanged}`);
console.log(`  orphaned keys   : ${missing.length}`);
for (const text of missing.slice(0, 10)) console.log(`    ORPHAN ${text.slice(0, 100)}`);
process.exit(missing.length ? 1 : 0);
