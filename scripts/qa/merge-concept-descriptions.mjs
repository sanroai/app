// Merges authored concept summaries into the seed's conceptDescriptions map.
//
//   node scripts/qa/merge-concept-descriptions.mjs --dir artifacts/qa/<date> [db]
//
// Reads every `concept-descriptions-*.json` in the directory:
//   { "descriptions": [ { "grade": "5", "subject": "Science",
//                         "chapter": "<exact chapter name>",
//                         "concept": "<exact concept name>",
//                         "description": "one or two sentences" } ] }
// and rebuilds the map keyed `${grade}|${chapter}|${concept}`, refusing to write
// when a chapter/concept pair does not exist in the database.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const ts = require('typescript');
const { PrismaClient } = require('@prisma/client');

const argv = process.argv.slice(2);
const dirArg = (() => {
  const i = argv.indexOf('--dir');
  return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
})();
const dir = dirArg ?? path.join('artifacts', 'qa', new Date().toISOString().slice(0, 10));
const db = argv.filter((a) => !a.startsWith('--') && a !== dirArg).at(-1) ?? 'sanro_dev';
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const SEED = 'apps/api/prisma/seed.ts';
const files = fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => /^concept-descriptions-.*\.json$/.test(f))
  : [];
if (files.length === 0) {
  console.log(`  no concept-descriptions-*.json in ${dir}`);
  process.exit(1);
}

const prisma = new PrismaClient();
let problems = 0;
const incoming = new Map();
try {
  const chapters = await prisma.chapter.findMany({
    select: {
      name: true,
      grade: true,
      subject: { select: { name: true } },
      topics: { select: { concepts: { select: { name: true } } } },
    },
  });
  const known = new Set();
  for (const ch of chapters) {
    for (const topic of ch.topics) {
      for (const concept of topic.concepts) {
        known.add(`${ch.grade}|${ch.subject.name}|${ch.name}|${concept.name}`);
      }
    }
  }

  for (const file of files) {
    const payload = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const list = payload.descriptions ?? payload.descriptions === undefined ? payload.descriptions ?? [] : [];
    let added = 0;
    for (const item of list) {
      const { grade, subject, chapter, concept, description } = item ?? {};
      if (!grade || !subject || !chapter || !concept || typeof description !== 'string') {
        console.log(`    ${file}: incomplete entry ${JSON.stringify(item).slice(0, 120)}`);
        problems += 1;
        continue;
      }
      const text = description.trim();
      if (text.length < 20 || text.length > 400) {
        console.log(`    ${file}: ${grade} ${chapter} / ${concept} description length ${text.length}`);
        problems += 1;
        continue;
      }
      if (!known.has(`${grade}|${subject}|${chapter}|${concept}`)) {
        console.log(`    ${file}: unknown concept ${grade} ${subject} ${chapter} / ${concept}`);
        problems += 1;
        continue;
      }
      incoming.set(`${grade}|${chapter}|${concept}`, text);
      added += 1;
    }
    console.log(`  ${file}: ${list.length} entries, ${added} usable`);
  }

  if (problems > 0) {
    console.log(`  problems : ${problems} - seed not written`);
    process.exit(1);
  }

  const seed = fs.readFileSync(SEED, 'utf8');
  const file = ts.createSourceFile('seed.ts', seed, ts.ScriptTarget.ES2020, true);
  let init;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'conceptDescriptions') {
      init = node.initializer;
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (!init || !ts.isObjectLiteralExpression(init)) {
    console.log('  conceptDescriptions map not found in the seed');
    process.exit(1);
  }

  const merged = new Map();
  for (const prop of init.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = ts.isStringLiteral(prop.name) ? prop.name.text : null;
    const value = ts.isStringLiteral(prop.initializer) ? prop.initializer.text : null;
    if (key && value) merged.set(key, value);
  }
  const before = merged.size;
  for (const [key, value] of incoming) merged.set(key, value);

  const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
  const block = [
    'const conceptDescriptions: Record<string, string> = {',
    ...[...merged.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `  '${esc(k)}': '${esc(v)}',`),
    '};',
  ];

  const lines = seed.split('\n');
  const decl = lines.findIndex((line) => /^\s*const conceptDescriptions\b/.test(line));
  if (decl < 0) {
    console.log('  declaration line not found');
    process.exit(1);
  }
  const close = lines.findIndex((line, i) => i > decl && /^\s*\};?\s*$/.test(line));
  lines.splice(decl, close - decl + 1, ...block);
  const out = lines.join('\n');

  const check = ts.transpileModule(out, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
    fileName: 'seed.ts',
  });
  const errors = (check.diagnostics || []).filter((d) => d.category === 1);
  console.log(`  map entries : ${before} -> ${merged.size} (+${merged.size - before})`);
  console.log(`  parse errors: ${errors.length}`);
  if (errors.length) {
    for (const e of errors.slice(0, 3)) console.log('    ' + ts.flattenDiagnosticMessageText(e.messageText, ' '));
    process.exit(1);
  }
  fs.writeFileSync(SEED, out);
  console.log('  seed written');
} finally {
  await prisma.$disconnect();
}
