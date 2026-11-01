# AGENTS.md

## Project
Sanro AI — Multi-tenant academic platform for Indian schools (ASSESS → DIAGNOSE → FIX → RETEST → IMPROVE). CBSE Board, Classes 1-10 (Science + Mathematics).

## Planning & setup docs
- `docs/ROADMAP.md` — current plan (P0/P1/P2/CUT), research-grounded; authoritative over any roadmap text elsewhere.
- `docs/MCP_SETUP.md` — MCP server decision matrix + which servers need an OpenCode restart.
- `docs/MASTER_PRODUCT_SPEC.md` — frozen reference spec; never delete or gut.
- `docs/UX_REVAMP.md` — why the dashboard/art/icon changes look the way they do (and the capture artifacts that are *not* bugs).
- `docs/NAVIGATION_PERFORMANCE.md` — instant-navigation design (intent prefetch, idle prefetch of the next screen, route skeletons), measured numbers, and why Turbopack dev is parked.
- `docs/VIDEO_CHAPTER_MARKERS.md` — real creator chapters vs the derived concept split, and the probe that guards it.
- `docs/AI_PROVIDER.md` — Gemini wiring, measured latencies, free-tier limits (20 text/day, 0 images).
- `docs/QUESTION_BANK_GROWTH.md` — the author → validate → merge → reseed pipeline and current counts.

## Commands
```bash
pnpm -r typecheck              # Typecheck all packages (6 tasks)
pnpm --filter @sanro/api test  # Run Vitest (599 tests, 31 files) — migrates + seeds sanro_test first
pnpm --filter @sanro/api start:dev  # API on :4000
pnpm --filter @sanro/web dev        # Web on :3000
pnpm --filter @sanro/mobile dev     # Expo dev server (mobile)
pnpm --filter @sanro/mobile typecheck  # Mobile typecheck only
pnpm build                     # Full Turborepo build (6 tasks) - STOP `next dev` first: the build replaces apps/web/.next (the dev server then 404s every static asset, e.g. /_next/static/css/app/layout.css) and apps/api/dist (the nest watcher stops serving)
npx tsx scripts/screenshots.mts     # Capture all page screenshots (--role/--viewport/--out/--tabs/--login-only; one script replaces nine older ones)
npx tsx scripts/verify-empty-states.mts  # Login + screenshot 18 admin screens (servers must be running)
npx tsx scripts/verify-roles.mts student  # Also: teacher | parent — login + verify that role's pages (servers must be running)
powershell -ExecutionPolicy Bypass -File scripts/qa/device-smoke.ps1 -Label ar-check   # On-device smoke: adb reverse 4000/8081/3000 -> launch com.sanro.ai -> screencap into artifacts/qa/<date>/screenshots/
powershell -ExecutionPolicy Bypass -File scripts/qa/device-tab-check.ps1             # Drives all 3 concept modes on the phone and measures each rendered label (fails if a label is compressed)
powershell -ExecutionPolicy Bypass -File scripts/qa/device-video-play.ps1            # Plays a concept video on the phone and fails if YouTube shows a player configuration error (153 / 152-4)
node scripts/qa/device-find.mjs "Read the textbook"   # Tap targets on the phone: dumps the a11y tree and prints real x,y (screenshots are scaled, taps are not)
node scripts/qa/device-find.mjs "Practice" --tap "Practice the whole chapter"   # ...and taps the first match
node scripts/qa/mcp-postgres-check.mjs                                                # Verifies the postgres MCP end-to-end (read-only; never prints the DSN)
node scripts/qa/probe-files-proxy.mjs                                                # Edge cases for the /api/v1/files proxy (traversal, range, HEAD, scope)
node scripts/qa/verify-video-liveness.mjs sanro_dev                                    # Every VIDEO lesson must resolve to a live, embeddable video
node scripts/qa/source-video-lessons.mjs                                              # Re-source curriculum-aligned YouTube videos (search -> oEmbed -> score)
node scripts/qa/apply-video-sources.mjs                                               # Apply sourced videos to the seed + dev DB and verify liveness
node scripts/qa/probe-ar-activity-loop.mjs                                           # Regression guard for the AR activity storm (BUG-L): activity POSTs must stay <= 3 per page load
npx tsx scripts/qa/web-walkthrough.mts                                               # 69-page role/viewport walkthrough (PARTIAL = real error, EXPECTED = RBAC)
node scripts/qa/fuzz-write-path.mjs                                                   # 11 write-path safety cases (no 2xx/5xx, no leaks)
node scripts/qa/probe-auth-security.mjs                                               # 10 auth/secret-leak cases
node scripts/qa/probe-rate-limit.mjs                                                  # 5 throttle cases - run ALONE (it exhausts the login limiter)
pnpm --filter @sanro/api db:seed      # SYSTEM ONLY: Plans, achievements, system institution, bootstrap super admin
pnpm --filter @sanro/api db:seed:demo # Full demo data (opt-in)
pnpm --filter @sanro/api db:seed:qa   # QA fixtures (targets sanro_test)
pnpm --filter @sanro/api db:push      # Sync Prisma schema
pnpm reset-local-data          # Guarded LOCAL-ONLY data reset (needs LOCAL_RESET_CONFIRMATION)
pnpm books:extract -- --subject english   # Text + page screenshots + figures from NCERT PDFs -> books/ (--subject science|english|mathematics|mathematics-part2 --class 8|9|10)
pnpm books:ocr -- --subject english         # Tesseract OCR of every page screenshot + text-layer cross-check
pnpm books:index -- --subject english       # Rebuild books/.../README.md + qc.json (accuracy report)
node scripts/qa/source-video-chapters.mjs    # Real chapter markers of every lesson video (split by time)
node scripts/qa/apply-video-chapters.mjs     # Writes the markers into the seed + the database
node scripts/qa/audit-video-durations.mjs     # Real duration of every seeded video (rejects clips < 2 min)
node scripts/qa/audit-curriculum-coverage.mjs # Which chapters have a video and which lessons have a URL
node scripts/qa/audit-chapter-pdfs.mjs        # Every chapter code -> the NCERT PDF that is on disk
node scripts/qa/audit-book-alignment.mjs       # Every seeded chapter title vs the book's own title
node scripts/qa/audit-question-coverage.mjs    # Which chapters have practice questions (and which cannot be practised)
node scripts/qa/prune-stale-lessons.mjs        # Database vs seed: lessons left behind by a chapter rename (--apply deletes)
node scripts/qa/export-question-outline.mjs    # Chapters with no questions + their exact concept names (agent briefs)
node scripts/qa/validate-question-fragments.mjs --dir artifacts/qa/<date>  # Checks authored questions against the live curriculum
node scripts/qa/merge-question-fragments.mjs --dir artifacts/qa/<date>  # Merge questions-*.json into the seed + concept map
node scripts/qa/probe-practice-scoring.mjs     # Starts a practice set, answers it correctly, checks the server scores 100
node scripts/qa/align-class10-maths.mjs        # Realign the class-10 maths codes with the 2026 book (14 chapters)
node scripts/qa/merge-seed-fragments.mjs --dir artifacts/qa/<date>  # Merge a class curriculum fragment into the seed
node scripts/qa/audit-web-mobile-parity.mjs  # Fails when a student capability exists on one side only
node scripts/qa/probe-chapter-hub.mjs        # Probes the chapter hub contract (payload, PDF, practice, 404s)
node scripts/qa/probe-multi-class.mjs        # One student, several classes: home/chapters/pages/practice/chat + 403 for the class not enrolled
node scripts/qa/probe-chapter-pages.mjs      # Textbook pages: signed list, PNG bytes, 404 past the last page, 401 forged
npx tsx scripts/qa/probe-textbook-reader.mts # Web reader: "Read the textbook" opens the pages (naturalWidth > 0) + Download PDF
node scripts/qa/probe-video-segments.mjs      # Every lesson video exposes jumpable markers (real or derived); --grade 8|9
node scripts/qa/generate-concept-questions.mjs --grades 10 --target 4 --batch 5   # AI-assisted authoring (see docs/QUESTION_BANK_GROWTH.md)
node scripts/qa/build-brand-art.mjs           # Regenerate subject/chapter/dashboard artwork -> web public/art + mobile assets/art
```

Lint works: `pnpm -r lint` (ESLint 9 flat config: `eslint.config.mjs` in
`apps/api`, `apps/web`, `apps/mobile`) — currently **0 errors** with warnings only
(unused imports, `any` types, exhaustive-deps). Treat warnings as a backlog, not a gate.
Gates: `pnpm -r typecheck`, `pnpm -r lint`, `pnpm build`, and the three test suites.

## Data & databases
- Dev: `localhost:5432/sanro_dev` (`DATABASE_URL`). Tests: `localhost:5432/sanro_test` (`DATABASE_URL_TEST`).
- After 2026-09-26 clean-slate reset `sanro_dev` holds only platform rows:
  1 system institution, 1 super admin, 3 plans, 8 achievements, 16 migration rows.
  See `docs/DATA_RESET_LOG.md`, `docs/LOCAL_DATA_RESET.md`, `docs/CHANGELOG_DEVELOPMENT.md`.
- `sanro_test` must be built with `migrate deploy`, not `db push` — `db push`
  cannot create the partial unique index `Institution_system_institution_singleton`.
- Seed modes: `seed.ts` defaults to `--system`; `--demo` and `--qa` are explicit.
  Only `--system` may run against a remote host (it is the idempotent platform
  bootstrap that Railway preDeploy calls); `--demo`/`--qa` refuse non-local hosts.

## Information architecture — two menus, one spine
Shared spine: `Board → Grade → Subject → Chapter → Topic → Concept`.

| Menu | Purpose | Where |
|---|---|---|
| **Library** | Browse curriculum + content lessons, self-directed | `/app/library`, mobile `learn` tab (title `Library`) |
| **Assessments** | Concept-wise learning **Path** (ordered, stateful) + Tests tab, diagnosis-driven | `/app/assessments`, mobile `tests` tab (title `Assessments`) |

- `/app/learn` permanently redirects to `/app/library` (`next.config.mjs`).
- `GET /learning/path` returns the diagnosis-derived ordered path with
  `mastered / inProgress / notStarted` state; retests are student-triggered
  (`POST /remediation/retest`, `@Roles` includes STUDENT, `studentId`
  optional → self).
- Student content visibility is always filtered to
  `ContentStatus.APPROVED|PUBLISHED` via `ContentScopeService.buildContentWhere`.

## Classes a student may read — multi-class enrolment
A student is no longer tied to one class. `Student.grade` stays the **primary** class
(roll lists, class groups, reports) and `StudentEnrolment { studentId, grade }`
(`@@unique([studentId, grade])`) is the **set** of classes they may read. Every access check
goes through one service, `apps/api/src/common/services/student-grade-access.service.ts`:

| Account | Access |
|---|---|
| staff (any non-STUDENT role) | every class |
| student with enrolments | union of `Student.grade` + enrolments |
| student with no class on record (bulk imports) | every class — the historical behaviour |
| student with `Student.allGrades = true` | every class |

`GradeAccess.allows/assert` replaced the nine scattered `student.grade !== chapter.grade`
comparisons (home, chapter list, chapter hub, concept, path, chapter practice,
concept practice, content completion, chat, AR). Reads are filtered with
`{ grade: { in: access.grades } }` **only when `unrestricted` is false** — an empty `in: []`
would hide the whole curriculum from an unrestricted account.

Payloads carry `grades: string[]` + `allGrades: boolean` (`/learning/home`, `/learning/path`,
`/learning/progress`, `/dashboard/student`, people list/detail); people `POST/PATCH /students`
accept `grades: string[]` (the full set replaces the enrolments, a bare `grade` only adds one).
The demo account `student@sanroai.com` is `allGrades: true` so one login can open classes 1-10.
Staff edit the set from the school side: `/app/students/[id]` has a **Classes** card (badges,
"Edit classes", the primary class pinned and non-removable) driven by
`useUpdateStudentClasses` in `apps/web/lib/people-hooks.ts`. The class options come from
`GET /learning/home` (staff are unrestricted), **not** `/curriculum/boards` - that list is
super-admin only and is empty for an institution admin.
Guard: `node scripts/qa/probe-multi-class.mjs`.

Classes 1-7 carry chapters, concepts, one video lesson and questions but **no NCERT book**
(only 8-10 are extracted), so their textbook routes return `pdfUrl: null` / `count: 0` and both
clients say so instead of showing an empty reader. The primary classes do have the full three
subjects now: Science, Mathematics and English (see `## CBSE Curriculum`).

## Subject thumbnails — designed, never emoji, one picture per class
A subject card is a real photograph + the subject's accent wash + a typographic **monogram**
(`SCI` / `MAT` / `ENG`, `subjectMonogram` in `apps/web/components/subject-banner.tsx` and
`apps/mobile/lib/subject-art.ts`) with the subject name printed **under** the picture (a title
over the artwork competed with the monogram). There is no glossy 3D/emoji icon in a subject or
chapter thumbnail on either platform — a sentence-case subject name next to a small rendered
object reads as a sticker. Both platforms render the same `SUBJECT_ART` banners and the same
three letters, in the same 16:9 box. The banner artwork itself
(`scripts/qa/build-brand-art.mjs`) carries **no icon** for `subject-*` — only the photo, the
wash and the faint motif; `chapter-banner` and `dashboard-hero` still composite their own icon.

**Every class has its own image.** A subject repeats in ten classes, so one photograph made ten
identical cards. Each subject now ships ten framings (`subject-<name>-1.jpg` … `-10.jpg`, one per
class: a different crop window, zoom depth and mirror) and class *N* takes framing *N*
(`classSubjectVariant` + `subjectBannerFor` / `subjectBanner`, mirrored on both platforms), plus a
large ghost class numeral. No two classes of a subject ever show the same picture. Re-run
`node scripts/qa/build-brand-art.mjs` after changing a photo (32 files, ~80 KB each) and clear
`apps/web/.next/cache/images` so Next does not serve the old JPEGs.

## Chapter hub + chapter markers
The concept page's parent is the **chapter hub** (`/app/learn/chapters/[chapterId]` web,
`/chapter/[chapterId]` mobile). One scroll, five sections, in learning-loop order:
**Continue** (the first unmastered concept) -> **Contents** (every concept with its mastery)
-> **Learn** (the chapter's videos **split by time**, the overall chapter notes, and the
**textbook chapter PDF**) -> **Practise** (one session over the whole
chapter) -> **Ask** (Ask SANRO AI about this chapter). The API is
`GET /learning/chapters/:chapterId` (hub payload) and
`GET /learning/chapters/:chapterId/pdf` (the NCERT chapter, 404 when the book is not on disk).
`POST /learning/practice/start` also accepts `{ chapterId }`.

**The chapter PDF needs a signed link outside the web app.** The PDF route is behind the
JWT guard, and neither a browser navigation nor Android's WebView can send the bearer
token — a WebView that loads a PDF ends in Chrome's "Download unsuccessful". So
`POST /learning/chapters/:chapterId/pdf-link` (authenticated, same grade check) mints
`{ path, expiresAt }` and the public `GET /learning/pdf/:chapterId?exp&sig` serves the file
to the platform viewer. The ticket is an HMAC-SHA256 over `chapterId.exp` with
`AUTH_SECRET`, valid 10 minutes, bound to one chapter (forged/cross-chapter/expired links
are all 401). Web keeps the in-app dialog (blob fetch + **Download PDF**); mobile opens the
signed link with `Linking.openURL`. Covered by `test/chapter-pdf-link.e2e-spec.ts`.

**The textbook is read as page images inside the app.** Chrome on Android only *downloads*
a PDF, so both clients read the chapter instead of handing it off:
`GET /learning/chapters/:chapterId/pages` (authenticated, same grade check) returns
`{ count, pages: [{ index, path }], expiresAt }` where each `path` is a signed
`/learning/pdf/:chapterId/pages/:page?exp&sig` URL (same signature as the PDF, 60-minute
window — students scroll longer than they download). The public route serves
`chapters/<slug>/screenshots/pNNN.png` (1240 px, ~450 KB/page) resolved from the chapter
code by `common/books/chapter-pages.ts`, and validates the index against the files on disk
so no path is ever taken from the request. It sends
`Cross-Origin-Resource-Policy: cross-origin` — helmet defaults to `same-origin`, which makes
Chrome refuse the image on another origin (`ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`; the web
app and the API are always different origins). Web shows the pages stacked in the chapter-hub
dialog with **Download PDF** beside them; mobile has `/textbook/[chapterId]`
(`FlatList`, lazy pages, tap-to-retry) and falls back to the signed PDF when a chapter has no
rendered pages. Guards: `scripts/qa/probe-chapter-pages.mjs`,
`scripts/qa/probe-textbook-reader.mts`, `test/chapter-pages.e2e-spec.ts`.

**Chapter markers (split by time)** live on `ContentItem.segments` (JSON
`[{ title, startSeconds }]`, max 24). They are produced by
`scripts/qa/source-video-chapters.mjs` (reads YouTube's own chapter list, then the
description timestamps) and applied by `scripts/qa/apply-video-chapters.mjs` (seed + database).
The web and the mobile both render the markers under the player and seek on tap
(`postMessage` -> \`seekTo\`). They are a **vertical list** - one full-width row per
section, timestamp first, no horizontal scroller and no truncated title (a section the
student cannot see is a section they will not jump to).

**Only 86 of the 221 lesson videos actually have creator chapters** (YouTube has none for
the rest - re-scanning does not create them). Both the concept page and the chapter hub
therefore fall back to `deriveConceptSegments` (even split across the chapter's concepts,
requires >= 2 concepts, >= 120 s runtime, >= 20 s per slice), flagged `derived: true` and
labelled **"Sections · approximate"** in both clients. Markers that start past the stored
runtime are clipped (`clipSegmentsToDuration`). Guard: `node scripts/qa/probe-video-segments.mjs`.
Full reasoning: `docs/VIDEO_CHAPTER_MARKERS.md`.

**Chapter -> textbook PDF** is resolved from the chapter code: \`SCI-10-4\` ->
\`books/cbse/class-10/science/source/jesc104.pdf\`, \`MAT-9-3\` -> \`class-9/math/iemh103.pdf\`,
\`SCI-8-2\` -> \`class-8/science/hecu102.pdf\`, \`MAT-8P2-3\` -> \`class-8/math part 2/hegp203.pdf\`
(the class-8 maths book is split into two volumes, so volume 2 needs the \`MAT-8P2-n\` code).
The books are git-ignored and local-only: in production \`pdfUrl\` is \`null\` and the route 404s
unless the NCERT books ship with the API.

## Web <-> mobile parity (one rule)
Every **student-facing** capability exists on both platforms with the same behaviour and the
same numbers; authoring and administration stay web-only by design. Both clients call the
**same API** - a missing capability is an API gap, not a mobile gap. The living parity table,
the accepted differences and the sweep procedure are in `docs/PARITY_POLICY.md`. When a
feature is added, it lands on both platforms in the same change.

## Gamification XP ledger + leaderboard scopes
`GamificationProfile.xp` is the **lifetime** counter; `XpEvent` (student, xp, reason,
createdAt) is the **ledger** every award is written to. The leaderboard
(`GET /learning/gamification/leaderboard?period=weekly|monthly|all&groupId=`) sums the
ledger over the window (weekly = **calendar week**, Monday local - not a rolling 7x24h),
optionally scoped to one class, and returns the caller's permitted scopes in `groups`
so the UI can offer *Whole school* / *Class X* without another request. The ledger is
the single source of truth so `xp` and `totalXp` can never disagree. Covered by
`apps/api/test/leaderboard-period.e2e-spec.ts`. The `.env` loader lives once in
`apps/api/src/common/api-env.ts` (re-exported from `prisma/env-loader.ts`).

## Content-type taxonomy — 17 → 6 canonical
Browse, query and authoring accept only
`VIDEO · NOTES · WORKSHEET · INTERACTIVE · EXAMPLE · OTHER`.
**`OTHER` is surfaced in UI as the label "Resource"** — there is deliberately no
`RESOURCE` enum value (label-only). Legacy values fold at read time via
`apps/api/src/common/content/content-types.ts` (`canonicalContentType`,
`canonicalTypeMembers`, `mergeCanonicalCounts`):
ARTICLE/READING/PDF → NOTES · MODEL_3D/GAME/AR → INTERACTIVE ·
QUIZ/PRACTICE_SET/IMAGE/REVISION/FLASHCARDS → OTHER.
The Prisma enum keeps all 17 values **on purpose**: `RemediationItem.contentType`
legitimately writes `PRACTICE_SET`/`QUIZ` as plan-step markers, so no enum-recreate
migration. Facet counts merge to canonical keys, so `facets.byType` and item
`type` always agree (see `content-browse.e2e-spec.ts`).

## Bulk imports (5 entity types)
`entityType` ∈ `STUDENTS | TEACHERS | PARENTS | CONTENT | QUESTIONS`.
Seat gate applies only to `STUDENTS/TEACHERS/PARENTS`. Audit actions:
`STUDENT_IMPORTED / TEACHER_ADDED / PARENT_CREATED / CONTENT_CREATED /
QUESTION_GENERATED`. Column contracts: `docs/IMPORTS.md`.

## Build Order
Always build shared packages first: `@sanro/types` → `@sanro/validation` → `@sanro/config` → API → Web.

## Dependency overrides (pnpm)
**Overrides live in `pnpm-workspace.yaml` under `overrides:`** - pnpm >=10 reads them from
there. A top-level `"overrides"` field in `package.json` is **npm's** format and pnpm
silently ignores it (this already cost us one security control - see BUG-O in
`docs/qa/BUG_REPORT.md`). After changing overrides: `pnpm install` → check that
`pnpm-lock.yaml` now contains an `overrides:` section → `pnpm peers check` →
`pnpm audit --prod`. `apps/api` has `postinstall: prisma generate` so a dependency
re-resolution can never leave the Prisma client un-generated.

## Mobile App (apps/mobile)
- Expo SDK 53 / React Native 0.79.6 / expo-router 5 / React 18.3.1 — primary student experience (P0)
- 5-tab shell: Home / Library / Assessments / Ask Sanro AI / Me; concept page has **3 modes** (Learn, Practice, Ask Sanro AI) - AR / 3D lives inside Learn as an "Interactive 3D Model" card, and Practice is a single graded quiz (Flashcards were cut 2026-10-30), not a mode of its own
- **Every pushed screen has a visible back arrow.** `concept/[conceptId]` and `ask/[conceptId]` used to set `headerShown: false` while `chapter`, `textbook`, `practice` and `attempt` showed the native stack header; they now show it too (title `Concept` / `Ask Sanro AI`), so a student inside a concept can always go back
- **Multi-role tabs**: student (Library/Assessments/Ask), teacher/admin (Classes/Assess), parent (Children)
- Stack: TypeScript strict, Zod, Zustand, TanStack Query 5, expo-secure-store
- Runtime is Expo (no native build step in turbo; `@sanro/mobile#build` is a stub)
- Tokens in SecureStore keys `sanro-token` / `sanro-refresh` / `sanro-user`; API base default `https://api.sanroai.com/api/v1` (read `EXPO_PUBLIC_API_URL`; use `EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1` for local dev)
- SafeAreaProvider for notch/Dynamic Island
- **`GestureHandlerRootView` wraps the root** in `app/_layout.tsx` - expo-router does not add
  one itself, and any `GestureDetector` (the textbook page zoom in
  `components/ZoomablePage.tsx`) throws "must be used as a descendant of
  GestureHandlerRootView" without it. Panning needs 2 fingers so one-finger drags keep
  scrolling the list.
- Memberships persisted to SecureStore
- ErrorBoundary wrapping app root
- **Metro watches the workspace root** (`metro.config.js`: `watchFolders`), and pnpm writes/deletes
  transient task-run state under `node_modules/.pnpm-task-run-state-v1` (`start.lock`,
  `*.jsonl`). A file that vanishes mid-crawl crashes the watcher with
  `ENOENT ... watch '...pnpm-task-run-state-v1\start.lock'` and the dev server exits — Metro then
  serves nothing, the phone sits on the splash screen, and every screen looks "empty". The config
  blocks that path; if Metro ever dies like this, restart it (`npx expo start --offline`) and
  reload the app.
- RN peer pulls `@types/react@18`; web uses `@types/react@19`. Do NOT try to unify these versions — web's tsconfig `paths` for `react`/`react-dom`/`jsx-runtime` keeps the two React type identities separate.
- **Asset URLs**: `lib/ar-assets.ts` resolves relative `/api/v1/files/...` against `EXPO_PUBLIC_WEB_URL`, so the **web origin must proxy `/api/v1/files/*` to the API** (`apps/web/next.config.mjs` rewrite). On-device AR/3D: the 3D preview works everywhere; the native "View in your space" affordance needs a WebXR/ARCore device and is hidden (with an explanation) otherwise.

## Code Style
- TypeScript strict, no comments unless asked
- Tailwind CSS 3.4, no CSS-in-JS
- shadcn/ui-style components in `components/ui/`
- React Hook Form + Zod for all forms
- TanStack Query for server state, Zustand for client state
- API returns payloads directly (no envelope)
- Error body: `{ code, message, requestId, statusCode, details? }`

## API Port
4000 (global prefix: `api/v1`)

## Web Port
3000

## Database
PostgreSQL 18 native (no Docker). User: `postgres`, Password: `postgres`, DBs: `sanro_dev`, `sanro_test`.

## Auth
JWT-based. Zustand persist store in localStorage key `sanro-auth`. Hydration tracked via `_hasHydrated` flag.

## Security (Session 13)
- **CORS**: Production locked to explicit origins (`sanroai.com`, `app.sanroai.com`, `www.sanroai.com`)
- **JWT Secret**: Min 32 chars; production refuses dev default (`AUTH_SECRET` must not start with `dev-`)
- **RBAC**: `@Roles()` on all mutation endpoints (people, questions, papers, curriculum, academics, institutions, imports, remediation)
- **Rate Limiting**: Auth-specific (login 10/min, forgot-password 3/min, register 5/min)
- **Validation**: Zod schemas on 13+ endpoints via `ZodValidationPipe`. Unknown keys are **stripped** by default (Zod `safeParse`), not rejected — this still blocks mass-assignment/privilege escalation because the handler never sees unrecognised fields. A few schemas opt into `.strict()` to reject unknown keys (e.g. admin-curriculum, content-ingest).
- **File Upload**: 10MB limit + MIME validation on imports
- **Forgot-Password**: Raw token no longer returned (returns `{ success: true }`)
- **Swagger**: Gated behind `NODE_ENV !== 'production'`

## Prisma Notes
- `User` has no `role` field — role is on `InstitutionMember`
- `Teacher`/`Student`/`Parent` have no name/email (on `User`)
- `Subject` has no `grade` field
- `Chapter` requires `code` + `grade`
- `ContentItem` uses field `type`
- `Grade` model: `{ id, boardId, name, order }`. `/curriculum/grades` returns name strings only
- Question type mapping: UI `SHORT` → Prisma `SHORT_ANSWER`, UI `LONG` → Prisma `LONG_ANSWER`

## Key Files
- `apps/api/prisma/schema.prisma` — Full schema (1789 lines)
- `apps/api/prisma/seed.ts` — Idempotent seed (135+ content items, 8 achievements, gamification profile)
- `apps/web/lib/auth-store.ts` — Zustand auth with hydration + token refresh
- `apps/web/lib/api.ts` — API client with auto token refresh on 401
- `apps/web/lib/api-hooks.ts` — TanStack Query hooks
- `apps/web/lib/learning-hooks.ts` — Learning + gamification hooks
- `apps/web/lib/library-hooks.ts` — Library browse (`GET /content/browse`) + item detail
- `apps/web/lib/path-hooks.ts` — Learning Path + retest hooks (`GET /learning/path`)
- `apps/web/lib/video-hooks.ts` — Chapter-wise YouTube video admin hooks
- `apps/web/lib/question-hooks.ts` — Question bank hooks
- `apps/web/lib/people-hooks.ts` — People management hooks
- `apps/web/lib/ai-hooks.ts` — AI chat hook
- `apps/web/lib/import-hooks.ts` — Import hooks
- `apps/web/components/ui/` — shadcn/ui-style component library
- `apps/web/components/markdown.tsx` — Markdown renderer for lesson notes/descriptions
- `apps/web/components/learning-path.tsx` — Assessments → Path tab (ordered concept list)
- `apps/web/components/youtube-player.tsx` — YouTube embed (web) / iframe player
- `apps/web/app/(dashboard)/app/library/` — Library routes (browse, subjects, item)
- `apps/web/app/(dashboard)/app/content/videos/` — YouTube video management page
- `apps/api/src/imports/imports.service.ts` — Bulk import pipeline (5 entity types)
- `apps/api/src/curriculum/content.service.ts` — Content browse + scope filtering
- `apps/mobile/components/Markdown.tsx`, `apps/mobile/components/YouTubePlayer.tsx`
- `apps/web/tailwind.config.ts` — Brand colors, animations
- `apps/api/src/papers/papers.service.ts` — Paper generation + type mapping
- `apps/api/src/assessments/assessments.service.ts` — Assessment flow + auto-grading
- `apps/api/src/learning/learning.service.ts` — Learning path + gamification + practice
- `apps/api/src/questions/questions.service.ts` — Question bank CRUD + filters
- `apps/mobile/lib/hooks.ts` — All mobile TanStack Query hooks (learning, practice, assessments, AI)
- `apps/mobile/lib/api.ts` + `lib/auth-store.ts` — Mobile API client + SecureStore auth
- `apps/mobile/lib/offline.ts` — Offline mutation queue (Zustand + AsyncStorage), `flushOfflineQueue()`
- `apps/mobile/lib/offline-auth.ts` + `lib/sha256.ts` — Offline login credential vault (SecureStore + SHA-256)
- `apps/mobile/lib/api.ts` — API client; base reads `EXPO_PUBLIC_API_URL` (default `https://api.sanroai.com/api/v1`)
- `apps/mobile/components/OfflineBanner.tsx` — Shared offline status banner
- `apps/mobile/app/` — Expo Router screens (5-tab shell, learn flow, concept 6 modes, attempts)
- `scripts/verify-roles.mts` — Playwright verifier for student/teacher/parent pages (screenshots + `summary.json`)
- `scripts/verify-empty-states.mts` — Playwright verifier for the 18 super-admin screens
- `apps/mobile/expo-types.d.ts` — local `expo/types` reference; replaces the `expo-env.d.ts` that `expo start` deletes when `typedRoutes` is off

## Demo Users (password omitted from this file; defined by the local `--demo` seed)

The demo/QA password is **never stored in the repository**: it is read from
`SEED_DEMO_PASSWORD` in `apps/api/.env` (git-ignored) via
`apps/api/src/common/demo-password.ts` (API side) and `scripts/qa/_env.mjs`
(scripts side). The seed, the e2e suite and every QA script all read the same
value, so rotating it is a one-line `.env` change.
- `admin@sanroai.com` (SUPER_ADMIN)
- `principal@sanroai.com` (INSTITUTION_ADMIN)
- `teacher@sanroai.com` (TEACHER)
- `student@sanroai.com` (STUDENT, primary class 10, **`allGrades: true`** — opens the
  curriculum of every class 1-10, which is what the "browse all classes" demo shows)
- `student8@sanroai.com` / `student9@sanroai.com` (STUDENT, classes 8 and 9 — single-class
  accounts, kept so the grade-scoped 403s and the enrolment UI can be exercised)
- `parent@sanroai.com` (PARENT)

## Design Language
Purple/violet primary (#7c3aed), rounded cards (2xl/3xl), soft shadows, gradient accents, Poppins headings, Inter body. Logo: GraduationCap icon (replaced Sparkles).

## Concept Detail Page - 3 Modes
The concept detail page (`/app/learn/concepts/[conceptId]`) has a **3-mode** interface:
1. **Learn** - video lessons (YouTube, plays inline, captions off), study notes, quick revision,
   and the **Interactive 3D Model** card (opens the viewer in a dialog/modal - it is lesson
   content, not a peer mode, and the heavy viewer only mounts on demand)
2. **Practice** - one action, a server-side quiz session (`POST /learning/practice/start` ->
   `/learning/practice/[practiceId]`) with a per-question timer. Submitting records mastery
   evidence and XP - this is the ASSESS -> DIAGNOSE edge. The page honours `?tab=practice`
   (the chapter hub and the old flashcard links use it)
3. **Ask Sanro AI** - context-aware tutor for the concept

**Cut (2026-10-21):** *Quick Quiz* and *Challenge* (both replayed the same
`practiceQuestions` pool as Practice - Challenge even routed to the same screen - and their
XP promises were never awarded; the orphaned mobile `/quiz/[conceptId]` and
`/challenge/[conceptId]` screens were deleted).

**Cut (2026-10-30):** *Flashcards* end to end. The deck replayed the same
`practiceQuestions` pool as the quiz, wrote no mastery evidence and awarded no XP, so it
could not move a student along ASSESS -> DIAGNOSE -> FIX -> RETEST - it only added a second
button to Practice and a second screen to maintain on both platforms.
`POST /learning/flashcards/:questionId/rate`, the `flashcardRatings` field on
`GET /learning/concepts/:id`, `apps/web/lib/flashcards.ts` and the mobile flashcards screen
are gone; the `FlashcardRating` table is kept (no destructive migration) but nothing reads or
writes it from the student flow. Old `/app/flashcards/:id` links redirect to
`/app/learn/concepts/:id?tab=practice` (web `next.config.mjs` redirect, mobile a
`<Redirect>` route). The knowledge-base *generate flashcards* authoring endpoint is
unrelated and still exists.

**The graded answer is the option TEXT** (that is what `question.answer` holds). Clients must
send the text; the API also resolves an option id for robustness
(`normaliseAnswerToOptionText` in `apps/api/src/diagnosis/mastery.service.ts`). Written
answers are not auto-graded, so they are neither right nor wrong - they are excluded from the
score and from the mastery evidence.

**XP rules (truthful):** Practice awards **5 XP per correct answer + 10 XP for finishing**
(`apps/api/src/common/xp.ts`); assessments award the assessment score. Every award is written
to the `XpEvent` ledger, which the leaderboard reads. The same file owns the streak rule
(same day = keep, yesterday = extend, older = restart) - the old inline copies reset the
streak to 1 on a second activity in the same day.

**Completion controls are stateful, never decorative.** A lesson card's
"Mark as done" / "Mark as read" control is driven by `item.progress.state` from
`GET /learning/concepts/:id` (`progress: { state, secondsWatched, completedAt }`):
not started → outline circle + the action label, pressable; `COMPLETED` → filled green check +
"Completed" **plus an Undo** button. Undo calls
`DELETE /learning/content/:contentId/complete`, which sets the row back to `NOT_STARTED` with
`completedAt: null` (idempotent, student-only) so every completed count drops it again. A static
green check on every card reads as "already done" and was reported as a bug (2026-10-29).
`ContentItem` on both clients carries `progress` for this.

**AI replies render as Markdown, never raw text.** Both chat surfaces (web
`/app/chat`, mobile Ask tab and `ask/[conceptId]`) send assistant messages through the shared
Markdown component, which first runs `normalizeMarkdown`
(`apps/web/lib/markdown-normalize.ts`, `apps/mobile/lib/markdown-normalize.ts`): raw HTML
(`<br>`, `<b>`, `<ul><li>`) becomes Markdown, entities are decoded, LaTeX delimiters become
code, and a heading glued to the paragraph above gets its blank line. User messages stay plain
text. Without this the model's `**`, `#` and `<br>` reach the student literally.

## Student Dashboard — "What should I do today?"
- **Your Focus Today**: Weak concept "Fix This" CTA + upcoming assessment "Prepare"
- **Progress Summary**: XP, Streak, Mastery (compact cards)
- **Continue Learning**: Browse All Subjects
- **Pending Assessments**: Start button
- **Recent Activity**: Score badges

## Product Principle
SANRO is NOT a content library. It is an academic intelligence platform that converts assessment data into specific learning interventions and measurable improvement.
Core loop: ASSESS → DIAGNOSE → FIX → RETEST → IMPROVE
Student journey: TODAY → DO THIS → IMPROVE

## Production Deployment (Part of Definition of Done)
Deployment is part of the task. Do NOT stop after local development — the project is not complete until SANRO is live.
`docs/DEPLOYMENT.md` (§1–6) is binding. Key rules:
- Do not stop at `pnpm build`. Deploy web (Vercel) + API (managed NestJS host), connect managed PostgreSQL, configure env vars via `.env.example`, remove all localhost references, verify live URLs, and smoke-test the full flow against production.
- Domains: `sanroai.com` / `app.sanroai.com` / `api.sanroai.com`. Mobile consumes the SAME production API as web — no separate backend logic.
- Prohibited: committing secrets, `prisma migrate reset` on prod, wildcard CORS with auth, localhost in production, claiming success without verification.
- If blocked by missing credentials/access: say `BLOCKED — requires [specific access]` and document the exact DNS/credential requirements. Never fabricate configuration.
- This local repo currently talks to `localhost:4000` — mobile API base and web env URLs must be switched to the deployed API before production use.

## CBSE curriculum source material (`books/`, git-ignored)
NCERT textbook source for authoring platform content, organised
`books/cbse/class-<8|9|10>/<subject>/`. **Classes 8, 9 and 10 are extracted** (science,
mathematics, english) with one pipeline: text layer, page screenshots, embedded figures, an
OCR cross-check and a README/qc index.

| Class | Subject | Folder | Chapters | Pages | Book (2026 edition) |
|---|---|---|---|---|---|
| 8 | science | `class-8/science` | 14 | 248 | Curiosity |
| 8 | mathematics | `class-8/math part 1` + `math part 2` | 8 + 8 | 263 + 192 | Ganita Prakash (two volumes) |
| 8 | english | `class-8/english` | 6 units | 268 | Poorvi |
| 9 | science | `class-9/science` | 14 | 292 | Exploration |
| 9 | mathematics | `class-9/math` | 9 | 220 | Ganita Manjari |
| 9 | english | `class-9/english` | 10 units | 296 | Kaveri |
| 10 | science | `class-10/science` | 15 | 232 | Science |
| 10 | mathematics | `class-10/mathematics` | 15 | 231 | Mathematics |
| 10 | english | `class-10/english` | 10 | 152 | First Flight |

> The class-9 books are the **new 2026 NCERT titles**, not the old syllabus - every chapter
> title in the registry was verified against each book's own contents page. The class-8 maths
> book is split into **two volumes** that both number their chapters 1-7, so volume 2 needs
> the `MAT-8P2-n` code form.

| Path | Contents |
|---|---|
| `source/*.pdf` (or the subject folder) | Original NCERT PDFs, SHA-256 in each `meta.json` |
| `chapters/<slug>/text.merged.txt` | **Read this one** — text layer, OCR fallback on image-only pages |
| `chapters/<slug>/text.txt` | Raw PDF text layer, page-delimited |
| `chapters/<slug>/pages.json` | Same text split per page |
| `chapters/<slug>/ocr/text.txt` + `ocr/pages.json` | Tesseract output, per-page confidence + agreement score |
| `chapters/<slug>/screenshots/pNNN.png` | 1240px page renders — use for figures, equations, layout |
| `chapters/<slug>/images/` | Embedded raster figures (the 2026 books use **JPEG2000** → `scripts/books/pdfjs-assets.cjs` wires the OpenJPEG decoder; without it the images are silently dropped from the renders *and* the extraction) |
| `notes/*.md` | **Study guides** per chapter pair — outline, definitions, equations, activities, all questions, figure descriptions, CBSE exam signals |
| `manifest.json`, `ocr/report.json`, `qc.json`, `README.md` | Machine + human indexes, accuracy report |

Slugs are `NN-slugified-title` (`00-prelims` … `99-answers`).

Quality: class 10 OCR confidence ~89 avg with a text-layer↔OCR similarity of ~0.95. The 2026
class-9 books score 4-9 points lower (far more artwork inside the text column) with the same
similarity.

Tooling lives in `scripts/books/{extract,ocr,build-index,subjects,pdfjs-assets}.cjs`
(root devDeps: `pdf-parse`, `tesseract.js`, `sharp`), driven by
`--subject science|english|mathematics|mathematics-part2 --class 8|9|10`. The whole `books/`
tree is ignored in `.gitignore` — never commit PDFs/PNGs.

## CBSE Curriculum
- Board: CBSE (Classes 1-10)
- Seeded: **229 chapters**, **1089 concepts**, **543 topics**, **241 video + 241 notes lessons**
  and **2335 practice questions** (1309 original, 26 authored top-ups in
  `apps/api/prisma/question-topups.ts`, and 1004 authored concept-coverage questions).
  Every chapter in every class carries at least one video, one notes lesson and three questions,
  and **every one of the 1089 concepts now carries at least one question** — before the
  2026-11-01 coverage batch, 167 concepts had none, so their mastery could never leave
  `INSUFFICIENT_EVIDENCE` (see BUG-AA in `docs/qa/BUG_REPORT.md`).
  - Class 10: 13 Science + 15 Math + 9 English chapters (the 2026 maths book has **14**
    chapters - *Constructions* was rationalised out - so `MAT-10-1..14` follow the book and
    *Constructions* is `MAT-10-15`, the one chapter with no textbook PDF)
  - Class 9: 13 Science + 8 Math + 8 English chapters (Science has 13: 1-13; the class-9
    **English book (Kaveri) is seeded**)
  - Class 8: 13 Science + 14 Math (7 + 7 across the two volumes) + 5 English chapters
    (the new class-8 books - Curiosity, Ganita Prakash, Poorvi - are seeded)
  - Classes 5-7: Science + Mathematics + English (5: 10 + 15 + 10, 6: 12 + 10 + 5,
    7: 12 + 15 + 5 chapters)
  - Classes 1-4: **all three subjects**. English was missing from the primary classes and is now
    seeded from `apps/api/prisma/primary-english.ts` (5 Marigold chapters per class: the poem and
    the story of each unit, with concepts, a real NCERT-aligned video, notes and four questions).
    Science + Mathematics stay at 2 chapters each (class 3 Science has 3)
- **Every chapter has a video lesson** and no lesson video is under two minutes; the durations in
  the seed are the real YouTube lengths, enforced by `audit-video-durations.mjs --min 120`.
- All ten classes are **practisable**: 2335 questions cover every chapter and every concept,
  authored from the chapter's own textbook text where a book exists. The chapter-coverage audit
  (`audit-question-coverage.mjs`) fails when any chapter
  loses its questions. Class 10 carries >= 2 questions on every concept (a curated +184 batch:
  one MCQ per concept, one written question per chapter), and the 2026-11-01 coverage batches
  gave every one of the 167 concepts that had **no** question three MCQs of its own. **543 of
  the 1089 concepts now carry the three pieces of evidence mastery needs**; the other 546 carry
  one or two, which reach mastery over repeat sessions but are still the target of
  `scripts/qa/generate-concept-questions.mjs` — see `docs/QUESTION_BANK_GROWTH.md`.
- The NCERT **books** for classes 8, 9 and 10 are all extracted (see the section above) and their
  chapters are seeded; adding a class means adding its chapters, topics, concepts and lessons to
  `seed.ts`.
- The counts above are what `sanro_dev` holds after `db:seed:demo`; verify with
  `SELECT count(*) FROM "Chapter";` rather than trusting this line.
