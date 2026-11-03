/**
 * The learning loop in the real UI: the "Review today" card on Home, and the
 * explanation that appears the moment an answer is chosen in practice.
 *
 *   npx tsx scripts/qa/probe-learning-ui.mts                       # production
 *   WEB_URL=http://localhost:3000 npx tsx scripts/qa/probe-learning-ui.mts
 *
 * It signs in through the form (the way a student does), so it also covers the
 * auth + hydration path. Fails when the card is missing or an answered question
 * shows no reason.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { QA_PASSWORD } from './_env.mjs';

const WEB_URL = process.env.WEB_URL ?? 'https://sanroai.com';
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

await page.waitForSelector('text=Review today', { timeout: 45000 }).catch(() => undefined);
const card = page.locator('text=Review today').first();
const cardVisible = await card.isVisible().catch(() => false);
check('Home shows the "Review today" card', cardVisible);
await page.screenshot({ path: path.join(OUT, 'learning-home-review.png') });

if (cardVisible) {
  const startButton = page.getByRole('button', { name: /start review/i }).first();
  check('the card has a Start review button', await startButton.isVisible().catch(() => false));
  await startButton.click();
  await page.waitForURL(/\/app\/learn\/practice\//, { timeout: 60000 });
  check('Start review opens a practice set', page.url().includes('/app/learn/practice/'));
  // the set loads its questions after mount
  await page.waitForSelector('text=Practice Mode', { timeout: 45000 }).catch(() => undefined);
  await page.waitForTimeout(800);

  // Walk to a question that has options (a review set can start with a written
  // answer, which has no clickable options).
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

    // The reason is rendered as markdown inside the feedback panel; any paragraph
    // text longer than a sentence is the explanation.
    const panelText = (await page.locator('main').innerText().catch(() => '')).replace(/\s+/g, ' ');
    check(
      'the reason is rendered under the question',
      /lesson notes|is the answer|is correct|->|means/i.test(panelText) && panelText.length > 80,
      `${panelText.length} chars`,
    );
    await page.screenshot({ path: path.join(OUT, 'learning-practice-feedback.png') });
  }
}

check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '));

const failures = results.filter((r) => !r.ok);
console.log(`\n  ${results.length - failures.length} passed, ${failures.length} failed`);
console.log(`  screenshots: ${OUT}`);
await browser.close();
process.exit(failures.length ? 1 : 0);
