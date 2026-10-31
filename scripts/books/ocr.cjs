/**
 * OCR pass over the rendered page screenshots + cross-check against the
 * PDF text layer, for any CBSE subject / class.
 *
 * Usage:  node scripts/books/ocr.cjs [--subject science|mathematics|english] [--class 9|10] [--workers N] [--limit N]
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { createWorker } = require('tesseract.js');

const { resolveSubject, argOf } = require('./subjects.cjs');
const SUBJECT = resolveSubject(argOf(process.argv, '--subject', 'science'), argOf(process.argv, '--class', '10'));
const ROOT = SUBJECT.root;
const CH = SUBJECT.chaptersDir;

function parseArgs(argv) {
  const out = { workers: 4, limit: 0 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--workers') out.workers = Number(argv[++i]) || 4;
    if (argv[i] === '--limit') out.limit = Number(argv[++i]) || 0;
  }
  return out;
}

/** Normalise for comparison: lowercase, collapse to alphanumerics + spaces. */
function norm(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Dice coefficient over character bigrams — robust to reflow differences. */
function dice(a, b) {
  const A = norm(a);
  const B = norm(b);
  if (A.length < 2 || B.length < 2) return A === B ? 1 : 0;
  const grams = (s) => {
    const m = new Map();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      m.set(g, (m.get(g) || 0) + 1);
    }
    return m;
  };
  const ga = grams(A);
  const gb = grams(B);
  let overlap = 0;
  for (const [g, n] of ga) {
    const m = gb.get(g);
    if (m) overlap += Math.min(n, m);
  }
  const totalA = A.length - 1;
  const totalB = B.length - 1;
  return (2 * overlap) / (totalA + totalB);
}

async function preprocess(pngPath, outPath) {
  await sharp(pngPath)
    .grayscale()
    .normalize()
    .sharpen({ sigma: 0.7 })
    .toFile(outPath);
}

async function makeWorker() {
  return createWorker('eng', 1, {
    // keep the traineddata cache inside the tooling folder
    cachePath: path.join(__dirname, '..', '..', '.cache', 'tesseract'),
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));

  const work = [];
  for (const book of manifest.books) {
    if (book.error) continue;
    const shotDir = path.join(CH, book.slug, 'screenshots');
    if (!fs.existsSync(shotDir)) continue;
    const files = fs.readdirSync(shotDir).filter((f) => f.endsWith('.png')).sort();
    for (const f of files) work.push({ slug: book.slug, file: path.join(shotDir, f), page: Number(f.replace(/\D/g, '')) });
  }
  if (args.limit) work.length = Math.min(work.length, args.limit);
  console.log(`OCR: ${work.length} pages, ${args.workers} workers`);

  const tmpDir = path.join(__dirname, '..', '..', '.cache', 'ocr-input');
  fs.mkdirSync(tmpDir, { recursive: true });

  const resultsBySlug = new Map();
  let done = 0;
  const started = Date.now();

  async function runWorker() {
    const worker = await makeWorker();
    for (;;) {
      const item = work.pop();
      if (!item) break;
      const tmp = path.join(tmpDir, `${item.slug}_p${String(item.page).padStart(3, '0')}.png`);
      try {
        await preprocess(item.file, tmp);
        const t0 = Date.now();
        const r = await worker.recognize(tmp);
        const ms = Date.now() - t0;
        if (!resultsBySlug.has(item.slug)) resultsBySlug.set(item.slug, []);
        resultsBySlug.get(item.slug).push({
          page: item.page,
          text: r.data.text,
          confidence: Number(r.data.confidence.toFixed(2)),
          ocrMs: ms,
          textLayerChars: 0,
          similarity: null,
        });
        done++;
        if (done % 20 === 0 || done === (args.limit || Infinity)) {
          const rate = done / ((Date.now() - started) / 1000);
          console.log(`  ${done} pages, ${rate.toFixed(1)} pages/s, ETA ${Math.round((work.length / Math.max(rate, 0.01)) / 60)} min`);
        }
      } catch (e) {
        console.error(`  page failed ${item.slug}/p${item.page}: ${e.message}`);
      } finally {
        try { fs.unlinkSync(tmp); } catch {}
      }
    }
    await worker.terminate();
  }

  await Promise.all(Array.from({ length: Math.max(1, args.workers) }, () => runWorker()));

  // ---- write per-chapter OCR + cross-check against text layer ----
  const report = {
    generatedAt: new Date().toISOString(),
    class: String(SUBJECT.classNumber),
    subject: SUBJECT.label,
    edition: SUBJECT.edition,
    pages: 0,
    avgConfidence: 0,
    avgSimilarity: 0,
    chapters: [],
  };
  let confSum = 0;
  let simSum = 0;
  let simN = 0;

  for (const book of manifest.books) {
    const rows = resultsBySlug.get(book.slug);
    if (!rows || !rows.length) continue;
    rows.sort((a, b) => a.page - b.page);

    const dir = path.join(CH, book.slug);
    const layerPath = path.join(dir, 'pages.json');
    const layer = fs.existsSync(layerPath) ? JSON.parse(fs.readFileSync(layerPath, 'utf8')) : [];
    const layerByPage = new Map(layer.map((p) => [p.page, p.text]));

    let chConf = 0;
    let chSim = 0;
    let chSimN = 0;
    for (const r of rows) {
      const lt = layerByPage.get(r.page) || '';
      r.textLayerChars = lt.length;
      r.similarity = Number(dice(lt, r.text).toFixed(4));
      chConf += r.confidence;
      confSum += r.confidence;
      if (r.similarity > 0) {
        chSim += r.similarity;
        simSum += r.similarity;
        simN++;
        chSimN++;
      }
    }

    const ocrDir = path.join(dir, 'ocr');
    fs.mkdirSync(ocrDir, { recursive: true });
    fs.writeFileSync(path.join(ocrDir, 'pages.json'), JSON.stringify(rows.map(({ page, text, confidence, ocrMs, textLayerChars, similarity }) => ({ page, text, confidence, ocrMs, textLayerChars, similarity })), null, 2), 'utf8');
    fs.writeFileSync(path.join(ocrDir, 'text.txt'), rows.map((r) => `===== PAGE ${r.page} (ocr confidence ${r.confidence}) =====\n${r.text}`).join('\n\n'), 'utf8');

    const cAvg = chConf / rows.length;
    const sAvg = chSimN ? chSim / chSimN : 0;
    report.pages += rows.length;
    report.chapters.push({ slug: book.slug, pages: rows.length, avgConfidence: Number(cAvg.toFixed(2)), avgTextLayerSimilarity: Number(sAvg.toFixed(4)) });
    console.log(`${book.slug.padEnd(44)} pages=${String(rows.length).padStart(3)} conf=${cAvg.toFixed(1)} similarity=${sAvg.toFixed(3)}`);
  }

  report.avgConfidence = Number((confSum / report.pages).toFixed(2));
  report.avgSimilarity = simN ? Number((simSum / simN).toFixed(4)) : 0;
  const ocrRoot = path.join(ROOT, 'ocr');
  fs.mkdirSync(ocrRoot, { recursive: true });
  fs.writeFileSync(path.join(ocrRoot, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nOCR complete: ${report.pages} pages, avg confidence ${report.avgConfidence}, avg text-layer similarity ${report.avgSimilarity}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
