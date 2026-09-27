/**
 * Extract everything from the CBSE Class 10 Science PDFs:
 *   - text layer  (per page + full document)  -> chapters/<slug>/text.txt, pages.json
 *   - page screenshots (raster renders)       -> chapters/<slug>/screenshots/pNNN.png
 *   - embedded images (diagrams/figures)      -> chapters/<slug>/images/
 *   - metadata (title, sha256, outline, ...)  -> chapters/<slug>/meta.json
 *   - manifest                                -> manifest.json
 *
 * Usage: node scripts/books/extract.cjs [--width 1240] [--no-images]
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PDFParse } = require('pdf-parse');

const ROOT = path.join(__dirname, '..', '..', 'books', 'cbse', 'class-10', 'science');
const SRC = path.join(ROOT, 'source');
const CH = path.join(ROOT, 'chapters');

const CHAP = [
  ['jesc1ps.pdf', '00-prelims', 'Front matter (foreword, preface, contents, committees)'],
  ['jesc101.pdf', '01-chemical-reactions-and-equations', 'Chemical Reactions and Equations'],
  ['jesc102.pdf', '02-acids-bases-and-salts', 'Acids, Bases and Salts'],
  ['jesc103.pdf', '03-metals-and-non-metals', 'Metals and Non-metals'],
  ['jesc104.pdf', '04-carbon-and-its-compounds', 'Carbon and its Compounds'],
  ['jesc105.pdf', '05-life-processes', 'Life Processes'],
  ['jesc106.pdf', '06-control-and-coordination', 'Control and Coordination'],
  ['jesc107.pdf', '07-how-do-organisms-reproduce', 'How do Organisms Reproduce?'],
  ['jesc108.pdf', '08-heredity', 'Heredity'],
  ['jesc109.pdf', '09-light-reflection-and-refraction', 'Light - Reflection and Refraction'],
  ['jesc110.pdf', '10-the-human-eye-and-the-colourful-world', 'The Human Eye and the Colourful World'],
  ['jesc111.pdf', '11-electricity', 'Electricity'],
  ['jesc112.pdf', '12-magnetic-effects-of-electric-current', 'Magnetic Effects of Electric Current'],
  ['jesc113.pdf', '13-our-environment', 'Our Environment'],
  ['jesc1an.pdf', '99-answers', 'Answers to Exercises'],
];

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const WIDTH = Number(arg('--width', '1240'));
const WITH_IMAGES = !process.argv.includes('--no-images');

const sha256 = (b) => crypto.createHash('sha256').update(b).digest('hex');
const clean = (s) => (s || '').replace(/\u0000/g, '').replace(/[ \t]+$/gm, '');

async function raceTimeout(promise, ms, label) {
  let t;
  try {
    return await Promise.race([promise, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${label} timeout (${ms}ms)`)), ms); })]);
  } finally {
    clearTimeout(t);
  }
}

async function processOne(file, slug, title) {
  const pdfPath = path.join(SRC, file);
  if (!fs.existsSync(pdfPath)) throw new Error(`missing source PDF: ${file}`);
  const buf = fs.readFileSync(pdfPath);
  const dir = path.join(CH, slug);
  const shotDir = path.join(dir, 'screenshots');
  const imgDir = path.join(dir, 'images');
  fs.mkdirSync(shotDir, { recursive: true });
  fs.mkdirSync(imgDir, { recursive: true });

  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    const info = await raceTimeout(parser.getInfo(), 60000, 'getInfo');
    const textRes = await raceTimeout(parser.getText({ pageJoiner: '\n' }), 120000, 'getText');
    const pages = textRes.pages || [];
    const total = pages.length;

    const pagesJson = pages.map((p, i) => ({ page: i + 1, chars: (p.text || '').length, text: clean(p.text) }));
    fs.writeFileSync(path.join(dir, 'pages.json'), JSON.stringify(pagesJson, null, 2), 'utf8');
    fs.writeFileSync(
      path.join(dir, 'text.txt'),
      pages.map((p, i) => `===== PAGE ${i + 1} / ${total} =====\n${clean(p.text)}`).join('\n\n'),
      'utf8',
    );

    let shotCount = 0;
    const BATCH = 8;
    for (let start = 1; start <= total; start += BATCH) {
      const partial = [];
      for (let n = start; n < Math.min(start + BATCH, total + 1); n++) partial.push(n);
      const shots = await raceTimeout(
        parser.getScreenshot({ partial, desiredWidth: WIDTH, imageBuffer: true, imageDataUrl: false }),
        180000,
        'getScreenshot',
      );
      for (const s of shots.pages) {
        fs.writeFileSync(path.join(shotDir, `p${String(s.pageNumber).padStart(3, '0')}.png`), Buffer.from(s.data));
        shotCount++;
      }
    }

    let imgCount = 0;
    let imageNote = 'ok';
    if (WITH_IMAGES) {
      try {
        const imgs = await raceTimeout(parser.getImage({ imageBuffer: true, imageDataUrl: false, imageThreshold: 120 }), 45000, 'getImage');
        for (const pg of imgs.pages || []) {
          for (const im of pg.images || []) {
            fs.writeFileSync(path.join(imgDir, `p${String(pg.pageNumber).padStart(3, '0')}_${imgCount}.png`), Buffer.from(im.data));
            imgCount++;
          }
        }
      } catch (e) {
        imageNote = e.message;
        console.log(`   [${slug}] embedded images skipped: ${e.message}`);
      }
    }

    const meta = {
      slug,
      title,
      sourceFile: path.relative(ROOT, pdfPath).replace(/\\/g, '/'),
      sha256: sha256(buf),
      bytes: buf.length,
      pages: total,
      pdfTitle: (info.info && info.info.Title) || '',
      author: (info.info && info.info.Author) || '',
      creator: (info.info && info.info.Creator) || '',
      producer: (info.info && info.info.Producer) || '',
      creationDate: (info.info && info.info.CreationDate) || '',
      outline: (info.outline || []).map((o) => ({ title: o.title, page: o.page, children: (o.items || []).length })),
      textChars: pages.reduce((a, p) => a + (p.text || '').length, 0),
      screenshots: shotCount,
      embeddedImages: imgCount,
      imageNote,
      screenshotWidth: WIDTH,
    };
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');
    console.log(
      `${slug.padEnd(44)} pages=${String(total).padStart(3)} text=${String(meta.textChars).padStart(6)} shots=${String(shotCount).padStart(3)} imgs=${String(imgCount).padStart(3)}`,
    );
    return meta;
  } finally {
    try { await parser.destroy(); } catch {}
  }
}

async function main() {
  fs.mkdirSync(CH, { recursive: true });
  const manifest = [];
  for (const [file, slug, title] of CHAP) {
    try {
      manifest.push(await processOne(file, slug, title));
    } catch (e) {
      console.log(`${slug.padEnd(44)} ERROR ${e.message}`);
      manifest.push({ slug, title, error: e.message });
    }
  }
  fs.writeFileSync(
    path.join(ROOT, 'manifest.json'),
    JSON.stringify(
      {
        board: 'CBSE',
        class: '10',
        subject: 'Science',
        edition: 'NCERT Science Textbook for Class X, Reprint 2026-27',
        extractedAt: new Date().toISOString(),
        tooling: { extract: 'scripts/books/extract.cjs (pdf-parse@2.4.5)', screenshot: `pdfjs render @${WIDTH}px width` },
        books: manifest,
        totals: {
          chapters: manifest.length,
          pages: manifest.reduce((a, m) => a + (m.pages || 0), 0),
          textChars: manifest.reduce((a, m) => a + (m.textChars || 0), 0),
          screenshots: manifest.reduce((a, m) => a + (m.screenshots || 0), 0),
          embeddedImages: manifest.reduce((a, m) => a + (m.embeddedImages || 0), 0),
        },
      },
      null,
      2,
    ),
    'utf8',
  );
  console.log('\nmanifest written -> books/cbse/class-10/science/manifest.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
