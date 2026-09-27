/**
 * Prepares the isolated QA/test database before the API test suite runs.
 *
 * Why this exists:
 *   The test suite needs a database that is structurally identical to the
 *   dev database — including objects that `prisma db push` cannot express
 *   (partial unique indexes, migration-only triggers/functions). The
 *   "exactly one system institution" guarantee depends on the partial unique
 *   index `Institution_system_institution_singleton`, which is only created
 *   by `prisma migrate deploy`.
 *
 * Steps:
 *   1. Load apps/api/.env and resolve the TEST target (DATABASE_URL_TEST).
 *   2. Refuse to run against anything that is not loopback/local.
 *   3. Run `prisma migrate deploy` against that target (idempotent).
 *
 * Seeding is a separate step (`db:seed:qa`), so the full test entrypoint is:
 *   tsx prisma/prepare-test-db.ts && tsx prisma/seed.ts --qa && vitest run
 *
 * Usage:
 *   pnpm --filter @sanro/api db:test:prepare
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { loadApiEnv, resolveTargetUrl, parseTarget, isLocalHost } from './env-loader';

function fail(step: string, message: string): never {
  console.error(`[prepare-test-db] ${step} failed: ${message}`);
  process.exit(1);
}

function findPrismaCli(): { cmd: string; args: string[]; shell: boolean } {
  try {
    const resolved = require.resolve('prisma/build/index.js');
    if (existsSync(resolved)) {
      return { cmd: process.execPath, args: [resolved, 'migrate', 'deploy'], shell: false };
    }
  } catch {
    // fall through to pnpm exec
  }
  return {
    cmd: 'pnpm',
    args: ['exec', 'prisma', 'migrate', 'deploy'],
    shell: process.platform === 'win32',
  };
}

function main(): void {
  loadApiEnv();

  const url = resolveTargetUrl(true);
  const target = parseTarget(url);

  if (!target) {
    fail('target', 'Could not parse DATABASE_URL_TEST / DATABASE_URL. Set DATABASE_URL_TEST in apps/api/.env.');
  }
  if (!isLocalHost(target.host)) {
    fail('target', `Refusing to migrate non-local host "${target.host}" (database "${target.database}").`);
  }

  console.log('[prepare-test-db] target  :', `${target.host}:${target.port}/${target.database}`);
  console.log('[prepare-test-db] source  :', target.source);

  const cli = findPrismaCli();
  const res = spawnSync(cli.cmd, cli.args, {
    encoding: 'utf8',
    shell: cli.shell,
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: target.url },
  });

  const output = `${res.stdout || ''}${res.stderr || ''}`;
  if (res.status !== 0) {
    console.error(output);
    fail('migrate deploy', `exit ${res.status ?? 'unknown'}`);
  }

  if (output.includes('drift') && !output.includes('No drift')) {
    console.error(output);
    fail('migrate deploy', 'Schema drift detected against migrations. Resolve drift before running tests.');
  }

  console.log('[prepare-test-db] migrations are up to date.');
}

main();
