// Writes the REAL duration of every seeded video into the seed's lesson lines.
//
// The seed's `duration:` numbers are what the UI shows on a lesson card, so they
// have to be the real lengths (the audit reads them from YouTube).
//
//   node scripts/qa/apply-video-durations-to-seed.mjs
import fs from 'node:fs';
import path from 'node:path';

const date = new Date().toISOString().slice(0, 10);
const file = process.argv[2] ?? path.join('artifacts', 'qa', date, 'video-durations.json');
if (!fs.existsSync(file)) {
  console.error(`missing ${file} - run scripts/qa/audit-video-durations.mjs first`);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
const byTitle = new Map();
for (const entry of Object.values(payload.results ?? {})) {
  if (entry.seconds && entry.seconds > 0) byTitle.set(entry.lesson, entry.seconds);
}

const SEED = 'apps/api/prisma/seed.ts';
const lines = fs.readFileSync(SEED, 'utf8').split('\n');
let updated = 0;
const out = lines.map((line) => {
  if (!line.includes("type: 'VIDEO'")) return line;
  const title = line.match(/title:\s*'((?:[^'\\]|\\.)*)'/)?.[1];
  if (!title) return line;
  const seconds = byTitle.get(title.replace(/\\'/g, "'"));
  if (!seconds) return line;
  if (new RegExp(`duration: ${seconds}[,}]`).test(line)) return line;
  updated++;
  return line.replace(/duration:\s*\d+/, `duration: ${seconds}`);
});

fs.writeFileSync(SEED, out.join('\n'));
console.log(`  seed: ${updated} video durations updated from ${path.basename(file)}`);
