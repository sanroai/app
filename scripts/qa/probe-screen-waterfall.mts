/**
 * Per-request timing for a screen: which API calls a page makes, how long each
 * takes, and how long until the screen has content.
 *
 *   npx tsx scripts/qa/probe-screen-waterfall.mts --url https://sanroai.com/app/library
 *
 * A screen that fires four 500 ms calls in series takes two seconds no matter how
 * fast the code is; this shows whether the calls are serial and which one is the
 * long pole.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { QA_PASSWORD } from './_env.mjs';

const argv = process.argv.slice(2);
const arg = (name: string, def?: string) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};

const WEB_URL = arg('--url', 'https://sanroai.com/app/library')!;
const WAIT_MS = Number(arg('--wait', '8000'));
const password = process.env.QA_PASSWORD ?? QA_PASSWORD;
const origin = new URL(WEB_URL).origin;
const STATE = path.resolve('artifacts/qa/nav/state.json');

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  storageState: fs.existsSync(STATE) ? STATE : undefined,
});
const page = await context.newPage();

await page.goto(`${origin}/app`, { waitUntil: 'domcontentloaded', timeout: 60000 });
const authed = await page
  .locator('nav[aria-label="Main navigation"]')
  .first()
  .waitFor({ timeout: 20000 })
  .then(() => true)
  .catch(() => false);
if (!authed) {
  await page.waitForSelector('#email', { timeout: 60000 });
  await page.fill('#email', 'student@sanroai.com');
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => u.pathname.startsWith('/app'), { timeout: 60000 });
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  await context.storageState({ path: STATE });
}

const calls: Array<{ url: string; start: number; ms: number; status: number; kb: number }> = [];
const t0 = Date.now();
page.on('response', async (res) => {
  const url = res.url();
  if (!url.includes('/api/')) return;
  const timing = res.request().timing();
  const body = await res.body().catch(() => Buffer.alloc(0));
  calls.push({
    url: url.replace(origin, '').slice(0, 90),
    start: Math.max(0, timing.requestStart),
    ms: Math.max(0, Math.round(timing.responseEnd - timing.requestStart)),
    status: res.status(),
    kb: body.length / 1024,
  });
});

await page.goto(WEB_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('nav[aria-label="Main navigation"]', { timeout: 60000 }).catch(() => undefined);
// wait for a card (any content) or the timeout
const contentAt = await page
  .locator('main a, main [role="button"], main img')
  .first()
  .waitFor({ timeout: WAIT_MS })
  .then(() => Date.now() - t0)
  .catch(() => -1);
await page.waitForTimeout(1500);

const sorted = [...calls].sort((a, b) => a.start - b.start);
console.log(`  url          : ${WEB_URL}`);
console.log(`  first content: ${contentAt < 0 ? `> ${WAIT_MS}ms (nothing found)` : `${contentAt}ms`}`);
console.log(`  api calls    : ${sorted.length}`);
for (const call of sorted) {
  console.log(`    ${String(call.start).padStart(6)}ms  ${String(call.ms).padStart(5)}ms  ${String(call.status)}  ${call.kb.toFixed(1).padStart(7)}KB  ${call.url}`);
}
const total = sorted.reduce((sum, c) => sum + c.ms, 0);
console.log(`  api total    : ${total}ms (sum, ${sorted.length} calls)`);

await browser.close();
