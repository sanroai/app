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
2. `RolesGuard` (global) — checks `@Roles(...)` metadata;
   SUPER_ADMIN always passes.
3. `TenantAccessService` — scopes queries to JWT institutionId; verifies
   membership; SUPER_ADMIN bypass only via `@TenantOptional()`.
4. `ParentContentGuard` — route guard that restricts PARENT to safe, read-only,
   non-explicit content.
5. Data-layer scoping (services compute `where institutionId = …` from token;
   never from client body IDs).

## 4. Decorators

- `@Public()` — bypass auth (health, files, auth endpoints).
- `@Roles(...)` — allowed roles for route.
- `@TenantOptional()` — SUPER_ADMIN access without institutionId.
- `@CurrentUser()` — inject `RequestUser { sub, role, institutionId?, … }`.

## 5. Rate Limiting

- Global: 60 req/min.
- Auth-specific: login 10/min, register 5/min, forgot-password 3/min.

## 6. Session Edge Cases

Handle: expired JWT, refresh failure, logout, revoked role, changed
permissions, disabled user, role changes, multi-device. On disable/revoke,
refresh endpoint must reject and client must logout.