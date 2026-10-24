// Web UI walkthrough (QA phase P5) — real Playwright chromium against the local web app.
//
// For each role: logs in through the real UI, visits that role's pages, and records
// per-page: HTTP status, final URL, console errors, failed network requests, and a
// genuine full-page screenshot into artifacts/qa/2026-10-19/screenshots/.
//
// Also runs an authorization probe set (STUDENT/PARENT hitting staff-only routes) to
// document FINDING-G at the UI layer, and a mobile-viewport responsive spot-check.
//
// Usage: node --import tsx scripts/qa/web-walkthrough.mts   (or: npx tsx scripts/qa/web-walkthrough.mts)
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { QA_PASSWORD } from './_env.mjs';

const WEB = 'http://localhost:3000';
const API = 'http://localhost:4000/api/v1';
const PW = QA_PASSWORD;
const SHOTS = join(process.cwd(), 'artifacts', 'qa', new Date().toISOString().slice(0, 10), 'screenshots');

type Row = {
  role: string; route: string; viewport: string;
  httpStatus: number | null; finalUrl: string;
  consoleErrors: string[]; failedRequests: string[];
  expectedErrors: string[]; knownErrors: string[];
  screenshot: string; result: string;
};
const rows: Row[] = [];

// Errors that are correct behaviour and must not be reported as defects:
//  - 403 = the role is not allowed to call that sub-request (RBAC by design)
//  - ERR_ABORTED = an RSC prefetch cancelled by navigation
//  - 404 on i.ytimg.com = the known dead YouTube thumbnail (BUG-H, content-owned)
const isExpected = (text: string) => /status of 403/i.test(text) || /ERR_ABORTED/i.test(text);
const isKnown = (text: string) => /ytimg\.com/i.test(text) && /404/.test(text);

async function apiLogin(email: string): Promise<string | null> {
  try {
    const r = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: PW }),
    });
    const b = await r.json().catch(() => ({}));
    return b.accessToken ?? null;
  } catch { return null; }
}

// Resolve a couple of real content/concept ids so detail pages are not guessed.
async function realIds(token: string) {
  const ids: Record<string, string> = {};
  try {
    const r = await fetch(`${API}/content/browse`, { headers: { authorization: `Bearer ${token}` } });
    const b = await r.json().catch(() => null);
    const first = b?.items?.[0]?.id ?? b?.[0]?.id;
    if (first) ids.contentId = first;
  } catch { /* leave empty */ }
  return ids;
}

function classify(
  status: number | null,
  consoleErrors: string[],
  failed: string[],
  finalUrl: string,
  expectedErrors: string[] = [],
): string {
  if (status === null) return 'FAIL';
  if (status >= 500) return 'FAIL';
  if (consoleErrors.length > 0) return 'PARTIAL';
  if (expectedErrors.length > 0) return 'EXPECTED';
  // A redirect to /login means an auth wall kicked in unexpectedly for an allowed page
  if (finalUrl.includes('/login')) return 'BLOCKED';
  return 'PASS';
}

async function runRole(role: string, email: string, routes: string[], viewport: { name: string; w: number; h: number }) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: viewport.w, height: viewport.h } });
  const page = await ctx.newPage();

  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const expectedErrors: string[] = [];
  const knownErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text().slice(0, 200);
    if (isExpected(text)) expectedErrors.push(text);
    else if (isKnown(text)) knownErrors.push(text);
    else consoleErrors.push(text);
  });
  page.on('requestfailed', (r) => {
    const line = `${r.method()} ${r.url().slice(0, 120)} :: ${r.failure()?.errorText ?? ''}`;
    if (/ERR_ABORTED/i.test(line)) expectedErrors.push(line);
    else failedRequests.push(line);
  });
  page.on('response', (r) => {
    const status = r.status();
    if (status >= 500) failedRequests.push(`HTTP${status} ${r.url().slice(0, 120)}`);
    else if (status === 403) expectedErrors.push(`HTTP403 ${r.url().slice(0, 120)}`);
    else if (status === 404) {
      const line = `HTTP404 ${r.url().slice(0, 120)}`;
      if (/ytimg\.com/i.test(r.url())) knownErrors.push(line);
      else consoleErrors.push(line);
    }
  });

  // Real UI login
  let httpStatus: number | null = null;
  let finalUrl = '';
  try {
    const resp = await gotoWithRetry(page, `${WEB}/login`, 20000);
    httpStatus = resp?.status() ?? null;
    await page.waitForTimeout(1500);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', PW);
    const [resp2] = await Promise.all([
      page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 20000 }).catch(() => null),
      page.click('button[type="submit"]'),
    ]);
    await page.waitForTimeout(2500);
    finalUrl = page.url();
    const shot = join(SHOTS, `${role}-${viewport.name}-login.png`);
    await page.screenshot({ path: shot, fullPage: true });
    rows.push({
      role, route: '/login', viewport: viewport.name,
      httpStatus: resp2?.status() ?? httpStatus, finalUrl,
      consoleErrors: [...consoleErrors], failedRequests: [...failedRequests],
      expectedErrors: [...new Set(expectedErrors)], knownErrors: [...new Set(knownErrors)],
      screenshot: shot, result: finalUrl.includes('/login') ? 'FAIL' : 'PASS',
    });
  } catch (e) {
    rows.push({ role, route: '/login', viewport: viewport.name, httpStatus, finalUrl: page.url(), consoleErrors: [(e as Error).message], failedRequests, expectedErrors: [...new Set(expectedErrors)], knownErrors: [...new Set(knownErrors)], screenshot: '', result: 'FAIL' });
    await browser.close();
    return;
  }

  // Visit each route
  for (const route of routes) {
    consoleErrors.length = 0; failedRequests.length = 0; expectedErrors.length = 0; knownErrors.length = 0;
    let status: number | null = null;
    try {
      let resp = await gotoWithRetry(page, `${WEB}${route}`);
      // Same cold-compile guard as the public pass: retry a navigation that
      // resolved without a response before calling the route a failure.
      for (let i = 0; resp === null && i < 2; i++) {
        await page.waitForTimeout(2000);
        resp = await gotoWithRetry(page, `${WEB}${route}`);
      }
      status = resp?.status() ?? null;
      await page.waitForTimeout(3000);
      finalUrl = page.url();
      const safe = route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root';
      const shot = join(SHOTS, `${role}-${viewport.name}-${safe}.png`);
      await page.screenshot({ path: shot, fullPage: true });
      const result = classify(status, consoleErrors, failedRequests, finalUrl, expectedErrors);
      rows.push({
        role, route, viewport: viewport.name, httpStatus: status, finalUrl,
        consoleErrors: [...consoleErrors], failedRequests: [...failedRequests],
        expectedErrors: [...new Set(expectedErrors)], knownErrors: [...new Set(knownErrors)],
        screenshot: shot, result,
      });
      console.log(`${result.padEnd(7)} ${role.padEnd(18)} ${route.padEnd(46)} http=${status} console=${consoleErrors.length} net=${failedRequests.length}`);
    } catch (e) {
      rows.push({ role, route, viewport: viewport.name, httpStatus: status, finalUrl: page.url(), consoleErrors: [(e as Error).message], failedRequests: [...failedRequests], expectedErrors: [...new Set(expectedErrors)], knownErrors: [...new Set(knownErrors)], screenshot: '', result: 'FAIL' });
      console.log(`FAIL    ${role.padEnd(18)} ${route.padEnd(46)} ERR ${(e as Error).message.slice(0, 80)}`);
    }
  }
  await browser.close();
}

// PUBLIC pages first (no auth)
async function gotoWithRetry(page: any, url: string, timeout = 25000) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
    } catch (err) {
      const text = String((err as Error)?.message ?? '');
      // an aborted navigation (the app redirected mid-flight) is not a page failure
      if (!/ERR_ABORTED/i.test(text) || attempt === 2) throw err;
      await page.waitForTimeout(1500);
    }
  }
  return null;
}

async function runPublic(routes: string[]) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors: string[] = [];
  const failed: string[] = [];
  const expectedErrors: string[] = [];
  const knownErrors: string[] = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text().slice(0, 200);
    if (isExpected(text)) expectedErrors.push(text);
    else if (isKnown(text)) knownErrors.push(text);
    else consoleErrors.push(text);
  });
  page.on('requestfailed', (r) => {
    const line = `${r.method()} ${r.url().slice(0, 120)}`;
    if (/ERR_ABORTED/i.test(line)) expectedErrors.push(line);
    else failed.push(line);
  });
  page.on('response', (r) => {
    const status = r.status();
    if (status >= 500) failed.push(`HTTP${status} ${r.url().slice(0, 120)}`);
    else if (status === 403) expectedErrors.push(`HTTP403 ${r.url().slice(0, 120)}`);
    else if (status === 404) {
      const line = `HTTP404 ${r.url().slice(0, 120)}`;
      if (/ytimg\.com/i.test(r.url())) knownErrors.push(line);
      else consoleErrors.push(line);
    }
  });
  for (const route of routes) {
    consoleErrors.length = 0; failed.length = 0; expectedErrors.length = 0; knownErrors.length = 0;
    let status: number | null = null;
    try {
      let resp = await gotoWithRetry(page, `${WEB}${route}`);
      // A cold `next dev` compile can abort the first navigation and resolve with
      // no response; retry before treating the route as a failure.
      for (let i = 0; resp === null && i < 2; i++) {
        await page.waitForTimeout(2000);
        resp = await gotoWithRetry(page, `${WEB}${route}`);
      }
      status = resp?.status() ?? null;
      await page.waitForTimeout(2000);
      const safe = route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'landing';
      const shot = join(SHOTS, `public-desktop-${safe}.png`);
      await page.screenshot({ path: shot, fullPage: true });
      const result = status === null ? 'FAIL' : status >= 500 ? 'FAIL'
        : consoleErrors.length > 0 ? 'PARTIAL'
        : expectedErrors.length > 0 ? 'EXPECTED' : 'PASS';
      rows.push({ role: 'PUBLIC', route, viewport: 'desktop', httpStatus: status, finalUrl: page.url(), consoleErrors: [...consoleErrors], failedRequests: [...failed], expectedErrors: [...new Set(expectedErrors)], knownErrors: [...new Set(knownErrors)], screenshot: shot, result });
      console.log(`${result.padEnd(7)} ${'PUBLIC'.padEnd(18)} ${route.padEnd(46)} http=${status} console=${consoleErrors.length}`);
    } catch (e) {
      rows.push({ role: 'PUBLIC', route, viewport: 'desktop', httpStatus: status, finalUrl: '', consoleErrors: [(e as Error).message], failedRequests: [...failed], expectedErrors: [...new Set(expectedErrors)], knownErrors: [...new Set(knownErrors)], screenshot: '', result: 'FAIL' });
    }
  }
  await browser.close();
}

async function main() {
  await mkdir(SHOTS, { recursive: true });

  console.log('=== PUBLIC marketing/auth pages ===');
  await runPublic(['/', '/login', '/register', '/forgot-password', '/features', '/pricing', '/for-parents', '/for-schools', '/contact', '/about', '/terms', '/privacy', '/download']);

  const stTok = await apiLogin('student@sanroai.com');
  const ids = stTok ? await realIds(stTok) : {};

  console.log('\n=== STUDENT (desktop 1440x900) ===');
  await runRole('student', 'student@sanroai.com', [
    '/app', '/app/library', '/app/library/subjects', '/app/assessments',
    '/app/chat', '/app/gamification', '/app/gamification/leaderboard',
    '/app/gamification/achievements', '/app/profile',
  ], { name: 'desktop', w: 1440, h: 900 });

  console.log('\n=== PARENT (desktop 1440x900) ===');
  await runRole('parent', 'parent@sanroai.com', [
    '/app', '/app/children', '/app/profile',
  ], { name: 'desktop', w: 1440, h: 900 });

  console.log('\n=== TEACHER (desktop 1440x900) ===');
  await runRole('teacher', 'teacher@sanroai.com', [
    '/app', '/app/papers', '/app/questions', '/app/assessments', '/app/students',
    '/app/teachers', '/app/parents', '/app/remediation', '/app/reports',
    '/app/curriculum', '/app/content/videos', '/app/content/ingest',
  ], { name: 'desktop', w: 1440, h: 900 });

  console.log('\n=== INSTITUTION_ADMIN (desktop 1440x900) ===');
  await runRole('instadmin', 'principal@sanroai.com', [
    '/app', '/app/institutions', '/app/people/students', '/app/people/teachers',
    '/app/people/parents', '/app/settings', '/app/import', '/app/reports',
  ], { name: 'desktop', w: 1440, h: 900 });

  console.log('\n=== SUPER_ADMIN (desktop 1440x900) ===');
  await runRole('superadmin', 'admin@sanroai.com', [
    '/app', '/app/institutions', '/app/settings',
  ], { name: 'desktop', w: 1440, h: 900 });

  console.log('\n=== AUTHZ PROBE: STUDENT/PARENT on staff-only routes (FINDING-G) ===');
  await runRole('student-authz', 'student@sanroai.com', [
    '/app/papers', '/app/questions', '/app/students', '/app/people/students',
  ], { name: 'desktop', w: 1440, h: 900 });
  await runRole('parent-authz', 'parent@sanroai.com', [
    '/app/papers', '/app/students', '/app/people/students',
  ], { name: 'desktop', w: 1440, h: 900 });

  console.log('\n=== RESPONSIVE: student + teacher on mobile viewport (390x844) ===');
  await runRole('student', 'student@sanroai.com', ['/app', '/app/library', '/app/assessments'], { name: 'mobile', w: 390, h: 844 });
  await runRole('teacher', 'teacher@sanroai.com', ['/app', '/app/papers'], { name: 'mobile', w: 390, h: 844 });

  // Persist evidence
  const jsonPath = join(SHOTS, '..', 'web-walkthrough.json');
  await writeFile(jsonPath, JSON.stringify(rows, null, 2), 'utf8');

  const byResult = rows.reduce<Record<string, number>>((a, r) => { a[r.result] = (a[r.result] ?? 0) + 1; return a; }, {});
  const withConsole = rows.filter((r) => r.consoleErrors.length > 0);
  const withNet = rows.filter((r) => r.failedRequests.length > 0);
  const withExpected = rows.filter((r) => r.expectedErrors.length > 0);
  const withKnown = rows.filter((r) => r.knownErrors.length > 0);
  console.log(`\n=== WALKTHROUGH SUMMARY ===`);
  console.log(`total=${rows.length}  ${Object.entries(byResult).map(([k, v]) => `${k}=${v}`).join('  ')}`);
  console.log(`pages with console errors: ${withConsole.length}`);
  withConsole.slice(0, 15).forEach((r) => console.log(`   CONSOLE ${r.role} ${r.route}: ${r.consoleErrors[0]}`));
  console.log(`pages with failed/5xx requests: ${withNet.length}`);
  withNet.slice(0, 15).forEach((r) => console.log(`   NET ${r.role} ${r.route}: ${r.failedRequests[0]}`));
  console.log(`pages with EXPECTED errors (RBAC 403 / aborted prefetch): ${withExpected.length}`);
  withExpected.slice(0, 6).forEach((r) => console.log(`   EXPECTED ${r.role} ${r.route}: ${r.expectedErrors[0]}`));
  console.log(`pages with KNOWN content issues (dead YouTube thumbnail, BUG-H): ${withKnown.length}`);
  withKnown.slice(0, 6).forEach((r) => console.log(`   KNOWN ${r.role} ${r.route}: ${r.knownErrors[0]}`));
  console.log(`\nevidence: ${jsonPath}\nscreenshots: ${SHOTS}`);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
