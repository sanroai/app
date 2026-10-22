import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV_CANDIDATES = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'apps', 'api', '.env'),
  resolve(__dirname, '..', '.env'),
];

let loaded = false;

/**
 * Fills process.env from apps/api/.env for any key that is not already set
 * (matches Prisma CLI behaviour: real environment always wins).
 */
export function loadApiEnv(): void {
  if (loaded) return;
  loaded = true;
  for (const path of ENV_CANDIDATES) {
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      if (typeof process.env[m[1]] === 'undefined') {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  }
}

export type DbTarget = {
  url: string;
  host: string;
  port: string;
  database: string;
  user: string;
  source: 'process.env' | 'apps/api/.env' | 'default';
};

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/** Captured before any .env file is loaded, so provenance reporting stays honest. */
const DATABASE_URL_FROM_PROCESS = typeof process.env.DATABASE_URL !== 'undefined';

/** Strict, explicit parse of a Postgres connection string. */
export function parseTarget(url: string): DbTarget | null {
  const m = url.match(/^(?:postgres|postgresql):\/\/([^:/?#]+):(?:[^@]*)@([^:/?#]+)(?::(\d+))?\/([^?#]+)/);
  if (!m) return null;
  return {
    url,
    user: decodeURIComponent(m[1]),
    host: m[2],
    port: m[3] || '5432',
    database: decodeURIComponent(m[4]),
    source: DATABASE_URL_FROM_PROCESS ? 'process.env' : 'apps/api/.env',
  };
}

export function isLocalHost(host: string): boolean {
  return LOCAL_HOSTS.has(host.toLowerCase());
}

/**
 * Resolves the database the seed/reset should act on.
 * `preferTest` routes to DATABASE_URL_TEST (used by db:seed:qa).
 */
export function resolveTargetUrl(preferTest = false): string {
  loadApiEnv();
  if (preferTest && process.env.DATABASE_URL_TEST) return process.env.DATABASE_URL_TEST;
  return process.env.SEED_DATABASE_URL || process.env.DATABASE_URL || '';
}
