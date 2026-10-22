// Applies the sourced YouTube videos:
//  1. rewrites the seed's videoUrls map to the verified video ids
//  2. updates the ContentItem rows of the target database (matched by lesson title)
//  3. verifies every VIDEO lesson resolves to a live, embeddable video with a thumbnail
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const sourcesPath = process.argv[2] ?? `artifacts/qa/${new Date().toISOString().slice(0, 10)}/video-sources.json`;
const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8')).results;
const SEED = 'apps/api/prisma/seed.ts';

// 1. seed rewrite
const seed = fs.readFileSync(SEED, 'utf8');
let rewritten = 0;
const missing = [];
const newSeed = seed.split('\n').map((line) => {
  const m = line.match(/^(\s*)'(.*)':\s*'https:\/\/www\.youtube\.com\/embed\/[A-Za-z0-9_-]+'(,?)\s*$/);
  if (!m) return line;
  const title = m[2].replace(/\\'/g, "'");
  const hit = sources[title];
  if (!hit) { missing.push(title); return line; }
  rewritten++;
  return `${m[1]}'${m[2]}': 'https://www.youtube.com/embed/${hit.id}'${m[3]}`;
}).join('\n');
fs.writeFileSync(SEED, newSeed);
console.log(`seed: rewrote ${rewritten} video URLs` + (missing.length ? ` | no source for: ${missing.join(', ')}` : ''));

// 2. database update (matched by title, because several lessons shared one old id)
const prisma = new PrismaClient();
try {
  const videos = await prisma.contentItem.findMany({ where: { type: 'VIDEO' }, select: { id: true, title: true, url: true } });
  let updated = 0;
  for (const v of videos) {
    const hit = sources[v.title];
    if (!hit) continue;
    const next = `https://www.youtube.com/embed/${hit.id}`;
    if (v.url === next) continue;
    await prisma.contentItem.update({ where: { id: v.id }, data: { url: next } });
    updated++;
  }
  console.log(`db: updated ${updated} of ${videos.length} VIDEO rows`);
} finally {
  await prisma.$disconnect();
}

// 3. verification
const ids = new Set();
for (const line of newSeed.split('\n')) {
  const m = line.match(/^(\s*)'(.*)':\s*'https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]+)'/);
  if (m) ids.add(m[3]);
}
let alive = 0;
let thumb = 0;
for (const id of ids) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
    if (r.ok) alive++;
    const t = await fetch(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, { method: 'GET' });
    if (t.ok) thumb++;
  } catch { /* counted as not alive */ }
}
console.log(`verify: ${ids.size} distinct ids in the seed | video alive ${alive} | thumbnail ok ${thumb}`);
