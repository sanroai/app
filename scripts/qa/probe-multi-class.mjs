/**
 * Probe: multi-class enrolment (one student, several classes).
 *   node scripts/qa/probe-multi-class.mjs
 *
 * Rules under test:
 *  - a student's home lists exactly the classes they are enrolled in;
 *  - `student@sanroai.com` (the demo account) is enrolled in ALL classes;
 *  - every reading path (chapter hub, textbook pages, concept, practice, path,
 *    AI chat) honours the same union of classes;
 *  - a single-class student is still refused another class's chapter (403).
 */
import { QA_PASSWORD } from './_env.mjs';

const API = process.env.API_URL ?? 'http://localhost:4000/api/v1';

async function login(email) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: QA_PASSWORD }),
  });
  const body = await res.json();
  if (!body.accessToken && !body.token) throw new Error(`login failed for ${email}: ${res.status}`);
  return { Authorization: `Bearer ${body.accessToken ?? body.token}` };
}

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function json(path, init = {}) {
  const res = await fetch(`${API}${path}`, init);
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

function gradesOf(home) {
  return (home.boards ?? []).flatMap((b) => b.grades ?? []);
}

// ─── the all-classes demo account ────────────────────────────────────────────
const demo = await login('student@sanroai.com');
const home = await json('/learning/home', { headers: demo });
const grades = gradesOf(home.body ?? {});
console.log(`\nstudent@sanroai.com: ${grades.length} classes — ${grades.map((g) => g.grade).join(', ')}`);
check('home flags the account as all-classes', home.body?.allGrades === true);
check('home lists every seeded class', grades.length >= 10, `got ${grades.length}`);
check('every class keeps its subjects', grades.every((g) => (g.subjects ?? []).length > 0));

const other = grades.find((g) => g.grade !== '10' && (g.subjects ?? []).length > 0);
check('a class other than the primary class is present', Boolean(other));

if (other) {
  const board = home.body.boards.find((b) => b.grades.some((g) => g.id === other.id));
  const subject = other.subjects[0];
  const list = await json(
    `/learning/boards/${board.id}/grades/${other.grade}/subjects/${subject.id}/chapters`,
    { headers: demo },
  );
  check(`class ${other.grade} chapter list`, list.status === 200, `status ${list.status}`);
  const chapter = list.body?.chapters?.[0];
  check(`class ${other.grade} has a chapter`, Boolean(chapter));

  if (chapter) {
    const hub = await json(`/learning/chapters/${chapter.id}`, { headers: demo });
    check(`class ${other.grade} chapter hub opens`, hub.status === 200, `status ${hub.status}`);

    const pages = await json(`/learning/chapters/${chapter.id}/pages`, { headers: demo });
    check(`class ${other.grade} textbook pages`, pages.status === 200, `status ${pages.status}`);

    const pdfLink = await json(`/learning/chapters/${chapter.id}/pdf-link`, {
      method: 'POST',
      headers: demo,
    });
    check(
      `class ${other.grade} PDF link`,
      pdfLink.status === 200 || pdfLink.status === 201 || pdfLink.status === 404,
      `status ${pdfLink.status}`,
    );

    const concept = hub.body?.concepts?.find((c) => c.id);
    if (concept) {
      const detail = await json(`/learning/concepts/${concept.id}`, { headers: demo });
      check(`class ${other.grade} concept opens`, detail.status === 200, `status ${detail.status}`);

      const practice = await json('/learning/practice/start', {
        method: 'POST',
        headers: { ...demo, 'Content-Type': 'application/json' },
        body: JSON.stringify({ conceptId: concept.id, questionCount: 3 }),
      });
      check(
        `class ${other.grade} concept practice starts`,
        practice.status === 200 || practice.status === 201,
        `status ${practice.status}`,
      );

      const chapterPractice = await json('/learning/practice/start', {
        method: 'POST',
        headers: { ...demo, 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: chapter.id, questionCount: 3 }),
      });
      check(
        `class ${other.grade} chapter practice starts`,
        chapterPractice.status === 200 || chapterPractice.status === 201,
        `status ${chapterPractice.status}`,
      );
    }

    const chat = await json('/chat/ask-sanro', {
      method: 'POST',
      headers: { ...demo, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is this chapter about?', chapterId: chapter.id }),
    });
    check(`class ${other.grade} AI chat answers`, chat.status === 200 || chat.status === 201, `status ${chat.status}`);
  }
}

const path = await json('/learning/path', { headers: demo });
check('learning path builds', path.status === 200, `status ${path.status}`);
// `grades` is the explicit list for a scoped student; an unrestricted account
// reports `allGrades: true` instead (an empty list would read as "no classes").
check(
  'learning path reports the same class access as home',
  home.body?.allGrades
    ? path.body?.student?.allGrades === true
    : (path.body?.student?.grades ?? []).length === grades.length,
  JSON.stringify(path.body?.student ?? null),
);

// ─── a single-class student is still scoped ───────────────────────────────────
const single = await login('student8@sanroai.com');
const singleHome = await json('/learning/home', { headers: single });
const singleGrades = gradesOf(singleHome.body ?? {});
console.log(`\nstudent8@sanroai.com: ${singleGrades.map((g) => g.grade).join(', ') || '(none)'}`);
check('single-class home is not flagged all-classes', singleHome.body?.allGrades !== true);
check('single-class home lists one class', singleGrades.length === 1, `got ${singleGrades.length}`);

const class10 = grades.find((g) => g.grade === '10');
if (class10) {
  const board = home.body.boards.find((b) => b.grades.some((g) => g.id === class10.id));
  const subject = class10.subjects[0];
  // The chapter is looked up with the all-classes token: the class-8 student is
  // already refused the class-10 chapter list, which is why the id has to come
  // from an account that may read it.
  const list = await json(
    `/learning/boards/${board.id}/grades/10/subjects/${subject.id}/chapters`,
    { headers: demo },
  );
  const chapter = list.body?.chapters?.[0] ?? null;
  const deniedList = await json(
    `/learning/boards/${board.id}/grades/10/subjects/${subject.id}/chapters`,
    { headers: single },
  );
  check(
    'class-8 student is refused the class-10 chapter list',
    deniedList.status === 403,
    `status ${deniedList.status}`,
  );
  if (chapter) {
    const hub = await json(`/learning/chapters/${chapter.id}`, { headers: single });
    check('class-8 student is refused a class-10 chapter (403)', hub.status === 403, `status ${hub.status}`);
    const pages = await json(`/learning/chapters/${chapter.id}/pages`, { headers: single });
    check('class-8 student is refused class-10 pages (403)', pages.status === 403, `status ${pages.status}`);
  } else {
    check('class-10 chapter reachable for the negative test', false, 'no chapter returned');
  }
}

// ─── enrolling an existing student in a second class (people API) ────────────
const principal = await login('principal@sanroai.com');
const found = await json('/students?search=student8%40sanroai.com', { headers: principal });
const target = (found.body?.students ?? []).find((s) => s.email === 'student8@sanroai.com');
check('people list exposes grades', Array.isArray(target?.grades), JSON.stringify(target?.grades ?? null));

if (target) {
  const patch = await json(`/students/${target.id}`, {
    method: 'PATCH',
    headers: { ...principal, 'Content-Type': 'application/json' },
    body: JSON.stringify({ grades: ['8', '9'] }),
  });
  check('PATCH grades accepts several classes', patch.status === 200, `status ${patch.status}`);

  const detail = await json(`/students/${target.id}`, { headers: principal });
  check(
    'student detail reports both classes',
    JSON.stringify(detail.body?.grades ?? []) === JSON.stringify(['8', '9']),
    JSON.stringify(detail.body?.grades ?? null),
  );

  const after = await json('/learning/home', { headers: single });
  const afterGrades = gradesOf(after.body ?? {}).map((g) => g.grade).sort();
  console.log(`student8 after enrolment: ${afterGrades.join(', ')}`);
  check('home now lists both classes', JSON.stringify(afterGrades) === JSON.stringify(['8', '9']));
  check('home is not flagged all-classes', after.body?.allGrades !== true);

  const restore = await json(`/students/${target.id}`, {
    method: 'PATCH',
    headers: { ...principal, 'Content-Type': 'application/json' },
    body: JSON.stringify({ grades: ['8'] }),
  });
  const restored = await json('/learning/home', { headers: single });
  check(
    'removing the second class restores the single-class scope',
    restore.status === 200 && gradesOf(restored.body ?? {}).length === 1,
    `status ${restore.status}, ${gradesOf(restored.body ?? {}).map((g) => g.grade).join(',')}`,
  );
}

const failures = results.filter((r) => !r.ok).length;
console.log(failures === 0 ? '\nRESULT: PASS' : `\nRESULT: ${failures} FAILURE(S)`);
process.exitCode = failures === 0 ? 0 : 1;
