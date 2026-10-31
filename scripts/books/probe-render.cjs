/**
 * Probe helper: render one page with the pdfjs asset options (OpenJPEG WASM,
 * fonts, CMaps) so we can check the JPEG2000 photographs actually appear.
 *
 * Usage: node scripts/books/probe-render.cjs --class 9 --subject english --file iebe102.pdf --page 3 --out C:\temp\p.png
 */
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { resolveSubject, argOf } = require('./subjects.cjs');
const { pdfjsAssetOptions } = require('./pdfjs-assets.cjs');

const CLS = argOf(process.argv, '--class', '10');
const SUB = resolveSubject(argOf(process.argv, '--subject', 'science'), CLS);
const FILE = argOf(process.argv, '--file', '');
const PAGE = Number(argOf(process.argv, '--page', '1'));
const OUT = argOf(process.argv, '--out', '');

(async () => {
  const buf = fs.readFileSync(path.join(SUB.source, FILE));
  const parser = new PDFParse({ data: new Uint8Array(buf), ...pdfjsAssetOptions() });
  try {
    const t0 = Date.now();
    const shots = await parser.getScreenshot({ partial: [PAGE], desiredWidth: 1240, imageBuffer: true, imageDataUrl: false });
    for (const s of shots.pages) {
      const out = OUT || path.join(process.env.TEMP || '.', `${FILE.replace(/\W/g, '_')}_p${PAGE}.png`);
      fs.writeFileSync(out, Buffer.from(s.data));
      console.log(`rendered page ${PAGE} -> ${out} (${shots.pages[0].data.length} bytes, ${Date.now() - t0}ms)`);
    }
    const imgs = await parser.getImage({ partial: [PAGE], imageBuffer: true, imageDataUrl: false, imageThreshold: 120 });
    console.log(`embedded images on page ${PAGE}: ${(imgs.pages[0]?.images || []).length}`);
  } finally {
    try { await parser.destroy(); } catch {}
  }
})();
