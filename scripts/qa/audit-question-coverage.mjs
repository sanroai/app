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

// the question helper: question('<grade>', SUBJECT, '<chapter>', { ... })
const calls = [...seed.matchAll(/question\(\s*'(\d+)',\s*([A-Z_]+),\s*'((?:[^'\\]|\\.)*)'/g)].map((m) => ({
  grade: m[1],
  subject: m[2],
  chapter: m[3].replace(/\\'/g, "'"),
}));

const counts = new Map();
for (const q of calls) {
  const key = `${q.grade}|${q.subject}|${q.chapter}`;
  counts.set(key, (counts.get(key) || 0) + 1);
}

const chapters = [...seed.matchAll(/name:\s*'((?:[^'\\]|\\.)*)',\s*\n\s*code:\s*'([A-Z]+)-(\d+)(?:P\d)?-(\d+)'/g)].map((m) => ({
  name: m[1].replace(/\\'/g, "'"),
  code: m[2],
  grade: m[3],
}));
const SUBJECT_OF = { SCI: 'SCIENCE', MAT: 'MATHS', ENG: 'ENGLISH' };

console.log(`  questions in the seed  : ${calls.length}`);
for (const grade of ['8', '9', '10']) {
  const list = chapters.filter((c) => c.grade === grade);
  if (!list.length) continue;
  const withQ = list.filter(
    (c) => (counts.get(`${grade}|${SUBJECT_OF[c.code.split('-')[0]]}|${c.name}`) || 0) > 0,
  );
  console.log(`  class ${grade}: ${withQ.length} / ${list.length} chapters have questions`);
  for (const c of list) {
    const n = counts.get(`${grade}|${SUBJECT_OF[c.code.split('-')[0]]}|${c.name}`) || 0;
    if (!n) console.log(`      none: ${c.code} ${c.name}`);
  }
}
