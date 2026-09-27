# SANRO AI — Development Change Log

Ongoing log of structural and data changes. Separate from `docs/CHANGELOG.md`
(product/phase history); this file is the required record from 2026-09-26
onward.

## How to use this file

- Log **every** structural or data change: schema/migrations, seed and import
  behaviour, API contract changes, destructive or reset operations, storage
  layout, environment/config changes that affect data.
- Newest entry first (top of the Entries section).
- One entry per change; use the field set below verbatim. Write `none` where a
  field does not apply — do not omit fields.
- Never record secrets: no passwords, JWT secrets, `DATABASE_URL`
  credentials, API keys, or tokens.
- Verification must state what was actually run and its result.

## Field template

| Field | Content |
|---|---|
| Date | YYYY-MM-DD |
| Task | Short title of the change |
| Reason | Why the change was made |
| Entities affected | Models/tables/files touched |
| Database changes | Rows inserted/deleted/updated, data backfills, storage file changes |
| API changes | Endpoints added/changed/removed, contract changes |
| Frontend changes | Web/mobile changes |
| Seed/import changes | Seed script or import behaviour changes |
| Migration | Migration dir added/changed, or `none — data only, ...` |
| Verification | Commands run and results |
| Known issues | Open problems, or `none identified yet` |

Copy this block for each new entry:

```markdown
### YYYY-MM-DD — <Task>
| Field | Detail |
|---|---|
| Date | YYYY-MM-DD |
| Task | |
| Reason | |
| Entities affected | |
| Database changes | |
| API changes | |
| Frontend changes | |
| Seed/import changes | |
| Migration | |
| Verification | |
| Known issues | none identified yet |
```

## Entries

### 2026-09-26 — Bulk import: CONTENT, QUESTIONS and PARENTS entity types

| Field | Detail |
|---|---|
| Date | 2026-09-26 |
| Task | Extend the bulk-import pipeline from 2 entity types to 5 (`CONTENT`, `QUESTIONS`, `PARENTS` added alongside `STUDENTS`, `TEACHERS`) |
| Reason | Library lesson rows and question-bank rows had to be authored one at a time; parent accounts could only be created through the People UI. All three are tabular, reviewable data that belongs in the same upload → preview → commit pipeline |
| Entities affected | `packages/types/src/enums.ts`, `apps/api/prisma/schema.prisma`, `apps/api/src/imports/imports.service.ts`, `apps/web/app/(dashboard)/app/import/page.tsx`, `apps/api/test/content-import.e2e-spec.ts` (new), `apps/api/test/parents-import.e2e-spec.ts` (new), `docs/IMPORTS.md`, `AGENTS.md` |
| Database changes | `ImportEntityType` gained `CONTENT`, `QUESTIONS`, `PARENTS`; `AuditAction` gained `PARENT_CREATED`. No rows inserted or backfilled — `sanro_dev` stays platform-only |
| API changes | `POST /imports/upload` and `POST /imports/:jobId/commit` accept the three new `entityType` values. `CONTENT`/`QUESTIONS` resolve `board → grade → subject → chapter → topic? → concept?` during preview so unresolvable curriculum is an `INVALID` row error before commit. Commit creates `ContentItem` (`visibility INSTITUTION_ONLY`, `ownerType INSTITUTION`) or `Question` + `QuestionOption` (`source IMPORT`), or a `User` + `InstitutionMember(PARENT)` + `Parent` (+ `ParentStudentLink` when `studentEmail` resolves). Unsupported type → `400 Unsupported entity type "<x>"`. Commit now actually populates `errors[]`. Invalid `ImportJob` rows are marked `INVALID` rather than silently dropped |
| Frontend changes | `/app/import`: `ENTITY_TYPES` gains Content/Questions/Parents cards, per-type sample CSV headers (`SAMPLE_FILES`) and sample rows (`SAMPLE_ROWS`), free of spaces so loose key matching and Excel both work; copy and empty-state text updated |
| Seed/import changes | **Seat gate narrowed** — `seatAvailability()` is now called only for `STUDENTS`/`TEACHERS`/`PARENTS`; library content and question-bank rows no longer consume user seats. Audit action per commit is one of `STUDENT_IMPORTED` / `TEACHER_ADDED` / `PARENT_CREATED` / `CONTENT_CREATED` / `QUESTION_GENERATED`. Header matching is case/space/underscore/hyphen-insensitive (`normKey`). Student lookup for `PARENTS` is cached and case-insensitive. Teacher rows now require `email`; `employeeId` is read as an alias of `rollNumber` so the shipped sample header works |
| Migration | Three idempotent enum migrations, all `ALTER TYPE … ADD VALUE IF NOT EXISTS`, applied with `prisma migrate deploy` to **both** `sanro_test` and `sanro_dev`: `20260926090000_import_entity_content_questions`, `20260926100000_audit_action_parent_created`, `20260926110000_import_entity_type_parents`. `sanro_dev` also had one orphaned `_prisma_migrations` row deleted (`20260921100000_sanro_ai_system_institution`, whose local migration dir is `20260921105000_…`), which had been failing `migrate status` |
| Verification | `pnpm -r typecheck` → 6/6. `pnpm --filter @sanro/api test` → 236/236 tests, 22/22 files (new specs: `content-import.e2e-spec.ts` 9 tests, `parents-import.e2e-spec.ts` 4 tests). `prisma migrate status` → "16 migrations found … Database schema is up to date!" on both DBs. `pnpm --filter @sanro/web build` → pass. API `:4000` and web `:3000` → HTTP 200 |
| Known issues | none identified yet |

### 2026-09-26 — Library / Assessments IA split: content browse, learning path, retest self-service

| Field | Detail |
|---|---|
| Date | 2026-09-26 |
| Task | Split the single Learn menu into **Library** (self-directed browsing) and **Assessments** (diagnosis-driven learning Path + Tests), and add the API that feeds the Path |
| Reason | The product principle is that SANRO is an academic intelligence platform, not a content library — but one menu was serving both purposes. Students who want to study were being pushed through remediation, and there was no ordered, stateful view of what to fix next |
| Entities affected | API: `curriculum/content.service.ts`, `curriculum/curriculum.controller.ts`, `learning/learning.service.ts`, `learning/learning.controller.ts`, `remediation/{service,controller}.ts`, `packages/validation/src/schemas.ts`. Web: `lib/library-hooks.ts`, `lib/path-hooks.ts`, `components/{markdown,learning-path,youtube-player}.tsx`, `app/(dashboard)/app/library/**` (new), `app/(dashboard)/app/assessments/page.tsx`, `app/(dashboard)/layout.tsx`, `next.config.mjs`. Mobile: `app/(tabs)/{_layout,learn,tests}.tsx`, `app/(tabs)/practice.tsx` (deleted), `lib/hooks.ts`, `components/Markdown.tsx`. Tests: `content-browse.e2e-spec.ts`, `learning-path.e2e-spec.ts` (new) |
| Database changes | none — no schema change, no rows touched. Student visibility stays filtered to `ContentStatus.APPROVED\|PUBLISHED` through the existing `ContentScopeService.buildContentWhere` |
| API changes | Added `GET /content/browse` (paginated lesson browse; registered **before** `GET /content/:id` so `browse` is not swallowed as an id) and `GET /learning/path` (diagnosis-derived ordered concepts with `mastered / inProgress / notStarted`, `PARENT_RESTRICTED_KEY`). `POST /remediation/retest` gained `@Roles(…, STUDENT)` and a `studentId?` body field — a student calling it without `studentId` retests their own concepts; `CreateRetestSchema` added in `packages/validation` |
| Frontend changes | New `/app/library`, `/app/library/subjects`, `/app/library/item/[contentId]` routes; `/app/learn` redirects to `/app/library` (`next.config.mjs`); nav label `Learn` → `Library` with `NavLink` alias + `activeFor()` so both paths still highlight. `/app/assessments` is now a Radix **Tabs** screen with a **Path** tab (`components/learning-path.tsx`) in front of the existing **Tests** tab. Mobile: `learn` tab title `Library`, `tests` tab title `Assessments`, `practice` tab removed, Tests screen rewritten as the Assessments screen. Lesson notes/descriptions render through the new Markdown component on web and mobile |
| Seed/import changes | none |
| Migration | `none — no schema change` |
| Verification | `pnpm -r typecheck` → 6/6. `pnpm --filter @sanro/api test` → 236/236, 22/22 files (new specs: `content-browse.e2e-spec.ts` 10 tests, `learning-path.e2e-spec.ts` 14 tests). `pnpm --filter @sanro/web build` → pass. API `:4000` and web `:3000` → HTTP 200; `GET /app/learn` → redirect to `/app/library` |
| Known issues | none identified yet |

### 2026-09-26 — Lesson media: markdown rendering + chapter-wise YouTube videos

| Field | Detail |
|---|---|
| Date | 2026-09-26 |
| Task | Render lesson notes/descriptions as Markdown and give every chapter a managed, admin-editable set of YouTube lessons |
| Reason | Lesson bodies were stored as plain text/markdown but displayed raw, and there was no place to attach the video half of a "video + notes" lesson |
| Entities affected | API: `curriculum/curriculum.controller.ts` + `curriculum` service (`createVideos`/`listVideos`/`removeVideo`, `chapterContent` on chapter detail), `curriculum/youtube-url.spec.ts` (new). Web: `components/markdown.tsx`, `components/youtube-player.tsx`, `lib/video-hooks.ts`, `app/(dashboard)/app/content/videos/` (new page), concept page. Mobile: `components/Markdown.tsx`, `components/YouTubePlayer.tsx` (react-native-webview iframe) |
| Database changes | none — reuses the existing content/chapter tables |
| API changes | `GET/POST/DELETE /content/videos` (chapter-scoped YouTube admin) and `chapterContent` returned from `GET /learning/chapters/:chapterId`. YouTube id parsing isolated in `curriculum/youtube-url.spec.ts` |
| Frontend changes | Concept detail **Learn** tab shows embedded video lessons above the markdown study notes; new `/app/content/videos` admin page (list/add/remove) |
| Seed/import changes | none |
| Migration | `none — no schema change` |
| Verification | `pnpm -r typecheck` → 6/6; `pnpm --filter @sanro/api test` → 236/236 incl. `youtube-url.spec.ts` + `chapter-videos.e2e-spec.ts`; `pnpm --filter @sanro/web build` → pass |
| Known issues | none identified yet |

### 2026-09-25 — NCERT Class 10 Science source extraction (`books/`)

| Field | Detail |
|---|---|
| Date | 2026-09-25 |
| Task | Extract the NCERT Class 10 Science textbook set into a git-ignored `books/` tree: text layer, per-page text, page screenshots, embedded figures, Tesseract OCR pass, and per-chapter study notes |
| Reason | Platform content (lessons, notes, questions) is authored from the real textbook; without a reliable local source + figure set there was no way to author or verify lesson material |
| Entities affected | `scripts/books/{extract,ocr,build-index}.cjs` (new), root `package.json` (scripts `books:extract` / `books:ocr` / `books:index`; devDeps `pdf-parse`, `tesseract.js`, `sharp`), `.gitignore` (`/books/`, `backups/`, `.cache/`, `*.traineddata*`), `AGENTS.md`, `books/**` (git-ignored) |
| Database changes | none — source material only, never uploaded to the DB |
| API changes | none |
| Frontend changes | none |
| Seed/import changes | none — `books/` is a local authoring source, not an import record. Import records for anything derived from it go under `docs/data-imports/` |
| Migration | `none — no schema change` |
| Verification | `pnpm books:index` → `books/cbse/class-10/science/qc.json` regenerated 2026-09-25T21:49Z: 15 chapters, 232 pages, 494,989 text chars, 232 screenshots, 185 embedded images; OCR 232 pages, avg confidence 89.25, text-layer↔OCR similarity 0.947, 4 low-agreement pages. `books/` confirmed absent from `git status` |
| Known issues | 4 low-agreement OCR pages (`00-prelims` p6, `99-answers` p3 + others — cover/committee/answer pages with no text layer). Chapters 01–08 are vector-only, so their figures exist **only** as page screenshots |

### 2026-09-26 — Post-reset verification, test-DB isolation, and fixes

| Field | Detail |
|---|---|
| Date | 2026-09-26 |
| Task | Verify the reset end-to-end (API, web, tests), rebuild `sanro_test` from migrations so the suite is truly isolated, and fix defects surfaced by the verification |
| Reason | The reset alone was not proof of a clean baseline. Tests previously ran against `sanro_dev`; moving them to `sanro_test` exposed that the test DB had been built with `db push` (missing migration-only objects) and that the system institution name differed between seed and migration |
| Entities affected | `apps/api/prisma/prepare-test-db.ts` (new), `apps/api/prisma/seed-system.ts`, `apps/api/prisma/reset-local-data.ts`, `apps/api/prisma/env-loader.ts`, `apps/api/src/ar/ar.service.ts`, `apps/api/package.json`, `apps/api/vitest.config.ts`, `scripts/verify-empty-states.mts` (new), `docs/DATA_RESET_LOG.md`, `docs/LOCAL_DATA_RESET.md`, `docs/data-imports/README.md` |
| Database changes | `sanro_test` dropped and recreated, then all 13 migrations applied via `prisma migrate deploy` (restores the partial unique index `Institution_system_institution_singleton`); QA fixtures seeded into `sanro_test`. `sanro_dev` unchanged by this work — still Institution 1, User 1, Plan 3, Achievement 8, `_prisma_migrations` 14, everything else 0 |
| API changes | `GET /ar` fixed for callers with no institution: `ar.service.ts` used `'__none__'` as `institutionId`, which Prisma rejects on a UUID column (HTTP 500 for platform Super Admin). Replaced with `NO_INSTITUTION_ID = 00000000-0000-0000-0000-000000000000` at 4 call sites |
| Frontend changes | none — verification only (`scripts/verify-empty-states.mts`, output git-ignored under `screenshots/empty-state/`) |
| Seed/import changes | `seed-system.ts` now creates the system institution as `SANRO AI` (was `Sanro AI`), matching migration `20260921110000_sanro_ai_system_institution`. `prepare-test-db.ts` added ahead of seeding in the `test` script. Env provenance reporting fixed by importing `env-loader` before `@prisma/client` (Prisma auto-loads `apps/api/.env`) |
| Migration | none — `migrate deploy` applied the existing 13 migrations to a freshly created `sanro_test`; no migration file added or changed |
| Verification | `pnpm -r typecheck` → 6/6 pass. `pnpm --filter @sanro/api test` → 178/178 tests, 16/16 files pass. API on `:4000`: Super Admin login OK, 14 list endpoints return HTTP 200 with empty payloads. Web on `:3000`: `npx tsx scripts/verify-empty-states.mts` → 18/18 admin screens clean (screenshots + `summary.json` in `screenshots/empty-state/`). Guard tests for the reset script still abort correctly (no confirmation var, prod-like URL, `STORAGE_TYPE=s3`, `NODE_ENV=production`) |
| Known issues | `/app/content` has no `page.tsx` (only `content/ingest/`) so the bare route 404s — nothing links to it; `/app/remediation` shows "Student profile not found" when opened directly by a non-student — nav already gates it `staff && !isSuperAdmin` |

### 2026-09-26 — Clean-slate local data reset

| Field | Detail |
|---|---|
| Date | 2026-09-26 |
| Task | Clean-slate reset of the local development database to a platform-only state |
| Reason | Local dev DB had accumulated mixed demo/test data; a reproducible clean baseline was needed so development, QA fixtures, and demo data are added explicitly instead of by accident |
| Entities affected | All tenant/data tables deleted (users, institutions/memberships, curriculum Board/Grade/Subject/Chapter/Topic/Concept, ContentItem + versions/assignments/progress, Questions + options, QuestionPaper + questions, Assessments + questions/assignments/attempts/answers, Diagnosis/ConceptMastery/DiagnosticResult, remediation plans/items, PracticeSet/Answer, FlashcardRating, GamificationProfile/StudentAchievement, Notification, Session, AuditLog, Subscription/SubscriptionHistory, ImportJob/Row, ArContent + versions/activities, KnowledgeBase/KnowledgeChunk/ProcessingJob, InstitutionCurriculumAccess, ContactLead, Report, SupportTicket, PasswordResetToken, AiUsageLog). Preserved: `Plan`, `Achievement`, SANRO AI system institution (id `00000000-0000-0000-0000-00000000a5a1`, code `SANRO-AI`), `_prisma_migrations`, one bootstrap Super Admin (`admin@sanroai.com`) |
| Database changes | Data-only delete on `sanro_dev` via `apps/api/prisma/reset-local-data.ts` (guarded by `LOCAL_RESET_CONFIRMATION=reset-my-local-sanro-data`); pre-reset backup written to `backups/pre-reset/sanroai-local-pre-reset-2026-09-26-01-29.sql` (892,416 bytes, 63 tables); storage cleanup of the 6 demo GLB copies in `storage/ar/models/` (source assets in `apps/web/public/models/` preserved) |
| API changes | none — no endpoint or contract changes |
| Frontend changes | none |
| Seed/import changes | Seed split: `db:seed` = SYSTEM ONLY (Plans, system institution, bootstrap super admin); `db:seed:demo` = full demo data (opt-in); `db:seed:qa` = QA fixtures targeting `sanro_test`; `pnpm --filter @sanro/api test` seeds `sanro_test` first so the dev DB stays clean |
| Migration | none — data only, 13 migration dirs untouched (`_prisma_migrations` preserved at 14 rows) |
| Verification | Reset executed with `LOCAL_RESET_CONFIRMATION=reset-my-local-sanro-data`, exit `0` and "RESET COMPLETE — LOCAL RESET ONLY"; report `backups/pre-reset/reset-report-2026-09-25-20-12.json`. Post-verify actual counts: Institution 1, User 1, Plan 3, Achievement 8, `_prisma_migrations` 14, all other 58 `public` tables 0. Backup verified: 63 `CREATE TABLE` + 63 `COPY`, 892,416 bytes. First run aborted pre-write on the loopback check (`inet_server_addr()` returns `::1/128`); fixed to use `host(inet_server_addr())` and re-run. Storage: 6 demo GLB copies deleted, `apps/web/public/models/` intact (16 files). See `docs/DATA_RESET_LOG.md` for the full record |
| Known issues | none identified yet |
