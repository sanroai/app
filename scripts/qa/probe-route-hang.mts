/**
 * Diagnoses one production route that never finishes loading.
 *
 *   npx tsx scripts/qa/probe-route-hang.mts --url https://sanroai.com/app/... --wait 20000
 *
 * Prints the network requests still pending when the wait expires, every failed
 * request, and console errors - so "it just spins" becomes a named cause.
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

const WEB_URL = arg('--url', 'https://sanroai.com/app')!;
const WAIT_MS = Number(arg('--wait', '20000'));
const OUT = arg('--out', `artifacts/qa/${new Date().toISOString().slice(0, 10)}/screenshots/route-hang.png`)!;
const password = process.env.QA_PASSWORD ?? QA_PASSWORD;
const origin = new URL(WEB_URL).origin;
const STATE = path.resolve(`artifacts/qa/2026-10-25/state-${new URL(WEB_URL).port || (origin.startsWith('https') ? 443 : 80)}.json`);

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  storageState: fs.existsSync(STATE) ? STATE : undefined,
});
const page = await context.newPage();

const pending = new Map<string, number>();
const failed: string[] = [];
const consoleErrors: string[] = [];

page.on('request', (req) => pending.set(req.url(), Date.now()));
page.on('requestfinished', (req) => pending.delete(req.url()));
page.on('requestfailed', (req) => {
  pending.delete(req.url());
  failed.push(`${req.failure()?.errorText ?? 'failed'} ${req.url()}`);
});
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

// sign in first if the storage state is stale
await page.goto(`${origin}/app`, { waitUntil: 'domcontentloaded', timeout: 60000 });
const authed = await page.locator('nav[aria-label="Main navigation"]').count().catch(() => 0);
if (!authed) {
  const email = page.locator('#email');
  if (await email.count()) {
    await page.fill('#email', 'student@sanroai.com');
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await page.waitForURL((u) => u.pathname.startsWith('/app'), { timeout: 60000 });
    fs.mkdirSync(path.dirname(STATE), { recursive: true });
    await context.storageState({ path: STATE });
  }
}

pending.clear();
const started = Date.now();
await page.goto(WEB_URL, { waitUntil: 'domcontentloaded', timeout: WAIT_MS }).catch((err) => {
  console.log(`  goto: ${(err as Error).message.split('\n')[0]}`);
});

await page.waitForTimeout(WAIT_MS);
const elapsed = Date.now() - started;

fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
await page.screenshot({ path: path.resolve(OUT), fullPage: false });

const bodies = await page.locator('main, body').first().innerText().catch(() => '');
const text = String(bodies).replace(/\s+/g, ' ').slice(0, 400);

console.log(`  url       : ${WEB_URL}`);
console.log(`  elapsed   : ${elapsed}ms`);
console.log(`  visible   : ${text || '(empty)'}`);
console.log(`  screenshot: ${OUT}`);
console.log(`  still open: ${pending.size}`);
for (const [url, at] of [...pending].slice(0, 12)) {
  console.log(`    +${Date.now() - at}ms ${url.slice(0, 140)}`);
}
console.log(`  failed    : ${failed.length}`);
for (const line of failed.slice(0, 12)) console.log(`    ${line.slice(0, 160)}`);
console.log(`  console   : ${consoleErrors.length}`);
for (const line of consoleErrors.slice(0, 8)) console.log(`    ${line.slice(0, 200)}`);

await browser.close();
