import { chromium } from 'playwright';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SCREENSHOT_DIR = join(__dirname, '..', 'screenshots');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', 'student@sanroai.com');
  await page.fill('input[type="password"]', 'Sanro@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/app', { timeout: 30000 });
  await page.waitForTimeout(2000);
  
  await page.goto('http://localhost:3000/app/learn/concepts/dc81fa42-2811-4c37-a976-064c40ae531d', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const tabs = ['Practice', 'Quick Quiz', 'Flashcards', 'Challenge', 'Ask AI'];
  const files = ['22-concept-practice', '23-concept-quiz', '24-concept-flashcards', '25-concept-challenge', '26-concept-askai'];
  
  for (let i = 0; i < tabs.length; i++) {
    await page.getByRole('button', { name: tabs[i] }).click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(SCREENSHOT_DIR, `${files[i]}.png`), fullPage: true });
    console.log(`📸 ${files[i]}`);
  }
  
  await browser.close();
  console.log('Done');
}

main().catch((e) => { console.error(e); process.exit(1); });
