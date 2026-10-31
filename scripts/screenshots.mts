// Consolidated screenshot capture for the whole app (replaces the previous
// screenshots-all / -fast / -verify / student- / teacher- / tab- scripts and the
// standalone login/debug helpers).
//
//   node --import tsx scripts/screenshots.mts [options]
//     --role <public|student|teacher|parent|admin|all>   default: all
//     --viewport <desktop|mobile|both>                    default: desktop
//     --out <dir>                                         default: screenshots/
//     --tabs                                              also capture the concept mode tabs
//     --login-only                                        login smoke test, then exit
//     --wait <ms>                                         per-page settle time (default 3000)
//     --no-start                                          do not (re)start the dev servers
import { chromium } from 'playwright';
import { statSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { QA_PASSWORD } from './qa/_env.mjs';

const WEB = 'http://localhost:3000';
const API = 'http://localhost:4000/api/v1';

const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(name);
const value = (name: string, fallback: string) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const role = value('--role', 'all');
const viewport = value('--viewport', 'desktop');
const outDir = value('--out', 'screenshots');
const wait = Number(value('--wait', '3000'));
const wantTabs = flag('--tabs');
const loginOnly = flag('--login-only');

const ROLES = {
  public: [
    ['01-landing', '/'],
    ['02-login', '/login'],
    ['03-register', '/register'],
    ['04-contact', '/contact'],
    ['05-features', '/features'],
    ['06-for-students', '/for-students'],
    ['07-for-teachers', '/for-teachers'],
    ['08-for-parents', '/for-parents'],
    ['09-about', '/about'],
    ['10-pricing', '/pricing'],
    ['11-terms', '/terms'],
    ['12-privacy', '/privacy'],
    ['13-download', '/download'],
  ],
  student: [
    ['20-dashboard', '/app'],
    ['21-library', '/app/library'],
    ['22-library-subjects', '/app/library/subjects'],
    ['23-assessments', '/app/assessments'],
    ['24-chat', '/app/chat'],
    ['25-gamification', '/app/gamification'],
    ['26-gamification-achievements', '/app/gamification/achievements'],
    ['27-gamification-leaderboard', '/app/gamification/leaderboard'],
    ['28-reports', '/app/reports'],
    ['29-profile', '/app/profile'],
  ],
  teacher: [
    ['30-dashboard', '/app'],
    ['31-papers', '/app/papers'],
    ['32-papers-new', '/app/papers/new'],
    ['33-assessments-new', '/app/assessments/new'],
    ['34-students', '/app/students'],
    ['35-teachers', '/app/teachers'],
    ['36-parents', '/app/parents'],
    ['37-questions', '/app/questions'],
    ['38-questions-new', '/app/questions/new'],
    ['39-remediation', '/app/remediation'],
    ['40-reports', '/app/reports'],
    ['41-curriculum', '/app/curriculum'],
    ['42-content-videos', '/app/content/videos'],
  ],
  parent: [
    ['50-dashboard', '/app'],
    ['51-children', '/app/children'],
    ['52-profile', '/app/profile'],
  ],
  admin: [
    ['60-dashboard', '/app'],
    ['61-institutions', '/app/institutions'],
    ['62-people-students', '/app/people/students'],
    ['63-people-teachers', '/app/people/teachers'],
    ['64-people-parents', '/app/people/parents'],
    ['65-curriculum', '/app/curriculum'],
    ['66-questions', '/app/questions'],
    ['67-papers', '/app/papers'],
    ['68-settings', '/app/settings'],
    ['69-import', '/app/import'],
    ['70-reports', '/app/reports'],
    ['71-gamification', '/app/gamification'],
    ['72-ar', '/app/ar'],
  ],
} as const;

const ACCOUNTS: Record<string, string> = {
  student: 'student@sanroai.com',
  teacher: 'teacher@sanroai.com',
  parent: 'parent@sanroai.com',
  admin: 'admin@sanroai.com',
};

const dir = join(process.cwd(), outDir);
await mkdir(dir, { recursive: true });

async function waitForServer(url: string, tries = 30): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (r.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function login(page: any, email: string): Promise<{ ok: boolean; status: number | null }> {
  await page.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  const [response] = await Promise.all([
    page
      .waitForResponse((r: any) => r.url().includes('/auth/login'), { timeout: 20000 })
      .catch(() => null),
    (async () => {
      await page.fill('input[type="email"]', email).catch(() => {});
      await page.fill('input[type="password"]', QA_PASSWORD).catch(() => {});
      await page.click('button[type="submit"]').catch(() => {});
    })(),
  ]);
  const status = response ? response.status() : null;
  await page.waitForTimeout(3500);
  return { ok: !page.url().includes('/login'), status };
}

/**
 * The auth limiter allows 10 logins/min. A run that captures four roles can collide with
 * an already-open window, so a throttled attempt waits for the window and retries once
 * instead of silently skipping the role.
 */
async function loginWithRetry(page: any, email: string) {
  let result = await login(page, email);
  if (!result.ok && result.status === 429) {
    console.log('  (auth rate limit reached - waiting 62s for the window to reset)');
    await new Promise((r) => setTimeout(r, 62000));
    result = await login(page, email);
  }
  return result;
}

async function shot(page: any, name: string) {
  const file = join(dir, `${name}.png`);
  await page.screenshot({ path: file, timeout: 20000, fullPage: true }).catch(() => {});
  try {
    console.log(`  ${name} (${(statSync(file).size / 1024).toFixed(0)}KB)`);
  } catch {
    console.log(`  ${name}`);
  }
}

/**
 * Wait until the page has actually rendered its data. shadcn's Skeleton uses
 * `animate-pulse`, so waiting for the last skeleton to detach is a reliable signal
 * that the query resolved - a fixed delay just photographs loading placeholders.
 * `networkidle` comes first: on `next dev` a route is compiled on demand, and the
 * first response can be an empty shell while it compiles.
 */
async function settle(page: any) {
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page
    .locator('.animate-pulse')
    .first()
    .waitFor({ state: 'detached', timeout: 20000 })
    .catch(() => {});
  await page.waitForTimeout(wait);
}

async function visit(page: any, routes: ReadonlyArray<readonly [string, string]>, suffix = '') {
  for (const [name, path] of routes) {
    await page.goto(`${WEB}${path}`, { waitUntil: 'domcontentloaded', timeout: 25000 }).catch(() => {});
    await settle(page);
    await shot(page, `${name}${suffix}`);
  }
}

/** resolves a live concept id + library item id so the script survives re-seeds */
async function liveIds(token: string) {
  const h = { authorization: `Bearer ${token}` };
  const out: { conceptId?: string; arConceptId?: string; itemId?: string } = {};
  try {
    const r = await fetch(`${API}/learning/path`, { headers: h });
    const j = await r.json().catch(() => null);
    // GET /learning/path -> { student, summary, next, focus, retests, track }
    const conceptId =
      j?.next?.conceptId ??
      j?.track?.[0]?.conceptId ??
      j?.path?.[0]?.conceptId ??
      j?.concepts?.[0]?.conceptId ??
      j?.items?.[0]?.conceptId ??
      j?.focus?.[0]?.conceptId;
    if (conceptId) out.conceptId = conceptId;
  } catch {}
  try {
    const r = await fetch(`${API}/content/browse?pageSize=1`, { headers: h });
    const j = await r.json().catch(() => null);
    const itemId = j?.items?.[0]?.id ?? j?.data?.[0]?.id ?? j?.results?.[0]?.id;
    if (itemId) out.itemId = itemId;
  } catch {}
  // a concept that actually owns a 3D model, so the AR / 3D mode is covered too
  try {
    const r = await fetch(`${API}/ar`, { headers: h });
    const j = await r.json().catch(() => null);
    const list = Array.isArray(j) ? j : (j?.items ?? j?.data ?? []);
    const candidate = list.find((m: any) => m?.conceptId)?.conceptId;
    if (candidate && candidate !== out.conceptId) out.arConceptId = candidate;
  } catch {}
  return out;
}

if (!(await waitForServer(`${WEB}`))) {
  console.error(`web is not reachable on ${WEB} - start it with: pnpm --filter @sanro/web dev`);
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const viewports =
  viewport === 'both'
    ? [
        { name: '-desktop', width: 1440, height: 900 },
        { name: '-mobile', width: 390, height: 844 },
      ]
    : [{ name: viewport === 'mobile' ? '-mobile' : '-desktop', width: viewport === 'mobile' ? 390 : 1440, height: viewport === 'mobile' ? 844 : 900 }];

for (const vp of viewports) {
  console.log(`\n--- ${vp.width}x${vp.height} ---`);
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();

  if (role === 'public' || role === 'all') await visit(page, ROLES.public, vp.name);

  if (role !== 'public') {
    for (const key of Object.keys(ACCOUNTS)) {
      if (role !== 'all' && role !== key) continue;
      console.log(`\n  [${key}]`);
      const { ok, status } = await loginWithRetry(page, ACCOUNTS[key]);
      if (!ok) {
        console.log(
          `  (login failed for ${key}${status ? ` - HTTP ${status}${status === 429 ? ' (auth rate limit: 10 logins/min, wait a minute)' : ''}` : ''})`,
        );
        continue;
      }
      if (loginOnly) {
        await shot(page, `login-${key}${vp.name}`);
        continue;
      }
      await visit(page, ROLES[key], vp.name);

      if (key === 'student') {
        const token = await page.evaluate(() => {
          try {
            const raw = localStorage.getItem('sanro-auth');
            const j = raw ? JSON.parse(raw) : null;
            return j?.state?.token ?? j?.token ?? null;
          } catch {
            return null;
          }
        });
        if (token) {
          const ids = await liveIds(token);
          const captureConcept = async (conceptId: string, label: string, index: number) => {
            await page.goto(`${WEB}/app/learn/concepts/${conceptId}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
            await settle(page);
            await shot(page, `${index}-concept-${label}${vp.name}`);
            if (!wantTabs) return;
            // the mode switcher sets role="tab" explicitly, which overrides the
            // implicit button role - look for a tab first, fall back to a button
            for (const tab of ['Practice']) {
              const asTab = page.getByRole('tab', { name: tab }).first();
              const asButton = page.getByRole('button', { name: tab }).first();
              const target = (await asTab.count().catch(() => 0)) ? asTab : asButton;
              if (await target.count().catch(() => 0)) {
                await target.click().catch(() => {});
                await settle(page);
                await shot(page, `${index + 1}-tab-${tab.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}${label === 'ar' ? '-ar' : ''}${vp.name}`);
              }
            }
            // the 3D viewer is opened from the Learn tab, not from a mode of its own
            const open3d = page.getByRole('button', { name: /Open the 3D viewer/i }).first();
            if (await open3d.count().catch(() => 0)) {
              await open3d.click().catch(() => {});
              await settle(page);
              await shot(page, `${index + 2}-viewer${label === 'ar' ? '-ar' : ''}${vp.name}`);
              await page.keyboard.press('Escape').catch(() => {});
              await page.waitForTimeout(800);
            }
          };
          if (ids.conceptId) await captureConcept(ids.conceptId, 'detail', 30);
          // the AR / 3D mode only exists for concepts that own a 3D model
          if (ids.arConceptId) await captureConcept(ids.arConceptId, 'ar', 40);
          if (ids.itemId) {
            await page.goto(`${WEB}/app/library/item/${ids.itemId}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
            await settle(page);
            await shot(page, `50-library-item${vp.name}`);
          }
        }
      }
    }
  }
  await ctx.close();
}

await browser.close();
console.log(`\nscreenshots written to ${dir}`);
