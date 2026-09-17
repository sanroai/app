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
- `npx tsx scripts/screenshots.mts` — page capture QA

## 3. Critical E2E Journeys

- Student: login → Home → Learn → Concept → Video/Notes → Practice → Assess →
  Result → Diagnosis → Fix → Retest → Improvement
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