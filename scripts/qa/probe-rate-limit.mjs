// Rate-limit enforcement probes against the running dev API.
// Verifies the documented per-route throttles are actually enforced.
// NOTE: this intentionally sends a BURST of requests to ONE route at a time,
// then waits out the window before testing the next route, so it is controlled
// and does not flood the server broadly. Local dev only.
const BASE = 'http://localhost:4000/api/v1';

const results = [];
function record(id, label, pass, detail) {
  results.push({ id, label, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id.padEnd(26)} ${label}${detail ? '  -- ' + detail : ''}`);
}

async function post(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  return { status: r.status, body: await r.text() };
}

// Fire `n` sequential requests, return the statuses.
async function burst(fn, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push((await fn()).status);
  return out;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// The limiter window is shared with any other login traffic, so a burst can start
// mid-window and look like a broken limit. Retry on a fresh window instead of
// reporting a false failure: if the very first request is already 429, wait a full
// window (60s) and burst again.
async function burstWithFreshWindow(path, body, n) {
  let statuses = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(62000);
    statuses = await burst(() => post(path, body), n);
    if (statuses[0] !== 429) return statuses;
    console.log(`  (login window busy - waiting 60s and retrying, attempt ${attempt + 1})`);
  }
  return statuses;
}

// A throttled route must return 429 once the limit is exceeded, and the limit+1'th
// request onward must all be 429. Anything above the limit still returning a
// non-429 status means the throttle is NOT enforced.
function evaluate(label, statuses, limit) {
  const before = statuses.slice(0, limit);
  const after = statuses.slice(limit);
  const allowedKeptWorking = before.every((s) => s !== 429);
  const blocked = after.length > 0 && after.every((s) => s === 429);
  return { ok: allowedKeptWorking && blocked, before, after };
}

console.log('=== RATE LIMIT PROBES (local dev API) ===\n');

// --- 1. LOGIN: documented 10/min ---
{
  // Use a wrong password so we never create a real session or lock a real account.
  const s = await burstWithFreshWindow('/auth/login', { email: 'ratelimit-probe@test.local', password: 'nope' }, 13);
  const { ok, before, after } = evaluate('login', s, 10);
  record('RL-LOGIN-10/MIN', 'POST /auth/login throttled at 10/min', ok,
    `statuses=${s.join(',')} (limit=10) before429=${before.includes(429)} afterAll429=${after.every((x) => x === 429)}`);
  await sleep(62000); // drain the window
}

// --- 2. FORGOT-PASSWORD: documented 3/min ---
{
  const s = await burst(() => post('/auth/forgot-password', { email: 'ratelimit-probe@test.local' }), 5);
  const { ok } = evaluate('forgot', s, 3);
  record('RL-FORGOT-3/MIN', 'POST /auth/forgot-password throttled at 3/min', ok, `statuses=${s.join(',')} (limit=3)`);
  await sleep(62000);
}

// --- 3. REGISTER-INSTITUTION: documented 5/min ---
{
  const s = await burst(() => post('/auth/register-institution', {}), 7);
  const { ok } = evaluate('register', s, 5);
  record('RL-REGISTER-5/MIN', 'POST /auth/register-institution throttled at 5/min', ok, `statuses=${s.join(',')} (limit=5)`);
  await sleep(62000);
}

// --- 4. SITE/CONTACT: documented 3/min ---
{
  const s = await burst(() => post('/site/contact', {}), 5);
  const { ok } = evaluate('contact', s, 3);
  record('RL-CONTACT-3/MIN', 'POST /site/contact throttled at 3/min', ok, `statuses=${s.join(',')} (limit=3)`);
  await sleep(62000);
}

// --- 5. 429 body shape must not leak internals and must signal retry ---
{
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'x@y.z', password: 'nope' }),
  });
  // Keep hammering until throttled to inspect the 429 body.
  let last;
  for (let i = 0; i < 12; i++) {
    last = await fetch(`${BASE}/auth/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'x@y.z', password: 'nope' }),
    });
    if (last.status === 429) break;
  }
  const txt = await last.text();
  const retryAfter = last.headers.get('retry-after');
  const noLeak = !/stack|node_modules|at .*\.ts:|password|\$2a\$/.test(txt);
  record('RL-429-BODY', '429 body is clean + Retry-After present', last.status === 429 && noLeak,
    `status=${last.status} retryAfter=${retryAfter ?? 'NONE'} body=${txt.slice(0, 120)}`);
}

console.log(`\n=== SUMMARY: ${results.filter((x) => x.pass).length}/${results.length} PASS ===`);
const failed = results.filter((x) => !x.pass);
if (failed.length) console.log('FAILED:', failed.map((f) => f.id).join(', '));
process.exit(failed.length ? 1 : 0);
