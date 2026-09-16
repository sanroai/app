# Sanro AI — Master Documentation

> Last updated: 2026-09-16 (Session 13 — Security, mobile multi-role, Zod validation, dead links fix)
> Version: 0.1.0 (active development)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Getting Started](#4-getting-started)
5. [Environment Setup](#5-environment-setup)
6. [Database](#6-database)
7. [API Reference](#7-api-reference)
8. [Web App (Frontend)](#8-web-app-frontend)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Core Features](#10-core-features)
11. [Design System](#11-design-system)
12. [Seed Data & Demo Users](#12-seed-data--demo-users)
13. [Development Workflow](#13-development-workflow)
14. [Build & Deploy](#14-build--deploy)
15. [Known Issues & Fixes](#15-known-issues--fixes)
16. [Future Roadmap](#16-future-roadmap)
17. [Screenshots](#17-screenshots)

---

## 1. Project Overview

Sanro AI is a **multi-tenant academic platform** for Indian schools and coaching centres (CBSE Board, Classes 1–10 Science/Mathematics). It implements the learning cycle:

```
ASSESS → DIAGNOSE → FIX → RETEST → IMPROVE
```

### Key Capabilities

- **Question Bank**: Board-mapped questions with concept tagging, AI-assisted generation
- **Question Paper Generator**: Auto-generate papers from question bank with configurable distributions
- **Digital Assessments**: MCQ + long-answer, auto-grading, timed attempts
- **Mastery Diagnosis**: Per-concept mastery tracking, weak concept identification
- **Remediation Plans**: Targeted learning resources for weak areas
- **Gamification**: XP points, streaks, badges, leaderboards
- **Multi-Role Dashboards**: Students, Teachers, Institution Admins, Parents, Super Admins
- **Bulk Import**: Excel-based student/teacher/parent onboarding

### Target Users

| Role | Description |
|------|-------------|
| `SUPER_ADMIN` | Platform administrator |
| `INSTITUTION_ADMIN` | School/coaching centre principal or admin |
| `TEACHER` | Subject teacher |
| `STUDENT` | Student (Classes 8–10) |
| `PARENT` | Parent/guardian of student |

---

## 2. Tech Stack

### Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 24.15.0 |
| Framework | NestJS | 11 |
| ORM | Prisma | 6.19.3 |
| Database | PostgreSQL | 18 |
| Auth | JWT (`@nestjs/jwt`) | 11 |
| Validation | Zod + custom pipe | 3.24 |
| API Docs | Swagger (`@nestjs/swagger`) | 11 |
| PDF | Playwright (HTML→PDF) | 1.52 |
| Excel | SheetJS (`xlsx`) | 0.18 |
| Tests | Vitest | 3.1 |

### Frontend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js (App Router) | 15.5 |
| Language | TypeScript | 5.7 |
| Styling | Tailwind CSS | 3.4 |
| UI Components | Radix UI primitives + custom shadcn/ui-style | — |
| State (server) | TanStack Query | 5.62 |
| State (client) | Zustand | 5.0 |
| Forms | React Hook Form | 7.54 |
| Validation | Zod | 3.24 |
| Icons | Lucide React | 0.468 |
| Animation | Framer Motion | 13.2 |
| Charts | Recharts | 3.10 |
| CSS Utility | `class-variance-authority` + `tailwind-merge` | — |

### Tooling
| Tool | Purpose |
|------|---------|
| pnpm 12.4.1 | Package manager |
| Turborepo | Monorepo build orchestration |
| TypeScript | Type checking across all packages |
| Playwright | Screenshots & future E2E |
| tsx | TypeScript execution for scripts |

---

## 3. Monorepo Structure

```
sanroaiapp/
├── apps/
│   ├── api/                  # NestJS backend (port 4000)
│   │   ├── src/
│   │   │   ├── auth/         # Auth module (login, register, JWT)
│   │   │   ├── curriculum/   # Boards, grades, subjects, chapters, topics, concepts
│   │   │   ├── questions/    # Question CRUD, AI generation
│   │   │   ├── papers/       # Paper generation, preview, PDF export
│   │   │   ├── assessments/  # Assessment CRUD, attempts, auto-grading
│   │   │   ├── diagnosis/    # Concept mastery, diagnostic results
│   │   │   ├── remediation/  # Remediation plans, content items
│   │   │   ├── dashboard/    # Per-role dashboard endpoints
│   │   │   ├── institutions/ # Tenant management
│   │   │   ├── people/       # Students, teachers, parents
│   │   │   ├── imports/      # Bulk Excel import
│   │   │   ├── ai/           # AI provider interface
│   │   │   ├── chat/         # Sanro AI chat
│   │   │   ├── content/      # Content items
│   │   │   ├── files/        # PDF file serving
│   │   │   └── admin/        # Platform admin
│   │   ├── prisma/
│   │   │   ├── schema.prisma # 1295-line schema
│   │   │   └── seed.ts       # Idempotent seed script
│   │   └── .env              # DATABASE_URL, JWT_SECRET, etc.
│   │
│   └── web/                  # Next.js frontend (port 3000)
│       ├── app/
│       │   ├── page.tsx              # Landing page
│       │   ├── login/                # Login page
│       │   ├── register/             # Institution registration
│       │   ├── (dashboard)/
│       │   │   ├── layout.tsx        # Dashboard layout (nav, auth)
│       │   │   └── app/
│       │   │       ├── page.tsx      # Dashboard home
│       │   │       ├── papers/       # Paper list, new, detail
│       │   │       ├── assessments/  # Assessment list, new, attempt, manage
│       │   │       └── remediation/  # Mastery & remediation
│       │   └── proxy/preview/[id]/   # Token-proxy for iframe preview
│       ├── components/ui/            # shadcn/ui-style components
│       └── lib/                      # API hooks, auth store, utilities
│
├── packages/
│   ├── types/                 # Shared TypeScript types (Role, etc.)
│   ├── validation/            # Shared Zod schemas (Login, Register, etc.)
│   └── config/                # Shared configuration
│
├── scripts/                   # Development scripts (screenshots, etc.)
├── screenshots/               # Page screenshots
└── docs/                      # Documentation
```

---

## 4. Getting Started

### Prerequisites
- Node.js v24+
- pnpm v12+
- PostgreSQL 18 (native, no Docker)

### Quick Start

```bash
# 1. Clone and install
cd D:\sanroaiapp
pnpm install

# 2. Set up database
pnpm --filter @sanro/api db:push        # Creates tables
pnpm --filter @sanro/api db:seed        # Seeds demo data

# 3. Start API (port 4000)
pnpm --filter @sanro/api start:dev

# 4. Start Web (port 3000)
pnpm --filter @sanro/web dev

# 5. Open browser
# Landing: http://localhost:3000
# Login:   http://localhost:3000/login
# API:     http://localhost:4000/api/v1/health
# Docs:    http://localhost:4000/docs
```

### Build Order (Important!)

Shared packages must be built before API/web:

```bash
pnpm --filter @sanro/types --filter @sanro/validation --filter @sanro/config build
pnpm --filter @sanro/api build
pnpm --filter @sanro/web build
# Or simply:
pnpm build  # Runs Turbo (5 tasks)
```

---

## 5. Environment Setup

### API (`apps/api/.env`)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sanro_dev
AUTH_SECRET=dev-secret-minimum-32-characters-long
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d
PORT=4000
NODE_ENV=development
```

**Security notes:**
- `AUTH_SECRET` must be at least 32 characters in production
- Production refuses dev defaults (starts with `dev-`)
- CORS locked to explicit origins in production
- Swagger disabled in production

### Web (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

---

## 6. Database

### Connection
- Host: `localhost:5432`
- User: `postgres`
- Password: `postgres`
- Databases: `sanro_dev` (development), `sanro_test` (testing)

### Key Enums

| Enum | Values |
|------|--------|
| `Role` | SUPER_ADMIN, INSTITUTION_ADMIN, TEACHER, STUDENT, PARENT |
| `InstitutionType` | SCHOOL, COACHING_CENTRE |
| `QuestionType` | MCQ, SHORT_ANSWER, LONG_ANSWER, VERY_SHORT_ANSWER, TRUE_FALSE, FILL_BLANK, MULTI_SELECT, NUMERICAL |
| `DifficultyLevel` | EASY, MEDIUM, HARD |
| `MasteryLevel` | NOT_STARTED, INSUFFICIENT_EVIDENCE, NEEDS_INTERVENTION, MASTERED |

### Key Models

- **User** → email, name, phone, auth fields (no `role` — role is on `InstitutionMember`)
- **InstitutionMember** → links User to Institution with a Role
- **Board** → CBSE, etc.
- **Grade** → linked to Board (8, 9, 10)
- **Subject** → Science, Maths (linked to Grade, no `grade` field on Subject)
- **Chapter** → linked to Subject (requires `code` + `grade`)
- **Topic** → linked to Chapter
- **Concept** → linked to Topic
- **Question** → stem, options (JSON), correct answer, type, difficulty, marks, content links
- **QuestionPaper** → title, distribution config, generated HTML, status
- **Assessment** → linked to paper or question list, published to groups
- **AssessmentAttempt** → student answers, score, auto-graded
- **DiagnosticResult** → per-attempt concept analysis
- **ConceptMastery** → student's mastery level per concept
- **RemediationPlan** → linked to concept, contains items (content/practice)

---

## 7. API Reference

### Base URL
```
http://localhost:4000/api/v1
```

### Response Format

**Success**: Payload returned directly (no envelope).
```json
{ "accessToken": "...", "user": { ... } }
```

**Error**:
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid input",
  "requestId": "abc-123",
  "statusCode": 400,
  "details": { ... }
}
```

**Health Check**:
```
GET /api/v1/health
→ { "status": "ok", "database": "connected", "timestamp": "...", "uptime": 123, "version": "0.1.0" }
```

### Endpoints by Module

#### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register-institution` | Register new institution + admin user |
| POST | `/auth/login` | Login (email + password) |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout (invalidate refresh token) |
| POST | `/auth/switch-context` | Switch institution context |
| POST | `/auth/change-password` | Change password |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| GET | `/auth/me` | Get current user info |

#### Curriculum
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/curriculum/boards` | List boards |
| GET | `/curriculum/grades` | List grades (filter by board) |
| GET | `/curriculum/subjects` | List subjects (filter by grade) |
| GET | `/curriculum/chapters` | List chapters (filter by subject) |
| GET | `/curriculum/topics` | List topics |
| GET | `/curriculum/concepts` | List concepts |
| GET | `/curriculum/tree` | Full curriculum tree |

#### Questions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/questions` | List questions (filter by subject, type, difficulty, etc.) |
| GET | `/questions/:id` | Get question detail |
| POST | `/questions` | Create question |
| PATCH | `/questions/:id` | Update question |
| POST | `/questions/:id/review` | Approve/reject AI question |
| POST | `/questions/ai-generate` | Generate questions with AI |

#### Papers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/papers` | List papers |
| POST | `/papers` | Generate new paper |
| GET | `/papers/:id` | Get paper detail |
| POST | `/papers/:id/duplicate` | Duplicate paper |
| POST | `/papers/:id/regenerate` | Regenerate paper |
| GET | `/papers/:id/validate` | Validate paper |
| GET | `/papers/:id/preview` | Get HTML preview |
| POST | `/papers/:id/export` | Export as PDF |
| PATCH | `/papers/:id/status` | Update paper status |

#### Assessments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/assessments` | List all assessments |
| GET | `/assessments/my` | List student's assessments |
| POST | `/assessments` | Create assessment |
| GET | `/assessments/:id` | Get assessment detail |
| POST | `/assessments/:id/publish` | Publish to groups |
| POST | `/assessments/:id/start` | Start attempt |
| POST | `/assessments/attempts/:attemptId/answers` | Save answers |
| POST | `/assessments/attempts/:attemptId/submit` | Submit attempt (auto-grade) |
| GET | `/assessments/attempts/:attemptId` | Get attempt result |

#### Diagnosis
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/diagnosis/my` | My diagnostic results |
| GET | `/diagnosis/students/:studentId` | Student diagnostics (teacher) |

#### Remediation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/remediation/my` | My remediation plans |
| GET | `/remediation/plans` | All plans |
| GET | `/remediation/weak` | Weak concepts |
| POST | `/remediation/items/:id/status` | Mark item complete |
| POST | `/remediation/retest` | Request retest |

#### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/student` | Student dashboard data |
| GET | `/dashboard/teacher` | Teacher dashboard data |
| GET | `/dashboard/institution` | Institution admin dashboard |
| GET | `/dashboard/parent` | Parent dashboard data |
| GET | `/dashboard/super-admin` | Super admin dashboard |

#### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/imports/upload` | Bulk import Excel |
| GET | `/imports` | List import jobs |
| POST | `/imports/:jobId/commit` | Commit import |
| POST | `/chat/ask-sanro` | Ask Sanro AI chatbot |
| POST | `/ai/explain` | AI explanation |
| POST | `/ai/chat` | AI chat |

---

## 8. Web App (Frontend)

### Pages & Routes

| Route | Page | Auth Required | Role |
|-------|------|:---:|------|
| `/` | Landing page | No | — |
| `/login` | Login | No | — |
| `/register` | Institution registration | No | — |
| `/app` | Dashboard home | Yes | All |
| `/app/papers` | Question papers list | Yes | Teacher/Admin |
| `/app/papers/new` | Generate paper | Yes | Teacher/Admin |
| `/app/papers/[id]` | Paper detail + preview | Yes | Teacher/Admin |
| `/app/assessments` | My assessments | Yes | All |
| `/app/assessments/new` | Create assessment | Yes | Teacher/Admin |
| `/app/assessments/[id]/manage` | Manage assessment | Yes | Teacher/Admin |
| `/app/assessments/attempt/[attemptId]` | Take attempt | Yes | Student |
| `/app/remediation` | Mastery & remediation | Yes | Student |
| `/proxy/preview/[id]` | Paper preview proxy | Yes | Teacher/Admin |

### Key Libraries

- **TanStack Query**: All server state (useBoards, useGrades, useSubjects, usePapers, etc.)
- **Zustand**: Client auth state (persisted to localStorage as `sanro-auth`)
- **React Hook Form + Zod**: All form validation
- **Radix UI**: Accessible primitives (Dialog, Select, Tabs, Progress, etc.)

### Component Library (`components/ui/`)

| Component | File | Description |
|-----------|------|-------------|
| Button | `button.tsx` | Variants: default, destructive, outline, secondary, ghost, link, gradient, success, warning |
| Card | `card.tsx` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| Input | `input.tsx` | Styled input with icon support |
| Label | `label.tsx` | Form label |
| Badge | `badge.tsx` | Status badges (default, success, warning, purple, pink) |
| Progress | `progress.tsx` | Progress bar with gradient |
| Avatar | `avatar.tsx` | User avatar with fallback |
| Select | `select.tsx` | Dropdown select (Radix) |
| Textarea | `textarea.tsx` | Multi-line input |
| Tabs | `tabs.tsx` | Tab navigation (Radix) |
| Separator | `separator.tsx` | Visual divider |
| ScrollArea | `scroll-area.tsx` | Custom scrollbar |
| Tooltip | `tooltip.tsx` | Hover tooltip |
| Dialog | `dialog.tsx` | Modal dialog |
| DropdownMenu | `dropdown-menu.tsx` | Action menu |

### Auth Store (Zustand)

```typescript
// Storage key: 'sanro-auth'
// Structure: { state: { token, refreshToken, user }, version: 0 }
// Hydration tracked via _hasHydrated flag

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      _hasHydrated: false,
      setSession: (resp) => set({ ... }),
      clearSession: () => set({ ... }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'sanro-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ token: s.token, refreshToken: s.refreshToken, user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
```

### API Hooks (`lib/api-hooks.ts`)

| Hook | Query Key | Fetches |
|------|-----------|---------|
| `useBoards()` | `curriculum.boards` | GET `/curriculum/boards` |
| `useGrades(boardId?)` | `curriculum.grades` | GET `/curriculum/grades?boardId=...` |
| `useSubjects(gradeId?)` | `curriculum.subjects` | GET `/curriculum/subjects?gradeId=...` |
| `usePapers()` | `papers` | GET `/papers` |
| `usePaper(id)` | `papers.id` | GET `/papers/:id` |
| `useMyAssessments()` | `assessments.my` | GET `/assessments/my` |
| `useAssessments()` | `assessments` | GET `/assessments` |
| `useAttempt(id)` | `assessments.attempts` | GET `/assessments/attempts/:id` |
| `useGroups()` | `academics.groups` | GET `/academics/groups` |
| `useRemediationMy()` | `remediation.my` | GET `/remediation/my` |
| `useDiagnosisMy()` | `diagnosis.my` | GET `/diagnosis/my` |

---

## 9. Authentication & Authorization

### Flow

1. **Register**: `POST /auth/register-institution` → creates institution + admin user → returns JWT
2. **Login**: `POST /auth/login` → validates credentials → returns JWT + refresh token
3. **Token**: JWT contains `sub` (user ID), `role`, `institutionId`, `name`, `email`
4. **Refresh**: `POST /auth/refresh` → validates refresh token → new access token
5. **Guard**: `@nestjs/jwt` guard protects routes; `@Roles()` decorator restricts by role

### JWT Payload

```json
{
  "sub": "user-uuid",
  "role": "STUDENT",
  "institutionId": "institution-uuid",
  "name": "Aarav Sharma",
  "email": "student@sanroai.com",
  "iat": 1789439206,
  "exp": 1790044006,
  "aud": "sanro-app",
  "iss": "sanro-api"
}
```

### Multi-Tenancy

- All data is scoped to `institutionId`
- Users can belong to multiple institutions via `InstitutionMember`
- `switch-context` endpoint changes active institution

---

## 10. Core Features

### 10.1 Question Paper Generator

**Flow**: Board → Grade → Subject → Distribution (MCQ/SHORT/LONG counts × marks) → Generate

**Distribution Mapping**:
| UI Key | Prisma Enum | Default Marks |
|--------|-------------|---------------|
| `MCQ` | `MCQ` | 1 |
| `SHORT` | `SHORT_ANSWER` | 2 |
| `LONG` | `LONG_ANSWER` | 5 |

**Validation**: Total marks = Σ(count × marks_per_question). Paper must have at least 1 question per type.

**Output**: HTML preview (renderable in iframe via proxy route), PDF export via Playwright.

### 10.2 Assessment System

**Flow**: Create assessment (from paper or question list) → Publish to groups → Students start attempts → Save answers → Submit → Auto-grade

**Auto-Grading**: MCQ/TRUE_FALSE/FILL_BLANK graded automatically on submit. SHORT/LONG answers require manual review.

**Attempt States**: `IN_PROGRESS` → `SUBMITTED` → `GRADED`

### 10.3 Mastery Diagnosis

After each attempt submission:
1. **DiagnosticResult** created — per-question concept mapping
2. **ConceptMastery** updated — mastery level recalculated
3. **RemediationPlan** created — for weak concepts (mastery < 50%)

**Mastery Levels**:
- `NOT_STARTED` — No attempts yet
- `INSUFFICIENT_EVIDENCE` — < 3 attempts
- `NEEDS_INTERVENTION` — Mastery < 50%
- `MASTERED` — Mastery ≥ 80%

### 10.4 Gamification

- **XP**: Earned per assessment completion (base + bonus for accuracy)
- **Streaks**: Consecutive daily activity
- **Badges**: Milestone achievements (first attempt, 100% score, streak milestones)
- **Leaderboard**: Class/institution ranking

---

## 11. Design System

### Color Palette

| Token | Color | Usage |
|-------|-------|-------|
| `brand-500` | `#8b5cf6` | Primary purple |
| `brand-600` | `#7c3aed` | Primary dark |
| `brand-700` | `#6d28d9` | Primary darker |
| `surface-50` | `#fafafa` | Background |
| `surface-100` | `#f4f4f5` | Card backgrounds |
| `surface-200` | `#e4e4e7` | Borders |
| `surface-900` | `#18181b` | Primary text |

### Typography

- **Body**: Inter (system-ui fallback)
- **Headings**: Poppins
- **Code**: JetBrains Mono

### Border Radius

Cards use `rounded-2xl` (1rem) or `rounded-3xl` (1.5rem). Buttons use `rounded-xl`.

### Shadows

- `shadow-card`: `0 4px 6px -1px rgba(0,0,0,0.1)`
- `shadow-card-hover`: `0 10px 15px -3px rgba(0,0,0,0.1)`

### Animations

- `animate-float`: Floating effect (3s infinite)
- `animate-glow`: Purple glow pulse (2s infinite)
- `animate-shimmer`: Loading shimmer (2s linear infinite)

---

## 12. Seed Data & Demo Users

### Running the Seed

```bash
pnpm --filter @sanro/api db:seed
```

The seed is **idempotent** — safe to run multiple times.

### Demo Users

| Email | Password | Role | Name |
|-------|----------|------|------|
| `admin@sanroai.com` | `Sanro@123` | SUPER_ADMIN | Platform Admin |
| `principal@sanroai.com` | `Sanro@123` | INSTITUTION_ADMIN | Institution Admin |
| `teacher@sanroai.com` | `Sanro@123` | TEACHER | Teacher |
| `student@sanroai.com` | `Sanro@123` | STUDENT | Aarav Sharma |
| `parent@sanroai.com` | `Sanro@123` | PARENT | Parent |

### Seed IDs

| Entity | ID |
|--------|-----|
| Board (CBSE) | *(auto-generated)* |
| Science Subject | *(auto-generated)* |
| Class 8-A Group | *(auto-generated)* |

### Seed Content

- CBSE Board, Classes 1–10
- Science + Maths subjects
- 135+ content items with YouTube URLs + markdown notes
- 45+ questions with concept links
- 8 achievements, gamification profile (285 XP, 5-day streak)
- Demo institution with plan & subscription
- Class 8-A group with students

---

## 13. Development Workflow

### Starting Services

```bash
# Terminal 1: API
pnpm --filter @sanro/api start:dev

# Terminal 2: Web
pnpm --filter @sanro/web dev

# Or both in background:
Start-Process powershell -ArgumentList "-NoProfile -Command cd D:\sanroaiapp; pnpm --filter @sanro/api start:dev" -WindowStyle Minimized
Start-Process powershell -ArgumentList "-NoProfile -Command cd D:\sanroaiapp; pnpm --filter @sanro/web dev" -WindowStyle Minimized
```

### Type Checking

```bash
pnpm -r typecheck          # All packages
pnpm --filter @sanro/api typecheck
pnpm --filter @sanro/web typecheck
```

### Testing

```bash
pnpm --filter @sanro/api test    # Vitest (8/8 passing)
```

### Screenshots

```bash
npx tsx scripts/screenshots.mts
```

Requires API on :4000 and Web on :3000. Captures all 9 pages.

---

## 14. Build & Deploy

### Full Build

```bash
pnpm build    # Turbo: types → validation → config → api → web
```

### Production Web

```bash
pnpm --filter @sanro/web build
pnpm --filter @sanro/web start    # Runs on port 3000
```

### Database Migration

```bash
# Development
pnpm --filter @sanro/api db:push

# Production
pnpm --filter @sanro/api db:migrate:prod
```

---

## 15. Known Issues & Fixes

| Issue | Status | Fix |
|-------|--------|-----|
| Stale Prisma client errors | ✅ Fixed | Regenerate client, proper DI |
| `papers.pickQuestions` difficulty over-filtering | ✅ Fixed | Made difficulty filter optional |
| `assessments.startAttempt` missing `attemptId` | ✅ Fixed | Return `{ attemptId }` at top level |
| Paper distribution key mismatch (`SHORT` vs `SHORT_ANSWER`) | ✅ Fixed | `mapQuestionType()` in `papers.service.ts` |
| `border-border` CSS class missing | ✅ Fixed | Removed shadcn CSS variables, use Tailwind config colors |
| Zustand hydration race condition | ✅ Fixed | Added `_hasHydrated` flag, dashboard waits for hydration |
| "signal is aborted without reason" error banner | ⚠️ Minor | AbortController cleanup on dashboard fetch |
| Missing `FileText` import in dashboard | ✅ Fixed | Added to import list |
| Web dashboard dead links (12 buttons) | ✅ Fixed | All buttons point to correct routes |
| CORS wildcard in production | ✅ Fixed | Explicit origins only: sanroai.com, app.sanroai.com |
| JWT secret accepts weak defaults in production | ✅ Fixed | Min 32 chars, production guardrail |
| Forgot-password returns raw token | ✅ Fixed | Returns `{ success: true }` only |
| Zod validation missing on mutation endpoints | ✅ Fixed | 13+ endpoints wired with ZodValidationPipe |
| No RBAC on mutation endpoints | ✅ Fixed | @Roles() added to all mutation controllers |
| Rate limiting missing on auth endpoints | ✅ Fixed | Auth-specific throttling (login 10/min, forgot 3/min) |
| File upload unlimited | ✅ Fixed | 10MB limit + MIME validation on imports |
| Swagger exposed in production | ✅ Fixed | Gated behind NODE_ENV !== 'production' |
| Mobile memberships lost on restart | ✅ Fixed | Persisted to SecureStore |
| Mobile SafeAreaProvider missing | ✅ Fixed | Added for notch/Dynamic Island |
| Mobile no error boundary | ✅ Fixed | ErrorBoundary wraps app root |
| Duplicate config factory | ✅ Fixed | Removed, single source of truth via Zod schema |

---

## 16. Future Roadmap

### Phase 1: Web Feature Completion
- [ ] Teacher: per-assessment attempts view + manual grading
- [ ] Super admin dashboard
- [ ] Bulk import UI
- [ ] Question bank review UI

### Phase 2: Mobile App (In Progress)
- [x] Expo React Native app (Android-first)
- [x] Multi-role tabs (student/teacher/parent/admin)
- [x] Learn flow (6 modes)
- [x] Assessment attempt + result
- [x] SafeAreaProvider
- [x] Memberships persistence (SecureStore)
- [x] ErrorBoundary
- [ ] Push notifications
- [ ] Profile editing
- [ ] Settings

### Phase 3: Shared Packages
- [ ] Extract `packages/ui` (Sanro UI kit)
- [ ] Unified Tailwind presets
- [ ] OpenAPI TypeScript codegen

### Phase 4: Quality & Scale
- [ ] Playwright E2E tests
- [ ] CI/CD pipeline
- [ ] Redis + BullMQ for job queues
- [ ] pgvector for semantic search
- [ ] AIProvider real backend (GPT/Claude)

### Phase 5: Products
- [ ] PDF export hardening (needs Chromium container or pdf-lib)
- [ ] Notifications UI
- [ ] Seat/plan enforcement
- [ ] Analytics dashboards

---

## 17. Mobile App (Expo)

### Stack
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React Native | 0.76.5 |
| SDK | Expo | 52 |
| Router | expo-router | 4 |
| State | Zustand + TanStack Query | 5.x |
| Auth | expo-secure-store | — |

### Role-Specific Tabs
- **Student**: Home, Learn, Practice, Tests, Me
- **Teacher/Admin**: Home, Classes, Assessments, Me
- **Parent**: Home, Children, Me

### Key Screens
- Home: Role-specific content (student: XP/streak/mastery, teacher: quick actions + groups, parent: children)
- Learn flow: Board → Grade → Subject → Chapter → Concept
- 6-mode concept detail: Learn, Practice, Quick Quiz, Flashcards, Challenge, Ask SANRO
- Assessment attempt with 15s autosave + result review
- Leaderboard

### Safety
- SafeAreaProvider for notch/Dynamic Island
- Memberships persisted to SecureStore
- ErrorBoundary wrapping app root

---

## 18. Screenshots

Screenshots are saved in `screenshots/` after running `npx tsx scripts/screenshots.mts`.

| Screenshot | Description |
|-----------|-------------|
| `01-landing.png` | Landing page with hero, features, pricing, testimonials |
| `02-login.png` | Login with split layout |
| `03-register.png` | Institution registration |
| `04-dashboard-student.png` | Student dashboard with gamification cards |
| `05-papers.png` | Question papers list |
| `06-papers-new.png` | Paper generation form |
| `07-assessments.png` | My assessments list |
| `08-assessments-new.png` | Create assessment form |
| `09-remediation.png` | Mastery & remediation page |
