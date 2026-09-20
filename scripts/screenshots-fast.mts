import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const DIR = join(import.meta.dirname!, '..', 'screenshots');
const BASE = 'http://localhost:3000';
const API = 'http://localhost:4000';

async function main() {
  await mkdir(DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // --- Desktop (1440x900) ---
  console.log('\n--- Desktop 1440x900 ---');
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dp = await desktop.newPage();

  const publicPages = [
    ['01-landing', '/'],
    ['02-login', '/login'],
    ['03-register', '/register'],
  ];
  for (const [name, path] of publicPages) {
    await dp.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await dp.waitForTimeout(2000);
    await dp.screenshot({ path: join(DIR, `${name}-desktop.png`) });
    console.log(`  ${name}`);
  }

  // Login as student
  await dp.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await dp.waitForTimeout(1500);
  await dp.fill('input[type="email"]', 'student@sanroai.com').catch(() => {});
  await dp.fill('input[type="password"]', 'Sanro@123').catch(() => {});
  await dp.click('button[type="submit"]').catch(() => {});
  await dp.waitForTimeout(4000);

  const studentPages = [
    ['04-dashboard-student', '/app'],
    ['05-learn', '/app/learn'],
    ['06-concept-detail', '/app/learn/concepts/5faba0f5-81ca-4399-bf90-b16ffcaa500a'],
    ['07-assessments', '/app/assessments'],
    ['08-chat', '/app/chat'],
    ['09-gamification', '/app/gamification'],
    ['10-gamification-achievements', '/app/gamification/achievements'],
    ['11-gamification-leaderboard', '/app/gamification/leaderboard'],
    ['12-reports', '/app/reports'],
  ];
  for (const [name, path] of studentPages) {
    await dp.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await dp.waitForTimeout(2500);
    await dp.screenshot({ path: join(DIR, `${name}-desktop.png`) });
    console.log(`  ${name}`);
  }
  await desktop.close();

  // --- Login as teacher ---
  console.log('\n--- Teacher Desktop ---');
  const tDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const tp = await tDesktop.newPage();
  await tp.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await tp.waitForTimeout(1500);
  await tp.fill('input[type="email"]', 'teacher@sanroai.com').catch(() => {});
  await tp.fill('input[type="password"]', 'Sanro@123').catch(() => {});
  await tp.click('button[type="submit"]').catch(() => {});
  await tp.waitForTimeout(4000);

  const teacherPages = [
    ['13-dashboard-teacher', '/app'],
    ['14-papers', '/app/papers'],
    ['15-students', '/app/students'],
    ['16-teachers', '/app/teachers'],
    ['17-questions', '/app/questions'],
    ['18-remediation', '/app/remediation'],
    ['19-parents', '/app/parents'],
  ];
  for (const [name, path] of teacherPages) {
    await tp.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await tp.waitForTimeout(2500);
    await tp.screenshot({ path: join(DIR, `${name}-desktop.png`) });
    console.log(`  ${name}`);
  }
  await tDesktop.close();

  // --- Tablet (768x1024) ---
  console.log('\n--- Tablet 768x1024 ---');
  const tablet = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  const tabp = await tablet.newPage();
  await tabp.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await tabp.waitForTimeout(1500);
  await tabp.fill('input[type="email"]', 'student@sanroai.com').catch(() => {});
  await tabp.fill('input[type="password"]', 'Sanro@123').catch(() => {});
  await tabp.click('button[type="submit"]').catch(() => {});
  await tabp.waitForTimeout(4000);

  for (const [name, path] of [['20-dashboard-tablet', '/app'], ['21-learn-tablet', '/app/learn'], ['22-concept-tablet', '/app/learn/concepts/5faba0f5-81ca-4399-bf90-b16ffcaa500a']]) {
    await tabp.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await tabp.waitForTimeout(2500);
    await tabp.screenshot({ path: join(DIR, `${name}.png`) });
    console.log(`  ${name}`);
  }
  await tablet.close();

  // --- Mobile (375x812 iPhone 14) ---
  console.log('\n--- Mobile 375x812 ---');
  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
  const mp = await mobile.newPage();
  await mp.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await mp.waitForTimeout(1500);
  await mp.fill('input[type="email"]', 'student@sanroai.com').catch(() => {});
  await mp.fill('input[type="password"]', 'Sanro@123').catch(() => {});
  await mp.click('button[type="submit"]').catch(() => {});
  await mp.waitForTimeout(4000);

  for (const [name, path] of [['23-dashboard-mobile', '/app'], ['24-learn-mobile', '/app/learn'], ['25-concept-mobile', '/app/learn/concepts/5faba0f5-81ca-4399-bf90-b16ffcaa500a']]) {
    await mp.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await mp.waitForTimeout(2500);
    await mp.screenshot({ path: join(DIR, `${name}.png`) });
    console.log(`  ${name}`);
  }
  await mobile.close();

  await browser.close();
  console.log('\n✅ All screenshots saved to screenshots/');
}

main().catch((e) => { console.error('Error:', e.message); process.exit(1); });
