// Does the tutor answer from a concept's *own* note, without the model?
//
//   node scripts/qa/probe-concept-grounding.mjs
//   API=https://api.sanroai.com/api/v1 STUDENT_PASSWORD=... node scripts/qa/probe-concept-grounding.mjs
//
// The AI ladder is supposed to answer from the open concept's notes before it ever
// calls the model: that is what makes a reply instant and impossible to rate
// limit. The 848 micro-notes exist so every concept page has something to read -
// this checks those notes are also what the tutor answers *from*, which is the
// user-visible promise ("answers related to the book first").
//
// A concept is only a real test when its micro-note is the only content it has;
// concepts that carry chapter-level notes are reported as skipped, not passed.
const API = process.env.API ?? 'http://localhost:4000/api/v1';
const PASSWORD = process.env.STUDENT_PASSWORD ?? 'Sanro@123';
const EMAIL = process.env.STUDENT_EMAIL ?? 'student@sanroai.com';
const MAX_MS = Number(process.env.MAX_MS ?? '2500');

const login = await (
  await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
).json();
if (!login.accessToken) {
  console.log(`  login failed for ${EMAIL}: ${JSON.stringify(login).slice(0, 160)}`);
  process.exit(1);
}
const auth = { authorization: `Bearer ${login.accessToken}` };
const home = await (await fetch(`${API}/learning/home`, { headers: auth })).json();
const board = home.boards[0];

const words = (text) =>
  new Set(
    String(text)
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 4),
  );

const targets = [
  ['6', 'SCI', 'SCI-6-4', 'Lodestone and Artificial Magnets'],
  ['5', 'MAT', 'MAT-5-2', 'Unit Fractions'],
  ['9', 'MAT', 'MAT-9-7', 'What is Probability?'],
  ['7', 'SCI', 'SCI-7-2', 'Litmus as an Indicator'],
];

let pass = 0;
let fail = 0;
let skipped = 0;
const check = (name, ok, detail) => {
  if (ok) {
    pass += 1;
    console.log(`PASS  ${name} - ${detail}`);
  } else {
    fail += 1;
    console.log(`FAIL  ${name} - ${detail}`);
  }
};

console.log(`  api: ${API}`);
console.log(`  user: ${EMAIL}\n`);

for (const [gradeNo, subjectCode, chapterCode, conceptName] of targets) {
  const grade = board.grades.find((g) => g.grade === gradeNo);
  const subject = grade?.subjects.find((s) => s.code === subjectCode);
  if (!subject) {
    console.log(`SKIP  ${chapterCode} - this account cannot open class ${gradeNo} ${subjectCode}`);
    skipped += 1;
    continue;
  }
  const chapters = await (
    await fetch(`${API}/learning/boards/${board.id}/grades/${gradeNo}/subjects/${subject.id}/chapters`, { headers: auth })
  ).json();
  const chapter = (chapters.chapters ?? chapters).find((c) => c.code === chapterCode);
  if (!chapter) {
    console.log(`SKIP  ${chapterCode} - chapter not found`);
    skipped += 1;
    continue;
  }
  const hub = await (await fetch(`${API}/learning/chapters/${chapter.id}`, { headers: auth })).json();
  const found = hub.concepts.find((c) => c.name === conceptName);
  if (!found) {
    console.log(`SKIP  ${chapterCode} - concept "${conceptName}" not found`);
    skipped += 1;
    continue;
  }
  const conceptId = found.conceptId ?? found.id;

  const detail = await (await fetch(`${API}/learning/concepts/${conceptId}`, { headers: auth })).json();
  const note = (detail.content ?? []).find((c) => String(c.title).includes('Key Idea'));
  if (!note) {
    console.log(`SKIP  ${chapterCode} ${conceptName} - no micro-note (it carries its own content)`);
    skipped += 1;
    continue;
  }

  const started = Date.now();
  const res = await fetch(`${API}/ai/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...auth },
    body: JSON.stringify({ message: `Explain ${conceptName} in simple words`, context: { conceptId } }),
  });
  const body = await res.json().catch(() => ({}));
  const ms = Date.now() - started;
  const reply = String(body.reply ?? '');

  check(`${chapterCode} reply is not empty`, res.ok && reply.length > 80, `status=${res.status} ${ms}ms chars=${reply.length}`);
  check(`${chapterCode} answered without the model`, ms < MAX_MS, `${ms}ms (limit ${MAX_MS}ms)`);

  const noteWords = words(note.description);
  const replyWords = words(reply);
  let shared = 0;
  for (const w of noteWords) if (replyWords.has(w)) shared += 1;
  const overlap = noteWords.size ? shared / noteWords.size : 0;
  check(
    `${chapterCode} reply uses the note's own wording`,
    overlap >= 0.25,
    `${(overlap * 100).toFixed(0)}% of the note's content words appear in the reply`,
  );
}

console.log(`\n=== ${pass} passed, ${fail} failed, ${skipped} skipped ===`);
process.exit(fail ? 1 : 0);
