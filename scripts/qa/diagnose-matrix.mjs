import { QA_PASSWORD as QA_PASSWORD } from './_env.mjs';

// Diagnostic harness: prints exact status + error code for each failing matrix case.
// Read-only: no mutations. Run with: node scripts/qa/diagnose-matrix.mjs
const BASE = process.env.QA_API ?? 'http://localhost:4000/api/v1';
const PASSWORD = QA_PASSWORD;

const ACCOUNTS = {
  SA: 'admin@sanroai.com',
  IA: 'principal@sanroai.com',
  TEACHER: 'teacher@sanroai.com',
  STUDENT: 'student@sanroai.com',
  PARENT: 'parent@sanroai.com',
};

const CASES = [
  ['INST-MINE', 'get', '/institutions/mine', ['SA']],
  ['INST-MINE-STATS', 'get', '/institutions/mine/stats', ['SA']],
  ['ASSESS-LIST', 'get', '/assessments', ['STUDENT', 'PARENT']],
  ['LEARN-GAMIFICATION', 'get', '/learning/gamification/profile', ['PARENT']],
  ['LEARN-ACHIEVEMENTS', 'get', '/learning/gamification/achievements', ['PARENT']],
  ['LEARN-HOME', 'get', '/learning/home', ['SA', 'IA', 'TEACHER']],
  ['REMED-PLANS', 'get', '/remediation/plans', ['SA', 'STUDENT', 'PARENT']],
  ['REMED-WEAK', 'get', '/remediation/weak', ['SA', 'PARENT']],
  ['REPORTS-CLASS', 'get', '/reports/class/00000000-0000-0000-0000-000000000000', ['SA', 'IA', 'TEACHER']],
  ['REPORTS-STUDENT', 'get', '/reports/student/00000000-0000-0000-0000-000000000000', ['SA', 'IA', 'TEACHER']],
  ['REPORTS-IMPROVEMENT', 'get', '/reports/improvement', ['SA', 'IA', 'TEACHER']],
  ['AR-TEACHER', 'get', '/ar/teacher', ['SA']],
  ['LIB-ASSIGNMENTS', 'get', '/admin/library/assignments', ['SA', 'IA', 'TEACHER']],
  ['PEOPLE-PARENTS-DASHBOARD', 'get', '/parents/me/dashboard', ['SA', 'STUDENT']],
];

const tokens = {};
for (const [role, email] of Object.entries(ACCOUNTS)) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status !== 200) {
    console.log(`LOGIN-FAIL ${role} ${res.status} ${body.code ?? ''}`);
    continue;
  }
  tokens[role] = body.accessToken;
}

console.log('=== subscription / account-state per role ===');
for (const role of Object.keys(ACCOUNTS)) {
  if (!tokens[role]) continue;
  const res = await fetch(`${BASE}/auth/account-state`, { headers: { authorization: `Bearer ${tokens[role]}` } });
  const body = await res.json().catch(() => ({}));
  console.log(`${role.padEnd(8)} account-state ${res.status} ${JSON.stringify(body)}`);
}

console.log('\n=== failing cases: exact status + code + message ===');
for (const [id, method, path, roles] of CASES) {
  for (const role of roles) {
    if (!tokens[role]) continue;
    const res = await fetch(`${BASE}${path}`, {
      method: method.toUpperCase(),
      headers: { authorization: `Bearer ${tokens[role]}`, 'content-type': 'application/json' },
      body: method === 'get' ? undefined : '{}',
    });
    const body = await res.json().catch(() => ({}));
    const msg = (body.message ?? '').toString().slice(0, 90).replace(/\s+/g, ' ');
    console.log(`${id.padEnd(24)} ${role.padEnd(8)} ${res.status}  ${(body.code ?? '-').padEnd(20)} ${msg}`);
  }
}
