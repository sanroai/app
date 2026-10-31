/**
 * End-to-end click latency for the library drill-down (see docs/NAVIGATION_PERFORMANCE.md).
 * Simulates a real pointer: hover the target (fires prefetch), pause, then click.
 *
 *   npx tsx scripts/qa/probe-nav-timing.mts
 *   WEB_URL=http://localhost:3001 npx tsx scripts/qa/probe-nav-timing.mts
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { QA_PASSWORD } from './_env.mjs';

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000';
const HOVER_MS = Number(process.env.HOVER_MS ?? 400);
const STATE = path.resolve(`artifacts/qa/2026-10-25/state-${new URL(WEB_URL).port}.json`);

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  storageState: fs.existsSync(STATE) ? STATE : undefined,
});
const page = await context.newPage();

const apiCalls: Array<{ url: string; ms: number; status: number }> = [];
page.on('response', (res) => {
  const url = res.url();
  if (!url.includes('/api/v1/')) return;
  const timing = res.request().timing();
  apiCalls.push({ url, ms: Math.max(0, timing.responseEnd - timing.requestStart), status: res.status() });
});

async function login() {
  await page.goto(`${WEB_URL}/login`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForSelector('#email', { timeout: 120000 });
  await page.fill('#email', 'student@sanroai.com');
  await page.fill('#password', QA_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => u.pathname.startsWith('/app'), { timeout: 120000 });
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  await context.storageState({ path: STATE });
}

await page.goto(`${WEB_URL}/app`, { waitUntil: 'domcontentloaded', timeout: 120000 });
const authed = await page
  .locator('nav[aria-label="Main navigation"], #email')
  .first()
  .waitFor({ timeout: 120000 })
  .then(() => page.locator('nav[aria-label="Main navigation"]').count())
  .catch(() => 0);
if (!authed) await login();
await page.waitForSelector('nav[aria-label="Main navigation"]', { timeout: 120000 });

async function step(label: string, hover: string | null, action: () => Promise<void>, selector: string) {
  apiCalls.length = 0;
  if (hover) {
    const target = page.locator(hover).first();
    if (await target.count()) await target.hover({ force: true }).catch(() => {});
    await page.waitForTimeout(HOVER_MS);
  }
  const started = Date.now();
  await action();
  try {
    await page.waitForSelector(selector, { timeout: 30000, state: 'visible' });
  } catch {
    console.log(`  ${label.padEnd(28)} TIMEOUT after ${Date.now() - started}ms (url=${page.url()})`);
    return;
  }
  const ms = Date.now() - started;
  const apiTotal = apiCalls.reduce((a, c) => a + c.ms, 0);
  console.log(
    `  ${label.padEnd(28)} ${String(ms).padStart(5)}ms   api ${apiTotal.toFixed(0)}ms / ${apiCalls.length} calls   ${page.url().replace(WEB_URL, '')}`,
  );
}

const NAV = 'nav[aria-label="Main navigation"]';
const navLink = (name: string) => `${NAV} a:has-text("${name}")`;

await step('nav Library', navLink('Library'), async () => {
  await page.locator(NAV).getByRole('link', { name: 'Library' }).click();
}, 'h1:has-text("Library")');

await step('Browse by subject', 'a[href*="/library/subjects"]', async () => {
  await page.getByRole('link', { name: /Browse by subject/i }).click();
}, 'h1:has-text("Browse by subject")');

await step('subject card -> chapters', 'a[href*="/chapters"]', async () => {
  await page.locator('a[href*="/chapters"]').first().click();
}, 'h1:has-text("Chapters")');

const beforeHub = page.url();
await step(
  'chapter -> chapter hub',
  'a[href*="/learn/chapters/"]',
  async () => {
    await page.locator('a[href*="/learn/chapters/"]').first().click();
    await page.waitForURL((u) => u.href !== beforeHub, { timeout: 30000 }).catch(() => {});
  },
  'main h1',
);

const beforeConcept = page.url();
await step(
  'concept -> concept page',
  'a[href*="/learn/concepts/"]',
  async () => {
    const link = page.locator('a[href*="/learn/concepts/"]').first();
    if (!(await link.count())) return;
    await link.click();
    await page.waitForURL((u) => u.href !== beforeConcept, { timeout: 30000 }).catch(() => {});
  },
  'main h1',
);

await step('back -> Library (warm)', navLink('Library'), async () => {
  await page.locator(NAV).getByRole('link', { name: 'Library' }).click();
}, 'h1:has-text("Library")');

await step('subjects (warm)', 'a[href*="/library/subjects"]', async () => {
  await page.getByRole('link', { name: /Browse by subject/i }).click();
}, 'h1:has-text("Browse by subject")');

await step('chapters (warm)', 'a[href*="/chapters"]', async () => {
  await page.locator('a[href*="/chapters"]').first().click();
}, 'h1:has-text("Chapters")');

await browser.close();
