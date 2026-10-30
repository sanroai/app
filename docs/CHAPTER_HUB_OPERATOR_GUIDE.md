# Chapter Hub — operator guide

**What it is.** The chapter hub is the page a student lands on when they click a
**chapter name** (not a concept, not a video marker). It is the parent of the concept
pages and the place where "what do I do now?" is answered. The interaction model and
every edge case are specified in `docs/FEATURE_CHAPTER_HUB.md`; this guide is the
operator's view: where the data comes from and what to do when a piece of it is
missing.

The hub is one scroll with five sections, in learning-loop order:

| Section | What it shows | Where the data comes from |
|---|---|---|
| **Continue** | the first not-yet-mastered concept, `X of Y concepts mastered`, a progress bar | `ConceptMastery` + `ContentProgress` |
| **Contents** | every concept of the chapter with its mastery badge and resource count | `Chapter` → `Topic` → `Concept` |
| **Learn** | the chapter's videos (each with its chapter-marker list), the study notes, *View chapter PDF* | `ContentItem` (type `VIDEO` / `NOTES`), `ContentItem.segments`, the NCERT PDF on disk |
| **Practise** | *Practice the whole chapter* — one session over every concept of the chapter | `Question` (status `APPROVED`) |
| **Ask** | *Ask SANRO AI about this chapter*, scoped to the chapter | the AI provider (may be unconfigured) |

**Overall chapter notes** sit at the top of *Learn*: one markdown summary of the whole
chapter, concept by concept, with the student's own mastery inline — the chapter's
"revision sheet".

---

## 1. The API

Three endpoints carry the hub. They are read-only except the third one, which
deliberately starts a learning session.

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/learning/chapters/:chapterId` | the hub payload (200) |
| `GET /api/v1/learning/chapters/:chapterId/pdf` | the textbook chapter PDF (streams, never buffered) |
| `POST /api/v1/learning/practice/start` with `{"chapterId": "..."}` | one practice session over the whole chapter (201 Created) |

The chapter practice answers `201 Created` with
`{ practiceId, chapterId, questionCount, questions }`, and `400` when the chapter has
no questions (an accepted empty state, not an error).

The hub payload looks like this (`summary` and `pdfUrl` may be `null`):

```jsonc
{
  "id": "3eef7ffa-77b1-41b1-9420-5c95f0db7061",
  "name": "Carbon and its Compounds",
  "code": "SCI-10-4",
  "grade": "10",
  "subject": { "id": "...", "name": "Science", "code": "SCI" },
  "summary": "## Chemical Reactions …",   // null when the chapter has no notes
  "pdfUrl": "/api/v1/learning/chapters/3eef7ffa-…/pdf",  // null when there is no PDF
  "concepts": [
    { "id": "...", "name": "Covalent Bonds", "mastery": 80, "hasVideo": true, "status": "IN_PROGRESS" }
  ],
  "videos": [
    {
      "contentId": "...",
      "title": "Carbon and its Compounds",
      "url": "https://www.youtube.com/embed/…",
      "durationSeconds": 1800,
      "segments": [{ "title": "Covalent Bonds", "startSeconds": 120 }]
    }
  ],
  "progress": { "concepts": 4, "mastered": 2, "videos": 3, "percent": 50 },
  "practice": { "questionCount": 8, "available": true }
}
```

The server side lives in:

- `apps/api/src/learning/learning.controller.ts` — the routes
- `apps/api/src/learning/learning.service.ts` — `getChapterDetail`, `getChapterPdf`,
  `startChapterPractice`
- `apps/api/src/common/books/chapter-pdf.ts` — the chapter-code → PDF mapping
- `apps/api/src/common/books/chapter-segments.ts` — the chapter-marker normalisation

**The probe.** `scripts/qa/probe-chapter-hub.mjs` checks this contract end to end
against the local dev API (it needs the API on `http://localhost:4000`):

```bash
node scripts/qa/probe-chapter-hub.mjs
```

It finds a real chapter id by itself, logs in with the demo accounts, prints one
`PASS`/`FAIL` line per check and exits `1` when something failed. It is read-only
apart from the practice session it starts (that row *is* the feature under test), so
it is safe to run repeatedly. While the hub has not landed yet it prints
`SKIP … chapter hub endpoint not available` and exits `0`.

---

## 2. Where the chapter PDF comes from

The PDF is the **NCERT textbook chapter**, extracted locally into `books/`
(git-ignored, not application code). The hub maps the **curriculum chapter code** to
the file name:

```
SCI-10-4  ->  subject SCI, class 10, chapter 4  ->  jesc1 + "04"  ->  jesc104.pdf
```

The mapping table is `CLASS_BOOKS` in `apps/api/src/common/books/chapter-pdf.ts`:

| Subject | Class | File-name prefix | Folder under `books/cbse/` | Example |
|---|---|---|---|---|
| Science | 10 | `jesc1` | `class-10/science` | `SCI-10-4` → `jesc104.pdf` |
| Science | 9 | `iesc1` | `class-9/science` | `SCI-9-4` → `iesc104.pdf` |
| Mathematics | 10 | `jemh1` | `class-10/mathematics` | `MAT-10-12` → `jemh112.pdf` |
| Mathematics | 9 | `iemh1` | `class-9/math` | `MAT-9-3` → `iemh103.pdf` |
| English | 10 | `jeff1` | `class-10/english` | `ENG-10-3` → `jeff103.pdf` |
| English | 9 | `iebe1` | `class-9/english` | `ENG-9-3` → `iebe103.pdf` |

The file is looked up in two places, in this order: `<subject folder>/source/<file>`
and `<subject folder>/<file>`. (Class 10 science keeps its PDFs in `source/`; the
other books keep them in the subject folder.) The authoritative chapter list of every
book is `scripts/books/subjects.cjs` — change the mapping there and in
`apps/api/src/common/books/chapter-pdf.ts` together, never in one place only.

The chapter number is the number of the chapter **in the NCERT book**, so the mapping is
1:1 with the textbook (`SCI-10-4` → the fourth chapter of the class-10 science book).
The curriculum does not cover every chapter of every book: the class-9 science textbook
has 12 chapters and the curriculum has 5 (`SCI-9-1` … `SCI-9-5`), so the chapters 6-12
of that book are simply not reachable from the hub.

**If a book is missing from disk** the whole book is simply not there:
`books/cbse/class-10/science/` may be empty on a fresh clone. The hub then answers
`pdfUrl: null` and the UI says *"PDF not available for this chapter"*. That is a
normal state, not an error.

### Refreshing the books

```bash
pnpm books:extract -- --subject science --class 10   # text + page screenshots + figures + manifest
pnpm books:ocr     -- --subject science --class 10   # Tesseract OCR of every page + cross-check
pnpm books:index   -- --subject science --class 10   # rebuild the README + qc.json accuracy report
```

`--subject` is `science | mathematics | english` and `--class` is `9 | 10` (default:
`science`, `10`). The same three commands exist for the other books, e.g.
`pnpm books:extract -- --subject mathematics --class 9`.

The tooling lives in `scripts/books/extract.cjs`, `scripts/books/ocr.cjs` and
`scripts/books/build-index.cjs`; the book definitions live in
`scripts/books/subjects.cjs`. The per-book index (chapter slugs, page counts, OCR
confidence) is `books/cbse/<class>/<subject>/README.md`, and the machine-readable
version is `books/cbse/<class>/<subject>/manifest.json`.

---

## 3. How the chapter markers are produced

A 40-minute one-shot lesson is not navigable, so every lesson video can carry its own
**chapter markers** — the list of textbook sections it walks through:

```json
[{ "title": "Covalent Bonds", "startSeconds": 120 }]
```

They live in the nullable `ContentItem.segments` JSON column
(`apps/api/prisma/schema.prisma`) and are produced in two steps:

```bash
# 1. read the real markers of every lesson video off YouTube
node scripts/qa/source-video-chapters.mjs
#    -> artifacts/qa/<date>/video-chapters.json

# 2. store them: rewrite the seed map and update the VIDEO rows
node scripts/qa/apply-video-chapters.mjs artifacts/qa/<date>/video-chapters.json
#    --seed-only   rewrite apps/api/prisma/seed.ts only, do not touch the database
```

`scripts/qa/source-video-chapters.mjs` reads the **creator's own chapter list** from
the YouTube player payload, and falls back to the **timestamps in the description**
(`0:00 Introduction`, `42:38 Total Surface Area`). oEmbed reports neither, which is
why the watch page is read.

`scripts/qa/apply-video-chapters.mjs` writes the markers into the
`videoSegments` map of `apps/api/prisma/seed.ts` and into the `segments` column of
every `ContentItem` of type `VIDEO`.

**Every read goes through `normalizeChapterSegments`**
(`apps/api/src/common/books/chapter-segments.ts`), because the column is editable by
hand and can hold anything. The normaliser drops what it cannot trust and keeps:

- at most **24** markers per video (`CHAPTER_SEGMENT_LIMIT`)
- `startSeconds` a finite, non-negative number, floored to seconds
- `title` a non-empty string
- the markers sorted by start time, de-duplicated by start time

A broken marker must never break the lesson it belongs to, so an unparsable marker is
dropped rather than surfaced.

Related tooling:

| Script | What it does |
|---|---|
| `scripts/qa/source-video-lessons.mjs` | finds a YouTube video per lesson (search → oEmbed → score) |
| `scripts/qa/apply-video-sources.mjs` | applies the sourced videos to the seed + dev database |
| `scripts/qa/apply-video-durations.mjs` | writes the real video durations |
| `scripts/qa/audit-video-durations.mjs` | reports videos with a missing or wrong duration |
| `scripts/qa/verify-video-liveness.mjs` | every VIDEO row must resolve to a live, embeddable video |

---

## 4. When a chapter is incomplete

Every one of these is an **expected state**, not a bug. The hub renders its own empty
state and nothing else; a section without data never breaks the page.

### The chapter has no PDF

*What you see:* *View chapter PDF* is disabled — *"PDF not available for this chapter"*.

*Why:* the textbook chapter is not on disk. Either the book was never extracted into
`books/`, or the chapter code does not map to a file (see the prefix table above).

*What to do:*

1. Check the file really is missing:
   `books/cbse/class-10/science/source/jesc104.pdf`.
2. If the book has never been extracted, run `pnpm books:extract -- --subject science`
   (and `pnpm books:ocr` / `pnpm books:index` for the full index).
3. If the file exists but the hub still says "not available", the **code does not map**
   — either the chapter code is not `<SUBJECT>-<GRADE>-<N>` or the prefix for that
   (class, subject) is missing from `CLASS_BOOKS` in
   `apps/api/src/common/books/chapter-pdf.ts`.

### The chapter has no videos

*What you see:* the *Learn* section shows the notes only.

*Why:* the chapter has no `ContentItem` of type `VIDEO` that the student may see.
Student-visible content is filtered to `ContentStatus.APPROVED` / `PUBLISHED`.

*What to do:* find a video for the missing lessons with
`node scripts/qa/source-video-lessons.mjs` and apply it with
`node scripts/qa/apply-video-sources.mjs`. The coverage report is
`node scripts/qa/audit-videos-vs-syllabus.mjs` (which lessons have no video at all).

### A video has no chapter markers

*What you see:* the marker list is simply not rendered; the video plays as one blob.

*Why:* `ContentItem.segments` is empty for that video — YouTube publishes no chapter
list and the description carries no timestamps, or the markers were never applied.

*What to do:* re-run `node scripts/qa/source-video-chapters.mjs` and then
`node scripts/qa/apply-video-chapters.mjs`. The extraction report says how many of the
videos carry markers. A video that legitimately has no markers is fine — the strip is
optional by design.

### The chapter has no questions

*What you see:* *Practice the whole chapter* is disabled — *"No practice questions for
this chapter yet"*.

*Why:* no `Question` with status `APPROVED` is mapped to any concept of the chapter.

*What to do:* author questions for the chapter's concepts in the question bank
(`/app/questions` in the web app), mapped to the concept — a question only counts for
the chapter when it is mapped to one of the chapter's concepts and its status is
`APPROVED`. The API answers `400` (*"No practice questions available for this
chapter"*) when a chapter has no questions — that is the accepted empty state, not a
failure. `scripts/qa/audit-curriculum-coverage.mjs` reports the coverage of the
*lessons* (which chapters have a video, which video lessons have no URL); the question
coverage is visible in the question bank itself.

### The chapter has no notes

*What you see:* the summary block is omitted; *Learn* still shows the videos.

*Why:* the hub builds the summary from the chapter description and from the markdown
of the `NOTES` lessons of the chapter and of its concepts. With none of them there is
nothing to summarise and `summary` is `null`.

*What to do:* the study guides for the extracted books live in
`books/cbse/class-10/science/notes/*.md` (one file per chapter pair). They are
authoring material, not served content — the `NOTES` lessons of the chapter are what
the hub serves.

### The AI provider is not configured

*What you see:* the *Ask* section shows its existing error state; the rest of the hub
works.

*Why:* `AI_PROVIDER` / `AI_API_KEY` are not set.

*What to do:* configure the provider in `apps/api/.env`. Nothing on the hub depends on
it — the page is not allowed to break because the AI is missing.

---

## 5. The operating rules

- **The hub never mutates learning state.** Only starting a practice session does.
  Opening the hub, reading the PDF and asking the AI are all read-only.
- **A section with no data renders its own empty state and nothing else.** No
  zero-length lists, no fake percentages, no dead buttons.
- **Nothing on the page depends on a marker, a PDF or an AI key existing.**
- **A student in another grade gets a `403`** — the hub never renders another grade's
  chapter.
- **The PDF is streamed, never buffered into memory.**
- **A chapter list must stay scannable** — 24 markers per video, hard cap.
- **Web and mobile show the same thing.** Both clients call the same API; a missing
  capability is an API gap, not a mobile gap. See `docs/PARITY_POLICY.md`.

## 6. Files referenced by this guide

| Path | What it is |
|---|---|
| `docs/FEATURE_CHAPTER_HUB.md` | the interaction model and the edge-case table |
| `docs/PARITY_POLICY.md` | the web ↔ mobile parity rule |
| `apps/api/src/learning/learning.controller.ts` | the hub, PDF and practice routes |
| `apps/api/src/learning/learning.service.ts` | the hub payload, the PDF, the chapter practice |
| `apps/api/src/common/books/chapter-pdf.ts` | the chapter-code → PDF mapping (`CLASS_BOOKS`) |
| `apps/api/src/common/books/chapter-segments.ts` | the chapter-marker normalisation (24 cap) |
| `apps/api/prisma/schema.prisma` | `ContentItem.segments`, `Chapter`, `Question` |
| `apps/api/prisma/seed.ts` | the seeded lessons, videos and the `videoSegments` map |
| `scripts/qa/probe-chapter-hub.mjs` | the contract probe for the three endpoints |
| `scripts/qa/source-video-chapters.mjs` | reads the chapter markers off YouTube |
| `scripts/qa/apply-video-chapters.mjs` | stores the markers (seed + database) |
| `scripts/qa/source-video-lessons.mjs` | finds a YouTube video per lesson |
| `scripts/qa/apply-video-sources.mjs` | applies the sourced videos |
| `scripts/qa/apply-video-durations.mjs` | writes the real video durations |
| `scripts/qa/audit-video-durations.mjs` | reports missing or wrong durations |
| `scripts/qa/audit-videos-vs-syllabus.mjs` | which lessons have no video |
| `scripts/qa/audit-curriculum-coverage.mjs` | which chapters have no questions |
| `scripts/qa/verify-video-liveness.mjs` | every VIDEO row resolves to a live video |
| `scripts/books/subjects.cjs` | the book definitions (PDF file name per chapter) |
| `scripts/books/extract.cjs` | the text / screenshot / figure extraction |
| `scripts/books/ocr.cjs` | the OCR pass and the text-layer cross-check |
| `scripts/books/build-index.cjs` | rebuilds the per-book README and `qc.json` |
| `books/cbse/class-10/science/README.md` | the per-book index (chapters, pages, OCR quality) |
| `books/cbse/class-10/science/manifest.json` | the machine-readable book index |
| `books/cbse/class-10/science/notes/` | the study guides (authoring material) |
