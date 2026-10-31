// Ensures the generated Prisma client matches the schema before the API test suite runs.
//
// Why not just `prisma generate`: on Windows the query-engine DLL is locked while a
// dev server is running, so a blind generate fails with EPERM even though the client is
// already correct. This script only regenerates when the client is actually stale
// (e.g. after a dependency re-resolution moved the client to a new path).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(here, '..');
const require = createRequire(path.join(apiRoot, 'package.json'));

const MARKER = 'model XpEvent';

function generatedClientDir() {
  try {
    const entry = require.resolve('@prisma/client');
    return path.resolve(path.dirname(entry), '..', '..', '.prisma', 'client');
  } catch {
    return null;
  }
}

function clientIsCurrent() {
  const dir = generatedClientDir();
  if (!dir) return false;
  const schema = path.join(dir, 'schema.prisma');
  if (!fs.existsSync(schema)) return false;
  try {
    return fs.readFileSync(schema, 'utf8').includes(MARKER);
  } catch {
    return false;
  }
}

if (clientIsCurrent()) {
  console.log('[prisma-client] generated client is current - skipping generate');
  process.exit(0);
}

console.log('[prisma-client] generated client is stale or missing - running prisma generate');
try {
  execFileSync('npx', ['prisma', 'generate'], { cwd: apiRoot, stdio: 'inherit' });
} catch (err) {
  // A running dev server can hold the engine DLL; the client may still be fine.
  if (clientIsCurrent()) {
    console.log('[prisma-client] generate was blocked (engine locked) but the client is current - continuing');
    process.exit(0);
  }
  console.error('[prisma-client] could not generate the Prisma client. Stop any running API dev server and retry.');
  process.exit(1);
}
console.log('[prisma-client] client generated');
