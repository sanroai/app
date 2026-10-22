// Loads the demo/QA credentials from `apps/api/.env` (git-ignored) so that no
// credential lives in the repository. The API side has the equivalent module at
// `apps/api/src/common/demo-password.ts`.
import fs from 'node:fs';
import path from 'node:path';

function readLocalEnv() {
  const candidates = [
    path.resolve(process.cwd(), 'apps', 'api', '.env'),
    path.resolve(process.cwd(), '.env'),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const values = {};
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (match) values[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
    return values;
  }
  return {};
}

const localEnv = readLocalEnv();
export const QA_PASSWORD =
  process.env.QA_PASSWORD ?? process.env.SEED_DEMO_PASSWORD ?? localEnv.QA_PASSWORD ?? localEnv.SEED_DEMO_PASSWORD;

if (!QA_PASSWORD) {
  throw new Error(
    'Demo/QA password not found. Set QA_PASSWORD (or SEED_DEMO_PASSWORD) in apps/api/.env or the environment.',
  );
}
