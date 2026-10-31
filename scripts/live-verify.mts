import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { statSync } from 'fs';
import { QA_PASSWORD } from './qa/_env.mjs';

const DIR = join(import.meta.dirname!, '..', 'screenshots', 'live-verify');
const BASE = 'https://sanroai.com';

async function shot(page: any, name: string) {
  await page.screenshot({ path: join(DIR, `${name}.png`), timeout: 15000 });
  const sz = statSync(join(DIR, `${name}.png`)).size;
  console.log(`  ${name} (${(sz/1024).toFixed(0)}KB)`);
}

async function login(page: any, email: string) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', email).catch(() => {});
  await page.fill('input[type="password"]', QA_PASSWORD).catch(() => {});
  await page.click('button[type="submit"]').catch(() => {});
  await page.waitForTimeout(8000);
  console.log(`  Logged in as ${email} → ${page.url()}`);
}

async function visit(page: any, name: string, path: string) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 20000 }).catch(e => {
    console.log(`  ⚠️ ${name}: ${e.message.slice(0,80)}`);
  });
  await page.waitForTimeout(3000);
  await shot(page, name);
}

async function main() {
  await mkdir(DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  // === SUPER ADMIN ===
  console.log('\n--- Super Admin (live) ---');
  const sk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const sp = await sk.newPage();
  await login(sp, 'admin@sanroai.com');
  
  // Dashboard
  await visit(sp, '01-sa-dashboard', '/app');
  // Institutions
  await visit(sp, '02-sa-institutions', '/app/institutions');
  // People - Students
  await visit(sp, '03-sa-students', '/app/people/students');
  // People - Teachers
  await visit(sp, '04-sa-teachers', '/app/people/teachers');
  // People - Parents
  await visit(sp, '05-sa-parents', '/app/people/parents');
  // Academic - Curriculum
  await visit(sp, '06-sa-curriculum', '/app/curriculum');
  // Academic - Question Bank
  await visit(sp, '07-sa-questions', '/app/questions');
  // Academic - Question Papers
  await visit(sp, '08-sa-papers', '/app/papers');
  // Assessments (separate menu)
  await visit(sp, '09-sa-assessments', '/app/assessments');
  // Analytics - Reports
  await visit(sp, '10-sa-reports', '/app/reports');
  // Analytics - Gamification
  await visit(sp, '11-sa-gamification', '/app/gamification');
  // Bulk Import
  await visit(sp, '12-sa-import', '/app/import');
  // Settings
  await visit(sp, '13-sa-settings', '/app/settings');
  // Profile
  await visit(sp, '14-sa-profile', '/app/profile');
  
  await sk.close();

  // === STUDENT ===
  console.log('\n--- Student (live) ---');
  const stK = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const stP = await stK.newPage();
  await login(stP, 'student@sanroai.com');
  
  await visit(stP, '15-student-dashboard', '/app');
  await visit(stP, '16-student-learn', '/app/learn');
  await visit(stP, '17-student-assessments', '/app/assessments');
  await visit(stP, '18-student-chat', '/app/chat');
  await visit(stP, '19-student-gamification', '/app/gamification');
  
  await stK.close();

  // === TEACHER ===
  console.log('\n--- Teacher (live) ---');
  const tk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const tp = await tk.newPage();
  await login(tp, 'teacher@sanroai.com');
  
  await visit(tp, '20-teacher-dashboard', '/app');
  await visit(tp, '21-teacher-students', '/app/students');
  await visit(tp, '22-teacher-questions', '/app/questions');
  await visit(tp, '23-teacher-reports', '/app/reports');
  await visit(tp, '24-teacher-curriculum', '/app/curriculum');
  
  await tk.close();

  await browser.close();
  console.log('\n✅ All live screenshots saved');
}

main().catch((e) => { console.error('Error:', e.message); process.exit(1); });
