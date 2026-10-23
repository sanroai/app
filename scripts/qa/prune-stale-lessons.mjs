// Removes seeded content that no longer exists in the seed.
//
//   node scripts/qa/prune-stale-lessons.mjs [--apply] [db]
//
// A chapter rename or re-scope removes lessons from `contentNodes`, but the seed
// only upserts - the old rows stay in the database and show up in the library
// under the renamed chapter. Dry-run by default; only PLATFORM-owned rows are
// considered, so content a teacher created is never touched.
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const apply = process.argv.includes('--apply');
const db = process.argv.slice(2).filter((a) => !a.startsWith('--')).at(-1) ?? 'sanro_dev';
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

function matchingArray(text, open) {
  let depth = 0;
  let inString = false;
  let quote = '';
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === '\\') { i++; continue; }
      if (ch === quote) inString = false;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inString = true; quote = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

const seed = fs.readFileSync('apps/api/prisma/seed.ts', 'utf8');

// Match on (grade, chapter, title), not on the title alone: after a chapter
// renumbering the same lesson can exist in the right chapter and in the one it
// used to belong to, and a title-only check treats both as legitimate.
const requireTs = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const ts = requireTs('typescript');
const file = ts.createSourceFile('seed.ts', seed, ts.ScriptTarget.ES2020, true);
const seeded = new Set();
let nodeCount = 0;
const visit = (node) => {
  if (ts.isVariableStatement(node)) {
    for (const decl of node.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || decl.name.text !== 'contentNodes') continue;
      let init = decl.initializer;
      while (
        init &&
        (ts.isAsExpression(init) || ts.isSatisfiesExpression(init) || ts.isParenthesizedExpression(init))
      ) {
        init = init.expression;
      }
      if (!init || !ts.isArrayLiteralExpression(init)) continue;
      for (const el of init.elements) {
        if (!ts.isObjectLiteralExpression(el)) continue;
        const props = {};
        for (const p of el.properties) {
          if (!ts.isPropertyAssignment(p) || !ts.isIdentifier(p.name)) continue;
          if (ts.isStringLiteral(p.initializer)) props[p.name.text] = p.initializer.text;
        }
        if (!props.ch || !props.grade || !props.title) continue;
        nodeCount += 1;
        seeded.add(`${props.grade}|${props.ch}|${props.title}`);
      }
    }
  }
  ts.forEachChild(node, visit);
};
visit(file);

const prisma = new PrismaClient();
try {
  const rows = await prisma.contentItem.findMany({
    where: { ownerType: 'PLATFORM', type: { in: ['VIDEO', 'NOTES'] } },
    select: { id: true, title: true, type: true, chapter: { select: { name: true, grade: true } } },
  });
  const stale = rows.filter(
    (r) => !seeded.has(`${r.chapter?.grade ?? '?'}|${r.chapter?.name ?? ''}|${r.title}`),
  );
  const byChapter = new Map();
  for (const s of stale) {
    const key = `g${s.chapter?.grade ?? '?'} ${s.chapter?.name ?? '(no chapter)'}`;
    byChapter.set(key, (byChapter.get(key) ?? 0) + 1);
  }

  console.log(`  database           : ${db}`);
  console.log(`  seeded content     : ${seeded.size}`);
  console.log(`  platform content   : ${rows.length}`);
  console.log(`  stale (not seeded) : ${stale.length}`);
  for (const [key, n] of [...byChapter].sort()) console.log(`    ${n}  ${key}`);
  for (const s of stale.slice(0, 12)) console.log(`      ${s.type.padEnd(5)} ${s.title}`);

  if (!apply) {
    console.log('  dry run - re-run with --apply to delete');
  } else if (stale.length) {
    const res = await prisma.contentItem.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
    console.log(`  deleted            : ${res.count}`);
  }
} finally {
  await prisma.$disconnect();
}
