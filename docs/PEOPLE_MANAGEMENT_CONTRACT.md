# PEOPLE MANAGEMENT — Binding Contract

> **REALITY REBASELINE (2026-09-20) — READ FIRST.** Ground truth on disk differs from the
> "currently lacks" framing below. The following ALREADY EXIST and are COMPLETE + applied
> to local DB (migration `20260920120000_people_direct_sanro`, DB schema up to date):
> - `Subscription.userId` (unique, nullable) + nullable `Subscription.institutionId`;
>   `Student.institutionId` + `academicYearId` nullable; `Parent.institutionId` nullable;
>   `SubscriptionHistory.institutionId` nullable; direct-owner `User.subscriptions` relation.
> - **SANRO AI system institution (since 2026-09-21)**: direct customers belong to the
>   single system-owned institution "SANRO AI" (id
>   `00000000-0000-0000-0000-00000000a5a1`, code `SANRO-AI`, type `SANRO_PLATFORM`,
>   `isSystemInstitution=true`, ACTIVE), created idempotently by migrations
>   `20260921105000`+`20260921110000` and seed `ensureSystemInstitution`; a partial unique
>   index WHERE `isSystemInstitution=true` enforces singleness. DIRECT_SANRO now maps to
>   Student/Parent rows with that `institutionId` (or legacy NULL rows). Protected:
>   never deleted/archived/suspended/expired/modified (ForbiddenException), never
>   duplicated (ConflictException + index), excluded from `/admin/institutions` tenant lists.
> - `apps/api/src/common/security/entitlement.service.ts` — full `UserEntitlement` oracle:
>   `evaluateUser`/`evaluateEntitlement`, `assertCanAccess`, `assertCanAccessUser`,
>   SUPER_ADMIN passthrough, INSTITUTION path (delegates to `SubscriptionAccessService`),
>   DIRECT_SANRO path (user-owned `Subscription`), PARENT path (child aggregation,
>   `children[]`, allowed-while-any-child, `expiresAt = max`), cache + `invalidate`.
> - `apps/api/src/common/guards/subscription.guard.ts` already branches: user with
>   `institutionId` ≠ system id → institution path; `institutionId` = system id or
>   absent → entitlement path.
> - `apps/api/src/common/validators/is-uuid.validator.ts` EXISTS.
> - `AuditAction` enum variants (STUDENT_/TEACHER_/PARENT_/DIRECT_SUBSCRIPTION_/…) and
>   `AccountBlockState` variants (DIRECT_*/CHILD_LINKED*) + `EntitlementSource` ARE in
>   `@sanro/types`.

**DO NOT re-create, migrate, regen, or re-base anything above.** Agents below ONLY:
(a) build the **super-admin people admin API**, (b) **wire direct-SANRO entitlement into
auth/token role derivation + web/mobile UX**, (c) web People screens + nav, (d) tests for
the people surface, (e) docs. Schema is LOCKED — no schema edits, no `prisma migrate`,
no `db push`, no `generate` by any agent.

Sections below labeled "create/needs" that reference the entitlement engine should be read
as "enforce via the EXISTING EntitlementService" — import it, do not rebuild it.

---
 (Direct SANRO + People Admin)

Phase: 2026-09-20 (after institution/subscription phase). This file is the **contract**.
Implement to this exact contract. If the codebase disagrees with this file, the FILE wins
for new behavior; record the mismatch in your handoff notes rather than deviating.

DO NOT: edit the Prisma schema, run migrations, or touch another agent's files.
DO: follow the existing code conventions (guards, decorators, Zod, tenant service, audit).

---

## 1. GLOSSARY / DOMAIN

- **INSTITUTION user** — a Student/Teacher/Parent whose access derives from an institution
  subscription (membership path). `Student.institutionId` NOT NULL and ≠ SANRO AI system id.
- **DIRECT SANRO user** (also "direct subscriber") — a Student or Parent (AND a direct
  Subscription) who belongs to the **SANRO AI system institution** (id
  `00000000-0000-0000-0000-00000000a5a1`, code `SANRO-AI`, `isSystemInstitution=true`);
  legacy rows with `institutionId = NULL` also resolve as DIRECT_SANRO (fallback).
  Represented in the SAME tables (Student/Parent) + a `Subscription.userId` (direct owner)
  row.
- **SANRO AI system institution** — the single system-owned institution for direct
  customers (`SANRO_PLATFORM`, ACTIVE). Created idempotently by migrations
  `20260921105000`+`20260921110000` and seed `ensureSystemInstitution`; a partial unique
  index WHERE `isSystemInstitution=true` forces singleness. Protected: never
  deleted/archived/suspended/expired/modified (ForbiddenException); never duplicated
  (ConflictException); excluded from tenant list `/admin/institutions`.
- **Source** (derived, not stored): a person row is `INSTITUTION` if `institutionId` set
  and ≠ SANRO AI system id, `DIRECT_SANRO` if `institutionId` equals the system id or is
  null (legacy). UI label: "Direct SANRO Student", "Direct SANRO Parent".
- **Direct SANRO subscription** — a `Subscription` row where `institutionId IS NULL` and
  `userId` set. Owner = the direct student (or, for a parent, derived via child).
- **Institution entitlement** — the existing institution+subscription+membership chain.

## 2. WHO IS ALLOWED

- **Super Admin** (platform-wide) manage all People via `/api/v1/admin/people/*`.
- **Institution Admin / Teacher** keep their existing institution-scoped endpoints
  unchanged. They CANNOT see DIRECT SANRO users in list/detail endpoints
  (their queries are institution-scoped by TenantAccessService).
- **Direct students/parents** get NO membership row; they belong to the system-owned
  SANRO AI institution (`institutionId` = system id, or absent/null on legacy rows).
  Entitlement treats both as direct. They must be able to log in and use the app under
  their own direct entitlement. Their JWT has `role = STUDENT | PARENT`.

## 3. SCHEMA (ALREADY APPLIED — DO NOT TOUCH)

Migration `20260920120000_people_direct_sanro` already applied. Details in
`apps/api/prisma/schema.prisma`:
- `Student.institutionId` → nullable, `Student.academicYearId` → nullable,
  `Student.userId` unchanged.
- `Parent.institutionId` → nullable.
- `Teacher.institutionId` → STILL REQUIRED (teachers are institution-bound).
- `Subscription.institutionId` → nullable; **NEW `Subscription.userId`** (nullable, unique,
  `@relation("DirectSubscriptionOwner")`) = direct-owner. `Subscription` now optional-institution.
- `SubscriptionHistory.institutionId` nullable.
- `User` gets `subscriptions Subscription[] @relation("DirectSubscriptionOwner")`.
- `User` gets back relations for Student/Parent (they were auto-added by schema; check
  existing relation fields exist).
- `AuditAction` now includes (list is NOT exhaustive; it already existed):
  SUBSCRIPTION_PLAN_CHANGED, SUBSCRIPTION_EXPIRED, INSTITUTION_ADMIN_CHANGED,
  DIRECT_SUBSCRIPTION_CREATED, DIRECT_SUBSCRIPTION_UPDATED, DIRECT_SUBSCRIPTION_RENEWED,
  STUDENT_TRANSFERRED, PARENT_LINKED, PARENT_UNLINKED, etc.

**IMPORTANT**: `Student.email` remains required in the schema — for DIRECT SANRO students
create the underlying User first (email is on User). `Parent.email/phone` may be null.

## 4. ENTITLEMENT SERVICE (new)

Create `apps/api/src/common/security/entitlement.service.ts` (injectable, provider in
`CommonModule`, export it). Its job: "can this RequestUser act RIGHT NOW?" It is THE single
entitlement oracle. Do NOT duplicate the institution+subscription logic that
`subscription-access.service.ts` already owns — REUSE it.

Contract:

```ts
interface UserEntitlement {
  allowed: boolean;
  reason?: EntitlementBlockReason;          // from packages/types (extend if needed)
  source: 'INSTITUTION' | 'DIRECT_SANRO';
  // For DIRECT_SANRO: the direct subscription (may be null if none)
  directSubscription?: { planKey: string | null; status: SubscriptionStatus; endsAt: Date | null } | null;
  // For INSTITUTION: expose institution name
  institutionName?: string | null;
  expiresAt: Date | null;                    // effective entitlement end
  // parent-specific:
  children: Array<{
    studentId: string; name: string; institutionId: string | null;
    source: 'INSTITUTION' | 'DIRECT_SANRO';
    expiresAt: Date | null; enrolledGrade: string | null;
  }>;
  blockState?: string;                       // reuse AccountBlockState codes
  message?: string;                          // human message
}
```

Method `evaluateEntitlement(user: RequestUser): Promise<UserEntitlement>`:

1. If `user.role === Role.SUPER_ADMIN` → allowed always.
2. If the user has an institution (membership or `institutionId` claim): delegate the
   existing institution+subscription evaluation (call `subscriptionAccess.evaluate`) and
   return `{ source: 'INSTITUTION', ... }` — do NOT reimplement seat/expiry.
3. Else (DIRECT SANRO): look up `Subscription` where `userId = user.sub` and status ACTIVE;
   return its planKey/status/endsAt. If none → `{ allowed: false, source: 'DIRECT_SANRO',
   reason: 'NO_ENTITLEMENT' }`.
4. If the user is a PARENT: look up `ParentStudentLink` on the parent; gather each linked
   Student's entitlement (each Student is either institution-entitled or direct-entitled per
   its own institutionId). Parent is allowed if **ANY** child has an active entitlement.
   Child list aggregated into `children[]`; `expiresAt = max(child.expiresAt)`.
   A parent with ZERO children → denied `NO_ENTITLEMENT`.

`assertCanAccess(user)` throws ForbiddenException with AccountBlockState + message for
blocked reasons (SUBSCRIPTION_EXPIRED, INSTITUTION_EXPIRED, USER_DISABLED,
DIRECT_SUBSCRIPTION_EXPIRED, NO_ENTITLEMENT...). This is the entitlement gate.

**Wire it**: update `apps/api/src/common/guards/subscription.guard.ts` (the global guard) so
that when `SubscriptionRequired()` is set AND the user is direct (`institutionId` = SANRO
AI system id, or absent/legacy null), it calls `entitlement.assertCanAccess`
(direct/parent path) instead of the institution-only `subscriptionAccess.assertCanAccess`.
Keep the real-institution path as-is.

**Mobile**: `apps/mobile/lib/auth-store.ts` + `apps/mobile/lib/api.ts` already read
`AccountBlockState`/`blockState`; the mobile/expired screen should now render BOTH
"institution expired" and "Direct SANRO subscription expired" messaging (check
`apps/mobile/app/(auth)/login.tsx` behavior on blocked). Implemented as
`apps/mobile/lib/blocked.ts` mapping block state → expired message and the
`/expired?state=…` redirect (plus an entitlement cache in
`apps/mobile/lib/offline-auth.ts`).

## 5. PEOPLE ADMIN API (new)

Implemented as `apps/api/src/admin/admin-people.controller.ts` +
`admin-people.service.ts` + `admin-people.module.ts` (own `AdminPeopleModule`
under `ApiTags('admin-people')`, global `@Roles(Role.SUPER_ADMIN)` +
`@SubscriptionRequired()`).
RBAC: ONLY `SUPER_ADMIN`. Super admin skips entitlement.

Endpoint contract (all prisma-scoped to super admin; use `AuditLog` writes):

### Students
- `GET /api/v1/admin/people/students` — list w/ filters:
  `source` (INSTITUTION|DIRECT_SANRO|all), `institutionId`, `status`, `grade`,
  `subscriptionStatus`, `search` (name/email/phone), `groupIds`, `parentId`,
  `academicYearId`, `page`, `pageSize`
  → `{ items, total, page, pageSize }` (Student rows + source + institution name).
- `GET /api/v1/admin/people/students/:id` — detail (student + user + institution +
  subscriptions + parents linked + groups + assessment attempts count).
- `GET /api/v1/admin/people/students/search` — global autocomplete (name/email/phone),
  returns `[{ id, name, email, grade, institutionId, source }]`.
- `POST /api/v1/admin/people/students` — create. If `source=DEFAULT/institution` requires
  `institutionId`, `academicYearId`, creates User(if no userId)→Student→membership
  (INSTITUTION_ADMIN can only see own; super admin can target any). If `source=DIRECT_SANRO`
  requires `userId` (reuse existing user) OR creates a new User; the Student is placed in
  the SANRO AI system institution; no academicYear, no membership; respond with
  `institutionId`/`institutionName` (`'SANRO AI'`). Zod-validated. Audit: STUDENT_CREATED
  (+DIRECT if direct).
- `PATCH /api/v1/admin/people/students/:id` — update (name/email/phone/grade/status/
  rollNumber/gender/dateOfBirth/userId/academicYearId/groupIds). For DIRECT: do NOT allow
  setting institutionId here (use transfer). Audit STUDENT_UPDATED.
- `POST /api/v1/admin/people/students/:id/transfer` — `{ targetInstitutionId,
  academicYearId }` — move an INSTITUTION student to another institution (recreate
  membership, re-map groups/academic year). Prevent transferring a DIRECT student (only
  direct→direct if any). If target==current → 400. Audit STUDENT_TRANSFERRED.
- `POST /api/v1/admin/people/students/:id/disable|/enable` — flip `status` STUDENT
  (DEACTIVATED↔ACTIVE) + `User.isActive`. Audit STUDENT_DISABLED/STUDENT_ENABLED.
- `POST /api/v1/admin/people/students/:id/direct-subscription` — set direct sub
  `{ planKey, startsAt, endsAt, status }` for a DIRECT student (or create if missing).
  Writes `Subscription` (userId) + `SubscriptionHistory` (institutionId null). Audit
  DIRECT_SUBSCRIPTION_CREATED/UPDATED.

### Teachers
- `GET /api/v1/admin/people/teachers` — list (always institution-bound; filter by
  institutionId/status/search). `GET /:id` detail.
- `POST .../teachers` create, `PATCH :id` update, `POST :id/disable|enable`,
  `POST :id/transfer` (institution→institution). Audits: TEACHER_CREATED/
  TEACHER_UPDATED/TEACHER_DISABLED/TEACHER_ENABLED/TEACHER_TRANSFERRED.

### Parents
- `GET /api/v1/admin/people/parents` — list w/ source + linked-child info.
- `GET /api/v1/admin/people/parents/:id` — detail + children[].
- `POST .../parents` create (institution OR DIRECT), `PATCH :id` update,
  `POST :id/disable|enable`, `POST :id/link-child { studentId }`,
  `POST :id/unlink-child { studentId }`. Audits: PARENT_*/PARENT_LINKED/PARENT_UNLINKED.

For all list endpoints: server-side pagination + filtering; `pageSize` cap 100.
All mutations Zod-validated (reuse `@sanro/validation` schemas where possible; ADD new
schemas in `packages/validation/src/schemas.ts` if missing, export from index).

## 6. WEB SUPER ADMIN — PEOPLE (apps/web)

Add a **PEOPLE** section in the super-admin sidebar navigation (`apps/web/components/`
sidebar/nav file — find it, likely `app-sidebar.tsx` or similar) with three routes:

- `app/people/students`
- `app/people/teachers`
- `app/people/parents`

Each page (Next.js app router, `apps/web/app/(dashboard)/app/people/...`):
- Table with: source badge (Institution/Direct SANRO), institution name, status, search,
  source + institution filters, pagination, per-row actions (view, disable/enable, transfer,
  direct-subscription).
- Detail page `app/people/[peopleType]/[id]` with tabs: Overview / Subscription /
  Groups / Parents / Assessments / Audit.
Use existing shadcn/ui table + dialog + badge + sonner patterns from `app/institutions/`.
New API-client hooks in `apps/web/lib/people-hooks.ts` next to `institution-hooks.ts`.

## 7. RBAC — do NOT regress

- `GET /students`, `GET /teachers`, `GET /parents` currently require `@Roles` (they were
  tightened in a prior pass). Keep them role-guarded in `people.controller.ts` —
  `@Get()` on TeachersController/ParentsController must NOT be opened up to everyone.
- Super-admin people endpoints are triple-guarded: `@Roles(SUPER_ADMIN)` +
  `@SubscriptionRequired()` + entitlement skip (super admin always allowed).

## 8. TESTS (API e2e)

`apps/api/test/people.e2e-spec.ts` (against test DB via existing `test/helpers.ts`):
- Super admin creates a DIRECT student (in the SANRO AI system institution, no membership);
  student can log in with role STUDENT; has the system institution id (or no institution
  claim on legacy rows); gets direct subscription → can hit app endpoints.
- Direct student with EXPIRED direct subscription → blocked with DIRECT_SUBSCRIPTION_EXPIRED.
- Parent of a direct student: parent created w/ link; direct student entitlement propagates.
- Parent with 2 children (1 institution, 1 direct): parent allowed while ANY entitled.
- Institution admin CANNOT list/see direct student via `/admin/people` (403) nor via
  institution `/students` (direct student not in list).
- Transfer student between institutions: old institution no longer lists them; new does.
- Audit rows written for each people action (STUDENT_CREATED, PARENT_LINKED, transfer...).
Also extend `test/authorization.e2e-spec.ts` if it has a `people` RBAC block to include
super-admin people endpoints (403 for teacher/admin).

Reuse existing helpers: `getTestUser`, `authenticate`, `prisma` from `test/helpers.ts`.
Make tests deterministic/idempotent with unique emails.

## 9. DOCS (agents final pass only)
Update `docs/PEOPLE_MANAGEMENT.md` (create if missing) + docs list (CHANGELOG, DATABASE,
AUTH_RBAC, SECURITY, X/Y): document People nav, direct SANRO model, entitlement inheritance
rules, parent multiple-children rule, RBAC, transfer semantics, subscription inheritance.

## 10. VERIFY (run, must be GREEN before handoff)
```
pnpm --filter @sanro/api typecheck   # clean
pnpm --filter @sanro/api test        # all pass
pnpm --filter @sanro/web typecheck   # clean
pnpm --filter @sanro/web build       # clean (if web build is slow, typecheck is enough for agent pass; but try build)
pnpm --filter @sanro/mobile typecheck
```
Do NOT commit. Do NOT run `prisma migrate`/`db push` (done already).

## 11. OWNERSHIP (do not collide)
- Agent PEOPLE-API: people admin controller/service + validation schemas + unit/e2e tests
  (this file §5 §8). Also consume entitlement service (§4) but do NOT create it.
- Agent ENTITLEMENT: entitlement.service + guard wiring + types enum additions if needed
  (§4) + tests.
- Agent WEB: web people pages + nav + hooks (§6).
- Agent MOBILE: expired/blocked direct messaging + entitlement helper (§4 mobile) + tests.
- Agent DOCS: §9 docs only.
Parallel-safe: each owns disjoint files. Coordination point: types
(`packages/types`) — enum additions only by ENTITLEMENT agent.

## FINAL NOTE
This is a large phase. Small correctness >> breadth. If the DB/schema drift appears,
STOP and record it — do not invent migrations.
