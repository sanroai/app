# SANRO AI Local Data Reset

## Reset Purpose

Clean local SANRO AI data before rebuilding the platform step-by-step.

## Environment

LOCAL DEVELOPMENT ONLY — `localhost:5432/sanro_dev`. No production, live, or
shared resource is targeted by this operation.

## Date/Time

2026-09-26 01:29 (local) — backup created; reset executed immediately after.

## Pre-reset State

Database type: PostgreSQL 18 (local Windows service)
Database identifier: `sanro_dev` (loopback)
Migrations: 13 migration directories, 14 `_prisma_migrations` rows — untouched
Total base tables: 63 (39 non-empty)

### Row counts

| Table | Rows |
|---|---:|
| Session | 884 |
| User | 372 |
| Notification | 336 |
| Concept | 305 |
| QuestionOption | 156 |
| Topic | 154 |
| ContentItem | 143 |
| Chapter | 77 |
| Question | 70 |
| AuditLog | 18 |
| Grade | 10 |
| ArContent | 8 |
| Achievement | 8 |
| ConceptMastery | 8 |
| Subscription | 6 |
| StudentAchievement | 6 |
| InstitutionMember | 5 |
| SubscriptionHistory | 5 |
| RemediationItem | 4 |
| Plan | 3 |
| ImportJob | 3 |
| ImportRow | 3 |
| Student | 3 |
| RemediationPlan | 2 |
| Institution | 2 |
| Subject | 2 |
| TeacherSubject | 2 |
| Assessment | 1 |
| GamificationProfile | 1 |
| Board | 1 |
| Group | 1 |
| TeacherGroup | 1 |
| AcademicYear | 1 |
| GroupMembership | 1 |
| AssessmentAssignment | 1 |
| AssessmentAttempt | 1 |
| Teacher | 1 |
| _prisma_migrations | 14 |

Tables at 0 rows included: `AiUsageLog`, `ArActivity`, `ArContentVersion`,
`ContactLead`, `ContentAssignment`, `ContentProgress`, `ContentVersion`,
`DiagnosticResult`, `FlashcardRating`, `InstitutionCurriculumAccess`,
`KnowledgeBase`, `KnowledgeChunk`, `Parent`, `ParentStudentLink`,
`PasswordResetToken`, `PracticeAnswer`, `PracticeSet`, `ProcessingJob`,
`QuestionConcept`, `QuestionPaper`, `QuestionPaperQuestion`, `Report`,
`StudentAnswer`, `SupportTicket`.

### Storage objects

- `storage/ar/models/` — 6 demo GLB model copies (atom, cone, cube, cylinder, prism, sphere)
- No uploaded PDFs, worksheets, videos, OCR output or generated reports present

### Knowledge base / vectors

- `KnowledgeBase`, `KnowledgeChunk`, `ProcessingJob` — 0 rows
- No pgvector extension installed; embeddings are stored as JSON columns

## Backup

Local, never uploaded:

```
backups/pre-reset/sanroai-local-pre-reset-2026-09-26-01-29.sql
```

Size: 892,416 bytes. Verified: 63 `CREATE TABLE` statements and 63 `COPY`
blocks present. The `backups/` path is git-ignored.

## Reason

Clean-slate local development reset before rebuilding data step-by-step.

---

# Post-reset Record

## Execution

Local: 2026-09-26 01:42 (IST). Report: `backups/pre-reset/reset-report-2026-09-25-20-12.json`.

```powershell
$env:LOCAL_RESET_CONFIRMATION = "reset-my-local-sanro-data"
pnpm --filter @sanro/api reset:local-data
```

Phases executed in order:

1. **Guards** — `NODE_ENV`, `DATABASE_URL` parse, host must be local, host must
   not match a forbidden cloud/production pattern, DB name on allowlist
   (`sanro_dev`) and not matching a forbidden pattern, `STORAGE_TYPE=local`,
   no remote storage endpoint, `LOCAL_RESET_CONFIRMATION` exact match.
2. **Backup** — reused the fresh backup from 01:29 (same run, < 60 min old):
   `backups/pre-reset/sanroai-local-pre-reset-2026-09-26-01-29.sql`.
3. **Live identity check** — `current_database()` + `host(inet_server_addr())`
   must equal the expected database on a loopback address.
4. **Inventory** — pre-reset row counts recorded above.
5. **Delete** — one transaction: `TRUNCATE … RESTART IDENTITY CASCADE` on 58
   tables; delete non-system `Institution`; null `createdById` on rows whose
   owner was removed; delete every non-super-admin `User`.
6. **System seed** — Plans, Achievement catalog, system institution,
   bootstrap Super Admin.
7. **Post-verify** — re-query every `public` table; exit non-zero on any
   violation. Result: exit `0`, "RESET COMPLETE — LOCAL RESET ONLY".

### Execution issue found and fixed

The first attempt aborted **before any write** with
`Server address "::1/128" is not loopback`. Postgres returns a CIDR string
from `inet_server_addr()::text`; the check compared against `::1`. Fixed by
reading `host(inet_server_addr())` instead. Guards and backup had already
passed; no data was modified by the aborted run.

Env provenance reporting (`target source`) was also corrected: `@prisma/client`
auto-loads `apps/api/.env` at import time, so `env-loader` must be imported
before `@prisma/client` for the reported source to be meaningful.

## Post-reset state (sanro_dev)

| Table | Rows |
|---|---:|
| `_prisma_migrations` | 14 |
| `Achievement` | 8 |
| `Plan` | 3 |
| `Institution` | 1 |
| `User` | 1 |
| All other 58 `public` tables | 0 |

Preserved system institution: id `00000000-0000-0000-0000-00000000a5a1`,
name `SANRO AI`, code `SANRO-AI`, type `SANRO_PLATFORM`.
Preserved user: `admin@sanroai.com` (`isSuperAdmin=true`).
Total base tables unchanged at 63; migrations untouched at 13 dirs / 14 rows.

### Storage objects

- `storage/ar/models/` — emptied; the 6 demo GLB copies were deleted
  afterwards as a separate step (the reset script does not touch storage).
- Source assets intact: `apps/web/public/models/` still holds 16 files
  (8 `.glb`).

### Knowledge base / vectors

- `KnowledgeBase`, `KnowledgeChunk`, `ProcessingJob` — 0 rows.
- No pgvector extension installed; embeddings remain JSON columns.

## Verification

### API (`http://localhost:4000/api/v1`)

Login as the bootstrap Super Admin succeeded (`role=SUPER_ADMIN`,
`isSuperAdmin=true`). Endpoints probed — all returned HTTP 200 with empty
payloads:

| Endpoint | Result |
|---|---|
| `POST /auth/login` | 200, token issued |
| `GET /admin/super-admin/dashboard/health?range=30d` | `rows: []` |
| `GET /admin/institutions` | `total: 0` (system institution correctly excluded) |
| `GET /admin/people/students` / `teachers` / `parents` | `total: 0` |
| `GET /questions` | `total: 0` |
| `GET /assessments` | `[]` |
| `GET /curriculum/boards` / `grades` / `subjects` | `[]` |
| `GET /content` | `[]` |
| `GET /academics/academic-years` | `[]` |
| `GET /admin/library/content` | `total: 0` |
| `GET /reports/improvement` | `groups: 0`, `students: []` |
| `GET /imports` | `[]` |
| `GET /ar` | `[]` (after the fix below) |

### Web (`http://localhost:3000`)

```bash
npx tsx scripts/verify-empty-states.mts
```

Result: **18/18 pages clean** — Super Admin login through the real UI form,
then 18 dashboard/admin routes captured at 1440×900 into
`screenshots/empty-state/` with `summary.json`.
Routes: dashboard, institutions, people (students/teachers/parents),
questions, assessments, content ingest, curriculum, reports, remediation,
import, papers, gamification, achievements, AR, settings, profile.
No page crash, no error marker, no application error text.

### Tests and typecheck

| Command | Result |
|---|---|
| `pnpm -r typecheck` | 6/6 tasks pass (types, validation, config, api, web, mobile) |
| `pnpm --filter @sanro/api test` | **178/178 tests, 16/16 files pass** |

## Test database (`sanro_test`) rebuilt

The test database had been created with `prisma db push`, which cannot create
migration-only objects. It was missing the partial unique index
`Institution_system_institution_singleton`, so
"provisions exactly one system institution" passed by accident before and
failed once isolation was introduced.

Rebuilt from scratch:

1. `DROP DATABASE sanro_test WITH (FORCE); CREATE DATABASE sanro_test;`
2. `prisma migrate deploy` against `sanro_test` — all **13 migrations** applied.
3. `pnpm --filter @sanro/api db:seed:qa` — QA fixtures only.

The system institution row now comes from migration
`20260921110000_sanro_ai_system_institution` with name `SANRO AI`, matching
what the tests assert. `apps/api/prisma/seed-system.ts` was corrected to
create `SANRO AI` (it previously wrote `Sanro AI`) so a fresh creation matches
the migration and the test contract.

`pnpm --filter @sanro/api test` now runs
`prepare-test-db.ts → seed --qa → vitest`, so a fresh checkout gets a
migration-complete test database without manual steps.

## Issues found during verification

| # | Issue | Impact | Resolution |
|---|---|---|---|
| 1 | `ar.service.ts` passed `'__none__'` as `institutionId` when the caller had no institution | `GET /ar` returned 500 for platform Super Admin (Prisma cast failure: `found _ at 1`) | Replaced the non-UUID sentinel with `NO_INSTITUTION_ID = 00000000-0000-0000-0000-000000000000` (4 call sites) |
| 2 | `sanro_test` missing migration-only partial unique index | Would fail once tests were isolated from `sanro_dev` | Rebuilt `sanro_test` with `migrate deploy`; wired into the `test` script |
| 3 | System institution name mismatch (`Sanro AI` vs `SANRO AI`) | Test assertion failure | `seed-system.ts` now writes `SANRO AI` |
| 4 | `/app/content` has no `page.tsx` (only `ingest/`) | Route 404s | Not a regression; nothing links to it. Verification script uses `/app/content/ingest` |
| 5 | `/app/remediation` shows "Student profile not found" for Super Admin | Cosmetic on direct navigation | Expected — the nav item is gated `staff && !isSuperAdmin`; student-scoped page |

## Files added or changed

| File | Change |
|---|---|
| `apps/api/prisma/env-loader.ts` | Added — env loading, target parsing, local-host detection |
| `apps/api/prisma/reset-local-data.ts` | Added — guarded local reset script |
| `apps/api/prisma/seed-system.ts` | Added — system-only seed (Plans, Achievements, system institution, bootstrap Super Admin) |
| `apps/api/prisma/prepare-test-db.ts` | Added — `migrate deploy` against `DATABASE_URL_TEST` before tests |
| `apps/api/prisma/seed.ts` | `--system` / `--demo` / `--qa` modes; test URL resolution; non-local abort |
| `apps/api/vitest.config.ts` | Routes tests to `DATABASE_URL_TEST` |
| `apps/api/package.json` | `test`, `db:seed`, `db:seed:demo`, `db:seed:qa`, `db:test:prepare`, `reset:local-data` |
| `apps/api/.env` | `DATABASE_URL_TEST`, `SEED_SUPER_ADMIN_EMAIL/PASSWORD` (git-ignored, values not recorded here) |
| `apps/api/.env.example` | Documented `DATABASE_URL_TEST` and the `SEED_SUPER_ADMIN_*` variables |
| `apps/api/src/ar/ar.service.ts` | UUID sentinel fix (`NO_INSTITUTION_ID`) |
| `package.json` (root) | `db:seed:demo`, `db:seed:qa`, `reset-local-data` |
| `.gitignore` | `backups/`, `/backups/` |
| `scripts/verify-empty-states.mts` | Added — Playwright empty-state verification |

## Not touched

No schema change, no migration file added/changed/deleted, no production
database, no remote/cloud storage, no R2 bucket, no deployment configuration.
`prisma migrate reset` was never run.
