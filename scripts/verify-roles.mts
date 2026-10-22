import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { QA_PASSWORD } from './qa/_env.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000';

const CREDENTIALS: Record<string, { email: string; password: string }> = {
  student: { email: 'student@sanroai.com', password: QA_PASSWORD },
  teacher: { email: 'teacher@sanroai.com', password: QA_PASSWORD },
  parent: { email: 'parent@sanroai.com', password: QA_PASSWORD },
};

const PAGES: Record<string, Array<{ name: string; url: string }>> = {
  student: [
    { name: '01-dashboard', url: '/app' },
    { name: '02-library', url: '/app/library' },
    { name: '03-library-subjects', url: '/app/library/subjects' },
    { name: '04-assessments', url: '/app/assessments' },
    { name: '05-remediation', url: '/app/remediation' },
    { name: '06-gamification', url: '/app/gamification' },
    { name: '07-profile', url: '/app/profile' },
    { name: '08-learn-redirect', url: '/app/learn' },
  ],
  teacher: [
    { name: '01-dashboard', url: '/app' },
    { name: '02-library', url: '/app/library' },
    { name: '03-assessments', url: '/app/assessments' },
    { name: '04-questions', url: '/app/questions' },
    { name: '05-papers', url: '/app/papers' },
    { name: '06-import', url: '/app/import' },
    { name: '07-content-videos', url: '/app/content/videos' },
    { name: '08-profile', url: '/app/profile' },
  ],
  parent: [
    { name: '01-dashboard', url: '/app' },
    { name: '02-children', url: '/app/children' },
    { name: '03-profile', url: '/app/profile' },
  ],
};

const ERROR_MARKERS = [
  'Application error',
  'Something went wrong',
  'Unhandled Runtime Error',
  'Internal Server Error',
  'This page could not be displayed',
];

async function main() {
  const role = process.argv[2];
  if (!role || !(role in CREDENTIALS)) {
    console.error('usage: npx tsx scripts/verify-roles.mts <student|teacher|parent>');
    process.exit(2);
  }

  const outDir = join(ROOT, 'screenshots', role);
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  const badRequests: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300));
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message.slice(0, 300)}`));
  page.on('response', (r) => {
    if (r.url().includes('/api/v1/') && r.status() >= 400) {
      badRequests.push(`${r.status()} ${r.url().replace(WEB_URL, '')}`);
    }
  });

  const cred = CREDENTIALS[role];
  await page.goto(`${WEB_URL}/login`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.fill('#email', cred.email);
  await page.fill('#password', cred.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/app', { timeout: 30000 });
  console.log(`login ok (${role}) -> ${page.url()}`);

  const navLabels = await page.$$eval('nav a, aside a', (els) =>
    [...new Set(els.map((e) => (e.textContent ?? '').trim()).filter(Boolean))],
  );
  console.log(`nav: ${navLabels.join(' | ')}`);

  const results: Array<{
    name: string;
    url: string;
    finalUrl: string;
    status: number | null;
    ok: boolean;
    alerts: string[];
    textChars: number;
  }> = [];

  for (const p of PAGES[role]) {
    const target = `${WEB_URL}${p.url}`;
    let status: number | null = null;
    const onResp = (r: { url(): string; status(): number }) => {
      if (r.url().replace(/\/$/, '') === target.replace(/\/$/, '')) status = r.status();
    };
    page.on('response', onResp);
    await page.goto(target, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1000);
    page.off('response', onResp);

    const alerts = await page.$$eval('[role="alert"]', (els) =>
      els.map((e) => (e.textContent ?? '').trim()).filter(Boolean).slice(0, 5),
    );
    const text = (await page.textContent('body')) ?? '';
    const crash = ERROR_MARKERS.filter((m) => text.includes(m));
    const finalUrl = page.url().replace(WEB_URL, '');

    await page.screenshot({ path: join(outDir, `${p.name}.png`), fullPage: true });

    const badAlerts = alerts.filter((a) => /error|failed|unexpected/i.test(a));
    const ok = status !== null && status < 400 && crash.length === 0 && badAlerts.length === 0;
    results.push({
      name: p.name,
      url: p.url,
      finalUrl,
      status,
      ok,
      alerts: [...alerts, ...crash],
      textChars: text.trim().length,
    });
    console.log(
      `${ok ? 'PASS' : 'FAIL'} ${p.name.padEnd(24)} http=${status ?? '?'} final=${finalUrl} chars=${text.trim().length}` +
        (alerts.length || crash.length ? ` alerts=${JSON.stringify([...alerts, ...crash])}` : ''),
    );
  }

  const failed = results.filter((r) => !r.ok);
  const summary = {
    generatedAt: new Date().toISOString(),
    role,
    webUrl: WEB_URL,
    navLabels,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    badRequests: [...new Set(badRequests)],
    consoleErrors: [...new Set(consoleErrors)].slice(0, 30),
    results,
  };
  await writeFile(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');

  console.log(`\n${summary.passed}/${summary.total} pages clean; screenshots in screenshots/${role}/`);
  if (summary.badRequests.length) {
    console.log(`API calls >= 400 (${summary.badRequests.length}):`);
    for (const r of summary.badRequests) console.log(`  - ${r}`);
  }
  if (summary.consoleErrors.length) {
    console.log(`console errors (${summary.consoleErrors.length} unique):`);
    for (const e of summary.consoleErrors) console.log(`  - ${e}`);
  }

  await browser.close();
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
