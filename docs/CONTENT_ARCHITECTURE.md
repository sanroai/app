# SANRO AI — Content Architecture

## 1. Curriculum Spine

Board → Grade → Subject → Chapter → Topic → Concept — board-agnostic. Boards
are data (CBSE seeded), never hardcoded in business logic. `Grade` has
`{ id, boardId, name, order }`.

## 2. Content Types

VIDEO, NOTES, PDF, REVISION, QUIZ, QUESTIONS, FLASHCARDS, MODEL_3D, AR, OTHER.

Every content item carries: title, description, board, grade, subject, chapter,
topic, concept, source, license, status, version, metadata. Content type stored
on `ContentItem.type`.

## 3. Lifecycle

```
DRAFT → REVIEW → APPROVED → PUBLISHED → ARCHIVED
```

- Content becomes visible to students only when PUBLISHED (ContentService
  filters approved/published + tenant + grade).
- Versions tracked via ContentVersion; historical learning records reference
  versions, never get corrupted by later edits.

## 4. Source Material & Traceability

Educational books/PDFs are SOURCE MATERIAL. Ingestion pipeline retains
`book / page / chapter / topic / concept / source reference` for full
traceability (see DATA_INGESTION.md).

## 5. YouTube

Store URL, video ID, title, thumbnail, duration, source, curriculum mapping.
Handle deleted/private/region-restricted/unembeddable/duplicate/wrong mapping.
Do not rehost unnecessarily. Embed via iframe; handle unavailable gracefully.

## 6. Completeness Matrix

Track per Board×Grade×Subject×Chapter×Topic×Concept: notes, video, questions,
practice, revision, AR/3D, published state. Admin UI surfaces content gaps.

## 7. Visibility Rules

- Students see only PUBLISHED content mapped to their grade/board.
- Teachers/admins see draft/review items in management UI.
- Search respects role + institution + publication: unpublished content never
  leaks into student search or AI grounding.