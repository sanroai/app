// Verify BUG-H fix: stale external YouTube thumbnails must degrade to the type-icon
// fallback (no broken-image glyph / naturalWidth===0) on the student Library page.
import { chromium } from 'playwright';
import { QA_PASSWORD } from './_env.mjs';

const WEB = 'http://localhost:3000';
const PW = QA_PASSWORD;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrs: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text().slice(0, 160)); });
  const failed404: string[] = [];
  page.on('response', (r) => {
    if (r.status() === 404 && (r.url().includes('ytimg.com') || r.url().includes('i.ytimg'))) failed404.push(r.url());
  });

  // login as student
  await page.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.fill('input[type="email"]', 'student@sanroai.com');
  await page.fill('input[type="password"]', PW);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(3000);

  // go to library
  await page.goto(`${WEB}/app/library`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000); // let thumbs attempt (and fail) to load

  const stats = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0 && (i.getAttribute('src') || '').length > 0);
    return {
      total: imgs.length,
      broken: broken.length,
      brokenSrcs: broken.map((i) => i.getAttribute('src')).slice(0, 12),
      ytThumbs: imgs.filter((i) => (i.getAttribute('src') || '').includes('ytimg')).length,
    };
  });

  await page.screenshot({ path: 'artifacts/qa/2026-10-19/screenshots/web-library-BUGH-FIXED.png', fullPage: false });

  console.log(`images total=${stats.total}  ytimg thumbs still shown=${stats.ytThumbs}`);
  console.log(`BROKEN images (naturalWidth=0) = ${stats.broken}`);
  if (stats.broken) console.log('  broken srcs:', stats.brokenSrcs.join('\n  '));
  console.log(`ytimg 404 network responses = ${failed404.length} (expected: some, but they must NOT render as broken <img>)`);
  console.log(`console errors = ${consoleErrs.length}`);
  if (consoleErrs.length) console.log('  ' + consoleErrs.slice(0, 5).join('\n  '));

  const pass = stats.broken === 0;
  console.log(`\n=== BUG-H ${pass ? 'PASS' : 'FAIL'}: zero broken images rendered ===`);
  await browser.close();
  process.exit(pass ? 0 : 1);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
