/**
 * Probe: the in-app textbook reader on web.
 *
 * Opens a chapter hub, asserts the reader affordance, opens it and checks that the
 * rendered NCERT pages actually paint (a signed page URL can silently 401/404 and
 * still leave an <img> element in the DOM, so the probe reads naturalWidth).
 *
 *   npx tsx scripts/qa/probe-textbook-reader.mts
 *   WEB_URL=http://localhost:3000 npx tsx scripts/qa/probe-textbook-reader.mts
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { QA_PASSWORD } from './_env.mjs';

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000';
const STATE = path.resolve(process.env.STATE_FILE ?? 'artifacts/qa/2026-10-25/state-3000.json');

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  storageState: fs.existsSync(STATE) ? STATE : undefined,
});
const page = await context.newPage();
const failures: string[] = [];
page.on('response', (res) => {
  if (res.url().includes('/learning/pdf/') && res.status() >= 400) {
    failures.push(`${res.status()} ${res.url()}`);
  }
});

await page.goto(`${WEB_URL}/app`, { waitUntil: 'domcontentloaded', timeout: 120000 });
const authed = await page
  .locator('nav[aria-label="Main navigation"], #email')
  .first()
  .waitFor({ timeout: 120000 })
  .then(() => page.locator('nav[aria-label="Main navigation"]').count())
  .catch(() => 0);
if (!authed) {
  await page.goto(`${WEB_URL}/login`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.fill('#email', 'student@sanroai.com');
  await page.fill('#password', QA_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => u.pathname.startsWith('/app'), { timeout: 120000 });
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  await context.storageState({ path: STATE });
}

await page.goto(`${WEB_URL}/app/library/subjects`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForSelector('h1:has-text("Browse by subject")', { timeout: 120000 });
// Class 10 has a real chapter book; the first card (class 1) legitimately has none.
await page.locator('a[href*="/chapters"][href*="/10/"]').first().click();
await page.waitForSelector('a[href*="/learn/chapters/"]', { timeout: 120000 });
await page.locator('a[href*="/learn/chapters/"]').first().click();
await page.waitForSelector('main h1', { timeout: 120000 });
await page.waitForTimeout(1500);

const readerButton = page.getByRole('button', { name: /Read the textbook|Open textbook|View chapter PDF/i }).first();
const label = (await readerButton.innerText()).trim();
console.log(`  affordance: "${label}"`);

await readerButton.click();
await page.waitForSelector('[role="dialog"]', { timeout: 30000 });
await page.waitForTimeout(1500);

const images = page.locator('[role="dialog"] img');
const count = await images.count();
const first = images.first();
const firstSrc = count ? await first.getAttribute('src') : '';
const firstWidth = count
  ? await first
      .evaluate(
        (img) =>
          new Promise<number>((resolve) => {
            const el = img as HTMLImageElement;
            if (el.complete) return resolve(el.naturalWidth);
            el.addEventListener('load', () => resolve(el.naturalWidth), { once: true });
            el.addEventListener('error', () => resolve(0), { once: true });
            setTimeout(() => resolve(el.naturalWidth), 30000);
          }),
      )
      .catch(() => 0)
  : 0;
const dialogText = (await page.locator('[role="dialog"]').first().innerText()).replace(/\n/g, ' | ');

console.log(`  dialog images: ${count}`);
console.log(`  first page src: ${String(firstSrc).slice(0, 110)}`);
console.log(`  first page naturalWidth: ${firstWidth}`);
console.log(`  dialog text: ${dialogText.slice(0, 160)}`);

if (!/Not available/i.test(label)) {
  if (count === 0) failures.push('reader dialog rendered no pages');
  if (firstWidth === 0) failures.push('first page image did not load (naturalWidth 0)');

  const hasDownload = /Download PDF/i.test(dialogText);
  const hasOpen = /Open PDF/i.test(dialogText);
  if (!hasDownload && !hasOpen) failures.push('no PDF action in the reader dialog');

  if (hasDownload) {
    // Same-origin file: a real download is expected.
    const download = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
    await page.getByRole('button', { name: /Download PDF/i }).first().click();
    const file = await download;
    if (!file) failures.push('Download PDF produced no download');
    else console.log(`  download: ${file.suggestedFilename()}`);
  } else {
    // The external NCERT file cannot be force-downloaded across origins, so the
    // dialog offers "Open PDF" instead. It must actually open one.
    const popup = page.waitForEvent('popup', { timeout: 60000 }).catch(() => null);
    await page.getByRole('link', { name: /Open PDF/i }).first().click();
    const opened = await popup;
    if (!opened) failures.push('Open PDF opened no tab');
    else {
      console.log(`  opened: ${opened.url().slice(0, 90)}`);
      await opened.close().catch(() => {});
    }
  }
} else {
  console.log('  (this deployment has no rendered pages - PDF fallback is expected)');
}

await page.screenshot({ path: 'artifacts/qa/2026-10-25/textbook-reader-web.png' });
await browser.close();

if (failures.length) {
  console.log(`  RESULT: FAIL\n    ${failures.join('\n    ')}`);
  process.exit(1);
}
console.log('  RESULT: PASS');
