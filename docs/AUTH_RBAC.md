# SANRO AI — Auth & RBAC

## 1. Authentication

- **Password**: bcrypt (cost ≥ 10). Never stored/logged raw.
- **Session**: JWT access token (15 min) + opaque refresh token (30 days)
  stored in `RefreshToken` table (revocable, rotating).
- **Login flow** returns `{ token, refreshToken, user, memberships }` where
  memberships resolve roles + institution.
- **Forgot/reset**: crypto-random token, store hash, `{ success: true }`
  response (token never returned). Handle unknown email, expired/used/invalid
  token, weak password, mismatch.
- **Refresh**: exchange refresh → new pair; old revoked. Single-flight on client.
- Storage: web Zustand persist `sanro-auth` (localStorage), mobile SecureStore
  (`sanro-token`/`sanro-refresh`/`sanro-user`).

## 2. Roles

- SUPER_ADMIN — platform-wide (no institution membership required).
- INSTITUTION_ADMIN (principal) — own institution.
- TEACHER — assigned scope.
- STUDENT — own learning/assessment.
- PARENT — children's data only; no learning player access.

Role lives on `InstitutionMember`, not `User`.

## 3. Enforcement Layers

1. `JwtAuthGuard` (global) — validates JWT, builds `RequestUser`.
2. `RolesGuard` (global) — checks `@Roles(...)` metadata. No SUPER_ADMIN
   auto-passthrough: the super admin must be listed explicitly (e.g. admin routes
   are `@Roles('SUPER_ADMIN')`).
3. `SubscriptionGuard` (global) — entitlement gate; only active when
   `@SubscriptionRequired()` is set. `@Public()` routes bypass. `SUPER_ADMIN` is
   exempt from entitlement checks (no institution binding).
4. `TenantAccessService` — scopes queries to JWT institutionId; verifies
   membership; SUPER_ADMIN bypass only via `@TenantOptional()`.
5. `SubscriptionAccessService` — shared entitlement engine (institution status,
   subscription validity, seat limits, user/membership state); cached 15 s,
   invalidatable. Used by the guard, auth flow and account-state endpoint.
6. `ParentContentGuard` — route guard that restricts PARENT to safe, read-only,
   non-explicit content.
7. Data-layer scoping (services compute `where institutionId = …` from token;
   never from client body IDs).

Enforcement order per request: JwtAuthGuard → RolesGuard → ThrottlerGuard →
SubscriptionGuard → handler → TenantAccessService/SubscriptionAccessService.
Seat limits and subscription/access control: see `docs/INSTITUTION_MANAGEMENT.md`.

## 4. Decorators

- `@Public()` — bypass auth (health, files, auth endpoints).
- `@Roles(...)` — allowed roles for route.
- `@TenantOptional()` — SUPER_ADMIN access without institutionId.
- `@SubscriptionRequired()` — enforce institution entitlement on route (global
  SubscriptionGuard picks it up; without it the route is not entitlement-gated).
- `@CurrentUser()` — inject `RequestUser { sub, role, institutionId?, … }`.

## 5. Blocked Account States & Subscription Entitlement

When an authenticated account is blocked (expired / suspended / archived / pending /
disabled / membership deactivated), no tokens are issued:

- **login / refresh / switch-context** return HTTP 200 with a `BlockedAccountResponse`
  body: `{ state, message, institution?: { id, name, type, status, expiresAt,
  supportContact } }` — no `accessToken`/`refreshToken` present. `refresh` also
  revokes the stale session. Six states: `SUBSCRIPTION_EXPIRED`,
  `INSTITUTION_SUSPENDED`, `INSTITUTION_ARCHIVED`, `INSTITUTION_PENDING`,
  `USER_DISABLED`, `MEMBERSHIP_DEACTIVATED` (`AccountBlockState`).
- A disabled user hitting login directly is thrown `403 { code: 'USER_DISABLED',
  message: 'This account has been deactivated by your administrator.' }`.
- **`GET /auth/account-state`** (authed, non-throwing) returns
  `{ access, state?, message?, institution? }` with a public institution snapshot
  (subscription, seatLimit, billableUsers, limitExceeded). SUPER_ADMIN always gets
  `{ access: true, state: null, institution: null }`.
- Entitlement precedence: user disabled → membership not ACTIVE → institution
  ARCHIVED → SUSPENDED → PENDING → subscription expired. See the state matrix in
  `docs/INSTITUTION_MANAGEMENT.md` §1.

Messages live in `BLOCKED_ACCOUNT_MESSAGES` (`packages/config`). Clients should treat
a 200 login/refresh without `accessToken` as blocked and render a blocked-account
screen (web `/app/account-blocked`, mobile `/expired` — screens not yet built).

## 6. Rate Limiting

- Global: 60 req/min.
- Auth-specific: login 10/min, register 5/min, forgot-password 3/min.

## 7. Session Edge Cases

Handle: expired JWT, refresh failure, logout, revoked role, changed
permissions, disabled user, role changes, multi-device. On disable/revoke,
refresh endpoint must reject and client must logout.