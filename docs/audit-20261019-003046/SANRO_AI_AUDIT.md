# Sanro AI — Technical Audit (Phase E)

Workspace: D:\sanroaiapp (git repo, master)
Date: 2026-10-19

## 1) Architecture (confirmed)
- Monorepo (pnpm): apps/api (NestJS), apps/web (Next.js), apps/mobile (Expo RN), packages/* (types/validation/config)
- DB: PostgreSQL 18 (native). Dev DB sanro_dev (localhost:5432), test sanro_test. Prisma schema: apps/api/prisma/schema.prisma (1789 lines).
- Auth: JWT; web auth store persists in localStorage key sanro-auth with _hasHydrated; mobile uses SecureStore (sanro-token, sanro-refresh, sanro-user). Memberships persisted to SecureStore.
- API: global prefix api/v1 on :4000 (local). Web :3000, Mobile Expo :8081.
- Build order: @sanro/types → @sanro/validation → @sanro/config → API → Web.

## 2) Mobile (Expo)
- SDK 53, React Native 0.79.6, React 19.0.0, Expo Router 5 (typedRoutes off), TypeScript strict.
- Tabs: Home/Library/Assessments/Ask SANRO/Me (5-tab shell). Concept detail 6 modes (Learn, Practice, Quick Quiz, Flashcards, Challenge, Ask SANRO).
- Design system (new): 34 Fluent Emoji 3D PNGs in apps/mobile/assets/icons/; Icon3D, visuals (SubjectCard, StatTile, SectionHeader, ProgressBar, resolveSubject/resolveAchievement); theme has Pastel/Ink, cream background (#faf7f2).
- API contracts (corrected): flat GamificationProfile, AchievementsResponse {earned,locked}, nested LearningProgress; leaderboard “me” from auth user id. Hooks in apps/mobile/lib/hooks.ts aligned to backend shapes.
- Offline: offline queue (Zustand+AsyncStorage), offline-auth vault (SecureStore+SHA-256). API base reads EXPO_PUBLIC_API_URL (default https://api.sanroai.com/api/v1; local http://localhost:4000/api/v1).
- SafeArea, ErrorBoundary, membership in SecureStore. React 18 types for RN peer; React 19 for web (separated).

## 3) Web
- Next.js app router, Tailwind CSS 3.4, shadcn/ui-style components (components/ui), React Hook Form + Zod, TanStack Query + Zustand. 
- Key hooks: api-hooks, learning-hooks, library-hooks, path-hooks, video-hooks, question-hooks, people-hooks, ai-hooks, import-hooks. 
- Auth store in localStorage sanro-auth; API client auto-refreshes on 401.

## 4) API (NestJS)
- Endpoints under api/v1. RBAC @Roles on mutations; CORS locked in prod; JWT secret min 32 chars (prod rejects dev-). Rate limiting on auth (login/forgot/register). Zod validation (forbidUnknownValues) on many endpoints. File uploads 10MB+MIME. Swagger gated prod.
- Core services: curriculum/content (scope filtering via ContentScopeService), learning (path/home/progress/gamification), assessments, remediation (retest), papers, questions, imports (5 entity types), people.
- Prisma: User has no role (role on InstitutionMember); Teacher/Student/Parent no name/email (User); Subject no grade; Chapter needs code+grade; ContentItem uses type; Grade {id,boardId,name,order}; question type mapping UI SHORT→SHORT_ANSWER, LONG→LONG_ANSWER.

## 5) Content & Data
- Seeds: idempotent seed.ts (system/demo/qa modes). After reset, sanro_dev has 1 system institution, 1 super admin, 3 plans, 8 achievements, 16 migration rows. sanro_test must use migrate deploy (cannot db push singleton index).
- Library: seed fix applied (ownerType INSTITUTION with null institutionId → PLATFORM + directSanroAvailable) + self-healing repair; browse returns correct totals (143 content items). Content visibility filtered to APPROVED|PUBLISHED.
- Books/ (git-ignored): CBSE Class 10 Science (15 PDFs, 232 pages) tooling in scripts/books/*.

## 6) Quality Gates
- Typecheck: 6/6 packages green (0 TS errors). 
- Lint: exit 0 (warnings baseline). 
- Tests: API 22 files, 244/244 passing (stable after observed flake). Mobile 5/5 passing.
- No deletions in working tree; 29 modified, 16 untracked.

## 7) Known Issues / Technical Debt
- pnpm audit --prod: 0 critical, 19 moderate, 35 high (backlog).
- D4 credential rotation approved but pending (apps/api/prisma/seed.ts line 26 + .env.example).
- SEC-3 MCP permission block deferred.
- Leaderboard.tsx: editing unreliable via some tools (repeated/garbled reads in earlier attempts); authoritative ~100 lines, single styles, needs surgical/minimal edit or manual attention.
- expo-system-ui: prebuild warned userInterfaceStyle: "light" unsupported without it.
- PostgreSQL MCP configured points to FRIICRM DB (separate concern; preserved as configured; not used by Sanro dev/test).
- Concept 0 questions is legitimate for seeded concept (gating correct).

## 8) Strengths
- Strong RBAC, validation, rate limiting, security posture. 
- Clean contracts between mobile/web and API. 
- 3D/pastel design system implemented across key screens. 
- End-to-end data flow verified (Home/Library/Assessments/Ask/Me/Concept modes). 
- Tests green, typecheck clean.

## 9) Recommended Priorities
P0: Stabilize flaky test monitoring (document known flake), address D4 rotation carefully. 
P1: Leaderboard 3D upgrade (surgical, verify with reliable read). Add expo-system-ui if prebuild needed. 
P2: Tackle dependency advisories (19 mod/35 high) in staged batches. 
P3: Expand device verification (subject/chapter drilldown, practice/quiz/flashcards/challenge runtime, profile-edit, teacher classes/assessments, parent children) with fresh screenshots.