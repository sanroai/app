# SANRO Progress Snapshot

> **Date:** September 16, 2026
> **Status:** Live — Web + API deployed, Mobile APK available

---

## Architecture

| Layer | Stack |
|---|---|
| **Web** | Next.js 15, React 19, Tailwind CSS, Zustand, TanStack Query, shadcn-style UI |
| **API** | NestJS, Prisma ORM, PostgreSQL, Playwright (PDF), OpenAI-compatible AI |
| **Mobile** | Expo SDK 52, React Native 0.76.5, expo-router 4 |
| **Database** | PostgreSQL 18 on Railway (production: `api.sanroai.com`, `sanro_dev`) |
| **AI** | OpenAI-compatible (`gpt-4o-mini`), mock fallback |
| **Storage** | Local filesystem only (`storage/pdfs/`). Cloudflare R2 NOT connected. |
| **PDF** | Playwright chromium rendering. `PDF_ENGINE=none` likely in production. |
| **Queue/Job** | NONE |
| **Embeddings/Vector** | NONE |
| **YouTube** | Embed URLs only in `ContentItem.url`. No YouTube API. |
| **Knowledge Base** | NONE |

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

### Counts

- **33** Prisma models, **22** enums, ~**100** API endpoints
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
| `UploadedFile` model | Schema exists but no controller/service |
| Content update/delete | Only create exists |
| Content approval workflow | Implicit on create, no explicit transitions |
| Bulk import for questions/content | Only students/teachers supported |
| Content versioning | Not implemented |
| Search | No cross-content search |
| Content processing dashboard | Not implemented |
| Completeness matrix | Not implemented |

---

## Broken

| Issue | Details |
|---|---|
| PDF download in production | Likely `PDF_ENGINE=none` on Railway, Playwright not available |
| Print CSS | Header takes page 1, questions start on page 2 (unnecessary page break) |
| Mobile API defaults to localhost | `EXPO_PUBLIC_API_URL` not set in production |
| Super Admin nav links | `/app/institutions`, `/app/curriculum`, `/app/analytics` pages don't exist |
| Search bar in dashboard | Purely decorative, no functionality |
| `ChatController` duplicates `AiController` | `POST /chat/ask-sanro` = `POST /ai/chat` |
| Duplicate UI component systems | `components/ui.tsx` (legacy) and `components/ui/` (shadcn) |
| `console.log` left in proxy route | — |

---

## Missing

### Core Platform
- Cloudflare R2 storage service
- Storage abstraction layer
- PDF book ingestion pipeline
- Knowledge base + chunks
- Embeddings + vector search
- Bulk content import (PDFs, videos, notes)
- Content processing dashboard
- Question generation from knowledge base
- Notes generation from knowledge
- Flashcard generation from knowledge
- Content search
- Student content filtering by grade
- Content lifecycle (`DRAFT` → `REVIEW` → `APPROVED` → `PUBLISHED` → `ARCHIVED`)
- Book-to-curriculum mapping
- Content quality report
- Completeness matrix
- Content versioning
- Queue/job system for background processing

### Observability
- Error tracking (Sentry)
- Analytics (PostHog or similar)

### UI/UX
- Dark mode
- Mobile PDF handling
- Mobile inline video playback
- Mobile profile editing (done but no forgot-password)

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
8. **Dead code:** `PdfService.saveHtmlReport`, `MOCK_FLASHCARDS` in concept page
9. **Legacy + shadcn UI component duplication**
