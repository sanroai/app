#!/usr/bin/env node
/**
 * Generates the subject + chapter artwork used by the web and the mobile clients.
 *
 * Why this script exists
 * ----------------------
 * The product needs real imagery (a subject banner behind every subject card, a
 * chapter banner above the chapter hub) instead of flat colour blocks. The
 * Gemini image models are reachable with the project key but answer HTTP 429
 * "you exceeded your current quota" on the free tier (verified 2026-10-24 for
 * gemini-2.5-flash-image, gemini-3-pro-image, gemini-3.1-flash-image and
 * gemini-3.1-flash-lite-image), so the art is generated once with a keyless
 * text-to-image service and committed to the repository. Runtime never depends
 * on an external image service: the clients simply load local assets.
 *
 * When a funded image key is available, swap `PROVIDER` below or drop new files
 * over the generated ones - the manifest keys are what the UI reads.
 *
 *   node scripts/qa/generate-subject-art.mjs            # all assets
 *   node scripts/qa/generate-subject-art.mjs science    # one key
 *   node scripts/qa/generate-subject-art.mjs --dry-run  # print the plan
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const WEB_OUT = path.join(ROOT, 'apps', 'web', 'public', 'art');
const MOBILE_OUT = path.join(ROOT, 'apps', 'mobile', 'assets', 'art');

const STYLE =
  'isometric 3D render, soft studio lighting, glossy clay material, premium education app hero image, ' +
  'deep violet and indigo gradient background, generous negative space, high detail, no text, no letters, no watermark';

/** One entry per asset the UI references. `key` is what the manifest exposes. */
const ASSETS = [
  {
    key: 'subject-science',
    width: 1600,
    height: 640,
    seed: 4171,
    prompt:
      'science laboratory still life: glass beakers with glowing cyan liquid, a microscope, floating atom model, ' +
      'green leaf and light rays, ' + STYLE,
  },
  {
    key: 'subject-mathematics',
    width: 1600,
    height: 640,
    seed: 5197,
    prompt:
      'mathematics still life: geometric solids, golden ratio spiral, protractor and compass, floating numerals made of light, ' +
      'emerald and indigo palette, ' + STYLE,
  },
  {
    key: 'subject-english',
    width: 1600,
    height: 640,
    seed: 6203,
    prompt:
      'english literature still life: an open hardcover book with warm glowing pages, a quill pen, floating abstract letters of light, ' +
      'amber and violet palette, ' + STYLE,
  },
  {
    key: 'chapter-banner',
    width: 1600,
    height: 420,
    seed: 7331,
    prompt:
      'abstract knowledge landscape: a winding path of light climbing soft violet hills toward a glowing book monument, ' +
      'tiny stars and geometric constellations, ' + STYLE,
  },
  {
    key: 'icon-learn',
    width: 512,
    height: 512,
    seed: 8111,
    prompt:
      'single 3D icon of an open book with softly glowing pages, glossy clay, floating sparkles, transparent-looking deep violet backdrop, ' +
      'centered, square, no text',
  },
  {
    key: 'icon-practice',
    width: 512,
    height: 512,
    seed: 8219,
    prompt:
      'single 3D icon of a round target with an arrow in the bullseye, glossy clay, mint green and violet, ' +
      'centered, square, no text',
  },
  {
    key: 'icon-ask',
    width: 512,
    height: 512,
    seed: 8329,
    prompt:
      'single 3D icon of a friendly chat bubble with a glowing spark inside, glossy clay, violet and cyan, ' +
      'centered, square, no text',
  },
  {
    key: 'icon-streak',
    width: 512,
    height: 512,
    seed: 8437,
    prompt:
      'single 3D icon of a stylised flame with an inner glow, glossy clay, orange and amber, ' +
      'centered, square, no text',
  },
  {
    key: 'icon-trophy',
    width: 512,
    height: 512,
    seed: 8543,
    prompt:
      'single 3D icon of a golden trophy cup with a star, glossy clay, gold and violet, ' +
      'centered, square, no text',
  },
  {
    key: 'icon-xp',
    width: 512,
    height: 512,
    seed: 8651,
    prompt:
      'single 3D icon of a glowing lightning bolt, glossy clay, electric blue and violet, ' +
      'centered, square, no text',
  },
];

const PROVIDER = (asset) =>
  'https://image.pollinations.ai/prompt/' +
  encodeURIComponent(asset.prompt) +
  `?width=${asset.width}&height=${asset.height}&seed=${asset.seed}&nologo=true&model=flux`;

const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const dryRun = process.argv.includes('--dry-run');
const selected = only.length ? ASSETS.filter((a) => only.includes(a.key)) : ASSETS;
if (!selected.length) {
  console.error('No matching asset keys. Known keys: ' + ASSETS.map((a) => a.key).join(', '));
  process.exit(1);
}

fs.mkdirSync(WEB_OUT, { recursive: true });
fs.mkdirSync(MOBILE_OUT, { recursive: true });

const manifest = [];
let failures = 0;

for (const asset of selected) {
  const file = `${asset.key}.jpg`;
  const webPath = path.join(WEB_OUT, file);
  const mobilePath = path.join(MOBILE_OUT, file);
  const url = PROVIDER(asset);

  if (dryRun) {
    console.log(`${asset.key} -> ${asset.width}x${asset.height}  ${url.slice(0, 110)}...`);
    continue;
  }

  let bytes = null;
  for (let attempt = 1; attempt <= 4 && !bytes; attempt += 1) {
    const started = Date.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(180_000) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const type = res.headers.get('content-type') ?? '';
      if (!/^image\//.test(type)) throw new Error('unexpected content-type ' + type);
      bytes = Buffer.from(await res.arrayBuffer());
      if (bytes.length < 4_000) throw new Error('suspiciously small image (' + bytes.length + ' bytes)');
      console.log(
        `  OK  ${asset.key}  ${asset.width}x${asset.height}  ${(bytes.length / 1024).toFixed(0)} KB  ${Date.now() - started}ms`,
      );
    } catch (err) {
      bytes = null;
      const wait = 4_000 * attempt;
      console.log(`  ..  ${asset.key} attempt ${attempt} failed (${err.message}); retrying in ${wait}ms`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }

  if (!bytes) {
    failures += 1;
    console.error(`  ERR ${asset.key} could not be generated`);
    continue;
  }

  fs.writeFileSync(webPath, bytes);
  fs.writeFileSync(mobilePath, bytes);
  manifest.push({ key: asset.key, file, width: asset.width, height: asset.height, bytes: bytes.length });
}

if (!dryRun) {
  const manifestPath = path.join(WEB_OUT, 'manifest.json');
  const existing = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : { generatedWith: 'pollinations.ai/flux (keyless)', assets: [] };
  const merged = [
    ...existing.assets.filter((a) => !manifest.some((m) => m.key === a.key)),
    ...manifest,
  ].sort((a, b) => a.key.localeCompare(b.key));
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({ ...existing, generatedAt: new Date().toISOString(), assets: merged }, null, 2) + '\n',
  );
  console.log(`\n  manifest: ${merged.length} assets -> ${path.relative(ROOT, manifestPath)}`);
  console.log(`  mobile copies -> ${path.relative(ROOT, MOBILE_OUT)}`);
}

if (failures) {
  console.error(`\n${failures} asset(s) failed.`);
  process.exit(1);
}
