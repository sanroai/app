const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const DIR = path.join(__dirname, '..', '..', 'books', 'cbse', 'class-10', 'english');

(async () => {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.pdf')).sort();
  for (const file of files) {
    const buf = fs.readFileSync(path.join(DIR, file));
    const parser = new PDFParse({ data: new Uint8Array(buf) });
    try {
      const info = await parser.getInfo();
      const textRes = await parser.getText({ pageJoiner: '\n' });
      const pages = textRes.pages || [];
      const first = (pages[0]?.text || '').replace(/\s+/g, ' ').trim();
      const outline = (info.outline || []).map((o) => o.title).slice(0, 8);
      console.log(`\n  ${file}  pages=${pages.length}  title="${(info.info && info.info.Title) || ''}"`);
      console.log(`    outline: ${outline.join(' | ').slice(0, 220)}`);
      console.log(`    first page: ${first.slice(0, 200)}`);
      const chars = pages.reduce((a, p) => a + (p.text || '').length, 0);
      console.log(`    text chars: ${chars}`);
    } finally {
      try { await parser.destroy(); } catch {}
    }
  }
})();
