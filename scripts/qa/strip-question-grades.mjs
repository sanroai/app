// Keep only the listed grades in the question fragments.
//
//   node scripts/qa/strip-question-grades.mjs --dir artifacts/qa/<date> --keep 1,2,3,4
//
// The classes 5-7 curricula are being replaced by the real NCERT books, so the
// questions authored against the old placeholder chapters cannot survive the
// realignment; grades 1-4 keep their generic (book-less) chapters and stay.
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};

const dir = arg('--dir', path.join('artifacts', 'qa', new Date().toISOString().slice(0, 10)));
const keep = new Set(arg('--keep', '1,2,3,4').split(',').map((g) => g.trim()).filter(Boolean));

const files = fs.readdirSync(dir).filter((f) => /^questions-.*\.json$/.test(f));
let removed = 0;
let kept = 0;
for (const name of files) {
  const full = path.join(dir, name);
  const data = JSON.parse(fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, ''));
  const before = (data.questions ?? []).length;
  const questions = (data.questions ?? []).filter((q) => keep.has(String(q.grade)));
  const dropped = before - questions.length;
  if (dropped === 0) continue;
  fs.writeFileSync(full, JSON.stringify({ ...data, questions }, null, 2), 'utf8');
  console.log(`  ${name}: kept ${questions.length}, dropped ${dropped}`);
  removed += dropped;
  kept += questions.length;
}
console.log(`  dropped ${removed} question(s); ${kept} kept in the fragments that changed`);
