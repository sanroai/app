/**
 * Probe helper: dump the raw text of specific pages of a book PDF.
 *
 * Usage: node scripts/books/probe-pages.cjs --class 9 --subject english --file iebe1ps.pdf --pages 3,4,5
 */
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { resolveSubject, argOf } = require('./subjects.cjs');

const CLS = argOf(process.argv, '--class', '10');
const SUB = resolveSubject(argOf(process.argv, '--subject', 'science'), CLS);
const FILE = argOf(process.argv, '--file', '');
const PAGES = argOf(process.argv, '--pages', '1')
  .split(',')
  .map((n) => Number(n.trim()))
  .filter(Boolean);

(async () => {
  const buf = fs.readFileSync(path.join(SUB.source, FILE));
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    const textRes = await parser.getText({ pageJoiner: '\n' });
    const pages = textRes.pages || [];
    for (const n of PAGES) {
      const p = pages[n - 1];
      if (!p) continue;
      console.log(`\n=========== ${FILE} page ${n} ===========`);
      console.log(p.text);
    }
  } finally {
    try { await parser.destroy(); } catch {}
  }
})();
