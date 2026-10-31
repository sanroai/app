# SANRO AI — Rebuild Progress

Live tracking document. **Last updated 2026-10-22** — phases 0–4 and 5–18, 20–22 are complete; phase 15 (AI) and 19 (notifications) are partial; phase 24 (deployment) and 25 (APK) plus the final audit remain pending.

Master source of truth: docs/MASTER_PRODUCT_SPEC.md
Snapshot of what existed before rebuild: docs/REBUILD_AUDIT.md

---

## Phase Status

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 0 | Audit + documentation | ✅ DONE | Audit complete; 29 docs created |
| 1 | Architecture + monorepo + design system | ✅ DONE | Cleanups + defect fixes verified (see below) |
| 2 | Database + curriculum + tenancy | ⏳ PARTIAL | Schema rebased to clean migration baseline; `institution_subscription_system` migration added |
| 3 | Authentication + RBAC | ⏳ PARTIAL | Retained; blocked-state login contract + `GET /auth/account-state` added (2026-09-20) |
| 4 | Content architecture + ingestion | ✅ DONE | Durable job queue proven end-to-end (see below) |
| 5 | LEARN library | ✅ DONE | Library browse + subjects + item detail, chapter hub (Continue → Contents → Learn → Practise → Ask), concept page with 3 modes (Learn/Practice/Ask Sanro AI); content visibility filtered to APPROVED\|PUBLISHED |
| 6 | Question bank | ✅ DONE | Question CRUD + filters; type mapping SHORT→SHORT_ANSWER / LONG→LONG_ANSWER; paper generation |
| 7 | Assessment engine | ✅ DONE | Assessment flow + auto-grading; practice session per question timer; mastery evidence + XP ledger |
| 8 | Diagnosis engine | ✅ DONE | `GET /learning/path` returns diagnosis-derived ordered path with mastered/inProgress/notStarted; retest triggered by student |
| 9 | Remediation engine | ✅ DONE | Remediation plans + items + status transitions; `POST /remediation/retest` allows STUDENT role |
| 10 | Retest + improvement | ✅ DONE | Student-triggered retest; ASSESS→DIAGNOSE→FIX→RETEST→IMPROVE loop closed |
| 11 | Teacher experience | ✅ DONE | Classes + Assess tabs; teacher dashboard; reports class/student/assessment/concept-performance endpoints |
| 12 | Parent experience | ✅ DONE | Parent sees child activity; mobile Children tab |
| 13 | Principal/Admin experience | ✅ DONE | Institution management + entitlement engine + audit |
| 14 | Super Admin | ✅ DONE | `/admin/institutions` CRUD, status/subscription, curriculum CRUD, `/admin/audit`, `/admin/subscriptions`, `/admin/leads`, users, subscription history, dashboard |
| 15 | AI | ⏳ PARTIAL | AI provider configured (mock/openai/gemini) via `AI_PROVIDER`; live path requires `AI_API_KEY` (not yet set) |
| 16 | AR/3D | ✅ DONE | `View in your space` affordance gated on WebXR/ARCore capability; 3D preview works everywhere; `lib/ar-assets.ts` resolves file URLs against `EXPO_PUBLIC_WEB_URL` |
| 17 | Gamification | ✅ DONE | `GamificationProfile.xp` lifetime counter + `XpEvent` ledger; leaderboard weekly/monthly/all scoped by group; streak rule same-day-keep / yesterday-extend / older-restart |
| 18 | Reports + analytics | ✅ DONE | `/reports/class/:groupId`, `/reports/student/:studentId`, `/reports/assessment/:assessmentId`, `/reports/improvement`, `/reports/concept-performance`; CSV export via `x-export-format: csv` |
| 19 | Notifications | ⏳ PARTIAL | In-app notifications exist; EMAIL/PUSH/WHATSAPP channels present in enum but not wired to a provider |
| 20 | Mobile | ✅ DONE | Expo SDK 53 / RN 0.79.6 / expo-router 5; 5-tab shell + role tabs; 3 concept modes; offline queue; typecheck + 82 tests pass |
| 21 | Website | ✅ DONE | Full UI/UX overhaul: dark mode, design tokens, a11y, type safety; `/api/contact` proxy to API |
| 22 | Security + performance | ✅ DONE | CORS locked to explicit origins; JWT secret ≥32 chars + prod refuses `dev-`; RBAC `@Roles` on mutations; rate limits; Zod validation; multer 10MB + MIME; Swagger gated off prod; Helmet + compression; no committed secrets |
| 23 | QA | ✅ DONE | QA suite (role verifier, empty states, parity, video liveness/source/durations/curriculum, probe-chapter-hub, fuzz-write-path, probe-auth-security, probe-rate-limit); BUG-A…BUG-Z register; gates: typecheck/lint/tests/build |
| 24 | Deployment | ⏳ PENDING | Web (Vercel) + API (Railway) not yet deployed against the current branch; 4 migrations pending (`add_xp_event_ledger`, `backfill_xp_event_ledger`, `add_diagnostic_result_practice_source`, `add_content_item_segments`); verify live after deploy |
| 25 | Android APK | ⏳ PENDING | Not yet published for this branch (EAS preview APK rebuilt only in the 2026-09-20 baseline build) |
| — | Final audit + report | ⏳ PENDING | Post-deploy smoke test of full flow against production |

---

## Phase 0 — Audit + Documentation (2026-09-17)

### Completed
- Full repository audit executed (4 parallel exploration agents: repo-level,
  API, web, mobile). Findings written to `docs/REBUILD_AUDIT.md`.
- Created the full documentation system (24 docs, see below).
- Ratified `docs/MASTER_PRODUCT_SPEC.md` (37 sections).
- Created this progress doc.

### Documentation system (docs/)

- MASTER_PRODUCT_SPEC.md — single master source of truth
- ARCHITECTURE.md
- DATABASE.md
- API.md
- AUTH_RBAC.md
- CONTENT_ARCHITECTURE.md
- LEARNING_ARCHITECTURE.md
- ASSESSMENT_ENGINE.md
- DIAGNOSIS_ENGINE.md
- REMEDIATION_ENGINE.md
- QUESTION_BANK.md
- PAPER_GENERATOR.md
- AI_SYSTEM.md
- AR_3D.md
- MOBILE.md
- WEBSITE.md
- DESIGN_SYSTEM.md
- SECURITY.md
- QA.md
- DEPLOYMENT.md
- DATA_INGESTION.md
- ANALYTICS.md
- NOTIFICATIONS.md
- IMPORTS.md
- EDGE_CASES.md
- DEMO_DATA.md
- CHANGELOG.md
- REBUILD_AUDIT.md
- REBUILD_PROGRESS.md

### Decisions taken in Phase 0

1. **Retain domain model** (curriculum, content lifecycle, questions,
   assessments, mastery/diagnosis, remediation, AR, gamification seed).
2. **Rebuild application layering**: unified design system, new IA aligned to
   two primary paths, durable job queue, reports system, CI/CD, website.
3. **Discard**: empty `packages/ui` stub, vestigial `apps/web/src/`, legacy
   `components/ui.tsx` kit, in-memory job queue as final architecture.
4. **Remove known defects** inherited (dead contact form route, `/app/parents`
   gap, phantom mobile stack screens, stale version strings).

### Build health at Phase 0 start
- `pnpm -r typecheck`: passes (0 errors)
- API tests: 18/18 pass
- Full build: 6/6 tasks pass

---

## Phase 1 — Architecture + Monorepo + Design System (2026-09-17)

### Completed
- **Monorepo cleanup**: removed empty `packages/ui` stub (no package.json/src;
  not referenced by any code). Design decision ratified: UI stays per-app
  (web `components/ui/`, mobile `components/`); shared contracts only in
  `@sanro/{types,validation,config}`. MASTER_PRODUCT_SPEC §34 updated.
- **Vestigial dir removal**: deleted empty `apps/web/src/`.
- **Deployment drift fixed**: `railway.json` preDeploy now uses
  `prisma migrate deploy` (migrations exist and are the correct mechanism),
  matching `.railway/railway.ts`. Also promoted to `migrate deploy` on the
  deployment doc.
- **Migration baseline established (dev)**: local `sanro_dev` was schema-only
  via `db push` with zero migration history. Reset dev DB (forbidden only in
  production) → applied all 4 baseline migrations → idempotent seed.
  Deployment now uses migration history cleanly.

### Defect fixes (from REBUILD_AUDIT.md §5)
| Defect | Fix | Verified |
|---|---|---|
| Contact form posted to non-existent `/api/contact` (dead UI, reported success on 404) | New `ContactLead` model + migration `20260917104436_contact_leads`; new public API `POST /api/v1/site/contact` (throttled 3/min, Zod `ContactLeadSchema`, honeypot field, source tracking); web `/api/contact` proxy route with server-side Zod validation + upstream error mapping; form now checks `res.ok` | API 200 + DB row persisted; 400 on invalid; full pipeline verified |
| Super-admin had no way to see leads | `GET /api/v1/admin/leads` (SUPER_ADMIN only) | added |
| Parent cards dead-linked to `/app/parents/[id]` (route + API did not exist) | Cards are now display-only; removed dead navigation | typecheck pass |
| Mobile root stack registered phantom `classes/assessments/children` screens (cell referenced files that live in `(tabs)`) | Removed phantom entries from `app/_layout.tsx` | mobile typecheck pass |
| Mobile `me.tsx` hardcoded stale "v1.0.0" | Now reads `Constants.expoConfig.version` (falls back 1.1.0) | mobile typecheck pass |

### Build health at Phase 1 end
- `pnpm --filter @sanro/api typecheck`: pass
- `pnpm --filter @sanro/web typecheck`: pass
- `pnpm --filter @sanro/mobile typecheck`: pass
- API tests: 45/45 pass
- Full `pnpm build`: 6/6 tasks pass

### Test leads
Verification contact-lead rows were deleted after the check (DB left clean).

---

## Phases 4/18 partial + extra ground-up work (2026-09-17)

### Phase 18 — Reports + analytics (`apps/api/src/reports/`) — NEW
Audit found the web `/reports` page was a thin reuse of `/dashboard/teacher` with
**no dedicated reports API and no exports**. Built a proper tenant-scoped reports
module:

| Endpoint (all GET, `TEACHER`/`INSTITUTION_ADMIN`/`SUPER_ADMIN`) | Output |
|---|---|
| `/reports/class/:groupId` | Class-level rollup: per-student mastery avg, assessment avg, weak concepts, remediation completion, status (ON_TRACK/EARLY/NEEDS_HELP) + class summary |
| `/reports/student/:studentId` | Concept mastery table, attempt history, remediation plans, summary (overall mastery, weak count, avg score) |
| `/reports/assessment/:assessmentId` | Per-student status/score/%/accuracy + completion/avg summary |
| `/reports/improvement` | Improvement register: students with weak concepts, avg assessment score, remediation plans completed (sorted, needs-help first) |
| `/reports/concept-performance` | Per-concept aggregation: students assessed, avg score, needing intervention |

- CSV export via `x-export-format: csv` header (RFC 4180 writer, quoted fields,
  `Content-Disposition` attachment). PDF remains a documented follow-up (see PDF phase).
- **Tenant scoping** (defense-in-depth):
  - Teacher → only their linked groups (`TeacherGroup`)
  - Institution admin → all active groups in institution
  - Super admin → requires `?institutionId=` (403 otherwise); institution-wide scope
- Verified live: teacher 1 class/1 student with 7 mastery rows, 2 weak concepts,
  2 remediation plans, 1 assessment attempt; CSV content correct; SUPER_ADMIN 403/OK.

### Phase 4 — seed enrichment (idempotent)
The demo student existed in the DB but had **no real academic footprint** — all
dashboards and reports rendered empty. Extended `prisma/seed.ts`:
- `TeacherGroup` link: Teacher Patil ↔ Class 10 - A
- Chemistry published assessment assigned to the class + student
- One submitted attempt (14/20, 70%, 900s)
- Two remediation plans for the learner's real weak concepts: one ACTIVE (video
  done, quiz pending, notes), one COMPLETED — with real items
Verified: student dashboard now shows weak=2, plans=1, attempts=1, pending=1;
teacher dashboard shows classes=1, pendingWork=2; parent sees child activity.

### Phase 23/24 prerequisite — CI/CD (`/.github/workflows/ci.yml`) — NEW
Previously no CI at all. Now: push/PR to `master` runs pnpm install (frozen
lockfile), `prisma generate`, `pnpm -r typecheck`, API tests, full build.
Deploy continues via connected Railway/Vercel auto-deploy on merge.

### Build health at end of reports + CI work
- API tests 45/45 (6 files) ✅ · `pnpm -r typecheck` clean ✅ · full build 6/6 ✅

---

### Phase 4 — durable job queue (`apps/api/src/common/services/job-queue.service.ts`)
Replaced crash-lossy in-memory-only queue with a durable one:
- `restorePendingJobs()` runs at bootstrap: loads `PENDING`/`PROCESSING`
  `ProcessingJob` rows, resets `PROCESSING → PENDING` (+`startedAt=null`) so work
  interrupted by a crash is retried, and re-enqueues them.
- Proven live: created a DB row for a PENDING job → restarted the API → log showed
  `Restored 1 job(s) from database after restart` → job processed → `completed`.
  Test rows deleted afterwards (DB left clean).

### Phase 20 — Mobile verification
`pnpm --filter @sanro/mobile typecheck` clean. Routes confirmed: 5-tab shell
(Home/Learn/Practice/Tests/Me + role tabs Classes/Assessments/Children), concept
detail with all 6 modes wired to real backend hooks (`useConceptDetail`,
`/learning/practice/start`, quiz/flashcards/challenge/ask). Grep audit found **no
hardcoded mock questions** anywhere. `me.tsx` shows the real app version.
`apps/mobile/lib/api.ts` default switched `http://localhost:4000` →
`https://api.sanroai.com/api/v1` (prod builds inject the same via `eas.json` env
on every profile).

### Phase 22 — Security + performance hardening
Sweep results: CORS locked to explicit prod origins ✅ · JWT secret ≥32 chars &
refuses `dev-` in prod ✅ · RBAC `@Roles` on mutations ✅ · rate limits login 10/min,
register 5/min, forgot-password 3/min, contact 3/min ✅ · Zod `whitelist` +
`forbidUnknownValues` ✅ · multer 10MB `limits.fileSize` + MIME filters on all 3
upload routes ✅ · Swagger gated off in prod ✅ · error body
`{code,message,requestId,statusCode,details?}` ✅ · no committed secrets.

New: **Helmet** (X-Frame-Options: SAMEORIGIN, Strict-Transport-Security,
X-Content-Type-Options verified live) + **compression** (gzip). Also removed the
ignored root `pnpm.onlyBuiltDependencies` field (pnpm v12 warns; workspace already
uses `dangerouslyAllowAllBuilds`). New `csv.spec.ts` brings API tests to 49/49.

### Build health at this point
- API tests 49/49 (7 files) ✅ · `pnpm -r typecheck` clean ✅ · API build ✅ ·
  helmet/compression headers verified on running server ✅

---

### Phase 24 — Deployment (commit 34c3523, pushed to origin/master)
**API — DEPLOYED + VERIFIED LIVE.** Proved `railway up` (CLI, linked project
`sanroai`, service `api`). `.railwayignore` added to keep the 78 MB web APK out
of the Railway upload. Deployment `23b7042f` is Online. Verified against
`https://api.sanroai.com/api/v1`:
- `/health` ok, DB connected; **Helmet headers live** (X-Frame-Options SAMEORIGIN,
  HSTS, nosniff)
- `/reports/improvement` → 401 unauth / 200 authed (real seed data, CSV embedded)
- `/reports/class/:groupId`, `/reports/student/:studentId`,
  `/reports/concept-performance` → 200 (teacher token; scoping 403 respected)
- `/admin/leads` (SUPER_ADMIN) → 200 → proves `contact_leads` migration applied
- `POST /site/contact` invalid → 400 (Zod live)
- Railway preDeploy runs `prisma migrate deploy` + idempotent seed on every build
  (prod DB confirmed on baseline, no drift).

**WEB — LIVE + VERIFIED.** Deployed via `vercel --prod` with the account token
(project `sanroai-web`, root dir `apps/web`, aliased `sanroai.com`; Cloudflare in
front also serves `app.sanroai.com`). New build includes `/api/contact` proxy +
fixed parents page. Both domains verified: `/api/contact` → 400 (new build),
homepage 200. Contact flow smoke-tested end-to-end (proxy → API → DB →
`admin/leads`; one lead row `d6aca534` to delete from dashboard).

**APK — LIVE.** EAS build `751b46a1` (preview/APK) FINISHED with the `sanroai`
owner account token. Android bundle audited: contains `https://api.sanroai.com/api/v1`,
**zero** `localhost:4000` refs. New APK (78,061,486 B, SHA256
`C8750B7F…FCF6E`) pushed in commit `0bbf1fd` and served at
`https://sanroai.com/downloads/sanroai.apk` (HEAD verified). `.railwayignore`
committed so Railway never re-uploads the APK.

### Follow-ups (non-blocking)
- ~~Railway warns `railway.json` Config-as-Code deprecation → migrate to
  `.railway/railway.ts` (`railway config migrate`) before 2026-12-01.~~
  **RESOLVED (2026-09-23)**: `railway.json` deleted outright. Railway's GitHub
  App could not snapshot the repo ("Failed to snapshot repository"), blocking
  all deploys; config now lives on the Railway service settings, so no
  config-as-code file remains to deprecate. See docs/DEPLOYMENT.md §3.
- PDF report export remains a documented follow-up (HTML fallback on Railway).
- Web tests / E2E screenshots after web redeploy.
- **Current deploy state:** the Phase 24 deploy above was of an older baseline commit. The
  current branch is ahead of it (XP ledger / gamification, chapter markers, content-type
  taxonomy, mobile remediation entry point, 3 concept modes). Phase 24 is marked PENDING:
  run the 4 pending migrations (`add_xp_event_ledger`, `backfill_xp_event_ledger`,
  `add_diagnostic_result_practice_source`, `add_content_item_segments`), then deploy web
  (Vercel) + API (Railway) and smoke-test the full flow against production.

### Build health at this point

---

## 2026-09-20 — Super-admin institution management + subscription/validity/access-control system

New subsystem (migration `20260920102146_institution_subscription_system`), documented in
depth in docs/INSTITUTION_MANAGEMENT.md (People Management / Direct SANRO:
docs/PEOPLE_MANAGEMENT.md, migration `20260920120000_people_direct_sanro`):

- **Entitlement engine** (`apps/api/src/common/security/subscription-access.service.ts`):
  single source of truth for institution access — subscription validity, seat limits,
  user/membership state. 15 s in-process cache per institution (`ENTITLEMENT_CACHE_TTL_MS`),
  `invalidate()`/`clearCache()` hooks.
- **Route gate** (`common/guards/subscription.guard.ts` + `@SubscriptionRequired()`):
  global guard enforcing entitlement on gated modules (learning, assessments, people,
  questions, papers, academics, imports, curriculum, diagnosis, remediation, reports,
  AR, AI, chat, dashboard). SUPER_ADMIN exempt.
- **Lazy expiry**: ACTIVE/TRIAL subscription whose `endsAt` passed flips to EXPIRED
  at next `evaluate()`; ACTIVE institution → EXPIRED (+`expiredAt`). No batch job,
  no data deletion.
- **Blocked-account flow**: login/refresh/switch-context return `BlockedAccountResponse`
  (no tokens); `GET /auth/account-state` added; 6 block states
  (`AccountBlockState`). Web `/app/account-blocked` and mobile `/expired` screens
  are pending (contract ready).
- **Seat limits**: billable seats = ACTIVE students + ACTIVE teachers + all parents +
  ACTIVE institution-admin memberships; `assertSeatAvailable` (`USER_LIMIT_REACHED`)
  enforces person create, student-with-parent create (2 seats), `link-parent`,
  reactivation and bulk import (fully wired 2026-10-23).
- **Admin surfaces**: `POST /admin/institutions`, `PATCH …/status`,
  `PATCH …/subscription` (replaces ACTIVE/TRIAL, ~30-day end), curriculum CRUD,
  `GET /admin/audit`, `GET /admin/subscriptions`, `GET /admin/leads`.
- **Contracts ahead of wiring** (schema/types/validation defined): SubscriptionHistory
  rows, new AuditActions, renew/expire/plan-change/limit-change/change-admin/restrict-user,
  institution list pagination/export, `SuperAdminDashboard` — not yet implemented
  (see "Documented gaps" in docs/INSTITUTION_MANAGEMENT.md and
   docs/PEOPLE_MANAGEMENT.md).

### Verified
- `pnpm -r typecheck` covers the new engine/guard/decorators/dto changes.
- Existing API suites (authorization e2e incl. role matrix, role-access unit) still
  pass; dedicated subscription-access / admin-institutions / validation-constraint
  specs are a follow-up.
- Full `pnpm build` (6 tasks) green.

## How to Update

After each phase completes: run build + typecheck + tests, inspect UI, fix
regressions, update this table, update CHANGELOG, and update any affected
section of MASTER_PRODUCT_SPEC.md.

---

## 2026-09-21 — SANRO AI system institution (applied)

The system-institution migration (`20260921105000`+`20260921110000` + seed
`ensureSystemInstitution`) is applied to the local DB and is **idempotent** —
re-runnable without duplicates, no prod reset required. Direct customers now
belong to the system-owned "SANRO AI" institution
(`00000000-0000-0000-0000-00000000a5a1`); Student/Parent direct rows carry that
`institutionId` (legacy NULL rows remain DIRECT_SANRO).
See docs/PEOPLE_MANAGEMENT.md and docs/DATABASE.md §6.