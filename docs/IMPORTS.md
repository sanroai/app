# SANRO AI — Imports

One import pipeline, five entity types:

| `entityType` | Creates | Consumes seats |
|---|---|---|
| `STUDENTS` | `User` + `InstitutionMember(STUDENT)` + `Student` (+ optional parent link) | yes |
| `TEACHERS` | `User` + `InstitutionMember(TEACHER)` + `Teacher` | yes |
| `PARENTS` | `User` + `InstitutionMember(PARENT)` + `Parent` (+ optional `ParentStudentLink`) | yes |
| `CONTENT` | `ContentItem` (Library lesson row) | no |
| `QUESTIONS` | `Question` + `QuestionOption` | no |

```
Upload → Validate → Preview → Detect duplicates → Confirm → Commit → Results
```

Results show: created / updated / skipped / failed, with row-level errors.
History retained (`ImportJob` / `ImportRow`, `GET /imports`).

## 1. Endpoints

- `POST /imports/upload` — multipart `file` (CSV/XLSX, ≤10 MB) + `entityType`,
  `academicYearId`, `institutionId?`. `@Roles(INSTITUTION_ADMIN, TEACHER, SUPER_ADMIN)`.
  Server parses; never browser memory.
- `POST /imports/:jobId/commit` — same roles; writes rows in one transaction.
- `GET /imports`, `GET /imports/:jobId` — history + job detail.

Separate path, unchanged: `POST /content-import/upload`,
`GET /content-import/status/:id`, `POST /content-import/retry/:id` (PDF/ZIP/KB ingest).

## 2. Column contracts

Headers are matched **loosely** — case, spaces, `_` and `-` are ignored, so
`studentEmail`, `Student Email` and `student_email` are the same column.

### STUDENTS — `name,email,phone,rollNumber,parentName,parentPhone,grade`
Required: `name` (≥2 chars). `email`/`phone` format-checked when present;
`rollNumber`, `parentName`, `parentPhone` optional. Class/section assignment is
a separate People-management step — the `grade` header in the sample file is
accepted but not consumed by the student validator.

### TEACHERS — `name,email,phone,employeeId`
Required: `name` (≥2 chars), `email`. `employeeId` is stored on
`Teacher.employeeId` (the column is read as an alias of `rollNumber`).

### PARENTS — `name,email,phone,studentEmail`
Required: `name`, `email`. `studentEmail` optional — when present it must
match an existing student in the same institution and creates the
`ParentStudentLink`; an unresolvable student email is an `INVALID` row error.

### CONTENT — `type,title,description,board,grade,subject,chapter,topic,concept,url,order,status,language`
Required: `type` (a `ContentType` value), `title` (≥2 chars), `board`,
`grade`, `subject`, `chapter`. Optional: `description`, `url` (must be
`http(s)://`), `topic`, `concept`, `order` (integer), `status` (default
`APPROVED`), `language` (default `EN`).
Created as `visibility INSTITUTION_ONLY`, `ownerType INSTITUTION`, with
`boardId/grade/subjectId/chapterId/topicId?/conceptId?` resolved and
`publishedAt` set when `status` is `PUBLISHED`.

### QUESTIONS — `type,text,options,answer,difficulty,marks,board,grade,subject,chapter,topic,concept,hint,explanation`
Required: `type` (`QuestionType`), `text` (≥5 chars), `board`, `grade`,
`subject`, `chapter`, and `answer` for objective types.
`options` are `|`-separated; prefix the correct one with `*` (or supply an
`answer` that matches an option exactly). `MCQ`/`MULTI_SELECT` need ≥2 options
and exactly one correct index; `TRUE_FALSE` answers must be `True`/`False`.
Defaults: `difficulty MEDIUM`, `status APPROVED`, `language EN`, `marks 1`.
Created with `source IMPORT`.

## 3. Curriculum resolution

CONTENT and QUESTIONS rows resolve `board → grade → subject → chapter →
topic? → concept?` at **preview** time, so an unresolvable path is surfaced as
an `INVALID` row before anything is committed. Resolutions are cached per run.

| Field | Matched by |
|---|---|
| `board` | `code` (upper-cased) or `name` |
| `grade` | `name` on that board |
| `subject` | `code` or `name` within the board |
| `chapter` | `code` or `name` within the subject; `grade` written on the row is the chapter's own grade |
| `topic` | `name` within the chapter (optional) |
| `concept` | `name` within the topic — `concept` without `topic` is a row error |

No partial credit: a missing chapter fails the row even if board/grade/subject
resolve.

STUDENTS/TEACHERS/PARENTS resolve the academic year from the saved job (a
supplied id must belong to the target institution; blank falls back to that
institution's `ACTIVE` year — see `docs/CHANGELOG.md` 2026-09-23).

## 4. Validation & duplicates

- Row validators are hand-written per entity type; enum membership is checked
  against `ContentType` / `ContentStatus` / `QuestionType` / `QuestionStatus` /
  `Difficulty` / `Language`, and email/phone/URL shapes are regex-checked.
- Duplicate keys — a hit is counted as a duplicate and the row is marked
  `EXISTING`, so repeat uploads stay idempotent while a corrected file is
  committed as a new batch:
  - `STUDENTS`: existing `email` or `rollNumber` in the institution
  - `TEACHERS`: existing `email` or `phone`
  - `PARENTS`: existing `User.email`
  - `CONTENT`: same `institutionId` + `chapterId` + `title`
  - `QUESTIONS`: same `institutionId` + `chapterId` + `text`
- Seat gate: `STUDENTS`, `TEACHERS` and `PARENTS` call
  `seatAvailability(institutionId, rowCount)` **before** the transaction opens
  and raise `400 USER_LIMIT_REACHED {current, requested, available, limit}` if
  the subscription is full. `CONTENT` and `QUESTIONS` never consume seats.
- Unsupported `entityType` → `400 Unsupported entity type "<x>"`.
- The whole commit runs in **one** transaction: a failing row is marked
  `INVALID` (with the reason in `errors[]`) and skipped, never half-written,
  and a seat/permission failure aborts the entire batch before any row exists.

## 5. Audit

One `AuditLog` per commit, action chosen by entity type:
`STUDENT_IMPORTED` · `TEACHER_ADDED` · `PARENT_CREATED` · `CONTENT_CREATED` ·
`QUESTION_GENERATED`, metadata `{ imported, duplicates, invalid }`.
Imported rows get `ImportRowStatus.IMPORTED` + `importedEntityId`.

## 6. Integrity

Imports create real records (no fabricated rows), respect tenant scoping
(every row is written inside the target institution's transaction), and are
fully audited. Records of *what* was imported live under `docs/data-imports/`
(append-only; see its `README.md`).
