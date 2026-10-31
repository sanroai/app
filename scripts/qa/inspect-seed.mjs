import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('D:/sanroaiapp/apps/api/package.json');
const ts = require('typescript');

const target = process.argv[2] ?? 'apps/api/prisma/seed.ts';
const src = fs.readFileSync(target, 'utf8');
const file = ts.createSourceFile('seed.ts', src, ts.ScriptTarget.ES2020, true);
const unwrap = (n) => {
  let x = n;
  while (x && (ts.isAsExpression(x) || ts.isSatisfiesExpression(x) || ts.isParenthesizedExpression(x))) x = x.expression;
  return x;
};
const named = (name) => {
  let found;
  const visit = (n) => {
    if (ts.isVariableStatement(n)) {
      for (const d of n.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && d.name.text === name) found = unwrap(d.initializer);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(file);
  return found;
};

const nodes = named('contentNodes');
if (!nodes) {
  console.log('  contentNodes not found');
  process.exit(1);
}
let holes = 0;
const omittedLines = [];
nodes.elements.forEach((el) => {
  if (ts.isOmittedExpression(el)) {
    holes += 1;
    omittedLines.push(file.getLineAndCharacterOfPosition(el.getStart(file)).line + 1);
  }
});
console.log(`  contentNodes   : ${nodes.elements.length} elements, ${holes} holes${holes ? ' at lines ' + omittedLines.join(',') : ''}`);

const quoted = (src.match(/subjectName: '/g) || []).length;
const constants = (src.match(/subjectName: (SCIENCE|MATHS|ENGLISH)/g) || []).length;
console.log(`  subjectName    : ${constants} constant(s), ${quoted} quoted`);

for (const name of ['videoUrls', 'notesTexts', 'videoSegments']) {
  const init = named(name);
  if (!init) continue;
  const n = init.properties ? init.properties.length : 0;
  console.log(`  ${name.padEnd(14)}: ${n} entries`);
}
const grades = {};
for (const m of src.matchAll(/code: '([A-Z]+)-(\d+)(?:P\d)?-(\d+)'/g)) {
  const g = m[2];
  grades[g] = (grades[g] ?? 0) + 1;
}
console.log('  chapters/grade : ' + JSON.stringify(grades));
