# SANRO AI — Architecture

## 1. System Overview

SANRO is a multi-tenant academic platform. Data flows:

```
Website (sanroai.com, Vercel)
Web App (app.sanroai.com)
Mobile (com.sanro.ai, Expo)
        │  HTTPS /auth + /api/v1/
        ▼
API (api.sanroai.com, NestJS 11)
        │
        ▼
PostgreSQL (Prisma ORM)  ·  Object storage (R2/S3 signed URLs)  ·  AI providers
YouTube  ·  Email (SMTP)  ·  Job queue (durable)
```

## 2. Monorepo

- pnpm workspaces, turbo build.
- Packages build order: `@sanro/types` → `@sanro/validation` → `@sanro/config`
  → `@sanro/ui` → API → Web.
- Apps: `web` (Next.js 15), `api` (NestJS 11), `mobile` (Expo runtime, turbo
  build is a stub).

## 3. API Layering

```
HTTP → Controllers (route params, guard metadata)
     → ZodValidationPipe (global, forbidUnknownValues)
     → JwtAuthGuard + RolesGuard (global APP_GUARDs)
     → Services (business logic, tenant scoping)
     → PrismaService (data access)
     → AllExceptionsFilter (uniform error envelope)
```

Error envelope: `{ code, message, requestId, statusCode, details? }`.

## 4. Two Primary Product Paths

**LEARN** (traditional library): curriculum browse + content consumption.
**ASSESS** (remediation engine): assessment → diagnosis → remediation →
retest → improvement.

These paths are separated in navigation, IA, DB design, API endpoints, visual
design, and analytics.

## 5. Domain Flow (Assessment path)

```
Paper → Assessment (snapshot of questions)
      → Attempt (immutable responses)
      → Auto-grade (objective + subjective)
      → Concept evidence aggregation
      → Mastery classification (STRONG/DEVELOPING/WEAK/INSUFFICIENT_EVIDENCE)
      → Remediation plan (Fix This)
      → Retest (same concept)
      → Improvement record (before/after)
```

## 6. Infrastructure Contracts

- Multi-tenancy enforced by `TenantAccessService` bound to JWT `institutionId`.
- Roles on `InstitutionMember`; `User` has no role field.
- SUPER_ADMIN platform-wide; bypasses tenant scope only via `@TenantOptional()`.
- Public routes: health, files, auth, some curriculum reads. Everything else
  guarded.

## 7. Cross-Cutting Services

- AuditService (AuditLog records)
- NotificationsService (Notification records)
- StorageService (local ↔ R2/S3 signed URLs)
- JobQueueService (durable queue: content processing, generation jobs)
- StudentIdentityService (auto-link Student ↔ User)

## 8. Deployment Topology

- Web: Vercel (static edge + serverless API routes for proxy/download).
- API: managed Node host (Railway) with managed PostgreSQL.
- Object storage: R2/S3.
- Env config via `.env.example`; no secrets in repo; no localhost in production.
- CI/CD runs typecheck, tests, build, E2E before deploy (added in rebuild).