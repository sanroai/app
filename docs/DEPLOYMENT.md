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
2. Deploy API (Render, service `srv-dbjecim7bikc73f774hg`, branch `deploy`):
   - **Auto-deploy does not fire from a push on this service.** Start the deploy
     explicitly: `POST https://api.render.com/v1/services/<id>/deploys` with
     `{ "clearCache": "do_not_clear" }` and an `Authorization: Bearer $RENDER_API_KEY`
     header, then poll `GET /services/<id>/deploys/<deployId>` until `live`.
   - **The service does not run migrations.** `prisma migrate deploy` must be run
     against the production `DATABASE_URL` (or the SQL applied through the Neon
     console) **before** the new code serves traffic, otherwise any endpoint that
     touches a new column answers 500. Record the migration in
     `_prisma_migrations` when applying the SQL by hand.
   - Health check `GET /api/v1/health`.
3. Push web: `npx vercel --prod --yes` **from the repo root** (the project's Root
   Directory is `apps/web`, so running it inside `apps/web` looks for
   `apps/web/apps/web`). The CLI often reports `deploy_failed` with
   `ECONNRESET` while polling; the build usually succeeds anyway — confirm with
   `npx vercel inspect <deployment-url>` that it is `Ready` and aliased to
   `sanroai.com` before believing either outcome.
   - The APK lives at `apps/web/public/downloads/sanroai.apk` and is
     **git-ignored**, so it only ships with a CLI deploy (never with a git build).
4. Verify domains, HTTPS, CORS, auth login, critical workflows, PDF, uploads,
   AI.
5. Mobile: build APK against production API
   (`$env:EXPO_PUBLIC_API_URL="https://api.sanroai.com/api/v1"` — `apps/mobile/.env`
   points at localhost for development), install + smoke test, publish with
   `node scripts/publish-apk.mjs <apk>` **before** the web deploy.

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