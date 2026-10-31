// Merge the class-8 / class-9 curriculum fragments into the seed.
//
//   node scripts/qa/merge-seed-fragments.mjs [--dir artifacts/qa/<date>] [--class 8] [--class 9]
//
// The fragments come from the class agents (JSON) and carry the curriculum chapters,
// the content nodes, the video urls and the notes texts.
//
// The merge is idempotent (a chapter code / lesson title that is already in the seed
// is skipped) and it refuses to write a file that no longer parses.
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

const SEED = 'apps/api/prisma/seed.ts';
const date = new Date().toISOString().slice(0, 10);
const dir = arg('--dir', path.join('artifacts', 'qa', date));
const classes = argv.includes('--class') ? [Number(arg('--class', '9'))] : [8, 9];

/** a TS literal in the seed's house style: single quotes, unquoted keys, 2-space indent */
function tsLiteral(value, indent = 0) {
  const pad = ' '.repeat(indent);
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') {
    // a note is multi-line: it has to become ONE single-quoted literal
    return `'${value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')}'`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map((v) => `${pad}  ${tsLiteral(v, indent + 2)}`);
    return `[\n${items.join(',\n')},\n${pad}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    const items = entries.map(
      ([k, v]) => `${pad}  ${/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`}: ${tsLiteral(v, indent + 2)}`,
    );
    return `{\n${items.join(',\n')},\n${pad}}`;
  }
  return 'null';
}

/** a single-line TS literal (the seed keeps every lesson on one line) */
function tsInline(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') {
    return `'${value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')}'`;
  }
  if (Array.isArray(value)) return `[${value.map((v) => tsInline(v)).join(', ')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    return `{${entries
      .map(([k, v]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`}: ${tsInline(v)}`)
      .join(', ')}}`;
  }
  return 'null';
}

/** the index of the bracket that closes the one at `open`, ignoring string literals */
function matchingBracket(text, open) {
  let depth = 0;
  let inString = false;
  let quote = '';
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === quote) inString = false;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inString = true;
      quote = ch;
      continue;
    }
    if (ch === '[' || ch === '{' || ch === '(') depth++;
    else if (ch === ']' || ch === '}' || ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** the index of the `]` that closes the array opened at `open` */
function matchingArray(text, open) {
  let depth = 0;
  let inString = false;
  let quote = '';
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === quote) inString = false;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inString = true;
      quote = ch;
      continue;
    }
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

let seed = fs.readFileSync(SEED, 'utf8');
const existingCodes = new Set([...seed.matchAll(/code:\s*'([A-Z]+-\d+(?:P\d)?-\d+)'/g)].map((m) => m[1]));
const existingTitles = new Set([
  ...[...seed.matchAll(/title:\s*'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1].replace(/\\'/g, "'")),
]);
const subjectConst = {
  Science: 'SCIENCE',
  Mathematics: 'MATHS',
  English: 'ENGLISH',
  // the fragments may key the subjects by the seed's constant names
  SCIENCE: 'SCIENCE',
  MATHS: 'MATHS',
  ENGLISH: 'ENGLISH',
};

for (const cls of classes) {
  const file = path.join(dir, `seed-class-${cls}.json`);
  if (!fs.existsSync(file)) {
    console.log(`  class ${cls}: no fragment at ${file} - skipped`);
    continue;
  }
  const frag = JSON.parse(fs.readFileSync(file, 'utf8'));

  /* 1. the curriculum: append each subject's new chapters to the class block */
  for (const [subject, chapterList] of Object.entries(frag.curriculum ?? {})) {
    const constName = subjectConst[subject];
    if (!constName) {
      console.log(`  class ${cls}: unknown subject "${subject}" - skipped`);
      continue;
    }
    if (!Array.isArray(chapterList) || chapterList.length === 0) continue;
    const fresh = chapterList.filter((c) => !existingCodes.has(c.code));
    if (fresh.length !== chapterList.length) {
      console.log(`  class ${cls} ${subject}: ${chapterList.length - fresh.length} chapter(s) already seeded - skipped`);
    }
    if (fresh.length === 0) continue;

    const classStart = seed.indexOf(`  '${cls}': {`);
    if (classStart < 0) {
      console.log(`  class ${cls}: not in the seed - skipped`);
      continue;
    }
    // the class block ends at the next "  }," or the end of the literal
    let classEnd = seed.indexOf('\n  },', classStart);
    if (classEnd < 0) classEnd = seed.indexOf('\n};', classStart);
    if (classEnd < 0) {
      console.log(`  class ${cls}: could not find the end of the block - skipped`);
      continue;
    }
    const block = seed.slice(classStart, classEnd);

    const subjectStart = block.indexOf(`[${constName}]: [`);
    let updated;
    if (subjectStart < 0) {
      // the subject does not exist in this class yet: add the whole array
      const open = block.indexOf('[', block.indexOf('{'));
      const close = matchingArray(block, open);
      if (close < 0) {
        console.log(`  class ${cls} ${subject}: could not find the subject array - skipped`);
        continue;
      }
      const addition = `\n  [${constName}]: ${tsLiteral(fresh, 4)},\n`;
      updated = block.slice(0, open) + addition + block.slice(open);
    } else {
      // the array opens AFTER the constant: "[SCIENCE]: [" - the first bracket
      // belongs to the computed key, the second one opens the chapter list
      const open = subjectStart + `[${constName}]: [`.length - 1;
      const close = matchingArray(block, open);
      if (close < 0) {
        console.log(`  class ${cls} ${subject}: could not match the subject array - skipped`);
        continue;
      }
      const entries = fresh.map((c) => `      ${tsLiteral(c, 6)}`);
      updated = `${block.slice(0, close)},\n${entries.join(',\n')}\n    ${block.slice(close)}`;
    }
    seed = seed.slice(0, classStart) + updated + seed.slice(classEnd);
    console.log(`  class ${cls} ${subject}: +${fresh.length} chapters`);
  }

  /* 2. the content nodes (the seed uses the subject CONSTANTS, not display names) */
  const subjectConstant = { Science: 'SCIENCE', Mathematics: 'MATHS', English: 'ENGLISH' };
  const freshNodes = (frag.contentNodes ?? [])
    .filter((n) => !existingTitles.has(n.title))
    .map((n) => ({
      ...n,
      subjectName: subjectConstant[n.subjectName] ?? n.subjectName,
    }));
  if (freshNodes.length) {
    const start = seed.indexOf('const contentNodes = [');
    const open = seed.indexOf('[', start);
    const close = matchingArray(seed, open);
    if (close > 0) {
      const entries = freshNodes.map((n) => `    ${tsInline(n)}`);
      // the seed refers to the subjects by their CONSTANTS, not by a quoted string
      const fixed = entries.map((entry) =>
        entry
          .replace("subjectName: 'SCIENCE'", 'subjectName: SCIENCE')
          .replace("subjectName: 'MATHS'", 'subjectName: MATHS')
          .replace("subjectName: 'ENGLISH'", 'subjectName: ENGLISH'),
      );
      seed = seed.slice(0, close) + `,\n${fixed.join(',\n')}` + seed.slice(close);
      console.log(`  class ${cls}: +${freshNodes.length} content nodes`);
    }
  }

  /* 3. the video urls */
  const urlEntries = Object.entries(frag.videoUrls ?? {}).filter(([t]) => !existingTitles.has(t));
  if (urlEntries.length) {
    const start = seed.indexOf('const videoUrls: Record<string, string> = {');
    const open = seed.indexOf('{', start);
    const close = matchingBracket(seed, open);
    if (close > 0) {
      const entries = urlEntries.map(([title, url]) => `  '${title.replace(/'/g, "\\'")}': '${url}',`);
      seed = seed.slice(0, close) + `\n${entries.join('\n')}\n` + seed.slice(close);
      console.log(`  class ${cls}: +${urlEntries.length} video urls`);
    }
  }

  /* 4. the notes texts */
  const noteEntries = Object.entries(frag.notesTexts ?? {}).filter(([t]) => !existingTitles.has(t));
  if (noteEntries.length) {
    const start = seed.indexOf('const notesTexts: Record<string, string> = {');
    const open = seed.indexOf('{', start);
    const close = matchingBracket(seed, open);
    if (close > 0) {
      const entries = noteEntries.map(([title, text]) => `  '${title.replace(/'/g, "\\'")}': ${tsLiteral(text, 2)},`);
      seed = seed.slice(0, close) + `\n${entries.join('\n')}\n` + seed.slice(close);
      console.log(`  class ${cls}: +${noteEntries.length} notes`);
    }
  }
}

/* never write a seed that does not parse */
const out = ts.transpileModule(seed, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  reportDiagnostics: true,
  fileName: 'seed.ts',
});
const errors = (out.diagnostics || []).filter((d) => d.category === 1);
if (errors.length) {
  console.log(`  ERROR: the merged seed does not parse (${errors.length} errors) - nothing written`);
  for (const e of errors.slice(0, 5)) {
    const pos = e.file && e.start != null ? e.file.getLineAndCharacterOfPosition(e.start) : null;
    console.log(`    ${pos ? pos.line + 1 : '?'}: ${ts.flattenDiagnosticMessageText(e.messageText, ' ')}`);
  }
  // keep the broken output for inspection, never touch the seed
  const debugFile = path.join(dir, 'seed-merge-broken.ts');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(debugFile, seed);
  console.log(`    broken output -> ${debugFile}`);
  process.exit(1);
}

fs.writeFileSync(SEED, seed);
console.log('  seed updated and verified to parse');
