// Web <-> mobile parity sweep.
//
// The product rule: every student-facing capability exists on both platforms.
// This script compares the two route trees against the feature map and fails when a
// student capability exists on one side only (authoring/admin screens are web-only
// by design and are listed as accepted differences).
//
//   node scripts/qa/audit-web-mobile-parity.mjs
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const WEB_ROOT = 'apps/web/app/(dashboard)/app';
const MOBILE_ROOT = 'apps/mobile/app';

/** capability -> [web route, mobile route] (null = the platform does not have it) */
const FEATURES = [
  ['home', 'page.tsx', '(tabs)/index.tsx'],
  ['library browse', 'library/page.tsx', '(tabs)/learn.tsx'],
  ['library subjects', 'library/subjects/page.tsx', 'learn/[boardId]/[grade]/[subjectId].tsx'],
  ['library item', 'library/item/[contentId]/page.tsx', 'concept/[conceptId].tsx'],
  ['chapter list', 'learn/[boardId]/[grade]/[subjectId]/chapters/page.tsx', 'learn/[boardId]/[grade]/[subjectId].tsx'],
  ['chapter hub', 'learn/chapters/[chapterId]/page.tsx', 'learn/chapter/[chapterId].tsx'],
  // the rendered NCERT pages open in the web chapter-hub dialog and on the mobile
  // screen below - the same pages, a different container
  ['chapter textbook', 'learn/chapters/[chapterId]/page.tsx', 'textbook/[chapterId].tsx'],
  ['concept', 'learn/concepts/[conceptId]/page.tsx', 'concept/[conceptId].tsx'],
  ['practice session', 'learn/practice/[practiceId]/page.tsx', 'practice/[practiceId].tsx'],
  // Flashcards were cut on both platforms (2026-10-30): `/flashcards/:id` is a
  // redirect to the concept page's Practice tab on web and mobile alike, so it is
  // no longer a capability to audit.
  ['assessment list', 'assessments/page.tsx', '(tabs)/assessments.tsx'],
  ['learning path', 'assessments/page.tsx', '(tabs)/tests.tsx'],
  ['assessment attempt', 'assessments/attempt/[attemptId]/page.tsx', 'attempt/[attemptId].tsx'],
  ['remediation', 'remediation/page.tsx', 'remediation.tsx'],
  ['reports', 'reports/page.tsx', '(tabs)/me.tsx'],
  ['gamification', 'gamification/page.tsx', '(tabs)/me.tsx'],
  ['achievements', 'gamification/achievements/page.tsx', '(tabs)/me.tsx'],
  ['leaderboard', 'gamification/leaderboard/page.tsx', 'leaderboard.tsx'],
  ['ai chat', 'chat/page.tsx', 'ask/[conceptId].tsx'],
  ['profile', 'profile/page.tsx', '(tabs)/me.tsx'],
  ['profile edit', 'profile/page.tsx', 'profile-edit.tsx'],
  ['children (parent)', 'children/page.tsx', '(tabs)/children.tsx'],
  ['classes (teacher)', 'students/page.tsx', '(tabs)/classes.tsx'],
];

/** capabilities that are web-only by design (authoring + administration) */
const WEB_ONLY_BY_DESIGN = [
  'papers', 'papers/new', 'papers/[id]', 'questions', 'questions/new', 'curriculum',
  'curriculum/access', 'curriculum/import', 'curriculum/nodes', 'import', 'institutions',
  'institutions/[id]', 'content/videos', 'content/ingest', 'content-processing', 'ar',
  'people/students', 'people/teachers', 'people/parents', 'people/students/[id]',
  'people/teachers/[id]', 'people/parents/[id]', 'students', 'students/[id]', 'students/new',
  'teachers', 'teachers/[id]', 'teachers/new', 'parents', 'parents/new', 'assessments/new',
  'assessments/[id]/manage', 'settings', 'account-blocked',
];

function walk(dir, out = [], depth = 0) {
  if (!existsSync(dir) || depth > 6) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
      walk(p, out, depth + 1);
    } else if (entry.name.endsWith('.tsx')) {
      out.push(p.replace(/\\/g, '/'));
    }
  }
  return out;
}

const webFiles = walk(WEB_ROOT);
const mobileFiles = walk(MOBILE_ROOT);

const webHas = (rel) => webFiles.some((f) => f.endsWith(`/${rel}`) || f.endsWith(`/${rel}.tsx`));
const mobileHas = (rel) => mobileFiles.some((f) => f.endsWith(`/${rel}`) || f.endsWith(`/${rel}.tsx`));

let pass = 0;
const gaps = [];

console.log('=== WEB <-> MOBILE PARITY SWEEP ===\n');
for (const [capability, web, mobile] of FEATURES) {
  const w = web ? webHas(web) : false;
  const m = mobile ? mobileHas(mobile) : false;
  if (w && m) {
    pass++;
    console.log(`  PASS  ${capability.padEnd(22)} web + mobile`);
  } else if (!w && !m) {
    gaps.push(`${capability}: missing on BOTH platforms`);
    console.log(`  MISS  ${capability.padEnd(22)} missing on both platforms`);
  } else {
    gaps.push(`${capability}: ${w ? 'only on web' : 'only on mobile'}`);
    console.log(`  GAP   ${capability.padEnd(22)} ${w ? 'only on web' : 'only on mobile'}`);
  }
}

// web-only surfaces that are fine by design (reported, not failed)
/** a web route that is the same destination under a different name */
const WEB_ALIASES = {
  'learn/[boardId]/[grade]/[subjectId]/chapters': 'learn/[boardId]/[grade]/[subjectId]',
};

const mappedWebRoutes = new Set(
  FEATURES.map(([, web]) => (web ? web.replace(/\.tsx$/, '').replace(/\/page$/, '') : '')).filter(Boolean),
);
const unexpectedWebOnly = [];
for (const file of webFiles) {
  const rel = file.replace(`${WEB_ROOT}/`, '').replace(/\.tsx$/, '').replace(/\/(page|index)$/, '');
  const isByDesign = WEB_ONLY_BY_DESIGN.some((d) => rel === d || rel.startsWith(`${d}/`));
  const alias = WEB_ALIASES[rel];
  const mapped = [...mappedWebRoutes].some((m) => rel === m || rel.startsWith(`${m}/`) || (alias && alias.startsWith(rel)));
  if (!isByDesign && !mapped) {
    unexpectedWebOnly.push(rel);
  }
}

console.log(`\n  capabilities in sync : ${pass}/${FEATURES.length}`);
console.log(`  web-only by design   : ${WEB_ONLY_BY_DESIGN.length} route groups (authoring + administration)`);
if (unexpectedWebOnly.length) {
  console.log('  web routes not in the feature map:');
  for (const r of unexpectedWebOnly.slice(0, 12)) console.log(`     - ${r}`);
}

if (gaps.length) {
  console.log('\n  GAPS:');
  for (const g of gaps) console.log(`     - ${g}`);
  console.log(`\n=== PARITY: FAIL (${gaps.length} gap(s)) ===`);
  process.exit(1);
}
console.log('\n=== PARITY: PASS ===');
