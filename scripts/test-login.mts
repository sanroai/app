import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));
  page.on('response', response => {
    if (response.status() >= 400) console.log(`${response.status()} ${response.url()}`);
  });
  
  // Login
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'student@sanroai.com');
  await page.fill('input[type="password"]', 'Sanro@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/app', { timeout: 15000 });
  
  // Try questions page
  try {
    const response = await page.goto('http://localhost:3000/app/questions', { waitUntil: 'networkidle', timeout: 15000 });
    console.log('Questions status:', response?.status());
    console.log('Questions URL:', page.url());
  } catch (e: any) {
    console.log('Error:', e.message);
  }
  
  await browser.close();
})();
