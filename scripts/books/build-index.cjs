/**
 * Build the human-readable index for an extracted CBSE book:
 *   books/cbse/class-<n>/<subject>/README.md
 *
 * Pulls manifest.json + ocr/report.json and flags pages where OCR and the PDF
 * text layer disagree (low Dice similarity) so they can be reviewed by hand.
 *
 * Usage: node scripts/books/build-index.cjs [--subject science|mathematics|english] [--class 9|10]
 */
const fs = require('fs');
const path = require('path');

const { resolveSubject, argOf } = require('./subjects.cjs');
const SUBJECT = resolveSubject(argOf(process.argv, '--subject', 'science'), argOf(process.argv, '--class', '10'));
const ROOT = SUBJECT.root;
const CH = SUBJECT.chaptersDir;

const readJson = (p, fallback) => {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
};

function dirSize(dir) {
  let sum = 0;
  let count = 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else { sum += fs.statSync(p).size; count++; }
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return { bytes: sum, files: count };
}

/** Size of the source PDFs only (the source folder may also hold the artefacts). */
function pdfSize(dir) {
  let sum = 0;
  let count = 0;
  if (fs.existsSync(dir)) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isFile() || !e.name.toLowerCase().endsWith('.pdf')) continue;
      sum += fs.statSync(path.join(dir, e.name)).size;
      count++;
    }
  }
  return { bytes: sum, files: count };
}

const SIM_THRESHOLD = 0.85;

function main() {
  const manifest = readJson(path.join(ROOT, 'manifest.json'), null);
  if (!manifest) {
    console.error('manifest.json not found - run `pnpm books:extract` first');
    process.exit(1);
  }
  const ocr = readJson(path.join(ROOT, 'ocr', 'report.json'), null);

  const ocrBySlug = new Map((ocr?.chapters || []).map((c) => [c.slug, c]));

  const rows = [];
  const lowAgreement = [];
  let ocrOnlyPages = 0;
  let mergedChars = 0;
  let mergedOcrPages = 0;

  for (const b of manifest.books) {
    const dir = path.join(CH, b.slug);
    const o = ocrBySlug.get(b.slug) || null;
    const layer = readJson(path.join(dir, 'pages.json'), []);
    const ocrPages = readJson(path.join(dir, 'ocr', 'pages.json'), []);
    const ocrByPage = new Map(ocrPages.map((p) => [p.page, p]));

    for (const p of ocrPages) {
      if (p.similarity != null && p.similarity < SIM_THRESHOLD) {
        lowAgreement.push({
          slug: b.slug,
          page: p.page,
          similarity: p.similarity,
          confidence: p.confidence,
          layerChars: p.textLayerChars,
        });
      }
      if ((p.textLayerChars || 0) < 50) ocrOnlyPages++;
    }

    // Highest-accuracy merged text: text layer when present, OCR when the page
    // is a scan/photo (no usable text layer).
    const merged = [];
    for (const lp of layer) {
      const op = ocrByPage.get(lp.page);
      const useOcr = (lp.text || '').trim().length < 50 && op && (op.text || '').trim().length > 20;
      if (useOcr) {
        mergedOcrPages++;
        merged.push(`===== PAGE ${lp.page} / ${layer.length} [source: OCR] =====\n${op.text.trim()}`);
      } else {
        merged.push(`===== PAGE ${lp.page} / ${layer.length} [source: pdf-text] =====\n${(lp.text || '').trim()}`);
      }
    }
    // OCR-only pages not represented in the text layer at all
    for (const op of ocrPages) {
      if (!layer.find((lp) => lp.page === op.page) && (op.text || '').trim().length > 20) {
        mergedOcrPages++;
        merged.push(`===== PAGE ${op.page} [source: OCR, not in text layer] =====\n${op.text.trim()}`);
      }
    }
    const mergedText = merged.join('\n\n');
    fs.writeFileSync(path.join(dir, 'text.merged.txt'), mergedText, 'utf8');
    mergedChars += mergedText.length;

    const shots = b.screenshots || 0;
    const imgs = b.embeddedImages || 0;
    rows.push({ ...b, ocrConfidence: o ? o.avgConfidence : null, ocrSimilarity: o ? o.avgTextLayerSimilarity : null, shots, imgs });
  }

  lowAgreement.sort((a, b) => a.similarity - b.similarity);

  const srcSize = pdfSize(SUBJECT.source);
  const shotSize = manifest.books.reduce(
    (acc, b) => {
      const s = dirSize(path.join(CH, b.slug, 'screenshots'));
      return { bytes: acc.bytes + s.bytes, files: acc.files + s.files };
    },
    { bytes: 0, files: 0 },
  );
  const imgSize = manifest.books.reduce(
    (acc, b) => {
      const s = dirSize(path.join(CH, b.slug, 'images'));
      return { bytes: acc.bytes + s.bytes, files: acc.files + s.files };
    },
    { bytes: 0, files: 0 },
  );
  const totalSize = dirSize(ROOT);

  const lines = [];
  const classLabel = String(manifest.class ?? SUBJECT.classNumber);
  const sourcePath = path.relative(ROOT, SUBJECT.source).replace(/\\/g, '/');
  const sourceRow = sourcePath ? `${sourcePath}/*.pdf` : '*.pdf';
  const sourceCount = manifest.books.filter((b) => !b.error).length;
  lines.push(`# CBSE / Class ${classLabel} / ${manifest.subject} — extracted book data`);
  lines.push('');
  lines.push(`**Board** ${manifest.board} &nbsp;·&nbsp; **Class** ${classLabel} &nbsp;·&nbsp; **Subject** ${manifest.subject}`);
  lines.push('');
  lines.push(`**Edition**: ${manifest.edition}`);
  lines.push('');
  lines.push(`**Extracted**: ${manifest.extractedAt}`);
  lines.push('');
  lines.push('## What is in here');
  lines.push('');
  lines.push('| Path | Contents |');
  lines.push('|---|---|');
  lines.push(`| \`${sourceRow}\` | Original NCERT PDFs (${sourceCount}), untouched, SHA-256 recorded in each \`meta.json\` |`);
  lines.push('| `chapters/<slug>/text.txt` | **Copy-paste text** — PDF text layer, page-delimited |');
  lines.push('| `chapters/<slug>/text.merged.txt` | **Highest-accuracy text** — text layer, falling back to OCR on scan/photo pages |');
  lines.push('| `chapters/<slug>/pages.json` | Same text split per page (`{page, chars, text}`) |');
  lines.push('| `chapters/<slug>/screenshots/pNNN.png` | **Page screenshots** rendered at 1240 px width (~A4 @ 150 dpi) |');
  lines.push('| `chapters/<slug>/images/` | Embedded diagrams/figures pulled out of the PDF |');
  lines.push('| `chapters/<slug>/ocr/text.txt` | **OCR** of the page screenshots (English, tesseract.js v7) |');
  lines.push('| `chapters/<slug>/ocr/pages.json` | Per-page OCR + confidence + agreement with the text layer |');
  lines.push('| `chapters/<slug>/meta.json` | Page count, SHA-256, PDF metadata, outline |');
  lines.push('| `manifest.json` | Machine-readable index of all of the above |');
  lines.push('| `ocr/report.json` | OCR quality report (confidence + similarity per chapter) |');
  lines.push('| `qc.json` | Quality-control summary + low-agreement page list |');
  const notesDir = path.join(ROOT, 'notes');
  if (fs.existsSync(notesDir)) {
    lines.push('| `notes/*.md` | **Structured study guides** — section outline, definitions, every equation/numerical, every activity, every question, figure descriptions, misconception traps, CBSE exam signals |');
  }
  lines.push('');

  if (fs.existsSync(notesDir)) {
    const noteFiles = fs.readdirSync(notesDir).filter((f) => f.endsWith('.md')).sort();
    if (noteFiles.length) {
      lines.push('### Study notes');
      lines.push('');
      lines.push('| Notes file | Chapters | Size |');
      lines.push('|---|---|---:|');
      for (const f of noteFiles) {
        const b = fs.statSync(path.join(notesDir, f)).size;
        const label = f
          .replace(/\.md$/, '')
          .replace(/^(\d\d)-(\d\d)-/, 'Ch $1–$2: ')
          .replace(/^(\d\d)-/, 'Ch $1: ')
          .replace(/-/g, ' ');
        lines.push(`| \`notes/${f}\` | ${label} | ${(b / 1024).toFixed(0)} KB |`);
      }
      lines.push('');
    }
  }

  lines.push('## Regenerating');
  lines.push('');
  lines.push('```bash');
  lines.push(`node scripts/books/extract.cjs --subject ${SUBJECT.slug} --class ${classLabel}   # text + screenshots + images + manifest`);
  lines.push(`node scripts/books/ocr.cjs --subject ${SUBJECT.slug} --class ${classLabel} --workers 4   # OCR pass + cross-check (slow)`);
  lines.push(`node scripts/books/build-index.cjs --subject ${SUBJECT.slug} --class ${classLabel}   # rebuild this file`);
  lines.push('```');
  lines.push('');
  lines.push('## Chapter index');
  lines.push('');
  lines.push('| # | Slug | Title | Pages | Text chars | Screenshots | Images | OCR conf | Layer↔OCR similarity |');
  lines.push('|---:|---|---|---:|---:|---:|---:|---:|---:|');
  let totalPages = 0;
  let totalChars = 0;
  let totalShots = 0;
  let totalImgs = 0;
  for (const r of rows) {
    const n = r.slug.slice(0, 2);
    totalPages += r.pages || 0;
    totalChars += r.textChars || 0;
    totalShots += r.shots || 0;
    totalImgs += r.imgs || 0;
    lines.push(
      `| ${n} | \`${r.slug}\` | ${r.title} | ${r.pages} | ${r.textChars} | ${r.shots} | ${r.imgs} | ` +
        `${r.ocrConfidence != null ? r.ocrConfidence.toFixed(1) : '—'} | ` +
        `${r.ocrSimilarity != null ? r.ocrSimilarity.toFixed(3) : '—'} |`,
    );
  }
  lines.push(`| | **Total** | | **${totalPages}** | **${totalChars}** | **${totalShots}** | **${totalImgs}** | **${ocr ? ocr.avgConfidence.toFixed(1) : '—'}** | **${ocr ? ocr.avgSimilarity.toFixed(3) : '—'}** |`);
  lines.push('');
  lines.push('## Accuracy / quality');
  lines.push('');
  if (ocr) {
    lines.push(`- OCR ran on **${ocr.pages}** rendered pages, average confidence **${ocr.avgConfidence}**.`);
    lines.push(`- Agreement between the PDF text layer and OCR (Dice coefficient on normalised text): **${ocr.avgSimilarity}**.`);
    lines.push(`- Pages where the two sources disagree below **${SIM_THRESHOLD}**: **${lowAgreement.length}**.`);
    lines.push(`- Pages with an unusable text layer (image-only scans) where **OCR is the only source**: **${ocrOnlyPages}**.`);
    lines.push(`- Merged text (` + '`text.merged.txt`' + `): **${mergedChars}** chars, with **${mergedOcrPages}** pages taken from OCR.`);
    lines.push('');
    if (lowAgreement.length) {
      lines.push('<details><summary>Low-agreement pages (review these by eye)</summary>');
      lines.push('');
      lines.push('| Chapter | Page | Similarity | OCR confidence | Text-layer chars |');
      lines.push('|---|---:|---:|---:|---:|');
      for (const l of lowAgreement.slice(0, 80)) {
        lines.push(`| \`${l.slug}\` | ${l.page} | ${l.similarity.toFixed(3)} | ${l.confidence} | ${l.layerChars} |`);
      }
      if (lowAgreement.length > 80) lines.push(`| … | | | | ${lowAgreement.length - 80} more in \`ocr/report.json\` |`);
      lines.push('');
      lines.push('</details>');
      lines.push('');
    }
    lines.push('Notes:');
    lines.push('');
    lines.push('- The **text layer** is authoritative for prose; OCR is the cross-check and the fallback for figure labels.');
    lines.push('- Equations, subscripts and superscripts do not survive plain-text extraction; use the **screenshots** for anything formula-shaped.');
    lines.push('- Low-agreement pages are cover/title/committee pages: the PDF has almost no text there, so OCR is the only copy.');
    const extraNote = rows.find((r) => r.slug.startsWith('99-'));
    if (extraNote) {
      lines.push(`- \`${extraNote.slug}\` is a compact back-matter booklet scanned at a different scale, so its OCR confidence is much lower than the chapters.`);
    }
    const vectorOnly = rows.filter((r) => !r.imgs).map((r) => `\`${r.slug}\``);
    if (vectorOnly.length) {
      lines.push(`- ${vectorOnly.join(', ')}: no raster images - the figures are vector drawings, visible only in the screenshots.`);
    }
    lines.push('');
  } else {
    lines.push('- OCR has not been run yet — `pnpm books:ocr`.');
    lines.push('');
  }
  lines.push('## Size');
  lines.push('');
  lines.push(`- Source PDFs: ${(srcSize.bytes / 1048576).toFixed(1)} MB (${srcSize.files} files)`);
  lines.push(`- Page screenshots: ${(shotSize.bytes / 1048576).toFixed(1)} MB (${shotSize.files} files)`);
  lines.push(`- Embedded images: ${(imgSize.bytes / 1048576).toFixed(1)} MB (${imgSize.files} files)`);
  lines.push(`- Whole tree: ${(totalSize.bytes / 1048576).toFixed(1)} MB (${totalSize.files} files)`);
  lines.push('');
  lines.push('> This folder is **git-ignored** (see root `.gitignore`): it is local source');
  lines.push('> material plus regenerable artefacts, not application code.');
  lines.push('');

  fs.writeFileSync(path.join(ROOT, 'README.md'), lines.join('\n'), 'utf8');

  const qc = {
    generatedAt: new Date().toISOString(),
    board: manifest.board,
    class: classLabel,
    subject: manifest.subject,
    edition: manifest.edition,
    totals: { chapters: rows.length, pages: totalPages, textChars: totalChars, screenshots: totalShots, embeddedImages: totalImgs },
    ocr: ocr
      ? {
          pages: ocr.pages,
          avgConfidence: ocr.avgConfidence,
          avgSimilarity: ocr.avgSimilarity,
          lowAgreementPages: lowAgreement.length,
          ocrOnlyPages,
          mergedChars,
          mergedOcrPages,
        }
      : null,
    lowAgreement,
    size: { sourceBytes: srcSize.bytes, screenshotBytes: shotSize.bytes, imageBytes: imgSize.bytes, totalBytes: totalSize.bytes },
  };
  fs.writeFileSync(path.join(ROOT, 'qc.json'), JSON.stringify(qc, null, 2), 'utf8');

  console.log(`README.md + qc.json written`);
  console.log(`  chapters=${rows.length} pages=${totalPages} chars=${totalChars} shots=${totalShots} images=${totalImgs}`);
  console.log(`  low-agreement pages (<${SIM_THRESHOLD}): ${lowAgreement.length}`);
}

main();
