// Removes topics that the curriculum spec no longer has, and repoints their
// questions to the concept of the same name in the chapter that owns it.
//
//   node scripts/qa/prune-stale-topics.mjs [--apply] [db]
//
// A chapter rename or renumbering changes the spec, but the seed only upserts, so
// the topics of the chapter's previous numbering stay behind and show up in the
// chapter hub under the new chapter name (e.g. "Tangents" inside "Areas Related
// to Circles"). Questions that point at those stale concepts are moved to the
// concept of the same name in the owning chapter before anything is deleted.
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const ts = require('typescript');
const { PrismaClient } = require('@prisma/client');

const apply = process.argv.includes('--apply');
const db = process.argv.slice(2).filter((a) => !a.startsWith('--')).at(-1) ?? 'sanro_dev';
process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${db}`;

const seed = fs.readFileSync('apps/api/prisma/seed.ts', 'utf8');
const file = ts.createSourceFile('seed.ts', seed, ts.ScriptTarget.ES2020, true);

const expected = new Set();
let specCount = 0;
const visit = (node) => {
  if (ts.isVariableStatement(node)) {
    for (const decl of node.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || decl.name.text !== 'CURRICULUM') continue;
      let init = decl.initializer;
      while (init && (ts.isAsExpression(init) || ts.isSatisfiesExpression(init) || ts.isParenthesizedExpression(init))) {
        init = init.expression;
      }
      for (const gradeProp of init.properties) {
        const grade = gradeProp.name && (gradeProp.name.text ?? gradeProp.name.escapedText);
        if (!grade || !ts.isObjectLiteralExpression(gradeProp.initializer)) continue;
        for (const subjectProp of gradeProp.initializer.properties) {
          if (!ts.isArrayLiteralExpression(subjectProp.initializer)) continue;
          for (const chapterEl of subjectProp.initializer.elements) {
            if (!ts.isObjectLiteralExpression(chapterEl)) continue;
            let chapterName = null;
            const topics = [];
            for (const p of chapterEl.properties) {
              if (!ts.isPropertyAssignment(p) || !ts.isIdentifier(p.name)) continue;
              if (p.name.text === 'name' && ts.isStringLiteral(p.initializer)) chapterName = p.initializer.text;
              if (p.name.text === 'topics' && ts.isArrayLiteralExpression(p.initializer)) {
                for (const topicEl of p.initializer.elements) {
                  if (!ts.isObjectLiteralExpression(topicEl)) continue;
                  for (const tp of topicEl.properties) {
                    if (ts.isPropertyAssignment(tp) && ts.isIdentifier(tp.name) && tp.name.text === 'name' && ts.isStringLiteral(tp.initializer)) {
                      topics.push(tp.initializer.text);
                    }
                  }
                }
              }
            }
            if (!chapterName) continue;
            for (const topic of topics) {
              expected.add(`${grade}|${chapterName}|${topic}`);
              specCount += 1;
            }
          }
        }
      }
    }
  }
  ts.forEachChild(node, visit);
};
visit(file);

const prisma = new PrismaClient();
try {
  const chapters = await prisma.chapter.findMany({
    select: {
      id: true,
      name: true,
      grade: true,
      subject: { select: { name: true } },
      topics: { select: { id: true, name: true, concepts: { select: { id: true, name: true } } } },
    },
  });
  const managedGrades = new Set([...expected].map((k) => k.split('|')[0]));

  const stale = [];
  for (const ch of chapters) {
    if (!managedGrades.has(ch.grade)) continue;
    for (const topic of ch.topics) {
      const key = `${ch.grade}|${ch.name}|${topic.name}`;
      if (!expected.has(key)) {
        stale.push({ chapterId: ch.id, chapter: ch.name, grade: ch.grade, subject: ch.subject.name, topicId: topic.id, topic: topic.name, concepts: topic.concepts });
      }
    }
  }

  console.log(`  database            : ${db}`);
  console.log(`  spec topics         : ${specCount}`);
  console.log(`  stale topics        : ${stale.length}`);
  for (const s of stale.slice(0, 20)) {
    console.log(`    g${s.grade} ${s.chapter} / ${s.topic} (${s.concepts.length} concepts)`);
  }

  let repointed = 0;
  const ambiguous = [];
  if (apply) {
    // Repoint questions before deleting anything: a concept that exists under the
    // chapter that owns it is the same concept, only a stale duplicate.
    for (const s of stale) {
      for (const concept of s.concepts) {
        const owners = await prisma.concept.findMany({
          where: {
            name: concept.name,
            topic: { chapter: { grade: s.grade, subject: { name: s.subject }, name: { not: s.chapter } } },
          },
          select: { id: true, topic: { select: { chapterId: true } } },
        });
        if (owners.length !== 1) {
          if (owners.length > 1) ambiguous.push(`g${s.grade} ${concept.name} (${owners.length} owners)`);
          continue;
        }
        const res = await prisma.question.updateMany({
          where: { conceptId: concept.id },
          data: { conceptId: owners[0].id, chapterId: owners[0].topic.chapterId },
        });
        repointed += res.count;
      }
    }
    const ids = stale.map((s) => s.topicId);
    const res = ids.length ? await prisma.topic.deleteMany({ where: { id: { in: ids } } }) : { count: 0 };
    console.log(`  questions repointed : ${repointed}`);
    if (ambiguous.length) {
      console.log(`  concepts left in place (several owners): ${ambiguous.length}`);
      for (const a of ambiguous.slice(0, 8)) console.log(`    ${a}`);
    }
    console.log(`  topics deleted      : ${res.count}`);
    const orphans = await prisma.question.count({ where: { conceptId: null } });
    console.log(`  questions without concept now: ${orphans}`);
  } else {
    // Dry run: report what the repoint step would do.
    let candidates = 0;
    for (const s of stale) {
      for (const concept of s.concepts) {
        const owners = await prisma.concept.findMany({
          where: {
            name: concept.name,
            topic: { chapter: { grade: s.grade, subject: { name: s.subject }, name: { not: s.chapter } } },
          },
          select: { id: true },
        });
        if (owners.length === 1) candidates += await prisma.question.count({ where: { conceptId: concept.id } });
        else if (owners.length > 1) ambiguous.push(`g${s.grade} ${concept.name} (${owners.length} owners)`);
      }
    }
    console.log(`  questions to repoint: ${candidates}`);
    if (ambiguous.length) {
      console.log(`  ambiguous concepts  : ${ambiguous.length}`);
      for (const a of ambiguous.slice(0, 8)) console.log(`    ${a}`);
    }
    console.log('  dry run - re-run with --apply');
  }
} finally {
  await prisma.$disconnect();
}
