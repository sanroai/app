// Times the endpoints a tap opens, so "it feels slow" gets a number.
//
//   node scripts/qa/probe-latency.mjs [--api https://api.sanroai.com/api/v1] [--rounds 2]
//
// Reports the first (cold) hit and the warm median for each screen. A slow API
// is not a slow client: this separates the network + server time from anything
// the app does with the payload.
const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};

const API = arg('--api', 'https://api.sanroai.com/api/v1');
const ROUNDS = Number(arg('--rounds', '2'));
const EMAIL = arg('--email', 'student@sanroai.com');
const PASSWORD = arg('--password', process.env.QA_PASSWORD ?? 'Sanro@2026');

const time = async (label, path, token) => {
  const started = Date.now();
  const res = await fetch(`${API}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const ms = Date.now() - started;
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { label, path, status: res.status, ms, body };
};

const loginRes = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const login = await loginRes.json();
if (!loginRes.ok) {
  console.error(`login failed: ${loginRes.status} ${JSON.stringify(login).slice(0, 200)}`);
  process.exit(1);
}
const token = login.accessToken;

const home = await time('home', '/learning/home', token);
const board = home.body?.boards?.[0];
const grade = board?.grades?.[0];
const subject = grade?.subjects?.[0];

const path = await time('path', '/learning/path', token);
const nextConceptId = path.body?.next?.conceptId ?? path.body?.track?.[0]?.conceptId;
const chapterId = path.body?.track?.[0]?.chapterId;

const targets = [
  ['chapters list', `/learning/boards/${board?.id}/grades/${grade?.grade}/subjects/${subject?.id}/chapters`],
  ['chapter hub', chapterId ? `/learning/chapters/${chapterId}` : null],
  ['concept detail', nextConceptId ? `/learning/concepts/${nextConceptId}` : null],
  ['review queue', '/learning/review'],
  ['puzzle: chapter pages', chapterId ? `/learning/chapters/${chapterId}/pages` : null],
].filter(([, p]) => p);

const label = { 'chapters list': home, path: path, 'chapter hub': null };

const rows = [];
for (const [name, endpoint] of targets) {
  const samples = [];
  for (let round = 0; round < ROUNDS; round += 1) {
    const result = await time(name, endpoint, token);
    samples.push(result);
  }
  const warm = samples.slice(1).map((s) => s.ms).sort((a, b) => a - b);
  rows.push({
    screen: name,
    status: samples[samples.length - 1].status,
    cold: samples[0].ms,
    warm: warm.length ? warm[Math.floor(warm.length / 2)] : samples[0].ms,
    bytes: JSON.stringify(samples[samples.length - 1].body ?? null).length,
  });
}

console.log(`  api: ${API}`);
console.log(`  email: ${EMAIL}`);
console.log('');
console.log('  screen                 status   cold   warm      payload');
for (const row of rows) {
  console.log(
    `  ${row.screen.padEnd(22)} ${String(row.status).padEnd(6)} ${String(row.cold).padStart(5)}ms ${String(row.warm).padStart(5)}ms ${(row.bytes / 1024).toFixed(1).padStart(8)} KB`,
  );
}

const slowest = [...rows].sort((a, b) => b.warm - a.warm)[0];
if (slowest && slowest.warm > 1500) {
  console.log(`\n  SLOW: ${slowest.screen} takes ${slowest.warm}ms warm`);
  process.exit(1);
}
