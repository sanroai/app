# SANRO AI — Changelog

Format: date — phase — change.

## 2026-09-23 — Super Admin platform scope (403 sweep)
- **Bug**: 86 call sites still used `TenantAccessService.requireInstitution`,
  which throws `403 "Super admin is not bound to an institution"` for
  `SUPER_ADMIN`. The prior assessments fix covered only its 7 sites, so most
  Super Admin nav pages were dead: Question Bank, Question Papers, Reports,
  Gamification, Import, and the academic-year/group selectors all returned 403.
- **Fix**: reads in `questions`, `papers`, `academics`, `learning`,
  `reports`, `imports` now use `assertInstitutionAccess`, which returns `''`
  for Super Admin = **platform-wide scope** (the institution filter is omitted
  instead of matched against `''`). Non-super roles are unchanged — still
  bound to their single institution.
- **Writes stay institution-bound**: `institutionId` is a required UUID FK on
  most tables, so a `''` would turn a 403 into a FK violation. Paper
  generation resolves the target institution via `assertInstitutionAccess(user,
  cfg.institutionId)`; duplicate/regenerate/status resolve it from the source
  paper, so Super Admin can act on any paper without owning one.
- **Gamification profile/achievements** return an empty profile/catalog for
  non-students (teachers, admins, Super Admin) instead of 403. The page checks
  `if (error) return <ErrorBanner/>` **before** its admin branch, so the 403
  hid the entire admin view behind an error banner. Body is `{}` (valid JSON)
  rather than `null`, which Nest would serialize as an empty body — the mobile
  client calls `res.json()` without a guard.
- **Reports**: Super Admin with no `institutionId` now gets platform-wide
  scope (all active groups) instead of `403 "must specify institutionId"`;
  the Reports UI already sends `institutionId` only when a filter is chosen.
  Fixed the assessment report guard so `scope.institutionId === ''` does not
  404 every assessment.
- Local verification: all 18 previously-failing Super Admin endpoints return
  200. Typecheck clean (6 pkgs), 178/178 tests, `pnpm build` 6/6.

## 2026-09-23 — Production deploy unblocked (schema drift + Railway config)
- **Root cause of failed production deploys**: prod DB was ahead of migration
  history in reverse — `prisma migrate deploy` reported "no pending
  migrations" while the schema lacked `StudentStatus.ARCHIVED`,
  `Student.archivedAt`, and `Institution_isSystemInstitution_idx`. Seed then
  crashed (`P2022 column Student.archivedAt does not exist`) inside
  `preDeployCommand`, so the container was stopped before start.
  Local dev had them only because it was synced via `db push`.
- **Fix**: new idempotent, non-destructive migration
  `20260923120000_student_archive_schema_drift` — guarded enum add,
  `ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`. Verified by
  replaying all 13 migrations onto a clean DB, running seed twice (exit 0
  both times), and confirming `prisma migrate diff` now reports an **empty**
  migration (zero drift).
- **Railway config-as-code removed**: `railway.json` deleted. Railway's GitHub
  App returned `Not Authorized` on `githubRepos`, so every deploy failed with
  `Failed to snapshot repository`. Deploy config (start command, healthcheck,
  preDeploy migrate+seed) is now stored on the Railway service itself. This
  also clears the Config-as-Code deprecation (deadline 2026-12-01).
- **GitHub access fixed**: `gh` CLI re-authenticated as `sanroai`
  (`wavoklu` inactive); fine-grained PAT saved as `GH_TOKEN` (User scope).
  Railway `serviceDisconnect` run on the `api` service to drop the broken repo
  link; `repoTriggers` now empty.
- **Removed unused `railway` npm SDK** (devDependency 3.11.0): incompatible
  with Railway CLI ≥5.42.1, it broke `railway config plan`. CLI-only now.
- **Verified live**: migration applied on prod, seed completed, Nest started,
  `GET /api/v1/health` → `ok`/`connected`, and `GET /api/v1/assessments` as
  Super Admin → **200 with data** (previously failed with "Super admin is not
  bound to any institution").
- Local gate: typecheck clean (6 packages), 178/178 API tests pass,
  `pnpm build` 6/6.
- Live: https://api.sanroai.com · https://sanroai.com

## 2026-09-21 — Web UI/UX overhaul + mobile fixes + design token migration
- **Comprehensive 64-page UI/UX audit** executed via 15+ parallel agents across
  83 files (+1178/-721 lines). Covers every dashboard, auth, public, and
  settings page.
- **Dark mode on all 15 UI components**: Button, Card, Badge, Input, Textarea,
  Select, Tabs, DropdownMenu, ScrollArea, Tooltip, Label, Progress, Checkbox,
  Dialog, Toaster — all wired with `dark:` Tailwind classes.
- **Design token migration**: all `slate-*` tokens replaced with semantic
  `surface-*` tokens (`text-slate-*` → `text-surface-*`, `bg-slate-*` →
  `bg-surface-*`, `border-slate-*` → `border-surface-*`) — zero remaining
  in dashboard pages.
- **Type safety**: 22+ `any` annotations replaced with typed interfaces
  across concept, chapter, remediation, gamification, assessments, and
  question pages.
- **Navigation**: `window.location.href` / `.reload()` → `router.push()` /
  `router.replace()` / `router.refresh()` (4 calls fixed); `<a href>` →
  `<Link>` for SPA navigation in dropdown menus.
- **UX polish**: `alert()` → `toast.error()`, native `<select>` → Radix
  Select, native checkboxes → Radix Checkbox, `window.confirm()` → inline
  confirm buttons, CSS spinner → Loader2, dead buttons disabled.
- **Accessibility**: skip-to-content links, `aria-label` on all icon buttons,
  `aria-current="page"` on nav, `aria-expanded` on menus, `role="alert"` on
  form errors, `role="dialog"` on mobile menus, ARIA tabs pattern with
  keyboard navigation on concept detail page.
- **CSS polish**: removed duplicate `@keyframes float/shimmer`, added
  `::selection` brand tint, consolidated body/heading styles in `@layer base`.
- **New component**: `components/ui/checkbox.tsx` (Radix UI checkbox).
- **Mobile fixes**: dark mode set to `light` (was `automatic` with no
  dark palette), Card `accent` prop implemented, Challenge screen error
  handling fixed (infinite spinner), keyboard dismissal on answer selection,
  unused imports removed, inconsistent padding fixed, leaderboard
  keyExtractor fixed, flashcard icon corrected.
- **Screenshots**: 70+ fresh screenshots captured for student, teacher, and
  admin roles across desktop/tablet/mobile/narrow viewports.
- Live: https://sanroai.com

## 2026-09-21 — SANRO AI system institution + protected entity + dashboard aggregation
- **SANRO AI system institution**: direct customers (students/parents) now belong
  to the single system-owned institution "SANRO AI" (id
  `00000000-0000-0000-0000-00000000a5a1`, code `SANRO-AI`, type `SANRO_PLATFORM`,
  `isSystemInstitution=true`, ACTIVE). Their Student/Parent rows carry that
  `institutionId`; legacy NULL rows still resolve as DIRECT_SANRO (fallback).
- **Idempotent migration, no prod reset**: created by migrations
  `20260921105000`+`20260921110000` and seed `ensureSystemInstitution`; a partial
  unique index WHERE `isSystemInstitution=true` enforces singleness.
- **Protected-entity guarantees**: the SANRO AI institution is never
  deleted/archived/suspended/expired/modified (ForbiddenException), cannot be
  duplicated (ConflictException + partial unique index), and is excluded from
  tenant list `/admin/institutions`. Entitlement/guards treat
  `user.institutionId` = system id, or null, as direct.
- **source + institutionId/institutionName contract**: API keeps
  `source` (`INSTITUTION` | `DIRECT_SANRO`); `DIRECT_SANRO` maps to students/
  parents in the SANRO AI system institution or legacy null rows. People
  list/detail and student create responses add `institutionId`/`institutionName`
  (`'SANRO AI'`).
- **Dashboard aggregation API** (SUPER_ADMIN): `GET
  /admin/super-admin/dashboard/{overview,health,attention,activity}` with
  `range=today|7d|30d|month`; the system institution is excluded from
  health/attention by default (`includeSystem=true` includes it).
- **Super-admin dashboard redesign** built on the aggregation API.
- Reference: docs/PEOPLE_MANAGEMENT.md, docs/PEOPLE_MANAGEMENT_CONTRACT.md,
  docs/DATABASE.md §6.

## 2026-09-20 — People management: Direct SANRO model + super-admin People Admin
- Direct SANRO model: `Subscription.userId` (unique, nullable direct-owner) +
  nullable `Subscription.institutionId`; `Student.institutionId`/`academicYearId`
  nullable; `Parent.institutionId` nullable; `SubscriptionHistory.institutionId`
  nullable; `User.subscriptions` relation. Migration
  `20260920120000_people_direct_sanro`. Source is DERIVED (`institutionId` null ⇔
  DIRECT_SANRO) — no stored column, no fake "SANRO" tenant.
- Entitlement oracle `EntitlementService` (`evaluateUser`/`evaluateEntitlement`,
  `assertCanAccess`, per-user 15 s cache + `invalidate`/`clearCache`): SUPER_ADMIN
  passthrough, institution path delegates to `SubscriptionAccessService`, direct
  path (user-owned Subscription, `ACTIVE|TRIAL`), parent path (child aggregation,
  ANY-child rule, `expiresAt = max`). `SubscriptionGuard` now routes
  institution-less users to the entitlement service.
- Direct block codes: `DIRECT_SUBSCRIPTION_EXPIRED`, `DIRECT_SUBSCRIPTION_SUSPENDED`,
  `NO_ENTITLEMENT`, `NO_ACTIVE_CHILD_RELATIONSHIP` (`AccountBlockState` +
  `EntitlementBlockReason` in `@sanro/types`).
- Super-admin People API `/api/v1/admin/people/*` (`@Roles(SUPER_ADMIN)`):
  students/teachers/parents list (filters + pagination ≤100), detail, create
  (returns one-time `defaultPassword`), update, transfer, status/disable/enable,
  direct-subscription (student, with `SubscriptionHistory` institutionId null),
  search, parent link/unlink.
- Audit actions per operation: STUDENT_CREATED/UPDATED/ENABLED/DISABLED/
  INSTITUTION_CHANGED, TEACHER_ADDED/UPDATED/ENABLED/DISABLED/
  INSTITUTION_CHANGED, PARENT_UPDATED/ENABLED/DISABLED/CHILD_LINKED/
  CHILD_UNLINKED (no PARENT_CREATED), DIRECT_SUBSCRIPTION_CREATED/UPDATED.
- Web: super-admin PEOPLE nav + `/app/people/{students,teachers,parents}` pages,
  SourceBadge, source/subscription-status filters, direct-subscription dialog.
- Tests: `entitlement.service.spec.ts` (unit) covers the direct + parent matrix.
  `people.e2e-spec.ts` (contract §8) NOT yet in repo — gaps listed in
  docs/PEOPLE_MANAGEMENT.md. Known gap: direct login still blocked by
  `issueLogin` 401 'No active institution membership'.
- Full reference: docs/PEOPLE_MANAGEMENT.md.

## 2026-09-20 — Super-admin institution management + subscription/validity/access-control
- Entitlement engine `SubscriptionAccessService` (cached 15 s) + global
  `SubscriptionGuard` with `@SubscriptionRequired()` coverage across learning,
  assessments, people, questions, papers, academics, imports, curriculum, diagnosis,
  remediation, reports, AR, AI, chat, dashboard. SUPER_ADMIN exempt.
- Lazy expiry (no batch job): ended ACTIVE/TRIAL subscription → EXPIRED;
  ACTIVE institution → EXPIRED on next evaluation. Data never deleted.
- Blocked-account contract: login/refresh/switch-context return `BlockedAccountResponse`
  (no tokens); `GET /auth/account-state` added; six `AccountBlockState`s.
- Seat limits: billable-seat definition + `SEAT_LIMIT_REACHED` on student create;
  `USER_LIMIT_REACHED` helper defined. `gracePeriodDays` surfaced but not yet applied.
- Super-admin institutions: create, status patch (ACTIVE/SUSPENDED/ARCHIVED),
  subscription set (cancel prior ACTIVE/TRIAL + new ~30-day), curriculum CRUD,
  global audit/subscriptions/leads.
- Schema: migration `20260920102146_institution_subscription_system`
  (SubscriptionHistory + enums + Institution columns + indexes).
- Full reference: docs/INSTITUTION_MANAGEMENT.md; spec sections
  `docs/MASTER_PRODUCT_SPEC.md` §38–45. Known gaps (not-yet-wired renew/expire/
  restore/users/export, SubscriptionHistory writers, cache invalidation from admin,
  dedicated specs) listed in the reference doc §"Documented gaps".

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