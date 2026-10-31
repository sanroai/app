// Replace a grade's whole curriculum block in the seed with a fragment.
//
//   node scripts/qa/realign-grade.mjs --grades 5,6,7 [--dir artifacts/qa/<date>] [--dry]
//
// A fragment is artifacts/qa/<date>/seed-grade-<n>.json:
//
//   {
//     "grade": "5",
//     "curriculum": { "Science": [ { name, code, topics: [ { name, concepts: [] } ] } ], ... },
//     "contentNodes": [ { ch, subjectName, grade, concept, type, title, duration } ],
//     "notesTexts": { "<chapter> - Study Notes": "## markdown" }
//   }
//
// Unlike merge-seed-fragments.mjs (which APPENDS class-8/9 chapters to the generic
// seed), this REPLACES the whole class block, because classes 5-7 were seeded as
// placeholders ("Numbers and Operations", "Forces and Energy") and the real NCERT
// books have a different chapter list. Everything keyed by the old chapter names -
// content nodes, video urls, notes, chapter markers - is removed in the same pass,
// so the seed never refers to a chapter it no longer defines.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const ts = require('typescript');

const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const DRY = argv.includes('--dry');
const SEED = 'apps/api/prisma/seed.ts';
const dir = arg('--dir', path.join('artifacts', 'qa', new Date().toISOString().slice(0, 10)));
const grades = arg('--grades', '5,6,7').split(',').map((g) => g.trim()).filter(Boolean);

/** a TS literal in the seed's house style: single quotes, unquoted keys, 2-space indent */
function tsLiteral(value, indent = 0) {
  const pad = ' '.repeat(indent);
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') {
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n')}'`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return `[\n${value.map((v) => `${pad}  ${tsLiteral(v, indent + 2)}`).join(',\n')},\n${pad}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    return `{\n${entries
      .map(([k, v]) => `${pad}  ${/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`}: ${tsLiteral(v, indent + 2)}`)
      .join(',\n')},\n${pad}}`;
  }
  return 'null';
}

/** single-quoted TS string */
function str(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** one chapter, in the seed's compact house style */
function chapterLiteral(chapter, indent) {
  const pad = ' '.repeat(indent);
  const topics = (chapter.topics ?? [])
    .map((t) => `${pad}    { name: ${str(t.name)}, concepts: [${(t.concepts ?? []).map(str).join(', ')}] },`)
    .join('\n');
  return `{\n${pad}  name: ${str(chapter.name)},\n${pad}  code: ${str(chapter.code)},\n${pad}  topics: [\n${topics}\n${pad}  ],\n${pad}}`;
}

/** a single-line literal (the seed keeps every content node on one line) */
function tsInline(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return str(value);
  if (Array.isArray(value)) return `[${value.map(tsInline).join(', ')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    return `{${entries
      .map(([k, v]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`}: ${tsInline(v)}`)
      .join(', ')}}`;
  }
  return 'null';
}

/** 'a' for a string literal node, undefined otherwise */
function stringValue(node) {
  return node && ts.isStringLiteral(node) ? node.text : undefined;
}

/** the property named `name` of an object literal (string or identifier key) */
function prop(obj, name) {
  if (!obj || !ts.isObjectLiteralExpression(obj)) return undefined;
  for (const p of obj.properties) {
    if (!p.name) continue;
    if (ts.isPropertyAssignment(p) && propName(p.name) === name) return p;
  }
  return undefined;
}
function propName(nameNode) {
  if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode)) return nameNode.text;
  return undefined;
}

const source = fs.readFileSync(SEED, 'utf8');
const file = ts.createSourceFile(SEED, source, ts.ScriptTarget.ES2020, true);

/** one fragment per grade, or one per (grade, subject) merged into one */
function loadGradeFragment(grade) {
  const single = path.join(dir, `seed-grade-${grade}.json`);
  if (fs.existsSync(single)) return JSON.parse(fs.readFileSync(single, 'utf8').replace(/^\uFEFF/, ''));
  const parts = fs
    .readdirSync(dir)
    .filter((f) => new RegExp(`^seed-frag-${grade}-.+\\.json$`).test(f))
    .sort();
  if (parts.length === 0) return null;
  const merged = { grade, curriculum: {}, contentNodes: [], notesTexts: {} };
  for (const part of parts) {
    const frag = JSON.parse(fs.readFileSync(path.join(dir, part), 'utf8').replace(/^\uFEFF/, ''));
    Object.assign(merged.curriculum, frag.curriculum ?? {});
    merged.contentNodes.push(...(frag.contentNodes ?? []));
    Object.assign(merged.notesTexts, frag.notesTexts ?? {});
  }
  return merged;
}

/** find `const <name> = <initializer>`, unwrapping `as const` / parentheses */
function initializerOf(name) {
  let found;
  const visit = (node) => {
    if (found) return;
    if (ts.isVariableStatement(node)) {
      for (const d of node.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.name.text === name && d.initializer) found = d.initializer;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  let node = found;
  while (
    node &&
    (ts.isAsExpression(node) ||
      ts.isSatisfiesExpression?.(node) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isParenthesizedExpression(node))
  ) {
    node = node.expression;
  }
  return node;
}

const curriculumInit = initializerOf('curriculum') ?? initializerOf('CURRICULUM');
if (!curriculumInit) {
  console.log('  ERROR: no `curriculum` literal in the seed');
  process.exit(1);
}

const edits = []; // { start, end, text }
const removedTitles = new Set();
const removedChapters = new Set();
const summary = [];

for (const grade of grades) {
  const frag = loadGradeFragment(grade);
  if (!frag) {
    console.log(`  class ${grade}: no fragment in ${dir} - skipped`);
    continue;
  }
  const wanted = Object.keys(frag.curriculum ?? {});
  if (wanted.length === 0) {
    console.log(`  class ${grade}: fragment has no curriculum - skipped`);
    continue;
  }

  // 1. the old class block
  const gradeProp = prop(curriculumInit, grade);
  if (!gradeProp) {
    console.log(`  class ${grade}: not in the seed curriculum - skipped`);
    continue;
  }
  const block = gradeProp.initializer;
  const oldNames = [];
  for (const p of block.properties ?? []) {
    if (!p.initializer || !ts.isArrayLiteralExpression(p.initializer)) continue;
    for (const el of p.initializer.elements) {
      const nameProp = prop(el, 'name');
      const value = nameProp && stringValue(nameProp.initializer);
      if (value) oldNames.push(value);
    }
  }
  for (const n of oldNames) removedChapters.add(n);

  // 2. rebuild the block as [SCIENCE]/[MATHS]/[ENGLISH]
  const CONST = { Science: 'SCIENCE', Mathematics: 'MATHS', English: 'ENGLISH' };
  const lines = [`{`];
  // a stable order, whatever order the fragments were merged in
  const subjects = ['Science', 'Mathematics', 'English'].filter((s) => frag.curriculum[s]);
  for (const subject of Object.keys(frag.curriculum)) {
    if (!CONST[subject]) console.log(`  class ${grade}: unknown subject "${subject}" - skipped`);
  }
  for (const subject of subjects) {
    const constName = CONST[subject];
    const chapters = frag.curriculum[subject];
    const body = (chapters ?? []).map((c) => `      ${chapterLiteral(c, 6)}`).join(',\n');
    lines.push(`    [${constName}]: [\n${body}\n    ],`);
  }
  lines.push(`  }`);
  edits.push({ start: block.getStart(file), end: block.getEnd(), text: lines.join('\n') });
  summary.push(`  class ${grade}: curriculum replaced (${oldNames.length} old chapter(s) -> ${
    Object.values(frag.curriculum).reduce((n, list) => n + (list?.length ?? 0), 0)
  } new)`);
}

// 3. drop every content node of the replaced grades, and every content node whose
//    chapter is gone (the nodes are keyed by chapter NAME, not by id).
//    The array is rebuilt from the kept elements rather than spliced by offset: a
//    splice leaves a trailing comma behind when the dropped nodes are the last ones,
//    and `[a, , b]` is a hole (undefined), not a syntax error - the seed would then
//    crash at runtime with "cannot read properties of undefined".
const nodesInit = initializerOf('contentNodes');
let nodeEntries = null;
if (nodesInit && ts.isArrayLiteralExpression(nodesInit)) {
  const gradeSet = new Set(grades);
  nodeEntries = [];
  for (const el of nodesInit.elements) {
    if (ts.isOmittedExpression(el)) continue;
    const ch = prop(el, 'ch');
    const gr = prop(el, 'grade');
    const chapterName = ch && stringValue(ch.initializer);
    const gradeValue = gr && stringValue(gr.initializer);
    const titleProp = prop(el, 'title');
    const title = titleProp && stringValue(titleProp.initializer);
    const drop = gradeValue ? gradeSet.has(gradeValue) : Boolean(chapterName && removedChapters.has(chapterName));
    if (drop) {
      if (title) removedTitles.add(title);
      continue;
    }
    nodeEntries.push(`    ${el.getText(file).trim()}`);
  }
}

// 4. drop the video urls / notes texts / chapter markers of the removed lessons,
//    rebuilt for the same reason
const mapEntries = new Map();
for (const mapName of ['videoUrls', 'notesTexts', 'videoSegments']) {
  const init = initializerOf(mapName);
  if (!init || !ts.isObjectLiteralExpression(init)) continue;
  const entries = [];
  for (const p of init.properties) {
    const key = p.name && propName(p.name);
    if (key && removedTitles.has(key)) continue;
    entries.push(`  ${p.getText(file).trim()}`);
  }
  mapEntries.set(mapName, { init, entries });
}

// 5. append the new content nodes and notes texts
const SUBJECT_CONST = [
  ["subjectName: 'Science'", 'subjectName: SCIENCE'],
  ["subjectName: 'Mathematics'", 'subjectName: MATHS'],
  ["subjectName: 'English'", 'subjectName: ENGLISH'],
  ["subjectName: 'SCIENCE'", 'subjectName: SCIENCE'],
  ["subjectName: 'MATHS'", 'subjectName: MATHS'],
  ["subjectName: 'ENGLISH'", 'subjectName: ENGLISH'],
];
for (const grade of grades) {
  const frag = loadGradeFragment(grade);
  if (!frag) continue;

  const nodes = frag.contentNodes ?? [];
  if (nodes.length && nodeEntries) {
    const entries = nodes.map((n) => {
      let text = tsInline(n);
      for (const [from, to] of SUBJECT_CONST) text = text.replace(from, to);
      return `    ${text}`;
    });
    nodeEntries.push(...entries);
    summary.push(`  class ${grade}: +${nodes.length} content nodes`);
  }

  const notes = Object.entries(frag.notesTexts ?? {});
  const notesMap = mapEntries.get('notesTexts');
  if (notes.length && notesMap) {
    for (const [title, text] of notes) {
      notesMap.entries.push(`  '${title.replace(/'/g, "\\'")}': ${tsLiteral(text, 2)}`);
    }
    summary.push(`  class ${grade}: +${notes.length} notes`);
  }
}

// 6. write the rebuilt array and maps in one edit each
if (nodesInit && nodeEntries) {
  edits.push({
    start: nodesInit.getStart(file),
    end: nodesInit.getEnd(),
    text: `[\n${nodeEntries.join(',\n')}\n]`,
  });
}
for (const [, { init, entries }] of mapEntries) {
  edits.push({ start: init.getStart(file), end: init.getEnd(), text: `{\n${entries.join(',\n')}\n}` });
}

// apply every edit from the back of the file, so earlier offsets stay valid; at the
// same offset an insertion goes first (it is at the closing bracket) and then the
// removals, and several insertions are applied newest-first to keep their order
const ordered = edits
  .map((e, i) => ({ ...e, seq: i }))
  .sort((a, b) => {
    if (b.start !== a.start) return b.start - a.start;
    if (a.insert !== b.insert) return a.insert ? -1 : 1;
    return b.seq - a.seq;
  });
let out = source;
for (const e of ordered) out = out.slice(0, e.start) + e.text + out.slice(e.end);

/* never write a seed that does not parse */
const transpiled = ts.transpileModule(out, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  reportDiagnostics: true,
  fileName: 'seed.ts',
});
const errors = (transpiled.diagnostics || []).filter((d) => d.category === 1);
if (errors.length) {
  console.log(`  ERROR: the realigned seed does not parse (${errors.length} errors) - nothing written`);
  for (const e of errors.slice(0, 5)) {
    const pos = e.file && e.start != null ? e.file.getLineAndCharacterOfPosition(e.start) : null;
    console.log(`    ${pos ? pos.line + 1 : '?'}: ${ts.flattenDiagnosticMessageText(e.messageText, ' ')}`);
  }
  const debugFile = path.join(dir, 'seed-realign-broken.ts');
  fs.writeFileSync(debugFile, out);
  console.log(`    broken output -> ${debugFile}`);
  process.exit(1);
}

if (DRY) {
  console.log(summary.join('\n'));
  const outFile = arg('--out', '');
  if (outFile) {
    fs.writeFileSync(outFile, out);
    console.log(`  (dry run - output written to ${outFile})`);
  } else {
    console.log('  (dry run - seed not written)');
  }
  process.exit(0);
}
const outFile = arg('--out', '');
fs.writeFileSync(outFile || SEED, out);
console.log(summary.join('\n'));
console.log(`  removed ${removedTitles.size} lesson title(s); seed written and verified to parse`);
