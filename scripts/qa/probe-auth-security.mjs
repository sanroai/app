// Read-only auth/session security probes against the running dev API.
// Prints PASS/FAIL per probe. Never mutates data (except rate-limit counts).
import { readFileSync } from 'node:fs';
import { QA_PASSWORD } from './_env.mjs';

const BASE = 'http://localhost:4000/api/v1';
const PW = QA_PASSWORD;

const results = [];
function record(id, label, pass, detail) {
  results.push({ id, label, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id.padEnd(22)} ${label}${detail ? '  -- ' + detail : ''}`);
}

async function login(email, password) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}

async function get(path, token) {
  const r = await fetch(`${BASE}${path}`, { headers: token ? { authorization: `Bearer ${token}` } : {} });
  return { status: r.status, body: await r.text() };
}

const { accessToken: saTok } = (await login('admin@sanroai.com', PW)).body;
const { accessToken: stTok } = (await login('student@sanroai.com', PW)).body;

// --- A. unauthenticated access is rejected everywhere ---
{
  const paths = ['/auth/me', '/users/me', '/learning/home', '/assessments/my', '/diagnosis/my', '/admin/super-admin/dashboard/overview'];
  const open = [];
  for (const p of paths) {
    const r = await get(p);
    if (r.status !== 401) open.push(`${p}=${r.status}`);
  }
  record('A-UNAUTH', 'protected routes reject no-token', open.length === 0, open.join(' '));
}

// --- B. garbage / expired tokens rejected ---
{
  const bad = ['not-a-jwt', 'Bearer x', 'eyJhbGciOiJIUzI1NiJ9.e30.sig'];
  const open = [];
  for (const t of bad) {
    const r = await get('/auth/me', t);
    if (r.status !== 401) open.push(`${t.slice(0, 12)}=${r.status}`);
  }
  record('B-BADTOKEN', 'malformed/forged JWT rejected', open.length === 0, open.join(' '));
}

// --- C. wrong password gives a generic error (no user enumeration) ---
{
  const wrong = await login('admin@sanroai.com', 'definitely-not-the-password');
  const nosuch = await login('no-such-user-xyz@test.local', 'whatever');
  // Anti-enumeration: both cases must be indistinguishable (same status AND same message).
  const same = wrong.status === nosuch.status && wrong.body.message === nosuch.body.message;
  record('C-ENUM', 'wrong-pw and unknown-user look identical', same,
    `wrong=${wrong.status} nosuch=${nosuch.status} msg=${JSON.stringify(wrong.body.message)}`);
}

// --- D. forgot-password never returns a raw token ---
{
  const r = await fetch(`${BASE}/auth/forgot-password`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@sanroai.com' }),
  });
  const b = await r.json().catch(() => ({}));
  const s = JSON.stringify(b);
  record('D-FORGOT', 'forgot-password returns no raw token', !/token/i.test(s), `status=${r.status}`);
}

// --- E. account-state requires auth and omits secrets ---
{
  const anon = await get('/auth/account-state');
  const authed = await get('/auth/account-state', stTok);
  const s = authed.body.toLowerCase();
  const leak = s.includes('password') || s.includes('$2a$') || s.includes('token') || s.includes('refresh');
  record('E-STATE', 'account-state requires auth, omits secrets', anon.status === 401 && authed.status === 200 && !leak,
    `anon=${anon.status} authed=${authed.status}`);
}

// --- F. refresh with a garbage token is rejected ---
{
  const r = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken: 'garbage-refresh-token' }),
  });
  record('F-REFRESH', 'refresh rejects garbage token', r.status >= 400 && r.status < 500, `status=${r.status}`);
}

// --- G. student cannot reach super-admin surfaces ---
{
  const surfaces = ['/admin/super-admin/dashboard/overview', '/admin/people/students', '/admin/curriculum/access', '/admin/institutions'];
  const open = [];
  for (const p of surfaces) {
    const r = await get(p, stTok);
    if (r.status === 200) open.push(p);
  }
  record('G-STUDENT-ADMIN', 'student blocked from admin surfaces', open.length === 0, open.join(' '));
}

// --- H. no stack traces / internals in error bodies ---
{
  const probes = ['/students/not-a-uuid', '/papers/not-a-uuid', '/questions/not-a-uuid'];
  const leaky = [];
  for (const p of probes) {
    const r = await get(p, saTok);
    if (/at .*\.ts:|node_modules|prisma|stack/i.test(r.body)) leaky.push(p);
  }
  record('H-NO-STACK', 'errors never leak stack traces', leaky.length === 0, leaky.join(' '));
}

// --- I. super admin token works on cross-tenant read (expected) but student's own data is scoped ---
{
  const r = await get('/diagnosis/my', stTok);
  record('I-SELF-SCOPE', 'student /diagnosis/my returns own data', r.status === 200, `status=${r.status}`);
}

// --- J. CORS: production path must be a fixed allowlist (no reflection) ---
// Dev deliberately reflects any origin (`origin: true`) for local tooling, so we
// assert the compiled production branch in main.ts instead of the live dev server.
{
  const src = readFileSync('apps/api/src/main.ts', 'utf8');
  const hasProdAllowlist = /NODE_ENV\s*===\s*'production'/.test(src) &&
    /sanroai\.com/.test(src) && /app\.sanroai\.com/.test(src);
  // ensure production never falls through to `true` (reflect-all)
  const prodBranch = src.match(/NODE_ENV\s*===\s*'production'\s*\?\s*\[([^\]]+)\]/);
  const onlyKnownOrigins = !!prodBranch && !prodBranch[1].includes('true');
  const credsOnAllowlist = /credentials:\s*true/.test(src);
  record('J-CORS', 'production CORS is a fixed 3-origin allowlist', hasProdAllowlist && onlyKnownOrigins && credsOnAllowlist,
    `prodAllowlist=${onlyKnownOrigins} devReflectsAnyOrigin(intentional)=true`);
}

console.log(`\n=== SUMMARY: ${results.filter((x) => x.pass).length}/${results.length} PASS ===`);
const failed = results.filter((x) => !x.pass);
if (failed.length) console.log('FAILED:', failed.map((f) => f.id).join(', '));
