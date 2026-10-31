// Every lesson video must be navigable: a real creator chapter when YouTube has
// one, otherwise the concept split the API derives from the chapter's concepts.
//
//   node scripts/qa/probe-video-segments.mjs [--grade 10]
//
// Fails when a VIDEO lesson reachable by the student exposes no markers, when a
// marker is out of order, or when a marker starts past the end of the video.
import { QA_PASSWORD } from './_env.mjs';

const API = process.env.API_URL ?? 'http://localhost:4000/api/v1';
const argv = process.argv.slice(2);
const gradeArg = argv.indexOf('--grade');

async function login(email) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: QA_PASSWORD }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`login ${email} -> ${res.status}`);
  return json.accessToken ?? json.tokens?.accessToken;
}

const token = await login(gradeArg >= 0 && argv[gradeArg + 1] === '8' ? 'student8@sanroai.com'
  : gradeArg >= 0 && argv[gradeArg + 1] === '9' ? 'student9@sanroai.com'
  : 'student@sanroai.com');

const get = async (path) => {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return { status: res.status, json: await res.json().catch(() => null) };
};

const path = await get('/learning/path');
if (path.status !== 200) {
  console.error(`FAIL  GET /learning/path -> ${path.status}`);
  process.exit(1);
}

const chapterIds = [...new Set((path.json.track ?? []).map((node) => node.chapterId).filter(Boolean))];

let checked = 0;
let real = 0;
let derived = 0;
const failures = [];

for (const chapterId of chapterIds) {
  const hub = await get(`/learning/chapters/${chapterId}`);
  if (hub.status !== 200) {
    failures.push(`${chapterId}: hub ${hub.status}`);
    continue;
  }
  for (const video of hub.json.videos ?? []) {
    checked += 1;
    const segments = Array.isArray(video.segments) ? video.segments : [];
    const label = `${hub.json.code ?? hub.json.name} · ${video.title}`;
    if (segments.length === 0) {
      failures.push(`${label}: no markers`);
      continue;
    }
    if (segments.every((s) => s.derived === true)) derived += 1;
    else real += 1;

    const duration = typeof video.durationSeconds === 'number' ? video.durationSeconds : null;
    let previous = -1;
    for (const segment of segments) {
      if (!(segment.startSeconds > previous)) {
        failures.push(`${label}: marker out of order at ${segment.startSeconds}`);
        break;
      }
      if (duration !== null && segment.startSeconds >= duration) {
        failures.push(`${label}: marker ${segment.startSeconds}s past the ${duration}s runtime`);
        break;
      }
      previous = segment.startSeconds;
    }
  }
}

console.log(`\nvideo markers: ${checked} lesson videos across ${chapterIds.length} chapters`);
console.log(`  creator chapters: ${real}`);
console.log(`  derived concept split: ${derived}`);

if (failures.length) {
  console.error(`\n${failures.length} FAIL`);
  for (const failure of failures.slice(0, 20)) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('\nPASS - every lesson video is navigable');
