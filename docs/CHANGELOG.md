# SANRO AI — Changelog

Format: date — phase — change.

## 2026-09-17 — Production deploy completed
- **Web LIVE on `sanroai.com` + `app.sanroai.com`** (Vercel `--prod`, aliased
  sanroai.com): new build includes the `/api/contact` proxy, fixed parents page,
  full dashboard. Verified: proxy marker route returns 400 (new build), homepage 200.
- **Contact flow verified end-to-end on prod**: web proxy → `api.sanroai.com/site/
  contact` → DB row → `GET /admin/leads`. One smoke-test lead created (row
  `d6aca534-…`, "Smoke Test / smoke@sanroai.test`) — delete from admin dashboard
  when convenient.
- **Android APK rebuilt + published**: EAS preview build `751b46a1` FINISHED.
  Bundle audited: contains `https://api.sanroai.com/api/v1`, **no localhost**.
  New `sanroai.apk` (78,061,486 B) served at `https://sanroai.com/downloads/sanroai.apk`
  (HEAD verified). Commits `0bbf1fd` (+ `.railwayignore`).
- Removed stray empty root `app.json` created during EAS CLI work.

## 2026-09-17 — Deployment
- Commit `34c3523` pushed to origin/master.
- **API live**: Railway deploy `23b7042f` Online. Verified prod: health + DB ok,
  Reports API (improvement/class/student/concept-performance) with seed data,
  `admin/leads` (contact_leads migration applied), `site/contact` 400 on invalid,
  Helmet headers active. `.railwayignore` added (excludes 78 MB web APK from upload).
- **WEB BLOCKED**: `app.sanroai.com` still pre-rebuild — `/api/contact` 404. Needs
  `vercel login` or `VERCEL_TOKEN` (CLI has no local credentials; no git auto-deploy).
- **APK BLOCKED**: EAS session (`harishpanditkar`) lacks access to the `sanroai`
  project `eb098800-6294-4a77-ae94-fe34128a8364`. Needs `eas login` with sanroai owner
  account or `EXPO_TOKEN`. eas.json already injects prod API URL on all profiles.

## 2026-09-17 — Durable queue + security + mobile + deploy prep
- Queue: `JobQueueService` now restores `PENDING`/`PROCESSING` jobs from the DB at
  bootstrap (crash-safe; PROCESSING reset to PENDING). Proven live: restart
  resumed + completed a persisted job.
- Security: added **Helmet** (security headers verified) + **compression** (gzip)
  to the API. Audit confirmed CORS/JWT/RBAC/rate-limit/validation/multer-10MB/
  swagger-gating all correct; no committed secrets. Root `pnpm.onlyBuiltDependencies`
  removed (pnpm v12 ignores it; workspace yaml covers it).
- Mobile: default API base `http://localhost:4000` → `https://api.sanroai.com/api/v1`
  (matches eas.json env on all build profiles). Full Phase 20 verification: typecheck
  clean, routes + 6 concept modes on real API, no hardcoded mocks.
- Tests: new `csv.spec.ts` → API suites now 49/49.

## 2026-09-17 — Reports + CI + seed
- Reports: new tenant-scoped `apps/api/src/reports/` module (class, student, assessment, improvement, concept-performance reports) with RFC 4180 CSV export via `x-export-format: csv`. Verified live for TEACHER / INSTITUTION_ADMIN / SUPER_ADMIN (403 without institutionId).
- CI: new `.github/workflows/ci.yml` — typecheck, API tests, build on push/PR (previously none).
- Seed: demo teacher now linked to Class 10 - A; seeded a published assessment + submitted attempt (14/20) + ACTIVE and COMPLETED remediation plans for real weak concepts. Student/teacher/parent dashboards + reports now show real data.
- Fix: SUPER_ADMIN report scoping (empty-UUID 500 → clean 403 + institution-wide scope).

## 2026-09-17 — Phase 1
- Architecture: removed empty `packages/ui` stub and vestigial `apps/web/src`.
- Deployment: railway.json preDeploy switched `prisma db push` → `prisma migrate deploy` (migrations are the live mechanism).
- DB: established clean migration baseline on dev; added `ContactLead` model + migration `20260917104436_contact_leads`.
- API: new public `POST /site/contact` (throttled 3/min, Zod, honeypot, source) + `GET /admin/leads` (SUPER_ADMIN).
- Web: new `/api/contact` proxy route; contact form now checks `res.ok`; removed dead parent-card navigation.
- Mobile: removed phantom root stack screens; `me.tsx` reads real app version via expo-constants.
- Verified: typecheck (api/web/mobile) green, 45/45 API tests, full build 6/6.

## 2026-09-17 — Phase 0
- Full repository audit (4 exploration agents) summarized into
  docs/REBUILD_AUDIT.md.
- Ratified docs/MASTER_PRODUCT_SPEC.md as the single master source of truth.
- Created the complete documentation system (29 docs) including
  REBUILD_PROGRESS.md tracking 26 phases.
- Recorded rebuild decisions: retain domain model + seed data + deployment
  infra; rebuild application layering, IA, design system, website, durable
  queue, reports, CI/CD.
- Known pre-rebuild defects to fix during rebuild (dead contact route,
  /app/parents gap, phantom mobile stack screens, stale version string,
  deployment drift db-push vs migrate).

## Previous history
All pre-rebuild history is preserved in git (51 commits on `master`). See
REBUILD_AUDIT.md §6–7 for retained vs discarded items.