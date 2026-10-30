#!/usr/bin/env node
/**
 * Builds the shipped brand artwork: subject banners, the chapter-hub banner and
 * the dashboard hero. Deterministic, offline, no API key, no watermark.
 *
 * Why vector instead of text-to-image
 * -----------------------------------
 * The Gemini image models are listed for this project's key but every one of
 * them answers HTTP 429 "exceeded your current quota" on the free tier, and the
 * keyless fallback (`scripts/qa/generate-subject-art.mjs`) returned washed-out,
 * watermarked frames that are not shippable. A composed gradient + the existing
 * premium 3D icon set is crisper at every size, weighs ~40 KB, stays on brand
 * and can be regenerated at any resolution if the design changes.
 *
 * The 3D icons in `apps/mobile/assets/icons/` are the single source of truth for
 * the object in each banner, so the imagery and the in-app icons can never drift.
 *
 *   node scripts/qa/build-brand-art.mjs
 *   node scripts/qa/build-brand-art.mjs --check   # fail if a file is missing
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const ICONS = path.join(ROOT, 'apps', 'mobile', 'assets', 'icons');
const WEB_OUT = path.join(ROOT, 'apps', 'web', 'public', 'art');
const MOBILE_OUT = path.join(ROOT, 'apps', 'mobile', 'assets', 'art');
/**
 * Real photographs (see fetch-subject-photos.mjs). When a photo exists for a
 * banner key it becomes the base layer and the brand gradient is drawn over it,
 * so the artwork is photography rather than an abstract field.
 */
const PHOTOS = path.join(WEB_OUT, 'photos');

/** Brand palette (matches apps/web/tailwind.config.ts). */
const VIOLET = '#7c3aed';
const INDIGO = '#4f46e5';

/**
 * Each banner is a gradient field + a subject motif + (optionally) one 3D icon.
 * `accent` is the subject colour used by the cards, so the banner and the card
 * never fight.
 *
 * The **subject** banners carry no icon: the subject card draws its own
 * typographic monogram (`SCI` / `MAT` / `ENG`) over the photograph, and a second
 * rendered object behind it read as a sticker. The chapter and dashboard
 * banners keep theirs.
 *
 * A subject also ships **three framings of its photograph** (`-a`, `-b`, `-c`).
 * The same subject repeats in every class ("Class 1 Science", "Class 2
 * Science"), so one image made ten cards look like the same card; each class
 * picks a different slice (`classSubjectVariant`), which keeps the subject
 * identity (photo, accent, monogram) while the grid stops repeating itself.
 */
const VARIANT_SUFFIXES = ['a', 'b', 'c'];

const BANNERS = [
  {
    key: 'subject-science',
    width: 1600,
    height: 640,
    accent: '#06b6d4',
    accent2: '#10b981',
    motif: 'orbits',
    variants: ['left', 'centre', 'right'],
  },
  {
    key: 'subject-mathematics',
    width: 1600,
    height: 640,
    accent: '#10b981',
    accent2: '#6366f1',
    motif: 'grid',
    variants: ['left', 'centre', 'right'],
  },
  {
    key: 'subject-english',
    width: 1600,
    height: 640,
    accent: '#f59e0b',
    accent2: '#8b5cf6',
    motif: 'lines',
    variants: ['left', 'centre', 'right'],
  },
  {
    key: 'chapter-banner',
    width: 1600,
    height: 420,
    icon: 'open-book.png',
    accent: '#8b5cf6',
    accent2: '#06b6d4',
    motif: 'waves',
  },
  {
    key: 'dashboard-hero',
    width: 1600,
    height: 480,
    icon: 'rocket.png',
    accent: '#a855f7',
    accent2: '#f59e0b',
    motif: 'orbits',
  },
];

/** Decorative geometry, drawn faintly behind the subject. */
function motifSvg(kind, width, height, accent) {
  const stroke = `stroke="${accent}" stroke-opacity="0.22" fill="none"`;
  if (kind === 'grid') {
    const step = 80;
    let d = '';
    for (let x = 0; x <= width; x += step) d += `<path d="M${x} 0V${height}" ${stroke} stroke-width="1"/>`;
    for (let y = 0; y <= height; y += step) d += `<path d="M0 ${y}H${width}" ${stroke} stroke-width="1"/>`;
    return d;
  }
  if (kind === 'orbits') {
    return [0.55, 0.8, 1.05]
      .map(
        (scale, i) =>
          `<ellipse cx="${width * 0.76}" cy="${height * 0.5}" rx="${width * 0.2 * scale}" ry="${
            height * 0.24 * scale
          }" ${stroke} stroke-width="${1.6 - i * 0.3}" transform="rotate(${-18 + i * 12} ${
            width * 0.76
          } ${height * 0.5})"/>`,
      )
      .join('');
  }
  if (kind === 'lines') {
    return Array.from({ length: 7 }, (_, i) => {
      const y = height * (0.12 + i * 0.12);
      return `<path d="M${width * 0.34} ${y}C${width * 0.5} ${y - 40}, ${width * 0.66} ${
        y + 40
      }, ${width * 0.98} ${y - 10}" ${stroke} stroke-width="2" stroke-linecap="round"/>`;
    }).join('');
  }
  // waves
  return Array.from({ length: 4 }, (_, i) => {
    const y = height * (0.3 + i * 0.14);
    return `<path d="M0 ${y}Q${width * 0.25} ${y - 46}, ${width * 0.5} ${y}T${width} ${y}" ${stroke} stroke-width="2"/>`;
  }).join('');
}

function backgroundSvg(spec, iconDataUri, iconSize, hasPhoto) {
  const { width, height, accent, accent2, motif } = spec;
  const iconW = iconSize;
  const iconH = iconSize;
  const iconX = width - iconW - Math.round(width * 0.06);
  const iconY = Math.round((height - iconH) / 2);
  // With a photograph underneath, the dark base becomes a tint instead of a
  // wall: enough contrast for white text and the 3D icon, still visibly a photo.
  const baseOpacity = hasPhoto ? 0.5 : 1;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="55%" stop-color="#312e81"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <radialGradient id="glowA" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent2}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${accent2}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#base)" fill-opacity="${baseOpacity}"/>
  <ellipse cx="${width * 0.18}" cy="${height * 0.1}" rx="${width * 0.42}" ry="${height * 0.6}" fill="url(#glowA)"/>
  <ellipse cx="${width * 0.92}" cy="${height * 1.05}" rx="${width * 0.38}" ry="${height * 0.7}" fill="url(#glowB)"/>
  ${
    hasPhoto
      ? `<rect width="${width}" height="${height}" fill="#0b0614" fill-opacity="0.10"/>`
      : ''
  }

  <g>${motifSvg(motif, width, height, accent)}</g>
  ${
    iconDataUri
      ? `<ellipse cx="${iconX + iconW / 2}" cy="${iconY + iconH * 0.94}" rx="${
          iconW * 0.42
        }" ry="${iconH * 0.09}" fill="#000000" fill-opacity="0.28"/>
  <image href="${iconDataUri}" x="${iconX}" y="${iconY}" width="${iconW}" height="${iconH}"/>`
      : ''
  }

  <rect width="${width}" height="${height}" fill="url(#sheen)"/>
  <rect width="${width}" height="${height}" fill="none" stroke="#ffffff" stroke-opacity="0.10" stroke-width="2"/>
</svg>`;
}

/**
 * One framing of a subject photograph: the source is already banner-sized, so a
 * plain cover-resize would return the same pixels for every variant. Each framing
 * zooms to a different depth and picks a different window (and one is mirrored),
 * so ten classes of the same subject read as ten different pictures: a wide view,
 * a mirrored closer view, then a close-up.
 */
const FRAMINGS = {
  left: { zoom: 1.3, x: 0, y: 0.5, flip: false },
  centre: { zoom: 1.75, x: 0.5, y: 0.2, flip: true },
  right: { zoom: 2.1, x: 1, y: 0.8, flip: false },
};

async function photoSlice(photoPath, width, height, slice) {
  const framing = FRAMINGS[slice] ?? FRAMINGS.left;
  const zoomedWidth = Math.round(width * framing.zoom);
  const zoomedHeight = Math.round(height * framing.zoom);
  let pipeline = sharp(photoPath).resize(zoomedWidth, zoomedHeight, { fit: 'cover' });
  if (framing.flip) pipeline = pipeline.flop();
  const zoomed = await pipeline.toBuffer();
  const left = Math.round((zoomedWidth - width) * framing.x);
  const top = Math.round((zoomedHeight - height) * framing.y);
  return sharp(zoomed).extract({ left, top, width, height }).toBuffer();
}

async function main() {
  const check = process.argv.includes('--check');  fs.mkdirSync(WEB_OUT, { recursive: true });
  fs.mkdirSync(MOBILE_OUT, { recursive: true });

  const manifest = [];
  let missing = 0;

  for (const spec of BANNERS) {
    const slices = spec.variants ?? [null];

    for (const [index, slice] of slices.entries()) {
      const file = slice ? `${spec.key}-${VARIANT_SUFFIXES[index]}.jpg` : `${spec.key}.jpg`;
      const webPath = path.join(WEB_OUT, file);

      if (check) {
        const okWeb = fs.existsSync(webPath);
        const okMobile = fs.existsSync(path.join(MOBILE_OUT, file));
        if (!okWeb || !okMobile) {
          missing += 1;
          console.error(`  MISSING ${file} (web=${okWeb} mobile=${okMobile})`);
        }
        continue;
      }

      let iconDataUri;
      if (spec.icon) {
        const iconPath = path.join(ICONS, spec.icon);
        if (!fs.existsSync(iconPath)) {
          throw new Error(`icon not found: ${path.relative(ROOT, iconPath)}`);
        }
        const iconSize = Math.round(spec.height * 0.62);
        const resized = await sharp(iconPath)
          .resize(iconSize, iconSize, { fit: 'contain' })
          .png()
          .toBuffer();
        iconDataUri = `data:image/png;base64,${resized.toString('base64')}`;
      }

      const photoPath = path.join(PHOTOS, `${spec.key}.jpg`);
      const hasPhoto = fs.existsSync(photoPath);
      const svg = backgroundSvg(spec, iconDataUri, Math.round(spec.height * 0.62), hasPhoto);
      // A photo is composited at the banner's own pixel size, so the overlay is
      // rasterised 1:1; the photo-less path keeps the higher 2x density.
      const overlay = await sharp(Buffer.from(svg), hasPhoto ? {} : { density: 144 })
        .png()
        .toBuffer();

      let pipeline;
      if (hasPhoto) {
        const base = slice
          ? await photoSlice(photoPath, spec.width, spec.height, slice)
          : await sharp(photoPath)
              .resize(spec.width, spec.height, { fit: 'cover', position: 'attention' })
              .toBuffer();
        pipeline = sharp(base).composite([{ input: overlay, top: 0, left: 0 }]);
      } else {
        pipeline = sharp(overlay);
      }

      const jpg = await pipeline
        .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: '4:4:4' })
        .toBuffer();

      fs.writeFileSync(webPath, jpg);
      fs.writeFileSync(path.join(MOBILE_OUT, file), jpg);
      manifest.push({
        key: spec.key,
        file,
        variant: slice,
        width: spec.width,
        height: spec.height,
        accent: spec.accent,
        photo: hasPhoto ? `photos/${spec.key}.jpg` : null,
        bytes: jpg.length,
      });
      console.log(
        `  OK  ${file}  ${spec.width}x${spec.height}  ${(jpg.length / 1024).toFixed(0)} KB${
          hasPhoto ? `  (photo${slice ? `, ${slice}` : ''})` : ''
        }`,
      );
    }
  }

  if (check) {
    if (missing) {
      console.error(`\n${missing} banner(s) missing - run node scripts/qa/build-brand-art.mjs`);
      process.exit(1);
    }
    console.log('  all banners present');
    return;
  }

  const manifestPath = path.join(WEB_OUT, 'manifest.json');
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        builtBy: 'scripts/qa/build-brand-art.mjs',
        note: 'Composed gradient art over the premium 3D icon set; regenerated offline, no API key.',
        assets: manifest,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`\n  ${manifest.length} banners -> apps/web/public/art + apps/mobile/assets/art`);
}

await main();
