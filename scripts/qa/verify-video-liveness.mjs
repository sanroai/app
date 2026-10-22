// Verifies that every VIDEO lesson in a database resolves to a live, embeddable video
// with a working thumbnail (the user-visible symptom of the old dead embeds).
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const db = process.argv[2] ?? 'sanro_dev';
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const prisma = new PrismaClient();
try {
  const videos = await prisma.contentItem.findMany({ where: { type: 'VIDEO' }, select: { title: true, url: true } });
  const ids = [...new Set(videos.map((v) => (v.url || '').match(/embed\/([A-Za-z0-9_-]+)/)?.[1]).filter(Boolean))];
  let alive = 0;
  let thumb = 0;
  const dead = [];
  for (const id of ids) {
    const oembed = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`).catch(() => null);
    if (oembed && oembed.ok) alive++;
    else dead.push(id);
    const t = await fetch(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, { method: 'GET' }).catch(() => null);
    if (t && t.ok) thumb++;
  }
  console.log(`${db}: ${videos.length} VIDEO rows | ${ids.length} distinct ids | alive ${alive} | thumbnail ${thumb}`);
  if (dead.length) console.log(`  dead ids: ${dead.join(', ')}`);
} finally {
  await prisma.$disconnect();
}
