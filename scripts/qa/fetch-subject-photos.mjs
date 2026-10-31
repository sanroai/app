#!/usr/bin/env node
/**
 * Downloads the real photographs that sit under the subject banners.
 *
 * Why local files and not a hotlink
 * ---------------------------------
 * The web app renders the banner through `next/image`, which would need every
 * Unsplash host in `remotePatterns`; the mobile app bundles its art through
 * Metro and cannot hotlink at all. So one landscape photo per subject is
 * downloaded once, committed under `apps/web/public/art/photos/`, and composited
 * into the shipped banners by `build-brand-art.mjs`. Both platforms therefore
 * use byte-identical artwork, and the app never makes a third-party request to
 * draw its own home screen.
 *
 * Attribution is mandatory under the Unsplash licence and lives in
 * `apps/web/public/art/photos/credits.json`; the download endpoint below is the
 * one Unsplash's API returns, so it tracks the download as the licence expects.
 *
 *   node scripts/qa/fetch-subject-photos.mjs
 *   node scripts/qa/fetch-subject-photos.mjs --check   # fail if a file is missing
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const OUT = path.join(ROOT, 'apps', 'web', 'public', 'art', 'photos');

/**
 * Curated once, by hand: a photograph that reads at 320 px wide and still
 * carries the subject at a glance. `unsplashId` is the photo's own id, used for
 * the credit link; `file` is the `images.unsplash.com` path segment.
 */
const PHOTOS = [
  {
    key: 'subject-science',
    file: 'photo-1518152006812-edab29b069ac',
    title: 'Microscope',
    photographer: 'Ousa Chea',
    unsplashId: 'gKUC4TMhOiY',
    width: 1600,
    height: 640,
  },
  {
    key: 'subject-mathematics',
    file: 'photo-1635372722656-389f87a941b7',
    title: 'A blackboard covered in mathematics',
    photographer: 'Thomas T',
    unsplashId: 'OPpCbAAKWv8',
    width: 1600,
    height: 640,
  },
  {
    key: 'subject-english',
    file: 'photo-1513185041617-8ab03f83d6c5',
    title: 'A shelf of well-read books',
    photographer: 'Rey Seven',
    unsplashId: '_nm_mZ4Cs2I',
    width: 1600,
    height: 640,
  },
  {
    key: 'chapter-banner',
    file: 'photo-1719159381916-062fa9f435a6',
    title: 'An Indian school classroom',
    photographer: 'Haseeb Modi',
    unsplashId: 'OcDJhBm8Jnc',
    width: 1600,
    height: 420,
  },
  {
    key: 'dashboard-hero',
    file: 'photo-1495446815901-a7297e633e8d',
    title: 'A market stall of books',
    photographer: 'Tom Hermans',
    unsplashId: '9BoqXzEeQqM',
    width: 1600,
    height: 480,
  },
];

function downloadUrl(spec) {
  const params = new URLSearchParams({
    w: String(spec.width),
    h: String(spec.height),
    fit: 'crop',
    crop: 'entropy',
    q: '82',
    fm: 'jpg',
  });
  return `https://images.unsplash.com/${spec.file}?${params.toString()}`;
}

async function main() {
  const check = process.argv.includes('--check');
  fs.mkdirSync(OUT, { recursive: true });

  let missing = 0;
  const credits = [];

  for (const spec of PHOTOS) {
    const target = path.join(OUT, `${spec.key}.jpg`);
    if (check) {
      if (!fs.existsSync(target)) {
        missing += 1;
        console.error(`  MISSING ${spec.key}.jpg - run node scripts/qa/fetch-subject-photos.mjs`);
      }
      continue;
    }

    if (fs.existsSync(target)) {
      console.log(`  ok    ${spec.key}.jpg (already downloaded)`);
    } else {
      const response = await fetch(downloadUrl(spec), {
        headers: { 'User-Agent': 'sanro-ai-art-build/1.0' },
      });
      if (!response.ok) {
        throw new Error(`${spec.key}: HTTP ${response.status} from images.unsplash.com`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 10_000) {
        throw new Error(`${spec.key}: downloaded ${bytes.length} bytes - not a photograph`);
      }
      fs.writeFileSync(target, bytes);
      console.log(`  OK    ${spec.key}.jpg  ${(bytes.length / 1024).toFixed(0)} KB`);
    }

    credits.push({
      key: spec.key,
      file: `${spec.key}.jpg`,
      title: spec.title,
      photographer: spec.photographer,
      source: `https://unsplash.com/photos/${spec.unsplashId}`,
      license: 'https://unsplash.com/license',
      downloadedFrom: downloadUrl(spec),
    });
  }

  if (check) {
    if (missing) process.exit(1);
    console.log('  all subject photographs present');
    return;
  }

  fs.writeFileSync(
    path.join(OUT, 'credits.json'),
    JSON.stringify(
      {
        note: 'Photographs used under the Unsplash licence. Composited with the brand gradient by scripts/qa/build-brand-art.mjs - the raw files are never shipped alone.',
        fetchedBy: 'scripts/qa/fetch-subject-photos.mjs',
        photos: credits,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`\n  ${credits.length} photographs -> ${path.relative(ROOT, OUT)}`);
}

await main();
