import { loadApiEnv } from './api-env';

loadApiEnv();

/**
 * Password used for the seeded demo / QA accounts.
 *
 * It is never hard-coded: it is read from `SEED_DEMO_PASSWORD` (or `QA_PASSWORD`),
 * which lives in `apps/api/.env` (git-ignored) or the process environment.
 * The same loader the seed scripts use (src/common/api-env.ts) fills it in.
 */
const fromEnv = process.env.SEED_DEMO_PASSWORD ?? process.env.QA_PASSWORD;

if (!fromEnv) {
  throw new Error(
    'SEED_DEMO_PASSWORD is not set. Add it to apps/api/.env (git-ignored) or the environment; ' +
      'the demo/QA password is never stored in the repository.',
  );
}

export const DEMO_PASSWORD = fromEnv;
