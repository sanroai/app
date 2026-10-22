// Writes the REAL duration of every lesson video into the seed and the database.
//
// The seed carried invented durations (every video looked like 5-8 minutes), which
// showed up in the UI as a wrong length on the lesson card. The audit reads the real
// length from YouTube, this applies it.
//
//   node scripts/qa/apply-video-durations.mjs [artifacts/qa/<date>/video-durations.json]
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const date = new Date().toISOString().slice(0, 10);
const durationsPath = process.argv[2] ?? `artifacts/qa/${date}/video-durations.json`;
if (!fs.existsSync(durationsPath)) {
  console.error(`missing ${durationsPath} - run scripts/qa/audit-video-durations.mjs first`);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(durationsPath, 'utf8'));
const byTitle = new Map();
for (const r of payload.results) {
  if (r.seconds !== null && r.seconds > 0) byTitle.set(r.lesson, r.seconds);
}
console.log(`durations known for ${byTitle.size} lessons`);

// 1. seed: replace `duration: N` on the VIDEO lesson line that carries the title
const SEED = 'apps/api/prisma/seed.ts';
const seed = fs.readFileSync(SEED, 'utf8');
let patched = 0;
const newSeed = seed
  .split('\n')
  .map((line) => {
    if (!line.includes("type: 'VIDEO'")) return line;
    const titleMatch = line.match(/title: '((?:[^'\\]|\\.)*)'/);
    if (!titleMatch) return line;
    const title = titleMatch[1].replace(/\\'/g, "'");
    const seconds = byTitle.get(title);
    if (!seconds) return line;
    if (!/duration: \d+/.test(line)) return line;
    patched++;
    return line.replace(/duration: \d+/, `duration: ${seconds}`);
  })
  .join('\n');
fs.writeFileSync(SEED, newSeed);
console.log(`seed: wrote ${patched} real durations`);

// 2. database
const prisma = new PrismaClient();
try {
  const videos = await prisma.contentItem.findMany({
    where: { type: 'VIDEO' },
    select: { id: true, title: true, durationSeconds: true },
  });
  let updated = 0;
  for (const v of videos) {
    const seconds = byTitle.get(v.title);
    if (!seconds || v.durationSeconds === seconds) continue;
    await prisma.contentItem.update({ where: { id: v.id }, data: { durationSeconds: seconds } });
    updated++;
  }
  console.log(`db: updated ${updated} of ${videos.length} VIDEO rows`);
} finally {
  await prisma.$disconnect();
}
