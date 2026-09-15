import { chromium } from 'playwright';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIR = join(__dirname, '..', 'screenshots');
const WEB = 'http://localhost:3000';

const pages: [string, string][] = [
  ['04-dashboard-student', WEB + '/app'],
  ['05-learn', WEB + '/app/learn'],
  ['06-chapters', WEB + '/app/learn/363caf11-cee7-4dcb-a39e-09d4da7be1b4/10/61faa4bc-d04f-4b20-abc4-63cce71d61d1/chapters'],
  ['07-concept-detail', WEB + '/app/learn/concepts/5faba0f5-81ca-4399-bf90-b16ffcaa500a'],
  ['08-assessments', WEB + '/app/assessments'],
  ['09-chat', WEB + '/app/chat'],
  ['10-gamification', WEB + '/app/gamification'],
  ['11-gamification-leaderboard', WEB + '/app/gamification/leaderboard'],
  ['12-gamification-achievements', WEB + '/app/gamification/achievements'],
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  console.log('Logging in as student...');
  await page.goto(WEB + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 'student@sanroai.com');
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
