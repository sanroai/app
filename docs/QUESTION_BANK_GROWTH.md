# Question bank — how it grows, and where we are

The product promise is "practise every concept". The bank is measured, authored,
validated and merged through one pipeline; nothing is inserted by hand.

## Current numbers (`sanro_dev`, 2026-10-24)

| Metric | Before | After |
|---|---|---|
| Questions | 1045 | **1229** |
| Class 10 questions | 223 | **407** |
| Chapters with questions | 209 / 209 | 209 / 209 |
| Concepts with ≥ 2 questions | 126 | 238 |

The +184 curated questions are grade 10 (13 science chapters, 15 mathematics
chapters, 9 english chapters): **one new MCQ per concept plus one written
question per chapter**, authored against the chapter's own textbook text.

Per-concept distribution before this pass (the reason for the work):

| Questions on the concept | Concepts |
|---|---|
| 0 | 112 |
| 1 | 771 |
| 2 | 106 |
| 3 | 18 |
| 4 | 2 |

One question per concept is not practice; it is a sample.

## The pipeline

```bash
# 1. what is missing, with exact chapter/concept names
node scripts/qa/export-question-outline.mjs --all --grades 10

# 2. author fragments  (artifacts/qa/<date>/questions-*.json)
#    either AI-assisted:
node scripts/qa/generate-concept-questions.mjs --grades 10 --target 4 --batch 5 --max-calls 40
#    or curated by hand, one file per subject

# 3. prove them against the live curriculum
node scripts/qa/validate-question-fragments.mjs --dir artifacts/qa/<date>

# 4. write them into the seed (+ QUESTION_CONCEPT map)
node scripts/qa/merge-question-fragments.mjs --dir artifacts/qa/<date>

# 5. re-seed and re-measure
pnpm --filter @sanro/api db:seed:demo
node scripts/qa/audit-question-coverage.mjs
```

The validator is strict on purpose and its rules have teeth:

- MCQ: exactly 4 options, exactly 1 correct, `answer` equal to that option's text.
- `SHORT_ANSWER`: no options, **and `marks: 2`** (written questions are worth two).
- The concept must belong to the named chapter, at that grade.
- No duplicate text, inside the fragment or against the database.

## The generator (AI-assisted authoring)

`scripts/qa/generate-concept-questions.mjs` authors questions for every concept
below a target, in batches:

```bash
node scripts/qa/generate-concept-questions.mjs --grades 9 --target 4 --batch 5 --dry   # inspect the gap
node scripts/qa/generate-concept-questions.mjs --grades 9 --target 4 --batch 5          # author
```

- One request covers **`--batch` concepts** (default 5, 3 questions each), which
  keeps a free-tier key usable.
- The prompt is grounded per concept: grade, subject, chapter, topic, exact concept
  name, and the text of the questions that concept already has (so the model
  extends instead of rephrasing).
- Output is filtered before it is written: 4 distinct options, one correct,
  `answer` verbatim, no duplicate of an existing question.
- Verified fragments are written to `artifacts/qa/<date>/questions-gen-grade-*.json`
  and go through the **same** validate → merge steps. The generator never touches
  the database directly.

### The quota wall (why the curated batch exists)

`gemini-3-flash` free tier allows **20 requests per day**. 147 grade-10 concepts
at 5 per request is 30 requests — more than a day's budget, and image generation
is already 429 (see `docs/AI_PROVIDER.md`). At 20 requests/day the generator moves
~100 concepts/day, so the remaining gap closes over roughly a week of daily runs,
or immediately on a funded key.

That is why this pass shipped a **curated** grade-10 batch (exactly authored,
zero validator problems) and left the generator ready for the rest.

## Guard rails

- `node scripts/qa/audit-question-coverage.mjs` — fails if any chapter loses its
  questions.
- `node scripts/qa/probe-practice-scoring.mjs` — starts a practice set, answers it
  correctly, asserts the server scores 100.
- Web and mobile read the same API, so a question added once appears on both.

## Next step (in order of value)

1. Run the generator for grades 9 and 8 (textbook text exists for both).
2. Curate classes 5-7, where concepts are simpler and one MCQ per concept is
   enough only if there are four concepts.
3. Classes 1-4 stay at 4 questions per chapter by design (young learners).
