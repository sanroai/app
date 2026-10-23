// Write the real YouTube length of every lesson video into the seed.
//
//   node scripts/qa/apply-video-durations.mjs [video-durations.json] [--dry]
//
// audit-video-durations.mjs measures the real length of every seeded video and writes it
// to artifacts/qa/<date>/video-durations.json. The content node's `duration` is what the
// library shows, so it must be that same number - never a guess.
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const file =
  argv.find((a) => !a.startsWith('--') && /\.json$/i.test(a)) ??
  path.join('artifacts', 'qa', new Date().toISOString().slice(0, 10), 'video-durations.json');
const SEED = 'apps/api/prisma/seed.ts';

if (!fs.existsSync(file)) {
  console.log(`  no durations file at ${file}`);
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const results = Array.isArray(data) ? data : data.results ?? [];

/** the same escaping the seed uses inside a single-quoted string */
const escapeTitle = (t) => t.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const byTitle = new Map();
for (const r of results) {
  if (typeof r.seconds === 'number' && r.seconds > 0) byTitle.set(r.lesson, r.seconds);
}

const lines = fs.readFileSync(SEED, 'utf8').split('\n');
let changed = 0;
const missing = [];
for (const [lesson, seconds] of byTitle) {
  const needle = `title: '${escapeTitle(lesson)}'`;
  const index = lines.findIndex((line) => line.includes(needle) && line.includes('duration:'));
  if (index < 0) {
    missing.push(lesson);
    continue;
  }
  const next = lines[index].replace(/duration: \d+/, `duration: ${seconds}`);
  if (next !== lines[index]) {
    lines[index] = next;
    changed += 1;
  }
}

console.log(`  durations read : ${byTitle.size}`);
console.log(`  seed lines set : ${changed}`);
if (missing.length) console.log(`  not in the seed: ${missing.length} (${missing.slice(0, 3).join(' | ')}${missing.length > 3 ? ' ...' : ''})`);
if (DRY) {
  console.log('  dry run - seed not written');
} else {
  fs.writeFileSync(SEED, lines.join('\n'));
  console.log('  seed written');
}
