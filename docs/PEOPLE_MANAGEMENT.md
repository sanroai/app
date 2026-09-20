# SANRO AI — People Management, Direct SANRO & Super-Admin People Admin

Full product + technical reference for managing the platform's people surface:
Students, Teachers and Parents, the **Direct SANRO** subscription model (direct
customers belong to the system-owned "SANRO AI" institution — id
`00000000-0000-0000-0000-00000000a5a1`), the super-admin people admin API, and
the entitlement rules that decide who is allowed to act right now.

Status: ratified 2026-09-20 (updated 2026-09-21 for the SANRO AI system
institution model). Describes the implementation as it exists in code
(`apps/api/src/admin/admin-people.controller.ts`,
`apps/api/src/admin/admin-people.service.ts`,
`apps/api/src/common/security/entitlement.service.ts`,
`apps/api/src/common/guards/subscription.guard.ts`,
`apps/api/src/people/people.controller.ts`). Where the schema/contract surface is
broader than the wired API, that is called out explicitly under "Documented gaps".

The binding contract is `docs/PEOPLE_MANAGEMENT_CONTRACT.md` (phase 2026-09-20).
Source of truth for the data model: `docs/DATABASE.md`. For the institution +
subscription + access-control system that this layer builds on:
`docs/INSTITUTION_MANAGEMENT.md`. For the broader platform:
`docs/MASTER_PRODUCT_SPEC.md`.

---

## 1. Overview & governing principles

SANRO people are **Students**, **Teachers** and **Parents**. Every person row
belongs to exactly one of two source types:

| Source | Row condition | Access derives from |
|---|---|---|
| `INSTITUTION` | `institutionId` set and ≠ SANRO AI system id | the institution's subscription (membership path) |
| `DIRECT_SANRO` | `institutionId` = SANRO AI system id (`00000000-0000-0000-0000-00000000a5a1`) OR NULL (legacy fallback) | a user-owned direct `Subscription` row |

**The source is DERIVED, not stored.** There is no `source` column; code computes
it from the row's `institutionId` each time:

- `AdminPeopleService.deriveSource(institutionId)` returns
  `'DIRECT_SANRO'` when `institutionId` is the SANRO AI system id or null
  (legacy fallback) and `'INSTITUTION'` otherwise
  (`apps/api/src/admin/admin-people.service.ts:67`).
- The contract defines the same rule: "a person row is `INSTITUTION` if
  institutionId set and not the system id, `DIRECT_SANRO` if it is the SANRO AI
  system institution or null" (`docs/PEOPLE_MANAGEMENT_CONTRACT.md` §1).
  UI labels: **"Direct SANRO Student"**, **"Direct SANRO Parent"**; the web
  `SourceBadge` renders the short labels *Institution* / *Direct SANRO*
  (`apps/web/components/people/source-badge.tsx`).

A **direct SANRO subscription** is a `Subscription` row where `institutionId IS
NULL` and `userId` is set. The owner is the direct student (or, for a parent,
derived via linked children). Direct students/parents carry
`institutionId = 00000000-0000-0000-0000-00000000a5a1` (the system-owned
"SANRO AI" institution), so their person rows are no longer institution-less
(legacy NULL rows remain supported). Teachers have no DIRECT_SANRO form:
`Teacher` requires a non-null `institutionId`
(`apps/api/prisma/schema.prisma:517`), i.e. teachers are always institution-bound.

Governing principles:

1. **Same tables, one system institution.** Direct students/parents live in the
   same `Student` / `Parent` tables, assigned to the system-owned "SANRO AI"
   institution (`00000000-0000-0000-0000-00000000a5a1`, code `SANRO-AI`, type
   `SANRO_PLATFORM`, `isSystemInstitution=true`, ACTIVE). It is created
   idempotently by migrations `20260921105000`+`20260921110000` and by seed
   `ensureSystemInstitution`; a partial unique index (WHERE
   `isSystemInstitution=true`) enforces singleness. The SANRO AI institution is
   protected: never deleted/archived/suspended/expired/modified
   (ForbiddenException), cannot be duplicated (ConflictException), and is
   excluded from tenant lists (`/admin/institutions`). Legacy rows with NULL
   `institutionId` still resolve as DIRECT_SANRO (legacy fallback).
2. **Server-side enforcement only.** Entitlement is decided by
   `EntitlementService` (direct path) or `SubscriptionAccessService`
   (institution path) in UTC; a client never decides validity.
3. **One entitlement oracle.** For direct users (system-institution or legacy
   null) the `EntitlementService.evaluateUser()` is THE decision point (the
   guard, the auth flow and admin invalidation all route through it). It never
   re-implements the institution chain — it delegates to `SubscriptionAccessService`
   (contract §4).
4. **Never delete people by expiry/transfer.** Transfers move the
   `institutionId` reference; disabling flips lifecycle flags only. Data is
   preserved.

---

## 2. Roles & RBAC

| Actor | Access | Notes |
|---|---|---|
| SUPER_ADMIN | All people via `/admin/people/*` | Platform-wide, entitlement-exempt |
| INSTITUTION_ADMIN / TEACHER | Existing institution-scoped `/students`, `/teachers`, `/parents` endpoints | Institution-scoped by `TenantAccessService`; cannot see DIRECT_SANRO rows |
| PARENT | `GET /parents/me/dashboard` | Read-only dashboard of linked children |

### Super-admin People API — triple-guard

The people admin surface is guarded on three layers (contract §7):

1. **Role** — controller-level `@Roles('SUPER_ADMIN')`
   (`apps/api/src/admin/admin-people.controller.ts:46`), plus a per-call
   `AdminPeopleService.assertSuperAdmin()` re-check that throws
   `403 'Super admin required'` (`admin-people.service.ts:41`). A teacher or
   institution admin hitting any `/admin/people/*` route receives the RolesGuard
   403.
2. **Subscription / entitlement gate** — every route runs through the global
   `SubscriptionGuard` (`app.module.ts` registers it as an `APP_GUARD`). For
   users with `institutionId` ≠ SANRO AI system id it calls
   `subscriptionAccess.assertCanAccess`; for direct users (`institutionId` =
   system id, or absent/legacy null) it calls `entitlement.assertCanAccess`
   (`apps/api/src/common/guards/subscription.guard.ts:45`).
3. **Entitlement passthrough** — a SUPER_ADMIN is always allowed:
   `EntitlementService.evaluateUser` returns `{ allowed: true, source:
   'INSTITUTION', expiresAt: null, children: [] }` for any SUPER_ADMIN without
   touching the store (`entitlement.service.ts:137`). So the subscription gate
   never blocks the super admin.

Note: the contract intends an explicit `@SubscriptionRequired()` on the
controller; in the current code the class carries `@Roles('SUPER_ADMIN')` only,
and the global guard chain + SUPER_ADMIN exemption supply the rest. See
"Documented gaps".

### Institution-scoped surface (unchanged)

`apps/api/src/people/people.controller.ts` keeps its per-route `@Roles(...)`:

- `GET /students` / `POST /students` / `GET|PATCH /students/:id` /
  `POST :id/activate|deactivate|move|link-parent` — `@Roles(INSTITUTION_ADMIN,
  TEACHER)` (controller `people.controller.ts:19-77`).
- `GET /teachers` — `@Roles(INSTITUTION_ADMIN, TEACHER)`; `POST` /
  `activate` / `deactivate` / `assign-groups` — `@Roles(INSTITUTION_ADMIN)`
  (`people.controller.ts:86-118`).
- `GET /parents` — `@Roles(INSTITUTION_ADMIN, TEACHER)`;
  `POST /parents` — `@Roles(INSTITUTION_ADMIN)`;
  `POST /parents/:id/link-student` — `@Roles(INSTITUTION_ADMIN, TEACHER,
  PARENT)`; `GET /parents/me/dashboard` (no extra `@Roles`) — the parent
  dashboard (`people.controller.ts:127-148`).

All three controllers are class-level `@SubscriptionRequired()` and
institution-scoped by `TenantAccessService`, so an institution admin's queries
can never surface a DIRECT_SANRO row.

---

## 3. People admin API surface

Global prefix `api/v1`. Controller `apps/api/src/admin/admin-people.controller.ts`,
`@ApiTags('admin-people')` (≠ contract's suggested `PeopleModule` location — the
wired module is `apps/api/src/admin/admin-people.module.ts`). All list endpoints
return `{ items, total, page, pageSize }` with `pageSize` capped at 100
(`admin-people.service.ts:61` — `Math.min(...(q.pageSize ?? 20), 100)`).

### Students (`/admin/people/students`)

| Method + route | Service method | Behaviour |
|---|---|---|
| `GET /students` | `listStudents` | Filters (Zod `PeopleListQuerySchema`, controller:11): `institutionId`, `search` (name/email/phone/user.name, case-insensitive), `grade`, `status`, `source` (`INSTITUTION`/`DIRECT_SANRO`), `subscriptionStatus` (`ACTIVE/TRIAL/EXPIRING_SOON/EXPIRED/NONE/CANCELLED/...`), `page`, `pageSize≤100`. `DIRECT_SANRO` ⇔ `institutionId` = SANRO AI system id OR null (legacy); `INSTITUTION` ⇔ `institutionId` set and ≠ system id. Ordered `createdAt desc`. |
| `GET /students/institution/:institutionId` | `listStudentsByInstitution` | Same list scoped to one institution. |
| `GET /students/search` | `searchStudents` | Global autocomplete `?search=` on name/email/phone/rollNumber/user.name; returns `[{ id, name, email, grade, institutionId, source }]`, `take: 20`, ordered by name. Empty query → `[]`. |
| `GET /students/:id` | `studentDetail` | Detail — see response conventions below. |
| `POST /students` | `createStudent` | Creates `User` (email required — Student.email is schema-required; email lives on User), then `Student` with nullable `institutionId`/`academicYearId`. A DIRECT_SANRO student is placed in the SANRO AI system institution (`institutionId` = `00000000-0000-0000-0000-00000000a5a1`). Validates institution/academic year exist when provided. Returns `{ id, defaultPassword }` plus `institutionId`/`institutionName` (`'SANRO AI'` for direct). Audit `STUDENT_CREATED`; invalidates target institution + entitlement cache. |
| `PATCH /students/:id` | `updateStudent` | Updates name/phone/gender/rollNumber/grade only (not institutionId — use transfer). Audit `STUDENT_UPDATED`. |
| `POST /students/:id/transfer` | `transferStudent` | Body `{ targetInstitutionId }` (Zod `TransferBodySchema`, controller:25). Validates target institution; reassigns `student.institutionId`. Audit `STUDENT_INSTITUTION_CHANGED` (institutionId = target). |
| `POST /students/:id/status` | `setStudentStatus` | Body `{ status: 'ACTIVE'|'DEACTIVATED' }`. Mirrors `disable`/`enable` (below). |
| `POST /students/:id/disable` | via `setStudentStatus('DEACTIVATED')` | Flips `Student.status` + `Student.deactivatedAt`, and `User.isActive = false` when a `userId` exists; invalidates that user's entitlement cache. Audit `STUDENT_DISABLED`. |
| `POST /students/:id/enable` | via `setStudentStatus('ACTIVE')` | Inverse — `User.isActive = true`. Audit `STUDENT_ENABLED`. |
| `POST /students/:id/direct-subscription` | `setDirectSubscription` | Body `{ planKey, status?, startsAt?, endsAt?, reason? }`; `status` defaults `ACTIVE` (all six `SubscriptionStatus` values accepted). Validates plan key exists. Upserts the `Subscription` keyed on `userId` (create if absent) + writes a `SubscriptionHistory` row with `institutionId: null` and `action CREATED|UPDATED`. Audit `DIRECT_SUBSCRIPTION_CREATED` / `DIRECT_SUBSCRIPTION_UPDATED`; invalidates the user's entitlement cache. |

### Teachers (`/admin/people/teachers`)

| Method + route | Service method | Behaviour |
|---|---|---|
| `GET /teachers` | `listTeachers` | Institution-bound. Filters: `institutionId`, `status` (ACTIVE/DEACTIVATED/INVITED), `search` (employeeId/user.name). |
| `GET /teachers/:id` | `teacherDetail` | Detail incl. flattened subjects/groups + `recentAudit`. |
| `POST /teachers` | `createTeacher` | `institutionId` REQUIRED (teacher can never be direct). Creates User + Teacher. Returns `{ id, defaultPassword }`. Audit `TEACHER_ADDED`. |
| `PATCH /teachers/:id` | `updateTeacher` | `employeeId` / `status`. Audit `TEACHER_UPDATED`. |
| `POST /teachers/:id/transfer` | `transferTeacher` | Reassign `institutionId`. Audit `TEACHER_INSTITUTION_CHANGED` (institutionId = target). |
| `POST /teachers/:id/status` | `setTeacherStatus` | `{ status }`. |
| `POST /teachers/:id/disable` | via `setTeacherStatus('DEACTIVATED')` | Flips `Teacher.status/deactivatedAt` + `User.isActive`. Audit `TEACHER_DISABLED`. |
| `POST /teachers/:id/enable` | via `setTeacherStatus('ACTIVE')` | Audit `TEACHER_ENABLED`. |

### Parents (`/admin/people/parents`)

| Method + route | Service method | Behaviour |
|---|---|---|
| `GET /parents` | `listParents` | Filters: `institutionId`, `search`, `source` (`INSTITUTION`/`DIRECT_SANRO`), `page`, `pageSize`. Includes linked children (status derived from `User.isActive`). |
| `GET /parents/:id` | `parentDetail` | Detail incl. `children[]` + `recentAudit`. |
| `POST /parents` | `createParent` | Creates User + Parent. Returns `{ id, defaultPassword }`. Audit `PARENT_UPDATED` (no `PARENT_CREATED` action exists). |
| `PATCH /parents/:id` | `updateParent` | name/email/phone. Audit `PARENT_UPDATED`. |
| `POST /parents/:id/students/:studentId/link` | `linkParentToStudent` | Upserts `ParentStudentLink`. Audit `PARENT_CHILD_LINKED`. |
| `POST /parents/:id/students/:studentId/unlink` | `unlinkParentFromStudent` | Deletes `ParentStudentLink` (404 if absent). Audit `PARENT_CHILD_UNLINKED`. |
| `POST /parents/:id/link-child` | `linkParentToStudent` | Body `{ studentId }` — equivalent convenience form. |
| `POST /parents/:id/unlink-child` | `unlinkParentFromStudent` | Body `{ studentId }`. |
| `POST /parents/:id/status` | `setParentStatus` | `{ status }`. |
| `POST /parents/:id/disable` | via `setParentStatus('DEACTIVATED')` | Flips `User.isActive` only (Parent has no status column); invalidates user entitlement cache. Audit `PARENT_DISABLED`. |
| `POST /parents/:id/enable` | via `setParentStatus('ACTIVE')` | Audit `PARENT_ENABLED`. |

### Response-shape conventions

The services project a fixed shape per persona (never raw Prisma rows):

- **Direct rows carry the system institution.** Every student/parent list/detail
  payload exposes `institutionId`/`institutionName`. For DIRECT_SANRO rows these
  are the SANRO AI system id and `'SANRO AI'` respectively; legacy NULL rows keep
  `institutionId: null`.
- **Student list item** (`mapStudentListItem`, admin-people.service.ts:106):
  `id, userId, name, email, phone, rollNumber, grade, gender, dateOfBirth,
  status, isActive, source, institutionId, institutionName, academicYearId,
  subscriptionStatus, subscription, createdAt`. `subscriptionStatus` is derived
  (`deriveSubscriptionStatus`, :83): `NONE` when no direct subscription; a passed
  `endsAt` → `EXPIRED`; `endsAt ≤ 30 days` on an ACTIVE/TRIAL sub →
  `EXPIRING_SOON`; otherwise the raw status.
- **Student detail** adds `user`, `institution`, `academicYear`, `groups`
  (flattened `{id,name,type,status}`), `parents` (flattened, with per-parent
  `source`/`childrenCount`/derived `status`), `directSubscription`,
  `subscriptions` (all, desc), `assessmentAttemptsCount`, `recentAudit`
  (`take: 10`, `{id, action, entityType, entityId, metadata, createdAt, user}`).
- **Teacher list item** (`mapTeacherListItem`, :132): `id, userId, name, email,
  phone, employeeId, status, isActive, institutionId, institutionName, subjects,
  groups, createdAt` — subjects/groups are **flattened** arrays of
  `{ id, name }`.
- **Parent list item** (`mapParentListItem`, :163): `id, userId, name, email,
  phone, status, isActive, source, institutionId, institutionName, childrenCount,
  children, createdAt`. Parent `status` is **derived from `User.isActive`** (the
  `Parent` model has no status column); `children[]` uses `mapLinkedChild`
  (:151) → `{ studentId, studentName, grade, institutionId, institutionName,
  source, status }`.
- **Create** returns the generated password one time only:
  `{ id, defaultPassword }` (student :386, teacher :616, parent :779). The UI must
  show it to the super admin immediately — it is not retrievable afterwards
  (the user changes it at first login).

All mutations are Zod-validated (`CreateStudentSchema`, `UpdateStudentSchema`,
`CreateTeacherSchema`, `CreateParentSchema` from `@sanro/validation`, plus the
local `PeopleListQuerySchema`/`TransferBodySchema`/`StatusBodySchema`/
`LinkChildBodySchema`/`DirectSubscriptionBodySchema` in the controller).

---

## 4. Direct SANRO model & subscriptions

Applied by migration `20260920120000_people_direct_sanro`
(documented in `docs/PEOPLE_MANAGEMENT_CONTRACT.md`), and since 2026-09-21
anchored to the **system-owned SANRO AI institution**.

Direct customers no longer represent as institution-less rows: migrations
`20260921105000`+`20260921110000` (and seed `ensureSystemInstitution`) create
idempotently the single SANRO_PLATFORM institution
`00000000-0000-0000-0000-00000000a5a1` (`isSystemInstitution=true`, ACTIVE,
code `SANRO-AI`), and Student/Parent rows for direct customers carry that
`institutionId` (legacy NULL rows remain as the DIRECT_SANRO fallback). The
SANRO AI institution is protected — never deleted/archived/suspended/expired/
modified (ForbiddenException), cannot be duplicated (ConflictException + partial
unique index WHERE `isSystemInstitution=true`), and is excluded from
`/admin/institutions` tenant lists.

- `Student.institutionId String?` and `Student.academicYearId String?` are
  nullable; `Student.userId String? @unique`
  (`apps/api/prisma/schema.prisma:561-564`). Direct students set
  `institutionId` = SANRO AI system id.
- `Parent.institutionId String?` and `Parent.userId String? @unique`
  (`schema.prisma:599-601`). Direct parents set `institutionId` = system id.
- `Teacher.institutionId String` stays REQUIRED (`schema.prisma:517`).
- `Subscription` gains nullable `institutionId` + nullable `userId` with
  `@relation("DirectSubscriptionOwner")`, `@@unique([userId])`
  (`schema.prisma:1396-1417`). A direct subscription is exactly the row where
  `userId` is set and `institutionId` is null.
- `SubscriptionHistory.institutionId` is nullable (`schema.prisma:1433`); direct
  history rows are written with `institutionId: null`.
- `User.subscriptions Subscription[] @relation("DirectSubscriptionOwner")`
  (`schema.prisma:328`) gives a user its owned direct subscriptions; `User`
  back-links `teacher/student/parent` (`schema.prisma:333-335`).
- `ParentStudentLink` is the parent↔student join
  (`schema.prisma:615-625`, `@@unique([parentId, studentId])`).

### Entitlement path for direct users

`EntitlementService.evaluateUser(user)` (`apps/api/src/common/security/entitlement.service.ts:96`)
decides, with a per-user short-TTL cache (`invalidate(userId)` on admin
mutations, TTL `SUBSCRIPTION.ENTITLEMENT_CACHE_TTL_MS` = 15000 ms
from `packages/config/src/index.ts:33`):

1. `role === SUPER_ADMIN` → allowed always.
2. user has `institutionId` ≠ SANRO AI system id → delegate to
   `subscriptionAccess.evaluate(institutionId)` (institution path, `source:
   INSTITUTION`).
3. direct context (`institutionId` = system id or absent) and
   `role === PARENT` → parent aggregation (section 5).
4. otherwise (direct student) → look up `Subscription` by `userId`
   (`findDirectSubscription`, most recent `createdAt desc`) and run
   `directSubscriptionOutcome` (:329). None found → `{ allowed: false,
   blockState: 'NO_ENTITLEMENT', message: 'No active SANRO entitlement found.
   Please subscribe to continue using SANRO.' }`.

`directSubscriptionOutcome` logic:

| Subscription state | Result |
|---|---|
| no subscription row | blocked `NO_ENTITLEMENT` |
| `endsAt` in the past while ACTIVE/TRIAL (lapsed), or status `EXPIRED` | blocked `DIRECT_SUBSCRIPTION_EXPIRED` ("Your SANRO subscription has expired…") |
| status `SUSPENDED` or `PAST_DUE` | blocked `DIRECT_SUBSCRIPTION_SUSPENDED` |
| status not in `['ACTIVE','TRIAL']` (e.g. `CANCELLED`) | blocked `NO_ENTITLEMENT` |
| `ACTIVE`/`TRIAL` with unpassed/future `endsAt` (or `null`) | **allowed** |

`expiresAt = directSubscription.endsAt` when allowed.

### Block codes — verified enum values

`AccountBlockState` (`packages/types/src/enums.ts:328-340`) — the block codes a
client can receive:

`SUBSCRIPTION_EXPIRED`, `INSTITUTION_SUSPENDED`, `INSTITUTION_ARCHIVED`,
`INSTITUTION_PENDING`, `USER_DISABLED`, `MEMBERSHIP_DEACTIVATED`,
`DIRECT_SUBSCRIPTION_EXPIRED`, `DIRECT_SUBSCRIPTION_SUSPENDED`,
`NO_ACTIVE_CHILD_RELATIONSHIP`, `NO_ENTITLEMENT`.

`EntitlementBlockReason` (`enums.ts:289-302`) adds `INSTITUTION_EXPIRED` and
otherwise mirrors those values. Blocked gates throw a `ForbiddenException` whose
`code` is `blockState ?? reason ?? 'NO_ENTITLEMENT'` with `message` plus
`details: { source, expiresAt, children[] }`
(`entitlement.service.ts:118-134`).

`EntitlementSource` (`enums.ts:282-287`): `INSTITUTION`, `DIRECT_SANRO`,
`CHILD_ENTITLEMENT`. The service sets `source: INSTITUTION` for the delegated
institution path and SUPER_ADMIN, and `source: DIRECT_SANRO` for direct
students AND parent aggregation (the `CHILD_ENTITLEMENT` value exists in the
enum but is not used by the service).

### Guard wiring

`SubscriptionGuard.canActivate` branches on the user's institution context:
`user.institutionId` set and ≠ SANRO AI system id →
`subscriptionAccess.assertCanAccess(user)` (institution behavior);
`user.institutionId` = system id or absent → `entitlement.assertCanAccess(user)`
(direct/parent path) (`apps/api/src/common/guards/subscription.guard.ts:45-49`).

---

## 5. Entitlement inheritance (parents)

A direct parent (SANRO AI system institution, or legacy null context) is
entitled **through its linked children** (`parentEntitlement`,
entitlement.service.ts:204):

- Parent rows looked up by `userId`, `studentLinks` ordered asc, each link's
  Student evaluated independently:
  - student with `institutionId` ≠ SANRO AI system id →
    `subscriptionAccess.evaluate(student.institutionId)`
    (`child.entitlement.source = INSTITUTION`);
  - student without `institutionId`, no `userId` → denied (legacy null);
  - direct student (SANRO AI system institution, or a legacy null row with a
    user-owned subscription) → `findDirectSubscription(student.userId)` + 
    `directSubscriptionOutcome` (`source = DIRECT_SANRO`).
- **ANY-child rule**: the parent is allowed when ANY linked child is entitled.
  A blocked child does not block the parent — no child is required to be
  entitled.
- **`expiresAt = max(allowed children expiresAt)`** — the latest entitlement
  end among entitled children is the parent's effective end.
- A parent with **zero linked children** is denied `NO_ENTITLEMENT`
  ("No linked children found. Please contact SANRO support to link your child.").
- A parent whose children all lack active entitlement is denied
  `NO_ENTITLEMENT` ("None of your linked children currently have an active
  SANRO entitlement.").

Unit coverage for every branch above exists in
`apps/api/src/common/security/entitlement.service.spec.ts` (section 10).

---

## 6. Transfer semantics

`POST /admin/people/students/:id/transfer` and
`POST /admin/people/teachers/:id/transfer` (`admin-people.service.ts:408`, :631):

1. Validates the target institution exists (`400 'Target institution not
   found'`) and the person exists (`404`).
2. Reassigns the person's `institutionId` to the target (single `update`).
   Because membership/group linkage is derived from `institutionId`, the old
   institution immediately stops listing them in its scoped queries and the new
   one lists them.
3. `clearInstitutionEntitlements(targetInstitutionId)`:
   `subscriptionAccess.invalidate(target)` + `entitlement.clearCache()`
   (`admin-people.service.ts:56`) — the target institution's cached entitlement
   decision is dropped so the arrival is visible immediately.
4. Audit:
   - Student → `AuditAction.STUDENT_INSTITUTION_CHANGED` with metadata
     `{ studentId, targetInstitutionId }`, `institutionId = target`
     (`admin-people.service.ts:419`).
   - Teacher → `AuditAction.TEACHER_INSTITUTION_CHANGED` (:642).

Note the implemented transfer is a plain `institutionId` reassignment. The
contract's richer description (re-map groups/academic year) and the audit names
`STUDENT_TRANSFERRED`/`TEACHER_TRANSFERRED` (listed at
`docs/PEOPLE_MANAGEMENT_CONTRACT.md` §3 as schema-era variants) are not in the
current code — the wired actions are the `*_INSTITUTION_CHANGED` variants
(verified in `AuditAction`, `packages/types/src/enums.ts:385,392`). Transferring
a student from one institution to another **flips nothing about source**: both
ends are institution-bound, so the source stays `INSTITUTION`. A DIRECT_SANRO
row (SANRO AI system id, or legacy null `institutionId`) transferred to a real
institution becomes `INSTITUTION` by the same derived rule.

---

## 7. Parent linking

Links are rows of `ParentStudentLink` (`@@unique([parentId, studentId])`,
`@@index([studentId])`).

- `linkParentToStudent` upsets the link (create or no-op) and audits
  `PARENT_CHILD_LINKED` (`admin-people.service.ts:796-808`).
- `unlinkParentFromStudent` deletes it (404 if missing) and audits
  `PARENT_CHILD_UNLINKED` (:811-817).
- Both are exposed twice: `/parents/:id/students/:studentId/link|unlink` and
  `/parents/:id/link-child|unlink-child` (body `{ studentId }`).
- Linking is how a parent inherits child entitlement (section 5) — and the
  admin surface drives it directly.

**Parent "status" is derived, not stored.** The `Parent` model has no status
field. `mapParentListItem`/`mapParentDetail`/student-detail parent mapping derive
`status: 'ACTIVE' | 'DEACTIVATED'` from `user.isActive`
(`admin-people.service.ts:165,315`). Disable/enable therefore flip `User.isActive`
(`setParentStatus`, :819-829) rather than a Parent column.

---

## 8. Audit trail

All people mutations write `AuditLog` rows. The shared consumer is
`AuditService.log` (`apps/api/src/common/services/audit-notifications.service.ts:10-28`),
whose params object is:

```ts
{ userId, institutionId?, action, entityType?, entityId?, metadata? }
```

`AdminPeopleService.auditLog` wraps it with `institutionId ?? null` and
`metadata ?? {}` (`admin-people.service.ts:45`); writes are also done inline via
`tx.auditLog.create` inside the create transactions (e.g. :373).

Actions used by each operation (all verified members of `AuditAction`,
`packages/types/src/enums.ts:353-402`):

| Operation | AuditAction |
|---|---|
| Student create | `STUDENT_CREATED` |
| Student update | `STUDENT_UPDATED` |
| Student disable / enable | `STUDENT_DISABLED` / `STUDENT_ENABLED` |
| Student transfer | `STUDENT_INSTITUTION_CHANGED` |
| Teacher create | `TEACHER_ADDED` |
| Teacher update | `TEACHER_UPDATED` |
| Teacher disable / enable | `TEACHER_DISABLED` / `TEACHER_ENABLED` |
| Teacher transfer | `TEACHER_INSTITUTION_CHANGED` |
| Parent create **and** update | `PARENT_UPDATED` (**no `PARENT_CREATED` exists**) |
| Parent disable / enable | `PARENT_DISABLED` / `PARENT_ENABLED` |
| Parent–student link / unlink | `PARENT_CHILD_LINKED` / `PARENT_CHILD_UNLINKED` |
| Direct subscription create / update | `DIRECT_SUBSCRIPTION_CREATED` / `DIRECT_SUBSCRIPTION_UPDATED` |

Student/teacher/parent detail endpoints also surface the 10 most recent rows of
their audit as `recentAudit` (entityType = the person type, e.g. `'STUDENT'`).

---

## 9. Web UI (super admin)

- **Nav**: the super-admin sidebar gains a PEOPLE group — Students, Teachers,
  Parents — rendered only when `isSuperAdmin`
  (`apps/web/app/(dashboard)/layout.tsx:88-94`).
- **List pages** (`/app/people/students|teachers|parents`):
  - Students: table with source badge, institutional name, account status,
    subscription-status chip (`NONE/TRIAL/EXPIRING_SOON/EXPIRED/ACTIVE/...`),
    search box, filters for source / institution / status / grade /
    subscription-status, pagination (`pageSize: 20`, max 100 server-side)
    (`apps/web/app/(dashboard)/app/people/students/page.tsx`).
  - Parents: source filter + a children column rendering each child's own
    `SourceBadge` (`parents/page.tsx`).
  - SourceBadge styles: INSTITUTION → sky label "Institution", DIRECT_SANRO →
    purple label "Direct SANRO" (`apps/web/components/people/source-badge.tsx`).
- **Detail pages** (`/app/people/<type>/[id]`): the student page distinguishes
  **Direct SANRO Subscription** vs **Institution Entitlement** (a DIRECT_SANRO
  row shows a renew/configure dialog that sets `planKey`/`status`/`endsAt`;
  setting `status: EXPIRED` + a past end date immediately expires the
  subscription). Blocked messaging is surfaced in-app ("No active direct
  subscription. Users with no entitlement are denied.") and disable confirmations
  warn "They will be blocked from accessing SANRO."
- **API hooks**: `apps/web/lib/people-hooks.ts` defines the admin query/mutation
  hooks (`useAdminStudents`, `useAdminStudentDetail`, `useAdminStudentSearch`,
  `useDisableAdmin*`, `useEnableAdmin*`, `useTransferAdmin*`,
  `useSetDirectSubscription`, ...) plus typed response shapes mirroring section 3.

---

## 10. Tests

Run the API suite: `pnpm --filter @sanro/api test` (Vitest). The e2e suite
imports the full `AppModule` (`api/v1` global prefix) and therefore needs a
reachable PostgreSQL (`sanro_test`/`sanro_dev`) with seeded demo users
(`db:seed`). Helpers: `getTestUser`/`login`/`prisma`/`cleanupInstitution` from
`apps/api/test/helpers.ts`.

Existing coverage for this phase:

- **`apps/api/src/common/security/entitlement.service.spec.ts`** (unit) — the
  direct-SANRO + parent-inheritance matrix: SUPER_ADMIN full access without DB
  reads + cache reuse; institution user healthy/blocked (INSTITUTION_SUSPENDED);
  direct student disabled (`USER_DISABLED`), no subscription
  (`NO_ENTITLEMENT`), ACTIVE (`STUDENT_YEARLY` plan surfaced), lapsed
  (`DIRECT_SUBSCRIPTION_EXPIRED`); parent via direct child, parent via
  institution child (`child.target.source === INSTITUTION`), parent of expired
  child (`NO_ENTITLEMENT`), parent with zero children (`NO_ENTITLEMENT`); the
  `evaluateEntitlement` alias.
- `apps/api/test/authorization.e2e-spec.ts` & `subscription-access.e2e-spec.ts`:
  the existing RBAC + entitlement guarantees the direct path must not regress.

The people admin **e2e** suite named in the contract
(`apps/api/test/people.e2e-spec.ts`, contract §8 — super admin creates a DIRECT
student, direct login/role, expired direct block, parent inheritance, multi-child
ANY rule, institution-admin 403 on `/admin/people`, transfer list visibility,
audit rows) is **not present in the repository yet** — see Documented gaps.

---

## Documented gaps

> Status checked against the live code on 2026-09-20.

1. **Direct login not yet wired.** `AuthService.issueLogin` throws
   `401 'No active institution membership'` when the user has zero ACTIVE
   memberships and no context (`apps/api/src/auth/auth.service.ts:172-174`).
   A direct student/parent (SANRO AI system institution, or legacy null row)
   has no membership row, so login via `POST /auth/login` currently fails for
   them. The contract (§2) requires direct users to log in with
   `role = STUDENT | PARENT` (institution claim = SANRO AI system id or
   absent); the role-derivation path to make that work is not in the code yet.
2. **No `people.e2e-spec.ts`.** The contract's §8 test list is unimplemented;
   only the entitlement unit spec exists. `authorization.e2e-spec.ts` has no
   `admin/people` RBAC block yet.
3. **`@SubscriptionRequired()` not on the people admin controller.** The
   contract's "triple-guard" intends it; the controller currently carries only
   `@Roles('SUPER_ADMIN')` plus the service-level `assertSuperAdmin` re-check.
   In practice SUPER_ADMIN is the only role matrix that reaches these routes and
   SUPER_ADMIN is entitlement-exempt, so the effective posture matches the
   contract.
4. **Transfer is a narrow reassignment.** `transferStudent`/`transferTeacher`
   re-point `institutionId` only; the contract's membership/academic-year/group
   re-mapping and any direct→institution transfer with group remap are not
   implemented. Audit actions are the `*_INSTITUTION_CHANGED` variants.
5. **Create parent never sets `institutionId`.** `createParent`
   (`admin-people.service.ts:745`) creates the `Parent` row without an
   institution, i.e. every parent created via `/admin/people/parents` is a
   DIRECT_SANRO parent in the current code (legacy null → DIRECT_SANRO);
   institution-binding a parent is only reachable through the existing
   institution-scoped `/parents` create.
6. **List filters narrower than contract.** Implemented query schema supports
   `institutionId, search, grade, status, source, subscriptionStatus, page,
   pageSize`; the contract's additional `groupIds`, `parentId` and
   `academicYearId` filters are not in the controller. `pageSize` is capped at
   100 in code.
7. **Enum values defined but unused by the service.** `EntitlementSource.
   CHILD_ENTITLEMENT` and `AccountBlockState.NO_ACTIVE_CHILD_RELATIONSHIP` /
   `EntitlementBlockReason.NO_ACTIVE_CHILD_RELATIONSHIP` exist in
   `@sanro/types` but the current `EntitlementService` emits
   `DIRECT_SANRO` and `NO_ENTITLEMENT` respectively for the same situations.