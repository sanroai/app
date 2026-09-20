import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { statSync } from 'fs';

const DIR = join(import.meta.dirname!, '..', 'screenshots');
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

  // === DESKTOP 1440x900 ===
  console.log('\n--- Desktop 1440x900 ---');
  const dk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dp = await dk.newPage();

  // Public
  await visitPages(dp, [
    ['01-landing-desktop', '/'],
    ['02-login-desktop', '/login'],
    ['03-register-desktop', '/register'],
    ['04-contact-desktop', '/contact'],
    ['05-features-desktop', '/features'],
    ['06-for-students-desktop', '/for-students'],
    ['07-for-teachers-desktop', '/for-teachers'],
    ['08-for-parents-desktop', '/for-parents'],
    ['09-about-desktop', '/about'],
    ['10-pricing-desktop', '/pricing'],
  ]);

  // Student
  await login(dp, 'student@sanroai.com');
  await visitPages(dp, [
    ['11-student-dashboard-desktop', '/app'],
    ['12-student-learn-desktop', '/app/learn'],
    ['13-student-concept-desktop', '/app/learn/concepts/5faba0f5-81ca-4399-bf90-b16ffcaa500a'],
    ['14-student-assessments-desktop', '/app/assessments'],
    ['15-student-chat-desktop', '/app/chat'],
    ['16-student-gamification-desktop', '/app/gamification'],
    ['17-student-achievements-desktop', '/app/gamification/achievements'],
    ['18-student-leaderboard-desktop', '/app/gamification/leaderboard'],
    ['19-student-reports-desktop', '/app/reports'],
    ['20-student-profile-desktop', '/app/profile'],
  ]);
  await dk.close();

  // === TEACHER DESKTOP ===
  console.log('\n--- Teacher Desktop ---');
  const tk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const tp = await tk.newPage();
  await login(tp, 'teacher@sanroai.com');
  await visitPages(tp, [
    ['21-teacher-dashboard-desktop', '/app'],
    ['22-teacher-papers-desktop', '/app/papers'],
    ['23-teacher-students-desktop', '/app/students'],
    ['24-teacher-teachers-desktop', '/app/teachers'],
    ['25-teacher-questions-desktop', '/app/questions'],
    ['26-teacher-remediation-desktop', '/app/remediation'],
    ['27-teacher-parents-desktop', '/app/parents'],
    ['28-teacher-reports-desktop', '/app/reports'],
    ['29-teacher-import-desktop', '/app/import'],
    ['30-teacher-curriculum-desktop', '/app/curriculum'],
  ]);
  await tk.close();

  // === TABLET 768x1024 ===
  console.log('\n--- Tablet 768x1024 ---');
  const tb = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const tp2 = await tb.newPage();
  await login(tp2, 'student@sanroai.com');
  await visitPages(tp2, [
    ['31-student-dashboard-tablet', '/app'],
    ['32-student-learn-tablet', '/app/learn'],
    ['33-student-concept-tablet', '/app/learn/concepts/5faba0f5-81ca-4399-bf90-b16ffcaa500a'],
    ['34-student-assessments-tablet', '/app/assessments'],
  ]);
  await tb.close();

  // === MOBILE 375x812 ===
  console.log('\n--- Mobile 375x812 ---');
  const mb = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
  const mp = await mb.newPage();
  await login(mp, 'student@sanroai.com');
  await visitPages(mp, [
    ['35-student-dashboard-mobile', '/app'],
    ['36-student-learn-mobile', '/app/learn'],
    ['37-student-concept-mobile', '/app/learn/concepts/5faba0f5-81ca-4399-bf90-b16ffcaa500a'],
    ['38-student-assessments-mobile', '/app/assessments'],
    ['39-student-chat-mobile', '/app/chat'],
    ['40-student-gamification-mobile', '/app/gamification'],
    ['41-student-profile-mobile', '/app/profile'],
  ]);
  await mb.close();

  // === NARROW MOBILE 320x568 (iPhone SE) ===
  console.log('\n--- Narrow Mobile 320x568 ---');
  const nb = await browser.newContext({ viewport: { width: 320, height: 568 }, isMobile: true });
  const np = await nb.newPage();
  await login(np, 'student@sanroai.com');
  await visitPages(np, [
    ['42-student-dashboard-narrow', '/app'],
    ['43-student-learn-narrow', '/app/learn'],
    ['44-student-concept-narrow', '/app/learn/concepts/5faba0f5-81ca-4399-bf90-b16ffcaa500a'],
  ]);
  await nb.close();

  await browser.close();
  console.log('\n✅ All screenshots saved to screenshots/');
}

main().catch((e) => { console.error('Error:', e.message); process.exit(1); });
