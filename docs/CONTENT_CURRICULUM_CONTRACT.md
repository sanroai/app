# SANRO — Content, Curriculum & Knowledge Base: Implementation Contract

Status: BINDING for the Content + Curriculum + Knowledge Base phase.
Schema owner: single owner (no parallel schema edits). Every data-model decision below is FIXED at this revision.

## 0. Reality Rebaseline (verified against disk, not assumptions)

The schema ALREADY contains substantial foundations that this phase REUSES (spec rule: never duplicate):

- Curriculum spine exists: `Board → Grade → Subject → Chapter → Topic → Concept` (schema.prisma L652-754).
  Mutations are currently guarded as "admins" (`curriculum.service.ts:147` allows SUPER_ADMIN + INSTITUTION_ADMIN).
  Spec requires canonical curriculum = SUPER_ADMIN-only. **REBALANCE to SUPER_ADMIN-only**, override INSTITUTION_ADMIN.
- `ContentItem` (L760) exists with `type/status/visibility/title/url/version/institutionId/boardId/subjectId/chapterId/topicId/conceptId/language/createdById` +
  `ContentProgress`, `ContentVersion`. Missing: PUBLISHED status, ownership (platform vs institution),
  institution *assignment* access, lesson ordering, grade field, direct-SANRO availability, review fields, source metadata (videoId, storageKey…).
- `ArContent`/`ArContentVersion`/`ArActivity` fully exist (authoring+validation+teacher visibility). REUSED as-is; no changes.
- `KnowledgeBase`/`KnowledgeChunk`/`ProcessingJob` exist (L1537-1597) but are INSTITUTION-scoped only, have no platform path,
  no embeddings, no staging model, and the pipeline is a single in-memory `executeJob` (`job-queue.service.ts`).
- `pdf-parse@2` is ALREADY a dependency (`apps/api/package.json`) — reuse for PDF text extraction.
- `@aws-sdk/client-s3` present; `StorageService` (R2/local) exists (L-src/common/services/storage.service.ts) — reuse unchanged.
- `JobQueueService` is in-memory + `ProcessingJob` rows (durable restore on boot). Extended (not replaced) with a per-stage pipeline.
- AI provider abstraction exists (`AiService`, provider mock/openai/gemini, defaults to `mock` → tests deterministic).
  No embedding provider exists today. PNG vector DB extension is NOT installed locally (PostgreSQL 18 native, no Docker).
- Content ingestion today: `content-import.controller.ts` (`/content-import/*`) — institution-only, no platform path, no staging, PDFs unprocessed (upload only), YouTube → KnowledgeBase only (never a ContentItem / Learn lesson).
- Web: content surfaces = `/app/content-processing` (KB tab), `/app/curriculum` (read-only tree), `/app/ar` (AR authoring), `/app/questions`. No content library, no curriculum CRUD, no PDF-ingestion flow, no assignment UI.
- Mobile: Learn tab consumes `GET /learning/*`; videos/notes open via `Linking.openURL`; **PDF never rendered**; mobile stays read-only for content (teacher/admin content management is web-only by design).

## 1. Ownership model (spec §10, §16, §17, §18)

- Single content model: `ContentItem`. Ownership = `ownerType ∈ { PLATFORM, INSTITUTION }` + `institutionId` (owner tenant when INSTITUTION).
- `ownerType` is DERIVED: default INSTITUTION; rows where `institutionId IS NULL` are PLATFORM. Data migration backfills existing rows
  (all current rows have institutionId non-null ⇒ all INSTITUTION; platform rows set institutionId=null + ownerType=PLATFORM).
- `ContentAssignment (contentId, institutionId)` = explicit grant of a SPECIFIC content item to an institution (spec §15/§16/§18).
  Platform content is visible to an institution ONLY when assigned (spec: never leak platform content into an unassigned institution).
  Institution-owned content is visible via its own `institutionId` (spec: tenant-private).
- Direct SANRO availability is an independent flag: `ContentItem.directSanroAvailable Boolean @default(false)` (spec §11, §17). Direct users — students in the SANRO AI system institution (`00000000-0000-0000-0000-00000000a5a1`) or legacy null rows — see platform content ONLY when the flag is true.
- Parents NEVER receive learning content at the API layer (`ParentContentGuard` already guards learning + AI; parity maintained for the new library read endpoint).

## 2. Curriculum (spec §19-§35)

- Canonical curriculum stays in the SAME models (no duplicate). SUPER_ADMIN only for all mutations (override of the existing INSTITUTION_ADMIN allowance).
- Institution-curriculum access: new `InstitutionCurriculumAccess (institutionId, boardId, grade?, subjectId?)` — an institution may only surface assigned curriculum sections to its students (spec §23: curriculum access assignments). Reads (boards/grades/subjects/tree) are filtered by institution access for school roles; SUPER_ADMIN sees all.
- Bulk curriculum import (spec §24-§34): CSV/XLSX → server-side parse (xlsx dep exists) → preview (valid/invalid/duplicate rows) → commit (idempotent upsert by natural keys: Board.code, Grade.boardId+name, Subject.boardId+code, Chapter.subjectId+code, Topic.chapterId+name, Concept.topicId+name). Reuses the existing import-job pattern (validation preview + commit) but with a dedicated controller `POST /admin/curriculum/import…` (SUPER_ADMIN only).

## 3. Content types vs lesson types (spec §36)

- `ContentType` (existing enum) is REUSED and extended minimally to serve concrete student outcomes.
  Add: `WORKSHEET, REVISION, FLASHCARDS, INTERACTIVE, EXAMPLE, READING, OTHER`.
  Keep: `VIDEO, NOTES, PDF, QUIZ, MODEL_3D, AR, GAME(hardware interactive), PRACTICE_SET, ARTICLE, IMAGE`.
  Mapping to "lesson types" is implicit: video→VIDEO, pdf→PDF, worksheet→WORKSHEET, notes→NOTES, revision→REVISION,
  quiz→QUIZ, flashcard→FLASHCARDS, ar/3d→AR|MODEL_3D, interactive→INTERACTIVE, example→EXAMPLE, reading→READING, other→OTHER.
- `ContentStatus` gains `PUBLISHED`. Visible-to-student = `status ∈ { APPROVED, PUBLISHED }` (existing APPROVED remains visible to avoid breaking live data; PUBLISHED is the new "on the library" terminal stage). New lifecycle: `DRAFT → REVIEW → APPROVED → PUBLISHED -> ARCHIVED`. Review fields added: `reviewedById, reviewedAt, publishedAt, archivedAt`.
- Lesson sequencing: `ContentItem.order Int @default(0)`.

## 4. Content assignment + availability (spec §13, §15, §28, §29)

| Who | Sees |
|---|---|
| Student (institution) | content with status APPROVED/PUBLISHED AND (institution-owned to their institution) OR (platform content assigned to their institution) |
| Direct SANRO (student — SANRO AI system institution / legacy null) | platform content, status APPROVED/PUBLISHED, `directSanroAvailable=true` |
| Teacher/admin | their own INSTITUTION content (DRAFT+), plus PLATFORM content assigned to the institution (incl. drafts for review by institution) |
| SUPER_ADMIN | everything |

## 5. PDF book ingestion pipeline (spec §48-§76)

New `ContentPipelineService`. Reuses `ProcessingJob` rows as durable per-stage records (extended with `stage`), and `JobQueueService` as the executor that runs ONE stage per job execution and enqueues the next stage (each stage independently retryable, max 3 attempts; restart resumes PENDING — already durable).

Stages (`KnowledgeBase.stage`, enum `ContentProcessingStage`):
`UPLOADED → VALIDATING → EXTRACTING → OCR(optional) → PARSING → MAPPING → CHUNKING → EMBEDDING → GENERATING → REVIEW → COMPLETED`, terminal `FAILED`, partial `PARTIAL`.

- UPLOADED: create KnowledgeBase (ownerType per caller; platform for SUPER_ADMIN, institution otherwise) + source provenance (original filename, mime, size, storageKey, curriculum mapping metadata). No content is student-visible at any ingestion stage until a human publishes it.
- VALIDATING: reject corrupt/password-protected/huge (>50MB)/wrong-MIME; store error, status FAILED.
- EXTRACTING: `pdf-parse` text extraction per page. Low text yield (< ~200 chars/page average, or ~<5% coverage) ⇒ scanned book ⇒ `OCR` stage (if OCR provider configured) else mark `OCR_REQUIRED` and FAILED with actionable `code: OCR_REQUIRED`.
- PARSING: heading/pattern detection (chapter/page/topic lines, TOC) → ordered section map with source page refs.
- MAPPING: normalize section titles against the curriculum (grade/subject/chapter/topic/concept name fuzzy match, hierarchical) → attach node ids; unmatched sections stay unmapped (provenance kept, PARTIAL tolerated).
- CHUNKING: semantic-ish chunker (heading-bounded, ~1500 token budget with overlap fraction) → `KnowledgeChunk` rows carrying grade/subject/chapter/topic/concept + `sourcePage` metadata.
- EMBEDDING: `EmbeddingService`. If `EMBEDDING_PROVIDER=none` (default, deterministic tests) → skip (stage COMPLETED with note). If `openai` configured → compute + persist `embedding Double[]` (double precision[]) on chunk. **pgvector is NOT used** (extension unavailable locally; documented deviation — embedding stays as `double precision[]` so the managed-prod layer can migrate to pgvector/HNSW without schema churn). GCG retrieval = amalgam: exact-keyword filter + cosine-similarity over chunk embeddings when present, tenant-scoped.
- GENERATING: AI generation (mock or configured provider) of notes/revision-summary (and optionally questions/flashcards) from APPROVED chunks → **ContentItem DRAFT**. NEVER touches status; human review gate enforced at transition.
- REVIEW: sets stage REVIEW. Human publishes → stage COMPLETED (spec: human review before publish, always).
- Any stage failure ⇒ terminal FAILED (component error stores stage + code); retries autonomous per attempts.

## 6. YouTube ingestion (spec §77-§88)

- Validates URL → videoId; fetches title/thumbnail (oEmbed, graceful fallback to id-based thumbnail); creates `ContentItem(type VIDEO, url embed, videoId, order)` + provenance.
- Unavailable handling: embed uses `https://www.youtube-nocookie.com/embed/{videoId}`; thumbnail records kept; a `thumbnail` + title from oEmbed; deleted/private → surface validation warning, content stays DRAFT until human fixes.
- No rehosting. Duplicate videoId within same tenant → warn, skip duplicate.

## 7. Content security & audit (spec §89-§97)

- All library/curriculum mutations: `@Roles` (SUPER_ADMIN for platform + curriculum; INSTITUTION_ADMIN/TEACHER for own-institution content within their tenure) + Zod validation + `@AuditLog` entries.
- New `AuditAction` values (schema + migration): `CONTENT_CREATED, CONTENT_UPDATED, CONTENT_STATUS_CHANGED, CONTENT_DELETED, CONTENT_VERSION_RESTORED, CONTENT_ASSIGNED, CONTENT_UNASSIGNED, CONTENT_REVIEWED, CONTENT_PUBLISHED, BOOK_UPLOADED, BOOK_PROCESSING_FAILED, BOOK_COMPLETED, CURRICULUM_CREATED, CURRICULUM_UPDATED, CURRICULUM_IMPORTED, CURRICULUM_ASSIGNED, CURRICULUM_UNASSIGNED, KNOWLEDGE_BASE_CREATED, KNOWLEDGE_BASE_DELETED, YOUTUBE_ADDED`, plus import-side `CONTENT_CREATED, QUESTION_GENERATED, PARENT_CREATED` added 2026-09-26.
- Tenant isolation tests are part of e2e (institution A cannot read/know B's or unassigned platform content; direct student scoping; parent blocked).

## 8. Performance (spec §99)

- All library list endpoints: server-side pagination (cursor/page + limit), indexed filters (board, grade, subject, chapter, concept, type, status, ownerType, institutionId, availability flag, search). Indexes added on ContentItem (`[ownerType,status,institutionId]`, `[grade,subjectId,status]`, `[conceptId,order]`), KnowledgeBase (`ownerType`), ContentAssignment (`[contentId]`, `[institutionId]`), InstitutionCurriculumAccess (`[institutionId]`).

## 9. API surface added in this phase

_admin/library (SUPER_ADMIN + institution-admin split)_:
- `GET /admin/library/content` (paginated, filtered) · `POST /admin/library/content` · `GET/PATCH /admin/library/content/:id`
- `POST /admin/library/content/:id/transition` (lifecycle incl. PUBLISH/review) · `POST|DELETE /admin/library/content/:id/assignment`
- `POST /admin/library/content/:id/archive` + `DELETE` (SUPER_ADMIN only)
- `GET /admin/library/assignments?institutionId`
- `POST /admin/library/availability` (directSanroAvailable toggle) — SUPER_ADMIN
_admin/curriculum_: `POST/GET boards`, `POST/PATCH grades`, `POST/PATCH subjects`, `POST/PATCH chapters`, `POST/PATCH topics/concepts` (SUPER_ADMIN), `POST /admin/curriculum/import` (multipart CSV/XLSX, preview then commit job), `GET /admin/curriculum/import/:id`
_admin/curriculum/access (SUPER_ADMIN)_: `GET/POST /admin/curriculum/access` (assign), `DELETE /admin/curriculum/access/:id`
_content pipeline_: `POST /content/upload` (multipart, PDF_BOOK) `POST /content/upload-multiple`, `POST /content/youtube`, `GET /content/ingestions` (stage-aware list), `GET /content/ingestions/:id` (stage + jobs + chunks + provenance), `POST /content/ingestions/:id/retry`, `POST /content/ingestions/:id/publish` (human review gate), `GET /content/ingestions/:id/source`
_student read (Library, added 2026-09-26)_: `GET /content/browse?search&type&boardId&grade&subjectId&chapterId&topicId&conceptId&page&limit` (paginated, tenant+assignment+`APPROVED|PUBLISHED` scoped, grouped counts in `byType`) — feeds `/app/library` on web; registered **before** `GET /content/:id` so `browse` is not parsed as an id. Supersedes the previously planned `GET /learning/library`, which was never implemented and is not called by any client.
_chapter-wise YouTube (added 2026-09-26)_: `GET /content/videos?chapterId`, `POST /content/videos`, `DELETE /content/videos/:id`; chapter detail returns `chapterContent`.
_learning path (added 2026-09-26)_: `GET /learning/path` — ordered diagnosis-derived concepts with `mastered | inProgress | notStarted`.

Legacy `/content-import/*` and `/knowledge-base/*` remain functional (institution tenant), migrated to share pipeline where relevant.

## 10. Explicit non-goals / boundaries

- No native mobile AR runtime; AR stays WebView model-viewer (unchanged).
- No pgvector extension (see §5 deviation). Embeddings stored as plain `double precision[]`.
- Mobile teacher/admin content management stays out of scope (web-only).
- NOT touching question bank / papers / assessments models (separately owned already).