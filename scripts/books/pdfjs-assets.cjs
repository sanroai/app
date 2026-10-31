const fs = require('fs');
const path = require('path');

/**
 * pdfjs needs the OpenJPEG WASM decoder to read the JPEG2000 images that the
 * 2026 NCERT books use for their photographs and decorative art. Without
 * `wasmUrl` those images are silently dropped - they vanish from the page
 * screenshots *and* from the embedded-image extraction.
 *
 * The decoder, the standard fonts, the CMaps and the ICC profiles all ship
 * inside the pdfjs-dist package that pdf-parse resolves to, so we point
 * pdfjs straight at them on disk.
 */

let cached = null;

/** The real (symlink-resolved) directory of the pdfjs-dist used by pdf-parse. */
function pdfjsDistDir() {
  if (cached) return cached;
  const candidates = [];

  // pnpm: node_modules/.pnpm/pdf-parse@<v>/node_modules/{pdf-parse,pdfjs-dist}
  try {
    const parseEntry = require.resolve('pdf-parse');
    const parseDir = path.dirname(parseEntry);
    candidates.push(path.join(parseDir, '..', 'pdfjs-dist'));
  } catch {}

  // npm / hoisted layout
  candidates.push(path.join(__dirname, '..', '..', 'node_modules', 'pdfjs-dist'));

  // pnpm store
  const pnpmDir = path.join(__dirname, '..', '..', 'node_modules', '.pnpm');
  if (fs.existsSync(pnpmDir)) {
    for (const entry of fs.readdirSync(pnpmDir)) {
      if (entry.startsWith('pdfjs-dist@')) {
        candidates.push(path.join(pnpmDir, entry, 'node_modules', 'pdfjs-dist'));
      }
    }
  }

  for (const dir of candidates) {
    const wasm = path.join(dir, 'wasm');
    if (fs.existsSync(path.join(wasm, 'openjpeg.wasm'))) {
      cached = dir;
      return dir;
    }
  }
  throw new Error('pdfjs-dist assets not found (looked for openjpeg.wasm)');
}

/** pdfjs wants a URL-ish directory path that ends with a forward slash. */
function factoryUrl(dir) {
  return `${dir.replace(/\\/g, '/')}/`;
}

/**
 * Extra `getDocument` options that make pdfjs render the full book:
 * JPEG2000 images, embedded fonts, CMaps and ICC profiles.
 */
function pdfjsAssetOptions() {
  const dir = pdfjsDistDir();
  const opts = {
    wasmUrl: factoryUrl(path.join(dir, 'wasm')),
    useWasm: true,
  };
  const standardFonts = path.join(dir, 'standard_fonts');
  if (fs.existsSync(standardFonts)) opts.standardFontDataUrl = factoryUrl(standardFonts);
  const cmaps = path.join(dir, 'cmaps');
  if (fs.existsSync(cmaps)) opts.cMapUrl = factoryUrl(cmaps);
  const icc = path.join(dir, 'icc');
  if (fs.existsSync(icc)) opts.iccUrl = factoryUrl(icc);
  return opts;
}

module.exports = { pdfjsDistDir, pdfjsAssetOptions };
