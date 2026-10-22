// Extract the real chapter markers of every lesson video.
//
// YouTube videos carry chapter data two ways:
//   1. the creator's own chapter list (`macroMarkersListRenderer` in the player payload)
//   2. timestamps written in the description ("0:00 Introduction", "42:38 Total Surface Area")
// Both are read from the watch page, because oEmbed reports neither.
//
//   node scripts/qa/source-video-chapters.mjs [--out artifacts/qa/<date>/video-chapters.json]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const OUT = arg('--out', join('artifacts', 'qa', new Date().toISOString().slice(0, 10), 'video-chapters.json'));

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const seed = await readFile('apps/api/prisma/seed.ts', 'utf8');
const entries = [];
const re = /'((?:[^'\\]|\\.)*)':\s*'https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]{6,20})'/g;
let m;
while ((m = re.exec(seed)) !== null) {
  entries.push({ lesson: m[1].replace(/\\'/g, "'"), videoId: m[2] });
}
console.log(`seeded videos: ${entries.length}`);

function toSeconds(text) {
  if (!text) return null;
  const parts = String(text).trim().split(':').map((p) => Number(p));
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

function fromCreatorChapters(html) {
  const out = [];
  const blockRe = /"macroMarkersListItemRenderer":\{(.*?)\}\s*,\s*"/g;
  let match;
  while ((match = blockRe.exec(html)) !== null) {
    const body = match[1];
    const title = body.match(/"simpleText":"((?:[^"\\]|\\.)*)"/)?.[1];
    const start = body.match(/"startTimeMs":"?(\d+)"?/)?.[1];
    if (!title || !start) continue;
    out.push({ title: title.replace(/\\u0026/g, '&').replace(/\\"/g, '"'), startSeconds: Math.round(Number(start) / 1000) });
  }
  return out;
}

function fromDescription(html) {
  const desc = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/)?.[1];
  if (!desc) return [];
  const text = desc
    .replace(/\\n/g, '\n')
    .replace(/\\u0026/g, '&')
    .replace(/\\\//g, '/')
    .replace(/\\"/g, '"');
  const out = [];
  const stampRe = /(?:^|\n|\s)(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—:|]?\s*([^\n]{2,70})/g;
  let match;
  while ((match = stampRe.exec(text)) !== null) {
    const seconds = toSeconds(match[1]);
    if (seconds === null) continue;
    const title = match[2].replace(/[^\w\s&'(),.\-/:]/g, '').trim();
    if (!title || title.length < 3) continue;
    out.push({ title, startSeconds: seconds });
  }
  // keep the list monotonic and drop near-duplicates
  const cleaned = [];
  for (const item of out.sort((a, b) => a.startSeconds - b.startSeconds)) {
    if (cleaned.length && Math.abs(cleaned[cleaned.length - 1].startSeconds - item.startSeconds) < 5) continue;
    cleaned.push(item);
  }
  return cleaned;
}

const results = {};
let withChapters = 0;
for (const [index, entry] of entries.entries()) {
  let chapters = [];
  let source = 'none';
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${entry.videoId}`, {
      headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' },
    });
    const html = await res.text();
    chapters = fromCreatorChapters(html);
    if (chapters.length >= 2) source = 'creator';
    else {
      const desc = fromDescription(html);
      if (desc.length >= 2) {
        chapters = desc;
        source = 'description';
      }
    }
  } catch (e) {
    console.log(`  ${entry.videoId}: ${e.message}`);
  }
  if (chapters.length >= 2) withChapters++;
  results[entry.lesson] = { videoId: entry.videoId, source, chapters: chapters.slice(0, 20) };
  console.log(
    `  ${String(index + 1).padStart(2)}/${entries.length} ${entry.videoId} ${String(chapters.length).padStart(2)} chapters (${source})  ${entry.lesson.slice(0, 40)}`,
  );
}

await mkdir(join(OUT, '..'), { recursive: true });
await writeFile(
  OUT,
  JSON.stringify({ extractedAt: new Date().toISOString(), withChapters, total: entries.length, results }, null, 2),
  'utf8',
);
console.log(`\n  ${withChapters}/${entries.length} videos have chapter markers -> ${OUT}`);
