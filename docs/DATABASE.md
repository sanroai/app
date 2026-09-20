# SANRO AI — Database

## 1. Provider

PostgreSQL (native / managed). Prisma ORM, migration history managed in
`apps/api/prisma/migrations`. Deploy uses `prisma migrate deploy`; seed uses
idempotent `db:seed`. `prisma migrate reset` is forbidden on production.

## 2. Domain Map (models grouped)

### Tenancy & People
- Institution, AcademicYear, InstitutionMember (role lives here)
- User (no role field; has credentials + profile; owns `subscriptions` as direct
  subscription owner)
- Teacher, Student, Parent (link to User + institution; Student/Parent
  `institutionId` nullable → DIRECT_SANRO people, see §6)
- Group (class/batch), StudentGroup membership, StudentTeacher assignment

### Subscriptions & billing
- Plan (`key` unique: STUDENT_MONTHLY / STUDENT_YEARLY / INSTITUTION; perSeat,
  priceMonthly, priceYearly) — billing-ready, no payments gateway.
- Subscription (per institution; status ACTIVE/TRIAL/EXPIRED/CANCELLED/PAST_DUE/
  SUSPENDED; startedAt/endsAt; seatLimit overrides institution default). Direct
  form: `Subscription.userId` (nullable, unique) is the direct SANRO owner — a
  DIRECT_SANRO subscription carries `institutionId NULL` + `userId` set (see §6).
- SubscriptionHistory (audit trail of subscription changes; action enum CREATED/
  UPDATED/RENEWED/PLAN_CHANGED/LIMIT_CHANGED/CANCELLED/EXPIRED/ACTIVATED/SUSPENDED;
  old/new plan/status/seatLimit/dates, reason, changedById → User).
- Institution subscription fields: `seatLimit`, `gracePeriodDays`,
  `expiredAt`, `suspendedAt`, `archivedAt`, `deletedAt`, `lastActivityAt`,
  `createdById`.

### Curriculum
- Board → Grade → Subject → Chapter → Topic → Concept
- (Subject has no grade field; Chapter carries code + grade)

### Content
- ContentItem (type: VIDEO/NOTES/PDF/REVISION/QUIZ/QUESTIONS/FLASHCARDS/
  MODEL_3D/AR/OTHER), ContentVersion, content–curriculum links
- KnowledgeBase, KnowledgeBaseChunk, ProcessingJob
- FlashcardRating

### Questions & papers
- Question (type mapping: UI SHORT→SHORT_ANSWER, LONG→LONG_ANSWER),
  QuestionVersion, Paper, PaperQuestion

### Assessments
- Assessment (snapshots questions at publish: question snapshots),
  Attempt, Answer
- Attempts are immutable. Question edits never rewrite attempt data.

### Diagnosis & remediation
- DiagnosticResult / concept evidence, ConceptMastery (studentId+conceptId),
  RemediationPlan, RemediationItem, Retest attempt links, ImprovementRecord

### Gamification
- GamificationProfile (XP, streak), Achievement, EarnedAchievement,
  LeaderboardEntry

### AI / AR
- ArContent, ArContentVersion, ArActivity (denormalized UUID references)
- Chat history (optional), AI generation jobs

### System
- RefreshToken, PasswordResetToken, AuditLog, Notification, ImportBatch,
  ImportRow, NotificationPreference

## 3. Conventions

- Composite unique keys for many-to-many (e.g. ConceptMastery studentId+conceptId).
- Soft-lifecycle statuses on content (DRAFT→REVIEW→APPROVED→PUBLISHED→ARCHIVED).
- Tenant scoping columns: `institutionId` where relevant; `Nullable` allowed only
  where platform-level data legitimately exists.
- All historical records reference versions/snapshots, never live mutable rows.

## 4. Indexes & Query Notes

- Foreign keys on joins (concept → chapter → topic; question → concept).
- Pagination + `select`-projection to avoid N+1.
- Full-text search on titles/names (pg_trgm) for search.
- Subscription lookups use `@@index([institutionId, status])` (current-subscription
  findFirst) and `@@index([endsAt])` (expiry/expiring-soon scans).
- Institution lists use `@@index([status])`, `@@index([type])`, `@@index([deletedAt])`.
- Error-body `{code, message, requestId, statusCode}`; subscription errors use
  `code` (e.g. `SEAT_LIMIT_REACHED` on student create; block states as 403 codes).

## 5. Migrations

Migrations live in `apps/api/prisma/migrations/`. Seed is idempotent —
re-runnable without duplicates.

Notable migration: `20260920102146_institution_subscription_system` — adds
`SubscriptionHistory` table + `SubscriptionHistoryAction` enum, extends
`AuditAction` (15 institution/subscription/admin values), adds
`InstitutionStatusEnum.EXPIRED`, 6 new `InstitutionType` values, the new
`Institution` columns (`gracePeriodDays`, `expiredAt`, `suspendedAt`, `deletedAt`,
`lastActivityAt`, `description`, `country`, `website`, `contactPerson`), and the
Institution/Subscription indexes above. Reviewer note: the Subscription `endsAt`
default in `AdminService.setSubscriptionPlan` is `now + 30 days` for all statuses.

## 6. Direct SANRO people model

Migration `20260920120000_people_direct_sanro` (see `docs/PEOPLE_MANAGEMENT.md` for
the full people-management subsystem; contract: `docs/PEOPLE_MANAGEMENT_CONTRACT.md`).

Direct SANRO people are institution-less customers (students/parents) who access
the platform through a **user-owned** Subscription instead of an institution
membership. Their "source" is DERIVED (`institutionId` null ⇔ DIRECT_SANRO),
never stored; no fake "SANRO" tenant exists.

- `Student.institutionId String?` / `Student.academicYearId String?` / 
  `Student.userId String? @unique` — an institution-less student is DIRECT_SANRO.
- `Parent.institutionId String?` / `Parent.userId String? @unique` — same rule.
- `Teacher.institutionId` stays **required** — teachers are always
  institution-bound, never DIRECT_SANRO.
- `Subscription.userId String? @unique` with
  `@relation("DirectSubscriptionOwner")` on `User.subscriptions`; a direct
  subscription is the row where `userId` is set and `institutionId` is NULL.
  `@@unique([userId])`, `@@index([institutionId, status])`, `@@index([endsAt])`
  unchanged.
- `SubscriptionHistory.institutionId String?` — direct history rows are written
  with `institutionId: null`, `changedById → User`.
- `ParentStudentLink` (parentId+studentId, `@@unique([parentId, studentId])`,
  `@@index([studentId])`) — the join that lets a parent inherit a direct child's
  entitlement.