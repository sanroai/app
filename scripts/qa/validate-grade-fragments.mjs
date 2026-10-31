// Validate the class 5-7 curriculum fragments before they are merged into the seed.
//
//   node scripts/qa/validate-grade-fragments.mjs [--dir artifacts/qa/<date>] [--grades 5,6,7]
//
// The seed does not fail loudly on a bad fragment: `seedContent` silently skips a content
// node whose concept is not found in the chapter, and a chapter with no notes simply has no
// revision sheet. So everything is checked here, before realign-grade.mjs writes the seed.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { resolveSubject } = require('../books/subjects.cjs');

const norm = (s) =>
  String(s ?? '')
    .replace(/[—–]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/** the book's own chapter titles, in order (prelims excluded) */
function bookTitles(subject, grade) {
  const subjectName = subject === 'Science' ? 'science' : subject === 'Mathematics' ? 'mathematics' : 'english';
  return resolveSubject(subjectName, String(grade)).chapters
    .filter((c) => !c[1].startsWith('00-'))
    .map((c) => c[2]);
}

const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const dir = arg('--dir', path.join('artifacts', 'qa', new Date().toISOString().slice(0, 10)));
const grades = arg('--grades', '5,6,7').split(',').map((g) => g.trim()).filter(Boolean);

const CODE = /^([A-Z]{3})-(\d+)(P\d)?-(\d+)$/;
const SUBJECTS = new Set(['Science', 'Mathematics', 'English']);
const words = (text) => String(text ?? '').trim().split(/\s+/).filter(Boolean).length;

const problems = [];
const notes = [];
const seenCodes = new Map();

function loadFragments(grade) {
  if (!fs.existsSync(dir)) return [];
  const single = path.join(dir, `seed-grade-${grade}.json`);
  if (fs.existsSync(single)) {
    return [{ name: `seed-grade-${grade}.json`, data: JSON.parse(fs.readFileSync(single, 'utf8').replace(/^\uFEFF/, '')) }];
  }
  return fs
    .readdirSync(dir)
    .filter((f) => new RegExp(`^seed-frag-${grade}-.+\\.json$`).test(f))
    .sort()
    .map((f) => ({ name: f, data: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8').replace(/^\uFEFF/, '')) }));
}

let totalChapters = 0;
let totalConcepts = 0;
let totalNodes = 0;
let totalNotes = 0;

for (const grade of grades) {
  const fragments = loadFragments(grade);
  if (fragments.length === 0) {
    problems.push(`grade ${grade}: no fragment in ${dir}`);
    continue;
  }
  const chapterNames = new Set();
  for (const { name, data } of fragments) {
    const where = `${name}`;
    if (String(data.grade) !== String(grade)) problems.push(`${where}: "grade" is ${data.grade}, expected ${grade}`);

    const curriculum = data.curriculum ?? {};
    for (const subject of Object.keys(curriculum)) {
      if (!SUBJECTS.has(subject)) problems.push(`${where}: unknown subject "${subject}"`);
    }

    for (const [subject, chapters] of Object.entries(curriculum)) {
      if (!Array.isArray(chapters) || chapters.length === 0) {
        problems.push(`${where}: ${subject} has no chapters`);
        continue;
      }

      // the fragment must follow the book: same order, same titles
      const titles = bookTitles(subject, grade);
      const split = String(grade) === '7' && subject === 'Mathematics' && chapters.length === 15;
      const expected = split
        ? [...titles, ...resolveSubject('mathematics-part2', '7').chapters.filter((c) => !c[1].startsWith('00-')).map((c) => c[2])]
        : titles;
      if (expected.length !== chapters.length) {
        problems.push(`${where}: ${subject} has ${chapters.length} chapter(s), the book has ${expected.length}`);
      }
      for (let i = 0; i < Math.min(expected.length, chapters.length); i += 1) {
        if (norm(expected[i]) !== norm(chapters[i].name)) {
          problems.push(`${where}: ${subject} chapter ${i + 1} is "${chapters[i].name}", the book says "${expected[i]}"`);
        }
      }
      for (const chapter of chapters) {
        totalChapters += 1;
        const chName = chapter.name;
        if (!chName) {
          problems.push(`${where}: a ${subject} chapter has no name`);
          continue;
        }
        if (chapterNames.has(chName)) problems.push(`${where}: duplicate chapter name "${chName}"`);
        chapterNames.add(chName);

        const codeMatch = CODE.exec(chapter.code ?? '');
        if (!codeMatch) {
          problems.push(`${where}: "${chName}" has an invalid code "${chapter.code}"`);
        } else {
          const [, prefix, codeGrade, part] = codeMatch;
          if (prefix !== { Science: 'SCI', Mathematics: 'MAT', English: 'ENG' }[subject]) {
            problems.push(`${where}: "${chName}" code ${chapter.code} does not match subject ${subject}`);
          }
          if (codeGrade !== String(grade)) problems.push(`${where}: "${chName}" code ${chapter.code} is for grade ${codeGrade}`);
          if (part && !(subject === 'Mathematics' && String(grade) === '7')) {
            problems.push(`${where}: "${chName}" uses a volume code (${chapter.code}) outside class-7 maths`);
          }
          const key = chapter.code;
          if (seenCodes.has(key)) problems.push(`${where}: code ${key} already used by ${seenCodes.get(key)}`);
          else seenCodes.set(key, where);
        }

        const topics = chapter.topics ?? [];
        if (topics.length < 1 || topics.length > 4) problems.push(`${where}: "${chName}" has ${topics.length} topic(s) (expected 2-3)`);

        const concepts = new Set();
        for (const topic of topics) {
          if (!topic.name) problems.push(`${where}: "${chName}" has a topic without a name`);
          for (const concept of topic.concepts ?? []) {
            if (!concept || !String(concept).trim()) {
              problems.push(`${where}: "${chName}" / "${topic.name}" has an empty concept`);
              continue;
            }
            if (concepts.has(concept)) problems.push(`${where}: "${chName}" repeats concept "${concept}"`);
            concepts.add(concept);
          }
        }
        totalConcepts += concepts.size;
        if (concepts.size < 4 || concepts.size > 8) {
          problems.push(`${where}: "${chName}" has ${concepts.size} concept(s) (expected 4-8)`);
        }

        // content nodes + notes for this chapter
        const nodes = (data.contentNodes ?? []).filter((n) => n.ch === chName);
        const types = nodes.map((n) => n.type).sort().join(',');
        if (nodes.length !== 2 || types !== 'NOTES,VIDEO') {
          problems.push(`${where}: "${chName}" has ${nodes.length} content node(s) (${types || 'none'}) - expected one VIDEO and one NOTES`);
        }
        for (const node of nodes) {
          totalNodes += 1;
          if (!concepts.has(node.concept)) {
            problems.push(`${where}: "${chName}" ${node.type} node uses concept "${node.concept}" which is not in the chapter`);
          }
          const expectedTitle = `${chName} - ${node.type === 'VIDEO' ? 'Video Lesson' : 'Study Notes'}`;
          // a chapter name that another grade already uses carries its class in the lesson
          // title, because lesson titles are global in the seed and the video maps
          const classSuffixed = `${chName} (Class ${grade}) - ${node.type === 'VIDEO' ? 'Video Lesson' : 'Study Notes'}`;
          if (node.title !== expectedTitle && node.title !== classSuffixed) {
            problems.push(`${where}: node title "${node.title}" should be "${expectedTitle}"${node.title === classSuffixed ? '' : ` or "${classSuffixed}"`}`);
          }
          if (node.subjectName !== subject) problems.push(`${where}: node "${node.title}" subjectName is ${node.subjectName}, expected ${subject}`);
          if (String(node.grade) !== String(grade)) problems.push(`${where}: node "${node.title}" grade is ${node.grade}`);
        }

        const noteKey = `${chName} - Study Notes`;
        const noteText = (data.notesTexts ?? {})[noteKey] ?? (data.notesTexts ?? {})[`${chName} (Class ${grade}) - Study Notes`];
        if (!noteText) {
          problems.push(`${where}: "${chName}" has no study notes (${noteKey})`);
        } else {
          totalNotes += 1;
          const count = words(noteText);
          if (count < 200 || count > 600) notes.push(`${where}: "${chName}" notes are ${count} words (target 250-450)`);
          if (!/^##\s/m.test(noteText)) notes.push(`${where}: "${chName}" notes have no "##" section heading`);
        }
      }
    }

    // nodes / notes that point at a chapter of another fragment or at nothing
    const allNames = new Set(Object.values(curriculum).flat().map((c) => c.name));
    for (const node of data.contentNodes ?? []) {
      if (!allNames.has(node.ch)) problems.push(`${where}: content node "${node.title}" names a chapter that is not in this fragment ("${node.ch}")`);
    }
    for (const key of Object.keys(data.notesTexts ?? {})) {
      if (!key.endsWith(' - Study Notes')) problems.push(`${where}: notes key "${key}" should end with " - Study Notes"`);
      const chName = key.replace(/ - Study Notes$/, '').replace(/ \(Class \d\)$/, '');
      if (!allNames.has(chName)) problems.push(`${where}: notes "${key}" name a chapter that is not in this fragment`);
    }
  }
}

console.log(`  fragments dir : ${dir}`);
console.log(`  grades        : ${grades.join(', ')}`);
console.log(`  chapters      : ${totalChapters}`);
console.log(`  concepts      : ${totalConcepts}`);
console.log(`  content nodes : ${totalNodes}`);
console.log(`  notes         : ${totalNotes}`);
console.log(`  problems      : ${problems.length}`);
for (const p of problems.slice(0, 40)) console.log(`  FAIL ${p}`);
if (problems.length > 40) console.log(`  ... and ${problems.length - 40} more`);
console.log(`  warnings      : ${notes.length}`);
for (const w of notes.slice(0, 15)) console.log(`  WARN ${w}`);
if (problems.length) process.exit(1);
