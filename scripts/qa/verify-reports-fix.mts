// Simple post-fix check of the teacher Reports page: visible text + screenshot.
import { chromium } from 'playwright';
import { QA_PASSWORD } from './_env.mjs';

const WEB = 'http://localhost:3000';
const PW = QA_PASSWORD;

async function login(page, email) {
  await page.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PW);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 20000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(2500);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const msgs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') msgs.push(m.text().slice(0, 200)); });

  await login(page, 'teacher@sanroai.com');
  msgs.length = 0;
  await page.goto(`${WEB}/app/reports`, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(5000);

  const text = await page.evaluate(() => document.body.innerText);
  console.log('console errors/warnings:', msgs.length);
  msgs.slice(0, 10).forEach((m) => console.log('  ', m));
  console.log('contains NaN:', text.includes('NaN'));
  console.log('contains undefined:', text.includes('undefined'));
  console.log('\n--- visible text (relevant lines) ---');
  text.split('\n').map((l) => l.trim()).filter((l) => l && /%|need help|Focus:|Mastery|Class |Science|Mathematics|Aarav|Top Performers|Needing Attention|Subject Overview|Class Performance/.test(l)).slice(0, 40).forEach((l) => console.log('  ', l));
  await page.screenshot({ path: 'artifacts/qa/2026-10-19/screenshots/teacher-desktop-app-reports-FIXED.png', fullPage: true });
  console.log('\nscreenshot saved');
  await browser.close();
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
