# SANRO AI — Product Roadmap & Content Taxonomy

**Status:** DECIDED & IMPLEMENTED (2026-10-19) · updated 2026-10-21 (§6, §7)
**Basis:** Benchmark research across Khan Academy, BYJU'S, Vedantu, Toppr, Doubtnut,
Extramarks, Teachmint, Google Classroom, Coursera; CBSE 2025-26 assessment policy;
Indian edtech post-mortems. Sources inline.
**Addendum (2026-10-21):** gamification + video-curation research (Trophy leaderboard
spec, BuddyNext engagement docs, *Journal of Computer Assisted Learning* systematic
review on leaderboards in higher education, ACER/EdTech Tulna video-evaluation
standards, NCERT CIET). Sources inline in §6.

This supersedes ad-hoc feature planning. It records two decisions: a **content
taxonomy cut (17 → 6 lesson types)** and a **ranked roadmap (P0/P1/P2/CUT)**.

---

## 1. Content taxonomy: 17 → 6 lesson types

### 1.1 The problem

`ContentType` had grown to **17 values**, but real usage was 3:

| Evidence | Types actually present |
|---|---|
| `sanro_dev` rows | VIDEO 69, NOTES 67, ARTICLE 7 → **14 of 17 empty** |
| `seed.ts` ContentItems | VIDEO, NOTES, ARTICLE only |
| Union of Khan/BYJU'S/Teachmint/Google Classroom | **~6 assignable types** |

Every extra type is authoring, curation, and QA cost with a long tail of unused
rows — the "overloaded, fragmented" content-library failure (Degreed). A 17-type
list is ~3× what leading products ship.

### 1.2 Canonical set (implemented)

| # | Type | UI label | Meaning |
|---|---|---|---|
| 1 | `VIDEO` | Video | Animated / recorded lesson |
| 2 | `NOTES` | Notes | Readable text lesson (absorbs ARTICLE, READING, PDF) |
| 3 | `WORKSHEET` | Worksheet | Downloadable / printable practice sheet |
| 4 | `INTERACTIVE` | Interactive | Simulation / game / 3D / AR experience |
| 5 | `EXAMPLE` | Example | Worked-solution walkthrough |
| 6 | `OTHER` | **Resource** | Governed catch-all (audited, not a dumping ground) |

> `OTHER` is deliberately kept as the **DB value** for the catch-all and surfaced
> as the label **"Resource"**. `RESOURCE` is *not* a Prisma enum value, so **no
> migration is required**.

**Folding map (legacy → canonical):**

| Canonical | Folds in |
|---|---|
| NOTES | ARTICLE, READING, PDF |
| INTERACTIVE | MODEL_3D, GAME, AR |
| OTHER | QUIZ, PRACTICE_SET, IMAGE, REVISION, FLASHCARDS |
| VIDEO / WORKSHEET / EXAMPLE | (self) |

### 1.3 Why each was kept / merged / cut

| Type | Verdict | Rationale + source |
|---|---|---|
| VIDEO | **KEEP** | Universal core type — Khan, BYJU'S, Toppr, Vedantu all lead with it. |
| NOTES | **KEEP** | Teachmint ships "notes"; Vedantu ships "downloadable notes." |
| WORKSHEET | **KEEP** | Real India-market item (BYJU'S printables, Extramarks worksheets); also serves low-bandwidth. |
| INTERACTIVE | **KEEP** | Absorbs MODEL_3D + GAME + AR-links; Teachmint/Extramarks market interactive modules. |
| EXAMPLE | **KEEP** | Worked-example walkthrough is Doubtnut's core value prop. |
| OTHER→Resource | **KEEP** | Governed escape hatch (renamed, audited) — avoids a dead-end for uncategorized items. |
| PDF | **MERGE → NOTES** | PDF is a *file format*, not a pedagogy — Google Classroom treats files as attachments. |
| ARTICLE, READING | **MERGE → NOTES** | Khan uses a single text type ("article" == text lesson). |
| MODEL_3D, GAME | **MERGE → INTERACTIVE** | No sampled product exposes 3D/game as a separate student-facing library row. |
| QUIZ | **CUT** | Belongs to the **assessment system** (Quick Quiz mode + question bank), not the library. |
| PRACTICE_SET | **CUT** | Redundant with Practice mode + question system. |
| FLASHCARDS | **CUT** | Already a dedicated system + concept-page mode. |
| AR | **CUT** | Has a dedicated `ArContent` table; ContentItem only *links* to it. |
| IMAGE | **CUT** | An asset, embedded in NOTES / attached to a question — never browsed alone. |
| REVISION | **CUT** | A *curated view/flag* over NOTES+VIDEO, not a type. |

### 1.4 How it is enforced (no destructive migration)

| Layer | Change |
|---|---|
| **Canonical module** | `apps/api/src/common/content/content-types.ts` — `canonicalContentType`, `canonicalTypeMembers`, `mergeCanonicalCounts`. |
| **Read path** | `curriculum/content.service.ts` — type filter **expands** canonical → legacy members; `facets.byType` **merges** to canonical; chapter `contentByType` canonicalized. |
| **Admin list** | `content-library/content-library.service.ts` — filter expands to legacy members. |
| **Authoring gate** | `content-library.controller.ts` + `curriculum.controller.ts` `ContentTypes` narrowed **17 → 6** (create, update, and query now speak canonical only). |
| **Writers** | PDF-book ingest → `NOTES`; KB flashcard container → `OTHER`. No new legacy rows. |
| **UI** | `library/page.tsx` `TYPE_META` reduced to 6 + `LEGACY_TYPE_ALIAS` normalizer (old rows still render a canonical badge); "Resource" label. |
| **Data** | `seed.ts` ARTICLE → NOTES; `sanro_dev` + `sanro_test` remapped (0 legacy rows). |

**Prisma enum is intentionally left at 17 values.** Reasons:
1. `RemediationItem.contentType` shares the enum and legitimately writes
   `PRACTICE_SET`/`QUIZ` as **plan-step markers** (not lesson taxonomy).
2. Production rows are unknown and cannot be checked read-only; runtime folding
   makes prod correct **without** a risky `ALTER TYPE` enum-recreation migration.
3. Legacy rows stay reachable and display canonically, so correctness does not
   depend on running a prod migration first.

---

## 2. Ranked roadmap

### P0 — Must-have (ship before anything else)
| Item | Evidence |
|---|---|
| **Item bank tagged to CBSE competency-based question types** (MCQ, case/source-based, assertion-reason, subjective) | CBSE 2025-26: competency-based questions ≈ **40–50%** of Class 10 theory (Vedantu / Jagranjosh); CBSE itself publishes CBE test items (cbseacademic.nic.in) and is building a central item-bank platform under NEP 2020 (News18). |
| **Blueprint-based paper generation** (chapter weightage + marks + difficulty) | QB365 ships "chapter-wise weightage and blueprint mapping"; QP-Genie adds Bloom's/CO blueprint rules. |
| **Mastery model** (not-started → familiar → proficient → mastered, mixed-skill confirmation, spiral review) | Khan's exact ladder; mastery requires a mixed-skill correct answer after proficiency (Khan MAP guide). |
| **Formative vs summative separation** (practice = ungraded feedback; tests = scored mastery) | Foundational in K-12 assessment literature (Marzano, MagicBox). |
| **Offline-first mobile** (bulk download, queue, sync) | DIKSHA ships offline store/share; rural mobile median ≈ 58.8% of urban speed (Ookla). |

### P1 — Should-have (post-P0)
| Item | Evidence |
|---|---|
| **Teacher workflow:** auto-grading + one-place review + gradebook transfer | Teachers spend 11+ hrs/week grading; 1/3 considered quitting over it (Learnosity, Third Rock). |
| **Parent reporting** (progress dashboard, at-a-glance mastery — not raw scores) | BYJU'S parent dashboard; Extramarks ships a Parent App; India's PARAKH mandates a 360° Holistic Progress Card (ncert.nic.in/parakh). |
| **Standards/competency-based reporting** (per-skill proficiency) | SBG reports per-standard proficiency, separating mastery from behavior. |
| **Seat-based institutional licensing in ₹/student/month** | Indian school software real pricing: ₹20–25/student/mo ERP, ₹5 budget tier — **price in ₹/student/month, not $/student/yr**. |

### P2 — Later
- AR/3D as *enhancements* (link out to `ArContent`) — real benefit, secondary to the assessment core.
- Live-class integration / recording.
- AI answer-writing feedback for subjective CBSE answers (high value, hard to do well).

### CUT / Defer
- Standalone 3D / AR / GAME **content types** (§1.3) — folded or removed.
- Gamification beyond streaks/XP — engagement garnish, not the loop.
- Consumer-style content-library sprawl — see failure mode #1.

---

## 3. Failure modes to avoid

1. **Acquisition over retention / content sprawl → 5–15% completion.** Survivor
   playbook: solve retention before growth; B2B school contracts. India's consumer
   edtech lost >$15B paper value (IdeaProof 2026).
2. **M&A / portfolio bloat kills focus** — Byju's spent $2B+ on acquisitions
   creating an unmanageable money-losing portfolio (IdeaProof).
3. **Content is not a moat; feature bloat harms the core UX.** Content libraries
   become "expensive, overloaded, fragmented" (Degreed); feature bloat clutters the
   interface (IIM-A ProdMan). → *This is exactly why 17 → 6.*
4. **Wrong moat** — consumer edtech is substituted by free AI tutors, not
   complemented (IdeaProof). SANRO's moat is **assessment → diagnosis → measurable
   improvement**, not a content library.
5. **Post-COVID demand collapse + hardware/live-cost bloat** — Vedantu laid off
   40%; Lido grew 300→1,200 staff and collapsed (IdeaProof).

---

## 4. Information architecture

**Keep the existing two-surface split — it is the industry-correct pattern.**

| Surface | Job | Model |
|---|---|---|
| **Library** (`/app/library`, mobile `learn`) | Self-directed browse, Board → Grade → Subject → Chapter → Topic → Concept | Khan "Explore library"; shows only the **6 canonical types**. |
| **Assessments** (`/app/assessments`, mobile `tests`) | Diagnosis-driven Path + Tests | Google Classroom is assignment-first, no browse grid. |
| **Student Home = "TODAY"** | Next best action: weak-concept *Fix This* + upcoming test — **never a browse grid** | Khan "Learning Queue" leads with mastery + assigned work. |
| **Concept detail (6 modes)** | The bridge | Learn/Practice/Quiz/Flashcards/Challenge/Ask must **pull from their owning systems**, not duplicate ContentItem rows. |

Rationale: Khan keeps "Explore library" (browse) separate from the "Learning
Queue" (assigned, due-date sorted); Google Classroom never lets students browse a
catalog — they see *what's assigned*. Content library and assessment containers
must not share a grid — that is where the redundant QUIZ/PRACTICE_SET/FLASHCARDS
types were leaking in.

---

## 5. Next actions

1. Run `pnpm -r typecheck` + full API/web/mobile suites after the taxonomy change.
2. Optional (later, reviewed): prod `ContentItem` cleanup migration to canonical —
   **not required for correctness** (runtime folding already handles legacy rows).
3. Ship P0 items in §2 order.

---

## 6. Gamification & content-quality decisions (2026-10-21)

Research performed with the connected MCPs (exa web search + context7 + deepwiki +
postgres), then implemented and verified in the app and on the physical device.

### 6.1 The leaderboard was decorative — now it is a real loop

| Finding | Source | Change made |
|---|---|---|
| The `period` parameter was **accepted and ignored** — weekly/monthly/all returned identical rows, so the UI label lied. | code audit | New **XP ledger** (`XpEvent`: student, xp, reason, createdAt) written on every award; the leaderboard sums the ledger per window. Two migrations (`add_xp_event_ledger`, idempotent `backfill_xp_event_ledger` so prod inherits existing XP on deploy). |
| "This Week" must mean the **calendar week** (Monday, local), not a rolling 7×24h window — otherwise Monday's XP counts into last week. | product correctness | Weekly window = start of the current week (Monday 00:00 local). Asserted by a new e2e case. |
| Repeating, resettable boards beat perpetual ones; a **global** board is much weaker than a **segmented** one (users must compete with peers they can identify with). | trophy.so leaderboard spec (2025-10) | **Class segmentation**: `?groupId=` scopes the board to one class. The API returns the caller's permitted scopes inline (`groups`), and web + mobile render a **Scope** selector: *Whole school* / *Class 10 - A*. |
| In education, macro boards need **micro boards** (per activity/class) or low-ranked learners disengage. | JCAL systematic review, *Journal of Computer Assisted Learning* 2024 (10.1111/jcal.13077) | Class scope is the first micro board; per-activity boards remain a P2 idea (see below). |
| The board should be a **quiet nudge**, not the headline; show the learner's own standing. | BuddyNext engagement docs | Existing "Your Rank" badge + podium retained; scope/period stay secondary controls. |

Verified: class scope → only that class (Aarav, 420 XP); whole school → Aarav 420, Priya 900,
Rohan 300 with the 3D podium. Spec: `apps/api/test/leaderboard-period.e2e-spec.ts` (5 cases).

### 6.2 Video curation is now syllabus-verified, not keyword-guessed

The seed pointed **64 lessons at 24 fabricated YouTube IDs** (a statistics lesson mapped
to a chemistry video). Every video is now sourced with a curriculum-informed pipeline
(`scripts/qa/source-video-lessons.mjs` → oEmbed + thumbnail verification → relevance
scoring), **audited against the NCERT textbook extracts in `books/`**
(`scripts/qa/audit-videos-vs-syllabus.mjs`): 61/70 aligned on the first pass, 4
re-sourced (a Maharashtra-board video, a video not about equations, a Bohr-only video
where the lesson covers all three atomic models, a sphere-only video for a
cylinder+cone+sphere lesson).

| Finding | Source | Change made |
|---|---|---|
| Curated resources should be judged on **curricular alignment, grade appropriateness, language, engagement and inclusivity** — not "does a video exist". | ACER content-evaluation standards / EdTech Tulna design standards (IIT Bombay) | The audit scores each video against the **chapter's own vocabulary** extracted from `books/` (science study notes; maths PDF text) and the lesson's concept terms. Misalignments are re-sourced. |
| Shorter, interactive, student-centric videos engage better than long lectures. | ACER learnings | Lesson durations now reflect the sourced videos' real length where known; long "one shot" videos are deprioritised by the scorer. |
| A **standardised QA process** is what makes content selection repeatable. | ACER / CIET (NCERT) | The pipeline is scriptable and re-runnable: `source → apply → audit → verify liveness` (`scripts/qa/verify-video-liveness.mjs` proves 67/67 ids are alive with working thumbnails). |

### 6.3 Deliberately NOT built (and why)

| Idea | Why not |
|---|---|
| Per-activity micro leaderboards (practice / quiz / streak boards) | Real (JCAL), but needs an XP-event taxonomy per activity; the class scope lands the same benefit with one query. P2. |
| Timezone-aware weekly resets per institution | `startOfCurrentWeek()` uses the server's local week. Institutions can sit in multiple timezones; a per-institution timezone is a settings feature, not a leaderboard fix. Tracked as P2. |
| Automatic video transcription / captioning | The transcript MCP route is blocked from this network (caption endpoint unreachable); a YouTube Data API key would be needed. P2. |
| "Curriculum-verified" badge on lesson cards | The audit produces the verdict, but surfacing it per card needs a schema field on `ContentItem`. Deferred until a content reviewer actually maintains the badge. |

---

## 7. Unnecessary flows and features removed (2026-10-21)

Deletion was evidence-based: every item below was either superseded by a better
mechanism, duplicated an existing one, or was dead code.

| Removed | Why it was unnecessary |
|---|---|
| `scripts/screenshots-all.mts`, `-fast.mts`, `-verify.mts`, `student-`, `teacher-`, `tab-screenshots.mts`, `test-login.mts`, `debug-screenshot.mts` (8 files) | Nine overlapping ways to take the same screenshots. Replaced by **one** `scripts/screenshots.mts` with `--role / --viewport / --out / --tabs / --login-only / --wait / --no-start` flags, which also resolves live concept/library ids at runtime (the old scripts hard-coded uuids that a re-seed invalidates). |
| `scripts/qa/extract-video-lessons.mjs` | One-off parser for a map that the new sourcing/audit pipeline reads directly. |
| `scripts/qa/probe-prod-content.mjs` | Prod's API gateway does not route the API from this network, so the probe could never pass here; the equivalent check belongs in a prod-connected environment. |
| `apps/api/prisma/e2e-remediation-orphan.mts` | Orphaned manual script ("orphan" in the name), superseded by the e2e suite. |
| Duplicated `.env` parsing (`src/common/demo-password.ts` re-implemented the loader) | One implementation now: `src/common/api-env.ts` (the seed's loader, re-exported from `prisma/env-loader.ts` so existing imports keep working). |
| npm-style `overrides` block in `package.json` | pnpm never read it — a security control that did nothing. Moved to `pnpm-workspace.yaml` (12 real pins now in force). |
| `youtube` MCP (added, then proven dead) | 7/7 transcript fetches failed on videos with known-good captions while oEmbed controls returned 200 — the caption endpoint is blocked from this network. |
| `tavily` MCP | 401 without an API key; `exa` covers the same need keyless. |
| Hardcoded demo password in 27 files | Now read from `SEED_DEMO_PASSWORD` in the git-ignored `apps/api/.env`; `grep` over the source tree returns nothing. |

---

## 8. Product structure - the concept page, decided and shipped (2026-10-21)

The concept page had **seven** modes. Three of them showed the *same* question pool and two
of them promised XP that was never awarded. This section records the decision, the resulting
structure, and the roadmap that follows from it.

### 8.1 What the seven modes actually were (evidence, not opinion)

| Mode | Data source | Records mastery? | Awards XP? | Verdict |
|---|---|---|---|---|
| Learn | `ContentItem` (video/notes) | no | no | **keep** - the content |
| Practice | server session -> `PracticeSet` | **yes** | no (before this change) | **keep** - the assessment edge |
| Quick Quiz | `concept.practiceQuestions` (client-side) | no | promised "+25 XP", awarded nothing | **cut** |
| Challenge | same pool, routed to the *same* practice screen | yes | promised "50 XP max", awarded nothing | **cut** |
| Flashcards | same pool, flip + self-rating -> `flashcardRatings` | no | no | **keep** - a different learning behaviour |
| AR / 3D | `ArCard` models | no | no | **moved into Learn** - it is lesson content |
| Ask Sanro AI | AI service | no | no | **keep** - the contextual tutor |

### 8.2 The shipped structure (4 modes)

```
Concept
|-- Learn ................ video lessons (plays inline) - study notes - quick revision
|                          `-- Interactive 3D Model  -> opens the viewer (modal/dialog)
|-- Practice ............. server-side session, per-question timer, records mastery + XP
|-- Flashcards ........... flip + confidence (Again / Hard / Good / Easy), stored server-side
`-- Ask Sanro AI ......... context-aware tutor for this concept
```

Why this shape:
- **One surface per kind of evidence.** Learn = content, Practice = graded evidence,
  Flashcards = self-rated recall, Ask = help. No two modes answer the same question.
- **AR/3D is content, not an activity.** Putting it inside Learn removes a mode *and* stops
  the heavy 3D viewer from mounting on page load.
- **The bar fits.** Four pills need no horizontal scrolling, which removes the class of
  layout bugs that produced the clipped labels (BUG-N) in the first place.

### 8.3 The XP promises are now real

| Action | XP | Written to |
|---|---|---|
| Assessment completed | the assessment score | `XpEvent` (`ASSESSMENT_COMPLETED`) |
| Practice answered | 5 per correct answer + 10 for finishing | `XpEvent` (`PRACTICE_COMPLETED`) |
| Flashcard rated | 0 | - (it is a recall signal, not an achievement) |

One implementation (`apps/api/src/common/xp.ts`) owns both the award and the streak rule, so
the UI can never promise XP that the ledger does not contain.

### 8.4 Roadmap that follows

**Shipped now (P0):** 4-mode concept page (web + mobile), AR/3D inside Learn, practice XP +
streak fix, the practice-submit crash fixed, truthful XP copy, a 4-mode mobile test and a
practice-flow e2e suite.

**Next (P1) - each is small and evidence-backed:**
1. **Video chapters (split by time).** Every sourced video already carries YouTube chapter
   markers; store them on the content item and render a chapter strip under the player so a
   student can jump to "Total Surface Area" instead of scrubbing a 40-minute one-shot.
2. **Micro leaderboards.** Per-concept boards (the JCAL finding): a class board scoped to one
   chapter beats one global board for engagement.
3. **Flashcards -> spaced repetition.** The ratings are already stored; the scheduler that
   decides what to show next is the missing piece.
4. **Per-question timer tuning.** The shared practice screen has a timer; measure where
   students drop out before changing it.

**Later (P2):** live AI probes (needs `AI_API_KEY`), transcripts (needs a YouTube Data key),
per-institution timezone for the weekly reset, a "curriculum-verified" badge on lesson cards.

**Deliberately cut (and why):** per-activity leaderboards (the XP-event taxonomy per activity
buys little before the class board lands), a second "quick drill" mode (it was the duplicate
we just removed), a native YouTube player (the WebView embed now works and stays in-app),
and any mode that re-renders the same question pool under a different name.

---

## 9. Round two of simplification and truthfulness (2026-10-22)

### 9.1 The concept page is now three modes

The user asked the right question: *"why do we need flashcard and practice separately?"* - they
do not need to be separate. The answer, and the change:

| Before (7) | Now (3) | Why |
|---|---|---|
| Learn | **Learn** | content + the 3D model card |
| Practice | **Practice** - *Quiz* / *Flashcards* | one study surface, two formats |
| Quick Quiz | *cut* | same question pool as Practice, no mastery recorded |
| Flashcards | *moved inside Practice* | a format, not a mode |
| Challenge | *cut* | routed to the very same screen as Practice |
| AR / 3D | *moved inside Learn* | lesson content, not a peer activity |
| Ask Sanro AI | **Ask Sanro AI** | the contextual tutor |

One surface per kind of evidence (content / study / help). The mode bar now fits without
scrolling, which removes the class of layout bugs that produced clipped labels.

### 9.2 The XP the UI promised is now real

Practice awards **5 XP per correct answer + 10 XP for finishing**; assessments award the
assessment score; both are written to the XP ledger, and one implementation owns the
calendar-day streak rule.

### 9.3 A ten-second clip teaches nothing - short videos are gone

The audit found **21 of 70** lesson videos were under two minutes (8s, 9s, 12s, 15s ...).
The sourcing pipeline now reads the real duration from the video and **rejects candidates
under 120s**, and the seed carries the **real** durations instead of invented ones.
Result: **70/70 videos carry content** (shortest 123s, median 15 minutes).

### 9.4 The NCERT English book is extracted like Science

The books pipeline is subject-aware (`--subject science|english`). The English book
(10 PDFs, 152 pages, First Flight 2026-27) is extracted with text, page screenshots, embedded
figures and an OCR cross-check (confidence 89.2, text-layer similarity 0.955) - the same
quality bar as Science.

### 9.5 MCP: 27 servers, all enabled

Every server the user listed is configured and enabled in
`C:\Users\Harish\.config\opencode\opencode.jsonc`; the keyless ones answer live in the
running session, the credentialed ones need their env var (see `docs/MCP_SETUP.md`).

---

## 10. The chapter layer and web/mobile parity (2026-10-22)

### 10.1 A chapter page, and what "clicking a chapter name" means

The concept page had no way back up, and a chapter is the unit a teacher assigns and a
student revises. So the chapter becomes a real place in the product:

| Clicking a chapter name | Result |
|---|---|
| a **curriculum chapter** | opens the **chapter hub** |
| a **concept** | opens the concept page |
| a **video chapter marker** (with a visible timestamp) | **seeks the player in place**, never navigates away |

The hub is **one scroll, five sections, in learning-loop order** - no tabs (tabs hide what a
teacher wants a student to see, and on a phone every tab is a tap):

1. **Continue** - the first concept that is not mastered, with the chapter's progress
2. **Contents** - every concept with its mastery badge and a link
3. **Learn** - the chapter's videos (each **split by time** into the teacher's own chapter
   markers), the overall chapter notes, and **the textbook chapter PDF, viewable in the app**
4. **Practise** - one practice session over the whole chapter
5. **Ask** - *Ask SANRO AI about this chapter*

The full interaction model and the edge-case table are in `docs/FEATURE_CHAPTER_HUB.md`.

### 10.2 Web and mobile must be the same product

The rule: **every student-facing capability exists on both platforms with the same behaviour
and the same numbers**; authoring and administration stay web-only by design. Both clients
call the same API, so a missing capability is an API gap rather than a mobile gap.
The living parity table, the accepted differences and the sweep are in
`docs/PARITY_POLICY.md`, and `scripts/qa/audit-web-mobile-parity.mjs` fails the build when
a student capability exists on one side only.

### 10.3 The chapter markers come from the videos themselves

YouTube carries the creator's own chapter list (`macroMarkersListRenderer`) and, failing
that, timestamps in the description. `scripts/qa/source-video-chapters.mjs` reads them and
`scripts/qa/apply-video-chapters.mjs` stores them on the content item
(`ContentItem.segments`), so a 40-minute one-shot becomes a navigable set of parts.

### 10.4 Books: class 8, 9 and 10

The extraction pipeline is subject- and class-aware (`--subject science|english|mathematics
--class 8|9|10`), so every NCERT book the product ships with can be turned into text, page
screenshots, figures, an OCR cross-check and a readable index - the same bar for every class.
