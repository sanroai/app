# SANRO AI — Deployment

## 1. Targets

- Website: https://sanroai.com (Vercel)
- Web app: https://app.sanroai.com (Vercel, same project routes)
- API: https://api.sanroai.com (managed Node host — Railway)
- Database: managed PostgreSQL (Railway, sfo)
- Storage: Cloudflare R2 (or existing verified object storage) via
  `STORAGE_R2_*` env
- Redis: only if genuinely required (not currently required)
- Mobile: Expo EAS (preview = APK, production = AAB) + APK download endpoint

## 2. Env Configuration

`.env.example` defines all variables. Production secrets configured in the
platform env panels, never in repo.

API key envs: DATABASE_URL, AUTH_SECRET (≥32, no `dev-` in prod), NODE_ENV,
CORS_ORIGINS, STORAGE_R2_*, AI_PROVIDER/AI_MODEL/OPENAI_API_KEY, PDF engine,
SMTP, rate limit tunables.

Subscription/validity system (see docs/INSTITUTION_MANAGEMENT.md) requires **no
extra env vars** — entitlement timings come from `SUBSCRIPTION.*` constants in
`@sanro/config` (cache TTL 15 s, expiring-soon 30 d, grace default 0, renew 365 d).
Direct SANRO subscriptions reuse the same `Subscription` model
(docs/PEOPLE_MANAGEMENT.md §4) and add no env surface.
Pricing is data-driven from the `Plan` table (idempotent seed). Deploy runs the
`institution_subscription_system` migration via `prisma migrate deploy`.

Web env: NEXT_PUBLIC_API_URL=https://api.sanroai.com/api/v1.
Mobile env: EXPO_PUBLIC_API_URL=https://api.sanroai.com/api/v1 (all EAS profiles).

## 3. Deploy Procedure

1. Run CI: typecheck → test → build → E2E.
2. Push API: Railway deploys from GitHub. The project is configured at the
   repo root (`railway.json`, auto-detected; run `railway up` from the repo
   root, not `apps/api`); preDeploy runs Prisma migrations + idempotent seed.
   Health check `GET /api/v1/health`.
3. Push web: Vercel production deploy.
4. Verify domains, HTTPS, CORS, auth login, critical workflows, PDF, uploads,
   AI.
5. Mobile: build APK against production API; install + smoke test; publish APK
   to stable URL.

## 4. No-Nos

- localhost in production
- `prisma migrate reset` on production
- wildcard CORS with auth
- committing secrets
- claiming success without verification

## 5. Verification Checklist

DNS · HTTPS · website · app · API · DB · storage · auth · CORS · production API
· mobile API · PDF · uploads · AI · critical workflows · APK.

## 6. Blocker Policy

If blocked by missing credentials/access: report "BLOCKED — requires [specific
access]" and document exact DNS/credential requirements. Never fabricate
configuration.