import { chromium } from 'playwright';

const WEB = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto(WEB + '/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 'student@sanroai.com');
  await page.fill('input[type="password"]', 'Sanro@123');
  await page.click('button[type="submit"]');
  try { await page.waitForURL('**/app', { timeout: 15000, waitUntil: 'networkidle' }); } catch {}
  await page.waitForTimeout(3000);
  console.log('Logged in, URL:', page.url());
  
  console.log('\nNavigating to /app/learn...');
  try { await page.goto(WEB + '/app/learn', { waitUntil: 'networkidle', timeout: 20000 }); } catch(e) { console.log('Nav error:', (e as Error).message); }
  await page.waitForTimeout(3000);
  console.log('URL after nav:', page.url());
  const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 300) ?? 'EMPTY');
  console.log('Body text:', bodyText);
  
  await page.screenshot({ path: 'screenshots/debug-learn.png', fullPage: true });
  console.log('Screenshot saved');
  
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
