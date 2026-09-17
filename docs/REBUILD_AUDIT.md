# SANRO AI — Rebuild Audit

Audit date: 2026-09-17
Auditor: Rebuild process (Phase 0)
Status: Complete

This document records the audit of the pre-rebuild repository. It is the
reference for what existed, what is retained, and what is discarded.

---

## 1. Repository Overview

- Location: `D:\sanroaiapp`
- VCS: Git, branch `master`, 51 commits, 352 tracked files
- Remote: `github.com/sanroai/app.git`
- Package manager: pnpm 12.4.2 (workspace monorepo)
- Working tree: clean at audit time

### Top-level layout (as built)

```
apps/
  api/       NestJS 11 + Prisma 6 + PostgreSQL (~90 source files, 23 modules)
  web/       Next.js 15 + React 19 + Tailwind 3.4 (~130 files)
  mobile/    Expo SDK 52 + RN 0.76.5 + expo-router 4 (~30 source files + generated android/)
packages/
  types/     Shared TS types & enums
  validation/ Zod schemas (forbidUnknownValues)
  config/    Shared config + role themes
  ui/        EMPTY stub — no package.json, no source
docs/       10 documents (pre-rebuild)
scripts/     8 helper scripts (screenshots, APK publish, model generation)
releases/    sanroai.apk (78 MB, v1.1.0, versionCode 2) — gitignored
```

## 2. What Exists (Functional Surface)

### API (`apps/api` — NestJS 11)
- Global prefix `api/v1`, port 4000
- 23 feature modules, 27 controllers, 26 services, ~95+ routes
- Auth: JWT (15-min) + server-side refresh tokens (30-day), bcrypt, forgot/reset password
- RBAC: global `JwtAuthGuard` + `RolesGuard`; roles SUPER_ADMIN / INSTITUTION_ADMIN /
  TEACHER / STUDENT / PARENT; `@Roles()`, `@Public()`, `@TenantOptional()` decorators
- Multi-tenancy: `TenantAccessService` (institution scoping), `ParentContentGuard`
- Prisma: 57 models / 25 enums, 4 migrations + `prisma db push` deploy mode
- Seed: idempotent, CBSE board, grades 1–10, Science + Math, ~28 chapters,
  135+ content items (70 YouTube embeds), 45+ questions, 8 achievements,
  demo school + 5 demo users, AR demo set, gamification profile
- Papers: generator (AI-assisted), PDF export (Playwright; HTML fallback)
- Assessments: lifecycle + auto-grading + attempts (immutable snapshot)
- Diagnosis: mastery model (STRONG/DEVELOPING/WEAK/INSUFFICIENT_EVIDENCE)
- Remediation: plans + retest
- AI: provider abstraction (mock/openai/gemini), chat, question generation,
  content generation (flashcards/notes), grounded chat context
- AR/3D: admin CRUD + validation (GLB/GLTF/USDZ), student activity, signed URLs
- Imports: student xlsx (10 MB), content import (PDF/VIDEO/NOTES, 50 MB)
- Knowledge base: chunks, processing jobs (in-memory queue), content generator
- Storage: local fs or R2/S3 (signed URLs)
- PDF: Playwright A4 template (production prefers HTML fallback)
- Tests: 18 Vitest tests in 3 spec files (all green)

### Web (`apps/web` — Next.js 15)
- Marketing site (12 pages) + auth (login/register/forgot/reset) + dashboard
- Dashboard routes per role: student learn flows, teacher, parent, admin, super admin
- Concept 6-mode page (Learn/Practice/Quick Quiz/Flashcards/Challenge/Ask SANRO) + AR
- Components: shadcn-style Radix kit (15), notification bell, AR viewers
- State: TanStack Query 5, Zustand persist (`sanro-auth`), RHF + Zod
- API client with single-flight token refresh
- Sentry integration
- APK download endpoint `/downloads/sanroai.apk`

### Mobile (`apps/mobile` — Expo SDK 52)
- 5-tab role-aware shell: Home/Learn/Practice/Tests/Me (+Classes/Assessments/Children)
- Concept 6+1 modes; practice/quiz/challenge/attempt/flashcards/ask screens
- SecureStore auth, offline mutation queue, offline credential vault (SHA-256)
- AR via WebView + Google model-viewer (external CDN)
- Assorted: leaderboard, achievements, profile-edit
- EAS config: preview=APK, production=AAB; prod env `https://api.sanroai.com/api/v1`
- Release APK already built (1.1.0, versionCode 2, com.sanro.ai)

### Deployment (as built)
- Web: Vercel (`sanroai.com`, project `sanroai-web`)
- API: Railway (`api.sanroai.com`), managed PostgreSQL (sfo)
- APK: `https://sanroai.com/downloads/sanroai.apk`
- No CI/CD, no Dockerfiles, no vercel.json

## 3. Source Educational Content

- No PDF/MP4 in the repo — all content is DB-backed seed data:
  - CBSE curriculum, grades 1–10, Science + Math
  - Study notes (markdown), quick revision, 70 YouTube embeds (Classes 8–10)
  - 45+ questions, assessments, mastery, remediation, gamification
  - 8 GLB demo models + 8 SVG previews (`apps/web/public/models/`, `apps/api/prisma/ar-demo/`)
- Retention: ALL curriculum/content/question/AR seed data retained as seed.

## 4. Credentials / Configuration (Not Exposed)

- `.env.example` files exist for root/api/web/mobile (templates only)
- `.env.local` files (root, web) contain REAL Vercel OIDC tokens — gitignored,
  never committed, never printed in this audit
- `apps/api/.env` contains only DATABASE_URL (localhost dev)
- No secrets are in git tracking (verified: 0 env files tracked)

## 5. Known Problems (Pre-Rebuild)

| # | Problem | Severity |
|---|---------|----------|
| 1 | `packages/ui` is an empty stub (no package.json/src) | Low |
| 2 | `apps/web/src/` empty vestigial directory | Low |
| 3 | Production PDF relies on HTML fallback (Playwright unavailable on Railway) | Medium |
| 4 | Deployment drift: railway.json `db push` vs .railway/railway.ts `migrate deploy` | Medium |
| 5 | No CI/CD at all | Medium |
| 6 | Mobile base URL defaults to localhost when env unset | Medium (prod builds override) |
| 7 | Homepage `/api/contact` route missing (contact form 404 risk) | Medium |
| 8 | `/app/parents` route missing but People dropdown links to it | Medium |
| 9 | `useParents`/`parents/new` route gaps | Low |
| 10 | In-memory job queue (no persistence/retry across restarts) | Medium |
| 11 | R2 client present but no bucket configured operationally | Low |
| 12 | Reports feature partially missing (P1 #29 gap) | Medium |
| 13 | Mobile flashcards rely on API returning `isCorrect` on practice options | Low |
| 14 | Mobile duplicates answer saves in quiz/challenge (tap-time + submit-time) | Low |
| 15 | `me.tsx` footer shows stale version 1.0.0 vs app.json 1.1.0 | Low |
| 16 | Root mobile stack registers phantom screens (`classes/assessments/children`) | Low |
| 17 | Mobile has no tests, no lint, no CI | Medium |
| 18 | Stats "session 13" docs (status.md, IMPLEMENTATION_STATUS.md) are single-snapshot | Low |

## 6. Things Retained (Re-use Conceptually)

- Full curriculum architecture (Board→Grade→Subject→Chapter→Topic→Concept)
- Content lifecycle (DRAFT→REVIEW→APPROVED→PUBLISHED→ARCHIVED)
- Question bank with type mapping (SHORT→SHORT_ANSWER, LONG→LONG_ANSWER)
- Assessment snapshot/attempt immutability pattern
- Mastery/diagnosis model with minimum evidence thresholds
- Remediation plan + retest concept
- Multi-tenant scoping service pattern
- Auth: JWT + server-side refresh + bcrypt + rate limiting patterns
- ParentContentGuard restriction pattern
- Zod validation + forbidUnknownValues pattern
- Storage abstraction (local ↔ R2/S3 signed URLs)
- AR validation + lifecycle pattern (GLB/GLTF/USDZ checks)
- Role-based UI theme tokens
- Offline mobile queue + offline credential vault patterns
- Seed data (curriculum, questions, content, AR, gamification, demo users)

## 7. Things Discarded

Per the master spec, the following design decisions are discarded regardless of
their prior existence:

- Any UI built assuming a single merged Learn+Assess navigation
- Legacy `components/ui.tsx` light component kit (replaced by full ui/ kit)
- Empty `packages/ui` stub package
- Vestigial `apps/web/src/` directory
- In-memory job queue as final architecture (requires durable queue for rebuild)
- random standalone features not aligned with the two primary product paths

NOTE: The audit is a snapshot of "what exists". The rebuild plan decides
exactly which retained patterns are rewritten vs reused in place (see
REBUILD_PROGRESS.md and MASTER_PRODUCT_SPEC.md).

## 8. Reusable Infrastructure

- Monorepo pnpm workspace root (pnpm-workspace.yaml, turbo.json, .npmrc)
- Build order: types → validation → config → API → Web
- Vercel + Railway deployment wiring (needs CI/CD added)
- EAS build profiles (preview APK / production AAB) with prod API URL
- Screenshot scripts (26 pages) + APK publish script + GLB generator script
- Metro monorepo config for Expo
- `.railway/railway.ts` with domain api.sanroai.com

## 9. Deployment Infrastructure

- Domains: sanroai.com / app.sanroai.com / api.sanroai.com
- Vercel project `sanroai-web` (org `team_Csj2KLp4eyS4h6M2MR88aN51`)
- Railway service `api` (managed Postgres, sfo)
- EAS project `eb098800-6294-4a77-ae94-fe34128a8364` (owner `sanroai`)
- APK stable path `https://sanroai.com/downloads/sanroai.apk`

## 10. Audit Conclusion

The existing implementation is a mature, deployed v1 of a previously
incrementally-built product. The rebuild retains the two-primary-path product
model, the domain model value, and the deployment infrastructure, while
rebuilding the application layering (design system, navigation IA, web
experience, mobile IA, website, durable job/notification/reporting systems,
CI/CD) from a clean foundation per the master spec.