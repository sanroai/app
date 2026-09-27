# SANRO AI — Local Data Reset (Operator Runbook)

Resets the **local** development database to a clean platform state: all
tenant/demo data is deleted, platform configuration is preserved, migration
history and schema are untouched. Production is never a valid target — the
script refuses anything that is not a local database.

- Script: `apps/api/prisma/reset-local-data.ts`
- Commands: `pnpm reset-local-data` (root) or
  `pnpm --filter @sanro/api reset:local-data`
- Scope: **DATA ONLY**. No schema change, no `prisma migrate reset`, no
  migration file is created, modified, or deleted.

## 1. What this reset does

1. Verifies every safety guard (§6) — aborts before touching anything if any
   guard fails.
2. Writes a pre-reset backup to `backups/pre-reset/`
   (`sanroai-local-pre-reset-<YYYY-MM-DD-HH-MM>.sql`), reusing an existing one
   if it is less than 60 minutes old.
3. Verifies the live connection: `current_database()` must match the expected
   database and `host(inet_server_addr())` must be loopback.
4. Deletes all non-platform rows from the tables in §2.
5. Re-verifies the database and exits `0` only if the post-reset counts match
   §11; any mismatch exits non-zero.

Not part of the script (separate manual step): deleting the 6 demo GLB copies
in `storage/ar/models/`. The script never touches storage — source assets in
`apps/web/public/models/` are preserved.

## 2. What is deleted

Everything except the platform config in §3. Explicit table list:

| Area | Tables |
|---|---|
| People & tenancy | `User`, `Institution` (non-system rows), `InstitutionMember`, `Teacher`, `Student`, `Parent`, `Group`, `StudentGroup`, `StudentTeacher`, `AcademicYear` |
| Curriculum | `Board`, `Grade`, `Subject`, `Chapter`, `Topic`, `Concept`, `InstitutionCurriculumAccess` |
| Content | `ContentItem` + content versions, content assignments, content progress |
| Questions & papers | `Question` + question options, `QuestionPaper` + paper questions |
| Assessment | `Assessment` + assessment questions, assignments, attempts, answers |
| Diagnosis & remediation | `Diagnosis`, `ConceptMastery`, `DiagnosticResult`, remediation plans and plan items |
| Practice & learning | `PracticeSet`, practice answers, `FlashcardRating` |
| Gamification | `GamificationProfile`, `StudentAchievement` |
| Platform ops | `Notification`, `Session`, `AuditLog`, `Subscription`, `SubscriptionHistory`, `ImportJob`, `ImportRow`, `Report`, `SupportTicket`, `PasswordResetToken`, `AiUsageLog`, `ContactLead` |
| AR | `ArContent` + versions + activities |
| Knowledge base | `KnowledgeBase`, `KnowledgeChunk`, `ProcessingJob` |

Storage: the 6 demo GLB copies under `storage/ar/models/` are removed as a
separate manual step (run 2026-09-26; source assets preserved).

## 3. What is preserved

| Item | Detail |
|---|---|
| `Plan` | 3 pricing rows (STUDENT_MONTHLY / STUDENT_YEARLY / INSTITUTION) |
| `Achievement` | 8 badge definitions |
| SANRO AI system institution | id `00000000-0000-0000-0000-00000000a5a1`, code `SANRO-AI`, type `SANRO_PLATFORM` |
| `_prisma_migrations` | 14 rows / 13 migration dirs — migration history is never touched |
| Bootstrap Super Admin | exactly 1 user: `admin@sanroai.com` (`isSuperAdmin=true`) |
| Schema / migrations | Data-only delete; no DDL, no migration files added or removed |
| AR source assets | `apps/web/public/models/` (source GLBs and previews) |

## 4. Prerequisites

- Local PostgreSQL 18 running and reachable.
- `apps/api/.env` present (the script reads the local `DATABASE_URL` from it;
  local target is `sanro_dev`, tests use `sanro_test` via `DATABASE_URL_TEST`).
- `pg_dump` / `psql` client tools on `PATH` (same major version as the server
  is recommended).
- Repo installed (`pnpm install`) so the API package scripts resolve.
- No dev servers need to be stopped, but any long-running writer (API on
  `:4000`) may fail queries while the script runs.

## 5. How to run it

The confirmation variable is **mandatory**. Without it the script prints the
required value and exits without touching the database.

PowerShell:

```powershell
$env:LOCAL_RESET_CONFIRMATION = "reset-my-local-sanro-data"
pnpm reset-local-data
```

bash:

```bash
LOCAL_RESET_CONFIRMATION=reset-my-local-sanro-data pnpm reset-local-data
```

Equivalent scoped form:

```powershell
# PowerShell
$env:LOCAL_RESET_CONFIRMATION = "reset-my-local-sanro-data"
pnpm --filter @sanro/api reset:local-data
```

```bash
# bash
export LOCAL_RESET_CONFIRMATION=reset-my-local-sanro-data
pnpm --filter @sanro/api reset:local-data
unset LOCAL_RESET_CONFIRMATION   # PowerShell: Remove-Item Env:LOCAL_RESET_CONFIRMATION
```

Unset the variable after each run so it cannot be picked up accidentally by a
later shell session or script.

## 6. Safety guards

Every guard is evaluated before any delete runs. Any failure aborts with a
non-zero exit code and no data is touched.

| # | Guard | Aborts when |
|---|---|---|
| 1 | `NODE_ENV` | `NODE_ENV` is `production` or `prod` |
| 2 | `DATABASE_URL` | Missing, or unparseable as a PostgreSQL connection string |
| 3 | Local host | Host is not `localhost`, `127.0.0.1` or `::1` |
| 4 | Host patterns | Host contains `railway`, `neon`, `supabase`, `amazonaws`, `rds`, `azure`, `cloudflare`, `heroku`, `render.com`, `digitalocean`, `sanroai.com`, `pg.` or `db.` |
| 5 | DB-name allowlist | Database name is anything other than `sanro_dev` |
| 6 | DB-name patterns | Database name contains `prod`, `production`, `live`, `staging`, `customer` or `sanroai` |
| 7 | Storage type | `STORAGE_TYPE` is not `local` |
| 8 | Storage endpoint | `STORAGE_URL` or `STORAGE_BUCKET` points at R2, GCS, S3 or a similar remote endpoint |
| 9 | Confirmation var | `LOCAL_RESET_CONFIRMATION` is missing or not exactly `reset-my-local-sanro-data` |
| 10 | Backup freshness | No validated backup in `backups/pre-reset/` younger than 60 minutes (created automatically when `pg_dump` is available; the run aborts if it cannot be created or fails content validation) |
| 11 | Live connection identity | `current_database()` is not the expected database, or `host(inet_server_addr())` is not loopback |
| 12 | Post-verify | Re-query after deletion shows preserved rows missing or unexpected rows remaining → non-zero exit |

Guards 1–9 run first; guard 10 (backup) runs before any delete; guard 11 runs
on the open connection before the transaction; guard 12 runs after commit.
An aborted run leaves the database untouched.

## 7. Restoring the backup (documented, never run casually)

Reference backup: `backups/pre-reset/sanroai-local-pre-reset-2026-09-26-01-29.sql`
(892,416 bytes, 63 tables). Format: **plain-SQL `pg_dump`** (`--format=plain`),
so restore with `psql`, not `pg_restore`.

> These commands are documentation only. Do not execute a restore unless you
> intend to overwrite the current local database. Always confirm the target
> database name first.

### 7.1 Full restore into a fresh database

A plain dump contains `CREATE TABLE` but no `DROP`, so restoring on top of an
existing populated schema fails with duplicate-object/duplicate-key errors.
Restore into a new database, verify, then swap:

```bash
createdb sanro_dev_restore
psql -d sanro_dev_restore -v ON_ERROR_STOP=1 \
  -f backups/pre-reset/sanroai-local-pre-reset-2026-09-26-01-29.sql
```

Verify `sanro_dev_restore` (§8), then either point the app at it or recreate
`sanro_dev` from it (drop/recreate is a destructive local operation — take a
backup of the current state first).

To replace `sanro_dev` in place instead, the schema must be emptied first:

```bash
psql -d sanro_dev -v ON_ERROR_STOP=1 -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
psql -d sanro_dev -v ON_ERROR_STOP=1 \
  -f backups/pre-reset/sanroai-local-pre-reset-2026-09-26-01-29.sql
```

`-v ON_ERROR_STOP=1` makes `psql` abort on the first error instead of
continuing with a half-restored database.

### 7.2 Single-table restore

Extract the table's `COPY ... FROM stdin;` block from the dump and replay only
that block (table must already exist and be empty):

```bash
awk 'BEGIN{f=0} /^COPY public\."Plan" /{f=1} f{print} f && /^\\\.$/{exit}' \
  backups/pre-reset/sanroai-local-pre-reset-2026-09-26-01-29.sql \
  > /tmp/restore-plan.sql

psql -d sanro_dev -v ON_ERROR_STOP=1 -f /tmp/restore-plan.sql
```

Replace `Plan` with the target table name. The extracted file contains the
`COPY` header, the data rows, and the terminating `\.` sentinel.

## 8. Verifying the database afterwards

Exact row counts across every public table (one-liner):

```bash
psql -d sanro_dev -Atc "SELECT c.relname || ': ' || (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM public.%I', c.relname), false, true, '')))[1]::text::int FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY 1;"
```

Quick approximate variant (uses the autovacuum stats, no table locks):

```bash
psql -d sanro_dev -Atc "SELECT relname || ': ' || n_live_tup FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY relname;"
```

Compare the result against §11. Connect using your local PostgreSQL
credentials; do not paste connection strings or passwords into the command,
shell history, or any committed file.

## 9. How production is prevented from ever executing this

- **Guard 1** aborts when `NODE_ENV` is `production`/`prod`.
- **Guards 3–4** abort unless the DB host is loopback and matches no
  managed/remote host pattern — any production host fails this.
- **Guards 5–6** abort unless the DB name is `sanro_dev` and matches no
  production-like pattern — production database names are never allowed.
- **Guards 7–8** abort unless `STORAGE_TYPE=local` and no cloud storage
  endpoint is configured.
- **Guard 9** requires `LOCAL_RESET_CONFIRMATION=reset-my-local-sanro-data`;
  this variable is never set in CI, deployment pipelines, or production
  environments, so the script exits before any delete there.
- **Guard 11** re-checks the actually-open connection: the server's database
  name and loopback address must match the intended target.
- The script is a local-development tool only: it is not referenced by any
  deploy script, `preDeployCommand`, or CI job, and it is never documented as
  part of production deployment.

## 10. Troubleshooting / stop conditions

| Symptom | Cause | Action |
|---|---|---|
| Exits immediately, prints required confirmation value | Guard 9 — env var missing/wrong | Set `LOCAL_RESET_CONFIRMATION` exactly as in §5, re-run |
| Aborts: not a local host | Guard 3/4 — remote `DATABASE_URL` | Point `apps/api/.env` at local Postgres; never bypass this guard |
| Aborts: database name not allowed | Guard 5/6 | Only `sanro_dev` is valid |
| Aborts: storage type or endpoint | Guard 7/8 | Set `STORAGE_TYPE=local` locally; do not run against cloud storage |
| Aborts: backup freshness | Guard 10 | Check `backups/pre-reset/` is writable and disk is not full; confirm `pg_dump` is installed; re-run |
| Aborts: server address not loopback | Guard 11 | Confirm `DATABASE_URL` points at local Postgres; the check reads `host(inet_server_addr())` |
| Non-zero exit after delete | Guard 12 — post-verify mismatch | Do not proceed. Restore from the pre-reset backup (§7), then re-run diagnostics |
| `pg_dump`/`psql` not found | Client tools missing | Install PostgreSQL client binaries and re-run |
| `ECONNREFUSED` | Postgres not running | Start local PostgreSQL 18 and re-run |
| App shows missing demo data afterwards | Expected — demo is opt-in | Run `pnpm db:seed:demo` for demo data; `pnpm db:seed` for system-only rows |
| Tests fail on missing fixtures or a missing partial unique index | Test DB built with `db push` instead of migrations | Rebuild: drop `sanro_test`, then `pnpm --filter @sanro/api test` (it runs `prepare-test-db.ts` → `migrate deploy` → seed) |

Stop conditions — do not continue and escalate instead if: the target is not
localhost, the confirmation var is not set intentionally, the backup failed,
or post-verify returns non-zero.

## 11. Post-reset expected counts

| Table | Expected rows |
|---|---|
| `Institution` | 1 (SANRO AI system institution) |
| `User` | 1 (bootstrap Super Admin `admin@sanroai.com`) |
| `Plan` | 3 |
| `Achievement` | 8 |
| `_prisma_migrations` | 14 |
| Everything else in `public` | 0 |

## 12. Seed split after a reset

| Command | Scope |
|---|---|
| `pnpm db:seed` | SYSTEM ONLY — Plans, system institution, bootstrap super admin (idempotent) |
| `pnpm db:seed:demo` | Full demo data — opt-in only, never automatic |
| `pnpm db:seed:qa` | QA fixtures for the e2e suite — targets `sanro_test` |
| `pnpm --filter @sanro/api db:test:prepare` | `prisma migrate deploy` against `sanro_test` (idempotent) |

`pnpm --filter @sanro/api test` runs `prepare-test-db.ts` → `migrate deploy` →
`seed --qa` → `vitest` against `sanro_test` (via `DATABASE_URL_TEST`), so
running the test suite never re-populates `sanro_dev`.

## 13. Rebuilding the test database

`prisma db push` cannot create migration-only objects (partial unique
indexes, migration functions/triggers). A `sanro_test` built with `db push`
is missing `Institution_system_institution_singleton`, which the
"exactly one system institution" test depends on.

Rebuild from scratch:

```bash
psql -d postgres -c 'DROP DATABASE IF EXISTS sanro_test WITH (FORCE);'
psql -d postgres -c 'CREATE DATABASE sanro_test OWNER postgres;'
pnpm --filter @sanro/api db:test:prepare    # migrate deploy against sanro_test
pnpm --filter @sanro/api db:seed:qa         # QA fixtures only
pnpm --filter @sanro/api test
```

The system institution row in `sanro_test` is created by migration
`20260921110000_sanro_ai_system_institution` with name `SANRO AI`; the seed
must use the same name (see `apps/api/prisma/seed-system.ts`).
