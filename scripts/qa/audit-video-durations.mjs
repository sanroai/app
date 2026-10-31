// Audit the real duration of every sourced lesson video.
//
// A ten-second clip teaches nothing, so short videos must not sit in the library.
// YouTube's oEmbed does not report a length, but the watch page does
// (`lengthSeconds` inside the player payload), so that is what we read.
//
//   node scripts/qa/audit-video-durations.mjs [--min 120] [--out artifacts/qa/<date>/video-durations.json]
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const MIN_SECONDS = Number(arg('--min', '120'));
const OUT = arg('--out', join('artifacts', 'qa', new Date().toISOString().slice(0, 10), 'video-durations.json'));

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const seed = await readFile('apps/api/prisma/seed.ts', 'utf8');
const entries = [];
const re = /'((?:[^'\\]|\\.)*)':\s*'https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]{6,20})'/g;
let m;
while ((m = re.exec(seed)) !== null) {
  entries.push({ lesson: m[1].replace(/\\'/g, "'"), videoId: m[2] });
}

// Primary English (classes 1-4) lives in its own module: video ids and durations
// are keyed by chapter code there, so they are collected separately.
try {
  const primary = await readFile('apps/api/prisma/primary-english.ts', 'utf8');
  const idRe = /'(ENG-[1-4]-[1-5])':\s*'([A-Za-z0-9_-]{6,20})'/g;
  let p;
  while ((p = idRe.exec(primary)) !== null) {
    entries.push({ lesson: `${p[1]} - Video Lesson`, videoId: p[2] });
  }
} catch {
  // module not present - nothing to add
}

console.log(`seeded videos found: ${entries.length}`);

async function durationOf(videoId) {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' },
  });
  const html = await res.text();
  const seconds =
    html.match(/"lengthSeconds":"(\d+)"/)?.[1] ??
    html.match(/"approxDurationMs":"(\d+)"/)?.[1] ??
    null;
  if (!seconds) return null;
  const value = Number(seconds);
  // approxDurationMs is milliseconds
  return value > 100000 ? Math.round(value / 1000) : value;
}

const results = [];
for (const [index, entry] of entries.entries()) {
  let seconds = null;
  try {
    seconds = await durationOf(entry.videoId);
  } catch (e) {
    seconds = null;
  }
  results.push({ ...entry, seconds });
  const flag = seconds === null ? 'UNKNOWN' : seconds < MIN_SECONDS ? 'TOO SHORT' : 'ok';
  console.log(
    `  ${String(index + 1).padStart(2)}/${entries.length} ${entry.videoId} ${seconds === null ? '  ???? ' : String(seconds).padStart(5) + 's'} ${flag.padEnd(9)} ${entry.lesson.slice(0, 46)}`,
  );
}

const short = results.filter((r) => r.seconds !== null && r.seconds < MIN_SECONDS);
const unknown = results.filter((r) => r.seconds === null);
const durations = results.filter((r) => r.seconds !== null).map((r) => r.seconds).sort((a, b) => a - b);
const median = durations.length ? durations[Math.floor(durations.length / 2)] : 0;

console.log(`\n  min ${MIN_SECONDS}s | median ${median}s | shortest ${durations[0] ?? '-'}s | longest ${durations[durations.length - 1] ?? '-'}s`);
console.log(`  TOO SHORT: ${short.length} | UNKNOWN: ${unknown.length} | ok: ${results.length - short.length - unknown.length}`);
for (const r of short) console.log(`    short: ${r.videoId} ${r.seconds}s  ${r.lesson}`);
for (const r of unknown) console.log(`    unknown: ${r.videoId}  ${r.lesson}`);

await mkdir(join(OUT, '..'), { recursive: true });
await writeFile(
  OUT,
  JSON.stringify({ minSeconds: MIN_SECONDS, checkedAt: new Date().toISOString(), results }, null, 2),
  'utf8',
);
console.log(`\nwritten -> ${OUT}`);
