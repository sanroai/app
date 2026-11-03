/**
 * The learning loop in the real UI: the "Review today" card, the explanation that
 * appears after answering, and the rule that an answer is final once given.
 *
 *   npx tsx scripts/qa/probe-learning-ui.mts                       # production
 *   WEB_URL=http://localhost:3000 npx tsx scripts/qa/probe-learning-ui.mts
 *
 * It signs in through the form (the way a student does), so the auth + hydration
 * path is covered too. The practice set is started through the API with the
 * token the page itself stored, so the check works whether or not anything is due
 * for review - the review card is reported, not required.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { QA_PASSWORD } from './_env.mjs';

const WEB_URL = process.env.WEB_URL ?? 'https://sanroai.com';
const API = process.env.API_URL ?? 'https://api.sanroai.com/api/v1';
const PASSWORD = process.env.QA_PASSWORD ?? QA_PASSWORD;
const OUT = process.env.OUT_DIR ?? `artifacts/qa/${new Date().toISOString().slice(0, 10)}/screenshots`;
const results: Array<{ name: string; ok: boolean; detail?: string }> = [];
const check = (name: string, ok: boolean, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` - ${detail}` : ''}`);
};

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const consoleErrors: string[] = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

await page.goto(`${WEB_URL}/login`, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForSelector('#email', { timeout: 60000 });
// The submit button is disabled until React has hydrated, so clicking before the
// handler exists cannot fall through to the form's native submission.
await page.waitForFunction(
  () => {
    const button = document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    return !!button && !button.disabled;
  },
  { timeout: 60000 },
);
await page.fill('#email', 'student@sanroai.com');
await page.fill('#password', PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL((u) => u.pathname.startsWith('/app'), { timeout: 90000 });
check('sign-in lands on the dashboard', true);
check('the password never appears in the URL', !page.url().includes('password') && !page.url().includes('Sanro'), page.url().slice(0, 60));

// The review card is informational: a student with nothing due must not see it.
await page.waitForSelector('text=Review today', { timeout: 20000 }).catch(() => undefined);
const cardVisible = await page.locator('text=Review today').first().isVisible().catch(() => false);
console.log(`  ${cardVisible ? 'PASS' : 'INFO'}  Home shows the "Review today" card${cardVisible ? '' : ' - nothing due for this account'}`);
await page.screenshot({ path: path.join(OUT, 'learning-home-review.png') });

// Start a practice set through the API with the token the page stored.
const token = await page.evaluate(() => {
  try {
    const raw = localStorage.getItem('sanro-auth');
    return raw ? (JSON.parse(raw)?.state?.token ?? null) : null;
  } catch {
    return null;
  }
});
check('the page stored a session token', Boolean(token));

const call = async (method: string, endpoint: string, body?: unknown) => {
  const res = await fetch(`${API}${endpoint}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const home = await call('GET', '/learning/home');
const board = home.body?.boards?.[0];
const grade = board?.grades?.find((g: { grade: string }) => g.grade === '10') ?? board?.grades?.[0];
const subject = grade?.subjects?.[0];
const chapters = await call('GET', `/learning/boards/${board?.id}/grades/${grade?.grade}/subjects/${subject?.id}/chapters`);
const chapter = (chapters.body?.chapters ?? chapters.body ?? [])[0];
const hub = await call('GET', `/learning/chapters/${chapter?.id}`);
const conceptId = hub.body?.concepts?.[0]?.id ?? hub.body?.concepts?.[0]?.conceptId;
const started = await call('POST', '/learning/practice/start', { conceptId, questionCount: 5 });
check('a practice set can be started', Boolean(started.body?.practiceId), `${started.status}`);

if (started.body?.practiceId) {
  await page.goto(`${WEB_URL}/app/learn/practice/${started.body.practiceId}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('text=Practice Mode', { timeout: 45000 }).catch(() => undefined);
  await page.waitForTimeout(700);

  let clicked = false;
  for (let step = 0; step < 12 && !clicked; step += 1) {
    const optionButtons = page.locator('button.rounded-xl.border-2');
    if ((await optionButtons.count()) > 0) {
      await optionButtons.first().click();
      clicked = true;
      break;
    }
    const next = page.getByRole('button', { name: /^next$/i }).first();
    if (!(await next.isVisible().catch(() => false))) break;
    await next.click();
    await page.waitForTimeout(300);
  }

  check('the set has an auto-graded question to answer', clicked);
  if (clicked) {
    const panel = page.locator('text=/^(Correct|Not quite|Answer saved)$/').first();
    await panel.waitFor({ timeout: 30000 }).catch(() => undefined);
    check('answering shows the verdict immediately', await panel.isVisible().catch(() => false));

    const panelText = (await page.locator('main').innerText().catch(() => '')).replace(/\s+/g, ' ');
    check(
      'the reason is rendered under the question',
      /lesson notes|is the answer|is correct|->|means/i.test(panelText) && panelText.length > 80,
      `${panelText.length} chars`,
    );

    // The answer is final: every option is disabled once one is chosen, and the
    // page says so - otherwise the student could click the option the feedback
    // just revealed.
    const disabledOptions = await page.locator('button.rounded-xl.border-2[disabled]').count();
    check('options are locked once answered', disabledOptions >= 2, `${disabledOptions} disabled`);
    check('the page says the answer is final', /answer is final/i.test(panelText));

    await page.screenshot({ path: path.join(OUT, 'learning-practice-feedback.png') });
  }
}

check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '));

const failures = results.filter((r) => !r.ok);
console.log(`\n  ${results.length - failures.length} passed, ${failures.length} failed`);
console.log(`  screenshots: ${OUT}`);
await browser.close();
process.exit(failures.length ? 1 : 0);
