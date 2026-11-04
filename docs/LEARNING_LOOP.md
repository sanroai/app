# The learning loop — explanations, spacing, and practice that can't be memorised

Status: **shipped 2026-11-03**. Applies to the API plus both clients.

This is the answer to "we have 1,089 concepts and 3,335 questions — how do we make
them actually teach?" The decision was **not more content**: the bank was already
deep enough, and the three things the evidence says matter most were missing or
broken.

| Lever | Evidence | Before | Now |
|---|---|---|---|
| Corrective feedback | d ≈ 0.73 (Hattie; Wisniewski 2020) | one template sentence on **3,335/3,335** questions | authored explanation, else the notes sentence that supports the answer |
| Distributed practice | d = 0.54 [0.31, 0.77] (Mawson 2025, classroom) | **no scheduler at all** | `ConceptMastery.nextReviewAt` + a "Review today" queue |
| Interleaving | g = 0.34 (Brunmair & Richter 2019, maths) | order fixed by `createdAt` | per-session shuffle, no re-serving what was just answered correctly |

## 1. Feedback: what a student reads after answering

`apps/api/src/learning/question-feedback.ts` resolves one explanation per
question, in this order:

1. **`authored`** — the question's own `explanation` (the goal).
2. **`notes`** — the sentence of the concept's (or the chapter's) lesson notes
   that best supports the answer, quoted verbatim. Scored by overlap with the
   answer (×3), the concept name (×2) and the question wording (×1); a quote must
   score ≥ 4 and be 25–420 characters.
3. **`answer`** — a last resort that restates the answer and names the concept.
   This is the authoring backlog, and the audit counts it.

The sentence `"Refer to the chapter notes for the detailed solution."` is
treated as **absent** (`LEGACY_EXPLANATION`), so a stale row can never come back
as "feedback".

Where it appears:

- **immediately** — `POST /learning/practice/:id/answer` returns
  `{ correct, correctAnswer, explanation, explanationSource, locked }`, so the
  client paints the reason under the question the student just answered;
- **at the end of the set** — `POST /learning/practice/:id/submit` returns
  `review[]`, one entry per question (text, your answer, correct answer, whether
  it was graded, explanation).

### The answer is final

Because the correct answer is revealed the moment a question is answered, the
answer itself has to be final — otherwise a student clicks the option they have
just been shown and the score measures reading rather than knowledge.

- The API stores the **first** answer and returns it (with `locked: true`) on any
  repeat call, instead of overwriting it. A dropped request retried by the client
  therefore still gets the grade it already had.
- Both clients disable the option buttons as soon as one is chosen, show
  *"Your answer is final"*, and unlock the question again if the save fails so it
  can be retried.
- **Written answers stay editable** until submit: they are not auto-graded, so
  locking them would only punish a typo.
- `MULTI_SELECT` is never locked after one tap (its answer is sent on every
  toggle) — it is not used in the current bank, but the rule would be wrong.

Guard: `test/practice-flow.e2e-spec.ts` → *refuses to change an answer once it has
been given* (answers wrongly, tries to switch to the revealed answer, checks the
stored row and the final score).

Measured coverage on the current bank (`npx tsx scripts/qa/audit-question-explanations.mts`):

```
questions     : 3335
  authored    : 3335 (100%)   a written explanation on every question
  notes       :    0
  answer only :    0
```

**Every question in every class (1-10, Science, Mathematics and English) carries
an authored explanation**, in the repo, in the dev database and in production
(Neon: `total=3335, without_authored=0`). The last sync reported
`{"authored":3335,"updated":466,"alreadyCorrect":2869,"orphaned":0}`.

### How the content was authored

The volume (3,335 explanations) needed a pipeline, not a typing session:

1. `scripts/qa/export-explanations-input.mjs --list` shows the chapters that still
   need work, with counts; `--codes A,B,C --out file.json` writes the exact input
   for a batch (question text, type, answer, distractors).
2. Batches of 50-60 were authored in parallel and saved as
   `explanations-*.json`.
3. `scripts/qa/merge-explanations.mjs --dir artifacts/qa/explanations` validates
   every entry - the question text must match the database **exactly**, the
   explanation must be a real sentence of at least 40 characters, never the legacy
   template - and appends the survivors to the map. Anything that fails is
   reported and skipped, never silently written.
4. `apply-question-explanations.mjs` (local) or `POST /questions/sync-explanations`
   (deployed) writes them to the database.

The batch pass also surfaced content defects that the merge could not fix itself,
each corrected in the seed, the dev database and production: a palindrome question
whose distractor `5,445` was also a palindrome (now `5,425`), a fraction question
where `6/15` equalled the keyed `2/5` (now `6/9`), a germination question whose
dark-but-moist pot would also have germinated (now dry soil), and a non-uniform
motion item whose "motion along a circle" distractor was also non-uniform.

### Where the content lives, and how it reaches production

`apps/api/src/content/question-explanations.ts` is the **single** copy of the
map, used by two things:

- `prisma/seed.ts` applies it on every seed, including the `--system` bootstrap —
  so a fresh install and a local re-seed both carry it;
- `POST /questions/sync-explanations` (super-admin, idempotent) applies it to a
  deployed database, because **the curriculum is never re-seeded in production**
  and the free Render service runs neither migrations nor a seed on deploy.

So a corrected explanation ships as: edit the map → deploy the API → call the
sync endpoint once. Nothing else is required, and nothing is overwritten that a
teacher authored (only `source = SEED` rows are written).

### Authoring rule (enforced)

`scripts/qa/validate-question-fragments.mjs` refuses a fragment whose question has
no `explanation`, is under 40 characters, is not a sentence, or is the legacy
template. `scripts/qa/merge-question-fragments.mjs` writes the explanation into
`QUESTION_EXPLANATIONS` for a new question. `scripts/qa/apply-question-explanations.mjs`
applies the map to a local database.

A question whose text changes loses its explanation; the audit and the sync
endpoint both report the orphan key instead of silently showing the wrong
reasoning.

## 2. Spacing: `nextReviewAt`

`apps/api/src/common/mastery/review-schedule.ts` is the only place the intervals
live: **1 → 3 → 7 → 21 → 45 days**.

- a weak result (< 50%) collapses the interval to 1 day;
- a middling result (50–79%) holds it;
- a strong result (≥ 80%) moves to the next rung.

`MasteryService.applyAttemptEvidence` writes `nextReviewAt`, `reviewIntervalDays`
and `lastReviewedAt` on every piece of evidence, so both practice and assessments
feed the schedule. Rows written before this existed have `nextReviewAt = NULL`,
which the queue treats as **due now** — a student with history sees a queue on the
first load after the migration.

`GET /learning/review` (student only) returns:

```json
{
  "dueNow": 74,          // the true backlog
  "count": 6,            // the short session we offer
  "concepts": [ { "conceptId", "name", "chapterId", "chapterName", "grade",
                  "subject", "level", "score", "intervalDays", "dueAt", "reason" } ],
  "nextDueAt": "2026-11-04T…"
}
```

Selection: due rows only, filtered to the classes the student may read, weakest
level first, then earliest due, then **round-robin across subjects** so a session
is never one chapter repeated.

`POST /learning/review/start` builds one practice set over those concepts through
the same assembly as a chapter practice.

Both clients show a **Review today** card on Home that renders nothing when the
queue is empty, and falls back to the first due concept's practice if the set
cannot be built.

## 3. Practice selection

`startPractice` (one concept):

- a question answered **correctly in the last 3 days** is not re-served *while
  something else is available*;
- preference order: the concept's own unseen questions → unseen questions of
  sibling concepts → the concept's recent questions → recent sibling questions;
- the set never grows beyond the concept's own bank (the student asked for that
  concept), and **one question of the chosen concept always survives**, so the
  mastery row the student is looking at actually updates.

`startConceptGroupPractice` (chapter practice and the review queue): fresh first,
recent only to fill a set that would otherwise be short.

**A set never asks the same question twice.** Eighteen questions in the bank were
authored twice - "What is the degree of the polynomial 4x^3 - 2x + 7?" and "The
degree of the polynomial 4x^3 - 2x + 7 is:" are one question with two wordings. A
student who meets both in one set has answered one question and been told twice,
which also reads as a bug.

`withoutRepeats` (`learning/question-fingerprint.ts`) drops the second copy
**before** the set is cut, so the freed slot goes to the next candidate in the same
preference order. Ordering first and cutting second is the whole point: cutting
first and then filtering hands back a short set, and widening the window instead
pulled recently-answered questions into sets that had enough fresh ones (three
unit tests said so). The fingerprint keeps figures and brackets, because those are
what make two questions different: `6:40-8:15` is not `6:15-8:00`, and
`3 + 4 x 2` (11) is not `(3 + 4) x 2` (14).

The duplicate rows are deliberately **not deleted**. Most sit on concepts holding
exactly the three questions `MASTERY_EVIDENCE_MIN_QUESTIONS` needs, so removing one
would leave that concept unable to produce enough evidence in a single session.
What matters is that three of them be three *different* questions, so
`audit-distinct-questions.mts` measures exactly that: **27 concepts held three rows
that were two questions**, and each gained one authored question through
`content/question-additions.ts` (`POST /questions/sync-additions` applies them to a
deployment, which is never re-seeded). The audit now reports 0.

Both shuffle with Fisher-Yates (the old `.sort(() => Math.random() - 0.5)`
comparator is biased and repeats pairs).

## 4. Concept micro-notes

847 of the 1,089 concepts carry no content of their own, so their page falls back
to the **chapter's** notes - written for the chapter as a whole, which rarely
answers "what is *this* concept?".

A micro-note answers it in three blocks, on one line:

> **What it is:** The reaction in which an acid and a base cancel each other out.
> **Why it works:** The H+ from the acid and the OH- from the base join to form
> water, leaving the metal ion and the acid radical to pair up as a salt:
> NaOH + HCl -> NaCl + H2O. **Common mistake:** Leaving out the water, or pairing
> the ions the wrong way round and naming the wrong salt.

- They live in `apps/api/src/content/concept-notes.ts`, keyed
  `<chapter code>|<concept name>` (concept names repeat across classes).
- `scripts/qa/export-concept-notes-input.mjs` writes the batch input (concept,
  chapter and its questions), `merge-concept-notes.mjs` validates every key
  against the database before writing.
- `ContentService.syncConceptNotes` (and `POST /content/concept-notes/sync`,
  super-admin) turns each entry into a **NOTES** content item titled
  `<concept> - Key Idea`, so the concept page renders it under Study notes with no
  client change.
- Visibility matters: platform content is only visible to an institution-bound
  student **through an assignment**, so each note is created `PUBLIC` +
  `directSanroAvailable` and assigned to every institution. An institution-scoped
  row with no institution is filtered out by `ContentScopeService` - that was the
  first bug this feature hit.

**All 874 are authored** - 848 concepts had no notes at all, and 26 more were showing a
note written about a *different* part of the chapter ("Degree" showed "Polynomial
Zeroes - Notes"), so `audit-concept-note-relevance.mts` reports `0` concepts whose
notes never mention them. `export-concept-notes-input.mjs --list` reports `0 concepts
need a micro-note`.

The first 848 were found by asking "does it have content?" - a question that misses a
concept carrying only a video, which is not empty, never falls back to the chapter, and
(exactly one, `MAT-10-2|Graph`) rendered no reading material at all; the export now
filters on **notes**. The last 26 were found by asking "are its notes about *it*?".

## 5. Keeping it fast

Every screen re-requests the same payload on back-navigation, and the API runs in
a different region from its database, so each query costs a network round trip.
`apps/api/src/common/cache/response-cache.service.ts` caches the assembled
payloads for **30 s**, keyed by account (`<user sub>|…`), bounded to 600 entries
with LRU eviction, and invalidated whenever the account changes its own progress
(practice submitted, lesson completed or undone).

Cached: `/learning/home`, the chapter list, the chapter hub, the concept page and
`/content/browse`. Deliberately **not** cached: `/learning/path`, `/learning/progress`,
`/learning/review` and gamification — those must reflect a submission immediately.

Measured locally (cold → warm): chapter list 25 ms → 2 ms, chapter hub 26 ms → 3 ms,
concept page 22 ms → 3 ms. Live, the gain is the query time off a ~300 ms network
floor: `/learning/home` went from ~520 ms to ~330 ms steady state, and a repeat
`/learning/chapters/:id` from ~530 ms to ~330 ms.

Two further findings from measuring production (`scripts/qa/probe-screen-waterfall.mts`):

- **A screen used to make four API calls.** The notification *list* was fetched on
  every dashboard page even though the bell was closed. It now loads only when the
  bell is opened, and the unread badge polls every two minutes instead of thirty
  seconds: three calls, ~0.9 s of serialised API work removed per screen.
- **The free instance has 0.1 CPU**, so four *parallel* calls finish at the speed of
  the last one (1.2–1.7 s each). Fewer calls per screen is the only lever the app
  controls; the rest is the hosting tier.
- Measuring also found a **real credential leak**: the login form had no `method`,
  so a click before React hydrated performed the browser's native GET submit and put
  the email and password in the URL. It is now `method="post"` and the button is
  disabled until hydration.

## 6. Invariants that must not regress

- A practice answer **always** returns an explanation, and it is never the legacy
  template sentence. Guard: `node scripts/qa/probe-review-queue.mjs`.
- `submitPractice` returns one `review` entry per question, in the order shown.
- A reviewed concept leaves the queue (`nextReviewAt` in the future) unless the
  session contained no question for it.
- Practice selection never returns the same question twice in one set, and never
  returns a question of another class.
- The review queue mixes subjects when more than one subject is due.

## 7. What is deliberately not here

- **No more content volume.** The bank covers every concept; the gap was feedback
  and scheduling.
- **No learning-styles matching** (repeatedly fails to replicate).
- **No new gamification** — XP/streaks already exist, and the evidence says
  feedback beats reward.
- **Worked examples and exam-format items** (assertion–reason, case-based sets,
  3–5 mark constructed response) are the next phase, not this one.
