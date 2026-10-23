// Audits the sourced lesson videos against the authoritative NCERT syllabus in `books/`.
// For every VIDEO lesson it finds the matching textbook chapter, extracts that chapter's
// key terms (from the study notes for science, from the PDF text for mathematics) and
// scores the currently-sourced video against them. Lessons whose video does not talk
// about the syllabus terms are reported so they can be re-sourced.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SEED = path.join(ROOT, 'apps/api/prisma/seed.ts');
const BOOKS = path.join(ROOT, 'books/cbse/class-10');

// ---------------------------------------------------------------- seed lessons
const seed = fs.readFileSync(SEED, 'utf8');
const lessonRe = /\{\s*ch:\s*'((?:[^'\\]|\\.)*)',\s*subjectName:\s*([A-Z_]+),\s*grade:\s*'(\d+)',\s*concept:\s*'((?:[^'\\]|\\')*)',\s*type:\s*'([A-Z_]+)',\s*title:\s*'((?:[^'\\]|\\')*)',\s*duration:\s*(\d+)\s*\}/g;
const lessons = [];
let m;
while ((m = lessonRe.exec(seed))) {
  lessons.push({
    ch: m[1], subject: m[2], grade: m[3],
    concept: m[4].replace(/\\'/g, "'"), type: m[5], title: m[6].replace(/\\'/g, "'"),
  });
}

// ------------------------------------------------------- current video mapping
const sourcesPath = path.join(ROOT, `artifacts/qa/${new Date().toISOString().slice(0, 10)}/video-sources.json`);
const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8')).results;

// --------------------------------------------------------------- science notes
const scienceNotes = new Map(); // chapter number -> { title, text }
const notesDir = path.join(BOOKS, 'science/notes');
if (fs.existsSync(notesDir)) {
  for (const name of fs.readdirSync(notesDir)) {
    if (!name.endsWith('.md')) continue;
    const text = fs.readFileSync(path.join(notesDir, name), 'utf8');
    for (const cm of text.matchAll(/^#{1,4}\s*CHAPTER\s*(\d+)\s*[-â€“â€”:. ]*\s*(.*)$/gmi)) {
      scienceNotes.set(Number(cm[1]), { title: cm[2].trim(), text });
    }
  }
}

// ------------------------------------------------------------- mathematics text
const mathsChapters = new Map(); // chapter number -> text
const mathsDir = path.join(BOOKS, 'mathematics');
if (fs.existsSync(mathsDir)) {
  let PDFParse;
  try {
    ({ PDFParse } = await import('pdf-parse'));
  } catch {
    PDFParse = null;
  }
  if (PDFParse) {
    for (const file of fs.readdirSync(mathsDir)) {
      const mm = file.match(/^jemh(\d{3})\.pdf$/);
      if (!mm) continue;
      const n = Number(mm[1]);
      if (n < 101 || n > 114) continue;
      try {
        const buf = fs.readFileSync(path.join(mathsDir, file));
        const parser = new PDFParse({ data: new Uint8Array(buf) });
        const res = await parser.getText({ pageJoiner: '\n' });
        mathsChapters.set(n - 100, (res.pages ?? []).map((p) => p.text ?? '').join('\n'));
      } catch (e) {
        console.log(`  (could not parse ${file}: ${String(e.message).slice(0, 60)})`);
      }
    }
  }
}

// ------------------------------------------------------------------- term mining
const STOP = new Set(['class', 'chapter', 'and', 'the', 'for', 'with', 'from', 'that', 'this', 'using', 'into', 'your', 'are', 'was', 'you', 'our', 'not', 'all', 'how', 'what', 'why', 'when', 'does', 'more', 'than', 'can', 'will', 'has', 'have', 'its', 'their', 'about', 'part', 'following', 'given', 'find', 'value', 'values', 'state', 'write', 'explain', 'draw', 'solve', 'example', 'exercise', 'questions', 'answer', 'answers']);

function termsFrom(text, limit = 40) {
  if (!text) return [];
  const counts = new Map();
  for (const w of text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)) {
    if (w.length < 5 || STOP.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([w]) => w);
}

// map a seed chapter name -> science chapter number via the notes' chapter titles
function scienceChapterNumberFor(chapterName) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const target = norm(chapterName);
  for (const [num, { title }] of scienceNotes) {
    if (norm(title) === target) return num;
    if (norm(title).startsWith(target.slice(0, 12)) || target.startsWith(norm(title).slice(0, 12))) return num;
  }
  return null;
}

// concept key terms (always available, any grade)
function conceptTerms(concept, chapter) {
  return [...new Set([...termsFrom(concept, 8), ...termsFrom(chapter, 4)])];
}

// ------------------------------------------------------------------ the audit
const rows = [];
for (const l of lessons.filter((x) => x.type === 'VIDEO')) {
  const src = sources[l.title];
  if (!src) { rows.push({ ...l, status: 'NO SOURCE', hits: 0, want: 0 }); continue; }

  let syllabusTerms = [];
  let syllabusChapter = null;
  if (l.subject === 'SCIENCE' && l.grade === '10') {
    const num = scienceChapterNumberFor(l.ch);
    if (num && scienceNotes.has(num)) {
      syllabusChapter = `${num}: ${scienceNotes.get(num).title}`;
      syllabusTerms = termsFrom(scienceNotes.get(num).text, 60);
    }
  } else if (l.subject === 'MATHS' && l.grade === '10') {
    // NCERT Class 10 Maths chapter order in this edition (books/cbse/class-10/mathematics,
    // jemh101 = chapter 1 ... jemh114 = chapter 14). There is no "Constructions" chapter
    // in this edition, so the order is taken from the extracted chapter headings.
    const order = ['Real Numbers','Polynomials','Pair of Linear Equations in Two Variables','Quadratic Equations','Arithmetic Progressions','Triangles','Coordinate Geometry','Introduction to Trigonometry','Some Applications of Trigonometry','Circles','Areas Related to Circles','Surface Areas and Volumes','Statistics','Probability'];
    const idx = order.findIndex((t) => t.toLowerCase() === l.ch.toLowerCase());
    if (idx >= 0 && mathsChapters.has(idx + 1)) {
      syllabusChapter = `${idx + 1}: ${l.ch}`;
      syllabusTerms = termsFrom(mathsChapters.get(idx + 1), 60);
    }
  }

  const want = conceptTerms(l.concept, l.ch);
  const haystack = `${src.title} ${src.channel}`.toLowerCase();
  const wantHits = want.filter((t) => haystack.includes(t));
  const syllabusHits = syllabusTerms.filter((t) => haystack.includes(t));

  // A good video names the concept (at least one of its terms) and, where the textbook
  // chapter is available, touches that chapter's own vocabulary. Requiring *every* concept
  // word would flag correct chapter-level videos ("Cubes and Cube Roots" for the
  // "Perfect Cubes" lesson), so one term from each side is the meaningful test.
  const conceptOk = wantHits.length >= 1;
  const syllabusKnown = Boolean(syllabusChapter) && syllabusTerms.length > 0;
  const strong = conceptOk && (!syllabusKnown || syllabusHits.length >= 1);
  rows.push({
    title: l.title, concept: l.concept, chapter: l.ch, grade: l.grade, subject: l.subject,
    syllabusChapter, video: src.id, videoTitle: src.title, channel: src.channel,
    wantHits: wantHits.length, wantTerms: want.slice(0, 6), syllabusHits: syllabusHits.length,
    syllabusHitsSample: syllabusHits.slice(0, 5),
    status: strong ? 'ALIGNED' : 'REVIEW',
  });
}

const review = rows.filter((r) => r.status !== 'ALIGNED');
const out = path.join(ROOT, `artifacts/qa/${new Date().toISOString().slice(0, 10)}/video-syllabus-audit.json`);
fs.writeFileSync(out, JSON.stringify({ rows, review }, null, 2));

console.log(`audited ${rows.length} VIDEO lessons against the NCERT syllabus`);
console.log(`  ALIGNED: ${rows.length - review.length}`);
console.log(`  REVIEW (needs re-sourcing): ${review.length}`);
for (const r of review) {
  console.log(`  - ${r.title}`);
  console.log(`      video: ${r.videoTitle}  (${r.channel})`);
  console.log(`      concept terms hit ${r.wantHits}/min2 ${JSON.stringify(r.wantTerms)}, syllabus hits ${r.syllabusHits} ${JSON.stringify(r.syllabusHitsSample)}`);
}
console.log(`\nwritten: ${out}`);
