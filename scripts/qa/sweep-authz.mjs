// Dynamic authorization sweep: probes every reachable GET route against every
// QA role and reports anomalies worth a human look.
//
// Anomaly = a role that is NOT staff (STUDENT / PARENT) getting 200 on a route
// whose path suggests another user's resource. Read-only: only GETs, no bodies.
import { readFileSync } from 'node:fs';
import { QA_PASSWORD } from './_env.mjs';

const BASE = 'http://localhost:4000/api/v1';
const PW = QA_PASSWORD;

const ACCOUNTS = {
  SA: 'admin@sanroai.com',
  IA: 'principal@sanroai.com',
  TEACHER: 'teacher@sanroai.com',
  STUDENT: 'student@sanroai.com',
  PARENT: 'parent@sanroai.com',
};
const NON_STAFF = ['STUDENT', 'PARENT'];

async function login(email) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: PW }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`login failed ${email}: ${r.status}`);
  return j.accessToken;
}

const tokens = {};
for (const [role, email] of Object.entries(ACCOUNTS)) tokens[role] = await login(email);

// Extract GET routes from controllers (verb + literal path, params kept as :x).
const src = readFileSync('apps/api/src/routes-for-sweep.txt', 'utf8');
const routes = [];
for (const line of src.split(/\r?\n/)) {
  const m = line.match(/^\s*GET\s+(\S+)/);
  if (!m) continue;
  const path = m[1].replace(/^'|'$/g, '');
  if (path.includes('*')) continue;
  routes.push(path);
}
const uniq = [...new Set(routes)];
console.log(`sweeping ${uniq.length} GET routes x ${Object.keys(tokens).length} roles\n`);

// Substitute a stable non-UUID-looking sentinel so the param is present but
// guaranteed not to resolve — we are measuring the ACCESS DECISION, not data.
const sub = (p) => p.replace(/:[A-Za-z0-9_]+/g, '00000000-0000-0000-0000-000000000000');

const results = [];
for (const route of uniq) {
  const path = sub(route);
  const row = { route, status: {} };
  for (const [role, tok] of Object.entries(tokens)) {
    try {
      const r = await fetch(`${BASE}${path}`, { headers: { authorization: `Bearer ${tok}` } });
      row.status[role] = r.status;
      await r.arrayBuffer().catch(() => {});
    } catch {
      row.status[role] = 'ERR';
    }
  }
  results.push(row);
}

// Report 1: routes where NO role gets 401/403 (always-open reads).
const alwaysOpen = results.filter((r) => Object.values(r.status).every((s) => s === 200));
console.log(`=== routes returning 200 for EVERY role (including students/parents) [${alwaysOpen.length}] ===`);
for (const r of alwaysOpen) console.log('  ', r.route, JSON.stringify(r.status));

// Report 2: routes where a non-staff role gets 200 but something is odd.
console.log(`\n=== non-staff roles reaching 200 (candidates for manual review) [count] ===`);
const nonStaffOk = results.filter(
  (r) => NON_STAFF.some((role) => r.status[role] === 200)
);
console.log('  total:', nonStaffOk.length);

// Report 3: routes where NOBODY is authorized (dead or fully denied).
const nobody = results.filter((r) => Object.values(r.status).every((s) => s === 401 || s === 403 || s === 404));
console.log(`\n=== routes denied to every role [${nobody.length}] (dead endpoints?) ===`);
for (const r of nobody) console.log('  ', r.route, JSON.stringify(r.status));

// Report 4: 5xx from any role (robustness regressions).
console.log('\n=== routes returning 5xx to any role ===');
let five = 0;
for (const r of results) {
  const bad = Object.entries(r.status).filter(([, s]) => typeof s === 'number' && s >= 500);
  if (bad.length) { console.log('  ', r.route, JSON.stringify(r.status)); five++; }
}
if (!five) console.log('   none');

console.log(`\n=== SUMMARY: ${results.length} routes swept ===`);
