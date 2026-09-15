import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SCREENSHOT_DIR = join(__dirname, '..', 'screenshots');
const WEB_URL = 'http://localhost:3000';

async function waitForServer(url: string, maxRetries = 30): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (resp.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

function killPort(port: number) {
  try {
    const procs = execSync('netstat -ano', { encoding: 'utf8' });
    const lines = procs.split('\n').filter(l => l.includes(`:${port}`) && l.includes('LISTENING'));
    for (const line of lines) {
      const pid = line.trim().split(/\s+/).pop();
      if (pid) {
        try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); } catch {}
      }
    }
  } catch {}
}

function startWeb() {
  killPort(3000);
  execSync('start powershell -ArgumentList "-NoExit","-Command","cd D:\\sanroaiapp; pnpm --filter @sanro/web dev" -WindowStyle Minimized', { shell: 'cmd.exe' });
}

function startApi() {
  killPort(4000);
  execSync('start powershell -ArgumentList "-NoExit","-Command","cd D:\\sanroaiapp; pnpm --filter @sanro/api start:dev" -WindowStyle Minimized', { shell: 'cmd.exe' });
}

async function main() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });

  const publicPages = [
    { name: '01-landing', url: WEB_URL, wait: 2000 },
    { name: '02-login', url: `${WEB_URL}/login`, wait: 1500 },
    { name: '03-register', url: `${WEB_URL}/register`, wait: 1500 },
  ];

  const studentPages = [
    { name: '04-dashboard-student', url: `${WEB_URL}/app`, wait: 3000 },
    { name: '05-learn', url: `${WEB_URL}/app/learn`, wait: 3000 },
    { name: '06-chapters', url: `${WEB_URL}/app/learn/363caf11-cee7-4dcb-a39e-09d4da7be1b4/10/61faa4bc-d04f-4b20-abc4-63cce71d61d1/chapters`, wait: 3000 },
    { name: '07-concept-detail', url: `${WEB_URL}/app/learn/concepts/5faba0f5-81ca-4399-bf90-b16ffcaa500a`, wait: 3000 },
    { name: '08-assessments', url: `${WEB_URL}/app/assessments`, wait: 3000 },
    { name: '09-chat', url: `${WEB_URL}/app/chat`, wait: 3000 },
    { name: '10-gamification', url: `${WEB_URL}/app/gamification`, wait: 3000 },
    { name: '11-gamification-leaderboard', url: `${WEB_URL}/app/gamification/leaderboard`, wait: 3000 },
    { name: '12-gamification-achievements', url: `${WEB_URL}/app/gamification/achievements`, wait: 3000 },
  ];

  const teacherPages = [
    { name: '13-dashboard-teacher', url: `${WEB_URL}/app`, wait: 3000 },
    { name: '14-papers', url: `${WEB_URL}/app/papers`, wait: 3000 },
    { name: '15-papers-new', url: `${WEB_URL}/app/papers/new`, wait: 3000 },
    { name: '16-assessments-new', url: `${WEB_URL}/app/assessments/new`, wait: 3000 },
    { name: '17-students', url: `${WEB_URL}/app/students`, wait: 3000 },
    { name: '18-teachers', url: `${WEB_URL}/app/teachers`, wait: 3000 },
    { name: '19-parents', url: `${WEB_URL}/app/parents`, wait: 3000 },
    { name: '20-questions', url: `${WEB_URL}/app/questions`, wait: 3000 },
    { name: '21-questions-new', url: `${WEB_URL}/app/questions/new`, wait: 3000 },
    { name: '22-remediation', url: `${WEB_URL}/app/remediation`, wait: 3000 },
  ];

  async function runBatch(pages: { name: string; url: string; wait: number }[], opts: { login?: { email: string; password: string; url: string } } = {}) {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();

    if (opts.login) {
      console.log(`🔐 Logging in as ${opts.login.email}...`);
      await page.goto(opts.login.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
      await page.fill('input[type="email"]', opts.login.email);
      await page.fill('input[type="password"]', opts.login.password);
      await page.click('button[type="submit"]');
      try {
        await page.waitForURL('**/app', { timeout: 15000, waitUntil: 'domcontentloaded' });
      } catch {
        console.log('   ⚠️  Login redirect timed out, continuing...');
      }
      await page.waitForTimeout(3000);
      console.log('   Logged in ✓');
    }

    for (const pg of pages) {
      console.log(`📸 ${pg.name} ...`);
      try {
        await page.goto(pg.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch {
        console.log('   ⚠️  nav failed, waiting...');
      }
      await page.waitForTimeout(pg.wait);
      await page.screenshot({ path: join(SCREENSHOT_DIR, `${pg.name}.png`), fullPage: true });
    }

    await browser.close();
  }

  // --- Public pages ---
  await runBatch(publicPages);

  // --- Student pages ---
  console.log('\n--- Student Pages ---');
  await runBatch(studentPages, {
    login: { email: 'student@sanroai.com', password: 'Sanro@123', url: `${WEB_URL}/login` }
  });

  // --- Restart server for teacher pages ---
  console.log('\n🔄 Restarting web server...');
  killPort(3000);
  await new Promise(r => setTimeout(r, 3000));
  startWeb();
  await new Promise(r => setTimeout(r, 3000));
  if (!(await waitForServer(WEB_URL))) {
    console.error('❌ Web server failed to restart');
    process.exit(1);
  }
  console.log('   Server restarted ✓\n');

  // --- Teacher pages ---
  console.log('--- Teacher Pages ---');
  await runBatch(teacherPages, {
    login: { email: 'teacher@sanroai.com', password: 'Sanro@123', url: `${WEB_URL}/login` }
  });

  console.log('\n✅ All screenshots saved to screenshots/');
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
