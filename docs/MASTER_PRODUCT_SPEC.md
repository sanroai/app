# SANRO AI — Master Product Specification

Version: 1.0
Date: 2026-09-17
Status: RATIFIED — this is the single master source of truth.
Feature status: sections 38–45 ratified as IMPLEMENTED on 2026-09-20 (super-admin
institution management + subscription/validity/access-control/limits/expiry); the
remaining contract surfaces listed in those sections are marked accordingly.

Morale rule: whenever architecture, features, workflows, roles, data models,
UX rules or important decisions change, UPDATE THIS DOCUMENT first, then update
implementation and docs/REBUILD_PROGRESS.md.

---

## 1. Product Identity

**SANRO AI** is an Academic Assessment, Diagnosis and Remediation Platform with
a traditional academic learning library, for Indian schools (CBSE, Classes
1–10, Science + Mathematics).

Two primary product paths:

- **PATH A — LEARN**: a premium, structured academic library
  (Board → Class → Subject → Chapter → Topic → Concept).
- **PATH B — ASSESSMENT**: a remediation engine
  (ASSESS → ANALYSE → DIAGNOSE → PRIORITISE → FIX → PRACTICE → RETEST → MEASURE).

The product motto: **TODAY → DO THIS → IMPROVE**.

SANRO is **not** a generic chatbot, a content dump, an ERP, a social network,
an AR-first product, a video library with quizzes, or a game-first app. Its moat
is structured curriculum + structured content + a structured question bank +
student performance evidence + concept-level diagnosis + targeted remediation +
measured improvement.

## 2. Products & Domains

| Property | Value |
|---|---|
| Website | https://sanroai.com |
| App (web) | https://app.sanroai.com |
| API | https://api.sanroai.com |
| Mobile | Expo app `com.sanro.ai` (Android APK / AAB) |
| Mobile API base | https://api.sanroai.com/api/v1 (production builds) |

## 3. Roles

`SUPER_ADMIN`, `INSTITUTION_ADMIN` (principal), `TEACHER`, `STUDENT`, `PARENT`.

- SUPER_ADMIN: platform-wide; NOT attached to a demo school.
- INSTITUTION_ADMIN: own institution only.
- TEACHER: assigned scope only.
- STUDENT: Learn/Assess/Practice/Review/Fix/Retest/Progress.
- PARENT: children's results, progress, mastery, weaknesses, remediation,
  improvement, notifications. Parent must NOT access student learning player.

Enforcement is backend-driven. Never trust frontend IDs. Every tenant-sensitive
query enforces institution / group / teacher scope / student scope / parent
relationship.

## 4. Tenancy Model

Platform → Institution → Group/Class/Batch → Students.

- `InstitutionMember` carries role (`User` has no role field).
- `TenantAccessService` scopes all queries to JWT `institutionId`.
- SUPER_ADMIN bypasses only via explicit `@TenantOptional()`.
- Cross-tenant access is forbidden at the data layer.

## 5. Curriculum Architecture

Board → Grade → Subject → Chapter → Topic → Concept.

Board-agnostic (no CBSE hardcoding in business logic). Initial content:
CBSE, Classes 1–10, Science + Mathematics (see REBUILD_AUDIT.md seed inventory).

## 6. Content Architecture

Types: VIDEO, NOTES, PDF, REVISION, QUIZ, QUESTIONS, FLASHCARDS, MODEL_3D, AR, OTHER.
Lifecycle: DRAFT → REVIEW → APPROVED → PUBLISHED → ARCHIVED.
AI-generated content starts as DRAFT. No blind AI publishing.
Every content item maps to curriculum and tracks source/license/status/version/metadata.

## 7. Learn Library (PATH A)

Student journeys:

- Browse: Class → Subject → Chapter → Topic → Concept
- Search, continue learning, bookmark/save, watch videos, read notes, revise,
  practice, flashcards, applicable AR/3D, contextual Ask SANRO.
- Concept page modalities: Learn, Video, Notes, Revision, Practice, Quick Quiz,
  Flashcards, Challenge, AR/3D, Ask SANRO.
- Unavailable modalities are hidden or explicitly disabled — never broken.

## 8. Assessment Engine (PATH B)

Lifecycle: DRAFT → PUBLISHED → AVAILABLE → STARTED → SUBMITTED → EVALUATED → REVIEWED.
Robustness: timeout, autosave, resume, network interruption, duplicate submit,
refresh, app termination, expired assessment, incomplete attempt.
Historical attempts are immutable (question snapshots).

## 9. Question Bank

Types: MCQ, multiple-select, true/false, short answer, long answer, numerical,
assertion/reason, image-based.
Every question maps to board/grade/subject/chapter/topic/concept plus
difficulty/marks/answer/explanation/source/status/version/creator/reviewer.
Lifecycle: DRAFT → REVIEW → APPROVED → PUBLISHED → ARCHIVED.
No fake or hardcoded questions in student experience. UI type mapping:
SHORT→SHORT_ANSWER, LONG→LONG_ANSWER.

## 10. Paper Generator

Filters: board, grade, subject, chapter, topic, concept, difficulty, type,
marks, duration. Supports preview, edit, reorder, regenerate, answer key,
PDF (real selectable text, A4, no blank first page), print, version A/B.
Papers snapshot question versions.

## 11. Diagnosis Engine

Per concept, per student: evidence (questions attempted, correct, accuracy)
then classification STRONG / DEVELOPING / WEAK / INSUFFICIENT_EVIDENCE.
Minimum evidence thresholds defined (do not diagnose a concept with one weak
answer). Misconception inference is reported as "Possible misconception" only
when evidence supports it.

## 12. Remediation Engine

Weak concept → "Fix This" pathway: why it matters → recommended lesson →
video → notes → worked example → practice → quick check → retest.
Retest measures the same concept; compare before/after; claim mastery only with
evidence. Improvement output: "Your understanding improved" (+N points over
before).

## 13. Student Home

Answers: **WHAT SHOULD I DO TODAY?** — Your Focus Today (Fix This / Prepare /
Continue Learning), Progress (XP, streak, mastery), Upcoming assessments,
Recent activity. Not overloaded.

## 14. Navigation IA

Student tabs (mobile + web app): **Home / Learn / Assess / Progress / Me**.
No 7–8 permanent tabs. Practice and remediation are contextual destinations.
Teacher: Dashboard / Classes / Assessments / Reports / Me.
Parent: Dashboard / Children / Progress / Notifications / Me.
Principal: Dashboard / School / People / Reports / Me.
Super Admin: Dashboard / Institutions / Curriculum / Content / Questions /
Analytics / Settings.
Wrong-role navigation is never shown.

## 15. AI

- Context-aware Ask SANRO grounded in approved curriculum knowledge; must not
  leak other students' / institution / teacher-only data.
- AI question generation: draft → validation → human review → approval → publish.
- Providers: mock (default/dev), openai, gemini. Keys server-side only.
- Timeouts, malformed output, partial responses handled; no auto-publish.

## 16. AR/3D

Modality, not the product. Mapped to concepts. 3D viewer + AR where supported;
graceful 3D fallback when no AR / camera denied; hide modality when no model.
Support rotate/zoom/reset/hotspots/labels/guided exploration/quick check.

## 17. Gamification

Secondary. XP, streak, achievements, progress. Seed: 420 XP, 7-day streak,
6 achievements, 7 concept mastery rows. Never makes academic improvement
secondary.

## 18. Reports & Analytics

Student / Teacher-Class / Parent / Institution / Assessment / Concept /
Remediation / Improvement. Exports PDF + CSV where appropriate. Real data only.
Every chart answers a question.

## 19. Notifications

assessment assigned / due / result / remediation available / retest available /
institution notifications. No spam; preferences respected.

## 20. Imports

Bulk student import (CSV/XLSX): upload → validate → preview → duplicate detect →
confirm → import → results (created/updated/skipped/failed, row-level errors,
history). Content bulk upload: PDF/CSV/XLSX/ZIP/YouTube URLs with large-file
handling (never full browser memory load).

## 21. Security

RBAC, tenant isolation, Zod validation (forbidUnknownValues), rate limiting,
secure headers, CORS locked to explicit origins, JWT secret ≥32 chars
(production refuses `dev-`), production secrets outside source control, signed
storage URLs, upload limits + MIME validation, audit logs, authorization on
every mutation, no `prisma migrate reset` on production.

## 22. Data Integrity

Assessment/attempt immutability via question snapshots. Content versioning must
not corrupt historical records. Safe dependency handling on curriculum deletes
(no accidental cascade of educational history).

## 23. Offline Mobile

Survive slow/absent network, backgrounding, termination, resume, autosave,
retry. Offline mutation queue (Zustand + AsyncStorage), offline login credential
vault (SecureStore + SHA-256). Clear sync-state communication via OfflineBanner.
Never lose assessment answers unnecessarily.

## 24. AI Reliability

Context, approved sources, validated output, timeout handling, malformed output
handling, partial response handling, safe retry, no private data exposure, no
auto-publish.

## 25. Analytics Events

learning_started, concept_opened, video_started, practice_started,
assessment_started, assessment_submitted, diagnosis_generated, fix_started,
remediation_completed, retest_started, retest_completed, improvement_recorded.

## 26. UX States

Every async screen: loading, empty, error, retry, success. No 0/0 lessons, fake
progress, fake percentages, dead buttons, dead links, misleading navigation.

## 27. Design System

- Brand primary: violet/purple (#7c3aed family).
- Role themes: Student violet, Teacher blue/indigo, Parent teal/green,
  Principal deep blue, Super Admin slate/indigo — used for primary actions,
  active nav, cards, badges, charts, icons, subtle backgrounds.
- Semantic colors: success, warning, error, info, attention. Accessible.
- Typography: Poppins headings, Inter body. Rounded cards (2xl/3xl), soft
  shadows, gradient accents.
- Responsive: desktop / tablet / mobile; min touch target ≈44px.

## 28. Performance

Optimize API calls, Prisma N+1, images, fonts, charts, tables, bundles, 3D,
PDF, AI. Use pagination, selective fields, caching, lazy loading, code
splitting, debouncing. Measure where practical.

## 29. Website

Premium modern EdTech site (rebuilt): Home, Features, How SANRO Works, For
Students, For Teachers, For Schools, For Parents, Pricing, About, Contact/Demo,
FAQ, Privacy, Terms. Homepage narrative: LEARN → ASSESS → DIAGNOSE → FIX →
RETEST → IMPROVE. App download only when real APK/store links exist.

## 30. Mobile

Expo SDK (current 52) / RN 0.76 / expo-router. SecureStore tokens
(`sanro-token`/`sanro-refresh`/`sanro-user`), TanStack Query, Zustand, Zod.
Role-aware navigation. Backend-driven questions everywhere.

## 31. Content Completeness Matrix

Board × Grade × Subject × Chapter × Topic × Concept, tracking notes/video/
questions/practice/revision/AR-3D/published state. Admin can see gaps.

## 32. Demo Institution

Sanro Demo School. Users: admin@sanroai.com (SUPER_ADMIN, no institution),
principal@sanroai.com, teacher@sanroai.com, student@sanroai.com,
parent@sanroai.com — password `Sanro@123`. Real relationships (student in
grade/class, parent linked to student). Idempotent seed, no duplicates.

## 33. Tech Stack

pnpm workspace; apps: web (Next.js), api (NestJS), mobile (Expo);
packages: types, validation, config, ui (shared). TypeScript strict everywhere,
Zod, Prisma + PostgreSQL, TanStack Query, Zustand (client state only), React
Hook Form + Zod, Expo/React Native. Every dependency justified.

## 34. Build Order

`@sanro/types` → `@sanro/validation` → `@sanro/config` → API → Web.
UI is intentionally kept per-app (web `components/ui/`, mobile `components/`);
a shared UI package is NOT appropriate across RN and DOM primitives.
Mobile is Expo runtime (turbo build is a stub).

## 35. Quality Bar

No fake product, no dead UI, visual QA at 1440/1280/1024/390/430 px, edge-case
master audit, mandatory typecheck + tests + build + E2E critical paths before
"done". Final acceptance per §76 of the rebuild spec.

## 36. Deployment (Definition of Done)

Web on Vercel, API on managed host (Railway), managed PostgreSQL, env via
`.env.example`, no localhost in production, smoke-test full flow, mobile + APK
build with production API. Then final production + security + UX + edge-case
audit. Report exactly per §78 of the rebuild spec.

## 37. Non-Negotiables

- Two primary paths (LEARN, and ASSESS→DIAGNOSE→FIX→RETEST→IMPROVE) always
  remain visually and conceptually distinct.
- No ERP, no social features, no content-dump app, no generic AI chatbot.
- Historical assessment results are immutable.
- No hardcoded/fake questions, mastery, stats, users, or AI responses.
- APK must actually build and be validated before completion is claimed.

## 38. Institution Management (Super Admin) — IMPLEMENTED

Tenant CRUD for SUPER_ADMIN: create (with admin assignment), status patch
(ACTIVE / SUSPENDED / ARCHIVED), list + detail, curriculum maintenance, global
audit/subscriptions/leads. Duplicate-institution detection and the full
create/update/restore/expire/user-management/export surface are contract-ready but
not yet wired. Reference: docs/INSTITUTION_MANAGEMENT.md §6–7.

## 39. Subscription & Validity — IMPLEMENTED

Per-institution subscription (Plan key month/year; no payments gateway — billing-
ready, data-driven pricing). ACTIVE/TRIAL subscriptions with a passed `endsAt`
report effective EXPIRED; `endsAt = null` never expires. Lazy expiry flips state at
next evaluation — no batch job, no data deletion. Reference: docs/INSTITUTION_MANAGEMENT.md §4–5.

## 40. Access Control & Blocked Account States — IMPLEMENTED

Six `AccountBlockState`s; login/refresh/switch-context return `BlockedAccountResponse`
(no tokens); `GET /auth/account-state` exposes the decision; web/mobile blocked
screens pending. Severed states re-checked per gated request; SUPER_ADMIN exempt.
Reference: docs/INSTITUTION_MANAGEMENT.md §2.

## 41. Seat Limits — IMPLEMENTED

Billable seats = ACTIVE students + ACTIVE teachers + all parents + ACTIVE
institution-admin memberships. Effective limit = subscription.seatLimit else
institution.seatLimit. Student create enforced (`SEAT_LIMIT_REACHED`);
`USER_LIMIT_REACHED` helper defined; imports not yet seat-checked. Reference:
docs/INSTITUTION_MANAGEMENT.md §3.

## 42. Subscription Life-cycle Ops — IMPLEMENTED (partial)

Set/replace shipped (cancels prior ACTIVE/TRIAL, new subscription). Renew / force-
expire / plan-change / seat-limit-change and SubscriptionHistory + AuditAction
writers are contract-ready, not yet implemented. Reference:
docs/INSTITUTION_MANAGEMENT.md §5.

## 43. Enforcement Architecture — IMPLEMENTED

Guard chain JwtAuthGuard → RolesGuard → ThrottlerGuard → SubscriptionGuard →
handler; cached entitlement engine (15 s, invalidatable) distinct from the sync
tenant-access chokepoint. Reference: docs/INSTITUTION_MANAGEMENT.md §8.

## 44. Audit Trail (Institution & Subscription) — IMPLEMENTED (schema/enums)

`SubscriptionHistory` model + `SubscriptionHistoryAction`, 15 new `AuditAction`
values, `Institution` lifecycle timestamps, indexes — migrated
(`20260920102146_institution_subscription_system`) but not yet written by the admin
mutations themselves. Reference: docs/INSTITUTION_MANAGEMENT.md §9.

## 45. Grace Period & Expiring-Soon — IMPLEMENTED (storage/surface)

`gracePeriodDays` stored + surfaced in account-state (default 0), not yet applied
to expiry math; `expiringSoon` (≤30 days) exposed on entitlement. Reference:
docs/INSTITUTION_MANAGEMENT.md §4.