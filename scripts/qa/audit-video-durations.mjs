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

/**
 * Read a video's length from the watch page.
 *
 * YouTube answers **429** to a burst of requests from one IP (and to most
 * datacenter IPs), in which case the payload has no `lengthSeconds` at all. That
 * is a rate limit, not a short video, so it is reported separately: a run that was
 * blocked proves nothing and must not fail the gate, while a run that got answers
 * and found a short clip must.
 */
async function durationOf(videoId) {
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9' },
  });
  const html = await res.text();
  const match = html.match(/"lengthSeconds":"(\d+)"/) ?? html.match(/"approxDurationMs":"(\d+)"/);
  if (!match) {
    const blocked = res.status === 429 || res.status === 403 || res.status >= 500;
    return { seconds: null, blocked };
  }
  const value = Number(match[1]);
  // approxDurationMs is milliseconds
  return { seconds: value > 100000 ? Math.round(value / 1000) : value, blocked: false };
}

const results = [];
for (const [index, entry] of entries.entries()) {
  let outcome = { seconds: null, blocked: false };
  try {
    outcome = await durationOf(entry.videoId);
  } catch {
    outcome = { seconds: null, blocked: true };
  }
  results.push({ ...entry, seconds: outcome.seconds, blocked: outcome.blocked });
  const flag =
    outcome.seconds === null ? (outcome.blocked ? 'BLOCKED' : 'UNKNOWN') : outcome.seconds < MIN_SECONDS ? 'TOO SHORT' : 'ok';
  console.log(
    `  ${String(index + 1).padStart(2)}/${entries.length} ${entry.videoId} ${outcome.seconds === null ? '  ???? ' : String(outcome.seconds).padStart(5) + 's'} ${flag.padEnd(9)} ${entry.lesson.slice(0, 46)}`,
  );
  // A blocked IP answers 429 for every id; stop hammering it.
  if (outcome.blocked) {
    const blockedSoFar = results.filter((r) => r.blocked).length;
    if (blockedSoFar >= 5 && blockedSoFar === results.length) {
      console.log('\n  YouTube is rate-limiting this IP (429). Stopping - re-run later for real durations.');
      break;
    }
  }
}

const short = results.filter((r) => r.seconds !== null && r.seconds < MIN_SECONDS);
const blocked = results.filter((r) => r.seconds === null && r.blocked);
const unknown = results.filter((r) => r.seconds === null);
const durations = results.filter((r) => r.seconds !== null).map((r) => r.seconds).sort((a, b) => a - b);
const median = durations.length ? durations[Math.floor(durations.length / 2)] : 0;

console.log(`\n  min ${MIN_SECONDS}s | median ${median}s | shortest ${durations[0] ?? '-'}s | longest ${durations[durations.length - 1] ?? '-'}s`);
console.log(`  TOO SHORT: ${short.length} | UNKNOWN: ${unknown.length} (blocked ${blocked.length}) | ok: ${durations.length}`);
for (const r of short) console.log(`    short: ${r.videoId} ${r.seconds}s  ${r.lesson}`);
for (const r of unknown.slice(0, 10)) console.log(`    unknown: ${r.videoId}  ${r.lesson}`);

await mkdir(join(OUT, '..'), { recursive: true });
await writeFile(
  OUT,
  JSON.stringify({ minSeconds: MIN_SECONDS, checkedAt: new Date().toISOString(), results }, null, 2),
  'utf8',
);
console.log(`\nwritten -> ${OUT}`);

if (short.length) {
  console.log(`\nFAIL: ${short.length} lesson video(s) are shorter than ${MIN_SECONDS}s.`);
  process.exit(1);
}
if (unknown.length && !blocked.length) {
  console.log(`\nFAIL: ${unknown.length} video(s) could not be read (unavailable or private).`);
  process.exit(1);
}
if (blocked.length) {
  console.log(`\nSKIPPED: YouTube rate-limited ${blocked.length} lookup(s); re-run later to confirm durations.`);
}
process.exit(0);
