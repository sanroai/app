// Merges authored question fragments into the seed's question bank.
//
//   node scripts/qa/merge-question-fragments.mjs --dir artifacts/qa/<date>
//
// Each fragment is JSON:
//   { "questions": [ { grade, subject, chapter, concept, type, text, answer,
//                      marks, difficulty?, options?: [{ text, isCorrect }] } ] }
//
// The seed keeps one `question(...)` array plus a QUESTION_CONCEPT map from the
// question's text to the concept name (the seed throws when a question has no
// concept), so both are written here. Idempotent: a question whose text is
// already in the seed is skipped.
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};

const SEED = 'apps/api/prisma/seed.ts';
const dir = arg('--dir', path.join('artifacts', 'qa', new Date().toISOString().slice(0, 10)));

const SUBJECT_CONST = { Science: 'SCIENCE', SCIENCE: 'SCIENCE', Mathematics: 'MATHS', MATHS: 'MATHS', English: 'ENGLISH', ENGLISH: 'ENGLISH' };

const quote = (v) =>
  `'${String(v)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')}'`;

/** the `]` or `}` that closes the one at `open`, ignoring string literals */
function closing(text, open) {
  const pairs = { '[': ']', '{': '}', '(': ')' };
  let depth = 0;
  let inString = false;
  let quoteChar = '';
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') { i++; continue; }
      if (ch === quoteChar) inString = false;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inString = true; quoteChar = ch; continue; }
    if (pairs[ch]) depth++;
    else if (ch === ']' || ch === '}' || ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

const files = fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => /^questions-.*\.json$/.test(f))
  : [];
if (!files.length) {
  console.log(`  no question fragments in ${dir}`);
  process.exit(0);
}

let seed = fs.readFileSync(SEED, 'utf8');

const arrStart = seed.indexOf('const scienceQuestions = [');
if (arrStart < 0) throw new Error('the question array was not found');
const arrOpen = seed.indexOf('[', arrStart);
const arrClose = closing(seed, arrOpen);

// the array holds every subject, so "already present" must be read from it only
const existing = new Set(
  [...seed.slice(arrOpen, arrClose).matchAll(/^\s{6,}text: ('(?:[^'\\]|\\.)*')/gm)].map((m) => m[1]),
);

const entries = [];
const mappings = [];
let skipped = 0;
for (const file of files) {
  const frag = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8').replace(/^\uFEFF/, ''));
  for (const q of frag.questions ?? []) {
    const subject = SUBJECT_CONST[q.subject];
    if (!subject) throw new Error(`${file}: unknown subject "${q.subject}"`);
    const text = quote(q.text);
    if (existing.has(text)) { skipped += 1; continue; }
    const body = [`type: ${quote(q.type)}`, `text: ${text}`, `answer: ${quote(q.answer)}`, `marks: ${Number(q.marks) || 1}`];
    if (q.difficulty) body.push(`difficulty: ${quote(q.difficulty)}`);
    if (Array.isArray(q.options) && q.options.length) {
      body.push(`options: [${q.options.map((o) => `{ text: ${quote(o.text)}, isCorrect: ${o.isCorrect ? 'true' : 'false'} }`).join(', ')}]`);
    }
    entries.push(`    question(${quote(String(q.grade))}, ${subject}, ${quote(q.chapter)}, {\n${body.map((b) => `      ${b},`).join('\n')}\n    }),`);
    mappings.push(`    ${text}: ${quote(q.concept)},`);
    existing.add(text);
  }
}

if (!entries.length) {
  console.log(`  ${files.length} fragment(s), ${skipped} question(s) already in the seed - nothing to add`);
  process.exit(0);
}

// 1. the question array: append before its closing bracket
const beforeArr = seed.slice(0, arrClose).replace(/\s*$/, '');
seed = `${beforeArr}\n${entries.join('\n')}\n  ${seed.slice(arrClose)}`;

// 2. the concept map: append before its closing brace
const mapStart = seed.indexOf('const QUESTION_CONCEPT: Record<string, string> = {');
if (mapStart < 0) throw new Error('QUESTION_CONCEPT was not found');
const mapOpen = seed.indexOf('{', mapStart);
const mapClose = closing(seed, mapOpen);
const beforeMap = seed.slice(0, mapClose).replace(/\s*$/, '');
seed = `${beforeMap}\n${mappings.join('\n')}\n  ${seed.slice(mapClose)}`;

fs.writeFileSync(SEED, seed);
console.log(`  ${files.length} fragment(s): added ${entries.length} question(s), skipped ${skipped}`);
