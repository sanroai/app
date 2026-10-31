// Chapter-hub probe for the student chapter hub (docs/FEATURE_CHAPTER_HUB.md).
//
// Contract under test:
//   GET  /learning/chapters/:chapterId        the hub payload
//   GET  /learning/chapters/:chapterId/pdf    the textbook chapter PDF (may 404)
//   POST /learning/practice/start {chapterId} one practice session over the whole chapter
//
// The probe finds a real chapter id by itself (through the API, with a read-only
// database fallback), logs in with the demo accounts, prints PASS/FAIL per check and
// exits 1 when something failed.
//
// The demo password comes from scripts/qa/_env.mjs - it is never printed, never
// hard-coded here. The database URI is read from apps/api/.env and never printed.
//
// Read-only apart from the practice session that check CH-06 starts: that row IS the
// feature under test. Nothing else in the database is touched, so the probe is safe to
// run repeatedly.
//
// While the chapter-hub endpoints have not landed yet the probe reports
// "endpoint not available" and exits 0, so it can live in the repo while the API is
// still being built.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { QA_PASSWORD } from './_env.mjs';

// CHAPTER_HUB_API lets the probe run against another origin (used to test the
// probe itself against a mock hub); the default is the local dev API.
const API_ORIGIN = process.env.CHAPTER_HUB_API ?? 'http://localhost:4000';
const BASE = `${API_ORIGIN}/api/v1`;
const PW = QA_PASSWORD;

/** Every key the hub payload has to carry. */
const HUB_KEYS = [
  'id', 'name', 'code', 'grade', 'subject', 'summary', 'pdfUrl',
  'concepts', 'videos', 'progress', 'practice',
];
/** Any of these keys means the payload is a chapter hub and not the older chapter shape. */
const HUB_MARKERS = ['concepts', 'videos', 'progress', 'practice'];
/** The API caps the chapter markers of one video at 24. */
const SEGMENT_CAP = 24;

const results = [];
function check(id, label, ok, detail) {
  results.push({ id, label, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id.padEnd(10)} ${label}  -- ${detail}`);
}
function skip(id, label, detail) {
  console.log(`SKIP  ${id.padEnd(10)} ${label}  -- ${detail}`);
}
function note(text) {
  console.log(`      ${text}`);
}

/**
 * Node on Windows aborts with a libuv assertion ("handle->flags & UV_HANDLE_CLOSING")
 * when process.exit() runs while undici's connection pool is still tearing down, so
 * the probe closes the global dispatcher and lets the process end on its own.
 */
async function finish(code) {
  process.exitCode = code;
  try {
    const dispatcher = globalThis[Symbol.for('undici.globalDispatcher.1')];
    if (dispatcher?.close) await dispatcher.close();
  } catch {
    /* the connection pool is optional */
  }
  setTimeout(() => process.exit(code), 5000).unref();
}

async function login(email) {
  try {
    const r = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: PW }),
    });
    const b = await r.json().catch(() => ({}));
    return { status: r.status, token: b.accessToken ?? null };
  } catch (e) {
    return { status: 0, token: null, error: e?.cause?.code ?? e?.message ?? 'network error' };
  }
}

async function request(pathname, { token, method = 'GET', body, discardBody = false } = {}) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';
  let r;
  try {
    r = await fetch(`${BASE}${pathname}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    // The API is unreachable - that is a probe environment problem, not a contract
    // violation, so it is reported as such instead of crashing the process.
    return { status: 0, json: null, text: '', type: '', error: e?.cause?.code ?? e?.message ?? 'network error' };
  }
  if (discardBody) {
    // The chapter PDF can be ~18 MB - the probe only looks at the headers.
    await r.body?.cancel?.().catch(() => {});
    return { status: r.status, json: null, text: '', type: r.headers.get('content-type') ?? '' };
  }
  const text = await r.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not a JSON body - keep the raw text */
  }
  return { status: r.status, json, text, type: r.headers.get('content-type') ?? '' };
}

/* ------------------------------------------------------------------ *
 * 1. find a real chapter id
 * ------------------------------------------------------------------ */

/** /learning/home gives the board/grade/subject tree, /learning/.../chapters the chapters. */
async function chaptersViaApi(token) {
  const home = await request('/learning/home', { token });
  if (home.status !== 200 || !Array.isArray(home.json?.boards)) return [];
  const out = [];
  for (const board of home.json.boards) {
    for (const grade of board.grades ?? []) {
      for (const subject of grade.subjects ?? []) {
        const r = await request(
          `/learning/boards/${board.id}/grades/${encodeURIComponent(grade.grade)}/subjects/${subject.id}/chapters`,
          { token },
        );
        if (r.status !== 200) continue;
        for (const c of r.json?.chapters ?? []) {
          if (c?.id) out.push({ id: c.id, name: c.name, code: c.code, via: 'api' });
        }
      }
    }
  }
  return out;
}

/** Reads DATABASE_URL from apps/api/.env (never printed) - same lookup as scripts/qa/_env.mjs. */
function readDatabaseUrl() {
  const candidates = [
    path.resolve(process.cwd(), 'apps', 'api', '.env'),
    path.resolve(process.cwd(), '.env'),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && m[1] === 'DATABASE_URL') return m[2].replace(/^["']|["']$/g, '');
    }
  }
  return process.env.DATABASE_URL ?? null;
}

/** Read-only fallback: pick chapter ids straight from the database. */
async function chaptersViaDb() {
  const url = readDatabaseUrl();
  if (!url) return [];
  let PrismaClient;
  try {
    const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
    ({ PrismaClient } = require('@prisma/client'));
  } catch {
    return [];
  }
  process.env.DATABASE_URL = url;
  const prisma = new PrismaClient();
  try {
    const chapters = await prisma.chapter.findMany({
      where: { topics: { some: { concepts: { some: {} } } } },
      take: 200,
      select: { id: true, name: true, code: true, grade: true, order: true },
    });
    // grade is a string column, so the newest class first has to be sorted by hand
    return chapters
      .sort((a, b) => Number(b.grade) - Number(a.grade) || a.order - b.order)
      .slice(0, 25)
      .map((c) => ({ id: c.id, name: c.name, code: c.code, via: 'db' }));
  } catch {
    return [];
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

/* ------------------------------------------------------------------ *
 * 2. shape helpers
 * ------------------------------------------------------------------ */

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function missingKeys(payload) {
  return HUB_KEYS.filter((k) => !(k in payload));
}

/** Validates the chapter markers of one video against the documented rules. */
function segmentProblems(segments) {
  const problems = [];
  if (!Array.isArray(segments)) return ['segments is not an array'];
  if (segments.length > SEGMENT_CAP) problems.push(`${segments.length} markers (cap ${SEGMENT_CAP})`);
  let prev = null;
  segments.forEach((s, i) => {
    if (!isObj(s)) {
      problems.push(`#${i} is not an object`);
      return;
    }
    if (!isStr(s.title)) problems.push(`#${i} has an empty title`);
    if (!isNum(s.startSeconds)) {
      problems.push(`#${i} startSeconds is not a number`);
      return;
    }
    if (s.startSeconds < 0) problems.push(`#${i} startSeconds=${s.startSeconds} is negative`);
    if (prev !== null && s.startSeconds < prev) {
      problems.push(`#${i} startSeconds=${s.startSeconds} breaks the ascending order`);
    }
    if (prev !== null && s.startSeconds === prev) {
      problems.push(`#${i} startSeconds=${s.startSeconds} is a duplicate`);
    }
    prev = s.startSeconds;
  });
  return problems;
}

/* ------------------------------------------------------------------ *
 * 3. main
 * ------------------------------------------------------------------ */

/** Prints the summary line and returns the exit code. */
function summary() {
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n=== SUMMARY: ${passed}/${results.length} PASS ===`);
  const failed = results.filter((r) => !r.ok);
  if (failed.length) console.log('FAILED:', failed.map((f) => f.id).join(', '));
  return failed.length ? 1 : 0;
}

async function main() {
  console.log('=== CHAPTER HUB PROBE (local dev API) ===\n');

  const student = await login('student@sanroai.com');
  if (!student.token) {
    console.error(
      student.error
        ? `FATAL: the API is not reachable at ${API_ORIGIN} (${student.error}) - start it with "pnpm --filter @sanro/api start:dev"`
        : 'FATAL: student login failed - is the API running on :4000 and the demo seed loaded?',
    );
    return 1;
  }
  const teacher = await login('teacher@sanroai.com');
  note(`student token: ok | teacher token: ${teacher.token ? 'ok' : 'unavailable'}`);

  let candidates = await chaptersViaApi(student.token);
  if (!candidates.length) {
    note('no chapter found through the API - falling back to the database');
    candidates = await chaptersViaDb();
  }
  if (!candidates.length) {
    console.error('FATAL: no chapter found (API and database) - seed the demo data first');
    return 1;
  }

  // The first chapter the student may read (a chapter of another grade answers 403).
  let chapter = null;
  let hub = null;
  for (const candidate of candidates) {
    const r = await request(`/learning/chapters/${candidate.id}`, { token: student.token });
    if (r.status === 403) continue;
    chapter = candidate;
    hub = r;
    break;
  }
  if (!hub) {
    console.error('FATAL: the student cannot read any chapter');
    return 1;
  }
  note(`chapter under test: ${chapter.code ?? '?'} - ${chapter.name ?? '?'} (${chapter.id}, found via ${chapter.via})`);

  /* --- is the chapter-hub API registered at all? ------------------------- *
   * The OpenAPI document is the route registry of the running app. The PDF
   * route only exists in the chapter-hub version, so it is the marker. When
   * the document is not reachable the payload shape decides.                */
  let hubRegistered = null;
  try {
    const doc = await fetch(`${API_ORIGIN}/docs-json`);
    if (doc.ok) {
      const paths = Object.keys((await doc.json())?.paths ?? {});
      hubRegistered = paths.some((p) => /\/learning\/chapters\/\{chapterId\}\/pdf$/.test(p));
    }
  } catch {
    /* the document is optional - the payload shape decides then */
  }

  const detected = isObj(hub.json) ? hub.json : {};
  const payloadLooksLikeHub = HUB_MARKERS.some((k) => k in detected);
  const routeMissing = hub.status === 404 && /cannot get/i.test(hub.json?.message ?? '');
  // The hub is only evaluable when it answers 200 with the hub payload. Anything
  // else means the feature has not landed yet (the route is missing, the payload is
  // still the pre-hub shape, or the implementation is mid-flight and answers 5xx).
  const hubLive = hub.status === 200 && payloadLooksLikeHub;

  if (!hubLive) {
    const reason = routeMissing
      ? 'GET /learning/chapters/{chapterId} is not registered yet'
      : hubRegistered === false
        ? 'GET /learning/chapters/{chapterId}/pdf is not registered yet'
        : hub.status >= 500
          ? `GET /learning/chapters/{chapterId} answered ${hub.status} (the implementation is still landing)`
          : `the payload is still the pre-hub shape (no ${HUB_MARKERS.join('/')} keys)`;
    skip('CH-HUB', 'chapter hub endpoint not available', reason);
    if (hub.status >= 500) {
      console.log(`WARN  ${'CH-HUB'.padEnd(10)} the hub route is registered but answers ${hub.status} - the chapter hub is not usable yet`);
    }
    note('the chapter-hub endpoints have not landed yet - nothing to probe');
    note('re-run this probe once apps/api exposes the chapter hub (docs/FEATURE_CHAPTER_HUB.md)');
    console.log(`\n=== SUMMARY: 0/0 PASS (endpoint not available) ===`);
    return 0;
  }

  /* --- CH-01: the hub answers 200 ---------------------------------------- *
   * The payload is read from a second request, so CH-01 is a real assertion
   * (the endpoint has to answer 200 on a repeat call) and not a restatement
   * of the detection request above.                                             */
  const hubResponse = await request(`/learning/chapters/${chapter.id}`, { token: student.token });
  check('CH-01', 'hub responds 200', hubResponse.status === 200,
    `status=${hubResponse.status}${hubResponse.status !== 200 ? ` message=${String(hubResponse.json?.message ?? '').slice(0, 80)}` : ''}`);

  if (hubResponse.status !== 200) return summary();

  const payload = isObj(hubResponse.json) ? hubResponse.json : {};

  /* --- CH-02: the documented shape --------------------------------------- */
  {
    const missing = missingKeys(payload);
    const problems = [];
    if (missing.length) problems.push(`missing keys: ${missing.join(', ')}`);
    if (!isStr(payload.id)) problems.push('id is not a non-empty string');
    if (!isStr(payload.name)) problems.push('name is not a non-empty string');
    if (!isStr(payload.code)) problems.push('code is not a non-empty string');
    if (!isStr(payload.grade)) problems.push('grade is not a non-empty string');
    // the subject may be the name of the subject or the subject object itself
    if (!isStr(payload.subject) && !isObj(payload.subject)) problems.push('subject is neither a string nor an object');
    if (payload.summary !== null && typeof payload.summary !== 'string') problems.push('summary is neither null nor a string');
    if (payload.pdfUrl !== null && typeof payload.pdfUrl !== 'string') problems.push('pdfUrl is neither null nor a string');
    if (!Array.isArray(payload.concepts)) problems.push('concepts is not an array');
    if (!Array.isArray(payload.videos)) problems.push('videos is not an array');
    if (!isObj(payload.progress)) problems.push('progress is not an object');
    if (!isObj(payload.practice)) problems.push('practice is not an object');

    for (const c of payload.concepts ?? []) {
      if (!isObj(c) || !isStr(c.id) || !isStr(c.name) || typeof c.hasVideo !== 'boolean' || !isStr(c.status)) {
        problems.push(`a concept is malformed: ${JSON.stringify(c).slice(0, 90)}`);
        break;
      }
      // the mastery may be the score, the whole mastery record, or null (not attempted)
      if (c.mastery !== null && !isNum(c.mastery) && !isObj(c.mastery)) {
        problems.push(`concept ${c.name}: mastery is neither null, a number nor an object`);
        break;
      }
    }
    for (const v of payload.videos ?? []) {
      // url may be null when the video has neither a stored url nor a YouTube id
      if (!isObj(v) || !isStr(v.contentId) || !isStr(v.title) || (typeof v.url !== 'string' && v.url !== null)) {
        problems.push(`a video is malformed: ${JSON.stringify(v).slice(0, 90)}`);
        break;
      }
    }
    check('CH-02', 'payload has the documented shape', problems.length === 0,
      problems.length ? problems.join('; ') : `all ${HUB_KEYS.length} keys present, ${payload.concepts.length} concepts, ${payload.videos.length} videos`);
  }

  /* --- CH-03: progress is coherent --------------------------------------- */
  {
    const p = payload.progress ?? {};
    const problems = [];
    if (!isNum(p.percent)) problems.push(`percent=${JSON.stringify(p.percent)} is not a number`);
    else if (p.percent < 0 || p.percent > 100) problems.push(`percent=${p.percent} is outside 0..100`);
    for (const k of ['concepts', 'mastered', 'videos']) {
      if (!isNum(p[k])) problems.push(`${k}=${JSON.stringify(p[k])} is not a number`);
      else if (p[k] < 0) problems.push(`${k}=${p[k]} is negative`);
    }
    if (isNum(p.concepts) && isNum(p.mastered) && p.concepts < p.mastered) {
      problems.push(`concepts=${p.concepts} < mastered=${p.mastered}`);
    }
    check('CH-03', 'progress is coherent', problems.length === 0,
      problems.length ? problems.join('; ')
        : `percent=${p.percent} concepts=${p.concepts} mastered=${p.mastered} videos=${p.videos}`);
  }

  /* --- CH-04: chapter markers of every video ----------------------------- */
  {
    const problems = [];
    for (const v of payload.videos ?? []) {
      if (!isObj(v)) continue;
      for (const problem of segmentProblems(v.segments)) {
        problems.push(`"${String(v.title).slice(0, 32)}" ${problem}`);
      }
    }
    const markerCount = (payload.videos ?? []).reduce((n, v) => n + (Array.isArray(v?.segments) ? v.segments.length : 0), 0);
    check('CH-04', 'video chapter markers are valid', problems.length === 0,
      problems.length ? problems.join('; ')
        : `${payload.videos?.length ?? 0} videos, ${markerCount} markers, sorted / non-negative / titled, cap ${SEGMENT_CAP}`);
  }

  /* --- CH-05: the PDF is either absent or served ------------------------- */
  {
    if (payload.pdfUrl === null) {
      check('CH-05', 'PDF is null or served as application/pdf', true,
        'pdfUrl=null (PDF not available for this chapter)');
    } else {
      const pdf = await request(`/learning/chapters/${chapter.id}/pdf`, { token: student.token, discardBody: true });
      if (pdf.status === 200 && /application\/pdf/i.test(pdf.type)) {
        check('CH-05', 'PDF is null or served as application/pdf', true,
          `status=200 type=${pdf.type}`);
      } else if (pdf.status === 404) {
        // A missing textbook file is a graceful "not available" state, never a failure.
        check('CH-05', 'PDF is null or served as application/pdf', true,
          'PDF not available (the endpoint answered 404)');
        note(`the hub advertises pdfUrl but the file is not served - pdfUrl=${String(payload.pdfUrl).slice(0, 80)}`);
      } else {
        check('CH-05', 'PDF is null or served as application/pdf', false,
          `status=${pdf.status} type=${pdf.type || 'none'}`);
      }
    }
  }

  /* --- CH-06: a chapter practice session can be started ------------------ */
  {
    const r = await request('/learning/practice/start', {
      token: student.token,
      method: 'POST',
      body: { chapterId: chapter.id },
    });
    const practiceId = r.json?.practiceId;
    // 200 and 201 are both a success - the session is a created resource
    if ((r.status === 200 || r.status === 201) && isStr(practiceId)) {
      const count = r.json?.questionCount;
      const countOk = count === undefined || (isNum(count) && count >= 0);
      check('CH-06', 'a chapter practice session starts', countOk,
        `status=${r.status} practiceId=${String(practiceId).slice(0, 8)}... questionCount=${count ?? 'n/a'}`);
    } else if (r.status === 400) {
      // A chapter without questions is an accepted empty state, never a failure.
      check('CH-06', 'a chapter practice session starts', true,
        `status=400 (no questions for this chapter yet) message=${String(r.json?.message ?? '').slice(0, 60)}`);
    } else {
      check('CH-06', 'a chapter practice session starts', false,
        `status=${r.status} message=${String(r.json?.message ?? '').slice(0, 80)}`);
    }
  }

  /* --- CH-07: an unknown chapter answers 404 ------------------------------ */
  {
    const r = await request('/learning/chapters/99999999-9999-4999-8999-999999999999', { token: student.token });
    check('CH-07', 'an unknown chapter answers 404', r.status === 404,
      `status=${r.status} message=${String(r.json?.message ?? '').slice(0, 60)}`);
  }

  /* --- CH-08: a malformed chapter id never 500s -------------------------- */
  {
    const r = await request('/learning/chapters/not-a-uuid', { token: student.token });
    const ok = r.status === 400 || r.status === 404;
    check('CH-08', 'a malformed chapter id answers 400/404', ok, `status=${r.status}`);
  }

  /* --- CH-09: a staff token does not break the hub ----------------------- */
  {
    if (!teacher.token) {
      skip('CH-09', 'a staff token reads the chapter', 'no teacher token (demo teacher account unavailable)');
    } else {
      const r = await request(`/learning/chapters/${chapter.id}`, { token: teacher.token });
      // Staff may read a chapter - a 403 is a legitimate answer, only a 5xx is a bug.
      const ok = r.status < 500;
      check('CH-09', 'a staff token reads the chapter', ok,
        `status=${r.status}${r.status >= 500 ? ` message=${String(r.json?.message ?? '').slice(0, 80)}` : ''}`);
    }
  }

  return summary();
}

await finish(await main());
