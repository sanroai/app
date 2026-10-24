// Removes concepts the curriculum spec no longer has (old syllabus rows, encoding
// duplicates), repointing their questions to the concept of the same name first.
//
//   node scripts/qa/prune-stale-concepts.mjs [--apply] [db]
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
                  let topicName = null;
                  const concepts = [];
                  for (const tp of topicEl.properties) {
                    if (!ts.isPropertyAssignment(tp) || !ts.isIdentifier(tp.name)) continue;
                    if (tp.name.text === 'name' && ts.isStringLiteral(tp.initializer)) topicName = tp.initializer.text;
                    if (tp.name.text === 'concepts' && ts.isArrayLiteralExpression(tp.initializer)) {
                      for (const c of tp.initializer.elements) if (ts.isStringLiteral(c)) concepts.push(c.text);
                    }
                  }
                  if (topicName) topics.push({ topicName, concepts });
                }
              }
            }
            if (!chapterName) continue;
            for (const t of topics) {
              for (const c of t.concepts) expected.add(`${grade}|${chapterName}|${t.topicName}|${c}`);
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
      name: true,
      grade: true,
      subject: { select: { name: true } },
      topics: { select: { name: true, concepts: { select: { id: true, name: true } } } },
    },
  });
  const managed = new Set([...expected].map((k) => k.split('|')[0]));
  const stale = [];
  for (const ch of chapters) {
    if (!managed.has(ch.grade)) continue;
    for (const topic of ch.topics) {
      for (const concept of topic.concepts) {
        const key = `${ch.grade}|${ch.name}|${topic.name}|${concept.name}`;
        if (!expected.has(key)) {
          stale.push({
            grade: ch.grade,
            subject: ch.subject.name,
            chapter: ch.name,
            topic: topic.name,
            id: concept.id,
            name: concept.name,
          });
        }
      }
    }
  }

  console.log(`  database        : ${db}`);
  console.log(`  spec concepts   : ${expected.size}`);
  console.log(`  stale concepts  : ${stale.length}`);
  const byGrade = new Map();
  for (const s of stale) byGrade.set(s.grade, (byGrade.get(s.grade) ?? 0) + 1);
  for (const [g, n] of [...byGrade].sort((a, b) => Number(a[0]) - Number(b[0]))) console.log(`    class ${g}: ${n}`);
  for (const s of stale.slice(0, 12)) console.log(`    - ${s.grade} ${s.chapter} / ${s.topic} / ${s.name}`);

  if (apply) {
    let repointed = 0;
    let deleted = 0;
    for (const s of stale) {
      const owners = await prisma.concept.findMany({
        where: {
          name: s.name,
          topic: { chapter: { grade: s.grade, subject: { name: s.subject }, OR: [{ name: { not: s.chapter } }, { name: s.chapter }] } },
          NOT: { id: s.id },
        },
        select: { id: true, topic: { select: { chapterId: true } } },
      });
      if (owners.length === 1) {
        const res = await prisma.question.updateMany({
          where: { conceptId: s.id },
          data: { conceptId: owners[0].id, chapterId: owners[0].topic.chapterId },
        });
        repointed += res.count;
      }
      try {
        await prisma.concept.delete({ where: { id: s.id } });
        deleted += 1;
      } catch {
        // A concept still referenced by progress rows is kept rather than forced out.
        console.log(`    kept ${s.name} (still referenced)`);
      }
    }
    console.log(`  repointed       : ${repointed}`);
    console.log(`  deleted         : ${deleted}`);
  } else {
    console.log('  dry run - re-run with --apply');
  }
} finally {
  await prisma.$disconnect();
}
