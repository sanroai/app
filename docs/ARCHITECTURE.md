# SANRO AI — Architecture

Backend architecture overview, module map and guard/entitlement flow. For the
institution-management + subscription/access-control subsystem in depth, see
`docs/INSTITUTION_MANAGEMENT.md`. For the domain/data model, see `docs/DATABASE.md`.

## 1. System shape

- **Monorepo** (pnpm workspaces + Turborepo): `apps/api` (NestJS, port 4000, global
  prefix `api/v1`), `apps/web` (Next.js, 3000), `apps/mobile` (Expo SDK 52), and
  `packages/{types,validation,config}` shared contracts. Build order:
  types → validation → config → API → web.
- **Database**: PostgreSQL via Prisma. Migrations in `apps/api/prisma/migrations`
  (deploy runs `prisma migrate deploy` + idempotent seed). `migrate reset` is
  forbidden on production.
- **Runtime guards** are registered globally in `app.module.ts` in order:
  `JwtAuthGuard → RolesGuard → ThrottlerGuard → SubscriptionGuard` (all four are
  `APP_GUARD` providers).

## 2. Module diagram

```text
app.module.ts (API)                                shared contracts
  ├─ AuthModule        login/refresh/switch/account-state/register-institution
  ├─ UsersModule       /users/me profile
  ├─ InstitutionsModule  /institutions (settings, INSTITUTION_ADMIN)
  ├─ AcademicsModule   /academics (academic years, groups)
  ├─ PeopleModule      /students /teachers /parents  (@SubscriptionRequired)
  ├─ CurriculumModule  /curriculum (@SubscriptionRequired)
  ├─ QuestionsModule   /questions (@SubscriptionRequired)
  ├─ PapersModule      /papers (@SubscriptionRequired)
  ├─ AssessmentsModule /assessments (@SubscriptionRequired)
  ├─ DiagnosisModule   /diagnosis (@SubscriptionRequired)
  ├─ RemediationModule /remediation (@SubscriptionRequired)
  ├─ LearningModule    /learning (@SubscriptionRequired)
  ├─ ReportsModule     /reports (@SubscriptionRequired)
  ├─ ImportsModule     /imports + content-import (@SubscriptionRequired)
  ├─ DashboardModule   /dashboard (@SubscriptionRequired)
  ├─ AdminModule       /admin (SUPER_ADMIN only — institution mgmt + curriculum)
  ├─ AI/AR/Chat/KnowledgeBase/Reports/PDF/Files/Site/Health
  └─ CommonModule (global)
       ├─ PrismaService
       ├─ TenantAccessService          // sync tenant scoping chokepoint
       ├─ SubscriptionAccessService    // async/cached entitlement engine
       ├─ AuditService / NotificationsService / StudentIdentityService / StorageService
```

Key cross-cutting pieces in `apps/api/src/common/`:

- `security/tenant-access.service.ts` — per-request tenant chokepoint.
- `security/subscription-access.service.ts` — subscription/seat/access entitlement.
- `guards/subscription.guard.ts` + `decorators/auth.decorators.ts`
  (`@SubscriptionRequired()`) — route-level entitlement gate.
- `guards/jwt-auth.guard.ts`, `guards/roles.guard.ts`, `guards/parent-content.guard.ts`.

## 3. Request enforcement flow

```text
Request → JwtAuthGuard → RolesGuard → ThrottlerGuard → SubscriptionGuard
  → handler (service methods)
       → TenantAccessService.assertInstitutionAccess(user, institutionId)
            // SYNC, every tenant-scoped query; returns the effective institutionId
       → SubscriptionAccessService.assertCanAccess(user)   // via guard when @SubscriptionRequired
            // ASYNC, cached 15 s; throws ForbiddenException{code} when blocked
```

- JwtAuthGuard: 401 without a valid token; builds `RequestUser {sub, role,
  institutionId?, jti}`.
- RolesGuard: honours `@Roles(...)`; **no SUPER_ADMIN auto-passthrough** — a route
  restricted to `STUDENT` will deny a super admin too.
- SubscriptionGuard: `@Public()` → allow; no `@SubscriptionRequired()` metadata →
  allow; `SUPER_ADMIN` → allow (exempt). Otherwise `assertCanAccess`:
  user disabled (`USER_DISABLED`) → membership not ACTIVE (`MEMBERSHIP_DEACTIVATED`)
  → entitlement decision (`SUBSCRIPTION_EXPIRED`, `INSTITUTION_SUSPENDED`,
  `INSTITUTION_ARCHIVED`, `INSTITUTION_PENDING`).

Blocked-state decisions are shared with the auth flow: login/refresh/switch-context
return a `BlockedAccountResponse` (no tokens) instead of throwing, and
`GET /auth/account-state` returns the normalized decision the web/mobile clients
render on their blocked screens.

## 4. Blocked-account journey (summary)

1. Tenant's subscription ends; nothing happens until the next `evaluate()` for that
   tenant (lazy expiry — no batch job). The ended ACTIVE/TRIAL subscription flips to
   `EXPIRED` and an ACTIVE institution flips to `EXPIRED` (+`expiredAt`).
   Data is never deleted.
2. A member tries to log in (`/auth/login`), refresh, or switch context: the engine
   returns `BlockedAccountResponse { state, message, institution }` — no tokens, HTTP
   200, refresh session revoked.
3. An already-authenticated member hits a `@SubscriptionRequired()` route: the guard
   throws `403 { code: <blockState>, message, details }`.
4. `GET /auth/account-state` gives the client a stable, non-throwing read of the same
   decision so web (`/app/account-blocked`) and mobile (`/expired`) can render an
   explainer + escalation path.
5. SUPER_ADMIN escalations: `PATCH /admin/institutions/:id/status` (activate /
   suspend / archive), `PATCH /admin/institutions/:id/subscription` (set/renew).
   Restore / expire / disable user routes are contract-ready but not yet wired.

Full matrix and contracts: `docs/INSTITUTION_MANAGEMENT.md` §1–2.

## 5. Multi-tenant layering

- Token embeds `institutionId`; context switch re-issues a token with the new tenant.
- `TenantAccessService` centralizes tenant scoping; services never take a tenant from
  the request body for scoping.
- Entitlement (`SubscriptionAccessService`) and tenant scoping (`TenantAccessService`)
  are complementary: one decides access, the other bounds data.