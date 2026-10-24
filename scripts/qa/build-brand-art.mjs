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

/** Brand palette (matches apps/web/tailwind.config.ts). */
const VIOLET = '#7c3aed';
const INDIGO = '#4f46e5';

/**
 * Each banner is a gradient field + a subject motif + one 3D icon. `accent` is
 * the subject colour used by the cards, so the banner and the card never fight.
 */
const BANNERS = [
  {
    key: 'subject-science',
    width: 1600,
    height: 640,
    icon: 'microscope.png',
    accent: '#06b6d4',
    accent2: '#10b981',
    motif: 'orbits',
  },
  {
    key: 'subject-mathematics',
    width: 1600,
    height: 640,
    icon: 'abacus.png',
    accent: '#10b981',
    accent2: '#6366f1',
    motif: 'grid',
  },
  {
    key: 'subject-english',
    width: 1600,
    height: 640,
    icon: 'open-book.png',
    accent: '#f59e0b',
    accent2: '#8b5cf6',
    motif: 'lines',
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

function backgroundSvg(spec, iconDataUri, iconSize) {
  const { width, height, accent, accent2, motif } = spec;
  const iconW = iconSize;
  const iconH = iconSize;
  const iconX = width - iconW - Math.round(width * 0.06);
  const iconY = Math.round((height - iconH) / 2);

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

  <rect width="${width}" height="${height}" fill="url(#base)"/>
  <ellipse cx="${width * 0.18}" cy="${height * 0.1}" rx="${width * 0.42}" ry="${height * 0.6}" fill="url(#glowA)"/>
  <ellipse cx="${width * 0.92}" cy="${height * 1.05}" rx="${width * 0.38}" ry="${height * 0.7}" fill="url(#glowB)"/>

  <g>${motifSvg(motif, width, height, accent)}</g>

  <ellipse cx="${iconX + iconW / 2}" cy="${iconY + iconH * 0.94}" rx="${iconW * 0.42}" ry="${
    iconH * 0.09
  }" fill="#000000" fill-opacity="0.28"/>
  <image href="${iconDataUri}" x="${iconX}" y="${iconY}" width="${iconW}" height="${iconH}"/>

  <rect width="${width}" height="${height}" fill="url(#sheen)"/>
  <rect width="${width}" height="${height}" fill="none" stroke="#ffffff" stroke-opacity="0.10" stroke-width="2"/>
</svg>`;
}

async function main() {
  const check = process.argv.includes('--check');
  fs.mkdirSync(WEB_OUT, { recursive: true });
  fs.mkdirSync(MOBILE_OUT, { recursive: true });

  const manifest = [];
  let missing = 0;

  for (const spec of BANNERS) {
    const file = `${spec.key}.jpg`;
    const webPath = path.join(WEB_OUT, file);

    if (check) {
      const okWeb = fs.existsSync(webPath);
      const okMobile = fs.existsSync(path.join(MOBILE_OUT, file));
      if (!okWeb || !okMobile) {
        missing += 1;
        console.error(`  MISSING ${spec.key} (web=${okWeb} mobile=${okMobile})`);
      }
      continue;
    }

    const iconPath = path.join(ICONS, spec.icon);
    if (!fs.existsSync(iconPath)) {
      throw new Error(`icon not found: ${path.relative(ROOT, iconPath)}`);
    }
    const iconSize = Math.round(spec.height * 0.62);
    const resized = await sharp(iconPath).resize(iconSize, iconSize, { fit: 'contain' }).png().toBuffer();
    const iconDataUri = `data:image/png;base64,${resized.toString('base64')}`;
    const svg = backgroundSvg(spec, iconDataUri, iconSize);

    const jpg = await sharp(Buffer.from(svg), { density: 144 })
      .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: '4:4:4' })
      .toBuffer();

    fs.writeFileSync(webPath, jpg);
    fs.writeFileSync(path.join(MOBILE_OUT, file), jpg);
    manifest.push({
      key: spec.key,
      file,
      width: spec.width,
      height: spec.height,
      accent: spec.accent,
      bytes: jpg.length,
    });
    console.log(`  OK  ${spec.key}  ${spec.width}x${spec.height}  ${(jpg.length / 1024).toFixed(0)} KB`);
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
