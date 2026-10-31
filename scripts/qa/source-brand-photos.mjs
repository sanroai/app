#!/usr/bin/env node
/**
 * Sources the real photographs behind the brand artwork.
 *
 * Why Openverse
 * -------------
 * The app needs real photography, and every generator that would have produced it
 * is unusable here: the Gemini image models are quota-blocked on this key and the
 * keyless text-to-image fallback produced watermarked frames. Openverse (keyless,
 * CC-licensed, aggregates Flickr / Wikimedia / museums) returns genuinely
 * photographable, licensable files, so the pipeline is reproducible offline:
 * download once, keep the raw frame in the repo, compose from it forever.
 *
 * The chosen frames are deliberately *objects and places* (glassware, notebooks,
 * books, a library) - no identifiable children. A school product should not ship
 * photographs of minors, and object photography also survives a 3:1 banner crop.
 *
 * Output
 * ------
 *   apps/web/public/art/photos/<slot>.jpg   2400px raw frame (compose input)
 *   apps/web/public/art/photos/credits.json attribution + licence per slot
 *
 * Then run `node scripts/qa/build-brand-art.mjs` to compose the shipped banners.
 *
 *   node scripts/qa/source-brand-photos.mjs          # download + credit
 *   node scripts/qa/source-brand-photos.mjs --check  # fail if a frame is missing
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const OUT = path.join(ROOT, 'apps', 'web', 'public', 'art', 'photos');

/**
 * Each slot records the Openverse query that surfaced the frame plus the exact
 * title, so a re-run re-finds the same file instead of drifting to a different
 * photo when search ranking changes.
 */
const SLOTS = [
  {
    slot: 'science',
    query: 'chemistry laboratory glassware',
    title: 'Laboratory equipment of modern chemistry classroom',
    note: 'Colourful bench glassware - the science banner reads as a lab at a glance.',
  },
  {
    slot: 'mathematics',
    query: 'mathematics blackboard',
    title: 'Math Equation',
    note: 'Logarithm tables on graph paper with a pen - mathematics as handwriting, not symbols.',
  },
  {
    slot: 'english',
    query: 'open book desk study',
    title: 'open book blank pages sitting',
    note: 'An open book on a school desk in window light.',
  },
  {
    slot: 'chapter',
    query: 'students classroom learning',
    title: 'Open Books',
    note: 'A flat-lay of open book spreads - the neutral fallback banner for any chapter.',
  },
  {
    slot: 'hero',
    query: 'old books library shelves',
    title: 'Free library shelves many books',
    note: 'A library aisle: the dashboard hero, bright on the right where the copy is not.',
  },
];

const USER_AGENT = 'SanroAI-art-pipeline/1.0 (local build script)';
const REQUEST_TIMEOUT_MS = 30_000;

async function withTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, headers: { 'User-Agent': USER_AGENT, ...(init.headers ?? {}) } });
  } finally {
    clearTimeout(timer);
  }
}

async function search(query, pageSize = 40) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license=cc0,pdm,by,by-sa&page_size=${pageSize}&mature=false`;
  const res = await withTimeout(url);
  if (!res.ok) throw new Error(`openverse search HTTP ${res.status}`);
  const json = await res.json();
  return json.results ?? [];
}

function titleMatches(candidate, title) {
  const a = String(candidate?.title ?? '').toLowerCase().trim();
  const b = title.toLowerCase().trim();
  return a === b || a.includes(b) || b.includes(a);
}

/**
 * Search ranking is not stable, so the title is tried as the query first (it is
 * usually a better match than the theme query) before falling back to the theme
 * query that originally surfaced the frame.
 */
async function findPhoto(query, title) {
  for (const q of [title, query]) {
    const results = await search(q);
    const match = results.find((r) => titleMatches(r, title)) ?? (q === title ? results[0] : null);
    if (match) return match;
  }
  throw new Error(`no result titled "${title}" for query "${query}"`);
}

function licenceOf(result) {
  const version = result.license_version ? ` ${result.license_version}` : '';
  const code = String(result.license ?? '').toUpperCase();
  const label = code === 'CC0' ? 'CC0 1.0' : code === 'PDM' ? 'Public Domain Mark 1.0' : `CC ${code}${version}`;
  return { code, label };
}

async function main() {
  const check = process.argv.includes('--check');
  fs.mkdirSync(OUT, { recursive: true });

  const credits = [];
  let missing = 0;

  for (const spec of SLOTS) {
    const target = path.join(OUT, `${spec.slot}.jpg`);
    if (check) {
      if (!fs.existsSync(target)) {
        missing += 1;
        console.error(`  MISSING photos/${spec.slot}.jpg`);
      }
      continue;
    }

    const found = await findPhoto(spec.query, spec.title);
    const imgRes = await withTimeout(found.url);
    if (!imgRes.ok) throw new Error(`${spec.slot}: image HTTP ${imgRes.status}`);
    const raw = Buffer.from(await imgRes.arrayBuffer());

    const meta = await sharp(raw).metadata();
    const width = Math.min(2400, meta.width ?? 0);
    const jpg = await sharp(raw)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: '4:4:4' })
      .toBuffer();
    fs.writeFileSync(target, jpg);

    const licence = licenceOf(found);
    credits.push({
      slot: spec.slot,
      title: found.title,
      creator: found.creator || 'Unknown',
      licence: licence.label,
      licenceCode: licence.code,
      source: found.source,
      page: found.foreign_landing_url,
      original: found.url,
      width: meta.width,
      height: meta.height,
      bytes: jpg.length,
      note: spec.note,
    });
    console.log(
      `  OK  ${spec.slot.padEnd(12)} ${String(found.title).slice(0, 44).padEnd(46)} ${licence.label}  ${(jpg.length / 1024).toFixed(0)} KB`,
    );
  }

  if (check) {
    if (missing) {
      console.error(`\n${missing} photo(s) missing - run node scripts/qa/source-brand-photos.mjs`);
      process.exit(1);
    }
    console.log('  all source photos present');
    return;
  }

  fs.writeFileSync(
    path.join(OUT, 'credits.json'),
    JSON.stringify(
      {
        builtBy: 'scripts/qa/source-brand-photos.mjs',
        source: 'Openverse (https://openverse.org) - CC0 / public domain / CC BY / CC BY-SA',
        policy: 'Object and place photography only: no identifiable students are shown in shipped artwork.',
        photos: credits,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`\n  ${credits.length} photos -> apps/web/public/art/photos (+ credits.json)`);
}

await main();
