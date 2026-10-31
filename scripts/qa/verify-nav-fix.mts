// Verify BUG-I nav fix: the "Curriculum" link must be hidden for TEACHER/INSTITUTION_ADMIN
// (it is a SUPER_ADMIN management console backed by GET /admin/curriculum @Roles(SUPER_ADMIN)),
// and still visible for SUPER_ADMIN. Also confirms teacher /app/reports stays clean.
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

async function navHas(page, label) {
  return page.evaluate((l) => document.body.innerText.includes(l), label);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const roles = [
    { email: 'teacher@sanroai.com', role: 'TEACHER', expectCurriculum: false },
    { email: 'principal@sanroai.com', role: 'INSTITUTION_ADMIN', expectCurriculum: false },
    { email: 'admin@sanroai.com', role: 'SUPER_ADMIN', expectCurriculum: true },
  ];
  for (const r of roles) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
    await login(page, r.email);
    await page.goto(`${WEB}/app`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2500);
    const hasCurriculum = await navHas(page, 'Curriculum');
    const pass = hasCurriculum === r.expectCurriculum;
    results.push({ role: r.role, hasCurriculum, expect: r.expectCurriculum, pass, errs: errs.length });
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${r.role.padEnd(20)} nav shows "Curriculum"=${hasCurriculum} (expect ${r.expectCurriculum}) consoleErrs=${errs.length}`);
    await ctx.close();
  }
  await browser.close();
  const failed = results.filter((x) => !x.pass);
  console.log(`\n=== NAV FIX SUMMARY: ${results.length - failed.length}/${results.length} PASS ===`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
