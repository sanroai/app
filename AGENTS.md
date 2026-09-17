# AGENTS.md

## Project
Sanro AI — Multi-tenant academic platform for Indian schools (ASSESS → DIAGNOSE → FIX → RETEST → IMPROVE). CBSE Board, Classes 1-10 (Science + Mathematics).

## Commands
```bash
pnpm -r typecheck              # Typecheck all packages
pnpm --filter @sanro/api test  # Run Vitest (18/18)
pnpm --filter @sanro/api start:dev  # API on :4000
pnpm --filter @sanro/web dev        # Web on :3000
pnpm --filter @sanro/mobile dev     # Expo dev server (mobile)
pnpm --filter @sanro/mobile typecheck  # Mobile typecheck only
pnpm build                     # Full Turborepo build (6 tasks)
npx tsx scripts/screenshots.mts     # Capture all page screenshots
pnpm --filter @sanro/api db:seed    # Seed demo data (idempotent)
pnpm --filter @sanro/api db:push    # Sync Prisma schema
```

## Build Order
Always build shared packages first: `@sanro/types` → `@sanro/validation` → `@sanro/config` → API → Web.

## Mobile App (apps/mobile)
- Expo SDK 52 / React Native 0.76.5 / expo-router 4 / React 18.3.1 — primary student experience (P0)
- 5-tab shell: Home / Learn / Practice / Tests / Me; concept page has 6 modes (Learn, Practice, Quick Quiz, Flashcards, Challenge, Ask SANRO)
- **Multi-role tabs**: student (Learn/Practice/Tests), teacher/admin (Classes/Assessments), parent (Children)
- Stack: TypeScript strict, Zod, Zustand, TanStack Query 5, expo-secure-store
- Runtime is Expo (no native build step in turbo; `@sanro/mobile#build` is a stub)
- Tokens in SecureStore keys `sanro-token` / `sanro-refresh` / `sanro-user`; API base default `https://api.sanroai.com/api/v1` (read `EXPO_PUBLIC_API_URL`; use `EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1` for local dev)
- SafeAreaProvider for notch/Dynamic Island
- Memberships persisted to SecureStore
- ErrorBoundary wrapping app root
- RN peer pulls `@types/react@18`; web uses `@types/react@19`. Do NOT try to unify these versions — web's tsconfig `paths` for `react`/`react-dom`/`jsx-runtime` keeps the two React type identities separate.

## Code Style
- TypeScript strict, no comments unless asked
- Tailwind CSS 3.4, no CSS-in-JS
- shadcn/ui-style components in `components/ui/`
- React Hook Form + Zod for all forms
- TanStack Query for server state, Zustand for client state
- API returns payloads directly (no envelope)
- Error body: `{ code, message, requestId, statusCode, details? }`

## API Port
4000 (global prefix: `api/v1`)

## Web Port
3000

## Database
PostgreSQL 18 native (no Docker). User: `postgres`, Password: `postgres`, DBs: `sanro_dev`, `sanro_test`.

## Auth
JWT-based. Zustand persist store in localStorage key `sanro-auth`. Hydration tracked via `_hasHydrated` flag.

## Security (Session 13)
- **CORS**: Production locked to explicit origins (`sanroai.com`, `app.sanroai.com`, `www.sanroai.com`)
- **JWT Secret**: Min 32 chars; production refuses dev default (`AUTH_SECRET` must not start with `dev-`)
- **RBAC**: `@Roles()` on all mutation endpoints (people, questions, papers, curriculum, academics, institutions, imports, remediation)
- **Rate Limiting**: Auth-specific (login 10/min, forgot-password 3/min, register 5/min)
- **Validation**: Zod schemas on 13+ endpoints, `forbidUnknownValues: true`
- **File Upload**: 10MB limit + MIME validation on imports
- **Forgot-Password**: Raw token no longer returned (returns `{ success: true }`)
- **Swagger**: Gated behind `NODE_ENV !== 'production'`

## Prisma Notes
- `User` has no `role` field — role is on `InstitutionMember`
- `Teacher`/`Student`/`Parent` have no name/email (on `User`)
- `Subject` has no `grade` field
- `Chapter` requires `code` + `grade`
- `ContentItem` uses field `type`
- `Grade` model: `{ id, boardId, name, order }`. `/curriculum/grades` returns name strings only
- Question type mapping: UI `SHORT` → Prisma `SHORT_ANSWER`, UI `LONG` → Prisma `LONG_ANSWER`

## Key Files
- `apps/api/prisma/schema.prisma` — Full schema (1318 lines)
- `apps/api/prisma/seed.ts` — Idempotent seed (135+ content items, 8 achievements, gamification profile)
- `apps/web/lib/auth-store.ts` — Zustand auth with hydration + token refresh
- `apps/web/lib/api.ts` — API client with auto token refresh on 401
- `apps/web/lib/api-hooks.ts` — TanStack Query hooks
- `apps/web/lib/learning-hooks.ts` — Learning + gamification hooks
- `apps/web/lib/question-hooks.ts` — Question bank hooks
- `apps/web/lib/people-hooks.ts` — People management hooks
- `apps/web/lib/ai-hooks.ts` — AI chat hook
- `apps/web/lib/import-hooks.ts` — Import hooks
- `apps/web/components/ui/` — shadcn/ui-style component library
- `apps/web/tailwind.config.ts` — Brand colors, animations
- `apps/api/src/papers/papers.service.ts` — Paper generation + type mapping
- `apps/api/src/assessments/assessments.service.ts` — Assessment flow + auto-grading
- `apps/api/src/learning/learning.service.ts` — Learning path + gamification + practice
- `apps/api/src/questions/questions.service.ts` — Question bank CRUD + filters
- `apps/mobile/lib/hooks.ts` — All mobile TanStack Query hooks (learning, practice, assessments, AI)
- `apps/mobile/lib/api.ts` + `lib/auth-store.ts` — Mobile API client + SecureStore auth
- `apps/mobile/lib/offline.ts` — Offline mutation queue (Zustand + AsyncStorage), `flushOfflineQueue()`
- `apps/mobile/lib/offline-auth.ts` + `lib/sha256.ts` — Offline login credential vault (SecureStore + SHA-256)
- `apps/mobile/lib/api.ts` — API client; base reads `EXPO_PUBLIC_API_URL` (default `https://api.sanroai.com/api/v1`)
- `apps/mobile/components/OfflineBanner.tsx` — Shared offline status banner
- `apps/mobile/app/` — Expo Router screens (5-tab shell, learn flow, concept 6 modes, attempts)

## Demo Users (password: Sanro@123)
- `admin@sanroai.com` (SUPER_ADMIN)
- `principal@sanroai.com` (INSTITUTION_ADMIN)
- `teacher@sanroai.com` (TEACHER)
- `student@sanroai.com` (STUDENT)
- `parent@sanroai.com` (PARENT)

## Design Language
Purple/violet primary (#7c3aed), rounded cards (2xl/3xl), soft shadows, gradient accents, Poppins headings, Inter body. Logo: GraduationCap icon (replaced Sparkles).

## Concept Detail Page — 6 Learning Modes
The concept detail page (`/app/learn/concepts/[conceptId]`) has a 6-tab interface:
1. **Learn** — Video lessons (YouTube embeds) + Study notes (markdown) + Quick revision
2. **Practice** — Backend-driven quiz with mastery tracking, "Fix This" CTA for weak concepts
3. **Quick Quiz** — 5 concept-specific questions from DB, submit, score (NO hardcoded mock questions)
4. **Flashcards** — Concept-specific questions with flip + confidence rating (Again/Hard/Good/Easy)
5. **Challenge** — Timed 60s challenge, 10 questions, 50 XP max
6. **Ask SANRO** — Context-aware questions → AI chat

## Student Dashboard — "What should I do today?"
- **Your Focus Today**: Weak concept "Fix This" CTA + upcoming assessment "Prepare"
- **Progress Summary**: XP, Streak, Mastery (compact cards)
- **Continue Learning**: Browse All Subjects
- **Pending Assessments**: Start button
- **Recent Activity**: Score badges

## Product Principle
SANRO is NOT a content library. It is an academic intelligence platform that converts assessment data into specific learning interventions and measurable improvement.
Core loop: ASSESS → DIAGNOSE → FIX → RETEST → IMPROVE
Student journey: TODAY → DO THIS → IMPROVE

## Production Deployment (Part of Definition of Done)
Deployment is part of the task. Do NOT stop after local development — the project is not complete until SANRO is live.
`docs/PRODUCTION_DEPLOYMENT.md` (sections 86–111) is binding. Key rules:
- Do not stop at `pnpm build`. Deploy web (Vercel) + API (managed NestJS host), connect managed PostgreSQL, configure env vars via `.env.example`, remove all localhost references, verify live URLs, and smoke-test the full flow against production.
- Domains: `sanroai.com` / `app.sanroai.com` / `api.sanroai.com`. Mobile consumes the SAME production API as web — no separate backend logic.
- Prohibited: committing secrets, `prisma migrate reset` on prod, wildcard CORS with auth, localhost in production, claiming success without verification.
- If blocked by missing credentials/access: say `BLOCKED — requires [specific access]` and document the exact DNS/credential requirements. Never fabricate configuration.
- This local repo currently talks to `localhost:4000` — mobile API base and web env URLs must be switched to the deployed API before production use.

## CBSE Curriculum
- Board: CBSE (Classes 1-10)
- Class 10: 13 Science + 15 Math chapters (48 content items)
- Class 9: 4 + 4 chapters (34 content items)
- Class 8: 3 + 3 chapters (53 content items)
- Classes 1-7: 2-3 chapters each (structure ready)
