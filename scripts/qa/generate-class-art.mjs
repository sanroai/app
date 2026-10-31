#!/usr/bin/env node
/**
 * Generates the class-specific subject photographs with a text-to-image model.
 *
 * Why
 * ---
 * One stock photograph per subject cannot give ten classes ten different pictures
 * (cropping the same scene still reads as "the same photo"). This script asks an
 * image model for one distinct scene per subject *and* class - 30 images - and
 * writes them to `apps/web/public/art/photos/subject-<name>-<class>.jpg`.
 * `build-brand-art.mjs` then composites the brand overlay onto each one and copies
 * the result to both clients, so the shipped art stays local and deterministic.
 *
 * Provider
 * --------
 * Pollinations (`image.pollinations.ai`, FLUX) is keyless. The free tier allows one
 * image every 45 s per IP, so the script spaces requests and retries with backoff;
 * a full run takes ~25 minutes and is resumable (existing files are skipped).
 *
 *   node scripts/qa/generate-class-art.mjs            # all missing images
 *   node scripts/qa/generate-class-art.mjs --only subject-science-3
 *   node scripts/qa/generate-class-art.mjs --dry-run
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const OUT = path.join(ROOT, 'apps', 'web', 'public', 'art', 'photos');

const WIDTH = 1200;
const HEIGHT = 480;
const STYLE =
  'premium education app hero banner, cinematic soft studio lighting, deep violet and indigo gradient background, ' +
  'rich colour, generous empty space on the left, wide 5:2 composition, no text, no letters, no numbers, no watermark, no captions, no logo';

/** One scene per class, so no two classes of a subject ever share an image. */
const SCENES = {
  science: [
    'a child-sized garden of plants and friendly animals, a magnifying glass over a green leaf, butterflies',
    'the water cycle: soft clouds, rain falling on a small stream and green hills',
    'soil cross-section with seeds sprouting, roots reaching down, warm sunlight above',
    'the human body: a heart, lungs and a small skeleton model on a clean desk',
    'a single leaf under a microscope with sunlight passing through it, tiny cells visible',
    'magnets, gears and simple machines arranged on a workbench',
    'light and shadow: a glass prism splitting a beam into a rainbow',
    'cells under a microscope, a glowing DNA double helix floating beside it',
    'force and motion: pulleys, a ramp with a rolling ball, a Newton cradle in motion',
    'a chemistry bench: glass beakers with glowing cyan and green liquid, gentle vapour',
  ],
  mathematics: [
    'wooden counting blocks, an abacus and a number line on a warm desk',
    'geometric shapes: tangram pieces, wooden solids and a compass',
    'arrays of dots and a multiplication grid drawn on graph paper',
    'fractions made visual: a pie cut into equal slices, measuring cups',
    'place value: a ruler, decimal blocks and a place-value chart',
    'geometry tools: compass, protractor and translucent triangles',
    'a balance scale with integers on a number line behind it',
    'algebra on a dark chalkboard: clean handwritten equations and brackets',
    'trigonometry: a unit circle and soft sine waves glowing in the background',
    'coordinate geometry: graph paper with a smooth parabola and plotted points',
  ],
  english: [
    'alphabet blocks beside an open picture book with colourful illustrations',
    'a rhyming picture book with crayons and playful animal characters',
    'an open storybook with a friendly animal cast stepping out of the pages',
    'a handwriting notebook, a sharpened pencil and neat cursive strokes',
    'a warm library shelf of well-read books with soft window light',
    'a poetry desk: a quill, folded paper and soft candle light',
    'an open adventure book with a folded map and a small compass',
    'a chalkboard with sentence diagrams and punctuation marks',
    'an essay desk: an open notebook, a pen and a cup of tea',
    'a stack of classic hardback novels in dramatic side light',
  ],
};

const SUBJECTS = [
  { key: 'subject-science', scenes: SCENES.science, seed: 4100 },
  { key: 'subject-mathematics', scenes: SCENES.mathematics, seed: 5200 },
  { key: 'subject-english', scenes: SCENES.english, seed: 7300 },
];

const JOBS = SUBJECTS.flatMap((subject) =>
  subject.scenes.map((scene, index) => ({
    key: `${subject.key}-${index + 1}`,
    prompt: `${scene}, ${STYLE}`,
    seed: subject.seed + index * 37,
  })),
);

const onlyArg = (() => {
  const index = process.argv.indexOf('--only');
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : '';
})();
const jobs = onlyArg ? JOBS.filter((job) => job.key === onlyArg) : JOBS;
const dryRun = process.argv.includes('--dry-run');

function imageUrl(job) {
  const params = new URLSearchParams({
    width: String(WIDTH),
    height: String(HEIGHT),
    seed: String(job.seed),
    model: 'flux',
    nologo: 'true',
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(job.prompt)}?${params.toString()}`;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generate(job) {
  const target = path.join(OUT, `${job.key}.jpg`);
  if (fs.existsSync(target) && fs.statSync(target).size > 20_000) {
    console.log(`  skip  ${job.key}.jpg (exists)`);
    return 'skipped';
  }

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(imageUrl(job), { signal: AbortSignal.timeout(180_000) });
      const type = response.headers.get('content-type') ?? '';
      const bytes = Buffer.from(await response.arrayBuffer());

      if (response.ok && type.startsWith('image/') && bytes.length > 20_000) {
        fs.writeFileSync(target, bytes);
        console.log(`  OK    ${job.key}.jpg  ${(bytes.length / 1024).toFixed(0)} KB`);
        return 'generated';
      }

      const body = bytes.toString('utf8').slice(0, 200);
      console.log(`  retry ${job.key} (HTTP ${response.status}, attempt ${attempt}) ${body}`);
      await sleep(60_000);
    } catch (error) {
      console.log(`  retry ${job.key} (${String(error).slice(0, 100)}, attempt ${attempt})`);
      await sleep(60_000);
    }
  }

  console.log(`  FAIL  ${job.key}`);
  return 'failed';
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  console.log(`${jobs.length} image(s), ${WIDTH}x${HEIGHT}, pollinations/flux (keyless)`);

  if (dryRun) {
    for (const job of jobs) console.log(`  ${job.key}: ${job.prompt.slice(0, 90)}...`);
    return;
  }

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const [index, job] of jobs.entries()) {
    const result = await generate(job);
    if (result === 'generated') generated += 1;
    else if (result === 'skipped') skipped += 1;
    else failed += 1;

    // The free tier allows one image every 45 s; keep a margin.
    if (index < jobs.length - 1) await sleep(46_000);
  }

  console.log(`\n${generated} generated, ${skipped} skipped, ${failed} failed`);
  if (failed) process.exitCode = 1;
}

await main();
