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
  const lines = fs.readFileSync(SEED, 'utf8').split('\n');
  const urlRe = /'((?:[^'\\]|\\.)*)':\s*'https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]{6,20})'/g;
  const seedEntries = [];
  let m;
  const seed = lines.join('\n');
  while ((m = urlRe.exec(seed)) !== null) seedEntries.push({ title: m[1].replace(/\\'/g, "'"), videoId: m[2] });

  const segmentsFor = seedEntries
    .map((entry) => ({ title: entry.title, chapters: byVideoId.get(entry.videoId) }))
    .filter((entry) => entry.chapters);

  const blockLines = [
    'const videoSegments: Record<string, Array<{ title: string; startSeconds: number }>> = {',
    ...segmentsFor.map((entry) => {
      const key = entry.title.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const items = entry.chapters
        .map((c) => `{ title: '${c.title.replace(/'/g, "\\'")}', startSeconds: ${c.startSeconds} }`)
        .join(', ');
      return `  '${key}': [${items}],`;
    }),
    '};',
  ];

  // The map is rebuilt wholesale so a re-run never leaves the seed behind the DB
  // (the DB carries the markers of every video that has them).
  const decl = lines.findIndex((line) => /^\s*const videoSegments\b/.test(line));
  if (decl < 0) {
    const anchor = lines.findIndex((line) => /^\s*const videoUrls\b/.test(line));
    const close = lines.findIndex((line, i) => i > anchor && /^\s*\};?\s*$/.test(line));
    lines.splice(
      close + 1,
      0,
      '',
      '// Chapter markers of the lesson videos (a long lesson split by time).',
      ...blockLines,
    );
    fs.writeFileSync(SEED, lines.join('\n'));
    console.log(`seed: wrote ${segmentsFor.length} chapter-marker entries`);
  } else {
    const close = lines.findIndex((line, i) => i > decl && /^\s*\};?\s*$/.test(line));
    lines.splice(decl, close - decl + 1, ...blockLines);
    fs.writeFileSync(SEED, lines.join('\n'));
    console.log(`seed: rebuilt ${segmentsFor.length} chapter-marker entries`);
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
