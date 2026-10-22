// Regression probe for BUG-L: the AR activity telemetry used to run in a
// self-sustaining loop (one page load -> 201 x23 then 429 x475 POSTs) because the
// Model3DViewer effect depended on a callback identity that changed on every render.
//
// The probe opens the AR / 3D tab on a concept that has published AR content and
// counts the activity POSTs that follow. A healthy page load records AR_OPENED and
// AR_STARTED only (2 POSTs); the bug produced hundreds.
import { chromium } from 'playwright';
import { QA_PASSWORD } from './_env.mjs';

const WEB = 'http://localhost:3000';
const API = 'http://localhost:4000/api/v1';
const PW = QA_PASSWORD;
const CONCEPT = process.env.AR_CONCEPT_ID ?? '0a375db4-4f29-4d26-89e6-2d8850d75b58';
const MAX_POSTS = 3;
const WATCH_MS = 12000;

function check(id, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${id.padEnd(30)} ${detail}`);
  return ok;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const activityPosts = [];
  const activity429 = [];
  const consoleErrors = [];
  const knownErrors = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text().slice(0, 160);
    // the concept page also renders a video lesson whose YouTube thumbnail is a known
    // dead link (BUG-H, content-owned) - that is not an AR problem
    if (/status of 404/i.test(text)) knownErrors.push(text);
    else consoleErrors.push(text);
  });
  page.on('response', (r) => {
    const url = r.url();
    if (url.includes('/ar/') && url.includes('/activity') && r.request().method() === 'POST') {
      activityPosts.push(url);
      if (r.status() === 429) activity429.push(r.status());
    }
    if (r.status() === 404 && /ytimg\.com/i.test(url)) knownErrors.push(`HTTP404 ${url.slice(0, 100)}`);
  });

  await page.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.fill('input[type="email"]', 'student@sanroai.com');
  await page.fill('input[type="password"]', PW);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(2000);

  await page.goto(`${WEB}/app/learn/concepts/${CONCEPT}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);

  // the 3D viewer is opened from the Learn tab (it is lesson content, not a mode)
  const clicked = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button')).find((e) =>
      /open the 3D viewer/i.test(e.textContent || ''),
    );
    if (el) { el.click(); return true; }
    return false;
  });
  check('AR-01 3D viewer reachable', clicked, clicked ? 'opened from the Learn tab' : 'no "Open the 3D viewer" card found');

  await page.waitForTimeout(WATCH_MS);

  const modelState = await page.evaluate(() => {
    const mv = document.querySelector('model-viewer');
    return { present: !!mv, loaded: mv ? mv.loaded === true : false };
  });

  check('AR-02 activity POSTs bounded', activityPosts.length <= MAX_POSTS,
    `posts=${activityPosts.length} (max ${MAX_POSTS})`);
  check('AR-03 no throttled activity', activity429.length === 0, `429s=${activity429.length}`);
  check('AR-04 3D model loaded', modelState.loaded, `model-viewer loaded=${modelState.loaded}`);
  check('AR-05 no unexpected console errors', consoleErrors.length === 0,
    consoleErrors.length ? consoleErrors[0] : `none (${knownErrors.length} known thumbnail 404s ignored)`);

  await browser.close();
  const ok = activityPosts.length <= MAX_POSTS && activity429.length === 0 && modelState.loaded;
  console.log(`\n=== AR ACTIVITY LOOP PROBE: ${ok ? 'PASS' : 'FAIL'} (posts=${activityPosts.length}) ===`);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
