import { chromium } from 'playwright';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIR = join(__dirname, '..', 'screenshots');
const WEB = 'http://localhost:3000';

const pages: [string, string][] = [
  ['13-dashboard-teacher', WEB + '/app'],
  ['14-papers', WEB + '/app/papers'],
  ['15-papers-new', WEB + '/app/papers/new'],
  ['16-assessments-new', WEB + '/app/assessments/new'],
  ['17-students', WEB + '/app/students'],
  ['18-teachers', WEB + '/app/teachers'],
  ['19-parents', WEB + '/app/parents'],
  ['20-questions', WEB + '/app/questions'],
  ['21-questions-new', WEB + '/app/questions/new'],
  ['22-remediation', WEB + '/app/remediation'],
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  console.log('Logging in as teacher...');
  await page.goto(WEB + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 'teacher@sanroai.com');
  await page.fill('input[type="password"]', 'Sanro@123');
  await page.click('button[type="submit"]');
  try { await page.waitForURL('**/app', { timeout: 15000, waitUntil: 'networkidle' }); } catch {}
  await page.waitForTimeout(3000);
  console.log('Logged in ✓');

  for (const [name, url] of pages) {
    console.log(`📸 ${name} ...`);
    try { await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }); } catch {
      await page.waitForTimeout(3000);
    }
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(DIR, `${name}.png`), fullPage: true });
  }
  await browser.close();
  console.log('Done ✓');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
