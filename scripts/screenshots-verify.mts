import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { statSync } from 'fs';

const DIR = join(import.meta.dirname!, '..', 'screenshots', 'verify');
const BASE = 'http://localhost:3000';

async function shot(page: any, name: string) {
  await page.screenshot({ path: join(DIR, `${name}.png`), timeout: 15000 });
  const sz = statSync(join(DIR, `${name}.png`)).size;
  console.log(`  ${name} (${(sz/1024).toFixed(0)}KB)`);
}

async function login(page: any, email: string) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', email).catch(() => {});
  await page.fill('input[type="password"]', 'Sanro@123').catch(() => {});
  await page.click('button[type="submit"]').catch(() => {});
  await page.waitForTimeout(5000);
}

async function visitPages(page: any, pages: [string, string][]) {
  for (const [name, path] of pages) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await shot(page, name);
  }
}

async function main() {
  await mkdir(DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  // === PUBLIC ===
  console.log('\n--- Public Pages ---');
  const pk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pp = await pk.newPage();
  await visitPages(pp, [
    ['01-landing', '/'],
    ['02-login', '/login'],
  ]);
  await pk.close();

  // === SUPER ADMIN ===
  console.log('\n--- Super Admin ---');
  const sk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const sp = await sk.newPage();
  await login(sp, 'admin@sanroai.com');
  await visitPages(sp, [
    ['03-sa-dashboard', '/app'],
    ['04-sa-institutions', '/app/institutions'],
    ['05-sa-students', '/app/people/students'],
    ['06-sa-teachers', '/app/people/teachers'],
    ['07-sa-parents', '/app/people/parents'],
    ['08-sa-curriculum', '/app/curriculum'],
    ['09-sa-questions', '/app/questions'],
    ['10-sa-papers', '/app/papers'],
    ['11-sa-assessments', '/app/assessments'],
    ['12-sa-reports', '/app/reports'],
    ['13-sa-gamification', '/app/gamification'],
    ['14-sa-import', '/app/import'],
    ['15-sa-settings', '/app/settings'],
  ]);
  await sk.close();

  // === STUDENT ===
  console.log('\n--- Student ---');
  const stK = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const stP = await stK.newPage();
  await login(stP, 'student@sanroai.com');
  await visitPages(stP, [
    ['16-student-dashboard', '/app'],
    ['17-student-learn', '/app/learn'],
    ['18-student-assessments', '/app/assessments'],
    ['19-student-chat', '/app/chat'],
    ['20-student-gamification', '/app/gamification'],
  ]);
  await stK.close();

  // === TEACHER ===
  console.log('\n--- Teacher ---');
  const tk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const tp = await tk.newPage();
  await login(tp, 'teacher@sanroai.com');
  await visitPages(tp, [
    ['21-teacher-dashboard', '/app'],
    ['22-teacher-students', '/app/students'],
    ['23-teacher-questions', '/app/questions'],
    ['24-teacher-reports', '/app/reports'],
    ['25-teacher-curriculum', '/app/curriculum'],
  ]);
  await tk.close();

  // === TABLET ===
  console.log('\n--- Student Tablet ---');
  const tb = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const tp2 = await tb.newPage();
  await login(tp2, 'student@sanroai.com');
  await visitPages(tp2, [
    ['26-student-dashboard-tablet', '/app'],
    ['27-student-learn-tablet', '/app/learn'],
  ]);
  await tb.close();

  // === MOBILE ===
  console.log('\n--- Student Mobile ---');
  const mb = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
  const mp = await mb.newPage();
  await login(mp, 'student@sanroai.com');
  await visitPages(mp, [
    ['28-student-dashboard-mobile', '/app'],
    ['29-student-learn-mobile', '/app/learn'],
    ['30-student-assessments-mobile', '/app/assessments'],
    ['31-student-chat-mobile', '/app/chat'],
  ]);
  await mb.close();

  await browser.close();
  console.log('\n✅ All screenshots saved to screenshots/verify/');
}

main().catch((e) => { console.error('Error:', e.message); process.exit(1); });
