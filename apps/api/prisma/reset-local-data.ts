/**
 * SANRO AI — LOCAL-ONLY DATA RESET
 *
 * Development-only script. Empties the local database of all
 * academic / customer / demo data while preserving platform configuration
 * and the migration history.
 *
 *   pnpm reset-local-data
 *   pnpm --filter @sanro/api reset:local-data
 *
 * Requires: LOCAL_RESET_CONFIRMATION=reset-my-local-sanro-data
 *
 * This script REFUSES to run unless every safety guard passes.
 * It never touches schema, migrations, or any non-local database.
 */
// env-loader must be imported before @prisma/client so that shell-exported
// environment is observed before Prisma auto-loads apps/api/.env.
import { loadApiEnv, parseTarget, isLocalHost } from './env-loader';
import { seedSystem } from './seed-system';

import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

loadApiEnv();

const CONFIRMATION_VALUE = 'reset-my-local-sanro-data';
const CONFIRMATION_KEY = 'LOCAL_RESET_CONFIRMATION';

/** Platform configuration that must survive the reset. */
const PRESERVE_TABLES = ['_prisma_migrations', 'Plan', 'Achievement', 'Institution', 'User'];

/** Database names this script is allowed to empty. */
const LOCAL_DB_ALLOWLIST = ['sanro_dev'];

/** Host fragments that always mean "stop, this is not a dev box". */
const FORBIDDEN_HOST_PATTERNS = [
  'railway',
  'neon',
  'supabase',
  'amazonaws',
  'rds',
  'azure',
  'cloudflare',
  'heroku',
  'render.com',
  'digitalocean',
  'sanroai.com',
  'pg.',
  'db.',
];

/** Database names that always mean "stop". */
const FORBIDDEN_DB_PATTERNS = ['prod', 'production', 'live', 'staging', 'customer', 'sanroai'];

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

const BACKUP_DIR = resolve(__dirname, '..', '..', '..', 'backups', 'pre-reset');
const BACKUP_MAX_AGE_MS = 60 * 60 * 1000;

type GuardFailure = { guard: string; detail: string };

const failures: GuardFailure[] = [];
const fail = (guard: string, detail: string): void => {
  failures.push({ guard, detail });
};

function assertLocal(): void {
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  if (nodeEnv === 'production' || nodeEnv === 'prod') {
    fail('NODE_ENV', `NODE_ENV="${process.env.NODE_ENV}" — refusing to run in production mode.`);
  }

  const raw = process.env.DATABASE_URL || '';
  if (!raw) {
    fail('DATABASE_URL', 'DATABASE_URL is not set and apps/api/.env could not be read.');
    return;
  }

  const target = parseTarget(raw);
  if (!target) {
    fail('DATABASE_URL', 'DATABASE_URL could not be parsed as a PostgreSQL connection string.');
    return;
  }

  if (!isLocalHost(target.host)) {
    fail('db-host', `Database host "${target.host}" is not a local address.`);
  }
  for (const p of FORBIDDEN_HOST_PATTERNS) {
    if (target.host.toLowerCase().includes(p)) {
      fail('db-host-pattern', `Database host "${target.host}" matches forbidden pattern "${p}".`);
    }
  }
  if (!LOCAL_DB_ALLOWLIST.includes(target.database)) {
    fail('db-name-allowlist', `Database "${target.database}" is not in the local allowlist [${LOCAL_DB_ALLOWLIST.join(', ')}].`);
  }
  for (const p of FORBIDDEN_DB_PATTERNS) {
    if (target.database.toLowerCase().includes(p)) {
      fail('db-name-pattern', `Database name "${target.database}" matches forbidden pattern "${p}".`);
    }
  }

  const storage = (process.env.STORAGE_TYPE || 'local').toLowerCase();
  if (storage !== 'local') {
    fail('storage', `STORAGE_TYPE="${storage}" — refusing to run against a shared/remote storage bucket.`);
  }
  for (const key of ['STORAGE_URL', 'STORAGE_BUCKET']) {
    const v = process.env[key] || '';
    if (v && /r2\.cloudflarestorage|storage\.googleapis|amazonaws|s3\./i.test(v)) {
      fail('storage-endpoint', `${key} points at a remote/cloud endpoint.`);
    }
  }

  const confirmation = process.env[CONFIRMATION_KEY];
  if (confirmation !== CONFIRMATION_VALUE) {
    fail(
      'confirmation',
      `${CONFIRMATION_KEY} is not set to "${CONFIRMATION_VALUE}". Refusing to delete anything.`,
    );
  }
}

function findPgTool(name: string): string | null {
  const candidates: string[] = [];
  if (process.platform === 'win32') {
    for (const major of [18, 17, 16, 15, 14, 13]) {
      candidates.push(`C:\\Program Files\\PostgreSQL\\${major}\\bin\\${name}.exe`);
    }
  }
  const fromPath = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], { encoding: 'utf8' });
  if (fromPath.status === 0 && fromPath.stdout) {
    const first = fromPath.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)[0];
    if (first) candidates.push(first);
  }
  for (const c of candidates) if (existsSync(c)) return c;
  return null;
}

function newestBackup(): { path: string; ageMs: number } | null {
  if (!existsSync(BACKUP_DIR)) return null;
  const files = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('sanroai-local-pre-reset-') && f.endsWith('.sql'))
    .map((f) => join(BACKUP_DIR, f));
  if (!files.length) return null;
  const path = files.map((f) => ({ path: f, mtime: statSync(f).mtimeMs })).sort((a, b) => b.mtime - a.mtime)[0];
  return { path: path.path, ageMs: Date.now() - path.mtime };
}

function ensureBackup(): { path: string; created: boolean } {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const existing = newestBackup();
  if (existing && existing.ageMs <= BACKUP_MAX_AGE_MS) {
    return { path: existing.path, created: false };
  }

  const pgDump = findPgTool('pg_dump');
  if (!pgDump) {
    throw new Error(
      'No pre-reset backup found within the last 60 minutes and pg_dump could not be located. Aborting.',
    );
  }

  const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const out = join(BACKUP_DIR, `sanroai-local-pre-reset-${ts}.sql`);
  const res = spawnSync(pgDump, ['-f', out, process.env.DATABASE_URL as string], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`pg_dump failed (exit ${res.status}): ${res.stderr || res.stderr || 'unknown error'}`);
  }
  if (!existsSync(out) || statSync(out).size <= 0) {
    throw new Error('Backup file was not created or is empty. Aborting.');
  }
  const content = readFileSync(out, 'utf8');
  if (!content.includes('PostgreSQL database dump') || !content.includes('CREATE TABLE public.')) {
    throw new Error('Backup file failed content validation. Aborting.');
  }
  return { path: out, created: true };
}

function quote(name: string): string {
  if (!IDENTIFIER.test(name)) {
    throw new Error(`Refusing to build SQL for unsafe identifier: ${JSON.stringify(name)}`);
  }
  return `"${name}"`;
}

async function main(): Promise<void> {
  console.log('========================================================');
  console.log(' SANRO AI — LOCAL DATA RESET (development only)');
  console.log('========================================================');

  // ---- Guard phase -------------------------------------------------------
  assertLocal();

  const target = parseTarget(process.env.DATABASE_URL || '');
  if (target) {
    console.log(` target host     : ${target.host}:${target.port}`);
    console.log(` target database : ${target.database}`);
    console.log(` target source   : ${target.source}`);
    console.log(` NODE_ENV        : ${process.env.NODE_ENV || '(unset)'}`);
    console.log(` STORAGE_TYPE    : ${process.env.STORAGE_TYPE || 'local (default)'}`);
  }

  if (failures.length) {
    console.error('\nSAFETY GUARDS FAILED — no changes were made:\n');
    for (const f of failures) console.error(`  [${f.guard}] ${f.detail}`);
    console.error('\nAborting.');
    process.exit(1);
  }

  console.log('\nAll safety guards passed.');

  // ---- Backup phase ------------------------------------------------------
  const backup = ensureBackup();
  console.log(`\nBackup ${backup.created ? 'created' : 'reused'}: ${backup.path}`);

  // ---- Inventory (pre-reset) --------------------------------------------
  const prisma = new PrismaClient();
  try {
    const identity = await prisma.$queryRawUnsafe<Array<{ db: string; addr: string | null }>>(
      'SELECT current_database() AS db, host(inet_server_addr()) AS addr',
    );
    const live = identity[0];
    if (!live || live.db !== target?.database) {
      throw new Error(`Connected database "${live?.db}" does not match expected "${target?.database}". Aborting.`);
    }
    if (live.addr && !['127.0.0.1', '::1', 'localhost'].includes(live.addr)) {
      throw new Error(`Server address "${live.addr}" is not loopback. Aborting.`);
    }
    console.log(`Verified live connection: ${live.db} @ ${live.addr}`);

    const pre = await collectCounts(prisma);
    console.log('\nPre-reset non-empty tables:');
    for (const [t, c] of Object.entries(pre).sort((a, b) => b[1] - a[1])) {
      if (c > 0) console.log(`  ${t.padEnd(28)} ${c}`);
    }

    // ---- Deletion phase --------------------------------------------------
    const tableRows = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`,
    );
    const allTables = tableRows.map((r) => r.table_name).filter((t) => IDENTIFIER.test(t));

    for (const p of PRESERVE_TABLES) {
      if (!allTables.includes(p)) throw new Error(`Expected table "${p}" is missing — schema mismatch. Aborting.`);
    }

    const truncateTables = allTables.filter((t) => !PRESERVE_TABLES.includes(t));
    if (truncateTables.length < 40) {
      throw new Error(`Only ${truncateTables.length} tables selected for truncation — refusing (schema mismatch).`);
    }

    console.log(`\nTruncating ${truncateTables.length} tables (preserving: ${PRESERVE_TABLES.join(', ')})...`);

    await prisma.$transaction(
      async (tx) => {
        const truncateSql = `TRUNCATE TABLE ${truncateTables.map(quote).join(', ')} RESTART IDENTITY CASCADE`;
        await tx.$executeRawUnsafe(truncateSql);

        // Preserve the SANRO AI system institution; drop every other tenant.
        await tx.$executeRawUnsafe(
          `DELETE FROM ${quote('Institution')} WHERE ${quote('isSystemInstitution')} = false`,
        );

        // Any creator that will not survive must not remain referenced.
        await tx.$executeRawUnsafe(
          `UPDATE ${quote('Institution')} SET ${quote('createdById')} = NULL ` +
            `WHERE ${quote('createdById')} IS NOT NULL ` +
            `AND ${quote('createdById')} NOT IN (SELECT ${quote('id')} FROM ${quote('User')} WHERE ${quote('isSuperAdmin')} = true)`,
        );

        // Preserve super admins only (the bootstrap account).
        await tx.$executeRawUnsafe(`DELETE FROM ${quote('User')} WHERE ${quote('isSuperAdmin')} = false`);
      },
      { timeout: 120_000, maxWait: 30_000 },
    );

    console.log('Deletion transaction committed.');

    // ---- Rebuild minimum system records ---------------------------------
    const sys = await seedSystem(prisma);
    console.log(
      `System seed: plans=${sys.plans} achievements=${sys.achievements} systemInstitution=${sys.systemInstitution ?? 'ok'} superAdmin=${sys.superAdmin ?? 'missing'}`,
    );
    for (const w of sys.warnings) console.warn(`  WARNING: ${w}`);

    // ---- Verification phase ---------------------------------------------
    const post = await collectCounts(prisma);
    const violations: Array<{ table: string; count: number; reason: string }> = [];

    for (const [table, count] of Object.entries(post)) {
      if (PRESERVE_TABLES.includes(table)) continue;
      if (count > 0) violations.push({ table, count, reason: 'resettable table is not empty' });
    }

    const systemInst = post['Institution'] ?? 0;
    const nonSystem = await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
      `SELECT count(*) AS c FROM ${quote('Institution')} WHERE ${quote('isSystemInstitution')} = false`,
    );
    if (Number(nonSystem[0]?.c ?? 0) > 0) {
      violations.push({ table: 'Institution (non-system)', count: Number(nonSystem[0].c), reason: 'tenant rows remain' });
    }

    const nonSuper = await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
      `SELECT count(*) AS c FROM ${quote('User')} WHERE ${quote('isSuperAdmin')} = false`,
    );
    if (Number(nonSuper[0]?.c ?? 0) > 0) {
      violations.push({ table: 'User (non-super-admin)', count: Number(nonSuper[0].c), reason: 'demo/test users remain' });
    }

    const migrations = await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
      `SELECT count(*) AS c FROM ${quote('_prisma_migrations')}`,
    );
    if (Number(migrations[0]?.c ?? 0) === 0) {
      violations.push({ table: '_prisma_migrations', count: 0, reason: 'migration history missing' });
    }

    console.log('\nPost-reset counts:');
    for (const [t, c] of Object.entries(post).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${t.padEnd(28)} ${c}`);
    }

    const report = {
      executedAt: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: target?.database,
      host: target?.host,
      backup,
      preResetCounts: pre,
      postResetCounts: post,
      preservedTables: PRESERVE_TABLES,
      systemSeed: {
        plans: sys.plans,
        achievements: sys.achievements,
        systemInstitution: sys.systemInstitution,
        superAdmin: sys.superAdmin,
      },
      violations,
      verdict: violations.length === 0 ? 'CLEAN' : 'INCOMPLETE',
    };
    const reportPath = join(BACKUP_DIR, `reset-report-${new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16)}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\nReset report: ${reportPath}`);

    if (violations.length) {
      console.error('\nRESET INCOMPLETE — resettable data remains:');
      for (const v of violations) console.error(`  ${v.table}: ${v.count} (${v.reason})`);
      process.exit(2);
    }

    console.log('\nRESET COMPLETE — local database is clean.');
    console.log('LOCAL RESET ONLY — target was verified as loopback/local.');
  } finally {
    await prisma.$disconnect();
  }
}

async function collectCounts(prisma: PrismaClient): Promise<Record<string, number>> {
  const rows = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`,
  );
  const out: Record<string, number> = {};
  for (const r of rows) {
    if (!IDENTIFIER.test(r.table_name)) continue;
    const res = await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
      `SELECT count(*) AS c FROM ${quote(r.table_name)}`,
    );
    out[r.table_name] = Number(res[0]?.c ?? 0);
  }
  return out;
}

main().catch((err) => {
  console.error('\nRESET FAILED — no partial success is claimed.');
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
