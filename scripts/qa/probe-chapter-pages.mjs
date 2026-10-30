/**
 * Probe: chapter textbook pages (list + signed image URLs + public PNG).
 *   node scripts/qa/probe-chapter-pages.mjs
 */
import { QA_PASSWORD } from './_env.mjs';

const API = process.env.API_URL ?? 'http://localhost:4000/api/v1';

const auth = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'student@sanroai.com', password: QA_PASSWORD }),
}).then((r) => r.json());
const token = auth.accessToken ?? auth.token;
const H = { Authorization: `Bearer ${token}` };

const home = await fetch(`${API}/learning/home`, { headers: H }).then((r) => r.json());
const board = home.boards?.[0];
const grade = board?.grades?.find((g) => g.subjects?.length);
const subject = grade?.subjects?.[0];
const chapters = await fetch(
  `${API}/learning/boards/${board.id}/grades/${grade.grade}/subjects/${subject.id}/chapters`,
  { headers: H },
).then((r) => r.json());

let failures = 0;
for (const chapter of chapters.chapters.slice(0, 3)) {
  const res = await fetch(`${API}/learning/chapters/${chapter.id}/pages`, { headers: H });
  const body = await res.json();
  console.log(`  ${chapter.code} list: ${res.status} count=${body.count}`);

  if (!body.count) {
    console.log('    (no pages on disk for this chapter)');
    continue;
  }

  const first = await fetch(`http://localhost:4000/api/v1${body.pages[0].path}`);
  const bytes = Buffer.from(await first.arrayBuffer());
  const isPng = bytes.subarray(1, 4).toString() === 'PNG';
  console.log(`    page 1: ${first.status} ${first.headers.get('content-type')} ${bytes.length} bytes png=${isPng}`);
  if (first.status !== 200 || !isPng) failures += 1;

  const last = await fetch(`http://localhost:4000/api/v1${body.pages[body.count - 1].path}`);
  console.log(`    page ${body.count}: ${last.status}`);
  if (last.status !== 200) failures += 1;

  const past = await fetch(`http://localhost:4000/api/v1${body.pages[0].path.replace(/pages\/\d+/, `pages/${body.count + 1}`)}`);
  console.log(`    page ${body.count + 1} (does not exist): ${past.status} (expected 404)`);
  if (past.status !== 404) failures += 1;

  const tampered = await fetch(`http://localhost:4000/api/v1${body.pages[0].path.replace(/sig=[^&]+/, 'sig=deadbeef')}`);
  console.log(`    tampered signature: ${tampered.status} (expected 401)`);
  if (tampered.status !== 401) failures += 1;
}

const noAuth = await fetch(`${API}/learning/chapters/${chapters.chapters[0].id}/pages`);
console.log(`  list without token: ${noAuth.status} (expected 401)`);
if (noAuth.status !== 401) failures += 1;

console.log(failures === 0 ? '  RESULT: PASS' : `  RESULT: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
