# Architecture

> Last updated: 2026-09-15

## Overview

Sanro AI is a **pnpm + Turborepo monorepo** with three layers:

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Web)                     │
│  Next.js 15 · Tailwind · TanStack Query · Zustand   │
│  Port 3000                                           │
└───────────────────┬─────────────────────────────────┘
                    │ REST API (JSON)
┌───────────────────▼─────────────────────────────────┐
│                    Backend (API)                      │
│  NestJS 11 · Prisma 6.19 · JWT Auth · Zod           │
│  Port 4000                                           │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│                    Database                           │
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
- **Validation**: Zod schemas in `packages/validation`, enforced by global `ZodValidationPipe`
- **DI/Config**: `AppConfig` via `@Inject(APP_CONFIG_TOKEN)` from `common/common.module`
- **Response Shape**: Payloads returned directly (no envelope). Errors: `{ code, message, requestId, statusCode, details? }`
- **Logging**: NestJS built-in logger with request IDs
- **Rate Limiting**: `@nestjs/throttler` (configurable)

## Frontend Architecture

```
app/
├── page.tsx                    # Landing (public)
├── login/                      # Auth pages (public)
├── register/
├── (dashboard)/                # Protected layout wrapper
│   ├── layout.tsx              # Nav, auth check, hydration guard
│   └── app/
│       ├── page.tsx            # Dashboard home
│       ├── papers/             # Paper management
│       ├── assessments/        # Assessment management
│       └── remediation/        # Remediation tracking
└── proxy/preview/[id]/         # Authenticated iframe proxy
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
