// One-off generator for routes-for-sweep.txt (a working artifact consumed by
// scripts/qa/sweep-authz.mjs). Extracts GET routes by composing each controller's
// @Controller('base') with its @Get() / @Get('sub') literal paths. Read-only: only
// reads controller sources. Output paths have NO api/v1 prefix (BASE already has it).
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

const SRC = join(process.cwd(), 'apps', 'api', 'src');
const OUT = join(SRC, 'routes-for-sweep.txt');

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (e.endsWith('.controller.ts')) out.push(p);
  }
  return out;
}

const files = walk(SRC);
const lines = [];
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const cm = src.match(/@Controller\(\s*['"`]([^'"`]*)['"`]\s*\)/);
  const base = cm ? cm[1].replace(/^\/+|\/+$/g, '') : '';
  // Find every @Get(...) and capture an optional literal string arg.
  const getRe = /@Get\(\s*(['"`])([^'"`]*)\1\s*\)/g;
  let m;
  const seen = new Set();
  // Handle bare @Get() (no args) as well.
  const bareRe = /@Get\(\s*\)/g;
  const pushRoute = (sub) => {
    const s = (sub || '').replace(/^\/+|\/+$/g, '');
    let full;
    if (base && s) full = `/${base}/${s}`;
    else if (base) full = `/${base}`;
    else if (s) full = `/${s}`;
    else full = '/';
    if (!seen.has(full)) {
      seen.add(full);
      lines.push(`GET '${full}'`);
    }
  };
  while ((m = getRe.exec(src))) pushRoute(m[2]);
  let b;
  while ((b = bareRe.exec(src))) pushRoute('');
}
lines.sort();
writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');
console.log(`wrote ${lines.length} GET routes -> ${OUT}`);
