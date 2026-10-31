// FINDING-G route-guard probe: logs in as each role, navigates to /app/papers,
// and asserts the staff-only render-guard. Allowed roles (TEACHER / INSTITUTION_ADMIN /
// SUPER_ADMIN) must see the h1 "Question papers"; blocked roles (STUDENT / PARENT) must
// see the h2 "Access Denied" instead. Read-only + real screenshots for evidence.
//
// Run: npx tsx scripts/qa/probe-papers-guard.mts
import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { QA_PASSWORD } from './_env.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..', '..');
const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000';
const OUT_DIR = join(ROOT, 'artifacts', 'qa', '2026-10-19', 'screenshots');
const PW = QA_PASSWORD;

type Case = { role: string; email: string; expect: 'allowed' | 'blocked' };

const CASES: Case[] = [
  { role: 'student', email: 'student@sanroai.com', expect: 'blocked' },
  { role: 'parent', email: 'parent@sanroai.com', expect: 'blocked' },
  { role: 'teacher', email: 'teacher@sanroai.com', expect: 'allowed' },
  { role: 'principal', email: 'principal@sanroai.com', expect: 'allowed' },
  { role: 'admin', email: 'admin@sanroai.com', expect: 'allowed' },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const results: Array<{ role: string; expect: string; got: string; ok: boolean }> = [];

  for (const c of CASES) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await page.goto(`${WEB_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.fill('#email', c.email);
    await page.fill('#password', PW);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app', { timeout: 30000 });

    await page.goto(`${WEB_URL}/app/papers`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(800);

    const hasDenied = (await page.locator('h2:has-text("Access Denied")').count()) > 0;
    const hasList = (await page.locator('h1:has-text("Question papers")').count()) > 0;

    await page.screenshot({ path: join(OUT_DIR, `papers-guard-${c.role}.png`), fullPage: true });

    const got = hasDenied ? 'blocked' : hasList ? 'allowed' : 'neither';
    const ok = got === c.expect;
    results.push({ role: c.role, expect: c.expect, got, ok });
    console.log(
      `${ok ? 'PASS' : 'FAIL'} ${c.role.padEnd(11)} expect=${c.expect.padEnd(7)} got=${got}` +
        ` (h1List=${hasList} h2Denied=${hasDenied})`,
    );

    await context.close();
  }

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} route-guard cases PASS`);
  if (failed.length) {
    console.error('FAILED:', JSON.stringify(failed));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
