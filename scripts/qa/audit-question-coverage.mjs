// How many of the seeded chapters have practice questions?
//
//   node scripts/qa/audit-question-coverage.mjs
//
// A chapter without questions cannot be practised, so the chapter hub shows
// "No practice questions for this chapter yet" and the concept never reaches a
// mastery state. Classes 1-7 are placeholders and are reported separately.
import fs from 'node:fs';

const SEED = 'apps/api/prisma/seed.ts';
const seed = fs.readFileSync(SEED, 'utf8');

// Classes 1-4 English is seeded from `primary-english.ts`; include its questions
// and chapters so the primary classes are not reported as unpractisable.
const primaryPath = 'apps/api/prisma/primary-english.ts';
const primary = fs.existsSync(primaryPath) ? fs.readFileSync(primaryPath, 'utf8') : '';
const primaryQuestions = [
  ...primary.matchAll(/grade:\s*'(\d)',\s*\n\s*chapterName:\s*(?:'((?:[^'\\]|\\.)*)'|"([^"]*)")/g),
].map((m) => ({ grade: m[1], subject: 'ENGLISH', chapter: (m[2] ?? m[3]).replace(/\\'/g, "'") }));
const primaryChapters = [
  ...primary.matchAll(/name:\s*(?:'((?:[^'\\]|\\.)*)'|"([^"]*)")\s*,\s*\n\s*code:\s*'ENG-([1-4])-\d'/g),
].map((m) => ({ name: (m[1] ?? m[2]).replace(/\\'/g, "'"), code: 'ENG', grade: m[3] }));

// Question top-ups for the chapters that only had three questions.
const topupPath = 'apps/api/prisma/question-topups.ts';
const topup = fs.existsSync(topupPath) ? fs.readFileSync(topupPath, 'utf8') : '';
const topupQuestions = [
  ...topup.matchAll(/grade:\s*'(\d+)',\s*subject:\s*'(MATHS|SCIENCE)',\s*chapterName:\s*'((?:[^'\\]|\\.)*)'/g),
].map((m) => ({
  grade: m[1],
  subject: m[2],
  chapter: m[3].replace(/\\'/g, "'"),
}));

// the question helper: question('<grade>', SUBJECT, '<chapter>', { ... })
const calls = [...seed.matchAll(/question\(\s*'(\d+)',\s*([A-Z_]+),\s*'((?:[^'\\]|\\.)*)'/g)].map((m) => ({
  grade: m[1],
  subject: m[2],
  chapter: m[3].replace(/\\'/g, "'"),
}));

calls.push(...primaryQuestions);
calls.push(...topupQuestions);

const counts = new Map();for (const q of calls) {
  const key = `${q.grade}|${q.subject}|${q.chapter}`;
  counts.set(key, (counts.get(key) || 0) + 1);
}

const chapters = [...seed.matchAll(/name:\s*'((?:[^'\\]|\\.)*)',\s*\n\s*code:\s*'([A-Z]+)-(\d+)(?:P\d)?-(\d+)'/g)].map((m) => ({
  name: m[1].replace(/\\'/g, "'"),
  code: m[2],
  grade: m[3],
}));
const SUBJECT_OF = { SCI: 'SCIENCE', MAT: 'MATHS', ENG: 'ENGLISH' };

chapters.push(...primaryChapters);

console.log(`  questions in the seed  : ${calls.length}`);
for (const grade of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']) {
  const list = chapters.filter((c) => c.grade === grade);
  if (!list.length) continue;
  const withQ = list.filter(
    (c) => (counts.get(`${grade}|${SUBJECT_OF[c.code.split('-')[0]]}|${c.name}`) || 0) > 0,
  );
  console.log(`  class ${grade}: ${withQ.length} / ${list.length} chapters have questions`);
  if (withQ.length === 0) continue;
  for (const c of list) {
    const n = counts.get(`${grade}|${SUBJECT_OF[c.code.split('-')[0]]}|${c.name}`) || 0;
    if (!n) console.log(`      none: ${c.code} ${c.name}`);
  }
}
