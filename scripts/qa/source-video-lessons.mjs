// Source a real, embeddable, curriculum-aligned YouTube video for every VIDEO lesson
// in the seed (the current map points 64 lessons at 24 fabricated IDs).
//
// Pipeline per lesson: YouTube search -> candidate ids -> oEmbed (exists + embeddable)
// -> thumbnail 200 -> relevance scoring. Results are written to
// artifacts/qa/<date>/video-sources.json and nothing is applied by this script.
import fs from 'node:fs';

const SEED = 'apps/api/prisma/seed.ts';
const OUT = `artifacts/qa/${new Date().toISOString().slice(0, 10)}/video-sources.json`;

const src = fs.readFileSync(SEED, 'utf8');

const lessonRe = /\{\s*ch:\s*'((?:[^'\\]|\\.)*)',\s*subjectName:\s*([A-Z_]+),\s*grade:\s*'(\d+)',\s*concept:\s*'((?:[^'\\]|\\')*)',\s*type:\s*'([A-Z_]+)',\s*title:\s*'((?:[^'\\]|\\')*)',\s*duration:\s*(\d+)\s*\}/g;
const lessons = [];
let m;
while ((m = lessonRe.exec(src))) {
  lessons.push({ ch: m[1], subject: m[2], grade: m[3], concept: m[4].replace(/\\'/g, "'"), type: m[5], title: m[6].replace(/\\'/g, "'") });
}
const videoLessons = lessons.filter((l) => l.type === 'VIDEO');

// re-source only the listed lessons (comma separated) or only the short ones
const onlyArg = (() => {
  const i = process.argv.indexOf('--only');
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : '';
})();
// a file with one title per line: chapter titles contain commas, so a comma
// separated list cannot round-trip them
const onlyFile = (() => {
  const i = process.argv.indexOf('--only-file');
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : '';
})();
let onlyTitles = onlyArg ? new Set(onlyArg.split(',').map((t) => t.trim())) : null;
if (onlyFile) {
  onlyTitles = new Set(
    fs
      .readFileSync(onlyFile, 'utf8')
      .split(/\r?\n/)
      .map((t) => t.trim())
      .filter(Boolean),
  );
}
const shortOnly = process.argv.includes('--only-short');

const TRUSTED = [
  'magnet brains', 'physics wallah', 'pw ', 'vedantu', 'khan academy', 'learncbse', 'vedantu', 'don\'t memorize',
  'science is fun', 'education', 'academy', 'lear', 'class 10', 'cbse', 'ncert', 'study', 'tuition', 'khan',
  'sarthaks', 'learn with', 'home school', 'manoj', 'manas', 'adhyayan', 'homeschool', 'doubtnut', 'toppr',
  'byju', 'cuemath', 'shaalaa', 'oxford', 'adda247', 'askfilo', 'meritnation', 'national academy',
];

const STOP = new Set(['class', 'and', 'the', 'for', 'with', 'from', 'that', 'this', 'using', 'into', 'your', 'are', 'was', 'you', 'our', 'not', 'all', 'how', 'what', 'why', 'when', 'does', 'more', 'than', 'can', 'will', 'has', 'have', 'its', 'their', 'about', 'part', 'chapter', 'lessons', 'lesson', 'video', 'explained', 'visual', 'guide', 'step', 'by', 'step', 'properties', 'operations', 'system', 'numbers', 'number', 'data', 'groups', 'grouped', 'terms', 'value', 'values', 'formula', 'formulas']);

const tokens = (s) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const r = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
    },
  });
  const html = await r.text();
  const set = new Set();
  for (const mm of html.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)) {
    set.add(mm[1]);
    if (set.size > 12) break;
  }
  return [...set];
}

// A ten-second clip teaches nothing: a lesson video has to carry real content.
// YouTube's oEmbed has no length, so the watch page is read for `lengthSeconds`.
const MIN_SECONDS = 120;

async function durationOf(id) {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'accept-language': 'en-US,en;q=0.9',
      },
    });
    const html = await res.text();
    const seconds =
      html.match(/"lengthSeconds":"(\d+)"/)?.[1] ?? html.match(/"approxDurationMs":"(\d+)"/)?.[1] ?? null;
    if (!seconds) return null;
    const value = Number(seconds);
    return value > 100000 ? Math.round(value / 1000) : value;
  } catch {
    return null;
  }
}

async function verify(id) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
    if (!r.ok) return null;
    const j = await r.json();
    const th = await fetch(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, { method: 'GET' });
    if (!th.ok) return null;
    return { id, title: j.title, channel: j.author_name };
  } catch {
    return null;
  }
}

function score(lesson, cand) {
  const t = cand.title.toLowerCase();
  const ch = cand.channel.toLowerCase();
  const concept = tokens(lesson.concept);
  const chapter = tokens(lesson.ch);
  let s = 0;
  for (const tk of concept) if (t.includes(tk)) s += 2;
  for (const tk of chapter) if (t.includes(tk)) s += 1;
  if (new RegExp(`class\\s*0?${lesson.grade}\\b`).test(t)) s += 2;
  if (new RegExp(`class\\s*0?${lesson.grade}\\b`).test(ch)) s += 1;
  if (TRUSTED.some((x) => ch.includes(x))) s += 1;
  if (/short|song|ringtone|prank|meme|status|funny|comedy|interview|news/i.test(t)) s -= 6;
  if (/full chapter|one shot|complete chapter|all chapters/i.test(t)) s -= 1;
  if (/class\s*0?(?!${lesson.grade}\b)\d{1,2}\b/.test(t)) s -= 2;
  return s;
}

const results = {};
const unresolved = [];

let shortTitles = null;
if (shortOnly) {
  const durationsPath = `artifacts/qa/${new Date().toISOString().slice(0, 10)}/video-durations.json`;
  if (!fs.existsSync(durationsPath)) {
    console.log('--only-short needs artifacts/qa/<date>/video-durations.json (run audit-video-durations.mjs first)');
    process.exit(1);
  }
  const durations = JSON.parse(fs.readFileSync(durationsPath, 'utf8'));
  shortTitles = new Set(
    durations.results.filter((r) => r.seconds !== null && r.seconds < (durations.minSeconds ?? 120)).map((r) => r.lesson),
  );
}

const targets = videoLessons.filter(
  (l) => (!onlyTitles || onlyTitles.has(l.title)) && (!shortTitles || shortTitles.has(l.title)),
);
console.log(`re-sourcing ${targets.length} of ${videoLessons.length} video lessons`);

for (const lesson of targets) {
  const subjectWord = lesson.subject === 'MATHS' ? 'maths mathematics' : 'science';
  const queries = [
    `${lesson.ch} ${lesson.concept} class ${lesson.grade} cbse ${subjectWord}`,
    `${lesson.title} class ${lesson.grade} cbse ${subjectWord}`,
  ];
  const candidates = [];
  for (const q of queries) {
    let ids = [];
    try {
      ids = await search(q);
    } catch {
      ids = [];
    }
    for (const id of ids) {
      const cand = await verify(id);
      if (!cand) continue;
      const sc = score(lesson, cand);
      candidates.push({ ...cand, score: sc });
      if (candidates.length >= 14) break;
    }
    if (candidates.some((c) => c.score >= 6)) break;
    await sleep(600);
  }
  candidates.sort((a, b) => b.score - a.score);

  // walk down the ranking until a candidate is long enough to teach something
  let best = null;
  for (const cand of candidates) {
    if (cand.score <= 0) break;
    const seconds = await durationOf(cand.id);
    if (seconds !== null && seconds < MIN_SECONDS) {
      console.log(`     skip ${cand.id} (${seconds}s - too short)  ${cand.title.slice(0, 44)}`);
      continue;
    }
    best = { ...cand, seconds };
    break;
  }
  if (best && best.score > 0) {
    results[lesson.title] = best;
    console.log(`OK   ${String(best.score).padStart(2)}  ${lesson.title.slice(0, 44).padEnd(44)} -> ${best.id} ${String(best.seconds ?? '?').padStart(5)}s  ${best.title.slice(0, 40)}`);
  } else {
    unresolved.push({ lesson, best });
    console.log(`MISS ${String(best?.score ?? '-').padStart(2)}  ${lesson.title}`);
  }
  await sleep(700);
}

fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ results, unresolved }, null, 2));
console.log(`\nresolved ${Object.keys(results).length}/${targets.length} -> ${OUT}`);
