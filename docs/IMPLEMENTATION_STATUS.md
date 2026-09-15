# Implementation Status

> Last updated: 2026-09-16 (Session 11 — Mobile release build, quiz/challenge scoring, offline login, branded app icon)
> Audit: Full codebase review against Sanro AI Product Specification

---

## Status Legend

| Status | Meaning |
|--------|---------|
| ✅ DONE | Fully implemented and working |
| 🔧 PARTIAL | Backend exists, frontend incomplete or vice versa |
| 🚫 MISSING | Not implemented |
| 🐛 BROKEN | Exists but has bugs |
| 🔒 BLOCKED | Depends on unfinished prerequisite |

---

## Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| Typecheck | ✅ | 0 errors across all packages (incl. mobile) |
| Build | ✅ | `pnpm build` 6/6 tasks, 23 web routes |
| Tests | ✅ | 11/11 Vitest (mastery.service + learning.service) |
| Token refresh | ✅ | Auto-refresh on 401, singleton promise, store update |
| Board | ✅ | CBSE (Classes 1-10) |
| Content | ✅ | 135+ content items with YouTube URLs + markdown notes |
| Achievements | ✅ | 8 seeded, gamification profile (285 XP, 5-day streak) |
| Screenshots | ✅ | 26 pages captured |

---

## Feature Status Table

### P0 — MUST WORK

| # | Feature | Backend | Frontend | Database | Status |
|---|---------|:-------:|:--------:|:--------:|--------|
| 1 | Authentication (JWT) | ✅ | ✅ | ✅ | ✅ DONE |
| 2 | Multi-tenancy | ✅ | ✅ | ✅ | ✅ DONE |
| 3 | Institution setup | ✅ | ✅ | ✅ | ✅ DONE |
| 4 | Students (CRUD) | ✅ | ✅ | ✅ | ✅ DONE |
| 5 | Teachers (CRUD) | ✅ | ✅ | ✅ | ✅ DONE |
| 6 | Groups/classes | ✅ | 🚫 | ✅ | 🔧 PARTIAL |
| 7 | Curriculum hierarchy | ✅ | ✅ | ✅ | ✅ DONE |
| 8 | Class-wise learning (1-10) | ✅ | ✅ | ✅ | ✅ DONE |
| 9 | Content system | ✅ | ✅ | ✅ | ✅ DONE |
| 10 | Question bank | ✅ | ✅ | ✅ | ✅ DONE |
| 11 | Question paper generator | ✅ | ✅ | ✅ | ✅ DONE |
| 12 | Assessments | ✅ | ✅ | ✅ | ✅ DONE |
| 13 | Attempts (start/save/submit) | ✅ | ✅ | ✅ | ✅ DONE |
| 14 | Scoring (auto-grade) | ✅ | ✅ | ✅ | ✅ DONE |
| 15 | Diagnosis | ✅ | ✅ | ✅ | ✅ DONE |
| 16 | Mastery | ✅ | ✅ | ✅ | ✅ DONE |
| 17 | Remediation | ✅ | ✅ | ✅ | ✅ DONE |
| 18 | Practice mode | ✅ | ✅ | ✅ | ✅ DONE |
| 19 | Retest | ✅ | ✅ | ✅ | ✅ DONE |
| 20 | Teacher dashboard | ✅ | ✅ | ✅ | ✅ DONE |
| 21 | Parent basics | ✅ | ✅ | ✅ | ✅ DONE |
| 22 | Bulk student import | ✅ | ✅ | ✅ | ✅ DONE |
| 23 | Mobile app (Expo/RN) | ✅ | ✅ | — | ✅ DONE |

### P1

| # | Feature | Backend | Frontend | Database | Status |
|---|---------|:-------:|:--------:|:--------:|--------|
| 23 | Ask Sanro (AI tutor) | ✅ | ✅ | ✅ | ✅ DONE |
| 24 | Quizzes | ✅ | ✅ | ✅ | ✅ DONE |
| 25 | Gamification | ✅ | ✅ | ✅ | ✅ DONE |
| 26 | Quick Quiz (per concept) | — | ✅ | — | ✅ DONE |
| 27 | Flashcards | — | ✅ | — | ✅ DONE |
| 28 | Timed Challenge | — | ✅ | — | ✅ DONE |
| 29 | Reports | 🚫 | 🚫 | ✅ | 🚫 MISSING |
| 30 | Notifications | 🔧 | 🚫 | ✅ | 🔧 PARTIAL |
| 31 | Content management | 🔧 | 🚫 | ✅ | 🔧 PARTIAL |
| 32 | Analytics | 🚫 | 🚫 | 🔧 | 🚫 MISSING |
| 33 | 3D/AR viewer | 🚫 | 🚫 | — | 🚫 MISSING |

### P2

| # | Feature | Backend | Frontend | Database | Status |
|---|---------|:-------:|:--------:|:--------:|--------|
| 34 | Adaptive testing | 🚫 | 🚫 | — | 🚫 MISSING |
| 35 | Video timestamps | 🚫 | 🚫 | — | 🚫 MISSING |
| 36 | OCR/OMR | 🚫 | 🚫 | — | 🚫 MISSING |
| 37 | WhatsApp | 🚫 | 🚫 | — | 🚫 MISSING |
| 38 | iOS | 🚫 | 🚫 | — | 🚫 MISSING |

---

## Concept Detail Page — 6 Learning Modes

| Tab | Feature | Implementation |
|-----|---------|----------------|
| **Learn** | Video lessons (YouTube embeds) + Study notes (markdown) + Quick revision card | Real content from seed |
| **Practice** | Backend-driven quiz with mastery tracking, retest for weak concepts, "Fix This" CTA for weak mastery | `POST /learning/practice/start` |
| **Quick Quiz** | 5 concept-specific questions from DB, submit, score, +25 XP | Concept questions from `practiceQuestions` |
| **Flashcards** | Concept questions with flip + confidence rating (Again/Hard/Good/Easy) | Concept questions from `practiceQuestions` |
| **Challenge** | Timed 60s challenge, 10 questions, 50 XP max, beat-your-best scoring | Redirects to practice mode |
| **Ask SANRO** | Context-aware suggested questions → AI chat with curriculum grounding | Links to `/app/chat` |

---

## Student Dashboard — "What should I do today?"

| Section | Purpose |
|---------|---------|
| **Your Focus Today** | Weak concept "Fix This" CTA + upcoming assessment "Prepare" |
| **Progress Summary** | XP, Streak, Mastery as compact cards |
| **Continue Learning** | Browse All Subjects link |
| **Pending Assessments** | Start button per assessment |
| **Recent Activity** | Score badges (green ≥80%, amber ≥50%, red <50%) |

---

## Product Principle

SANRO is NOT a content library. It is an academic intelligence platform that converts assessment data into specific learning interventions and measurable improvement.

**Core loop**: ASSESS → DIAGNOSE → FIX → RETEST → IMPROVE
**Student journey**: TODAY → DO THIS → IMPROVE

---

## CBSE Curriculum Coverage

### Class 10 (Priority — Most Content)
- **Science**: 13 chapters (Chemical Reactions, Acids/Bases, Metals, Carbon, Life Processes, Control/Coordination, Reproduction, Heredity, Light, Human Eye, Electricity, Magnetic Effects, Environment)
- **Mathematics**: 15 chapters (Real Numbers, Polynomials, Linear Equations, Quadratics, AP, Triangles, Coordinate Geometry, Trigonometry, Applications, Circles, Constructions, Areas, Surface Areas, Statistics, Probability)
- **Content**: 48 items (videos + notes)

### Class 9
- **Science**: 4 chapters (Matter, Atoms, Structure, Force)
- **Mathematics**: 4 chapters (Number Systems, Polynomials, Linear Equations, Geometry)
- **Content**: 34 items

### Class 8
- **Science**: 3 chapters (Materials, Matter, Motion)
- **Mathematics**: 3 chapters (Numbers, Indices, Equations)
- **Content**: 53 items (richest with real YouTube URLs + markdown notes)

### Classes 1-7
- **Curriculum structure**: 2-3 chapters each for Science and Math
- **Content items**: Structure ready, awaiting content population

---

## Design Language

- **Logo**: GraduationCap icon (purple gradient)
- **Primary**: Purple/violet (#7c3aed)
- **Cards**: Rounded 2xl/3xl, soft shadows, gradient accents
- **Typography**: Poppins headings, Inter body
- **Navigation**: Sticky glass header, role-based tabs
- **Stats**: 5000+ Video Lessons, 100% Board Mapped, 5★ Student Rating

---

## Changelog

### Session 11 (2026-09-16)
- **Android release build unblocked**: pnpm symlink made `expo-modules-autolinking` unresolvable from `apps/mobile/node_modules/expo`, so `loadConfigAsync` returned null and the resolver fell back to `expo.core.ExpoModulesPackage` (wrong class). Added `expo-modules-autolinking@2.0.8` devDep to `apps/mobile/package.json`, purged `android/build/generated/autolinking`, regenerated → correct `expo.modules.ExpoModulesPackage`. `assembleRelease` succeeds → `app-release.apk` (74 MB).
- **Quiz + Challenge server-graded**: `quiz/[conceptId].tsx` and `challenge/[conceptId].tsx` rewritten to the practice flow (`/learning/practice/start|answer|submit`). Quiz shows real `correctAnswers/totalQuestions`; challenge XP = round(correct/total × 50). No more local correct-matching.
- **"Ask SANRO" naming standardized** (never "Ask AI") across mobile concept/ask/_layout, web concept page/chat/sidebar, `AGENTS.md`, and `docs/IMPLEMENTATION_STATUS.md`.
- **Quick Revision concept-aware**: web + mobile concept pages show `concept.description` + up to 4 note titles (tappable/Read) + video badges; `description?: string` added to `ConceptDetail` in mobile + web hooks.
- **Offline login (mobile)**: new `lib/offline-auth.ts` + `lib/sha256.ts` (verified vs RFC vectors). Successful logins cache a SHA-256-hashed credential + full session in SecureStore; login/register now fall back to the vault when the network is unreachable (`isNetworkError`), restoring the cached session with an offline banner.
- **Branded app icon + splash (mobile)**: generated `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash-icon.png` (purple gradient + white graduation cap) with sharp; wired into `app.json`; regenerated Android `ic_launcher.webp`/`ic_launcher_round.webp` (all densities) + `splashscreen_logo.png`; splash background → `#7c3aed`.
- **Deployment prep**: API `CORS_ORIGINS` env (comma-separated allowlist, empty = allow all in dev); mobile API base now reads `EXPO_PUBLIC_API_URL`; `.env.example` for api, web, mobile.
- **Verification**: `pnpm -r typecheck` ✓ (all packages), `pnpm build` ✓ 6/6, API tests ✓ 11/11.

### Session 10 (2026-09-15)
- **Mobile app scaffolded** (`apps/mobile/`): Expo SDK 52 + React Native 0.76.5 + expo-router 4 + TypeScript strict + Zod + Zustand + TanStack Query 5
- **Mobile theme + foundation**: `constants/theme.ts` (purple #7c3aed brand tokens), Zustand auth store on expo-secure-store (`sanro-token`/`sanro-refresh`/`sanro-user`), API client with auto token refresh, query provider
- **Mobile screens**: Auth (login/register), 5-tab shell (Home/Learn/Practice/Tests/Me), learn flow (board→grade→subject→chapter→concept), 6-mode concept detail (Learn/Practice/Quick Quiz/Flashcards/Challenge/Ask SANRO), assessment attempt with 15s autosave + result review, practice, quiz, flashcards, challenge (60s timer), ask SANRO, leaderboard
- **Mobile components**: Card, Button, Progress, AchievementIcon, EmptyState, QuizQuestion
- **Assessment answers**: Mobile uses batch endpoint `POST /assessments/attempts/:attemptId/answers`
- **Typecheck monorepo fix**: `@sanro/web` failed after mobile joined the workspace — pnpm hoists `@types/react@18.3.31` (react-native peer) to the virtual store root, which TS resolves for next's internal styled-jsx types while web source uses `@types/react@19.0.14`, producing two React type identities. Fixed by pinning web's `@types/react`/`@types/react-dom` to `~19.0.x` and remapping `react`/`react-dom`/`jsx-runtime` via `paths` in `apps/web/tsconfig.json`
- **Turbo**: Added `@sanro/mobile#build` stub (Expo runtime, no build step) with empty `outputs`
- **Root `pnpm typecheck`**: 9/9 tasks green. **`pnpm build`**: 6/6 tasks green.
- **Mobile offline handling**: Persistent request queue (`lib/offline.ts`) backed by AsyncStorage with Zustand, `flushOfflineQueue` on app foreground + 30s interval, offline banner in attempt + practice screens
- **Attempt resilience**: Draft answers persisted to AsyncStorage on every change, restored on mount, cleared on submit — survives app kill
- **Practice answer persistence bug fix**: Mobile practice screen never called `savePracticeAnswer` per question, so server scored all submissions 0/total. Now calls `useSavePracticeAnswer` on each select (offline-queued)
- **Network error safety**: `refreshAccessToken` no longer logs out user on network failure

### Session 9 (2026-09-15)
- **Paper export**: Download PDF + Answer Key + Print buttons on paper detail page (via `POST /papers/:id/export`)
- **Navigation redesign**: Staff users get dropdown menus for "People" (Students, Teachers, Parents, Import) and "Content" (New Paper, Questions). Students keep flat nav.
- **Achievement icons**: Mapped icon name strings (brain, flame, star, etc.) to actual Lucide React icons
- **Bug fix**: `/students` endpoint 500 error — teacher with no groups caused invalid UUID `['none']` in Prisma query. Fixed with early return for empty groups.
- **Error visibility**: Exception filter now shows real error messages in development mode

### Session 8 (2026-09-15)
- **CRITICAL FIX**: Quick Quiz now uses concept-specific questions from DB (was hardcoded mock questions unrelated to concept)
- **CRITICAL FIX**: Flashcards now use concept questions (was generic mock flashcards)
- **Flashcard confidence rating**: After flipping, students rate "Again / Hard / Good / Easy"
- **Student dashboard**: Rebuilt as "What should I do today?" focus-driven UX
  - "Your Focus Today" section with weak concept Fix This CTA + upcoming assessment
  - Progress summary (XP, Streak, Mastery) as compact cards
  - Continue Learning → Browse All Subjects
  - Pending Assessments with Start button
  - Recent Activity with score badges
- **Concept page**: "Fix Weakness" CTA card appears when mastery is WEAK/NEEDS_INTERVENTION
- **Chapter page**: "0/0 lessons" now shows "Coming soon" instead
- **Learn home**: Empty grades (no content) are hidden from student view
- **Learn home**: Grade headers now show numbered badge + "Class X" instead of small uppercase text
- **Learn home**: Summary line shows "3 classes · 6 subjects available"
- **Subject cards**: Improved hover effects, border transitions, subtle mastery row background

### Session 7 (2026-09-15)
- **Brand name**: All "SANRO AI" → "Sanro AI" (title case, not all caps)
- **Email domain**: All demo users now use `@sanroai.com` (was `@sanro.tech`, `@demo.sanro`)
- **Learning controller**: Removed `@Roles('STUDENT')` from read-only endpoints
- **Grades API**: `/curriculum/grades` now returns `string[]` (just grade names) instead of full Grade objects
- **DB reset**: Fresh schema push + seed with all fixes applied
- **Logo**: GraduationCap icon across all pages (replaced Sparkles)
- **Remediation icon**: Sparkles → Lightbulb
- **AI tutor icon**: Sparkles → Brain

### Session 6 (2026-09-15)
- **CBSE Board**: Replaced Maharashtra State Board with CBSE
- **Classes 1-10**: Full curriculum structure for all classes
- **Class 10 content**: 13 Science + 15 Math chapters, 48 content items
- **Class 9 content**: 4 + 4 chapters, 34 content items
- **Concept detail redesign**: 6-tab interface (Learn, Practice, Quick Quiz, Flashcards, Challenge, Ask SANRO)
- **Quick Quiz fix**: Unique options per question (was showing same answer for all)
- **Database reset**: Fresh seed with CBSE data, 8 achievements, gamification profile

### Session 5 (2026-09-15)
- Logo rebrand: Sparkles → GraduationCap
- Stats update: Market stats → Product stats
- Parents bugfix: optional chaining for `parent.children.length`
- Seed enrichment: 8 achievements, 24 YouTube URLs, 12 markdown notes

### Session 4 (2026-09-15)
- Content viewer dialog, Gamification pages, AI tutor chat
- Token refresh on 401, Bulk import UI

### Session 3 (2026-09-15)
- Practice mode, Retest, Question bank UI
- Teacher/Parent dashboard, People management pages

### Session 2 (2026-09-15)
- Class-wise learning path, Dashboard redesign
- 14 shadcn/ui components, Landing page

### Session 1 (2026-09-15)
- Full codebase audit, Bug fixes, Build stabilization

---

## Known Bugs

| Bug | Severity | Location | Description |
|-----|----------|----------|-------------|
| Route ordering | HIGH | `assessments.controller.ts` | `/assessments/my` matched by `/:id` wildcard |
| Duplicate chat endpoints | LOW | `ai.controller.ts` + `chat.controller.ts` | `/ai/chat` and `/chat/ask-sanro` identical |
| Missing Zod validation | MEDIUM | Most controllers | Body accepted as `unknown` with unsafe cast |
| Achievement icon display | LOW | `gamification/page.tsx` | Icon names shown as text, not mapped to Lucide icons |

---

## Next Steps

### Product Audit Priority Order (from Session 8 audit)

1. **Fix content/question correctness** — DONE (Session 8: Quick Quiz + Flashcards now use concept-specific questions)
2. **Make student UX extremely simple** — DONE (Session 8: Focus-driven dashboard)
3. **Make "Fix My Weakness" exceptional** — DONE (Session 8: Fix Weakness CTA everywhere)
4. **Make teacher intervention one-click** — NEXT: Teacher dashboard shows weak concepts + "Assign Fix" CTA
5. **Make Question Paper Generator excellent** — 4-step wizard with AI generation + PDF preview
6. **Add parent experience** — Simple "Is my child improving?" view
7. **Add mobile** — DONE (Session 10: Expo app scaffolded with auth, learn, practice, tests, gamification screens)
8. **Expand AI/3D/games** — RAG with pgvector, Three.js models

### Quick Wins
1. Map achievement icon names to Lucide icons
2. Add role-based route guards (frontend)
3. Add error boundaries per page
4. Add loading skeletons

### Medium
5. Populate content for Classes 1-7
6. Reports & analytics pages
7. Notification system
8. Content management UI for teachers
9. Teacher dashboard: "Which students need help?" + one-click remediation
10. Question Paper Generator: 4-step wizard + PDF preview + answer key

### Large
11. Adaptive testing
12. Video timestamp tracking
13. 3D/AR viewer
14. Parent dashboard
15. AI/RAG with pgvector for curriculum-grounded responses
