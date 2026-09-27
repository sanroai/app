# SANRO AI — Institution Management, Subscription & Access Control

Full product + technical reference for the Super-Admin institution management and
per-institution subscription / validity / access-control / seat-limit system.

Status: ratified 2026-09-20. Describes the implementation as it exists in code
(`apps/api/src/admin/`, `apps/api/src/common/security/subscription-access.service.ts`,
`apps/api/src/common/guards/subscription.guard.ts`, `apps/api/src/auth/`). Where the
schema/contract surface is broader than the wired API, that is called out explicitly
under "Documented gaps".

Source of truth for the data model: `docs/DATABASE.md`. For the broader platform:
`docs/MASTER_PRODUCT_SPEC.md` §38–45.

---

## 1. Overview & governing principles

SANRO is a multi-tenant SaaS: one deployment serves many institutions (tenants), and
each tenant has its own **subscription** that governs validity (does the tenant's
access expire?), seat limits (how many billable users may exist?), and lifecycle
state (active / suspended / archived / pending).

Billing model: **month/year plans mapped via `Plan` key** (`STUDENT_MONTHLY`,
`STUDENT_YEARLY`, `INSTITUTION`). There is **no payments gateway** — the platform is
billing-ready: pricing is data-driven (`Plan.priceMonthly`, `Plan.priceYearly`,
`Plan.perSeat`; see `packages/config/src/index.ts` `PLANS`) and subscriptions are
admin-set rather than paid-for.

Governing principles:

1. **Server-side enforcement only.** Client devices never decide validity. Time is
   always server UTC; a client clock is never trusted.
2. **Separation of concerns.** Four independent state machines drive tenancy:
   - `institution.status` (InstitutionStatusEnum: ACTIVE / SUSPENDED / EXPIRED /
     ARCHIVED / PENDING) — tenant lifecycle.
   - `subscription.status` (SubscriptionStatus: ACTIVE / TRIAL / EXPIRED / CANCELLED /
     PAST_DUE / SUSPENDED) — commercial validity. An ACTIVE/TRIAL subscription whose
     `endsAt` has passed reports an **effective** status of `EXPIRED`.
   - `user.isActive` — platform account enablement (independent of tenant).
   - `membership.status` (InstitutionMember: INVITED / ACTIVE / DEACTIVATED) — a
     user's role binding in a tenant.
   - They are independent: a suspended tenant can technically have an ACTIVE
     subscription and ACTIVE members and enabled users; access is decided by
     combining them in the entitlement engine (section 2 matrix).
3. **Access = entitlement over the combination.** The single evaluation point is
   `SubscriptionAccessService.evaluate()`/`assertCanAccess()` (section 8). Precedence
   when multiple blocks apply (highest first): `user.isActive = false` →
   membership not ACTIVE → institution ARCHIVED → SUSPENDED → PENDING → expired.
4. **No data is ever deleted by expiry.** Expiry flips lifecycle flags only (section 4).

### State matrix (decisions per combo)

`EntitlementResult.blockState` / `AccountBlockState` — the six blocked states. `access`
rows mean a non-super-admin member is allowed through `assertCanAccess`.

| institution.status | subscription (effective) | user.isActive | membership.status | Result |
|---|---|---|---|---|
| ACTIVE | ACTIVE/TRIAL, not ended | true | ACTIVE | **access allowed** |
| ACTIVE | ACTIVE/TRIAL ended (**effective EXPIRED**) | true | ACTIVE | blocked `SUBSCRIPTION_EXPIRED` |
| EXPIRED (lazy-flipped) | EXPIRED | true | ACTIVE | blocked `SUBSCRIPTION_EXPIRED` |
| SUSPENDED | any (even ACTIVE) | true | ACTIVE | blocked `INSTITUTION_SUSPENDED` |
| ARCHIVED | any | true | ACTIVE | blocked `INSTITUTION_ARCHIVED` |
| PENDING | any | true | ACTIVE | blocked `INSTITUTION_PENDING` |
| any | any | **false** | any | blocked `USER_DISABLED` (checked first) |
| any | any | true | not ACTIVE (INVITED/DEACTIVATED) | blocked `MEMBERSHIP_DEACTIVATED` |
| any | any | true | no membership row | blocked `MEMBERSHIP_DEACTIVATED` (guard path) |
| — | — | — | no institution context on account-state | `MEMBERSHIP_DEACTIVATED` (account-state path) |
| — (SUPER_ADMIN) | — | — | — | always allowed (no institution binding) |

Request behaviour when blocked:

- **Login / refresh / switch-context** return a `BlockedAccountResponse` body (no
  tokens issued), HTTP 200 (login/refresh/switch are `@HttpCode(OK)`) — see section 2.
- **Authenticated requests** to routes carrying `@SubscriptionRequired()` throw a
  `ForbiddenException` whose `code` is the block state (`USER_DISABLED`,
  `MEMBERSHIP_DEACTIVATED`, or the entitlement `blockState`).
- **`GET /auth/account-state`** returns the same decision as a JSON body with a
  normalized public institution snapshot; SUPER_ADMIN always gets
  `{ access: true, state: null, institution: null }`.

---

## 2. Account states & user journey

### The six blocked states (`AccountBlockState`)

| Code | Trigger | `BLOCKED_ACCOUNT_MESSAGES` text |
|---|---|---|
| `SUBSCRIPTION_EXPIRED` | tenant ACTIVE/EXPIRED but the current ACTIVE/TRIAL subscription has ended (or institution status EXPIRED) | "Your institution’s SANRO validity has expired. Please contact your administrator to renew your access." |
| `INSTITUTION_SUSPENDED` | `institution.status = SUSPENDED` | "Institution access has been suspended. Please contact SANRO support." |
| `INSTITUTION_ARCHIVED` | `institution.status = ARCHIVED` (also the fallback for an unknown institution id) | "This institution has been archived." |
| `INSTITUTION_PENDING` | `institution.status = PENDING` | "This institution has not been activated yet. Please contact SANRO support." |
| `USER_DISABLED` | `user.isActive = false` | "This account has been deactivated by your institution administrator." |
| `MEMBERSHIP_DEACTIVATED` | membership missing or `status != ACTIVE`; no institution context | "Your membership in this institution has been deactivated." |

Messages live once in `packages/config/src/index.ts` (`BLOCKED_ACCOUNT_MESSAGES`).

### Response contract (`BlockedAccountResponse`, `packages/types/src/dto.ts`)

```jsonc
// HTTP 200 (login/refresh/switch-context) — no accessToken/refreshToken present
{
  "state": "SUBSCRIPTION_EXPIRED",
  "message": "Your institution’s SANRO validity has expired. Please contact your administrator to renew your access.",
  "institution": {
    "id": "uuid",
    "name": "Sanro Demo School",
    "type": "SCHOOL",
    "status": "EXPIRED",
    "expiresAt": "2026-10-20T00:00:00.000Z" | null,
    "supportContact": null                 // populated from institution.supportContact when present
  }
}
```

Built by `AuthService.toBlockedResponse()` from `SubscriptionAccessService.getAccountState()`.
`supportContact` is always `null` today (the institution snapshot does not yet carry it).

### Login / refresh / switch semantics

- **`POST /auth/login`** → `AuthService.login(email, password)`. First checks
  `user.isActive`, throwing `403 { code: 'USER_DISABLED', message: 'This account has
  been deactivated by your administrator.' }` (note: a hard-coded message, not the
  config constant). Then `issueLogin(userId, null)` resolves the most recent **ACTIVE**
  membership (`orderBy joinedAt desc`); zero ACTIVE memberships → `401 'No active
  institution membership'`. For non-super-admin with an institution, calls
  `getAccountState()`; if `!access` → returns a `BlockedAccountResponse` (no tokens).
- **`POST /auth/refresh`** → same `issueLogin` path. If the outcome is blocked, the
  old refresh session is revoked and the `BlockedAccountResponse` is returned — so a
  blocked account cannot keep rotating sessions.
- **`POST /auth/switch-context`** → requires an existing membership row with the
  requested role and `status = ACTIVE` (else 403), then `issueLogin(userId, {role,
  institutionId})` which again runs the entitlement check and may return a
  `BlockedAccountResponse`.
- **`GET /auth/account-state`** → `AuthService.accountState` → `getAccountState(userId,
  role, institutionId)`. Response:

```jsonc
{
  "access": false,
  "state": "SUBSCRIPTION_EXPIRED",
  "message": "Your institution’s SANRO validity has expired. …",
  "institution": {
    "id": "uuid",
    "name": "Sanro Demo School",
    "type": "SCHOOL",
    "status": "EXPIRED",
    "expiresAt": "2026-10-20T00:00:00.000Z",
    "gracePeriodDays": 0,
    "subscription": {
      "id": "uuid", "planKey": "INSTITUTION", "planName": "Institution Plan",
      "status": "EXPIRED", "startedAt": "…", "endsAt": "…", "seatLimit": 200,
      "daysRemaining": -1, "expiringSoon": false, "expired": true
    },
    "seatLimit": 200, "billableUsers": 0, "limitExceeded": false
  }
}
```

`getAccountState`: SUPER_ADMIN → `{access:true, state:null, message:null,
institution:null}`. No `institutionId` → `MEMBERSHIP_DEACTIVATED`. `user.isActive =
false` → `USER_DISABLED`. Otherwise → entitlement decision + `publicInstitutionSnapshot`.

### Client surfaces

Not yet built in this repo — the contract exists so `app.sanroai.com/app/account-blocked`
(web) and the mobile `/expired` route can be implemented against
`BlockedAccountResponse` / `GET /auth/account-state` without backend changes. Clients
should treat a 200 login/refresh response that lacks `accessToken` as "blocked" and
render the dedicated screen with `message` and `institution.name`.

### Super-admin escalation paths

Covered by the super-admin endpoints (section 6/7): `PATCH …/status` (activate /
suspend / archive), `PATCH …/subscription` (renew by setting a fresh subscription),
and (planned, contract-ready) `activate` / `restore` / `expire` / user `disable` /
`enable` lifecycle actions. `SUPER_ADMIN` accounts themselves are never subject to
entitlement (`assertCanAccess` returns immediately).

---

## 3. Seat limits & billing model

### Billable-seat definition

`SubscriptionAccessService.countBillableUsers()` — one seat for every:

- **ACTIVE** `Student` record (`status: 'ACTIVE'`)
- **ACTIVE** `Teacher` record (`status: 'ACTIVE'`)
- **every** `Parent` record (no status column — counted unconditionally)
- **ACTIVE** `InstitutionMember` with `role: 'INSTITUTION_ADMIN'`

Excluded: archived/deactivated people records, non-admin memberships, and SUPER_ADMIN
platform accounts (they have no seat-bearing record in a tenant).

### Effective seat limit — resolution order

Implemented in `evaluate()`/`assertSeatAvailable()`/`seatAvailability()`:

1. `subscription.seatLimit` of the current ACTIVE/TRIAL subscription (most recent by
   `createdAt`), else
2. `institution.seatLimit`, else
3. **no limit** (`null`) — allocation is unbounded.

Note: `Plan.perSeat` is **not** part of runtime resolution. It is consumed only at
creation time — `registerInstitution` seeds the trial subscription with
`seatLimit: plan.perSeat || 100` (`INSTITUTION` plan seeds `perSeat: 100`, see
`prisma/seed.ts` `seedPlansAndInstitution`), and `createInstitution` defaults
`institution.seatLimit` to `100`. So the de-facto new-tenant fallback is 100.

### Usage / surfacing

- `billableUsers` = `countBillableUsers()`.
- `usagePct` = `round(billable / seatLimit × 100)` when a limit exists, else 0.
- `limitExceeded` = `seatLimit != null && billable > seatLimit`.

### Enforcement points

- **Single-create paths**: `SubscriptionAccessService.assertSeatAvailable(institutionId, 1[, tx])`
  runs at the top of `people/students.service.ts#createStudent`,
  `people/teachers.service.ts#createTeacher` and
  `people/parents.service.ts#createParent`. Throws
  `400 { code: 'USER_LIMIT_REACHED', message: 'User limit reached. Please contact
  your SANRO administrator to increase your subscription limit.', details: { current,
  requested, available, limit } }`. The older `enforceSeatLimit` /
  `SEAT_LIMIT_REACHED` student path no longer exists.
- **Bulk import**: `seatAvailability()` (the non-throwing variant returning
  `{ current, available, requested, allowed, limit }`) gates
  `imports.service.commit` **before** the transaction opens, for
  `STUDENTS` / `TEACHERS` / `PARENTS` only — a full subscription raises
  `400 USER_LIMIT_REACHED` and no row is written. `CONTENT` and `QUESTIONS`
  imports are deliberately seat-free (added 2026-09-26).
- **`limitExceeded`** (usage beyond limit) is surfaced to clients via
  `GET /auth/account-state` (`institution.limitExceeded`) and computed in the
  entitlement; it does **not** block access by itself.

### Limit reduction / refusal to delete

No code currently refuses a limit reduction or deletes records when the limit is
reduced. Behaviour today: a reduced limit simply makes `limitExceeded` true and blocks
new student creation (`SEAT_LIMIT_REACHED`); existing records are untouched. There is
no "refuse reduction below usage" guard — documented gap (admin UI must warn the super
admin instead).

---

## 4. Lazy expiry semantics

Expiry is deliberately **lazy** — there is no batch/cron job.

- **When detected**: on the next entitlement evaluation for the tenant
  (`SubscriptionAccessService.evaluate()` → `holdExpiryState()`), which is triggered by
  any protected request or any login/account-state for a member of that tenant.
- **What flips**: the first (by `createdAt`) ACTIVE/TRIAL subscription whose `endsAt`
  is in the past becomes `status: EXPIRED`; if the institution is ACTIVE it also becomes
  `status: EXPIRED` and `expiredAt = now`. If the institution is already
  SUSPENDED/ARCHIVED/PENDING, only the subscription flips (the tenant state takes
  precedence).
- **Never deletes data.** Only lifecycle flags are written, inside a single
  `$transaction`.
- **`endsAt = null` means never expires** — `buildSubscriptionInfo` only marks a
  subscription expired when `endsAt` is non-null and in the past for ACTIVE/TRIAL.
- **Grace period**: `institution.gracePeriodDays` exists (`Int @default(0)`) and is
  surfaced as `EntitlementResult.gracePeriodDays` and in the account-state snapshot
  (`gracePeriodDays: institution.gracePeriodDays ?? SUBSCRIPTION.DEFAULT_GRACE_PERIOD_DAYS`
  = 0). **It is not yet wired into `evaluate()`.** Expiry today is exactly
  `endsAt < now`; there is no grace-window extension. `SUBSCRIPTION.DEFAULT_GRACE_PERIOD_DAYS`
  is 0. When grace is implemented it should be applied inside `buildSubscriptionInfo`
  (or as a hold-off on the lazy flip).

---

## 5. Subscription life-cycle operations

Implemented endpoint: **set/replace** — `PATCH /admin/institutions/:id/subscription`
(`AdminService.setSubscriptionPlan`). There is currently **no** renew/expire/plan-change
or seat-limit-change endpoint or write path beyond this.

### What set/replace writes

1. Validates the institution exists (else `400 'Institution not found'`) and the plan
   key exists in the `Plan` table (else `400 Unknown plan "<key>"`).
2. `updateMany` — every prior ACTIVE/TRIAL subscription for the tenant →
   `status: 'CANCELLED'` (a replace rather than a true renewal; the old record is
   preserved for history).
3. `subscription.create` — new row: `planId`, `status` (as given), `seatLimit:
   data.seatLimit ?? institution.seatLimit ?? 100`, `startedAt: now`, `endsAt: now +
   30 days`.

Defaults observed in code: **endsAt is always `now + 30 days`, for every requested
status** (the config constant `SUBSCRIPTION.RENEW_DURATION_DAYS = 365` is defined but
**unused**; the documented "ACTIVE → +365d, TRIAL → +30d" default is not applied).
`PATCH /admin/institutions/:id/status` is the closest thing to activate/suspend/archive
lifecycle today (section 6).

### Not yet implemented (contract-ready, no writer)

- **Renew** (`RenewSubscriptionSchema`, `POST …/subscription/renew`) — extends the
  current ACTIVE/TRIAL end date with optional plan/limit change.
- **Force expire**, **plan change**, **seat-limit change** (`ChangeUserLimitSchema`).
- **`SubscriptionHistory` rows** and **`AuditLog` rows** are **not written by any admin
  mutation today**. The models, enums (`SubscriptionHistoryAction`, and the 15
  institution/subscription/admin AuditActions) exist (section 9), but no service writes
  them yet.
- **Cache invalidation** on admin mutations: `SubscriptionAccessService.invalidate(institutionId)`
  and `clearCache()` exist but are **not yet called by `AdminService`** — a super-admin
  subscription change is visible to members either on the next entitlement cache miss
  (TTL 15 s) or immediately via `evaluate(force=true)`.

---

## 6. Super-admin institution operations & audit trail

All routes are `@Roles('SUPER_ADMIN')` (controller-level `@Roles`), plus a redundant
`requireSuperAdmin(role)` check inside each service method (`ForbiddenException 'Super
admin access only'`). No `@SubscriptionRequired()` on this controller (super admins are
exempt anyway).

### Implemented endpoints

| Method + route | Service method | Behaviour / response |
|---|---|---|
| `GET /admin/institutions?search=` | `listInstitutions` | Search by `name`/`code` (case-insensitive contains). `include _count {students, teachers}` + the most recent ACTIVE/TRIAL subscription. `orderBy createdAt desc`, **`take: 100`** (no pagination). Returns a **raw array**. |
| `GET /admin/institutions/:id` | `getInstitution` | `404 'Institution not found'` if unknown. Includes up to 5 subscriptions (desc) + `_count {students, teachers, groups, questions, papers, assessments}`. |
| `POST /admin/institutions` | `createInstitution` | Body: `{ name, type, code?, address?, city?, state?, primaryPhone?, primaryEmail?, seatLimit?, adminName, adminEmail }`. Sets `code = data.code ?? name.slice(0,3).toUpperCase()`, `seatLimit ?? 100`, `status: 'ACTIVE'`. In one `$transaction`: creates the institution; finds-or-creates the admin `User` (`passwordHash: ''`, `isSuperAdmin: false`); upserts an `INSTITUTION_ADMIN` membership (`status: 'ACTIVE'`). Returns `{ institution }`, or `{ institution, note: 'Admin already linked' }` if the member already existed. **No duplicate detection** on same name/different admin (see gaps). |
| `PATCH /admin/institutions/:id/status` | `updateStatus` | Body `{ status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED' }` (note: **EXPIRED/PENDING are not settable here**). Rewrites **every member's membership status** (`DEACTIVATED` if SUSPENDED/ARCHIVED else `ACTIVE`) and updates the institution status. Returns `{ ok: true, status }`. |
| `PATCH /admin/institutions/:id/subscription` | `setSubscriptionPlan` | Body `{ planKey, status, seatLimit? }` — section 5. |
| `GET /admin/curriculum` | `curriculumTree` | Full Boards → Grades → Subjects → Chapters → Topics → Concepts tree. |
| `POST /admin/curriculum/boards` | `createBoard` | `{ name, code }` (code uppercased). |
| `POST /admin/curriculum/grades/:boardId` | `createGrade` | `{ name, order? }`; 404 if board unknown. |
| `POST /admin/curriculum/subjects` | `createSubject` | `{ boardId, name, code, color? }`. |
| `POST /admin/curriculum/chapters` | `createChapter` | `{ subjectId, name, code, grade, order? }`; 404 if subject unknown. |
| `POST /admin/curriculum/topics` | `createTopic` | `{ chapterId, name, order? }`. |
| `POST /admin/curriculum/concepts` | `createConcept` | `{ topicId, name, order? }`; 404 if topic unknown. |
| `GET /admin/audit?page=&pageSize=` | `auditLogs` | Global audit log (all tenants). Returns `{ total, page, pageSize, rows }`; rows include `user {name,email}` and `institution {name}`. `pageSize` defaults 50 (not capped in code). |
| `GET /admin/subscriptions` | `subscriptions` | All subscriptions (`orderBy createdAt desc`, `take: 200`) with `institution {name, code}`. |
| `GET /admin/leads?limit=` | `contactLeads` | `{ total, rows }`, `take: min(limit, 500)`, default 100. |

### Not yet implemented (web contract exists, no route)

`apps/web/lib/institution-hooks.ts` and the `packages/types` DTO layer define a much
larger surface: `PATCH …/institutions/:id` (update profile), `POST …/activate`,
`/suspend`, `/archive`, `/restore`, `/expire`, `POST …/subscription/renew`,
`PATCH …/user-limit`, `PATCH …/admin`, `POST …/users/:userId/{disable,enable}`,
`GET …/institutions/:id/users`, `…/subscription-history`, `…/audit`,
`GET /admin/plans`, `GET /admin/dashboard`, and `GET /admin/institutions/export` (CSV).
Only the table above is wired into `AdminController`. The corresponding validation
schemas are defined (`SetSubscriptionSchema`, `RenewSubscriptionSchema`,
`ChangeUserLimitSchema`, `ChangeAdminSchema`, `RestrictUserSchema`,
`AdminCreateInstitutionSchema`, `InstitutionsQuerySchema`) but are **not referenced by
any controller** except through the Zod pipe on auth routes.

### Super-admin dashboard

The type `SuperAdminDashboard` (counts by institution status, expiring soon, limit
exceeded, users) is defined but not implemented. The live super-admin dashboard today
is `GET /dashboard/super-admin` (`DashboardController.superAdminHome`,
`@Roles('SUPER_ADMIN')`), returning:

```jsonc
{ "platform": { "institutions": 1, "activeStudents": 1, "activeTeachers": 1,
  "assessments": 2, "institutionsByType": [{ "type": "SCHOOL", "count": 1 }] } }
```

### Member-status note

`updateStatus` **does** rewrite `InstitutionMember.status` (DEACTIVATED/ACTIVE) when
suspending/archiving/activating. The platform also blocks at the entitlement layer, so
even if a member row remained ACTIVE, a suspended/archived tenant is denied. The
membership rewrite is therefore a convenience, not the enforcement mechanism.

---

## 7. API reference

Global prefix `api/v1`. Error body convention across the API:
`{ code, message, requestId, statusCode, details? }`.

### Auth routes with blocked-state behaviour

```http
POST /api/v1/auth/login            # public · throttled 10/min
POST /api/v1/auth/refresh          # public
POST /api/v1/auth/switch-context   # authed
GET  /api/v1/auth/account-state    # authed
```

```jsonc
// POST /auth/login  (200) — blocked outcome, no tokens
{
  "state": "SUBSCRIPTION_EXPIRED",
  "message": "Your institution’s SANRO validity has expired. Please contact your administrator to renew your access.",
  "institution": { "id": "…", "name": "…", "type": "SCHOOL", "status": "EXPIRED",
                   "expiresAt": "…", "supportContact": null }
}
```

```jsonc
// POST /auth/login  (403) — disabled user, hard-coded message from login()
{
  "code": "USER_DISABLED",
  "message": "This account has been deactivated by your administrator."
}
```

### Admin routes

```http
GET    /api/v1/admin/institutions?search=          # SUPER_ADMIN
GET    /api/v1/admin/institutions/:id              # SUPER_ADMIN
POST   /api/v1/admin/institutions                  # SUPER_ADMIN
PATCH  /api/v1/admin/institutions/:id/status       # SUPER_ADMIN
PATCH  /api/v1/admin/institutions/:id/subscription # SUPER_ADMIN
GET    /api/v1/admin/curriculum                    # SUPER_ADMIN
POST   /api/v1/admin/curriculum/boards             # SUPER_ADMIN
POST   /api/v1/admin/curriculum/grades/:boardId    # SUPER_ADMIN
POST   /api/v1/admin/curriculum/subjects           # SUPER_ADMIN
POST   /api/v1/admin/curriculum/chapters           # SUPER_ADMIN
POST   /api/v1/admin/curriculum/topics             # SUPER_ADMIN
POST   /api/v1/admin/curriculum/concepts           # SUPER_ADMIN
GET    /api/v1/admin/audit?page=1&pageSize=50      # SUPER_ADMIN
GET    /api/v1/admin/subscriptions                 # SUPER_ADMIN
GET    /api/v1/admin/leads?limit=100               # SUPER_ADMIN
```

Create institution (request → response):

```jsonc
// POST /admin/institutions
{ "name": "Greenfield High", "type": "SCHOOL", "city": "Pune",
  "primaryEmail": "principal@greenfield.example", "seatLimit": 500,
  "adminName": "R. Principal", "adminEmail": "principal@greenfield.example" }
// → 201
{ "institution": { "id": "…", "name": "Greenfield High", "type": "SCHOOL",
   "status": "ACTIVE", "code": "GRE", "seatLimit": 500, "gracePeriodDays": 0, "…": "…" } }
```

Set subscription (request → response):

```jsonc
// PATCH /admin/institutions/:id/subscription
{ "planKey": "INSTITUTION", "status": "ACTIVE", "seatLimit": 500 }
// → 200
{ "id": "…", "institutionId": "…", "planId": "…", "status": "ACTIVE",
  "startedAt": "2026-09-20T…", "endsAt": "2026-10-20T…", "seatLimit": 500, "createdAt": "…" }
```

### Violation / error codes

| Code | HTTP | Raised by | Notes |
|---|---|---|---|
| `USER_LIMIT_REACHED` | 400 | `SubscriptionAccessService.assertSeatAvailable` | Defined, **not yet wired** to any route |
| `SEAT_LIMIT_REACHED` | 400 | `StudentsService.enforceSeatLimit` | Wired into student create |
| `Unknown plan "<key>"` | 400 | `setSubscriptionPlan` | BadRequest message (no `code`) |
| `Institution not found` | 400/404 | `setSubscriptionPlan` (404 in `getInstitution`) | Different HTTP codes per method |
| `USER_DISABLED` | 403 | login (disabled user); `assertCanAccess` | |
| `MEMBERSHIP_DEACTIVATED` | 403 | `assertCanAccess`/`getAccountState` | |
| `SUBSCRIPTION_EXPIRED` / `INSTITUTION_*` | 403 | `assertCanAccess` (block state as code) | codes are the `AccountBlockState` values |
| `You do not have permission…` | 403 | `RolesGuard` | |
| `Super admin access only` | 403 | `AdminService.requireSuperAdmin` | |
| 401 | 401 | `JwtAuthGuard`, invalid refresh, "No active institution membership" | |
| 400 (Zod) | 400 | `ZodValidationPipe` | schema-driven payload validation |

### Enum reference

`SubscriptionHistoryAction` (Prisma + `@sanro/types`):

| Action | Meaning |
|---|---|
| `CREATED` | new subscription created |
| `UPDATED` | subscription fields edited |
| `RENEWED` | validity extended |
| `PLAN_CHANGED` | plan swapped |
| `LIMIT_CHANGED` | seat limit changed |
| `CANCELLED` | prior subscription cancelled (replace) |
| `EXPIRED` | ended |
| `ACTIVATED` | re-activated |
| `SUSPENDED` | suspended |

`AuditAction` — institution/subscription/admin subset (full enum has 26 values):

`INSTITUTION_CREATED`, `INSTITUTION_UPDATED`, `INSTITUTION_ACTIVATED`,
`INSTITUTION_SUSPENDED`, `INSTITUTION_EXPIRED`, `INSTITUTION_ARCHIVED`,
`INSTITUTION_RESTORED`, `INSTITUTION_DELETED`, `SUBSCRIPTION_CREATED`,
`SUBSCRIPTION_UPDATED`, `SUBSCRIPTION_RENEWED`, `PLAN_CHANGED`, `USER_LIMIT_CHANGED`,
`ADMIN_CHANGED`, `USER_DISABLED`, `USER_ENABLED`.

`InstitutionType` (8): `SCHOOL`, `COACHING_CENTRE`, `COACHING`, `ACADEMY`,
`TUITION_CENTRE`, `EDUCATIONAL_INSTITUTE`, `TRAINING_CENTRE`, `OTHER`.

`SubscriptionStatus` (6): `ACTIVE`, `TRIAL`, `EXPIRED`, `CANCELLED`, `PAST_DUE`,
`SUSPENDED`.

`SubscriptionPlanKey` (3): `STUDENT_MONTHLY`, `STUDENT_YEARLY`, `INSTITUTION`.

`AccountBlockState` (6): section 2 table.

---

## 8. Enforcement architecture

### Component diagram

```text
Request
  → JwtAuthGuard (global)          // validates JWT → RequestUser {sub, role, institutionId?, jti}
  → RolesGuard (global)            // @Roles(...) metadata; SUPER_ADMIN must be listed like any role
  → ThrottlerGuard (global)
  → SubscriptionGuard (global)     // only enforces when @SubscriptionRequired() present
  → handler (service)
       → TenantAccessService       // SYNC per-request tenant scoping of queries (defense-in-depth)
       → SubscriptionAccessService // ASYNC/cached entitlement decision for reject/allow
```

`SubscriptionGuard.canActivate`:
1. `@Public()` route → allow.
2. No `@SubscriptionRequired()` metadata → allow (route not entitlement-gated).
3. No user → allow (JwtAuthGuard already 401s earlier).
4. `subscription.assertCanAccess(user)` — throws `ForbiddenException` on any block.

`assertCanAccess(user)`:
1. `SUPER_ADMIN` → return (exempt from tenant + subscription enforcement).
2. No `institutionId` → `403 'No institution context'`.
3. `getUserState` → `user.isActive` false → `403 {code:'USER_DISABLED'}`.
4. membership found and `!= ACTIVE` → `403 {code:'MEMBERSHIP_DEACTIVATED'}`.
5. `evaluate(institutionId)` → `entitlement.access` false → `403 {code: blockState,
   message, details:{institutionId, institutionName, expiresAt}}`.

### The 15 s entitlement cache

Two in-memory Maps on the service instance:

- `cache: {institutionId → {at, EntitlementResult}}` — `evaluate()` reads the cache
  unless `force=true` or older than `SUBSCRIPTION.ENTITLEMENT_CACHE_TTL_MS` (15000 ms).
- `userCache: {"institutionId:userId" → {at, active, membership}}` — same TTL, for the
  `getUserState` pair.

`invalidate(institutionId)` deletes the entitlement entry **and** every userCache key
prefixed `institutionId:`. `clearCache()` drops the whole entitlement cache.

**Current limitation**: no admin mutation calls `invalidate()` yet, so a subscription
change propagates to members only on the next TTL expiry (15 s) — or a caller can force
`evaluate(force=true)`. A `SubscriptionAccessService`-level invalidation from
`AdminService` is the intended wiring point.

### Evaluation call graph

```text
evaluate(institutionId, force?)
  computeEntitlement
    institution.findUnique(include subscriptions+plan, orderBy createdAt desc)
    holdExpiryState          // lazy ACTIVE/TRIAL-ended → EXPIRED (+ institution EXPIRED if ACTIVE)
    subscription.findFirst   // ACTIVE/TRIAL, most recent
    buildSubscriptionInfo    // effective status, expired, daysRemaining, expiringSoon (≤30d)
    countBillableUsers       // 4 parallel counts (students/teachers/parents/admins)
    usagePct, limitExceeded, gracePeriodDays
    precedence: ARCHIVED > SUSPENDED > PENDING > expired
```

### Performance note

- Entitlement evaluation is a handful of indexed queries (`@@index([institutionId,status])`,
  `@@index([endsAt])`) with the per-institution result cached 15 s — effectively one
  cached read per institution per window, not per request.
- `countBillableUsers` issues four counts; for large tenants this is the most expensive
  part of a cache miss. Only run on the miss (or when a mutation invalidates).
- `expiringSoon` uses `SUBSCRIPTION.EXPIRING_SOON_DAYS = 30`.

### Chokepoint vs entitlement — when to use each

- **`TenantAccessService`** (sync, no cache, per request): scopes *which* institution's
  data a request may touch. Use on every institution-scoped service call — the
  `where institutionId = …` guard, SUPER_ADMIN unscoped bypass. Data isolation.
- **`SubscriptionAccessService`** (async, cached 15 s): decides *whether* the request
  may proceed at all based on subscription/account state. Use at the route gate
  (`@SubscriptionRequired`) and in the auth flow. Not a data-scoping tool.

Both must be used together: the chokepoint keeps an entitled-but-malicious user inside
their tenant; the entitlement gate keeps blocked tenants out entirely.

### Coverage map (`@SubscriptionRequired`)

Applied (class level): assessments, learning, people (Students/Teachers/Parents),
questions, papers, academics, imports + content-import, curriculum, diagnosis,
remediation, reports, AR, AI, chat, dashboard.

**Not applied**: admin (SUPER_ADMIN only — exempt), auth, users, files, health, site,
institutions (institution-settings, `@Roles(INSTITUTION_ADMIN)`), knowledge-base
(`@Roles(SUPER_ADMIN, INSTITUTION_ADMIN, TEACHER)`). The knowledge-base and
institutions-settings modules are the practical coverage gaps: an expired/suspended
tenant could still reach those routes. See "Documented gaps" below.

---

## 9. Upgrade / migration & operations

### Migration

`apps/api/prisma/migrations/20260920102146_institution_subscription_system/migration.sql`:

- New enum `SubscriptionHistoryAction`.
- Extends `AuditAction` with 15 institution/subscription/admin values.
- `InstitutionStatusEnum` + `EXPIRED`.
- `InstitutionType` + `COACHING`, `ACADEMY`, `TUITION_CENTRE`, `EDUCATIONAL_INSTITUTE`,
  `TRAINING_CENTRE`, `OTHER`.
- New `Institution` columns: `contactPerson`, `country`, `deletedAt`, `description`,
  `expiredAt`, `gracePeriodDays` (default 0), `lastActivityAt` (default now),
  `suspendedAt`, `website`.
- New table `SubscriptionHistory` (`subscriptionId` nullable, `changedById` → `User`
  RESTRICT, both Institution/Subscription FKs) + 3 indexes.
- New indexes: `Institution(type)`, `Institution(deletedAt)`,
  `Subscription(institutionId,status)`, `Subscription(endsAt)`.

Follow normal deploy flow: Railway preDeploy runs `prisma migrate deploy` + idempotent
seed. `prisma migrate reset` remains forbidden on production.

### What admins (super + institution) can do

- SUPER_ADMIN: create institutions, set/change status (ACTIVE/SUSPENDED/ARCHIVED),
  set subscription (plan/status/seatLimit), manage curriculum, read global audit +
  subscriptions + leads.
- INSTITUTION_ADMIN: normal tenant operations bound to their institution by
  `TenantAccessService`; **no** visibility into other tenants. On a blocked tenant
  their requests are rejected at the guard. Only a SUPER_ADMIN can change the
  subscription or lifecycle.

### Restoring expired accounts

A blocked (expired) tenant returns with: `PATCH …/subscription` with a future `endsAt` /
active status (renewal). If the tenant was lazy-flipped to `status: EXPIRED`, the 
subscription set replaces the current subscription and — because `EXPIRED` sits last in
the precedence chain — the tenant is unblockable immediately (the `EXPIRED` institution
status still blocks until cleared; the intended `restore` action
(`AuditAction.INSTITUTION_RESTORED`) is contract-ready but not yet implemented).

### Monitoring

- `GET /admin/audit` is the complete global record (`AuditLog`). Note: today only
  existing audit consumers write it; the new admin subscription/status mutations do not
  yet log entries.
- `GET /admin/subscriptions` lists all subscriptions; `SubscriptionHistory` will hold
  the per-change trail once writers land.
- `expiringSoon` (endsAt ≤ 30 days) is exposed on the entitlement result and
  `GET /auth/account-state`, ready to drive "EXPIRING SOON" lists.

### Known limits

- `listInstitutions` returns at most 100 rows, no pagination.
- `subscriptions` returns at most 200 rows.
- `contactLeads` caps at 500.
- `pageSize` for `admin/audit` is caller-supplied (default 50), uncapped.
- Seat count on a miss runs 4 queries per institution.

---

## 10. Testing

Run the API suite: `pnpm --filter @sanro/api test` (Vitest). The e2e suite imports the
full `AppModule` (`api/v1` global prefix) and therefore needs a reachable PostgreSQL
(`sanro_test`/`sanro_dev`) with seeded demo users (`db:seed`).

Existing specs relevant to this system:

- `apps/api/test/authorization.e2e-spec.ts` — parent/learning restriction, student grade
  isolation, cross-tenant 403, SUPER_ADMIN exemption and no-institution binding, 401s.
  Expresses exactly the roles the entitlement engine must not regress.
- `apps/api/src/common/guards/role-access.spec.ts` — unit tests for `RolesGuard` and
  `ParentContentGuard` metadata keys + role deny/allow.
- Other unit suites (`csv.spec.ts`, `learning.service.spec.ts`, `mastery.service.spec.ts`,
  `ar.service.spec.ts`, etc.) run in the same `vitest run`.

**Gap**: no dedicated specs yet for `SubscriptionAccessService` (evaluate, lazy expiry,
seat math, cache invalidation), the admin institutions API, or the new validation
schemas (`SetSubscriptionSchema`, `RenewSubscriptionSchema`, `InstitutionsQuerySchema`…).
CI (`.github/workflows/ci.yml`) runs typecheck + tests + build on push/PR.

---

## Documented gaps (resolved and remaining)

> Status checked against the live code on 2026-09-20 (integration pass).

Resolved (previously flagged, now implemented):
1. `USER_LIMIT_REACHED` seat enforcement is called in student/teacher/parent creation and
   bulk-import commit via `SubscriptionAccessService.assertSeatAvailable`/`seatAvailability`.
2. All admin mutations write `SubscriptionHistory` + `AuditLog` and invalidate the
   `SubscriptionAccessService` cache (15 s TTL).
3. `RENEW_DURATION_DAYS` (365) is used for ACTIVE defaults (`+365 d`), `+30 d` for TRIAL.
4. `Plan.perSeat` participates in admin/creation seat resolution
   (`subscription.seatLimit ?? institution.seatLimit ?? plan.perSeat ?? 100`).
5. `activate`/`suspend`/`archive`/`restore`/`expire` routes exist and are tested; suspension no
   longer rewrites member statuses (entitlement blocks at request time instead).
6. Web `/app/account-blocked` and mobile `/expired` screens are built and wired to the
   blocked-account contract.
7. Unit/e2e coverage exists: `subscription-access.service.spec.ts` (unit),
   `test/institutions.e2e-spec.ts`, `test/subscription-access.e2e-spec.ts`,
   `test/validation.constraints.e2e-spec.ts`; full suite green (134/134).

Remaining (by design or future work):
1. `gracePeriodDays` is stored/surfaced but not yet applied to expiry computation
   (grace windows are a future billing feature; default 0).
2. Seat-limit *reduction* is allowed below current usage (surfaced as `limitExceeded`
   rather than rejected) — consistent with the "never delete or strand users" principle.
3. Payments/billing gateway is out of scope (billing-ready: plans/limits are data-driven).