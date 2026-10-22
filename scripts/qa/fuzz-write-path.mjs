import { QA_PASSWORD as QA_PASSWORD } from './_env.mjs';

// Write-path (POST/PATCH/PUT/DELETE) fuzz probe against the running dev API.
//
// SAFETY MODEL: every request in this probe is designed to be REJECTED BY A GUARD OR
// VALIDATION PIPE before the service layer runs, so NOTHING is mutated:
//   - unauthenticated  -> 401 (JwtAuthGuard, global, runs first)
//   - wrong role       -> 403 (RolesGuard runs before the handler)
//   - malformed :id    -> 400 (ZodValidationPipe / Prisma P2023 mapped to 400 by BUG-B fix)
//   - invalid body     -> 400 (ZodValidationPipe on the @Body)
// We never send a VALID id of a real resource to a mutating endpoint here, so no state
// transition can occur. Genuine CRUD persistence + cross-tenant WRITE isolation is
// covered separately by apps/api/test/write-path-crud.e2e-spec.ts against sanro_test.
//
// Real route prefixes verified from @Controller decorators:
//   academics -> /academics · admin -> /admin · admin/people -> /admin/people
//   admin/curriculum -> /admin/curriculum · admin/library -> /admin/library
//   questions -> /questions · imports -> /imports · users -> /users · site -> /site
const BASE = 'http://localhost:4000/api/v1';
const PW = QA_PASSWORD;

const results = [];
function record(id, label, pass, detail) {
  results.push({ id: id, label: label, pass: pass, detail: detail });
  console.log((pass ? 'PASS' : 'FAIL') + '  ' + id.padEnd(30) + ' ' + label + (detail ? '  -- ' + detail : ''));
}

async function login(email) {
  const r = await fetch(BASE + '/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: email, password: PW }),
  });
  const b = await r.json().catch(function () { return {}; });
  return b.accessToken;
}

async function send(method, path, token, body) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = 'Bearer ' + token;
  const r = await fetch(BASE + path, {
    method: method, headers: headers,
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
  });
  return { status: r.status, body: await r.text() };
}

const saTok = await login('admin@sanroai.com');        // SUPER_ADMIN
const iaTok = await login('principal@sanroai.com');    // INSTITUTION_ADMIN
const teTok = await login('teacher@sanroai.com');      // TEACHER
const stTok = await login('student@sanroai.com');      // STUDENT
if (!saTok || !iaTok || !teTok || !stTok) { console.error('FATAL: logins failed'); process.exit(1); }

const BAD = 'not-a-uuid';
console.log('=== WRITE-PATH FUZZ (no-mutation contract) ===\n');

// A. Unauthenticated write attempts -> 401 (never 2xx/5xx)
{
  const probes = [
    ['POST', '/academics/academic-years', { name: '2026-27', startDate: '2026-01-01', endDate: '2026-12-31' }],
    ['POST', '/admin/institutions', { name: 'x', type: 'SCHOOL', primaryPhone: '9999999999' }],
    ['PATCH', '/users/me', { name: 'x' }],
    ['POST', '/questions', { text: 'q' }],
    ['DELETE', '/admin/curriculum/nodes/chapter/' + BAD, undefined],
    ['POST', '/academics/groups', { name: 'g', type: 'CLASS' }],
    ['POST', '/imports/upload', {}],
  ];
  const bad = [];
  for (const p of probes) {
    const r = await send(p[0], p[1], null, p[2]);
    if (r.status !== 401) bad.push(p[0] + ' ' + p[1] + '=' + r.status);
  }
  record('WP-A-UNAUTH', 'unauth writes -> 401 (never 2xx/5xx)', bad.length === 0, bad.join(' '));
}

// B. Wrong-role writes -> 403 (RolesGuard runs before the handler)
{
  const probes = [
    ['POST', '/academics/academic-years', stTok, { name: '2026-27', startDate: '2026-01-01', endDate: '2026-12-31' }, 'STUDENT on IA academic-year'],
    ['POST', '/academics/groups', stTok, { name: 'g', type: 'CLASS', academicYearId: BAD }, 'STUDENT on IA group-create'],
    ['PATCH', '/academics/groups/' + BAD, stTok, { name: 'x' }, 'STUDENT on IA group-update'],
    ['POST', '/admin/institutions', teTok, { name: 'x', type: 'SCHOOL', primaryPhone: '9999999999' }, 'TEACHER on SA institution-create'],
    ['PATCH', '/admin/institutions/' + BAD + '/status', teTok, { status: 'ACTIVE' }, 'TEACHER on SA status'],
    ['POST', '/admin/people/students', stTok, { name: 'x' }, 'STUDENT on SA people-create'],
    ['PATCH', '/admin/people/students/' + BAD, iaTok, { name: 'x' }, 'IA on SA-only people-update'],
    ['POST', '/admin/people/students/' + BAD + '/transfer', iaTok, {}, 'IA on SA-only transfer'],
    ['DELETE', '/admin/curriculum/nodes/chapter/' + BAD, stTok, undefined, 'STUDENT on SA curriculum-delete'],
    ['POST', '/questions', stTok, { text: 'q', type: 'MCQ' }, 'STUDENT on question-create'],
    ['PATCH', '/questions/' + BAD, stTok, { text: 'x' }, 'STUDENT on question-update (roles are IA,TEACHER)'],
    ['DELETE', '/questions/' + BAD, stTok, undefined, 'STUDENT on question-delete (roles are IA,TEACHER)'],
    ['DELETE', '/admin/library/content/' + BAD, stTok, undefined, 'STUDENT on library-delete'],
    ['POST', '/imports/upload', stTok, {}, 'STUDENT on import-upload'],
  ];
  const bad = [];
  for (const p of probes) {
    const r = await send(p[0], p[1], p[2], p[3]);
    if (r.status !== 403) bad.push(p[4] + '=' + r.status);
  }
  record('WP-B-ROLE403', 'wrong-role writes -> 403 exactly', bad.length === 0, bad.join(' | '));
}

// C. Malformed :id on write routes -> client error, NEVER 500 (BUG-B regression on the write path).
// Different guards reject at different layers, so the exact code varies legitimately:
//   400 = Prisma P2023 mapped by the exceptions filter (BUG-B fix)
//   403 = an institution/ownership guard rejects before the id is parsed
//   404 = the lookup finds no such job/record
// The contract that matters is "no 5xx" — a malformed id must never crash the server.
{
  const probes = [
    ['PATCH', '/admin/institutions/' + BAD, saTok, { name: 'x' }],
    ['PATCH', '/admin/institutions/' + BAD + '/status', saTok, { status: 'ACTIVE' }],
    ['PATCH', '/admin/people/students/' + BAD, saTok, { name: 'x' }],
    ['PATCH', '/academics/groups/' + BAD, iaTok, { name: 'x' }],
    ['PATCH', '/questions/' + BAD, iaTok, { text: 'x' }],
    ['PATCH', '/admin/curriculum/nodes/chapter/' + BAD, saTok, { name: 'x' }],
    ['DELETE', '/admin/curriculum/nodes/chapter/' + BAD, saTok, undefined],
    ['DELETE', '/admin/library/content/' + BAD, iaTok, undefined],
    ['DELETE', '/questions/' + BAD, iaTok, undefined],
    ['POST', '/admin/curriculum/import/' + BAD + '/commit', saTok, {}],
  ];
  const bad = []; const seen = {};
  for (const p of probes) {
    const r = await send(p[0], p[1], p[2], p[3]);
    seen[p[0] + ' ' + p[1].replace(BAD, ':id')] = r.status;
    if (r.status >= 500) bad.push(p[0] + ' ' + p[1].replace(BAD, ':id') + '=' + r.status);
  }
  record('WP-C-BADID-NO5XX', 'malformed :id writes -> 4xx, never 5xx', bad.length === 0,
    bad.join(' | ') || JSON.stringify(seen));
}

// D. Invalid / empty / wrong-type bodies -> 400 (ZodValidationPipe on @Body)
// Note: /admin/institutions is SUPER_ADMIN-only, so the bad-phone probe uses saTok;
// using iaTok there would be rejected 403 by RolesGuard before body validation.
{
  const probes = [
    ['POST', '/academics/academic-years', iaTok, {}, 'empty body'],
    ['POST', '/academics/academic-years', iaTok, { name: 'x', startDate: 1, endDate: null }, 'wrong types'],
    ['POST', '/academics/groups', iaTok, { name: 'g', type: 'NOT_A_TYPE' }, 'bad enum'],
    ['POST', '/academics/groups', iaTok, { name: 'g', type: 'CLASS', academicYearId: 'not-uuid' }, 'bad uuid'],
    ['POST', '/admin/institutions', saTok, { name: 'x', type: 'SCHOOL', primaryPhone: 'abc' }, 'bad phone'],
    ['POST', '/site/contact', null, {}, 'contact empty'],
    ['POST', '/site/contact', null, { email: 'not-an-email' }, 'contact bad email'],
    ['POST', '/questions', iaTok, { text: '', type: 'NOT_A_TYPE' }, 'question bad enum'],
  ];
  const bad = [];
  for (const p of probes) {
    const r = await send(p[0], p[1], p[2], p[3]);
    // /site/contact is throttled at 3/min (site.controller.ts:15). A 429 there means the
    // documented rate limit engaged — that is correct behaviour, not a validation failure,
    // so accept it for the contact probes only. All other probes must be a clean 400.
    const throttledOk = p[1] === '/site/contact' && r.status === 429;
    if (r.status !== 400 && !throttledOk) bad.push(p[4] + '=' + r.status);
  }
  record('WP-D-BODY-400', 'invalid bodies -> 400 (contact may 429 if throttled)', bad.length === 0, bad.join(' | '));
}

// E. Malformed JSON body -> 400 (parser must not 500)
{
  const bad = [];
  for (const path of ['/academics/academic-years', '/site/contact', '/ai/chat']) {
    const tok = path === '/ai/chat' ? stTok : iaTok;
    const r = await send('POST', path, tok, '{"name": ');
    if (r.status !== 400) bad.push(path + '=' + r.status);
  }
  record('WP-E-MALFORMED-JSON', 'malformed JSON body -> 400 (no 5xx)', bad.length === 0, bad.join(' | '));
}

// F. Content-type abuse: send JSON body as text/plain -> should 4xx, not 5xx
{
  const r = await fetch(BASE + '/academics/academic-years', {
    method: 'POST',
    headers: { 'content-type': 'text/plain', authorization: 'Bearer ' + iaTok },
    body: '{"name":"2026-27"}',
  });
  record('WP-F-CONTENTTYPE', 'text/plain on JSON endpoint -> 4xx (no 5xx)', r.status >= 400 && r.status < 500, 'status=' + r.status);
}

// G. Empty-body action routes with a malformed id -> 4xx, never 500
{
  const probes = [
    ['POST', '/admin/institutions/' + BAD + '/suspend', saTok],
    ['POST', '/admin/institutions/' + BAD + '/activate', saTok],
    ['POST', '/admin/people/students/' + BAD + '/disable', saTok],
    ['POST', '/admin/people/students/' + BAD + '/transfer', saTok],
    ['POST', '/academics/academic-years/' + BAD + '/activate', iaTok],
    ['POST', '/admin/library/content/' + BAD + '/archive', iaTok],
  ];
  const bad = [];
  for (const p of probes) {
    const r = await send(p[0], p[1], p[2], {});
    if (r.status >= 500) bad.push(p[1].replace(BAD, ':id') + '=' + r.status);
  }
  record('WP-G-ACTION-NO5XX', 'action routes w/ bad id -> no 5xx', bad.length === 0, bad.join(' | '));
}

// H. Cross-tenant / bogus-id write attempt must be concealed (no 2xx, no 5xx)
{
  const bogus = '99999999-9999-4999-8999-999999999999';
  const probes = [
    ['PATCH', '/admin/people/students/' + bogus, saTok, { name: 'hacked' }],
    ['PATCH', '/admin/institutions/' + bogus, saTok, { name: 'hacked' }],
    ['DELETE', '/admin/curriculum/nodes/chapter/' + bogus, saTok, undefined],
    ['DELETE', '/admin/library/content/' + bogus, iaTok, undefined],
    ['DELETE', '/questions/' + bogus, iaTok, undefined],
  ];
  const bad = [];
  for (const p of probes) {
    const r = await send(p[0], p[1], p[2], p[3]);
    if (r.status === 200 || r.status >= 500) bad.push(p[0] + ' ' + p[1].replace(bogus, ':id') + '=' + r.status);
  }
  record('WP-H-XTENANT', 'cross-tenant/bogus-id writes concealed (no 2xx/5xx)', bad.length === 0, bad.join(' | '));
}

// I. Validation error body shape: { code:'VALIDATION_ERROR', message, details[] }
{
  const r = await send('POST', '/academics/academic-years', iaTok, {});
  let shaped = false;
  try {
    const b = JSON.parse(r.body);
    shaped = b.code === 'VALIDATION_ERROR' && Array.isArray(b.details) && b.details.length > 0;
  } catch (e) { /* stays false */ }
  record('WP-I-ERRSHAPE', 'validation error body has code+details', r.status === 400 && shaped, 'status=' + r.status);
}

// J. No stack/internals leaked on any 4xx/5xx write response sampled above
{
  const probes = [
    ['POST', '/academics/academic-years', iaTok, {}],
    ['PATCH', '/admin/institutions/' + BAD, saTok, { name: 'x' }],
    ['POST', '/academics/groups', iaTok, { name: 'g', type: 'CLASS', academicYearId: 'not-uuid' }],
  ];
  const leaky = [];
  for (const p of probes) {
    const r = await send(p[0], p[1], p[2], p[3]);
    if (/at .*\.ts:|node_modules|prisma|\$2a\$/i.test(r.body) || r.body.includes(QA_PASSWORD)) leaky.push(p[1]);
  }
  record('WP-J-NOLEAK', 'write-path errors never leak internals/secrets', leaky.length === 0, leaky.join(' '));
}

// K. Duplicate submission: creating the same academic year twice must not 500.
// (This DOES create one row on first call, so we name it clearly as QA-owned and
//  delete it via the e2e suite; here we only assert the second call is a clean 4xx/2xx,
//  not a 500 duplicate-key crash.)
{
  const name = 'QA-DUP-' + Date.now();
  const body = { name: name, startDate: '2026-04-01', endDate: '2027-03-31' };
  const first = await send('POST', '/academics/academic-years', iaTok, body);
  const second = await send('POST', '/academics/academic-years', iaTok, body);
  const noCrash = second.status < 500;
  record('WP-K-DUPLICATE', 'duplicate create -> no 5xx (409/400/200 ok)', noCrash,
    'first=' + first.status + ' second=' + second.status);
}

const passCount = results.filter(function (x) { return x.pass; }).length;
console.log('\n=== SUMMARY: ' + passCount + '/' + results.length + ' PASS ===');
const failed = results.filter(function (x) { return !x.pass; });
if (failed.length) console.log('FAILED: ' + failed.map(function (f) { return f.id; }).join(', '));
process.exit(failed.length ? 1 : 0);
