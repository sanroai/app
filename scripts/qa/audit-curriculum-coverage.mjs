// Curriculum coverage audit: which chapters have a video, and does every video
// lesson have a URL (and the other way round)?
//
//   node scripts/qa/audit-curriculum-coverage.mjs
import fs from 'node:fs';

const seed = fs.readFileSync('apps/api/prisma/seed.ts', 'utf8');

/** every curriculum chapter: name + code (the entries are multi-line) */
const chapters = [...seed.matchAll(/name:\s*'((?:[^'\\]|\\.)*)',\s*\n\s*code:\s*'([A-Z]+-\d+(?:P\d)?-\d+)'/g)].map((m) => ({
  name: m[1].replace(/\\'/g, "'"),
  code: m[2],
}));

/** every lesson: ch, subject, grade, concept, type, title */
const lessons = [
  ...seed.matchAll(
    /ch:\s*'((?:[^'\\]|\\.)*)',\s*subjectName:\s*([A-Z_]+),\s*grade:\s*'(\d+)',\s*concept:\s*'((?:[^'\\]|\\.)*)',\s*type:\s*'([A-Z_]+)',\s*title:\s*'((?:[^'\\]|\\.)*)'/g,
  ),
].map((m) => ({
  ch: m[1].replace(/\\'/g, "'"),
  subject: m[2],
  grade: m[3],
  concept: m[4].replace(/\\'/g, "'"),
  type: m[5],
  title: m[6].replace(/\\'/g, "'"),
}));

/** the video url map */
const urls = new Map(
  [...seed.matchAll(/'((?:[^'\\]|\\.)*)':\s*'https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]{6,20})'/g)].map((m) => [
    m[1].replace(/\\'/g, "'"),
    m[2],
  ]),
);

const videoLessons = lessons.filter((l) => l.type === 'VIDEO');
const withVideoChapter = new Set(videoLessons.map((l) => `${l.grade}|${l.ch}`));

console.log('  curriculum chapters          :', chapters.length);
console.log('  video lessons                :', videoLessons.length);
console.log('  notes lessons                :', lessons.filter((l) => l.type === 'NOTES').length);
console.log('  seeded video URLs            :', urls.size);

const missingUrl = videoLessons.filter((l) => !urls.has(l.title));
console.log('  VIDEO lessons without a URL  :', missingUrl.length);
for (const l of missingUrl.slice(0, 10)) console.log('    missing:', l.title);

const orphanUrls = [...urls.keys()].filter((t) => !videoLessons.some((l) => l.title === t));
console.log('  URLs without a VIDEO lesson  :', orphanUrls.length);
for (const t of orphanUrls.slice(0, 10)) console.log('    orphan:', t);

// a chapter counts as covered when one of its lessons names it
let covered = 0;
const uncovered = [];
for (const c of chapters) {
  // MAT-8P2-3 is class 8 (volume 2 of the maths book), not "8P2"
  const grade = c.code.split('-')[1].replace(/P\d+$/, '');
  const key = `${grade}|${c.name}`;
  if (withVideoChapter.has(key)) covered++;
  else uncovered.push(`${c.code} ${c.name}`);
}
console.log(`  chapters with a video        : ${covered} / ${chapters.length}`);
for (const u of uncovered.slice(0, 10)) console.log('    no video:', u);

// lessons whose chapter is not in the curriculum at all
// MAT-8P2-3 is class 8 (volume 2 of the maths book), not "8P2"
const classOf = (code) => code.split('-')[1].replace(/P\d+$/, '');
const known = new Set(chapters.map((c) => `${classOf(c.code)}|${c.name}`));
const orphans = [...new Set(videoLessons.map((l) => `${l.grade}|${l.ch}`))].filter((k) => !known.has(k));
console.log('  lessons pointing at an unknown chapter:', orphans.length);
for (const o of orphans.slice(0, 10)) console.log('    unknown chapter:', o);
