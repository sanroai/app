# Architecture

> Last updated: 2026-09-16 (Session 13)

## Overview

Sanro AI is a **pnpm + Turborepo monorepo** with four layers:

```
┌─────────────────────────────────────────────────────┐
│                 Frontend (Web)                        │
│  Next.js 15 · Tailwind · TanStack Query · Zustand   │
│  Port 3000                                           │
└───────────────────┬─────────────────────────────────┘
                    │ REST API (JSON)
┌───────────────────▼─────────────────────────────────┐
│                 Frontend (Mobile)                     │
│  Expo SDK 52 · React Native · expo-router · Zustand │
│  Talks to same production API                        │
└───────────────────┬─────────────────────────────────┘
                    │ REST API (JSON)
┌───────────────────▼─────────────────────────────────┐
│                 Backend (API)                         │
│  NestJS 11 · Prisma 6.19 · JWT Auth · Zod           │
│  Port 4000                                           │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│                 Database                              │
│  PostgreSQL 18 · Prisma migrations                   │
│  DBs: sanro_dev / sanro_test                         │
└─────────────────────────────────────────────────────┘
```

## System Flow

```
Teacher creates paper from approved question bank
        │
        ▼
Assessment created from a paper/question list
        │ snapshot questions at creation time
        ▼
Publish to groups/students
        │
        ▼
Student starts attempt
        │
        ▼
Save answers → Submit → Auto-grade objective questions
        │
        ▼
Scores + Gamification (XP, streak, badges)
        │
        ▼
Mastery diagnosis: per-concept evidence
        │
        ▼
Weak concepts → Remediation plans (video/notes/practice)
        │
        ▼
Retest → Improved mastery closes the loop
```

## Key Invariants

1. **AI questions stay DRAFT** until a teacher approves them
2. **Assessments snapshot questions** at creation time — later bank edits never alter live assessments
3. **Seat limits enforced** on registration/import
4. **Paper marks validated** before export (MCQ 1 · SHORT 2 · LONG 5 by default)
5. **Historical records immutable** — analysis never rewrites a past attempt
6. **Multi-tenancy** — all data scoped to `institutionId`
7. **No Docker** — native PostgreSQL on Windows

## API Module Map

| Module | Responsibility |
|--------|---------------|
| `auth` | Register, login, refresh, logout, switch-context, password management |
| `curriculum` | Boards, grades, subjects, chapters, topics, concepts |
| `questions` | CRUD, search/filter, AI generation, review/approval |
| `papers` | Paper generation, preview HTML, PDF export, validation |
| `assessments` | Create, publish, assign, attempts, auto-grading |
| `diagnosis` | Concept mastery, diagnostic results |
| `remediation` | Remediation plans, content items, retest |
| `dashboard` | Per-role home data |
| `institutions` | Tenant management |
| `people` | Students, teachers, parents |
| `imports` | Bulk Excel import |
| `ai` | AI provider interface (mock default) |
| `chat` | Sanro AI chatbot |
| `content` | Content items for remediation |
| `files` | PDF file serving |
| `admin` | Platform admin |

## Cross-Cutting Concerns

- **Auth**: Stateless JWT + refresh-token sessions table; roles via guards + `@Roles()`
- **Validation**: Zod schemas in `packages/validation`, enforced by global `ZodValidationPipe` (`forbidUnknownValues: true`)
- **RBAC**: `@Roles()` decorators on all mutation endpoints (people, questions, papers, curriculum, academics, institutions, imports, remediation)
- **Rate Limiting**: `@nestjs/throttler` — global 120/min; auth-specific (login 10/min, forgot-password 3/min, register 5/min)
- **CORS**: Production locked to explicit origins (`sanroai.com`, `app.sanroai.com`); dev allows all
- **JWT Secret**: Min 32 chars; production guardrail refuses dev default
- **File Upload**: 10MB limit + MIME validation on imports
- **DI/Config**: `AppConfig` via `@Inject(APP_CONFIG_TOKEN)` from `common/common.module` (single source of truth via Zod schema)
- **Response Shape**: Payloads returned directly (no envelope). Errors: `{ code, message, requestId, statusCode, details? }`
- **Logging**: NestJS built-in logger with request IDs

## Frontend Architecture

### Web (Next.js)

```
app/
├── (public)/                  # Public pages (shared header/footer)
│   ├── layout.tsx             # Public layout (nav, footer)
│   ├── page.tsx               # Landing page
│   ├── about/                 # About page
│   ├── features/              # Features page
│   ├── for-students/          # For Students page
│   ├── for-teachers/          # For Teachers page
│   ├── for-schools/           # For Schools page
│   ├── for-parents/           # For Parents page
│   ├── pricing/               # Pricing page
│   ├── contact/               # Contact page
│   ├── download/              # Download page
│   ├── privacy/               # Privacy page
│   └── terms/                 # Terms page
├── (dashboard)/               # Protected layout wrapper
│   ├── layout.tsx             # Nav, auth check, hydration guard
│   └── app/
│       ├── page.tsx           # Dashboard home (role-specific)
│       ├── papers/            # Paper management
│       ├── assessments/       # Assessment management
│       ├── remediation/       # Remediation tracking
│       ├── questions/         # Question bank
│       ├── students/          # Student management
│       ├── teachers/          # Teacher management
│       ├── parents/           # Parent management
│       ├── chat/              # AI tutor chat
│       ├── gamification/      # XP, achievements, leaderboard
│       ├── profile/           # User profile
│       ├── settings/          # Settings
│       └── import/            # Bulk import
├── login/                     # Auth pages (public)
├── register/
├── robots.ts                  # SEO: robots.txt
├── sitemap.ts                 # SEO: sitemap
└── proxy/preview/[id]/        # Authenticated iframe proxy
```

### Mobile (Expo)

```
app/
├── _layout.tsx                # Root layout (SafeAreaProvider, ErrorBoundary, AuthGate)
├── (auth)/
│   ├── login.tsx              # Login screen
│   └── register.tsx           # Register screen
├── (tabs)/
│   ├── _layout.tsx            # Role-aware tab layout
│   ├── index.tsx              # Home (role-specific content)
│   ├── learn.tsx              # Learn (student only)
│   ├── practice.tsx           # Practice (student only)
│   ├── tests.tsx              # Tests (student only)
│   ├── classes.tsx            # Classes (teacher/admin only)
│   ├── assessments.tsx        # Assessments (teacher/admin only)
│   ├── children.tsx           # Children (parent only)
│   └── me.tsx                 # Profile
├── learn/                     # Learn flow screens
├── concept/                   # Concept detail (6 modes)
├── practice/                  # Practice session
├── attempt/                   # Assessment attempt
├── quiz/                      # Quick Quiz
├── flashcards/                # Flashcards
├── challenge/                 # Timed Challenge
├── ask/                       # Ask SANRO
└── leaderboard.tsx            # Leaderboard
```

**State Management**:
- Server state: TanStack Query (cache, background refetch)
- Client state: Zustand (auth, UI preferences)
- Forms: React Hook Form + Zod resolver

## Shared Packages

| Package | Purpose |
|---------|---------|
| `@sanro/types` | Shared TypeScript types (Role enum, etc.) |
| `@sanro/validation` | Shared Zod schemas (Login, Register, etc.) |
| `@sanro/config` | Shared configuration values |

## Environment Notes

- **Windows host, no Docker**: Native PostgreSQL 18
- **Build order**: Shared packages → API → Web
- **Prisma**: Regenerate client after schema changes (`db:push` does both)
- **Port allocation**: API=4000, Web=3000, PostgreSQL=5432
