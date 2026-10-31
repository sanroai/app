# Bug Report — SANRO AI QA

Statuses: `PASS` · `FAIL` (reproduced) · `FIXED, RETESTED` · `BLOCKED` · `PARTIAL` · `NOT RUN`

Evidence: live probes against `http://localhost:4000/api/v1` (dev, `sanro_dev`); regression suites in `apps/api/test/`.

---

## BUG-A — Cross-tenant read of content assignments (security)

- **Severity:** High (OWASP A01 / broken access control / IDOR)
- **Status:** `FIXED, RETESTED`
- **Feature:** `GET /admin/library/assignments`
- **Roles:** any `TEACHER` / `INSTITUTION_ADMIN` (class-gated `@Roles(SUPER_ADMIN, INSTITUTION_ADMIN, TEACHER)`)
- **Files:** `apps/api/src/content-library/content-library.service.ts` (`listAssignments`)

### Reproduction
1. Log in as a TEACHER belonging to tenant A.
2. `GET /admin/library/assignments?institutionId=<tenant-B-uuid>`.

### Expected
403 — the caller may only read their own institution's assignments. Sibling method
`assign()` already enforces exactly this at `content-library.service.ts:321`.

### Actual (before fix)
`200` with tenant B's rows. Proven with a synthetic tenant (`11111111-…-111111111111`)
and a seeded platform content item — the teacher in tenant A received the row
`"Melting, Boiling and Condensation"`.

Root cause: `const scope = institutionId;` was taken straight from the query string and
passed to `prisma.contentAssignment.findMany({ where: { institutionId: scope } })` with
no comparison against `user.institutionId`.

### Fix
Resolve scope defensively: reject a foreign `institutionId` with 403, and default to the
caller's own institution when none is supplied. Super admin retains platform-wide read.

### Regression
`apps/api/test/content-library-assignments.e2e-spec.ts` (6 tests, passing) — provisions a
real second tenant, proves the foreign read is denied, and asserts own-tenant rows only.

---

## BUG-B — Malformed `:id` returns 500 instead of 400 (robustness)

- **Severity:** Medium (no data exposure, but a contract/API-hygiene defect on every `:id` route)
- **Status:** `FIXED, RETESTED`
- **Feature:** all `:id` routes that reach Prisma with a non-UUID param
- **Files:** `apps/api/src/common/filters/all-exceptions.filter.ts`

### Reproduction
`GET /api/v1/<any-resource>/not-a-uuid` with a valid token, e.g.
`/admin/institutions/not-a-uuid`, `/students/not-a-uuid`, `/questions/not-a-uuid`,
`/papers/not-a-uuid`, `/assessments/not-a-uuid`, `/content/not-a-uuid`,
`/knowledge-base/not-a-uuid`, `/ar/not-a-uuid`, `/academics/groups/not-a-uuid`.

### Expected
`400 VALIDATION_ERROR`.

### Actual (before fix)
`500 {"code":"INTERNAL_ERROR","message":"Something went wrong"}` on **11 of 12** probed
routes (only `POST /remediation/items/:id/status` returned 400, because its service
validates before the DB call). Root cause: Prisma throws `P2023` ("invalid character …
expected an optional prefix of `urn:uuid:`") when a value must be a UUID; the
`AllExceptionsFilter`'s final `else` branch maps every non-`HttpException` to 500.

### Fix
`AllExceptionsFilter` now maps Prisma `P2023` → `400 VALIDATION_ERROR`
("Invalid identifier: expected a UUID."), without leaking the raw Prisma message.

### Verification
All 12 probed routes now return `400`. Regression unit spec
`apps/api/src/common/filters/all-exceptions.filter.spec.ts` (4 tests, passing) covers the
P2023→400 mapping, that genuine faults still 500, that internal messages are never
leaked, and that `HttpException` status/code pass through.

---

## BUG-C — Horizontal IDOR on student diagnosis (security)

- **Severity:** High (OWASP A01 / broken access control / IDOR — PII exposure)
- **Status:** `FIXED, RETESTED`
- **Feature:** `GET /diagnosis/students/:studentId`
- **Roles:** any authenticated user with an institution binding (STUDENT, PARENT, TEACHER, INSTITUTION_ADMIN)
- **Files:** `apps/api/src/diagnosis/diagnosis.service.ts` (`studentMastery`)

### Reproduction
1. Log in as any `STUDENT` (or `PARENT`) in an institution that has ≥2 students.
2. `GET /diagnosis/students/<a-classmate's-id>`.

### Expected
- `STUDENT` → only their own record.
- `PARENT` → only children linked via `ParentStudentLink`.
- `TEACHER` / `INSTITUTION_ADMIN` → any student in their own institution.

### Actual (before fix)
`200` for **any** student in the caller's institution, regardless of role. The controller
declared no `@Roles`, and `studentMastery()` only checked
`where: { id: studentId, institutionId }` — institution-scoped but not relationship-scoped.

Proven live with a synthetic peer student: a `STUDENT` reading a classmate's diagnosis
received the peer's **full `Student` record**, exposing
`email`, `phone`, `gender`, `dateOfBirth`, `rollNumber`, `grade`, `status` plus mastery,
history and weakness count. A `PARENT` likewise read an unrelated student.

### Fix
Added `assertCanReadStudent()`: staff pass (institution-scoped), `STUDENT` must match
their own resolved identity, `PARENT` must hold a `ParentStudentLink` to the target;
otherwise `403`. No client currently calls this route (students use `/diagnosis/my`,
parents use `/dashboard/parent`), so no functional regression — the hole was API-only.

### Regression
`apps/api/test/diagnosis-scoping.e2e-spec.ts` (9 tests, passing) — provisions a tenant
with two students and a parent linked to only one; asserts own/linked → 200,
peer/unlinked → 403 with no PII in the body, staff → 200, super admin → 403,
unknown id → 404, cross-tenant → 403/404.

---

## BUG-D — Horizontal IDOR on assessment attempt detail (security)

- **Severity:** High (OWASP A01 / broken access control / IDOR — PII + assessment-result exposure)
- **Status:** `FIXED, RETESTED`
- **Feature:** `GET /assessments/attempts/:attemptId`
- **Roles:** any authenticated user holding an institution binding (STUDENT, PARENT, TEACHER, INSTITUTION_ADMIN)
- **Files:** `apps/api/src/assessments/assessments.service.ts` (`attemptDetail`)

### Reproduction
1. Log in as `STUDENT` A in a tenant that has ≥2 students.
2. Note the id of a **peer** student's submitted attempt.
3. `GET /assessments/attempts/<peer-attempt-id>` as student A.

### Expected
- `STUDENT` → only attempts they own.
- `TEACHER` / `INSTITUTION_ADMIN` → any attempt in their own institution.

### Actual (before fix)
`200`. The scope was built as
`attemptWhere.OR = [{ student: { institutionId: resolvedId } }, { student: { userId: user.sub } }]`,
and because a `STUDENT` is themselves institution-bound, `resolvedId` was truthy — so the
first `OR` branch matched **any** student in the tenant. `isStudentOwner` only redacted
`showResult` / `correctAnswer` / `student`; the peer's `name`, `rollNumber`, `userId`,
`score`, `marksAwarded`, `isCorrect` and `yourAnswer` were still returned.

Proven live with a synthetic classmate account reading Aarav Sharma's submitted attempt:
received `student: { id, name "Aarav Sharma", rollNumber "R1001", userId }` and
`score 14/20` with no staff role.

### Fix
Only staff (`INSTITUTION_ADMIN` / `TEACHER` / `SUPER_ADMIN`) keep the institution-wide
`OR` branch; every other role is scoped to `student.userId = user.sub`.

### Regression
`apps/api/test/attempt-read-scoping.e2e-spec.ts` (5 tests, passing) — provisions a tenant
with two students and one submitted attempt; asserts owner → 200, classmate → 404 with no
peer identity or score in the body, IA → 200, unknown id → 404.

### Note
This is the same root cause family as BUG-C (institution-scoped `where` mistaken for
ownership-scoped). Recommend a repo-wide sweep for `institutionId` used as an access
scope on read paths.

---

## BUG-E — Unvalidated required query params cause 500 on curriculum reads (robustness)

- **Severity:** Medium (no data exposure; a contract/API-hygiene defect, same P2023 family as BUG-B)
- **Status:** `FIXED, RETESTED`
- **Feature:** `GET /curriculum/topics`, `GET /curriculum/concepts`
- **Roles:** every role — the failure is pre-authorization-agnostic (500 for all five)
- **Files:** `apps/api/src/curriculum/curriculum.controller.ts`

### Reproduction
1. Sign in as any role (teacher used here).
2. `GET /api/v1/curriculum/topics` with **no** `chapterId`.
3. `GET /api/v1/curriculum/concepts` with **no** `topicId`.

### Expected
`400 VALIDATION_ERROR` — a missing/invalid required filter is a client error.

### Actual (before fix)
`500 {"code":"INTERNAL_ERROR","message":"Something went wrong"}` for **every** role.
Confirmed by the full authorization sweep (`scripts/qa/sweep-authz.mjs`, 116 GET routes
x 5 roles), which flagged exactly these two routes as 5xx for all five roles.

Root cause: the controller typed the params as required (`chapterId: string`) but passed
them to the service with no pipe, and the service forwarded them straight to
`prisma.chapter.findUnique({ where: { id: chapterId } })`. With the param absent,
Prisma received `undefined` and threw `P2023` (malformed UUID), which the global filter
was still mapping to 500 at the time.

### Fix
Applied the existing `ZodValidationPipe` to both `@Query` params as
`z.string().uuid()`. `ZodValidationPipe` already imports `BadRequestException`, so a
missing or malformed value is rejected at the boundary with the standard
`VALIDATION_ERROR` body.

### Verification (live, after fix)
| Case | Before | After |
|---|---|---|
| `/curriculum/topics` (real chapter) | 200 | **200** (happy path intact) |
| `/curriculum/concepts` (real topic) | 200 | **200** (happy path intact) |
| `/curriculum/topics` (no `chapterId`) | 500 | **400** |
| `/curriculum/topics?chapterId=not-a-uuid` | 500 | **400** |
| `/curriculum/concepts` (no `topicId`) | 500 | **400** |
| `/curriculum/concepts?topicId=not-a-uuid` | 500 | **400** |

### Same-family sweep
Checked every other `@Query('<param>')` in the codebase for the same un-piped pattern:
`admin-people.search`, `curriculum.boardId`, `knowledge-base.q`,
`reports.institutionId`. All four are **optional** filters, so a missing value is
undefined-by-design, not a malformed-UUID throw. No other route in the family 500s.

---

## BUG-F — Invalid Prisma filter in a regression spec's fixture (test defect)

- **Severity:** Low (test-only; no production code involved)
- **Status:** `FIXED, RETESTED`
- **Feature:** `test/learning-path.e2e-spec.ts` → `POST /remediation/retest` →
  "does not let staff create a retest for another institution"
- **Files:** `apps/api/test/learning-path.e2e-spec.ts`

### Reproduction
Run the full API suite:
```
pnpm --filter @sanro/api test
```
One of 561 tests fails; the other 560 pass.

### Expected
The cross-tenant assertion passes: `POST /remediation/retest` with a student from a
different institution returns `403` (the service's `studentBelongs()` throws
`NotFoundException` → the test accepts `403` or `404`).

### Actual (before fix)
The test's own fixture threw before it ever made the HTTP call:
```
PrismaClientValidationError: Invalid `prisma.institutionMember.findFirst()` invocation:
  where: { userId: { not: null } }
Argument `not` must not be null.
```
`InstitutionMember.userId` is a **non-nullable** `String @db.Uuid` (verified in
`apps/api/prisma/schema.prisma`), so `{ not: null }` is an invalid filter for Prisma.
An earlier edit in this session moved the same invalid pattern onto the non-nullable
`institutionId` column, which failed identically — confirming the column was not the
issue, the `{ not: null }` construct was.

### Fix
Dropped the meaningless filter entirely — the fixture only needs *any* staff membership
whose `institutionId` differs from the stray student's:
```ts
const teacherMembership = await prisma.institutionMember.findFirst({
  select: { institutionId: true },
});
```
The sibling `{ id: { not: studentId }, institutionId: { not: null } }` query in the same
test is left untouched: `Student.institutionId` **is** nullable (`String?`), so that
filter is legal and intentional (it looks for a stray cross-tenant student).

### Regression
`test/learning-path.e2e-spec.ts` → **22/22 passing**. Full suite → **561/561 passing**
across 27 files.

### Note
Pre-existing latent defect, not introduced by this session's fixes — it only surfaced
because the test-ordering shifted when new spec files were added to the suite.

---

## BUG-G — Teacher Reports page rendered wrong/NaN data (web↔API data-contract defect)

- **Severity:** Medium (user-visible wrong data on a staff dashboard; no security impact)
- **Status:** `FIXED, RETESTED`
- **Feature:** web `GET /app/reports` (teacher/IA view) backed by `GET /dashboard/teacher`
- **Files:** `apps/web/app/(dashboard)/app/reports/page.tsx`

### Reproduction
1. Sign in as `TEACHER` (`teacher@sanroai.com`).
2. Open **Analytics → Reports** (`/app/reports`).

### Actual (before fix)
The page's declared TypeScript types did not match what `GET /dashboard/teacher`
actually returns (`apps/api/src/dashboard/dashboard.service.ts` → `teacherHome`).
Live payload inspected 2026-10-19:

| Page expected | API actually returns | Effect |
|---|---|---|
| `classes[].avgMastery` | *(absent)* | **`NaN%`** in the "Avg Mastery" stat card; `undefined%` badge |
| `classes[].studentsNeedingHelp` | *(absent — nested `strugglingStudents[]`)* | "Need Help" stat always `NaN` |
| top-level `topStudents[]` / `strugglingStudents[]` | nested **per class** | both lists permanently "No student data yet" |
| `subjectStats[].subject` | `name` (+ `subjectId`) | `key={undefined}` → React *"unique key prop"* warning; blank label |
| `subjectStats[].totalStudents` | `totalQuestions` / `contentCount` | CSV export wrote `undefined` |

Console (captured by `scripts/qa/web-walkthrough.mts`): *"Each child in a list should
have a unique `key` prop … Check the render method of `ReportsPage`"* and *"Received
`NaN` for the `children` attribute"*.

This is the same defect family as the earlier mobile data-contract bugs (0 XP /
`NaN%`): the client declared a shape the server never returns.

### Fix
Corrected the page's types to the real contract (`ClassStudent`, `RecentAssessment`,
`ClassSummary` with nested `topStudents`/`strugglingStudents`, `SubjectStat`), flattened
the nested student lists across classes, derived the stat cards from real fields, and
fixed the `key` to `subjectId`. `weakConcepts` is typed **optional** because the server
omits it on `topStudents` (only `strugglingStudents` carry it).

### Regression (self-caught)
The first pass called `s.weakConcepts.join(', ')` unguarded on `topStudents`, which
crashed the page (`Cannot read properties of undefined (reading 'join')`) — caught by
re-verifying with a real screenshot rather than trusting the typecheck. Guarded all
`.join()` call sites; `tsc --noEmit` clean.

### Verification (live, after fix)
`scripts/qa/verify-reports-fix.mts` + screenshot
`artifacts/qa/2026-10-19/screenshots/teacher-desktop-app-reports-FIXED.png`:
**0 console errors/warnings**, no `NaN`, no `undefined`. Stat cards render
`Total Students 1 / Avg Mastery 32% / Need Help 1 / Classes 1`; Class Performance shows
`Class 10 - A · 1 need help · Top: Aarav Sharma (63%)`; Subject Overview shows
`Science 63%`, `Mathematics 0%`; Top Performers and Students Needing Attention both
list Aarav Sharma with real mastery and weak concepts.

---

## BUG-H — Library video thumbnails 404 for stale YouTube IDs (cosmetic, external)

- **Severity:** Low (cosmetic; broken image icon on some Library cards)
- **Status:** `FIXED, RETESTED`
- **Feature:** web `GET /app/library` card thumbnails
- **Files:** `apps/web/app/(dashboard)/app/library/page.tsx` (`ItemCard`; builds
  `https://i.ytimg.com/vi/<videoId>/hqdefault.jpg` from `item.videoId`)

### Observation
The walkthrough logged **10 × HTTP 404** on the student Library page. Captured exact
URLs (`scripts/qa/verify-reports-fix.mjs`): all are external
`https://i.ytimg.com/vi/<id>/hqdefault.jpg` for 10 video IDs whose thumbnails no longer
exist (deleted/private videos). The `/content/browse` API itself returns **200** with 24
items — **no API or app defect**.

### Fix (2026-10-19)
`ItemCard` tracks a `thumbFailed` state and renders the existing type-icon fallback on
`<img onError>`, so a stale/404 thumbnail degrades to the meta icon instead of a
broken-image glyph. No new dependencies, no asset replacement — reuses the card's own
fallback branch.

### Retest
`npx tsx scripts/qa/verify-library-thumb-fix.mts` → **PASS**: 12 images, **0 broken**
(`naturalWidth === 0`). The 10 network-level ytimg 404s still occur (thumbnails are gone
upstream) but no longer render as broken images. Console errors are the browser's own
resource-load 404 notices, not app exceptions. Screenshot:
`artifacts/qa/2026-10-19/screenshots/web-library-BUGH-FIXED.png`.

### Residual / content hygiene (fully scoped by the P12 audit — BLOCKED, content owner)
The P12 audit upgraded this from "10 stale IDs" to a systemic finding: **all 24
distinct** YouTube embeds behind the 69 seed `VIDEO` lessons are dead (oEmbed 404 for
every one of the 24 IDs; sampled watch pages return `playabilityStatus:ERROR`; live
controls — Rick Astley / Me at the zoo / Gangnam Style — returned 200 in the same run,
so the probe is sound). Source: `apps/api/prisma/seed.ts:2061-2130` recycles fabricated
placeholder IDs across ~70 lesson titles (e.g. a statistics lesson mapped to a
chemistry video). Thumbnails fall back gracefully thanks to this bug's fix, but the
**embeds play nothing** — replacing them with real, curriculum-aligned CBSE videos is a
**content-owner decision (BLOCKED)**; not auto-replaced, because putting
wrong-but-playing teaching material in front of students is worse than a visible gap.
Production state unknown (read-only probe gated: gateway 404 without credentials).

---

## BUG-I — Staff nav exposed the SUPER_ADMIN-only "Curriculum" console (UI↔API authz mismatch)

- **Severity:** Low–Medium (UX/authorization mismatch; no data exposure — the API correctly
  returned 403, but staff saw a dead link + error banner)
- **Status:** `FIXED, RETESTED`
- **Feature:** web dashboard nav + `GET /app/curriculum`
- **Files:** `apps/web/app/(dashboard)/layout.tsx` (nav), `apps/web/app/(dashboard)/app/curriculum/page.tsx`

### Reproduction
1. Sign in as `TEACHER` or `INSTITUTION_ADMIN`.
2. The left nav's Academic section shows **Curriculum**.
3. Click it → `/app/curriculum` calls `GET /admin/curriculum`, which is
   `@Roles(Role.SUPER_ADMIN)` only (`admin-curriculum.controller.ts:22`).
   Result: the page renders an **error banner (403)** instead of content.

### Actual (before fix)
The nav is the mirror image of FINDING-G: there the API exposed data the UI should not
show; here the **UI exposed a link the API forbids**. `academicLinks` in
`layout.tsx` listed `/app/curriculum` for all `staff`, but the page is a SUPER_ADMIN
management console ("Manage boards, grades, subjects, chapters and concepts") whose primary
fetch and every create/update/delete mutation require SUPER_ADMIN. TEACHER and
INSTITUTION_ADMIN therefore saw a working-looking nav entry that always failed.

### Fix
One-line nav conditional in `layout.tsx`, consistent with the existing pattern (the sibling
`Content → /app/content-processing` entry is already `isSuperAdmin`-gated):

```ts
...(isSuperAdmin ? [{ href: '/app/curriculum', label: 'Curriculum', icon: Layers }] : []),
```

Staff reach curriculum through **Library → Browse by subject** (`/app/library/subjects`),
which uses the read-only `/curriculum/*` routes available to their roles. No API change, no
behaviour change for SUPER_ADMIN.

### Verification (live, after fix)
`scripts/qa/verify-nav-fix.mts` (Playwright, real logins):
`TEACHER` nav shows Curriculum = false, `INSTITUTION_ADMIN` = false, `SUPER_ADMIN` = true,
**3/3 PASS**, 0 console errors on the dashboard for all three roles.

---

## BUG-J — Duplicate create returned 500 instead of 409 (Prisma P2002 unhandled)

- **Severity:** Medium (any duplicate write across 29 unique constraints crashed with an
  opaque 500; same defect family as BUG-B)
- **Status:** `FIXED, RETESTED`
- **Feature:** every create/update path that hits a `@@unique` constraint
  (demonstrated on `POST /academics/academic-years`)
- **Files:** `apps/api/src/common/filters/all-exceptions.filter.ts` (+ `.spec.ts`)

### Reproduction
1. Sign in as `INSTITUTION_ADMIN`.
2. `POST /academics/academic-years` with `{ name, startDate, endDate }` → **201**.
3. Repeat the identical request → **500 `INTERNAL_ERROR`**.

### Root cause
`AcademicYear` declares `@@unique([institutionId, name])` (`schema.prisma:523`). The second
create throws Prisma **P2002** (unique-constraint violation). `AllExceptionsFilter` mapped
P2023 (malformed UUID) to 400 but had **no P2002 branch**, so it fell through to the final
`else` → 500 `INTERNAL_ERROR`. The schema declares **29 `@@unique` constraints**, so every
duplicate write on any of those models (institution code, student email, group name, board
grade, subject code, chapter code, topic name, concept name, …) had the same crash.

### Fix
Added an `isUniqueViolation()` helper (mirroring the existing `isMalformedUuid()`) and a
branch mapping **P2002 → 409 CONFLICT** with a clean, non-leaking body
(`{ code: 'CONFLICT', message: 'A record with the same unique values already exists.' }`).
Raw constraint details (model/field values) are deliberately not echoed. Added a regression
test in `all-exceptions.filter.spec.ts`, plus a test asserting genuine faults (P2025) still
return 500 rather than being masked.

### Verification (live, after fix)
`node scripts/qa/fuzz-write-path.mjs` → `WP-K-DUPLICATE`:
first create **201**, second **409** (`{"code":"CONFLICT",...}`). Full API suite
**563/563 PASS** (27 files) — the 2 new spec cases included; repo-wide `pnpm -r typecheck`
**6/6**. QA-owned duplicate rows cleaned from `sanro_dev` (restored to 1 academic year).

---

## BUG-K — Mobile "Week Warrior" achievement badge rendered as an empty green square (cosmetic)

- **Severity:** Low (visual polish only; data and layout otherwise correct)
- **Status:** `FIXED, RETESTED`
- **Feature:** mobile Home → Achievements strip (`apps/mobile`, gamification badges)
- **Files:** `apps/mobile/components/visuals.tsx` (`resolveAchievement`, `BADGE_ICONS`), `apps/mobile/components/visuals.test.tsx` (new)
- **Evidence:** `artifacts/qa/2026-10-19/screenshots/mobile-05-home-scrolled.png` (before)

### Reproduction
1. Sign in as STUDENT on the Android build (`com.sanro.ai`).
2. On Home, scroll to the **Achievements** horizontal strip.
3. Four badges show: First Steps ✅, First Assessment 🎯, On Fire 🔥, **Week Warrior — an empty green rounded square with no emoji/icon**.

### Root cause
The seed (`apps/api/prisma/seed-system.ts:55`) sets Week Warrior's `icon: 'zap'`, but
`BADGE_ICONS` had no `zap` entry and there is no `zap.png` asset. Worse, the fuzzy matcher
self-matched (`'zap'.includes('zap') === true`), so it returned `'zap'` instead of falling
back to the `'glowing-star'` default; `Icon3D` returns `null` for unregistered names →
an empty square. The same latent defect affected `clock` (Speed Demon) and would affect
any unknown icon.

### Fix (2026-10-19)
1. Added `zap: 'sparkles'` and `clock: 'hourglass'` to `BADGE_ICONS` (existing 3D assets,
   no new dependencies, no asset replacement).
2. Hardened `resolveAchievement`: empty keys short-circuit to the `'glowing-star'`
   default, and the resolved name is validated via `hasIcon3D` so an unregistered icon
   can never render as a blank square again.

### Retest
`pnpm --filter @sanro/mobile test` → **12/12 PASS** (was 5/5; +7 new regression cases in
`components/visuals.test.tsx` covering `zap`, `clock`, unknown, null/empty, existing
mappings, case-insensitivity, and non-empty guarantee). Typecheck and lint clean.

---


## BUG-L — AR activity telemetry looped into a request storm (client defect)

- **Severity:** High (hundreds of spurious POSTs per page view; rate-limit DoS on a
  shared endpoint; permanent "Loading 3D model..." spinner masking real state)
- **Status:** `FIXED, RETESTED`
- **Feature:** web concept page `AR / 3D` tab (`ConceptArPanel` + `Model3DViewer`)
- **Files:** `apps/web/components/ar/Model3DViewer.tsx`, `apps/web/components/ar/ConceptArPanel.tsx`

### Root cause
`Model3DViewer`'s load effect listed `onReady`/`onError` in its dependency array while
`ConceptArPanel` passed an inline arrow (`onReady={() => recordActivity.mutate(...)}`).
Every mutate updated React Query state -> rerender -> new callback identity -> effect
re-ran -> `setStatus('loading')` + `onReady()` -> mutate ... a self-sustaining loop
(amplified by StrictMode double-effects). The same cycle reset `status` to `loading`
forever, so the spinner never resolved.

### Actual (before fix)
One page load on the grade-10 "Surface Areas" concept: `POST /ar/:id/activity`
**201 x23, then 429 x475** (+500 OPTIONS preflights; console aggregate 429 x6278),
while the viewer stayed on "Loading 3D model...".

### Fix
- Callbacks stored in refs; effect deps reduced to `[src, attempt]`.
- Native `load`/`error` element listeners drive `status` (no reliance on framework
  custom-element event props).
- `startedRef` dedupe so `AR_STARTED` fires once per model (mirrors `openedRef`).
- Server unchanged: the existing rate limiter correctly absorbed the storm (429).

### Verification (live, after fix)
Reloaded AR tab: activity POSTs **2 per page load, stable**; `model-viewer.loaded=true`;
spinner resolves; error state now reachable via the native `error` listener instead of
being masked. Screenshot: `artifacts/qa/2026-10-19/screenshots/ar-3d-model-renders.png`.

---

## BUG-M — 3D models 404: relative `/api/v1/files/*` URLs resolved against the web origin

- **Severity:** High (AR/3D feature non-functional on web; the mobile client's asset
  URLs were equally unserved)
- **Status:** `FIXED, RETESTED`
- **Feature:** web `AR / 3D` model rendering; mobile `resolveAssetUrl` consumers
- **Files:** `apps/web/next.config.mjs` (new `rewrites()`), consumed by
  `components/ar/Model3DViewer.tsx`

### Root cause
The API returns file paths like `/api/v1/files/ar/models/sphere.glb` (relative to the
API origin). The web player passed them straight to `<model-viewer src=...>` where they
resolved against the **page** origin (`localhost:3000`) -> `GET :3000/api/v1/files/...`
-> **404** (`wl: fetch .../sphere.glb responded with 404`). Mobile already assumed the
web origin serves files (`lib/ar-assets.ts` prefixes `WEB_BASE`), but no such proxy
existed — so both clients were broken. `files/ar/models/:name` is `@Public()`, so auth
was never the issue.

### Actual (before fix)
`model-viewer` never finished loading any GLB; console `404` on every model fetch.

### Fix
`next.config.mjs` gains `rewrites()`: `/api/v1/files/:path*` -> API origin (derived
from `NEXT_PUBLIC_API_URL`, default `https://api.sanroai.com`). Same-origin proxying
also removes CORS/Range concerns for progressive GLB loads and fixes mobile's
`WEB_BASE`-prefixed asset URLs wherever the web domain fronts them.

### Verification (live, after fix)
`GET http://localhost:3000/api/v1/files/ar/models/sphere.glb -> 200`;
`model-viewer.loaded=true` (918x360; hotspots "Radius (r)"/"Diameter (2r)" rendered).
Gates: typecheck 6/6, web 22/22.

---

## BUG-N — Mobile concept mode tab bar was crushed by flex-shrink, slicing every label

- **Severity:** High (the mode bar - Learn / Practice / Quick Quiz / Flashcards / Challenge / AR / 3D / Ask Sanro AI - was unreadable on tall modes; AR / 3D was unreachable without scrolling)
- **Status:** `FIXED, RETESTED`
- **Feature:** mobile concept screen (`apps/mobile/app/concept/[conceptId].tsx`)
- **Files:** `apps/mobile/app/concept/[conceptId].tsx` (tab bar + content scroll view styles)

### Root cause
The content `ScrollView` had no `style`, so RN gave it `flexBasis = content height`. A tall
mode (the AR panel mounts a 320dp WebView plus cards) pushed the column past the screen, and
flex-shrink then squeezed the **sibling** tab bar (a `ScrollView` inherits `flexShrink: 1`).
The pills' fixed 16dp padding survived, but the 13dp label box was crushed to **9dp**
(27px at 3x density), so Android clipped the glyphs through the middle. Short modes
(Learn) overflowed by only a few dp, which is why the bug looked intermittent.

### Actual (before fix)
`uiautomator` bounds: label TextViews were **27px** tall inside 75px buttons ("Flashcards",
"Challenge", "AR / 3D" all sliced horizontally through the text). Visible in
`artifacts/qa/2026-10-20/screenshots/device-07-pillrow-crop.png`.

### Fix
- `tabBar: { flexGrow: 0, flexShrink: 0, ... }` - the mode bar never shrinks.
- The content `ScrollView` now has `style={styles.contentScroll}` (`flex: 1`), so its basis
  is 0 and it cannot pressure its siblings.
- `tabBarContent` gets explicit left/right/vertical padding so the last pill is not flush
  against the screen edge.

### Verification (live, after fix)
New harness `scripts/qa/device-tab-check.ps1` drives all 7 modes on the physical device and
measures each rendered label: **53-68px in every mode, portrait AND landscape**
(broken state: 27px). Evidence: `artifacts/qa/2026-10-20/screenshots/device-tab-*.png`.

---

## BUG-O — pnpm overrides were silently inert (npm-style field in a pnpm repo)

- **Severity:** Medium (security overrides never applied; the control looked real but did nothing)
- **Status:** `FIXED, RETESTED`
- **Feature:** dependency hardening (`pnpm audit --prod`)
- **Files:** `package.json` (removed the npm-style `overrides` block), `pnpm-workspace.yaml`
  (new `overrides:` - pnpm >=10 reads them from here)

### Root cause
The root `package.json` carried a top-level `"overrides": { tar, proxy-addr, shell-quote }`
block - that is **npm's** format. pnpm ignores it: the lockfile had **no** `overrides:`
section and the installed versions were the un-pinned ones (`tar` 7.5.22 vs the pinned
7.5.19, `shell-quote` 1.12.0 vs 1.11.0). A previous session's hardening was a no-op.

### Fix
Moved the pins into `pnpm-workspace.yaml` under `overrides:` and added 12 audit-driven pins
there (multer 2.4.0, postcss 8.5.31, sharp 0.35.5, markdown-it 14.3.1, linkify-it 5.0.2,
brace-expansion per-minimatch-major, deepmerge-ts 8.0.0, fast-uri 3.1.8,
decode-uri-component 0.5.0, postcss-selector-parser 7.1.6, tar/proxy-addr/shell-quote).

### Verification
`pnpm-lock.yaml` now records an `overrides:` section; `pnpm peers check` reports
**no peer dependency issues** (it reported one before); `pnpm audit --prod` fell from
**22 high / 17 moderate / 1 low** to **4 high / 3 moderate / 0 low** (all remaining ones
have no upstream patch or need a major/ESM break - see EXECUTION_LOG P13).

---

## BUG-P — Seed kept stale lesson videos, so dead embeds survived every re-seed

- **Severity:** High (every video lesson in the product pointed at a non-existent YouTube video)
- **Status:** `FIXED, RETESTED`
- **Feature:** library video lessons (`apps/api/prisma/seed.ts` -> `videoUrls`)
- **Files:** `apps/api/prisma/seed.ts`, `scripts/qa/source-video-lessons.mjs`, `scripts/qa/apply-video-sources.mjs`

### Root cause
Two layers:
1. The map pointed 64 VIDEO lessons at **24 fabricated ids** (recycled across unrelated
   subjects - a statistics lesson mapped to a chemistry video). Every id returned 404 from
   `youtube.com/oembed` and `i.ytimg.com`.
2. The seed **skips content that already exists** (`if (existsContent) { ... continue; }`),
   so even after the map was corrected a database that already held the rows kept the dead
   URLs forever - the fix never reached the data.

### Fix
- Sourced a real video for every lesson: YouTube search -> oEmbed (exists + embeddable) ->
  thumbnail check -> relevance scoring against the lesson's concept/chapter/grade
  (`scripts/qa/source-video-lessons.mjs`). **70/70 lessons resolved, 0 unresolved.**
- The seed now **refreshes** a seeded row whose url/description no longer match the map
  instead of skipping it, so the data self-heals on the next seed.
- Applied to the seed, `sanro_dev` and `sanro_test`.

### Verification
`scripts/qa/verify-video-liveness.mjs` - dev **67/67 distinct ids alive with working
thumbnails**, test **67/67** (was 0/24). The browser walkthrough now reports **0 pages with
dead thumbnails** (was 2) and **0 console errors**.

---

## BUG-Q — Leaderboard period filter was accepted and ignored

- **Severity:** Medium (the Weekly / Monthly / All-time pills looked interactive but
  weekly/monthly/all returned identical rows)
- **Status:** `FIXED, RETESTED`
- **Feature:** gamification leaderboard (`apps/api/src/learning/learning.service.ts`)
- **Files:** `apps/api/prisma/schema.prisma` (new `XpEvent` ledger), 2 migrations,
  `apps/api/src/assessments/assessments.service.ts`, `apps/api/src/learning/learning.service.ts`,
  `apps/api/test/leaderboard-period.e2e-spec.ts`

### Root cause
XP was only ever a lifetime counter on `GamificationProfile`, with no history, so a period
scoped leaderboard was impossible - and the API accepted `period` and ignored it.

### Fix
- Added an **XP ledger** (`XpEvent`: student, xp, reason, createdAt) with two migrations
  (`add_xp_event_ledger` + an idempotent backfill from the lifetime counters, so prod picks
  up existing XP on deploy).
- Every XP award now writes a ledger row; the leaderboard sums the ledger per window
  (7 days / 30 days / all) and falls back to the counter for profiles that predate the ledger.
- The mobile client's `allTime` period name is normalised, and the ledger is the single
  source of truth so `xp` and `totalXp` can never disagree.

### Verification
New e2e spec `leaderboard-period.e2e-spec.ts` (4 cases) - a 3-day-old, 20-day-old and
90-day-old award must appear in weekly/monthly/all exactly as expected. Live check on the
dev data now shows three different podiums: weekly Rohan 300, monthly Aarav 420,
all-time Priya 900.

---

## BUG-R — Mobile cold start queried the API before the token was restored

- **Severity:** Medium (after any cold start the app showed 0 XP, 0% mastery and endless
  spinners instead of the student's data)
- **Status:** `FIXED, RETESTED`
- **Feature:** mobile API client (`apps/mobile/lib/api.ts`)
- **Files:** `apps/mobile/lib/api.ts`, `apps/mobile/app/leaderboard.tsx`

### Root cause
`apiAuthed` read the token from the Zustand store immediately, but SecureStore restores it
asynchronously. Queries whose `enabled` flag did not check the token (e.g.
`enabled: !!period`) fired before hydration, threw `Not authenticated`, and **react-query
cached that error** - the screen then stayed empty for the rest of the session.

### Fix
`apiAuthed` now awaits the first hydration before using the token, so no request can be
made before the token exists. The mobile leaderboard additionally renders a real error
state and a real empty state instead of an endless spinner (using the repo's existing
`EmptyState`).

### Verification
Cold start on the physical device now shows the real profile (420 XP, 63% mastery, 7-day
streak) and the leaderboard renders its podium with live data.

---

## Findings — decisions & status

C/D/G/H were resolved in the 2026-10-19 implementation batch (product-owner sign-off;
see `DECISION_TABLE.md`). E/I/J below remain informational or are separate concerns.

### FINDING-C — `/auth/me` omits top-level `institutionId`
- **Severity:** Low (contract inconsistency, no functional break)
- **Status:** `DECIDED (C-B)` — keep response unchanged; **no code change**
- `POST /auth/login` and the JWT claims both carry `institutionId`, but
  `GET /auth/me` returns `{ id, email, phone, name, …, memberships }` with **no**
  top-level `institutionId`; it is only reachable via `memberships[0].institution.id`.
- Web (`apps/web/lib/auth-store.ts`) and mobile (`apps/mobile/lib/auth-store.ts`) both
  read `institutionId` from the **login** payload, so nothing is currently broken.
- **Decision (owner-approved):** keep as-is. **Zero production consumers** depend on a
  top-level `institutionId`; no spec text requires it; `content-library-assignments.e2e-spec.ts:91`
  asserts its absence. Do **not** add a redundant field without a concrete requirement.
  Verified: no doc claimed `/auth/me` returns it, so no doc correction needed.

### FINDING-D — `/learning/home` returns 200 for staff
- **Severity:** Informational (no leak observed)
- **Status:** `DECIDED (D-B)` — keep self-scoped `200`; **no code change**
- `GET /learning/home` returns `200` for TEACHER / INSTITUTION_ADMIN / SUPER_ADMIN,
  because the route is gated only by `ParentContentGuard` (blocks parents) and not by
  `@Roles(STUDENT)`. Payload for staff scopes to their own (non-existent) student
  identity: `averageMastery: 0`, `completedContent: 0` — **no cross-student data**.
- Contrast: `/learning/gamification/profile` and `/learning/gamification/achievements`
  correctly enforce a service-level "students only" policy (403 for staff/parents).
- **Decision (owner-approved):** keep `200`. Self-scoped, no leak, matrix marks
  `LEARN-HOME denied:'lenient'` — already within contract; staff may preview the student
  catalog. Not flipped to `403` merely because it isn't a staff's primary screen.
  **Re-verified live** (`diagnose-matrix.mjs`): `SA/IA/TEACHER = 200`, `PARENT = 403`.

### FINDING-E — institution-scoped routes reject SUPER_ADMIN with 403
- **Severity:** Informational (correct behaviour, noted for test authors)
- `/institutions/mine`, `/institutions/mine/stats`, `/remediation/plans`,
  `/remediation/weak`, `/ar/teacher` return `403 "Super admin is not bound to an
  institution"` / `"No institution context"` for SUPER_ADMIN. This is by design: the
  platform super admin has no `InstitutionMember` row. Recorded so the role matrix reads
  as intentional rather than as a defect.

### FINDING-G — no UI route guard on staff-only dashboard pages
- **Severity:** Low (defense-in-depth; no data exposure observed)
- **Status:** `DECIDED (G-A)` → `FIXED`, `RETESTED`
- `/app/papers` rendered for **any** authenticated role. `apps/web/app/(dashboard)/app/papers/page.tsx`
  used `useRole()` only for cosmetic conditional rendering (line 22, hiding the "New paper"
  button for `SUPER_ADMIN`) — there was no `role !== 'TEACHER' …` permission wall, and no
  reusable `RoleGuard` component exists anywhere in `apps/web`.
- In-app navigation never exposes the link: `app/(dashboard)/layout.tsx` places
  `Question Papers` inside `academicLinks`, which is rendered only for staff. The gap was
  reachable only by typing the URL directly (a student/parent saw a dead "New paper" button
  that would `403` on click).
- **Decision (owner-approved) & fix:** added a **staff-only render-guard** (`TEACHER` /
  `INSTITUTION_ADMIN` / `SUPER_ADMIN`) to `/app/papers`, reusing the existing
  `content-processing` `useAuthStore` "Access Denied" pattern. Students/parents are blocked;
  the existing "New paper" button logic already excludes `SUPER_ADMIN`, so authorized
  creators (`POST @Roles(IA, TEACHER)`) are unchanged. API `@Roles` remains the actual
  security boundary — this is UX defense-in-depth only.
- **Regression:** unit test `papers/page.test.tsx` **7/7**; browser probe
  `scripts/qa/probe-papers-guard.mts` **5/5** (student/parent blocked; teacher/principal/admin
  allowed); full web suite **22/22**.

### FINDING-H — `forbidUnknownValues` claim applies only to the class-based pipe
- **Severity:** Low (documentation/contract discrepancy; no escalation — behaviour is secure)
- **Status:** `DECIDED (H-A)` → `FIXED` (docs), validation behaviour unchanged
- `AGENTS.md` §Security stated "**Validation**: Zod schemas on 13+ endpoints,
  `forbidUnknownValues: true`". Verified: that flag is set **only** on NestJS's
  class-based `ValidationPipe` (`apps/api/src/main.ts:47`,
  `{ whitelist: true, transform: true, forbidUnknownValues: true }`). The custom
  `ZodValidationPipe` (`apps/api/src/common/pipes/zod-validation.pipe.ts`) — used on
  **98** `@Body`/`@Query` parameters across 18 controllers — does **not** set it and calls
  `schema.safeParse(value)` directly.
- Consequence: Zod's default `z.object()` **strips** unknown keys rather than rejecting
  them, so a request like `{ message, evil, role: 'ADMIN' }` to `POST /ai/chat` is
  accepted (`200`) with the extras dropped, not rejected with `400`. A few schemas opt into
  `.strict()` to reject (admin-curriculum ×1, content-ingest ×2).
- Proven secure (`scripts/qa/probe-ai-surface.mjs` → `AI-C-NOESCALATE`): the extras are
  stripped from `result.data` before the controller sees them, and the AI role is derived
  server-side from the authenticated subject (`ai.controller.ts:62` →
  `effectiveRole(user.role)`), **never** from the body. So there is **no privilege escalation
  and no data leak**; strip neutralizes mass-assignment.
- **Decision (owner-approved):** option **(b)** — correct the docs; do **not** change secure
  validation behaviour without a requirement. `AGENTS.md:106` and
  `docs/MASTER_PRODUCT_SPEC.md:195` rewritten to state unknown keys are **stripped** by
  default (`.strict()` where rejection is required). Spec amendment approved per its morale rule.
- **Regression:** existing strip test (`validation.constraints.e2e-spec.ts:61` login
  `bogusField` → `200`) + **new** strict test (`POST /admin/curriculum/access` unknown key →
  `400`) ⇒ suite **8/8**; write-path fuzz **11/11** (guards/mass-assignment hold).

### FINDING-I — rate limiting verified enforced (informational, positive result)
- **Severity:** None (recorded so the limits are documented as tested, not assumed)
- **Status:** `PASS`
- Live probes (`scripts/qa/probe-rate-limit.mjs`, **5/5 PASS**) confirm the documented
  per-route throttles are actually enforced in the running dev API:

  | Route | Documented | Observed | Enforced |
  |---|---|---|---|
  | `POST /auth/login` | 10/min | 10×`401` then `429`,`429`,`429` | ✓ |
  | `POST /auth/forgot-password` | 3/min | 3×`400` then `429`,`429` | ✓ |
  | `POST /auth/register-institution` | 5/min | 5×`400` then `429`,`429` | ✓ |
  | `POST /site/contact` | 3/min | 3×`400` then `429`,`429` | ✓ |

- The `429` body is clean and contract-compliant:
  `{"code":"RATE_LIMITED","message":"Too many requests. Please try again later.","requestId":…}`
  with a `Retry-After: 60` header — no stack traces, no internals, no credential echo.
- Global default is `RATE_LIMIT_MAX=120` / `RATE_LIMIT_TTL_MS=60000`
  (`apps/api/src/config/app.config.ts:36-37`) via the global `ThrottlerGuard`.

### FINDING-J — AI surface probed; live-provider injection resistance NOT RUN
- **Severity:** Informational (scope/limitation record)
- **Status:** `PARTIAL` — controller/service boundary PASS; live-LLM behaviour NOT RUN
- The local API runs with **no `AI_*` env configured** (`apps/api/.env` holds only
  `DATABASE_URL`/`DATABASE_URL_TEST`), so `AI_PROVIDER` defaults to `'mock'` and
  `AI_API_KEY` is empty (`apps/api/src/config/app.config.ts:25-28`). The remote path is
  therefore never exercised.
- `scripts/qa/probe-ai-surface.mjs` → **12/12 PASS** against the controller/service
  boundary: documented response shape `{reply,grounded,sources}`; no key leakage; Zod
  validation rejects empty/missing/oversized(>2000)/non-string `message` with `400`;
  malformed `context.conceptId` → `400`; **prompt-injection markers are never reflected
  or executed** (5 vectors: ignore-previous-instructions, DAN/jailbreak, env-var/system
  override, `<script>` payload, repeat-above-line) and the response shape is unchanged;
  an unknown/foreign `conceptId`+`questionId` leaks no content (no cross-tenant context
  leak); PARENT is blocked by `ParentContentGuard` → `403`; `/ai/explain` without ids →
  `404`; unauthenticated → `401`; TEACHER → `200`; and no `5xx` on unicode/control-char/
  SQL-ish input (resilience).
- **Limitation:** these probes validate the deterministic mock provider and the guard/
  validation/scoping layer only. Actual LLM prompt-injection resistance, provider
  timeout/failure fallback, and output-validation behaviour of a real provider
  (`openai`/`gemini`) are **NOT RUN** — they require a configured `AI_API_KEY`, which is
  intentionally absent here and would need a separate approved operation.

## BUG-S - YouTube in the mobile WebView failed with "player configuration error (153)" then "This video is unavailable (152-4)"

**Severity:** P0 - no lesson video ever played in the app (the primary student experience).

**Found:** on the physical device, while driving the concept page.

**Symptom:** the Learn tab's video card showed YouTube's "Video player configuration error /
Error 153", and after the first fix attempt "This video is unavailable / Error code: 152 - 4".
The video itself was fine (oEmbed 200, correct title) - the *embed* was the problem.

**Root cause:** the player loaded `https://www.youtube.com/embed/<id>` as a top-level
document inside a WebView. A top-level navigation sends no `Origin`/`Referer`, so YouTube
cannot build a player configuration (153). Making the wrapper's origin youtube.com itself is
also rejected, because YouTube will not embed inside YouTube (152-4). The same failure is
reported for Flutter's `youtube_player_iframe` (identical symptom, video plays in the phone's
Chrome but not in the app).

**Fix** (`apps/mobile/components/YouTubePlayer.tsx`):
- load a small HTML wrapper with a real https `baseUrl` we control
  (`https://app.sanroai.com`) and pass the **same** origin in the embed's `origin=`
  parameter, with `enablejsapi=1` and `autoplay=1`;
- block `intent://`, `market://` and `youtube://` navigations so the embed cannot hand the
  student over to the YouTube app mid-lesson;
- add an explicit "Open in YouTube" fallback (a school network can block the embed, but never
  the YouTube app).

**Verification:** `scripts/qa/device-video-play.ps1` opens a concept on the phone, taps play
and fails if the player reports a configuration error. On the device the video now *plays*
(the lesson renders and advances). VERIFIED.

---

## BUG-T - The practice session crashed on submit (foreign-key violation) - the core loop was broken

**Severity:** P0 - Practice is the ASSESS -> DIAGNOSE edge; every submit returned a 500.

**Found:** on the device, when the student submitted a practice session:
`POST /api/v1/learning/practice/<id>/submit` -> `Foreign key constraint violated on the
constraint: DiagnosticResult_attemptId_fkey` (500, `mastery.service.ts:113`).

**Root cause:** `applyAttemptEvidence` always wrote the attempt id into
`DiagnosticResult.attemptId`, which references an **assessment attempt**. A practice set is
not an assessment attempt, so the write violated the foreign key and the whole submit threw.

**Fix:**
- `DiagnosticResult.practiceSetId` (nullable) + relation, with a migration
  (`20261021131500_add_diagnostic_result_practice_source`) - practice evidence is now linked to
  the practice set, assessments stay linked to the attempt, and provenance is preserved;
- `applyAttemptEvidence(studentId, { attemptId, practiceSetId }, evidence)` makes the source
  explicit at all three call sites.

**Verification:** `apps/api/test/practice-flow.e2e-spec.ts` (3 cases) - start, answer,
submit, then assert: no 500, the evidence row is linked to the practice set with a **null**
attemptId, the XP ledger has the award, and a second submit is rejected with 409. VERIFIED.

---

## BUG-U - The UI promised XP that was never awarded, and a second activity reset the daily streak

**Severity:** P1 - product integrity.

**Found:** while deciding which concept modes to keep.

**Two defects:**
1. *False promises.* The concept page showed "+25 XP" (Quick Quiz), "50 XP max" (Challenge) and
   "5 XP" (Practice), but only **assessments** ever awarded XP. Quick Quiz was client-side, so
   its score never reached the server at all.
2. *Streak bug.* The award code computed "is this the next day?" by adding 24h to
   `lastActiveAt` and comparing dates, so a second activity **on the same day** matched the
   *next* day and reset `streakDays` to 1.

**Fix:** one implementation in `apps/api/src/common/xp.ts`:
- practice now awards **5 XP per correct answer + 10 XP for finishing**
  (`PRACTICE_COMPLETED` in the XP ledger), and assessments use the same helper;
- the streak rule is calendar-day based: same day = keep, yesterday = extend, older = restart;
- the UI copy now states exactly what is awarded, and the modes that made false promises were
  cut.

**Verification:** the practice e2e asserts the ledger amount equals the returned `xpEarned`
and that the lifetime counter moves by the same amount; the device run showed 420 -> 430 XP
after one practice. VERIFIED.

---

## BUG-V - The web practice never persisted its answers, so every practice scored zero

**Severity:** P0 - the core loop produced a wrong score on the web.

**Found:** while driving the practice flow in a browser after fixing the mobile crash.

**Symptom:** the quiz rendered and submitted, but the result was always 0%. The server grades
the answers it has **stored** (`PracticeAnswer` rows), and the web screen only kept the
answers in React state - it never called `POST /learning/practice/:id/answer`.

**Fix:** the web practice screen now persists every answer through
`useSavePracticeAnswer`, sending the option **text** (the value the server grades).

**Verification:** driving the real screen in a browser now stores the answers and the submit
returns a real score; `practice-flow.e2e-spec.ts` asserts the same path from the API side.
VERIFIED.

---

## BUG-W - The mobile app sent the option id, so every mobile answer was graded wrong

**Severity:** P0 - mobile practice and **every mobile assessment** scored zero, so the
diagnosis/mastery chain never moved on the device.

**Found:** reading the grading code while fixing BUG-V.

**Root cause:** `gradeObjectiveResponse` compares the submitted answer with
`question.answer`, which holds the **text** of the correct option. The mobile clients sent
the option **id** (a uuid), so the comparison never matched. The API also could not accept a
written answer at all on mobile: the question card printed *"Type an answer (free response)"*
with **no input field**, so written questions (25 short + 6 long in the seed) were
unanswerable - exactly the "unable to type answer of questions" report.

**Fix:**
- the mobile practice and assessment screens send the option **text**;
- `QuizQuestionCard` renders a real `TextInput` for free-response questions (typed answers
  are saved on blur and flushed before submit);
- the API normalises an option **id** to its text (`normaliseAnswerToOptionText`) so no
  client can silently mark a correct answer wrong;
- written answers are excluded from the score and the mastery evidence - they are neither
  right nor wrong.

**Verification:** a new e2e case grades the same question with the text (correct) and with
the id (also correct, normalised); the mobile screen shows the answer field for written
questions. VERIFIED.

---

## BUG-X - The mobile app showed a blank screen when its API base URL was not injected

**Severity:** P1 - the whole app was unusable (white screen, no error).

**Found:** on the device after the servers were restarted.

**Root cause:** `API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.sanroai.com/api/v1'`.
Without the variable in the bundle the app silently calls the **production** API; when that is
unreachable, the auth gate renders nothing while it waits (`if (!hydrated) return;`) - a
white screen with no console error.

**Fix:** `apps/mobile/.env` (git-ignored) now sets the local API and web origins, so every
Metro start inlines them. The rule is documented in `AGENTS.md`.

**Verification:** the bundle now inlines `http://localhost:4000/api/v1` and the app renders
normally on the device. VERIFIED.

---

## BUG-Y - 21 of 70 lesson videos were content-free clips (8-103 seconds)

**Severity:** P1 - content quality.

**Found:** the duration audit (`scripts/qa/audit-video-durations.mjs`), which reads the real
length from the video because oEmbed does not report one.

**Evidence:** 21 videos under two minutes (8s, 9s, 12s, 15s ...); the median of the rest was
501s, so the short ones were outliers, not a style choice.

**Fix:** the sourcing pipeline now reads the candidate duration and **rejects anything under
120s**, and the seed stores the **real** duration instead of an invented number (the lesson
cards showed "10 min" for videos of every length).

**Verification:** after re-sourcing, **70/70 videos are >= 120s** (shortest 123s, median
903s), all alive with thumbnails. VERIFIED.

---

## BUG-Z - Round-2 review findings (independent audit, 2026-10-22)

An independent read-only review of the learning flow found the defects below. The two P0s
were **silent wrong grades** - the student saw a confident red result and their mastery was
damaged, with no error anywhere.

### BUG-Z1 (P0) - MULTI_SELECT and TRUE_FALSE were always graded wrong on mobile
The mobile question card rendered every option list as single-select and sent one option
text. The API grades a MULTI_SELECT answer by parsing a JSON array of option texts, so a
single text failed to parse -> `selected = []` -> recorded **wrong** even when the student
was right. The web assessment screen had the mirror problem: MULTI_SELECT fell into the
textarea branch, and TRUE_FALSE was a textarea on web but options on mobile.
**Fix:** the card is type-aware (options for MCQ/TRUE_FALSE, toggles + a JSON array for
MULTI_SELECT) and the web assessment screen switches on the question type. VERIFIED by the
fix agent's typecheck + tests.

### BUG-Z2 (P0) - the last web answer was posted AFTER the submit
The web practice screen fired the answer save and returned immediately, while the API grades
the answers it has **stored**. The Submit button sits one tap from the last answer, so on a
slow link the final answer was still in flight when the submit landed -> the last answer
counted as wrong (wrong score, wrong mastery, no XP).
**Fix:** the in-flight saves are tracked and awaited before the submit, and a failed save
now surfaces a banner instead of silently changing the score.

### BUG-Z3 (P1) - the practice e2e test passed for the wrong reason
The test posted `answerId` while the endpoint reads `answer`, so every answer was stored
as null and the suite passed on the completion bonus alone - the "5 XP per correct answer"
rule was not actually covered. The test now sends the option **text** and asserts the exact
amount (`correct * 5 + 10`). VERIFIED.

### BUG-Z4 (P1) - the XP award was not atomic
The lifetime counter and the ledger row were two separate writes: if the ledger write failed,
the counter and the leaderboard (which reads the ledger) disagreed - the exact thing the
ledger was introduced to prevent. The streak was a read-modify-write, so two concurrent
awards could both write the same value and under-count it.

### BUG-Z5 (P1) - XP could be farmed and a zero-score assessment did not count as activity
Submitting a practice set the student never answered still paid the 10 XP completion bonus
(and advanced the streak) because the bonus was keyed on "the set has questions". A zero-mark
assessment, on the other hand, did not touch the activity date at all, so the streak meant
"days with a non-zero activity" while the UI said "days with a streak".

### BUG-Z6 (P1) - the mobile attempt autosave fired on every keystroke
The 15 s autosave interval was a dependency of the answers state, so every keystroke tore the
effect down (which fired a save) and started a new timer - one request per keystroke, and the
cleanup's async save could be lost on unmount.

### BUG-Z7 (P2) - several smaller ones
the web practice "Practice Again" button re-opened the *completed* set (a dead end); the web
practice page showed an infinite skeleton without a token; the mobile practice screen had no
error state and an unguarded Submit button (a double tap fired two submits, the second
returning 409 and showing a failure alert on a successful attempt); the mobile attempt
screen keyed its options by an id the API strips; the flashcard counter claimed "of 10"
while the deck walked every question; the flashcard flip target was a `<div onClick>` with
no keyboard access; the leaderboard loaded the whole XP ledger on every request; a
pre-ledger profile showed its **lifetime** XP under "This Week"; and the student's "mark
complete" action on the web remediation page called a staff-only endpoint (403).

### BUG-AA (P0) - the class-8/9 curriculum merge produced a computed property key
The fragment merge inserted the new chapter arrays as `[SCIENCE, { ...new chapters }]: [ ... ]`.
That is a *computed key*: it evaluates to the string `"[object Object]"`, so the class block had
no `Science` property at all. Consequences: `CURRICULUM['8'].Science` was `undefined` (the seed
crashed on class 8), and the six new class-8 chapters plus their lessons existed in the file but
never in the data. Found by reading the curriculum back rather than by diffing the seed.
`scripts/qa/merge-seed-fragments.mjs` now opens the array at the bracket *after* the constant
(`subjectStart + '[SCIENCE]: ['.length - 1`) and appends inside it.

### BUG-AB (P0) - one stray comma made the seed die at runtime
A merged line left `,` alone on its own line inside `contentNodes`. In an array literal that is
an *elision*: `arr.length` was 289 while the array had 288 own entries, so the seed's
`for (const c of contentNodes)` yielded `undefined` and threw
`TypeError: Cannot read properties of undefined (reading 'grade')`. **The file parses** - this is
a semantic hole, not a syntax error - so a parse check (which is what the merge and the class-9
agent both ran) could not catch it. The seed is now executed in the release gate; a diagnostic
that walks `arr.entries()` names the index.

### BUG-AC (P1) - class-10 mathematics pointed at the wrong textbook PDF
The 2026 class-10 maths book has 14 chapters (*Constructions* was rationalised out), but the seed
still had 15 codes: `MAT-10-12` "Areas Related to Circles" resolved to `jemh112.pdf`, which is
*Surface Areas and Volumes*. A student clicking "textbook" on *Areas Related to Circles* read the
wrong chapter. The codes are realigned with the book
(`scripts/qa/align-class10-maths.mjs`); *Constructions* became `MAT-10-15` and is the one chapter
without a PDF (the route answers 404 and the hub hides the button).

### BUG-AD (P1) - a demo assessment title was double-encoded, visible on the dashboard
`Matter in Our Surroundings ÃƒÆ’Ã†â€™Ãƒâ€ ...` - UTF-8 bytes decoded as Latin-1 in the seed source.
The seed also created a second row every time the title changed (the title was its idempotency
key), so the database held two copies. The title is now the chapter's own name, the existing row
is renamed in place, and `scripts/qa/clean-garbled-assessments.mjs` removed the garbled/stale
duplicates.

### BUG-AE (P2) - renamed chapters kept their old lessons in the library
The seed only upserts, so the 87 lessons of the 15 renamed chapters stayed: the class-9 chapter
*Cell: The Building Block of Life* listed "Rutherford's Gold Foil Experiment Explained", and
*A Square and A Cube* listed four rational-numbers videos. `scripts/qa/prune-stale-lessons.mjs`
compares the database with the seed's `contentNodes` (PLATFORM-owned rows only, so a teacher's
content is never touched) and the database now holds exactly 144 + 144 lessons.

### BUG-AF (P2) - the AR set silently skipped a renamed chapter
`seed-ar.ts` named the class-8 chapter `Matter and its Properties`; after the rename the 3D model
was skipped on every run ("chapter not found"). The reference now uses the book's title and the
AR seed reports 8/8 instead of 7 updated + 1 skipped.

### BUG-AG (P2) - the profile page offered student-only gamification to parents and teachers
`/app/profile` rendered the XP / day-streak / mastery tiles, the learning-progress card and the
Achievements card for *every* role, and `useAchievements()` had no guard, so a parent's profile
fired `GET /learning/gamification/achievements` and got a 403 - the walkthrough had been filing
that as "EXPECTED RBAC", but the card it left behind ("0 earned - 0 remaining, complete learning
activities to earn achievements") is not an expected state, it is a broken one. Gamification is
student-only; the dashboard already knew that (it lives in `StudentContent`), the profile page did
not. `useAchievements` now takes `{ enabled }`, the card is rendered inside `isStudent ? ... : null`
next to the XP tiles, and the mobile Me tab - which showed the same three blocks to every role,
with zeroed numbers - is gated the same way. The mobile Home tab also fired five student-only
queries for a parent (`/learning/home`, `/assessments/my`, `/diagnosis/my`, the gamification
profile and learning progress); they now take `{ enabled: isStudent }` too, so a parent opening
the app makes no request that answers 403.

### BUG-AH (P0) - the seed and the database carried double-encoded UTF-8, so students read "â€™" for "’"
The same class of defect as BUG-AD, but at scale: `seed.ts` held 188 lines of CP1252 mojibake
(`â€™` for `’`, `Ã¢â‚¬â€œ` for `–`, `â€œ` for `“`), and every re-seed copied it into the database -
**19 concept names, 39 question texts, 7 question options, 19 question answers and 30 lesson
descriptions**. It was visible to students: a class-9 concept read *"Zero, the Bakhshali
Manuscript and Brahmaguptaâ€™s Rules"*, a class-10 English question offered *"A personâ€™s work
expresses who they are"*, and a science option read *"Erwin SchrA?dinger"*.
`scripts/qa/fix-encoding.mjs` repairs it properly: the text is re-encoded to CP1252 bytes and
decoded as UTF-8, a string is only touched when that round-trip is exact and reduces the
mojibake, and the pass repeats for double-encoded rows. Concept names are unique per topic, so a
repaired name that collides with an existing concept is **merged** into it (questions repointed)
instead of renamed. A sweep of every text/varchar column in the schema (143 columns) now returns 0
mojibake rows; that sweep is the regression check. `--apply` also writes the repaired seed.

### BUG-AI (P1) - stale concepts outlived their chapter realignment (duplicates in the same topic)
`prune-stale-topics.mjs` (BUG-AE's sibling) removes whole topics the curriculum spec no longer has,
but a chapter that kept its topic while an old topic merged into it left two concept rows with the
same meaning in one topic - the mojibake duplicate of BUG-AH and the correctly spelled row.
`scripts/qa/prune-stale-concepts.mjs` compares every concept against the spec key
`${grade}|${chapter}|${topic}|${concept}`, repoints the questions of a stale row to the same-named
concept when exactly one exists, then deletes it; a concept still referenced by progress rows is
kept rather than forced out. Class-9 mathematics went from 118 to 116 concepts and the platform
from 1028 to 1009, with 0 stale rows left and 0 questions orphaned.

### BUG-AJ (P2) - the AR 3D "atom" model pointed at a concept that no longer existed (and the wrong chapter)
`seed-ar.ts` attached `Atom - Subatomic Structure` to the class-8 biology chapter *The Invisible
Living World* under the concept *Subatomic Particles*, which is not in the 2026 book. The seed
printed `1 skipped (missing curriculum)` on every run - the model was invisible to every student -
and the item was mismatched even when it did resolve. It now targets class-9 Science, *Journey
Inside the Atom*, concept *Atomic Number and Mass Number*: `AR content seed: 0 created, 8 updated,
0 skipped`. A skipped AR item is a silent failure; that run line is the only signal.

### BUG-AK (P2) - the walkthrough failed a public page whenever `next dev` compiled it cold
`page.goto` resolves with a `null` response when the dev server aborts the first navigation while
it compiles the route, and the walkthrough treated `httpStatus === null` as a hard FAIL - `/login`
failed on the first run against a fresh dev server while the same page answered 200 to
`Invoke-WebRequest` and to a second Playwright navigation. The harness now retries a
null-response navigation twice before recording it, on both the public and the role passes, so a
cold compile can no longer masquerade as a broken page.

### BUG-AL (P1) - the practice result card paired the cumulative mastery level with the attempt score
The card renders one standing as `"<level> — <score>%"`, but the two numbers came from different
places: `applyAttemptEvidence` returns `score` = this attempt (`correct / questions`) and
`level` = the level for the **cumulative** mastery, and `learning.service.ts` built
`masteryUpdate` from exactly that pair. A student who had 2 of 7 questions right (29%,
`NEEDS_INTERVENTION`) answered one question correctly and read **"NEEDS INTERVENTION — 100%"** —
on the phone and on the web, because both render `masteryUpdate`. The evidence was right
(`ConceptMastery.score` = 29); only the card was lying. `applyAttemptEvidence` now also returns
`combinedScore` (the number it persists), and `masteryUpdate` / `masteryUpdates` carry that, so
the level and the percentage always describe the same standing; the attempt score stays where it
belongs, in `score` / `accuracy`. The label reads `— N% overall` on both platforms to say which
number is which. Locked by `practice-flow.e2e-spec.ts` → *"reports the cumulative standing beside
the mastery level, not the attempt score"*, which asserts the payload equals the stored row.

### BUG-AM (P2) - the on-device harnesses deep-linked to a concept the curriculum no longer had
`device-tab-check.ps1` and `device-video-play.ps1` hard-coded
`ConceptId = 0a375db4-4f29-4d26-89e6-2d8850d75b58`. That concept was deleted by the class-10
realignment, so the deep link opened a 404 screen: the tab check reported *"the concept page never
rendered its mode bar"* and the video check had nothing to play — a failure that looked like an
app regression but was a stale fixture. Both scripts now resolve the demo student's weakest
concept from `GET /learning/path` (`next.conceptId`, the same concept the Home tab offers as
"Fix This") and still accept `-ConceptId` to pin one. With that, all three device checks pass on a
physical Android 10 device: smoke (app launches, student Home renders), tab check (Learn /
Practice / Ask Sanro AI labels all 53 px, none compressed) and video play (taps "Play Physical
Properties of Metals", no player configuration error).

### BUG-AN (P2) - the premium 3D icons never loaded on the web dashboard
`Icon3D` used `next/image` for 40 px icons served from `/public/icons`. Next emitted
`loading="lazy"`, and inside the dashboard stat grid Chromium **never issued the request at
all** - Playwright reported `complete: false` with `naturalWidth 0` and zero entries in the
network log, while the same PNG returned `200 image/png` when requested directly. The stat
cards therefore rendered without their icons until the student scrolled, and a screenshot
at rest showed empty cards. `Icon3D` now renders a plain eager `<img>` (`loading="eager"`,
`decoding="async"`): these are 20 KB local assets, so the optimiser buys nothing and the
lazy heuristic demonstrably misfires here. Verified: `complete: true`, 40x40, icons visible
in `artifacts/qa/2026-10-24/shot-main.png`.

### BUG-AO (P2) - white heading text on white artwork (unreadable hero)
Both the dashboard hero and the chapter hub hero placed white text over the banner image
behind `bg-gradient-to-r from-surface-950/90 ...`. `surface-950` **does not exist** in
`tailwind.config.ts` (the palette stops at `surface-900`), and Tailwind emits no rule for an
unknown token rather than failing, so there was no scrim at all. The dashboard greeting was
white-on-white and effectively invisible. Both heroes now use explicit stops
(`from-[#0b0614]/92 via-[#0b0614]/65 to-[#0b0614]/10`), which cannot silently disappear;
`docs/UX_REVAMP.md` records the rule.

### Observation (not a defect) - "duplicated" page in stitched screenshots
Full-viewport Playwright screenshots over the sticky header (`backdrop-filter: blur(16px)`)
render the page twice with an offset ghost. The DOM is single (`1 header`, `1 main`, `1 h1`,
11 cards) and element screenshots (`main`) plus the on-device captures are clean, so this is
a headless compositor artifact. QA captures should use element screenshots or a viewport
without the sticky blur; do not "fix" the UI for it.
