/**
 * Probe helper: find lines matching a regex across the pages of a book PDF.
 *
 * Usage: node scripts/books/probe-find.cjs --class 9 --subject english --file iebe104.pdf --re "Unit\s*\d+"
 */
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { resolveSubject, argOf } = require('./subjects.cjs');

const CLS = argOf(process.argv, '--class', '10');
const SUB = resolveSubject(argOf(process.argv, '--subject', 'science'), CLS);
const FILE = argOf(process.argv, '--file', '');
const RE = new RegExp(argOf(process.argv, '--re', 'Unit\\s*\\d+'), 'i');
const MAX = Number(argOf(process.argv, '--max', '12'));

(async () => {
  const buf = fs.readFileSync(path.join(SUB.source, FILE));
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    const textRes = await parser.getText({ pageJoiner: '\n' });
    const pages = textRes.pages || [];
    let hits = 0;
    pages.forEach((p, i) => {
      const lines = (p.text || '').split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
      for (const l of lines) {
        if (RE.test(l) && hits < MAX) {
          console.log(`p${i + 1}: ${l.slice(0, 180)}`);
          hits++;
        }
      }
    });
  } finally {
    try { await parser.destroy(); } catch {}
  }
})();
