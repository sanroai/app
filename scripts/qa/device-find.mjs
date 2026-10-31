/**
 * Finds text on the connected Android device and prints each match's tap point.
 *
 * Tapping by eye is unreliable: screenshots are scaled for viewing while
 * `adb shell input tap` takes device pixels, so the same row lands under a
 * different coordinate in the two. This dumps the accessibility tree and prints
 * the real bounds.
 *
 *   node scripts/qa/device-find.mjs "Read the textbook"
 *   node scripts/qa/device-find.mjs "Practice|Ask SANRO" --tap "Practice the whole"
 *
 * Matches are listed with `x,y` ready for `adb shell input tap x y`; with `--tap`
 * the first match of that pattern is tapped directly.
 */
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const tapIndex = args.indexOf('--tap');
const tapPattern = tapIndex >= 0 ? args[tapIndex + 1] : null;
const skip = new Set(tapIndex >= 0 ? [tapIndex, tapIndex + 1] : []);
const patterns = args.filter((_, index) => !skip.has(index));

function adb(...argv) {
  return execFileSync('adb', argv, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

adb('shell', 'uiautomator', 'dump', '/sdcard/ui.xml');
const xml = adb('shell', 'cat', '/sdcard/ui.xml');

const nodes = [...xml.matchAll(/text="([^"]*)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g)].map(
  ([, text, x1, y1, x2, y2]) => ({
    text,
    x: Math.round((Number(x1) + Number(x2)) / 2),
    y: Math.round((Number(y1) + Number(y2)) / 2),
  }),
);

const match = (pattern) => nodes.filter((node) => new RegExp(pattern, 'i').test(node.text));

if (!patterns.length) {
  for (const node of nodes) console.log(`  ${node.x},${node.y}  ${node.text}`);
  process.exit(0);
}

let found = 0;
for (const pattern of patterns) {
  for (const node of match(pattern)) {
    console.log(`  ${node.x},${node.y}  ${node.text.slice(0, 70)}`);
    found += 1;
  }
}

if (!found) {
  console.log(`  (no node matched ${patterns.join(' | ')})`);
  process.exit(1);
}

if (tapPattern) {
  const target = match(tapPattern)[0];
  if (!target) {
    console.log(`  (nothing to tap for ${tapPattern})`);
    process.exit(1);
  }
  adb('shell', 'input', 'tap', String(target.x), String(target.y));
  console.log(`  tapped ${target.x},${target.y}  ${target.text.slice(0, 70)}`);
}
