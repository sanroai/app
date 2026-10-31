# QA Master Plan — SANRO AI

**Audit date:** 2026-10-19
**Workspace:** D:\sanroaiapp (master, uncommitted changes preserved)
**Operator:** autonomous QA session
**Rules in force:** synthetic data only; local/dev DBs only (`sanro_dev`, `sanro_test`); no production mutation; no secrets in evidence; zero deletions of user work.

## 1. Mission

Deeply inspect, test, fix and validate every implemented surface of Sanro AI: web marketing + web app + mobile app + API + database. Find real defects, fix verified in-scope ones with minimal patches, retest, and leave a truthful record of what is proven vs. blocked.

## 2. Environments

| Env | Target | Use |
|---|---|---|
| Local API | `http://localhost:4000/api/v1` (`sanro_dev`) | primary runtime testing |
| Test DB | `localhost:5432/sanro_test` | API automated test suite |
| Local web | `http://localhost:3000` | Playwright / Chrome DevTools E2E |
| Device | `THC3Y19429006728` (Honor JSN-L42, Android 10) | native mobile E2E via adb |
| Production | `api.sanroai.com` / `app.sanroai.com` | **read-only** verification only, no mutation |

## 3. Phases

| Phase | Scope | Status |
|---|---|---|
| P1 | Context refresh (`chatgpt.md`), architecture, roles, env verify | DONE |
| P2 | Feature inventory + role-permission matrix + baseline | DONE |
| P3 | Auth + role/data-isolation testing | DONE (API) |
| P4 | Granular feature testing (forms, CRUD, filters, states) | PARTIAL (API only) |
| P5 | Mobile + UI + responsive + a11y | NOT RUN |
| P6 | Backend + security + AI | PARTIAL (auth/session done; AI + rate-limit NOT RUN) |
| P7 | Bug fixes + regression | DONE (6 defects, 561/561 green) |
| P8 | Final validation + report | PARTIAL (API final; UI/mobile pending) |

## 4. Status vocabulary

`PASS` · `FAIL` · `BLOCKED` · `NOT RUN` · `PARTIAL` · `FIXED, RETESTED`

## 5. Discovered scope (P1 evidence)

- **5 user roles**: SUPER_ADMIN, INSTITUTION_ADMIN, TEACHER, STUDENT, PARENT.
- **API**: ~27 controllers, ~190 routes under `/api/v1`, 66 Prisma models, 36 enums.
- **Web**: 12 marketing pages, 4 auth pages, ~45 dashboard pages.
- **Mobile**: 8 tabs + ~20 stack screens, 6 concept learning modes.
- **AI**: OpenAI-compatible chat completions via `AI_BASE_URL`/`AI_PROVIDER` (mock|openai|gemini), no streaming, no tool-calling, mock fallbacks.
- **Tests**: API 244 (unit+e2e), web 15 (format only), mobile 5 (sha256 only).

## 6. Artefact locations

- Screenshots: `artifacts/qa/2026-10-19/screenshots/` (NOT RUN)
- Bug register: `docs/qa/BUG_REPORT.md`
- Feature inventory: `docs/qa/FEATURE_INVENTORY.md`
- Role-permission matrix: `apps/api/test/role-permission-matrix.e2e-spec.ts`
- Execution log: `docs/qa/EXECUTION_LOG.md`
- Raw decorator dump: `docs/qa/route-roles-raw.txt`
- Probes: `scripts/qa/{probe-auth-security,sweep-authz,diagnose-matrix}.mjs`

## 7. Checkpoint protocol

After each phase, update `EXECUTION_LOG.md` with: completed work, tests run, results, bugs found/fixed, evidence paths, pending work, next exact action. A later session must be able to resume from the last checkpoint without repeating finished work.
