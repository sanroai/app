// Apply the real chapter markers of the lesson videos.
//
// A 40-minute one-shot is not navigable, so every video gets its own chapter markers
// ("split by time"). The markers are read from YouTube (the creator's chapter list, or
// the timestamps in the description) and stored on the content item.
//
//   node scripts/qa/apply-video-chapters.mjs [artifacts/qa/<date>/video-chapters.json]
//   node scripts/qa/apply-video-chapters.mjs --seed-only    # rewrite the seed map
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const date = new Date().toISOString().slice(0, 10);
const args = process.argv.slice(2);
const seedOnly = args.includes('--seed-only');
const dbOnly = args.includes('--db-only');
const fileArg = args.find((a) => !a.startsWith('--'));
const chaptersPath = fileArg ?? `artifacts/qa/${date}/video-chapters.json`;

if (!fs.existsSync(chaptersPath)) {
  console.error(`missing ${chaptersPath} - run scripts/qa/source-video-chapters.mjs first`);
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(chaptersPath, 'utf8'));
const byVideoId = new Map();
let markerCount = 0;
for (const entry of Object.values(payload.results ?? {})) {
  const chapters = (entry.chapters ?? []).filter(
    (c) => c && typeof c.title === 'string' && c.title.trim() && Number.isFinite(c.startSeconds),
  );
  if (chapters.length < 2) continue;
  byVideoId.set(entry.videoId, chapters.slice(0, 24));
  markerCount++;
}
console.log(`chapter markers for ${markerCount} videos (from ${chaptersPath})`);

/* ---------- 1. the seed: a videoSegments map next to videoUrls ---------- */
if (!dbOnly) {
  const SEED = 'apps/api/prisma/seed.ts';
  const seed = fs.readFileSync(SEED, 'utf8');
  const urlRe = /'((?:[^'\\]|\\.)*)':\s*'https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]{6,20})'/g;
  const seedEntries = [];
  let m;
  while ((m = urlRe.exec(seed)) !== null) seedEntries.push({ title: m[1].replace(/\\'/g, "'"), videoId: m[2] });

  const segmentsFor = seedEntries
    .map((entry) => ({ title: entry.title, chapters: byVideoId.get(entry.videoId) }))
    .filter((entry) => entry.chapters);

  const block = [
    '',
    '// Chapter markers of the lesson videos (a long lesson split by time).',
    'const videoSegments: Record<string, Array<{ title: string; startSeconds: number }>> = {',
    ...segmentsFor.map((entry) => {
      const key = entry.title.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const items = entry.chapters
        .map((c) => `{ title: '${c.title.replace(/'/g, "\\'")}', startSeconds: ${c.startSeconds} }`)
        .join(', ');
      return `  '${key}': [${items}],`;
    }),
    '};',
    '',
  ].join('\n');

  if (!seed.includes('const videoSegments')) {
    const anchor = seed.indexOf('const videoUrls');
    const end = seed.indexOf('};', anchor);
    const insertAt = end + 3;
    fs.writeFileSync(SEED, seed.slice(0, insertAt) + block + seed.slice(insertAt));
    console.log(`seed: wrote ${segmentsFor.length} chapter-marker entries`);
  } else {
    console.log('seed: videoSegments map already present - left untouched');
  }
}

/* ---------- 2. the database ---------- */
if (!seedOnly) {
  const prisma = new PrismaClient();
  try {
    const videos = await prisma.contentItem.findMany({
      where: { type: 'VIDEO' },
      select: { id: true, title: true, url: true },
    });
    let updated = 0;
    let withMarkers = 0;
    for (const video of videos) {
      const id = video.url?.match(/embed\/([A-Za-z0-9_-]{6,20})/)?.[1];
      const chapters = id ? byVideoId.get(id) : undefined;
      if (!chapters) continue;
      withMarkers++;
      await prisma.contentItem.update({ where: { id: video.id }, data: { segments: chapters } });
      updated++;
    }
    console.log(`db: ${updated} of ${videos.length} VIDEO rows carry chapter markers (${withMarkers} distinct videos)`);
  } finally {
    await prisma.$disconnect();
  }
}
