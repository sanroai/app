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
2. Deploy API: **direct deploy from the repo root** — run `railway up
   --service api` from the repo root (not `apps/api`). preDeploy runs
   `prisma migrate deploy` + idempotent `db:seed`; health check
   `GET /api/v1/health`.
   - **No config-as-code file**: `railway.json` was removed. Railway's GitHub
     App could not snapshot `sanroai/app` ("Failed to snapshot repository"),
     which blocked every deploy. Deploy config (start command
     `node apps/api/dist/main.js`, health check `/api/v1/health`, preDeploy
     migrate + seed, restart policy) is now **stored on the Railway service
     itself** and does not depend on a repo file. This also resolves the
     Config-as-Code deprecation warning (deadline 2026-12-01).
   - **Do not re-add `railway.json`** — it re-triggers the repo snapshot and
     fails the deploy. To change start/healthcheck/preDeploy, edit it in the
     Railway dashboard service settings.
   - The `railway` npm SDK was removed from `devDependencies`: it was unused
     and pinned to 3.11.0, which conflicts with Railway CLI ≥5.42.1 and broke
     `railway config` commands. The Railway CLI (`railway` global binary) is
     the only Railway tooling needed.
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