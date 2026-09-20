# SANRO AI — Security

## 1. Mandatory Controls

- RBAC on all mutation endpoints
- Tenant isolation (backend-enforced, never frontend IDs)
- Zod validation with `forbidUnknownValues: true`
- Rate limiting (global 60/min; auth-specific 10/5/3 per min)
- Secure headers (Helmet/next security headers)
- CORS locked to explicit origins: sanroai.com, app.sanroai.com,
  www.sanroai.com
- JWT secret ≥ 32 chars; production refuses values starting `dev-`
- Production secrets outside source control (verified: no env tracked)
- AI keys server-side only
- Signed storage URLs (R2/S3 presigner, 1h expiry)
- Upload limits (10 MB student import, 50 MB content, 50 MB AR model, 5 MB AR
  image) + MIME validation
- Audit logs (AuditLog): user creation, role changes, content publish/archive,
  question approval, assessment publish/changes, student import, permission
  changes, sensitive admin actions
- Authorization on every mutation; no production DB reset (`migrate reset`
  forbidden)

## 2. Auth Security

- bcrypt password hashing; raw passwords never logged/stored
- JWT 15-min + rotating 30-day refresh (server-side, revocable)
- Forgot-password returns only `{ success: true }` (raw token never sent back)
- Reset tokens: hash stored, expiry + used-tracking, mismatch/weak-password
  handling

## 3. Data Security

- Parent lockout from learning content (ParentContentGuard + API-level rule)
- Cross-tenant direct object-ID access rejected by TenantAccessService
- Historical attempts immutable via question snapshots
- No fake/hardcoded records in production flows
- Mobile: SecureStore tokens; offline vault uses salted SHA-256 (salt
  `sanro-offline`)

## 4. Subscription / Entitlement Security

Subsystem reference: `docs/INSTITUTION_MANAGEMENT.md`.
Direct SANRO people + super-admin people admin: `docs/PEOPLE_MANAGEMENT.md`.

- **Server-side only**: validity is decided by `SubscriptionAccessService` in UTC;
  client clocks/devices never decide access. Time never trusts the client.
- **No client-side gating**: entitlement runs in `SubscriptionGuard` + the auth flow;
  hiding UI is a UX nicety, never a control.
- **Logins never issue tokens to blocked accounts**: expired/suspended/archived/
  pending/disabled/membership-deactivated accounts get a `BlockedAccountResponse`
  (no access/refresh token); refresh revokes the old session.
- **Seat-limit resource guard**: student create enforces
  `SEAT_LIMIT_REACHED` (effective limit = subscription.seatLimit else
  institution.seatLimit); no silent oversubscription. Bulk-import seat checks are
  pending (see INSTITUTION_MANAGEMENT.md gaps).
- **Cache invalidation path**: entitlement cached 15 s; `invalidate(institutionId)`
  is the explicit invalidation hook for admin mutations (not yet called there).
- **SUPER_ADMIN exemption is structural**: super admins skip entitlement and tenant
  binding; their routes are `@Roles('SUPER_ADMIN')` + `requireSuperAdmin`. RolesGuard
  has no blind SUPER_ADMIN passthrough — roles are explicit per route.
- **Super-admin People API `/api/v1/admin/people/*` (triple-guard)**:
  `SUPER_ADMIN` role (`@Roles('SUPER_ADMIN')` + per-call `assertSuperAdmin`
  re-check) + subscription gate (`SubscriptionGuard` global chain) + entitlement
  passthrough (super admin always allowed by `EntitlementService`). Non-super-admin
  roles get a 403; institution admins cannot list/see DIRECT_SANRO people through
  their scoped `/students` `/teachers` `/parents` endpoints. Direct SANRO (SANRO
  AI system institution id `00000000-0000-0000-0000-00000000a5a1`, or legacy
  null) is enforced by the same guard: those users are evaluated by
  `EntitlementService` (direct subscription / parent child aggregation) with block
  codes `DIRECT_SUBSCRIPTION_EXPIRED` / `DIRECT_SUBSCRIPTION_SUSPENDED` /
  `NO_ENTITLEMENT`. The system institution is protected (never deleted/archived/
  suspended/expired/modified) and excluded from tenant lists. Full detail:
  `docs/PEOPLE_MANAGEMENT.md`.
- **Anti-bypass notes**: no wildcard-CORS change (still locked to sanroai.com /
  app.sanroai.com / www.sanroai.com); blocked states are re-checked on every
  entitlement-gated request (TTL ≤15 s), so unblocking a tenant self-heals within
  the TTL; the admin module writes no cache invalidation yet so a subscription change
  takes effect within 15 s.

## 5. Operational

- No secrets committed; `.env*` gitignored
- Swagger gated behind `NODE_ENV !== 'production'`
- Status: production AI/storage secrets configured via Railway/Vercel env
  panels only .