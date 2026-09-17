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

## 4. Operational

- No secrets committed; `.env*` gitignored
- Swagger gated behind `NODE_ENV !== 'production'`
- Status: production AI/storage secrets configured via Railway/Vercel env
  panels only .