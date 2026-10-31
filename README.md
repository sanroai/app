# Sanro AI

> India's first AI + AR learning platform for schools and coaching centres.

**ASSESS → DIAGNOSE → FIX → RETEST → IMPROVE**

Built for CBSE Board, focused on Classes 1–10 Science and Mathematics.

---

## Quick Start

```bash
pnpm install
pnpm --filter @sanro/api db:push    # Create tables
pnpm --filter @sanro/api db:seed    # SYSTEM ONLY: plans, achievements, bootstrap super admin
pnpm --filter @sanro/api db:seed:demo  # Optional: full demo data (demo users below)
pnpm --filter @sanro/api start:dev  # API on :4000
pnpm --filter @sanro/web dev        # Web on :3000
```

**Demo login**: demo accounts are created by `db:seed:demo`; the demo password is intentionally omitted from this README (the local development default is defined by the seed).

## Monorepo Layout

| Package | Tech | Port | Description |
|---------|------|:----:|-------------|
| `apps/api` | NestJS 11, Prisma 6.19 | 4000 | REST API, JWT auth, paper generator, assessments, mastery diagnosis |
| `apps/web` | Next.js 15, Tailwind 3.4 | 3000 | Web app with gamified student dashboard, teacher tools, 12 public pages |
| `apps/mobile` | Expo SDK 53, React Native 0.79.6 | — | Mobile app (student-first, multi-role tabs for teacher/parent/admin) |
| `packages/types` | TypeScript | — | Shared types & enums |
| `packages/validation` | Zod 3.24 | — | Shared validation schemas |
| `packages/config` | TypeScript | — | Shared configuration |

## Features

### Implemented
- **Landing Page** — Complete 12-page public website (Home, About, Features, For Students, For Teachers, For Schools, For Parents, Pricing, Contact, Download, Privacy, Terms)
- **SEO** — robots.txt, sitemap, Open Graph, metadata across all pages
- **Auth** — Login, register, JWT with refresh tokens, multi-tenant
- **Student Dashboard** — XP, streaks, mastery level, badges, pending assessments
- **Library** — self-directed browse (board → grade → subject → chapter → lesson), search, lesson detail with Markdown notes
- **Assessments** — Tests tab plus a diagnosis-driven learning **Path**: ordered concepts with `mastered / inProgress / notStarted` and student-triggered retests
- **Paper Generator** — Board→Grade→Subject, configurable distributions, HTML preview
- **Assessment System** — Create, publish to groups, timed attempts, auto-grading
- **Remediation** — Concept mastery tracking, targeted learning plans, progress marking
- **Teacher Tools** — Paper management, assessment creation, student monitoring
- **Concept Learning** — Class-wise content (CBSE 1-10), 3 concept learning modes (Learn / Practice / Ask Sanro AI)
- **Gamification** — XP, streaks, achievements, leaderboard
- **AI Tutor** — Context-aware chat with curriculum grounding
- **Question Bank** — 7-filter search, CRUD, bulk import
- **Bulk Imports** — Students, teachers, parents, content and questions from CSV/XLSX with preview, duplicate detection and audit
- **Lesson Media** — Markdown rendering on web + mobile, chapter-wise YouTube video management
- **Mobile App** — Expo React Native with 5-tab student shell + role-specific tabs for teacher/parent/admin
- **Security** — CORS production lockdown, RBAC on all mutation endpoints, rate limiting, Zod validation, file upload limits

### In Progress
- Content population for Classes 1-7
- Achievement icon mapping to Lucide icons

### Planned
- Real AI provider integration
- Redis/BullMQ job queues

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 15, React 19, Tailwind 3.4, shadcn/ui-style, TanStack Query, Zustand, RHF + Zod |
| Mobile | Expo SDK 53, React Native 0.79.6, expo-router 5, Zustand, TanStack Query, expo-secure-store |
| Backend | NestJS 11, Prisma 6.19, PostgreSQL 18, JWT, Zod validation, @nestjs/throttler |
| Tooling | pnpm 12, Turborepo, TypeScript 5.7, Vitest |

## Demo Users

| Email | Role | Name |
|-------|------|------|
| `admin@sanroai.com` | SUPER_ADMIN | Platform Admin |
| `principal@sanroai.com` | INSTITUTION_ADMIN | Institution Admin |
| `teacher@sanroai.com` | TEACHER | Teacher |
| `student@sanroai.com` | STUDENT | Aarav Sharma |
| `parent@sanroai.com` | PARENT | Parent |

All demo accounts share one development password, created by `db:seed:demo`. It is intentionally omitted from this README.

## Production

| Service | URL | Status |
|---------|-----|--------|
| Web | https://sanroai.com | ✅ LIVE |
| API | https://api.sanroai.com | ✅ LIVE |
| Android | https://sanroai.com/downloads/sanroai.apk | ✅ LIVE |

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture](docs/ARCHITECTURE.md) | System design & module map |
| [Deployment](docs/DEPLOYMENT.md) | Production targets, env, procedure, verification |
| [Changelog](docs/CHANGELOG.md) | Product / phase history |
| [Development log](docs/CHANGELOG_DEVELOPMENT.md) | Schema, migration and data-change record |
| [Imports](docs/IMPORTS.md) | Bulk import contract (5 entity types, column schemas) |
| [Learning architecture](docs/LEARNING_ARCHITECTURE.md) | Library vs Assessments, learning Path, APIs |
| [QA](docs/QA.md) | Test layers, gates, journeys, DoD |
| [Product spec](docs/MASTER_PRODUCT_SPEC.md) | Full product specification |
| API reference | Swagger UI — `http://localhost:4000/docs` (gated to non-production) |

## License

Proprietary — Sanro Educare Pvt. Ltd.
