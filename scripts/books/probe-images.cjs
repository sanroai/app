/**
 * Probe helper: time `getImage` on a book PDF, page by page, to size the
 * per-batch timeout used by extract.cjs.
 *
 * Usage: node scripts/books/probe-images.cjs --class 9 --subject science --file iesc102.pdf --batch 8
 */
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { resolveSubject, argOf } = require('./subjects.cjs');

const CLS = argOf(process.argv, '--class', '10');
const SUB = resolveSubject(argOf(process.argv, '--subject', 'science'), CLS);
const FILE = argOf(process.argv, '--file', '');
const BATCH = Number(argOf(process.argv, '--batch', '8'));

(async () => {
  const buf = fs.readFileSync(path.join(SUB.source, FILE));
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    const textRes = await parser.getText({ pageJoiner: '\n' });
    const total = (textRes.pages || []).length;
    console.log(`${FILE}: ${total} pages`);
    let count = 0;
    const t0 = Date.now();
    for (let start = 1; start <= total; start += BATCH) {
      const partial = [];
      for (let n = start; n < Math.min(start + BATCH, total + 1); n++) partial.push(n);
      const b0 = Date.now();
      const imgs = await parser.getImage({ partial, imageBuffer: true, imageDataUrl: false, imageThreshold: 120 });
      let n = 0;
      for (const pg of imgs.pages || []) n += (pg.images || []).length;
      count += n;
      console.log(`  pages ${partial[0]}-${partial[partial.length - 1]}: ${n} images in ${((Date.now() - b0) / 1000).toFixed(1)}s`);
    }
    console.log(`  TOTAL ${count} images in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } finally {
    try { await parser.destroy(); } catch {}
  }
})();
