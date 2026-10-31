const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PDFParse } = require('pdf-parse');
const { resolveSubject, argOf } = require('./subjects.cjs');
const { pdfjsAssetOptions } = require('./pdfjs-assets.cjs');

/**
 * Extract everything from a CBSE book (any subject, any class):
 *   - text layer  (per page + full document)  -> chapters/<slug>/text.txt, pages.json
 *   - page screenshots (raster renders)       -> chapters/<slug>/screenshots/pNNN.png
 *   - embedded images (diagrams/figures)      -> chapters/<slug>/images/
 *   - metadata (title, sha256, outline, ...)  -> chapters/<slug>/meta.json
 *   - manifest                                -> manifest.json
 *
 * Usage: node scripts/books/extract.cjs [--subject science|mathematics|english] [--class 9|10] [--width 1240] [--no-images]
 */
const SUBJECT_SLUG = argOf(process.argv, '--subject', 'science');
const CLASS_NUMBER = argOf(process.argv, '--class', '10');
const SUBJECT = resolveSubject(SUBJECT_SLUG, CLASS_NUMBER);
const ROOT = SUBJECT.root;
const SRC = SUBJECT.source;
const CH = SUBJECT.chaptersDir;
const CHAP = SUBJECT.chapters;

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const WIDTH = Number(arg('--width', '1240'));
const WITH_IMAGES = !process.argv.includes('--no-images');
// image extraction re-rasterises every embedded bitmap - the bigger books need more than a minute
const IMAGE_TIMEOUT = Number(arg('--image-timeout', '300000'));

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
  // a re-run must not leave figures of a previous extraction behind
  for (const f of fs.readdirSync(imgDir)) {
    if (f.endsWith('.png')) fs.unlinkSync(path.join(imgDir, f));
  }

  const parser = new PDFParse({ data: new Uint8Array(buf), ...pdfjsAssetOptions() });
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
    const imageErrors = [];
    const collectImages = async (partial) => {
      const imgs = await raceTimeout(
        parser.getImage({ partial, imageBuffer: true, imageDataUrl: false, imageThreshold: 120 }),
        IMAGE_TIMEOUT,
        'getImage',
      );
      for (const pg of imgs.pages || []) {
        for (const im of pg.images || []) {
          fs.writeFileSync(path.join(imgDir, `p${String(pg.pageNumber).padStart(3, '0')}_${imgCount}.png`), Buffer.from(im.data));
          imgCount++;
        }
      }
    };
    if (WITH_IMAGES) {
      // page by page in small batches: one slow or broken page must not lose the whole chapter
      for (let start = 1; start <= total; start += BATCH) {
        const partial = [];
        for (let n = start; n < Math.min(start + BATCH, total + 1); n++) partial.push(n);
        try {
          await collectImages(partial);
        } catch (e) {
          // a single unresolvable image breaks the whole batch - retry page by page
          for (const page of partial) {
            try {
              await collectImages([page]);
            } catch (pageErr) {
              imageErrors.push(`page ${page}: ${pageErr.message}`);
            }
          }
        }
      }
    }
    const imageNote = imageErrors.length
      ? `${imageErrors.length} page(s) failed: ${imageErrors.slice(0, 5).join(' | ')}${imageErrors.length > 5 ? ' | …' : ''}`
      : 'ok';
    if (imageErrors.length) {
      console.log(`   [${slug}] embedded images: ${imgCount} extracted, ${imageErrors.length} page(s) failed -> ${imageNote}`);
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
        class: String(SUBJECT.classNumber),
        subject: SUBJECT.label,
        edition: SUBJECT.edition,
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
  console.log(`\nmanifest written -> books/cbse/${SUBJECT.classDirName}/${SUBJECT.folder}/manifest.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
