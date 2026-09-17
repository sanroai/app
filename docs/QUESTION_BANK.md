# SANRO AI — Question Bank

## 1. Supported Types

MCQ, multiple-select, true/false, short answer, long answer, numerical,
assertion/reason, image-based.

Prisma mapping: UI `SHORT` → `SHORT_ANSWER`, UI `LONG` → `LONG_ANSWER`.

## 2. Attributes

Every question maps to board/grade/subject/chapter/topic/concept and carries:
difficulty, marks, answer, explanation, source, status, version, creator,
reviewer.

## 3. Lifecycle

DRAFT → REVIEW → APPROVED → PUBLISHED → ARCHIVED.

- Question edits create versions; published snapshots remain stable.
- No fake questions, no hardcoded questions in the student experience.

## 4. APIs

- `GET /questions` (list + filters: difficulty, type, concept, status)
- `POST /questions`, `PATCH /questions/:id`, `DELETE /questions/:id`
- `PATCH /questions/:id/review` (APPROVE/REJECT/ARCHIVE)
- `POST /questions/generate` (AI-assisted draft, requires human approval)

## 5. AI Generation

Pipeline: prompt → curriculum context → source knowledge → draft → validation
(answer correctness, curriculum mapping, difficulty, duplicate, ambiguity scan)
→ human review → approval → publish. AI never auto-publishes.