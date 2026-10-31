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
      const textRes = await parser.getText({ pageJoiner: '\n' });
      const pages = textRes.pages || [];
      console.log(`\n  === ${file} ===`);
      for (const p of pages.slice(1, 4)) {
        const lines = (p.text || '')
          .split('\n')
          .map((l) => l.replace(/\s+/g, ' ').trim())
          .filter((l) => l.length > 2 && l.length < 70);
        console.log(`    p${p.pageNumber}: ${lines.slice(0, 6).join(' | ').slice(0, 230)}`);
      }
    } finally {
      try { await parser.destroy(); } catch {}
    }
  }
})();
