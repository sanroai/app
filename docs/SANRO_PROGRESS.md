# SANRO Progress Snapshot

> **Date:** September 17, 2026
> **Status:** Live — Web + API deployed. QA hardening pass applied (see "QA Hardening Pass" below). Mobile APK rebuild blocked on EAS/Play credentials.

---

## Architecture

| Layer | Stack |
|---|---|
| **Web** | Next.js 15, React 19, Tailwind CSS, Zustand, TanStack Query, shadcn-style UI |
| **API** | NestJS, Prisma ORM, PostgreSQL, Playwright (PDF), OpenAI-compatible AI |
| **Mobile** | Expo SDK 52, React Native 0.76.5, expo-router 4 |
| **Database** | PostgreSQL 18 on Railway (production: `api.sanroai.com`, `sanro_dev`) |
| **AI** | OpenAI-compatible (`gpt-4o-mini`), mock fallback |
| **Storage** | Local filesystem + Cloudflare R2 support via `StorageService`. R2 client ready but needs bucket setup. |
| **PDF** | Playwright chromium rendering with HTML fallback. `PDF_ENGINE=none` → returns HTML preview. |
| **Queue/Job** | NONE |
| **Embeddings/Vector** | NONE (pgvector not installed) |
| **YouTube** | Embed URLs in `ContentItem.url`. YouTube import via `POST /content-import/youtube`. |
| **Knowledge Base** | `KnowledgeBase` + `KnowledgeChunk` + `ProcessingJob` models. Full CRUD + search + stats API. |

---

## Completed Features

| Feature | Files |
|---|---|
| Auth (JWT, RBAC, refresh, forgot-password) | `apps/api/src/auth/` |
| People CRUD (students, teachers, parents) | `apps/api/src/people/` |
| Curriculum (boards, grades, subjects, chapters, topics, concepts) | `apps/api/src/curriculum/` |
| Content items (CRUD, progress tracking) | `apps/api/src/curriculum/content.service.ts` |
| Questions (CRUD, AI generation, review workflow) | `apps/api/src/questions/` |
| Papers (generate, duplicate, export PDF, preview HTML) | `apps/api/src/papers/` |
| PDF generation (Playwright, A4 template) | `apps/api/src/pdf/` |
| PDF serving (local filesystem) | `apps/api/src/files/` |
| Assessments (create, publish, start, save, submit, auto-grade) | `apps/api/src/assessments/` |
| Mastery (concept scoring, level classification) | `apps/api/src/diagnosis/` |
| Remediation (plans, items, retest) | `apps/api/src/remediation/` |
| Learning (home, chapters, concepts, practice, gamification) | `apps/api/src/learning/` |
| Dashboard (student, teacher, parent, institution, super-admin) | `apps/api/src/dashboard/` |
| Import (students, teachers from Excel/CSV) | `apps/api/src/imports/` |
| AI (explain, chat) | `apps/api/src/ai/` |
| Notifications (create, list, mark-read) | `apps/api/src/common/services/` |
| Audit logs | `apps/api/src/common/services/` |
| Storage abstraction (local + R2) | `apps/api/src/common/services/storage.service.ts` |
| Knowledge base (CRUD, chunks, stats, search) | `apps/api/src/knowledge-base/` |
| Content import (PDF, video, YouTube, notes) | `apps/api/src/imports/content-import.service.ts` |
| Content search + grade filtering | `apps/api/src/curriculum/content.service.ts` |
| Generate questions from knowledge base | `apps/api/src/questions/questions.service.ts` |
| Content processing dashboard (real API: stats, list, chunks, jobs, create/process/delete) | `apps/web/app/(dashboard)/app/content-processing/page.tsx` |
| Content lifecycle transitions (DRAFT→REVIEW→APPROVED→ARCHIVED) | `apps/api/src/curriculum/content.service.ts` |
| Completeness matrix (curriculum coverage) | `apps/api/src/curriculum/content.service.ts` |
| Content quality report | `apps/api/src/curriculum/content.service.ts` |
| PDF book ingestion (text extraction + chunking) | `apps/api/src/knowledge-base/content-processor.service.ts` |
| YouTube video inline embedding | `apps/web/app/(dashboard)/app/learn/concepts/[conceptId]/page.tsx` |
| Flashcard generation from knowledge base | `apps/api/src/knowledge-base/content-generator.service.ts` |
| Flashcard answer/explanation in concept payload + persisted confidence rating | `apps/api/src/learning/learning.service.ts` + `FlashcardRating` model |
| Notes generation from knowledge base | `apps/api/src/knowledge-base/content-generator.service.ts` |
| Content versioning (version history, restore) | `apps/api/src/curriculum/content.service.ts` + `ContentVersion` model |
| Parent content restriction (API guard) | `apps/api/src/common/guards/parent-content.guard.ts` |
| Student grade filtering (server-side) | `apps/api/src/learning/learning.service.ts` |
| Demo school seed (Sanro Demo School, Class 10) | `apps/api/prisma/seed.ts` |
| Student dashboard role colors (violet/amber/emerald) | `apps/web/app/(dashboard)/app/page.tsx` + `apps/mobile/app/(tabs)/index.tsx` |
| Print CSS fix (compact header, questions on page 1) | `apps/api/src/papers/paper.template.ts` |
| Background job queue (retry, status tracking) | `apps/api/src/common/services/job-queue.service.ts` |

### Counts

- **57** Prisma models (KnowledgeBase, KnowledgeChunk, ProcessingJob, ContentVersion, FlashcardRating), **25** enums, ~**132** API endpoints
- **18** passing tests (3 spec files)
- **Web:** 48 pages, 17 components, 8 hook files
- **Mobile:** 22 screens, 8 components, 7 lib files
- **CBSE curriculum seeded** (Classes 1–10, Science + Math, 135+ content items)
- **70** YouTube embed URLs seeded for Classes 8–10

---

## Partially Implemented

| Item | Notes |
|---|---|
| S3/R2 storage | Config fields exist (`STORAGE_TYPE`, `STORAGE_KEY`, etc.) but no S3 client code |
| Content update/delete | Only create exists for content items |
| Content approval workflow | Lifecycle transitions exist; no review-assignment workflow |
| Bulk import for questions/content | Only students/teachers supported |
| Content versioning | `ContentVersion` model + endpoints, but no version diff UI |
| Search | Basic content search + grade filtering works, no cross-content search |
| Background job queue | In-memory queue with retry, no persistent queue (Redis/Bull) |
| Dashboard search bar | Decorative only — no search wiring |

---

## Broken

| Issue | Details |
|---|---|
| PDF download in production | Playwright not available on Railway; HTML fallback works. Not re-verified in this pass. |
| Mobile API defaults to localhost | `EXPO_PUBLIC_API_URL` must be set to `https://api.sanroai.com/api/v1` in production builds |
| Search bar in dashboard | Purely decorative, no functionality |
| `ChatController` duplicates `AiController` | `POST /chat/ask-sanro` = `POST /ai/chat` |
| Duplicate UI component systems | `components/ui.tsx` (legacy) and `components/ui/` (shadcn) |

---

## QA Hardening Pass (Sept 17, 2026)

Fixes applied after a deep web/API/mobile verification sweep:

| Area | Fix |
|---|---|
| Web dashboard | Corrected field mappings for XP, streak, mastery, pending assessments, recent activity; role-aware staff stats & quick actions |
| API RBAC | Added `@Roles` to `papers/:id/status`, `parents/:id/link-student` (+ parent self-link check) |
| API security | Dev-only reset-token logging gated by `NODE_ENV`; `.env.example` `AUTH_SECRET` now ≥32 chars |
| API errors | Fixed dead `ServiceUnavailableException` branch in `AllExceptionsFilter` |
| Uploads | Import cap aligned to 10MB (`IMPORT_LIMITS.MAX_FILE_BYTES`) |
| Mobile auth | Register screen now calls `/auth/register-institution` (was 404 `/auth/register`) |
| Mobile tabs | Removed orphan mock `content-processing` tab (auto-registered 6th tab) |
| Flashcards | Concept payload now returns `answer`/`explanation`; removed dead `MOCK_FLASHCARDS`; confidence rating persisted via new `FlashcardRating` model + `POST /learning/flashcards/:questionId/rate` |
| Ask SANRO | Web chat reads `?q` (auto-send) and `?conceptId` context; concept page passes both |
| Curriculum | Added Curriculum / Content nav entries for super admin; fixed dead `goToConcept` branch (now routes to concept) |
| Content processing | Web page wired to real knowledge-base API (stats, list, chunks, jobs, create/process/delete) |
| Password reset | Added web `/reset-password` and mobile `reset-password` screens |
| Dark mode | Removed toggle, hook, root inline script, and `next-themes` dependency (light-only) |

---

## Missing

### Core Platform
- Embeddings + vector search (pgvector not installed)
- Persistent queue (Redis/Bull) — currently in-memory

### Observability
- Error tracking (Sentry)
- Analytics (PostHog or similar)

### UI/UX
- Mobile PDF handling
- Mobile inline video playback

> Dark mode is intentionally not supported — the app is light-only (toggle and theme script removed).

---

## Production Status

| Component | URL / Location | Notes |
|---|---|---|
| **Web** | https://sanroai.com | Vercel, 42 routes, deployed |
| **API** | https://api.sanroai.com | Railway, health check passing |
| **Mobile** | https://sanroai.com/downloads/sanroai.apk | EAS build |
| **Database** | PostgreSQL on Railway | `sanro_dev` |
| **Cloudflare R2** | — | NOT connected |
| **Sentry** | — | NOT configured |
| **PostHog/analytics** | — | NOT configured |

---

## Known Technical Debt

1. **18 tests only** — 3 spec files, no controller/integration/e2e tests
2. **Many `any` types** in web hooks
3. **UsersController bypasses service layer**
4. **Switch-context not Zod-validated**
5. **Hardcoded parent password** (`sanro123`)
6. **Import cross-tenant teacher duplicate check**
7. **No rate limiting per-endpoint for AI**
8. **Dead code:** `PdfService.saveHtmlReport`
9. **Legacy + shadcn UI component duplication**
