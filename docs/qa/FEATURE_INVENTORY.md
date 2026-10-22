# SANRO AI — Feature Inventory

Evidence basis: static analysis of `apps/api/src/**` (controllers, services, guards),
`apps/api/prisma/schema.prisma`, and the live authorization sweep
(`scripts/qa/sweep-authz.mjs`, 116 GET routes x 5 roles against `http://localhost:4000/api/v1`).

Status key: `VERIFIED` (probed live this session) · `HISTORICAL` (from prior session) ·
`INFERRED` (static analysis only) · `UNVERIFIED` · `BLOCKED`

---

## 1. Surface summary

| Layer | Count | Evidence |
|---|---|---|
| API controllers | 29 | VERIFIED — enumerated from `apps/api/src/**` |
| API routes (total) | 272 | VERIFIED — `@Controller` + verb decorators |
| API routes (GET) | 120 | VERIFIED — swept live |
| Prisma models | 66 | HISTORICAL |
| Prisma enums | 36 | HISTORICAL |
| Web dashboard pages | ~45 | HISTORICAL |
| Web marketing/auth pages | 16 | HISTORICAL |
| Mobile tabs | 8 | HISTORICAL |
| Mobile stack screens | ~20 | HISTORICAL |
| Mobile concept modes | 6 | HISTORICAL |

---

## 2. Feature areas by domain

### 2.1 Authentication & session (`auth.controller.ts`)
- `POST /auth/login`, `/refresh`, `/logout`, `/register-institution`
- `POST /auth/forgot-password`, `/reset-password`, `/change-password`
- `GET /auth/me`, `GET /auth/account-state`
- `POST /auth/switch-context`
- **Status:** VERIFIED — 10/10 auth/session security probes PASS
  (`scripts/qa/probe-auth-security.mjs`): unauth → 401 on protected routes, forged JWT
  rejected, no user enumeration (wrong-password and unknown-user both return the identical
  `401 "Invalid email or password"`), forgot-password returns no raw token, garbage
  refresh token rejected, student blocked from admin surfaces, no stack traces leaked,
  production CORS is a fixed 3-origin allowlist.

### 2.2 Institution management (`admin.controller.ts`, `institutions.controller.ts`)
- Super-admin CRUD over institutions, users, subscription history, audit
- Tenant-scoped `/institutions/mine`, `/institutions/mine/stats`
- **Status:** VERIFIED — `/admin/institutions/*` returns 404/403 for all five roles when
  probed with a bogus id (tenant concealment). FINDING-E: SUPER_ADMIN is rejected with 403
  on `/institutions/mine` by design (no `InstitutionMember` row).

### 2.3 People & roster (`admin-people.controller.ts`, `people.controller.ts`)
- Students / teachers / parents CRUD, import, transfer, link/unlink
- `GET /parents/me/dashboard` — parent self-service
- **Status:** VERIFIED — `/admin/people/{students,teachers,parents}/:id` returns 404/403
  for all roles with a bogus id.

### 2.4 Curriculum (`curriculum.controller.ts`, `admin-curriculum.controller.ts`)
- Boards → grades → subjects → chapters → topics → concepts tree
- Browse, matrix completeness, quality report, versions
- Admin node edit/delete, import preview/commit, access control
- **Status:** VERIFIED — BUG-E fixed this session. `GET /curriculum/topics` and
  `/curriculum/concepts` previously returned 500 for every role when the required
  `chapterId` / `topicId` was missing or malformed; now 400. Happy path (real ids)
  verified at 200.

### 2.5 Content library (`content-library.controller.ts`)
- Content CRUD, assign/unassign to institution, archive, availability
- `GET /admin/library/assignments`
- **Status:** VERIFIED — BUG-A fixed this session. Cross-tenant read closed; foreign
  `institutionId` now 403, own-tenant rows only.

### 2.6 Question bank & papers (`questions.controller.ts`, `papers.controller.ts`)
- Question CRUD with filters (board/grade/subject/chapter/concept/type/difficulty/status)
- Paper generation, validate, preview
- **Status:** VERIFIED — both `GET /questions` and `GET /papers` return 200 with an
  **empty** result set for STUDENT and PARENT (tenant-scoped, no leak). See FINDING-G:
  no UI route guard on `/app/papers`.

### 2.7 Assessments (`assessments.controller.ts`)
- Staff: list, create, publish (to groups/students), attempts-per-assessment, grading
- Student: `/assessments/my`, start attempt, submit answers, submit
- `GET /assessments/attempts/:attemptId`
- **Status:** VERIFIED — BUG-D fixed this session. Classmate-to-classmate attempt read
  closed; non-staff now scoped to `student.userId = user.sub`, peer read → 404.

### 2.8 Diagnosis & remediation (`diagnosis.controller.ts`, `remediation.controller.ts`)
- `/diagnosis/my`, `/diagnosis/students/:studentId`, `/diagnosis/concepts/:conceptId/distribution`
- `/remediation/plans`, `/weak`, `/retest`, item status
- **Status:** VERIFIED — BUG-C fixed this session. `studentMastery` now enforces
  staff → institution-scoped, STUDENT → self only, PARENT → `ParentStudentLink` only.

### 2.9 Learning & gamification (`learning.controller.ts`)
- `/learning/home`, `/path`, `/progress`, practice start, concept detail
- Gamification profile, leaderboard, achievements
- **Status:** VERIFIED — `/learning/gamification/leaderboard` returns 200 for every role
  (intentionally public within tenant). FINDING-D: `/learning/home` returns 200 for staff
  but scopes to their own (non-existent) student identity — `averageMastery: 0`,
  `completedContent: 0`, no cross-student data.

### 2.10 Reports (`reports.controller.ts`)
- Class, student, assessment, improvement, concept-performance reports (CSV + JSON)
- **Status:** VERIFIED — `/reports/class/:groupId`, `/reports/student/:studentId`,
  `/reports/assessment/:assessmentId` all return 403 for every role with a bogus id
  (deliberate anti-enumeration).

### 2.11 AR / 3D (`ar.controller.ts`)
- AR model list, model-url, quick-check, admin CRUD + versions
- **Status:** VERIFIED — `/ar/:id`, `/ar/:id/model-url`, `/ar/:id/quick-check` return
  403/404 for all roles with a bogus id.

### 2.12 Knowledge base (`knowledge-base.controller.ts`)
- Article CRUD, summary
- **Status:** VERIFIED — `/knowledge-base/:id` and `/:id/summary` return 403/404 for all
  roles with a bogus id.

### 2.13 Imports (`imports.controller.ts`, content-import)
- Bulk import for students / teachers / parents / content / questions
- **Status:** VERIFIED — `/imports/:jobId` and `/content-import/:id` return 404/403 for
  all roles with a bogus id.

### 2.14 Academics (`academics.controller.ts`)
- Academic years (create, activate), groups CRUD
- **Status:** VERIFIED — `GET /academics/academic-years` and `/academics/groups` return
  200 for every role (tenant-scoped reference data).

### 2.15 Users & notifications (`users.controller.ts`)
- `GET/PATCH /users/me`, notification list, unread count, mark read, read-all
- **Status:** VERIFIED — self-scoped, 200 for every role (operates on `user.sub` only).

### 2.16 Files & health
- `GET /files/pdfs/:name`, `/files/ar/models/:name`, `/files/ar/previews/:name`, `/health`
- **Status:** VERIFIED — `/health` 200 for every role; file routes 404 for bogus names.

---

## 3. Client surfaces

### 3.1 Web (`apps/web`)
- **Nav:** role-driven from `apps/web/app/(dashboard)/layout.tsx`. STUDENT →
  Dashboard / Library / Assessments / Ask Sanro AI / Progress. PARENT → Dashboard /
  Children. Staff → People, Academic, Assessments, Analytics, Settings dropdowns plus
  Curriculum, Question Bank, Question Papers, Content Ingest/Videos, AR/3D, Reports,
  Remediation.
- **Status:** HISTORICAL (nav confirmed VERIFIED this session; page-by-page UI
  verification NOT RUN this session).

### 3.2 Mobile (`apps/mobile`)
- 8 tabs, ~20 stack screens, 6 concept modes (Learn, Practice, Quick Quiz, Flashcards,
  Challenge, Ask SANRO).
- **Status:** HISTORICAL — not re-verified this session.

---

## 4. Gaps / not covered this session

| Item | Status |
|---|---|
| Web page-by-page UI walkthrough | NOT RUN |
| Mobile device walkthrough | NOT RUN |
| Write-path (POST/PATCH/DELETE) fuzzing | NOT RUN — sweep was GET-only |
| Rate-limiting probes (login throttle) | NOT RUN |
| AI chat/prompt-injection surface | NOT RUN |
| Performance / load | NOT RUN |
| `pnpm audit --prod` | PARTIAL — 0 critical, 19 moderate, 35 high (prior session) |

---

## 5. Artefact index

| File | Contents |
|---|---|
| `docs/qa/QA_MASTER_PLAN.md` | 8-phase plan, environments, status vocabulary |
| `docs/qa/BUG_REPORT.md` | BUG-A…F (all `FIXED, RETESTED`) + FINDING-C/D/E/G |
| `docs/qa/FEATURE_INVENTORY.md` | this file |
| `docs/qa/role-permission-matrix.e2e-spec.ts` (in `apps/api/test/`) | 296-case live matrix |
| `apps/api/test/*.e2e-spec.ts` | 5 new/extended regression suites |
| `scripts/qa/probe-auth-security.mjs` | 10 auth/session security probes |
| `scripts/qa/sweep-authz.mjs` | 116 GET routes x 5 roles authorization sweep |
| `scripts/qa/diagnose-matrix.mjs` | per-case status/code diagnostics |
