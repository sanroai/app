/**
 * Probe helper: print the first pages of a book PDF (text layer + outline) so
 * the chapter registry can be verified against the real files.
 *
 * Usage: node scripts/books/probe-class.cjs --class 9 --subject science [--pages 4] [--file iesc101.pdf]
 */
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const { resolveSubject, argOf } = require('./subjects.cjs');

const CLS = argOf(process.argv, '--class', '10');
const SUB = resolveSubject(argOf(process.argv, '--subject', 'science'), CLS);
const PAGES = Number(argOf(process.argv, '--pages', '4'));
const ONLY = argOf(process.argv, '--file', '');

(async () => {
  const files = fs
    .readdirSync(SUB.source)
    .filter((f) => f.toLowerCase().endsWith('.pdf'))
    .sort();
  for (const file of files) {
    if (ONLY && file !== ONLY) continue;
    const buf = fs.readFileSync(path.join(SUB.source, file));
    const parser = new PDFParse({ data: new Uint8Array(buf) });
    try {
      const info = await parser.getInfo();
      const textRes = await parser.getText({ pageJoiner: '\n' });
      const pages = textRes.pages || [];
      const totalChars = pages.reduce((a, p) => a + (p.text || '').length, 0);
      console.log(`\n===== ${file} | pages=${pages.length} | textChars=${totalChars} =====`);
      console.log(`  pdfTitle=${JSON.stringify((info.info && info.info.Title) || '')}`);
      const outline = (info.outline || []).map((o) => `${o.title} (p${o.page})`);
      if (outline.length) console.log(`  outline: ${outline.join(' | ')}`);
      for (const p of pages.slice(0, PAGES)) {
        const lines = (p.text || '')
          .split('\n')
          .map((l) => l.replace(/\s+/g, ' ').trim())
          .filter((l) => l.length > 1);
        console.log(`  --- page ${p.pageNumber} (chars=${(p.text || '').length}) ---`);
        console.log('    ' + lines.slice(0, 14).join('\n    ').slice(0, 1400));
      }
    } catch (e) {
      console.log(`\n===== ${file} ERROR ${e.message} =====`);
    } finally {
      try { await parser.destroy(); } catch {} }
  }
})();
