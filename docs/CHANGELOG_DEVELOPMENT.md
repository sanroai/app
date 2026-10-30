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

### 2026-10-30 — A student can be in more than one class; subject cards are designed, not emoji

| Field | Detail |
|---|---|
| Date | 2026-10-30 |
| Task | Let a student be enrolled in several classes (`StudentEnrolment`), let `student@sanroai.com` open every class, route every content gate through one access service, and replace the glossy 3D icon on subject/chapter thumbnails with a typographic monogram |
| Reason | `Student.grade` was the only source of class access and nine separate `student.grade !== chapter.grade` comparisons enforced it, so a student taking class-9 mathematics alongside class-8 science could open neither that subject's chapters nor its textbook. The demo account also needed the whole curriculum, not one class. Separately, subject cards showed a small rendered 3D object inside a white pill next to a sentence-case subject name, which read as an emoji sticker rather than design |
| Entities affected | `schema.prisma` (`Student.allGrades`, new `StudentEnrolment`), new `common/services/student-grade-access.service.ts` (+ `common.module.ts`), `learning/learning.service.ts`, `chat/chat.controller.ts`, `ar/ar.service.ts`, `dashboard/dashboard.service.ts`, `people/students.service.ts`, `admin/admin-people.service.ts`, `packages/validation/src/schemas.ts`, `prisma/seed.ts`; web `components/subject-banner.tsx` (new), `app/(dashboard)/app/library/subjects/page.tsx`, `lib/learner-progress.tsx`, `app/(dashboard)/app/learn/chapters/[chapterId]/page.tsx`, `lib/learning-hooks.ts`; mobile `components/visuals.tsx`, `lib/subject-art.ts`, `lib/hooks.ts`, `app/(tabs)/learn.tsx`; `scripts/qa/probe-multi-class.mjs` (new); `AGENTS.md`, this entry |
| Database changes | New table `StudentEnrolment (id, studentId, grade, createdAt, @@unique([studentId, grade]))` with indexes on `studentId` and `grade`; new column `Student.allGrades` (default `false`); the migration backfills one enrolment per existing student from `Student.grade`. Applied to `sanro_dev`; `db:seed:demo` then set `allGrades = true` on `student@sanroai.com` and wrote one enrolment per seeded student |
| API changes | `GET /learning/home` adds `studentGrades: string[]` + `allGrades: boolean`; `/learning/path`, `/learning/progress` and `/dashboard/student` add `grades` + `allGrades` to the student block; `/students` list/detail add `grades`, `POST/PATCH /students` accept `grades: string[]` (the full set replaces enrolments, a bare `grade` only adds one). Behaviour: staff and a student with no class on record stay unrestricted; an enrolled student sees the union of their primary class and enrolments; a class not in that union is `403` — including concept practice, content completion, AI chat and AR, which previously had no check or a single-grade check |
| Frontend changes | Subject cards on both platforms are now photograph + accent wash + a three-letter monogram (`SCI`/`MAT`/`ENG`) + the subject name on the banner, in one uniform 16:9 box — the 3D icon pill is gone from the subject grid, the dashboard Continue Learning grid and the chapter hub hero. The `subject-*` banner artwork is re-rendered **without** the composited 3D object (`scripts/qa/build-brand-art.mjs`; `chapter-banner`/`dashboard-hero` keep theirs), so nothing rendered sits behind the monogram. The mobile Library header says "All classes · every subject" (or "N classes") when more than one class is open. `/app/students/[id]` gains a **Classes** card: badges for every class the student may read (the primary one pinned), an inline editor over all ten classes, and `useUpdateStudentClasses` (`PATCH /students/:id { grades }`). The options are read from `GET /learning/home`, because `/curriculum/boards` is super-admin only and returns `[]` for an institution admin |
| Seed/import changes | `student@sanroai.com` is seeded with `allGrades: true` and a class-10 enrolment; every per-grade demo student gets an enrolment for its own class; bulk-imported students keep `grade = null`, which the access service treats as unrestricted (documented, unchanged behaviour) |
| Migration | `apps/api/prisma/migrations/20261030090000_student_multi_class_enrolment/migration.sql` |
| Verification | `pnpm --filter @sanro/api typecheck` clean; `pnpm -r typecheck` clean (api, web, mobile); `node scripts/qa/probe-multi-class.mjs` PASS — the all-classes account lists 10 classes and opens a class-1 chapter, its pages, concept practice, chapter practice and AI chat; a class-8 student is refused the class-10 list/hub/pages (403); `PATCH /students/:id { grades: ['8','9'] }` makes that student's home list classes 8 and 9 and removing the enrolment restores the single-class scope. `npx tsx scripts/screenshots.mts --role student` renders the dashboard, subject grid (10 classes) and concept page; device screenshots in `artifacts/qa/2026-10-30/` |
| Known issues | Classes 1-7 have chapters, concepts, one video and questions but no NCERT book on disk, so their textbook routes return `pdfUrl: null` / `count: 0`; both clients say "No textbook available for this chapter yet" instead of opening an empty reader. Also, `db:seed` (system mode) does not touch demo students — `db:seed:demo` is what applies the demo enrolment changes |

### 2026-10-29 — Chapter hub is a map: real numbers, concept sections, photography, longer AI replies

| Field | Detail |
|---|---|
| Date | 2026-10-29 |
| Task | Rebuild the chapter hub (web + mobile) around the learning loop: chapter number, ordered blocks, per-concept video section, real photography, and a truthful AI reply length |
| Reason | `Chapter.order` was never written by the seed (every row held `0`), so the UI could only show the code (`SCI-10-4`) and never "Chapter 4". The hub opened with notes and a free-floating action row, the concept list carried no timing, and tapping a concept could not start the lesson at the part that teaches it. Subject/chapter cards were different heights and used synthetic gradients. Chat answers stopped mid-sentence at a 1200-token output cap with no signal that they had been cut |
| Entities affected | `Chapter.order`, `Concept.order`, `Topic.order` (seed + backfill on reseed); `learning.service.ts` (`curriculumNumber`, `buildConceptSections`, `thumbnailUrl`); `ai.service.ts` + new `ai/chat-reply.ts`; web chapter hub / concept page / chapter list / library subjects; mobile chapter hub / concept page / chapter list / `SubjectCard` / ask screens; `subject-art` banner JPGs; `docs/CHAPTER_HUB_REVAMP_PLAN.md` |
| Database changes | The seed now writes `Chapter.order` 1-based from the curriculum list, and `Topic`/`Concept.order` 1-based; re-running `db:seed:demo` backfilled `sanro_dev` and `seed --qa` backfilled `sanro_test`. No migration (existing columns). Every one of the 209 chapters previously held `order = 0`, so the API also derives the number from the code suffix (`...-4` -> 4) when `order` is 0, and states the concept serial from its position in the chapter (per-topic numbering repeated 1,1,2,2 in a flat list) |
| API changes | `GET /learning/chapters/:chapterId` adds `chapter.order` (curriculum number), `concepts[].order` (position in the chapter, 1-based, not per topic) and `concepts[].section = { contentId, startSeconds, endSeconds, durationSeconds, derived } \| null`. Concept sections are matched in two passes (markers first, concept-owned whole clip last) so a 4 h compilation can no longer claim a concept that a 38 min lesson already covers; `buildConceptSections` is exported and unit tested. `GET /learning/boards/:boardId/grades/:grade/subjects/:subjectId/chapters` adds `thumbnailUrl` (first video frame) and a corrected `order`. `POST /ai/chat` and `POST /chat/ask-sanro` add `truncated: boolean`; the chat output cap is 4096 (JSON stays 2048) and Gemini now receives the conversation history (it was silently dropped on the configured provider) |
| Frontend changes | Web and mobile hub share one order: header (Chapter N + code, subject photo) -> Continue merged with progress -> Contents (serial, duration on the left, `start - end` on the right) -> Learn (video title above the player, textbook row) -> Practise -> Ask -> Chapter notes (collapsed). A concept row links to `?t=<start>&video=<contentId>`; both players embed `&start=N`, show "Starting at ..." and a "Play from the start" reset. The Learn block's marker lists start collapsed on the hub (`VideoSegments`/`ChapterMarkerStrip` gain `collapsible`); the concept page keeps them open. Chapter cards carry the chapter's own video frame and `Chapter N`; subject cards are one uniform 16:9 size with a real photograph, the subject's 3D icon and an always-present mastery footer, and the dashboard's Continue Learning grid now uses that same card. A truncated AI reply shows a Continue chip on both platforms. Two banners that rendered white-on-white (arbitrary-alpha gradient utilities compiled to white) now set their overlay with inline rgba |
| Seed/import changes | `seed.ts` writes chapter/topic/concept `order` (1-based) and repairs existing rows on upsert; `scripts/qa/fetch-subject-photos.mjs` downloads five curated Unsplash photographs into `apps/web/public/art/photos/` with `credits.json`; `build-brand-art.mjs` composites each photo under the brand gradient and 3D icon into both `apps/web/public/art` and `apps/mobile/assets/art` |
| Migration | none — data, code and artwork only |
| Verification | `pnpm --filter @sanro/api test` 640/640 (38 files, includes the new `chapter-hub-sections.e2e-spec.ts` 4/4 and `concept-sections.spec.ts` 6/6, plus `chat-reply.spec.ts` 5/5); `pnpm --filter @sanro/web test` 61/61; `pnpm --filter @sanro/mobile test` 93/93 (the marker-strip suite now has a collapsed-by-default case); `pnpm -r typecheck` clean; `pnpm -r lint` 0 errors. Live probe of `sanro_dev` returned chapters 1-13 with `thumbnailUrl`, and `SCI-10-4` concepts map to 00:00-09:38 / 09:38-19:16 / 19:16-28:54 / 28:54-38:34 instead of the 4 h compilation. Playwright screenshots of the dashboard, subject grid, chapter list and hub at 1440 px and 390 px in `artifacts/qa/2026-10-29/revamp/` |
| Known issues | 135 of the 221 lesson videos have no creator chapters, so their concept sections are the derived even split (`derived: true`, labelled approximate on both clients) |

### 2026-10-29 — Undo a completed lesson; AI replies render Markdown and Sanro is Sanro

| Field | Detail |
|---|---|
| Date | 2026-10-29 |
| Task | Let a student un-mark a lesson, move the lesson title above the video, render Ask Sanro AI answers as Markdown on both clients, and make the assistant introduce itself as **Sanro** |
| Reason | "Completed" was a dead end: the control was disabled once pressed, so a mis-tap could never be undone and the completed count stayed wrong. The video title sat under the whole player + section list, so it looked detached from the lesson. Answers came back with literal `**`, `#`, `<br>` and `\(…\)` because both chat surfaces printed the raw string in a `<Text>`/`<div>`. And the system prompt called the assistant "ASK Sanro", so it introduced itself as "Ask Sanro" instead of its product name |
| Entities affected | API: `ai/ai.service.ts` (system prompt), `learning/learning.controller.ts` (`DELETE content/:contentId/complete`), `learning/learning.service.ts` (`uncompleteContent`), `test/content-progress.e2e-spec.ts` (new). Web: `lib/learning-hooks.ts` (`useUncompleteContent`), `lib/markdown-normalize.ts` (new), `lib/markdown-normalize.test.ts` (new), `components/markdown.tsx`, `app/(dashboard)/app/chat/page.tsx`, `app/(dashboard)/app/learn/concepts/[conceptId]/page.tsx`. Mobile: `lib/hooks.ts` (`useUncompleteContent`), `lib/markdown-normalize.ts` (new) + test, `components/Markdown.tsx`, `app/(tabs)/ask.tsx`, `app/ask/[conceptId].tsx`, `app/concept/[conceptId].tsx`. Docs: `AGENTS.md`, this entry |
| Database changes | none (undo reuses `ContentProgress`, setting `state: NOT_STARTED`, `completedAt: null`) |
| API changes | New authenticated `DELETE /learning/content/:contentId/complete` → `{ ok, progress }`. Student-only (403 for staff), idempotent, validates the content id, and leaves the row in `NOT_STARTED` so every completed count excludes it |
| Frontend changes | Completed cards show the green check + **Undo** (web) or a "Completed · Undo" row (mobile); pressing it drops back to the actionable state. The video title now sits above the player with breathing room on both clients. Assistant bubbles render through the shared Markdown component (headings h1-h6, bold/italic/strikethrough, lists, tables, code, links) on web chat, the mobile Ask tab and `ask/[conceptId]`; user bubbles stay plain. The web greeting reads "Hello, I am Sanro — your study assistant" and the mobile Ask tab headline reads "Hello, I am Sanro" |
| Seed/import changes | none |
| Migration | `none — no schema change` |
| Verification | `pnpm --filter @sanro/api test` **625/625** (35 files; new `content-progress` 5/5: 401 both directions, 403 for a teacher, complete → undo → NOT_STARTED/null, double-undo harmless, concept detail no longer reports COMPLETED); `pnpm --filter @sanro/web test` **61/61** (new `markdown-normalize` 10/10); `pnpm --filter @sanro/mobile test` **92/92** (same 10 cases); `pnpm -r typecheck` 6/6; `pnpm -r lint` 0 errors; device (1080x2340): tap **Mark as done** → card shows a filled green check + "Completed" + underlined **Undo**, tapping Undo returns it to the outline circle + "Mark as done"; the concept video card shows `Types of Chemical Reactions` above the player, all four sections stacked, no raw `**` in an AI reply; the Ask tab headline reads "Hello, I am Sanro" and the answer renders bold headings, nested bullets and italics (`artifacts/qa/2026-10-29/screenshots/ask-reply*.png`, `undo-completed.png`, `concept-title-top.png`); Playwright: the concept title sits 12 px above the player and the chat reply contains `<strong>`, headings and lists with zero literal `**`, `#` or `<br>` (`web-concept-title.png`, `web-chat-markdown.png`) |
| Known issues | The assistant still cannot verify maths: LaTeX is shown as code, not typeset |

### 2026-10-29 — Video sections stack vertically; concept and Ask screens get their back arrow; completion controls reflect real state

| Field | Detail |
|---|---|
| Date | 2026-10-29 |
| Task | Show every video section without a horizontal scroller, restore the back arrow on the concept and Ask Sanro AI screens, and make the completion controls tell the truth |
| Reason | The marker rail was a horizontally scrolling row of chips: on a 1080 px phone only the first two labels were visible and the rest were hidden off-screen, so most sections were never seen or tapped. `concept/[conceptId]` and `ask/[conceptId]` set `headerShown: false` while chapter/textbook/practice/attempt showed the native stack header, so a student who opened a concept had no visible way back. And the concept page drew a **green check + "Mark as done" for every item** regardless of state, so an untouched video looked already done while a genuinely completed note still offered "Mark as read" |
| Entities affected | Web: `components/video-segments.tsx`, `lib/learning-hooks.ts` (`ContentItem.progress`), `app/(dashboard)/app/learn/concepts/[conceptId]/page.tsx`. Mobile: `components/ChapterMarkerStrip.tsx`, `app/_layout.tsx`, `lib/hooks.ts` (`ContentItem.progress`), `app/concept/[conceptId].tsx`. Docs: `AGENTS.md`, `docs/VIDEO_CHAPTER_MARKERS.md`, `docs/UX_REVAMP.md`, `docs/FEATURE_CHAPTER_HUB.md`, `docs/CHAPTER_HUB_OPERATOR_GUIDE.md`, this entry |
| Database changes | none |
| API changes | none (the concept detail already returned `progress: { state, secondsWatched, completedAt }` per content item; the marker payload is unchanged too — only their presentation changed) |
| Frontend changes | Both clients render the sections as a full-width vertical list, timestamp first and the title un-truncated (web `flex flex-col`, mobile a plain `View` with one row per marker); tapping a row still seeks in place. `_layout.tsx` now shows the native stack header for `concept/[conceptId]` (`Concept`) and `ask/[conceptId]` (`Ask Sanro AI`), matching the chapter screen, so the back arrow is always present. The **Mark as done / Mark as read** controls now read `item.progress.state`: an untouched item shows an outline circle + "Mark as done" / "Mark as read" and is pressable, a `COMPLETED` item shows a filled green check + "Completed" and is disabled. `ContentItem` gained `progress` on both clients. Previously the green check was a static icon on every card, so an untouched video looked done while a genuinely completed note still offered "Mark as read" |
| Seed/import changes | none |
| Migration | `none — no schema change` |
| Verification | `pnpm --filter @sanro/mobile typecheck` exit 0; `pnpm --filter @sanro/web typecheck` exit 0; `pnpm --filter @sanro/mobile test` **82/82** (12 suites); device (1080x2340): chapter → concept shows the `Concept` header with the back arrow, and the video card lists `00:00 Combination and Decomposition`, `01:36 Displacement Reactions`, `03:12 …`, `06:24 …`, `09:36 …` stacked, every label fully visible; the untouched video shows an outline circle + "Mark as done" and the note completed on 2026-10-24 shows a filled green check + "Completed"; Playwright against the running web app: every section group computes `flex-direction: column` / `overflow-x: visible` and lists all four rows (`artifacts/qa/2026-10-29/screenshots/web-sections.png`) |
| Known issues | none |

### 2026-10-25 — The chapter textbook opens inside the app (rendered pages)

| Field | Detail |
|---|---|
| Date | 2026-10-25 |
| Task | Replace the PDF download hand-off with an in-app textbook reader on web and mobile |
| Reason | The previous fix made the PDF reachable (signed link → Chrome), but Chrome on Android still only downloads it and the student leaves the app to read. The extractor already renders every page of every extracted book to a 1240 px PNG, so the same content can be read in place, scrolling page by page |
| Entities affected | API: `common/books/chapter-pages.ts` (new), `common/books/chapter-pdf.ts` (`chapterPagesDir`), `learning/pdf-ticket.service.ts` (`chapterPages`), `learning/learning-pdf.controller.ts` (`GET :chapterId/pages/:page`), `learning/learning.controller.ts` (`GET chapters/:chapterId/pages`), `learning/learning.service.ts` (`chapterForUser`, `getChapterPages`, `getChapterPageFile`), `test/chapter-pages.e2e-spec.ts` (new). Web: `lib/chapter-hooks.ts` (`useChapterPages`, `downloadPdf`, shared `fetchPdf`), `app/(dashboard)/app/learn/chapters/[chapterId]/page.tsx`. Mobile: `app/textbook/[chapterId].tsx` (new), `components/ZoomablePage.tsx` (new), `app/_layout.tsx` (GestureHandlerRootView + the screen), `app/chapter/[chapterId].tsx`, `lib/hooks.ts` (`useChapterPages`). Scripts: `scripts/qa/probe-chapter-pages.mjs`, `scripts/qa/probe-textbook-reader.mts`, `scripts/qa/device-find.mjs` (new). Docs: `AGENTS.md`, `docs/UX_REVAMP.md`, `docs/PARITY_POLICY.md`, this entry |
| Database changes | none (pages are read from the git-ignored `books/` tree) |
| API changes | New authenticated `GET /learning/chapters/:chapterId/pages` → `{ count, pages: [{ index, path }], expiresAt }` (same browse context + grade check as the PDF); new public `GET /learning/pdf/:chapterId/pages/:page?exp&sig` serves one page as `image/png`. The page ticket reuses the PDF signature (`HMAC(chapterId.exp)`) with a 60-minute window, because a student scrolls for longer than the 10 minutes a PDF link needs, and validates the index against the files on disk (no path input, so no traversal) |
| Frontend changes | Web chapter hub button reads **Read the textbook** when pages exist and opens a dialog that stacks the page images lazily, with **Download PDF** beside them (the blob is fetched only on that click); without pages it keeps the PDF/iframe dialog. Mobile gets `/textbook/[chapterId]`: a `FlatList` of full-width pages (`windowSize` 3, two per batch), a header that names the chapter, per-page "Page n of N" label, tap-to-retry on a failed image, an end-of-chapter footer, and a graceful "not available" state; the hub's row now mints the page list first and only falls back to the signed PDF when the chapter has no rendered pages. Each page is `components/ZoomablePage.tsx`: a tap zooms 2.2x towards the tapped point (gesture-handler + reanimated), pinch refines up to 4x, two fingers pan, and a tap at zoom returns to fit - one-finger drags still scroll the book. `app/_layout.tsx` now wraps the tree in `GestureHandlerRootView` (expo-router does not provide one here; without it every `GestureDetector` throws a render error) |
| Seed/import changes | none |
| Migration | `none — no schema change` |
| Verification | `pnpm --filter @sanro/api test` **620/620** (34 files; new `chapter-pages` 6/6: 401 without a token, signed list, PNG + `Cross-Origin-Resource-Policy: cross-origin`, 404 beyond the last page, 401 forged/re-bound ticket, 403 for another grade); `pnpm --filter @sanro/web test` 51/51; `pnpm --filter @sanro/mobile test` 82/82; `pnpm -r typecheck` 6/6; `pnpm -r lint` 0 errors; `node scripts/qa/audit-web-mobile-parity.mjs` 23/23 (new `chapter textbook` row); `node scripts/qa/probe-chapter-pages.mjs` PASS (SCI-10-1 16 pages, SCI-10-2 20, SCI-10-3 21; first/last page 200 `image/png`, +1 → 404, tampered sig → 401); `npx tsx scripts/qa/probe-textbook-reader.mts` PASS (affordance "Read the textbook", 16 images in the dialog, first page `naturalWidth` 1240, Download PDF emits `Chemical Reactions and Equations (SCI-10-1).pdf`); device (1080x2340): hub → Read the textbook → page 1 renders in-app, a one-finger swipe scrolls to page 2, a tap zooms 2.2x around the tapped line and the next tap returns to fit |
| Known issues | Helmet's default `Cross-Origin-Resource-Policy: same-origin` silently blocks the page images (Chrome `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`); the page route now sends `cross-origin` and the e2e spec asserts it. Pages are full-resolution (~450 KB each, ~7 MB per chapter) — fine over adb reverse, worth a resize pass if the books are ever shipped. Books remain git-ignored, so production 404s and both clients fall back to "no textbook" until they ship |

### 2026-10-25 — Chapter PDF reaches the phone (signed link) + instant-feeling navigation

| Field | Detail |
|---|---|
| Date | 2026-10-25 |
| Task | Fix "PDF download unsuccessful, book not showing" on the phone and make Library → Subjects → chapter navigation paint immediately |
| Reason | `GET /learning/chapters/:id/pdf` is behind the JWT guard; a browser/system viewer sends no Authorization header, and Android's WebView cannot render PDF at all, so the in-app WebView attempt ended in Chrome's "Download unsuccessful". Navigation also waited for the next route's chunk/compile with no skeleton and no data warmed |
| Entities affected | API: `learning/learning-pdf.controller.ts` (new), `learning/pdf-ticket.service.ts` (new), `learning/learning.controller.ts`, `learning/learning.module.ts`, `learning/learning.service.ts` (`getChapterPdfFile`), `test/chapter-pdf-link.e2e-spec.ts` (new). Web: `app/(dashboard)/layout.tsx`, `app/learn/.../chapters/page.tsx`, `app/learn/chapters/[chapterId]/page.tsx`, `app/library/page.tsx`, `app/library/subjects/page.tsx`, `app/library/loading.tsx` (new), `app/learn/loading.tsx` (new), `components/route-skeletons.tsx` (new), `lib/{prefetch,use-idle-prefetch}.ts` (`use-idle-prefetch.ts` new). Mobile: `app/chapter/[chapterId].tsx`, `components/ChapterPdfViewer.tsx` (deleted) |
| Database changes | none |
| API changes | New `POST /learning/chapters/:chapterId/pdf-link` (authenticated, same grade check as the PDF) returns `{ path, expiresAt }`; new public `GET /learning/pdf/:chapterId?exp&sig` serves the PDF to any viewer through a 10-minute HMAC ticket bound to that chapter. `/learning/chapters/:chapterId/pdf` is unchanged for authenticated clients |
| Frontend changes | Mobile "Open chapter PDF" now mints the signed link and hands it to the platform viewer (no WebView, no dead modal); web PDF dialog gained a **Download PDF** button. Navigation: nav, subject cards, chapter cards and concept rows warm the route *and* its payload on hover/focus/touch (`PrefetchLink`), each screen idle-prefetches its most likely successor (`useIdlePrefetch`), and `/app/library` + `/app/learn` render route skeletons while the next segment streams |
| Seed/import changes | none |
| Migration | `none — no schema change` |
| Verification | `pnpm --filter @sanro/api test` **614/614** (33 files, incl. the new `chapter-pdf-link` 5/5: 200 + `%PDF-` without a token, 401 forged signature, 401 cross-chapter reuse, 401 expired, 401 mint without token); web tests 51/51; mobile tests 82/82; device (1080x2340, `com.sanro.ai` over adb reverse): chapter hub → Open chapter PDF → Chrome → download completes, `Chemical Reactions and Equations (SCI-10-1).pdf` 4,161,216 bytes = exact API length; web dialog shows the PDF + Download button with no failed requests; click timings on the dev server with hover intent 0.85–0.92 s per step (was 2.4–7.3 s) and the chapter hub dropped 3.1 s → 0.84 s after idle prefetch; `pnpm -r typecheck` 6/6; lint 0 errors |
| Known issues | Chrome on Android downloads the PDF (its "Choose where to download" sheet) instead of previewing it — one extra tap before the device viewer opens; an in-app page reader is the follow-up if students should read the textbook without leaving the app. Turbopack dev (`next dev --turbopack`) crashes this app at hydration (`TypeError: (void 0) is not a function`), so Webpack dev stays |

### 2026-10-25 — UX revamp, Gemini provider, video sections, question bank growth

| Field | Detail |
|---|---|
| Date | 2026-10-25 |
| Task | Ship the user-facing polish batch and close two functional gaps ("the video is not split concept-wise", "more questions per concept"), committing the in-flight P15/P16 work |
| Reason | The dashboard asked too many questions, the chapter hub video strip appeared on only 86 of 221 lessons, and the bank was thin per concept; the AI wiring was undocumented |
| Entities affected | API: `ai/ai.service.ts` (+ `.env.example`), `common/books/chapter-segments.ts` (+ spec), `diagnosis/mastery.service.ts`, `learning/learning.service.ts`, `prisma/seed.ts`, `prisma/seed-ar.ts`, `test/practice-flow.e2e-spec.ts`. Web: dashboard, library/subjects, chapter hub, practice, papers, public home, `components/{icon-3d,prefetch-link,video-segments}`, `lib/{chapter-hooks,learning-hooks,library-hooks,prefetch,subject-art,video-segments}`, `public/art`, `public/icons`. Mobile: tabs, chapter hub, practice, `components/ChapterMarkerStrip`, `lib/{chapter-hub,subject-art}`, `assets/art`. Scripts: brand art, AI probe, concept-question authoring, video-segment probe, stale-concept prune, encoding repair. Docs: `AI_PROVIDER.md`, `UX_REVAMP.md`, `VIDEO_CHAPTER_MARKERS.md`, `QUESTION_BANK_GROWTH.md`, `EXECUTION_LOG.md`, `BUG_REPORT.md`, `ROADMAP.md`, `MCP_SETUP.md`, `QA.md`, `AGENTS.md` |
| Database changes | Seed and DB text repaired from double-encoded UTF-8 (`fix-encoding.mjs --apply`: 2 seed lines written; 0 concept/question/option/content/topic rows needed repair on `sanro_dev`). No schema change |
| API changes | Chapter hub returns `segments` (real creator chapters or derived concept split, flagged `derived`); practice pools widened; AI provider configurable via `AI_PROVIDER`/`AI_API_KEY`/`AI_MODEL`/`AI_BASE_URL` |
| Frontend changes | Dashboard answers "what should I do today?" (hero art + 3 numbers, duplicate/secondary cards removed); 34 3D icons replace emoji; subject/chapter artwork; route prefetch; video markers seek on tap and are labelled "Sections · approximate" when derived; `Icon3D` renders an eager `<img>` and heroes use explicit gradient stops (BUG-AN, BUG-AO) |
| Seed/import changes | Encoding repair touched only corrupted strings; AR demo set now reports 8/8, 0 skipped (BUG-AJ) |
| Migration | `none — data/text only; no migration file added` |
| Verification | `pnpm -r typecheck` 6/6; `pnpm -r lint` 0 errors (pre-existing warnings only); `pnpm build` 6/6; `pnpm --filter @sanro/api test` **609/609** (32 files); web tests 51/51; mobile tests 82/82; `web-walkthrough.mts` 63 PASS / 6 EXPECTED / 0 FAIL; `probe-video-segments.mjs` grades 10/9/8 PASS; `audit-question-coverage.mjs` 1229 questions, 209/209 chapters |
| Known issues | Concept descriptions still null for all 1009 concepts; production `api.sanroai.com` gateway answers 404 for `/api/v1/*` so production smoke is blocked; on-device checks need an attached phone; `AI_API_KEY`/`HF_TOKEN` absent locally so AI runs mock |

### 2026-09-29 — Production deploy: Vercel web + Railway API, preDeploy seed blocker fixed

| Field | Detail |
|---|---|
| Date | 2026-09-29 |
| Task | Ship the Library/Assessments IA and the local-run defect sweep to production, and unblock the Railway deploy pipeline that had been failing since 2026-09-23 |
| Reason | Production was reachable but running a 2026-09-23 build: `app.sanroai.com` still showed the old `Learn` nav with `/app/library` → 404, and the API returned 404 for `GET /learning/path`, 500 for `GET /remediation/weak` and 500 for `GET /content/browse`. Every `railway up` failed in preDeploy after `prisma migrate deploy` succeeded |
| Entities affected | `apps/api/prisma/seed.ts` (remote-host guard), Railway service `api` (preDeploy `prisma migrate deploy` + `db:seed`), Vercel project `sanroai-web` (rootDirectory `apps/web`), `AGENTS.md` |
| Database changes | **Production (Railway Postgres, `postgres.railway.internal`) received 3 pending migrations** via preDeploy: `20260926090000_import_entity_content_questions`, `20260926100000_audit_action_parent_created`, `20260926110000_import_entity_type_parents` (all additive enum values). Idempotent system seed then ran (plans, achievements, system institution, super admin) |
| API changes | None in contract. `seed.ts` guard relaxed: a non-local DB host is refused **only** for `--demo`/`--qa`; `--system` (the documented deploy-time bootstrap) now runs remotely and logs `[seed] remote host: system bootstrap only …` |
| Frontend changes | Deployed to Vercel production (deployment `dpl_H1hQrRFjSSRNGXq44xjcXgcY7wWF`, target `production`, aliases `sanroai.com`, `app.sanroai.com`, `www.sanroai.com`, `sanroai-web.vercel.app`): Library/Assessments IA, `Button asChild` fix, API-client token/refresh fix, role-aware remediation, curriculum hydration fix, parent weak-contract fix |
| Seed/import changes | Behaviour change only (above); no rows seeded beyond the idempotent system bootstrap. Production content library is still empty (0 `ContentItem` rows) — content must be ingested/imported in prod |
| Migration | `prisma migrate deploy` on Railway applied the 3 existing 20260926 migrations; no migration file added in this change |
| Verification | Gates before deploy: `pnpm -r typecheck` → 6/6, `pnpm --filter @sanro/api test` → 244/244 (22 files), `pnpm --filter @sanro/web build` → pass. Guard test: `--demo` against a remote host still throws, `--system` passes the guard. Live after deploy: `GET /api/v1/health` → `{"status":"ok","database":"connected"}`; with a student token `GET /learning/path` → 200 (112 concepts), `GET /remediation/weak` → 200 `[]`, `GET /content/browse` → 200, `GET /users/me` → 200, `GET /dashboard/student` → 200; `POST /auth/login` → 200 for all demo roles. Playwright against `https://app.sanroai.com` with `WEB_URL` set: `verify-roles.mts student` → 8/8, `… teacher` → 8/8, `… parent` → 3/3, `verify-empty-states.mts` → 18/18, all zero console errors and zero failed API calls |
| Known issues | Production `GET /content/browse` returns `items: []` / `total: 0` because no `ContentItem` rows exist in the prod DB — the Library page renders its empty state. Needs content ingest + publish in prod (data work, not code). CI (`.github/workflows/ci.yml`) has no deploy job; deploys are manual (`vercel deploy --prod`, `railway up --service api`) |

### 2026-09-29 — Local-run defect sweep: web dev crash, role/contract fixes, role UI verifier

| Field | Detail |
|---|---|
| Date | 2026-09-29 |
| Task | Run the whole stack locally end to end, fix every defect it surfaced (the web dev server was down for every role), and leave a repeatable per-role verification script in the repo |
| Reason | A full local run is the only honest readiness check before deployment. It exposed that `next dev` crashed on first compile, that two flagship student routes rendered "Application error", that several API calls were sent without auth headers, and that non-student roles hit 404/500/403 paths that rendered as user-facing errors |
| Entities affected | API: `apps/api/src/remediation/remediation.controller.ts`, `remediation.service.ts`, `apps/api/test/learning-path.e2e-spec.ts`. Web: `apps/web/tailwind.config.ts`, `apps/web/components/ui/button.tsx`, `apps/web/lib/api.ts`, `apps/web/lib/api-hooks.ts`, `apps/web/lib/institution-hooks.ts`, `apps/web/app/(dashboard)/app/children/page.tsx`, `curriculum/page.tsx`, `remediation/page.tsx`. Mobile: `apps/mobile/expo-types.d.ts` (new), `apps/mobile/tsconfig.json`, `apps/mobile/expo-env.d.ts` (deleted). Scripts: `scripts/verify-roles.mts` (new). Docs: `AGENTS.md`, `docs/QA.md` |
| Database changes | none — no schema change, no rows touched |
| API changes | `GET /remediation/weak` no longer 500s: the controller forwards `studentId`, and the service rejects non-UUID ids with `400 Invalid studentId`, resolves `STUDENT` to self (403 for another student's id), requires `studentId` for staff (`400`), and returns `403` for parents. Contract otherwise unchanged |
| Frontend changes | `tailwind.config.ts` replaced `require('tailwindcss-animate')` with a static import (ESM config → `ReferenceError` killed every page compile). `Button asChild` now renders `children` only (Radix `Slot` rejects a sibling spinner → "Application error" on `/app/library`, `/app/assessments`). `lib/api.ts` attaches the Zustand token when `options.token` is omitted and refreshes on 401 whenever a session exists, so profile save, change-password, add-student and add-teacher stopped failing silently with 401. `useInstitutions` gated to `SUPER_ADMIN` (teachers were 403-ing on `/app/import`). `children/page.tsx` uses the real `weakConcepts` contract `{name,score,level}` instead of never-existing fields (removed `undefined` rendering and the React key warning). `/app/remediation` is role-aware: students keep mastery + plans, staff see institution plans, super-admin sees an explanatory note instead of a 404 alert. `/app/curriculum` outer row toggles became `div role="button"` so inner `Button`s are valid HTML (hydration error gone) |
| Seed/import changes | none |
| Migration | `none — no schema change` |
| Verification | `pnpm -r typecheck` → 6/6. `pnpm --filter @sanro/api test` → **244/244 tests, 22/22 files** (8 new `GET /remediation/weak` cases: 200/400/403 for student, staff, parent, bad UUID, no id). `pnpm --filter @sanro/web build` → pass (60 pages). UI: `npx tsx scripts/verify-roles.mts student` → 8/8, `… teacher` → 8/8, `… parent` → 3/3, `npx tsx scripts/verify-empty-states.mts` → 18/18 — **zero console errors and zero >=400 API calls in every run**; `/app/learn` → 307 to `/app/library`. Screenshots + `summary.json` under `screenshots/{student,teacher,parent,empty-state}/` (git-ignored). Live probes: `GET /remediation/weak` 200 `[]` (student), 400 (staff without id), 400 (bad UUID), 403 (parent); all 5 demo logins 200; `/api/v1/admin/super-admin/dashboard/*` 200 |
| Known issues | none identified yet. Expo's `typedRoutes: false` makes `expo start` delete `apps/mobile/expo-env.d.ts` and strip the two `include` entries from `apps/mobile/tsconfig.json` — now intended state; `apps/mobile/expo-types.d.ts` supplies the same `expo/types` reference so mobile typecheck passes regardless |

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
