import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  
  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Page title:', await page.title());
  console.log('URL:', page.url());
  
  await page.fill('input[type="email"]', 'admin@sanroai.com');
  await page.fill('input[type="password"]', 'Sanro@123');
  await page.click('button[type="submit"]');
  console.log('Submitted login form');
  await page.waitForTimeout(8000);
  console.log('After login URL:', page.url());
  
  await page.goto('http://localhost:3000/app/assessments', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(5000);
  console.log('Assessments URL:', page.url());
  await page.screenshot({ path: 'screenshots/verify/debug-assessments.png' });
  
  await browser.close();
  console.log('Done');
})();
