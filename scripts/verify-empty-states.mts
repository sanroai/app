import { chromium } from 'playwright';
import { mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'screenshots', 'empty-state');
const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000';

type Cred = { email: string; password: string };

async function readCredentials(): Promise<Cred> {
  const raw = await readFile(join(ROOT, 'apps', 'api', '.env'), 'utf8');
  const pick = (key: string) => {
    const m = raw.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return m ? m[1].trim() : undefined;
  };
  const email = pick('SEED_SUPER_ADMIN_EMAIL');
  const password = pick('SEED_SUPER_ADMIN_PASSWORD');
  if (!email || !password) {
    throw new Error('SEED_SUPER_ADMIN_EMAIL / SEED_SUPER_ADMIN_PASSWORD missing from apps/api/.env');
  }
  return { email, password };
}

const PAGES: Array<{ name: string; url: string }> = [
  { name: '01-dashboard', url: '/app' },
  { name: '02-institutions', url: '/app/institutions' },
  { name: '03-people-students', url: '/app/people/students' },
  { name: '04-people-teachers', url: '/app/people/teachers' },
  { name: '05-people-parents', url: '/app/people/parents' },
  { name: '06-questions', url: '/app/questions' },
  { name: '07-assessments', url: '/app/assessments' },
  { name: '08-content-ingest', url: '/app/content/ingest' },
  { name: '09-curriculum', url: '/app/curriculum' },
  { name: '10-reports', url: '/app/reports' },
  { name: '11-remediation', url: '/app/remediation' },
  { name: '12-import', url: '/app/import' },
  { name: '13-papers', url: '/app/papers' },
  { name: '14-gamification', url: '/app/gamification' },
  { name: '15-achievements', url: '/app/gamification/achievements' },
  { name: '16-ar', url: '/app/ar' },
  { name: '17-settings', url: '/app/settings' },
  { name: '18-profile', url: '/app/profile' },
];

const ERROR_MARKERS = [
  'Application error',
  'Something went wrong',
  'Unhandled Runtime Error',
  'Internal Server Error',
  'This page could not be displayed',
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const cred = await readCredentials();

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300));
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message.slice(0, 300)}`));

  await page.goto(`${WEB_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', cred.email);
  await page.fill('#password', cred.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/app', { timeout: 20000 });
  console.log(`login ok -> ${page.url()}`);

  const results: Array<{
    name: string;
    url: string;
    status: number | null;
    ok: boolean;
    alerts: string[];
    textChars: number;
  }> = [];

  for (const p of PAGES) {
    const target = `${WEB_URL}${p.url}`;
    let status: number | null = null;
    page.on('response', (r) => {
      if (r.url() === target) status = r.status();
    });
    await page.goto(target, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1200);

    const alerts = await page.$$eval('[role="alert"]', (els) =>
      els.map((e) => (e.textContent ?? '').trim()).filter(Boolean).slice(0, 5),
    );
    const text = (await page.textContent('body')) ?? '';
    const crash = ERROR_MARKERS.filter((m) => text.includes(m));

    const shot = join(OUT_DIR, `${p.name}.png`);
    await page.screenshot({ path: shot, fullPage: true });

    const ok = crash.length === 0 && alerts.filter((a) => /error|failed|unexpected/i.test(a)).length === 0;
    results.push({
      name: p.name,
      url: p.url,
      status,
      ok,
      alerts: [...alerts, ...crash],
      textChars: text.trim().length,
    });
    console.log(
      `${ok ? 'PASS' : 'FAIL'} ${p.name.padEnd(24)} http=${status ?? '?'} chars=${text.trim().length}` +
        (alerts.length || crash.length ? ` alerts=${JSON.stringify([...alerts, ...crash])}` : ''),
    );
  }

  const failed = results.filter((r) => !r.ok);
  const summary = {
    generatedAt: new Date().toISOString(),
    webUrl: WEB_URL,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    consoleErrors: [...new Set(consoleErrors)].slice(0, 30),
    results,
  };
  const { writeFile } = await import('fs/promises');
  await writeFile(join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');

  console.log(`\n${summary.passed}/${summary.total} pages clean; screenshots in screenshots/empty-state/`);
  if (summary.consoleErrors.length) {
    console.log(`console errors (${summary.consoleErrors.length} unique):`);
    for (const e of summary.consoleErrors) console.log(`  - ${e}`);
  }

  await browser.close();
  if (failed.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
