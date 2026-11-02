# Assessment, Path and Test — the edge cases

`node artifacts/qa/2026-11-02/probe-assessment-edge.mjs` walks the whole lifecycle
against a running API and asserts **53** behaviours. It is the guard for everything
below.

```bash
pnpm --filter @sanro/api start:dev          # :4000
node artifacts/qa/2026-11-02/probe-assessment-edge.mjs
# 53 passed, 0 failed
```

It creates one assessment titled `QA edge cases <timestamp>`, assigns it to the
demo student and drives it to completion. Login is rate limited to 10/minute, so
run it alone.

## The lifecycle it covers

```
teacher creates -> publishes -> student sees it in Tests -> reads the paper
   -> starts -> resumes -> saves answers -> submits -> reads the result
   -> teacher grades the written answer -> Path / retest
```

| Area | Asserted |
|---|---|
| Authoring | a teacher creates an assessment; a **student cannot**; a student cannot read the staff detail |
| Assignment | an unassigned student cannot start; publishing to nobody is a 400 |
| Tests tab | the assignment appears; `questionCount` is the **real** count |
| Paper | readable before starting; the correct answer and `isCorrect` flags are **not** in the payload |
| Start | questions are returned sanitised; **starting again resumes the same attempt** and does not consume another |
| Answers | an option **id** is accepted and resolved to its text; a question outside the assessment is a 400; another student gets a 404 |
| Submit | an option id scores correct; a written answer is **pending**, not wrong; a normal submit is not flagged expired; a second submit is a 409; answers cannot be saved afterwards |
| Result | the correct answer is revealed only after submit; `weakConcepts` is present; another student gets a 404; the institution admin can read it |
| Grading | `pendingGrading` is reported; a **question id works** (that is what the screen sends); a non-numeric mark is a **400, not a 500**; a student gets a 403; marks land on the answer and the score updates; nothing stays pending |
| Attempt limit | a second attempt is allowed when `attemptsAllowed = 2`; the third is a 403 |
| Path | 1,089 concepts with `state` + `level`; a `next` action; a summary; weak concepts listed |
| Retest | a student can request one for a concept; an empty list is a 400; another student's id is a 403 |
| Bad input | a malformed attempt id is a 400; an unknown assessment is a 404 |

## Bugs this found and fixed

1. **Resuming an attempt consumed another one.** `startAttempt` derived the attempt
   index from the attempt *count*, so backgrounding the app and tapping Start again
   created a second attempt and orphaned the first — or, with `attemptsAllowed = 1`,
   threw *"Attempt limit reached"* at a student who had not submitted anything. It
   now looks for an in-progress attempt **first** and returns it (`resumed: true`).
2. **Grading never worked from the UI.** The grading screen sends the **question**
   id it holds, but `gradeAnswer` looked up the **answer row** id, so every "Save
   marks" was a 404. It now accepts either, and updates `answerRow.id` (the second
   half of the bug: the update still used the incoming id and 500'd).
3. **A paper could score over 100%.** `maxScore` was `assessment.totalMarks`, which
   is whatever the creator typed. It is now the sum of the question marks, in submit,
   in grading and in the student's paper — a 2-mark paper with a 1-mark MCQ and a
   2-mark written question reports `x/3`, not `3/2`.
4. **The Tests tab showed "0 questions".** `questionCount` was hardcoded to `0`.
5. **A non-numeric mark was a 500.** `Number(body.marksAwarded)` reached Prisma as
   `NaN`. It is validated now and returns 400.
6. **A super admin could not read any attempt.** The staff scope fell through to
   "my own attempts" when the caller had no institution.
7. **`autoSubmitOnExpiry` did nothing.** The timer was client-side only: answers
   could be saved and submitted hours late. The server now refuses to save past
   `durationMinutes` + 60 s and records a late submit as `AUTO_SUBMITTED`, so a
   teacher can tell the two apart. `expired` is returned to the client.

## Rules the API enforces

| Rule | Where |
|---|---|
| A student may only start an assessment **assigned to them** | `startAttempt`, `paperForStudent` |
| Only while `PUBLISHED` and inside `startsAt .. dueAt` | `startAttempt` |
| Attempts are counted, never exceeded | `startAttempt` |
| Answers may only address questions **in this assessment** | `saveAnswers` |
| Answers freeze after submit and after the timer | `saveAnswers` |
| The graded answer is the option **text**; an id is resolved | `normaliseAnswerToOptionText` |
| Written answers are **pending**, never wrong | `submitAttempt` |
| The correct answer is hidden until the student submits | `attemptDetail` |
| Only staff may grade, and only inside their institution | `gradeAnswer` |
| Marks are clamped to `0 .. maxMarks` | `gradeAnswer` |

## Known limitations

- The timer is enforced with a **60 s grace** for clock drift; a device with a badly
  wrong clock can lose the last minute.
- `submitAttempt` grades whatever was saved. If the network dropped before the last
  `saveAnswers`, those answers are simply skipped — there is no offline replay for
  attempts (practice sets have one; assessments deliberately do not).
- A retest always creates a **new** assessment row (`title: "Retest"`), so a student
  who retests often accumulates them. That is the documented "student-triggered
  retest" design, not a leak, but the Tests tab should group them.
- Grading a written answer re-applies mastery evidence for that concept, so
  re-grading the same answer twice counts twice. Marks are clamped, evidence is not.
