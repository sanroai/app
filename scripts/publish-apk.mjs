/**
 * Publishes a single current APK to the stable download path
 * `apps/web/public/downloads/sanroai.apk` (served at /downloads/sanroai.apk).
 *
 * Usage:
 *   node scripts/publish-apk.mjs <path-to.apk-or-url>
 *     e.g. node scripts/publish-apk.mjs ./downloads/sanroai-build.apk
 *
 * Guarantees:
 *  - Only one APK is ever present; it is overwritten in place.
 *  - The file is validated (non-empty, ZIP/APK magic bytes, >= 5 MB) before
 *    replacing the current release. The old file is never deleted until the
 *    new one is verified.
 */
import { copyFile, mkdir, open, rm, rename, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEST = resolve(ROOT, 'apps/web/public/downloads/sanroai.apk');
const TMP = `${DEST}.tmp`;
const MIN_APK_BYTES = 5 * 1024 * 1024; // 5 MB
const MAGICS = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
  [0x50, 0x4b, 0x07, 0x08],
];

async function assertValidApk(path) {
  const { size } = await stat(path);
  if (size < MIN_APK_BYTES) {
    throw new Error(`Rejected: ${size} bytes (< ${MIN_APK_BYTES}) — not a release APK.`);
  }
  const fd = await open(path, 'r');
  const head = Buffer.alloc(4);
  try {
    await fd.read(head, 0, 4, 0);
  } finally {
    await fd.close();
  }
  const ok = MAGICS.some((m) => m.every((b, i) => b === head[i]));
  if (!ok) throw new Error(`Rejected: not a ZIP/APK (magic ${[...head]})`);
  console.log(`Validated: ${(size / 1024 / 1024).toFixed(1)} MB, ZIP/APK magic OK`);
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status} for ${url}`);
  await copyFileFromBuffer(Buffer.from(await res.arrayBuffer()), dest);
}

async function copyFileFromBuffer(buf, dest) {
  const fh = await open(dest, 'w');
  try {
    await fh.writeFile(buf);
  } finally {
    await fh.close();
  }
}

const source = process.argv[2];
if (!source) {
  console.error('Usage: node scripts/publish-apk.mjs <path-to.apk-or-url>');
  process.exit(1);
}

await mkdir(dirname(TMP), { recursive: true });

try {
  if (/^https?:\/\//.test(source)) {
    console.log(`Downloading ${source} ...`);
    await download(source, TMP);
  } else {
    const srcPath = resolve(source);
    const st = await stat(srcPath).catch(() => null);
    if (!st) throw new Error(`Source not found: ${srcPath}`);
    await rm(TMP, { force: true });
    if (st.isDirectory()) throw new Error(`Source is a directory: ${srcPath}`);
    await copyFile(srcPath, TMP);
  }

  await assertValidApk(TMP);

  // Only now replace the live file (never delete the current release first).
  await rename(TMP, DEST);
  const { size } = await stat(DEST);
  console.log(`Published ${DEST}`);
  console.log(`Size: ${(size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Stable URL: https://sanroai.com/downloads/sanroai.apk`);
} catch (err) {
  await rm(TMP, { force: true }).catch(() => {});
  console.error(err.message);
  process.exit(1);
}