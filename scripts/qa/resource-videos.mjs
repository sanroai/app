// Re-sources specific lessons with curriculum-informed queries and only swaps the video
// when the candidate is demonstrably better (concept terms + textbook-chapter terms).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DAY = new Date().toISOString().slice(0, 10);

// lesson title -> tailored search query
const TARGETS = {
  'Negative and Zero Indices Explained': 'negative indices and zero indices class 8 cbse maths',
  'Equations for Perimeter and Area': 'perimeter and area word problems using equations class 8 cbse maths',
  'Atomic Models Explained': 'atomic models thomson rutherford bohr class 9 cbse science structure of atom',
  'Surface Areas and Volumes': 'surface areas and volumes cylinder cone sphere class 10 cbse maths',
};

const seed = fs.readFileSync(path.join(ROOT, 'apps/api/prisma/seed.ts'), 'utf8');
const lessonRe = /\{\s*ch:\s*'([^']+)',\s*subjectName:\s*([A-Z_]+),\s*grade:\s*'(\d+)',\s*concept:\s*'((?:[^'\\]|\\')*)',\s*type:\s*'([A-Z_]+)',\s*title:\s*'((?:[^'\\]|\\')*)'/g;
const lessons = new Map();
let m;
while ((m = lessonRe.exec(seed))) {
  lessons.set(m[6].replace(/\\'/g, "'"), { ch: m[1], subject: m[2], grade: m[3], concept: m[4].replace(/\\'/g, "'") });
}

const STOP = new Set(['class', 'chapter', 'and', 'the', 'for', 'with', 'from', 'that', 'this', 'using', 'into', 'your', 'are', 'was', 'you', 'our', 'not', 'all', 'how', 'what', 'why', 'when', 'does', 'more', 'than', 'can', 'will', 'has', 'have', 'its', 'their', 'about', 'part', 'lecture', 'practice', 'revision', 'video', 'shot', 'complete', 'chapter', 'quick', 'one', 'full', 'maths', 'science', 'cbse', 'board', 'boards', 'ncert']);
const tokens = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(query) {
  const r = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
    headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'accept-language': 'en-US,en;q=0.9' },
  });
  const html = await r.text();
  const set = new Set();
  for (const mm of html.matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)) { set.add(mm[1]); if (set.size > 14) break; }
  return [...set];
}

async function verify(id) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
    if (!r.ok) return null;
    const j = await r.json();
    const t = await fetch(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, { method: 'GET' });
    if (!t.ok) return null;
    return { id, title: j.title, channel: j.author_name };
  } catch { return null; }
}

function score(lesson, cand) {
  const hay = `${cand.title} ${cand.channel}`.toLowerCase();
  const want = tokens(`${lesson.concept} ${lesson.ch}`);
  const hits = want.filter((t) => hay.includes(t));
  let s = hits.length;
  if (/maharashtra|state board|gujarat|rajasthan|bihar|andhra|telangana|tn |kerala|punjab|haryana|odisha|assam|mp |cg |chhattisgarh|uttarakhand|himachal|j&k/i.test(hay)) s -= 4;
  if (/class\s*(\d+)/.test(hay)) {
    const g = Number(RegExp.$1);
    if (g !== Number(lesson.grade)) s -= 3;
  }
  if (/\b(class\s*9|class\s*8)\b/.test(hay) && lesson.grade === '10') s -= 2;
  if (/short|song|ringtone|prank|meme|status|funny|comedy/i.test(hay)) s -= 6;
  return { score: s, hits };
}

const sourcesPath = path.join(ROOT, `artifacts/qa/${DAY}/video-sources.json`);
const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8')).results;
const out = { replaced: [], kept: [] };

for (const [title, query] of Object.entries(TARGETS)) {
  const lesson = lessons.get(title);
  if (!lesson) { console.log(`  (lesson not found: ${title})`); continue; }
  const current = sources[title];
  const currentScore = current ? score(lesson, current) : { score: -99, hits: [] };

  let best = null;
  for (const id of await search(query)) {
    const cand = await verify(id);
    if (!cand) continue;
    const sc = score(lesson, cand);
    if (!best || sc.score > best.score) best = { ...cand, ...sc };
    if (best.score >= 5) break;
    await sleep(200);
  }

  if (best && best.score > currentScore.score) {
    sources[title] = { id: best.id, title: best.title, channel: best.channel };
    out.replaced.push({ title, from: current?.id, to: best.id, score: best.score, videoTitle: best.title, channel: best.channel, hits: best.hits });
    console.log(`REPLACED ${title}\n    old: ${currentScore.score} ${current?.title}\n    new: ${best.score} ${best.title} (${best.channel})`);
  } else {
    out.kept.push({ title, score: currentScore.score, videoTitle: current?.title });
    console.log(`KEPT     ${title} (score ${currentScore.score}) - no better candidate found`);
  }
  await sleep(500);
}

fs.writeFileSync(sourcesPath, JSON.stringify({ results: sources, unresolved: [] }, null, 2));
console.log(`\nreplaced ${out.replaced.length}, kept ${out.kept.length} -> ${sourcesPath}`);
