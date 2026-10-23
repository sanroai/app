# SANRO AI — QA

## 1. Test Layers

- Unit (Vitest): services, mastery grading, AR validation, auth.
- Integration/API: endpoint contracts, RBAC, tenancy.
- UI/E2E: critical journeys (Playwright web; seed-driven).

## 2. Commands

- `pnpm -r typecheck` — all packages
- `pnpm --filter @sanro/api test` — Vitest suite
- `pnpm --filter @sanro/mobile typecheck`
- `pnpm build` — full turbo build
- `npx tsx scripts/screenshots.mts` — page capture QA (kills :3000/:4000 first)
- `npx tsx scripts/verify-empty-states.mts` — login + verify 18 super-admin
  screens, capture screenshots, fail on console errors / failed API calls
- `npx tsx scripts/verify-roles.mts <student|teacher|parent>` — same checks for
  that role's pages; writes `screenshots/<role>/summary.json`

### 2.1 Content audits (the seeded curriculum)

The content is data, so it needs its own gates. Each script prints a number and
fails when that number is wrong.

- `node scripts/qa/audit-curriculum-coverage.mjs` — every VIDEO lesson has a
  URL, every URL has a lesson, every chapter has a video, no lesson points at
  an unknown chapter.
- `node scripts/qa/audit-video-durations.mjs --min 120` — the real YouTube
  length of every seeded video; rejects clips under two minutes.
- `node scripts/qa/verify-video-liveness.mjs sanro_dev` — every video id is
  alive and embeddable.
- `node scripts/qa/audit-chapter-pdfs.mjs` — every chapter code resolves to an
  NCERT PDF that is on disk (classes 1-7 have no extracted book yet).
- `node scripts/qa/audit-book-alignment.mjs` — every seeded chapter matches the
  book's own chapter title (a different wording is reported, a different
  chapter fails).
- `node scripts/qa/audit-web-mobile-parity.mjs` — a student capability that
  exists on one platform only fails the build.
- `node scripts/qa/prune-stale-lessons.mjs [--apply]` — the database vs the
  seed. A renamed or re-scoped chapter leaves its old lessons behind (the seed
  only upserts); PLATFORM-owned rows that are not in `contentNodes` are listed,
  and deleted with `--apply`. A teacher's own content is never touched.
- `node scripts/qa/audit-question-coverage.mjs` — which chapters can actually be
  practised (a chapter with no question answers 400).
- `node scripts/qa/export-question-outline.mjs` — the chapters with no
  questions plus the exact concept names an authored question must map to
  (`artifacts/qa/<date>/brief-<subject>.md` for the authoring agents).
- `node scripts/qa/validate-question-fragments.mjs --dir artifacts/qa/<date>` —
  checks authored questions against the live curriculum **before** they are
  merged: the chapter exists at that grade, the concept belongs to that chapter,
  an MCQ has four options with exactly one correct and an `answer` equal to that
  option's text, and no text is duplicated.
- `node scripts/qa/merge-question-fragments.mjs --dir artifacts/qa/<date>` —
  merges `questions-*.json` fragments into the seed's question array **and**
  the `QUESTION_CONCEPT` map (the seed throws on an unmapped question), then
  the seed must be re-run; idempotent by question text.
- `node scripts/qa/probe-practice-scoring.mjs [db] [--email student8@sanroai.com]` — starts
  a practice set as a demo student, answers every auto-graded question with the option the
  database marks correct, and asserts the server reports 100 (and 0 when the set has no
  auto-graded questions). Run it for all three grades (`student@` class 10, `student8@`,
  `student9@`) — this is the end-to-end check that a chapter can be practised, not just read.
- `node scripts/qa/probe-chapter-hub.mjs` — the chapter hub contract
  (payload, PDF, practice, 404s).
- `powershell -ExecutionPolicy Bypass -File scripts/qa/verify-release.ps1` —
  all of the above plus typecheck, lint and the three test suites.

## 3. Critical E2E Journeys

- Student: login → Home → Library → Concept → Video/Notes → Practice →
  Assess → Path → Result → Diagnosis → Fix → Retest → Improvement
- Teacher: login → dashboard → create assessment → publish → view results →
  diagnose → remediation
- Parent: login → child → result → weak concepts → improvement
- Principal: login → school → reports
- Super Admin: login → institutions → curriculum → content → questions

## 4. Visual QA Grid

Desktop 1440 / 1280 / 1024; mobile 390 / 430. Check alignment, spacing,
typography, contrast, loading/empty/error/scroll/modal/table/chart/nav states.
Screenshots where practical.

## 5. Edge-Case Audit

Full matrix documented in docs/EDGE_CASES.md. Mandatory categories: AUTH,
TENANCY, STUDENT, ASSESSMENT, CONTENT, AI, IMPORT, PARENT, TEACHER, AR, PDF,
MOBILE.

## 6. State Discipline

Every async screen: loading / empty / error / retry / success. No 0/0 lessons,
fake progress, fake percentages, dead buttons, dead links.

## 7. DoD

Typecheck + tests + build + E2E + visual QA + docs updated before a phase is
closed.