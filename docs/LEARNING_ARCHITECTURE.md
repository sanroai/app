# SANRO AI — Learning Architecture

Two menus, one spine: `Board → Grade → Subject → Chapter → Topic → Concept`.

## 1. Path A: The Library (self-directed)

Hierarchy: Class → Subject → Chapter → Topic → Concept.

Intended experience: a premium academic library. Self-directed. A student who
only wants to study is never forced through remediation.

Menu: **Library** — web `/app/library`, mobile `learn` tab (title `Library`).
`/app/learn` permanently redirects to `/app/library`.

- Browse: Home → Library → Class → Subject → Chapter → Topic → Concept
- Lesson item detail: `/app/library/item/[contentId]`
- Continue learning (resume last concept)
- Search across curriculum + content (role/tenant/publication filtered)
- Bookmark/save concepts
- Concept page modalities — **three**, one surface per kind of evidence
  (the 7 → 3 cut and its rationale are in `docs/ROADMAP.md` §9):
  - Learn (video + notes + quick revision)
  - Practice (backend-driven quiz w/ mastery tracking)
  - Quick Quiz (5 concept questions from DB) -- CUT 2026-10-21 (same pool as Practice; XP never awarded)
  - Flashcards (real questions, self-rated Again/Hard/Good/Easy) -- now a FORMAT inside Practice, not a mode
  - Challenge (timed 60s / 10 Qs / 50 XP max) -- CUT 2026-10-21 (routed to the same screen as Practice)
  - AR/3D (where assets mapped) -- moved INSIDE Learn (lesson content, not a peer mode)
  - Ask SANRO (context-aware AI)

## 2. Path B: The Assessments learning Path (diagnosis-driven)

Menu: **Assessments** — web `/app/assessments`, mobile `tests` tab (title
`Assessments`). Two tabs:

- **Path** — the ordered concept list produced by diagnosis. Every row carries
  `mastered | inProgress | notStarted`, the evidence behind it, and the next
  action (`Fix This` → practice, or retest when already attempted). It is the
  "TODAY → DO THIS → IMPROVE" surface.
- **Tests** — assignments/attempts (the former `/app/assessments` content).

Retests are **student-triggered**: `POST /remediation/retest` accepts
`STUDENT`, and `studentId` is optional (omit → own concepts).

The Library never contains diagnosis state; the Path never contains browse
state. Content authored in the Library becomes reachable in the Path only
through diagnosis of that concept.

## 3. API Surfacing

- `/content/browse` — paginated lesson browse (Library); registered before
  `/content/:id`. Student visibility always reduced to
  `ContentStatus.APPROVED|PUBLISHED` by `ContentScopeService.buildContentWhere`
- `/content/videos` (`GET|POST|DELETE`) — chapter-wise YouTube lessons
- `/learning/home` — student dashboard data (focus, continue, pending)
- `/learning/path` — ordered diagnosis-derived concepts + state
  (`PARENT_RESTRICTED_KEY`)
- `/learning/boards/:boardId/grades/:grade/subjects/:subjectId/chapters`,
  `/learning/chapters/:id` (+ `chapterContent`), `/learning/concepts/:id`
  — chapter tree with concepts
- `/learning/content/:contentId/complete`, `/learning/progress`
- `/learning/practice/start|:id|:id/answer|:id/submit`
- `/learning/flashcards/:questionId/rate`
- Gamification: `/learning/gamification/profile|leaderboard|achievements`
- Remediation: `/remediation/my|plans|weak|items/:id/status|retest`

## 4. Student Grade Filtering

Learning content is filtered by the student's grade/class assignment. A grade
with no published content renders a proper empty state (no 0/0 lessons).

## 5. Practice

Entered from Library, Concept, Assessment result, Fix This, Remediation.
Backend-driven questions only. Track attempt, correctness, concept, difficulty,
evidence. No hardcoded questions anywhere in the student experience.
