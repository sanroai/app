# QA Test Cases — SANRO AI

Session date: **2026-10-19** · Workspace: `D:\sanroaiapp`

This catalogue maps every check executed this session to its artefact, expected result, and observed result. Evidence labels follow the house convention: `VERIFIED` (ran live this session), `HISTORICAL` (ran in an earlier session, still valid), `INFERRED` (reasoned from code, not re-executed), `UNVERIFIED`, `BLOCKED`.

Statuses: `PASS` · `FAIL` · `FIXED` (was FAIL, patched, retested PASS) · `PARTIAL` · `NOT RUN` · `BLOCKED`.

Reusable probe scripts live in `scripts/qa/`. Screenshots in `artifacts/qa/2026-10-19/screenshots/`.

---

## 1. Authentication & session security (`probe-auth-security.mjs`)

| ID | Case | Expected | Observed | Status |
|---|---|---|---|---|
| AUTH-01 | Request a protected route with no `Authorization` header | 401, no body leak | 401 everywhere | PASS |
| AUTH-02 | Send a forged/tampered JWT | 401 rejected | Rejected | PASS |
| AUTH-03 | Login with an unregistered email | Same generic error as wrong password (no user enumeration) | Uniform error | PASS |
| AUTH-04 | Forgot-password returns raw reset token in response | Must NOT return raw token | Returns `{ success: true }` only | PASS |
| AUTH-05 | `account-state` endpoint | Requires auth, omits secrets | Auth-gated, no secrets | PASS |
| AUTH-06 | Refresh token with garbage payload | 401 | 401 | PASS |
| AUTH-07 | STUDENT calls an admin surface | 403 | 403 | PASS |
| AUTH-08 | Trigger a server error | No stack trace in response | Clean `{code,message,requestId}` | PASS |
| AUTH-09 | Production CORS | Fixed 3-origin allowlist (`sanroai.com`, `app.`, `www.`) | 3 origins | PASS |
| AUTH-10 | Session invalidation behaviour | Refresh/rotation sane | 10/10 probes green | PASS |

**Result: 10/10 PASS** · Evidence: `VERIFIED`

---

## 2. Role / permission matrix (`test/role-permission-matrix.e2e-spec.ts`)

| ID | Case | Expected | Observed | Status |
|---|---|---|---|---|
| RM-01 | 296 cases across 29 controllers × roles/verbs | unauth→401; allowlisted roles never 401/403; non-allowlisted→exactly 403 (or `denied:'lenient'` where service raises 400/404) | 296/296 green | PASS |

**Result: 296/296 PASS** · Evidence: `VERIFIED`

---

## 3. Read-path authorization sweep (`sweep-authz.mjs`)

| ID | Case | Expected | Observed | Status |
|---|---|---|---|---|
| SWEEP-01 | 116 GET routes × 5 roles | No unintended 200/5xx for wrong roles; tenant concealment on bogus ids | Two 500-for-all-roles routes → BUG-E (fixed); tenant concealment confirmed on `/admin/*`, `/reports/*`, `/ar/*`, `/knowledge-base/*`, `/imports/*` | PASS (after BUG-E fix) |

**Result: PASS** · Evidence: `VERIFIED`

---

## 4. Write-path fuzz (`fuzz-write-path.mjs`) — no-mutation contract

| ID | Case | Expected | Observed | Status |
|---|---|---|---|---|
| WP-A | Unauthenticated writes | 401, never 2xx/5xx | 401 | PASS |
| WP-B | Wrong-role writes | exactly 403 | 403 (corrected test: STUDENT on `/questions/:id` where roles are IA,TEACHER) | PASS |
| WP-C | Malformed `:id` writes | 4xx, never 5xx (BUG-B regression) | 400/403/404 (guard order varies; 0 × 5xx) | PASS |
| WP-D | Invalid / empty / wrong-type bodies | 400 | 400 (`/site/contact` may 429 — documented 3/min throttle) | PASS |
| WP-E | Malformed JSON body | 400, no 5xx | 400 | PASS |
| WP-F | `text/plain` on JSON endpoint | 4xx, no 5xx | 400 | PASS |
| WP-G | Action routes with bad id | no 5xx | no 5xx | PASS |
| WP-H | Cross-tenant / bogus-id writes | concealed (no 2xx/5xx) | concealed | PASS |
| WP-I | Validation error body shape | has `code` + `details` | present | PASS |
| WP-J | Write-path errors | never leak internals/secrets | clean | PASS |
| WP-K | Duplicate create (unique constraint) | **409**, not 500 (BUG-J regression) | first 201 → second 409 `CONFLICT` | PASS |

**Result: 11/11 PASS** · Evidence: `VERIFIED` · Note: WP-B/C/D initially failed on **test-expectation** errors (allowed role mislabeled, guard-order assumption, wrong role on an SA-only route), corrected before final run.

---

## 5. Rate-limiting (`probe-rate-limit.mjs`)

| ID | Route | Limit | Expected | Observed | Status |
|---|---|---|---|---|---|
| RL-01 | `POST /auth/login` | 10/min | 429 after burst | Enforced | PASS |
| RL-02 | `POST /auth/forgot-password` | 3/min | 429 | Enforced | PASS |
| RL-03 | `POST /auth/register-institution` | 5/min | 429 | Enforced | PASS |
| RL-04 | `POST /site/contact` | 3/min | 429 | Enforced | PASS |
| RL-05 | Global throttle | 120/60s | 429 | Enforced | PASS |
| RL-06 | 429 body hygiene | `RATE_LIMITED` + `Retry-After: 60`, no stack/leak | clean | PASS |

**Result: 5/5 PASS** · Evidence: `VERIFIED`

---

## 6. AI surface & prompt injection (`probe-ai-surface.mjs`)

| ID | Case | Expected | Observed | Status |
|---|---|---|---|---|
| AI-A | Hostile prompt ("ignore instructions…") | Never reflected verbatim / no jailbreak echo | Not reflected | PASS |
| AI-B | PARENT role calls AI chat | 403 (role gate) | 403 | PASS |
| AI-C | Unknown-field injection (`role:'ADMIN'`) | **No escalation** (Zod strips unknown keys) | Stripped, role unchanged | PASS |
| AI-D | Provider key leak in response/error | none | none (`AI_PROVIDER='mock'`, no `AI_*` key set) | PASS |
| AI-E | Hostile input → 5xx | none | none | PASS |
| … | (12 assertions total) | — | — | **12/12 PASS** |

**Result: 12/12 PASS** · Evidence: `VERIFIED` · **Scope:** mock AI provider only. Live-provider injection/timeout is `BLOCKED` (needs `AI_API_KEY`; intentionally not run).

---

## 7. Web UI walkthrough (`web-walkthrough.mts`, Playwright)

| ID | Case | Expected | Observed | Status |
|---|---|---|---|---|
| WEB-01 | Login + navigate 69 pages across 5 roles | Page loads, no crash | 58 PASS / 10 PARTIAL / 1 FAIL | PASS* |
| WEB-02 | Reports page data correctness | No `NaN%`, no `undefined` key, Top/Struggling populated | After BUG-G fix: 0 console errors, real data (Avg Mastery 32%, Sci 63%, Aarav listed) | FIXED |
| WEB-03 | Nav gating | Curriculum link only for SUPER_ADMIN | SA=true, IA=false, TEACHER=false (BUG-I) | FIXED |
| WEB-04 | Console error check across pages | no React errors | PARTIALs = external YouTube thumbnail 404s (BUG-H) | PARTIAL |

\* The single FAIL was a **transient** landing-page timeout, re-rendered OK on retry; not a product defect.
**Result: 69 pages, 58 PASS / 10 PARTIAL / 1 transient FAIL** · Evidence: `VERIFIED` · `artifacts/qa/2026-10-19/web-walkthrough.json` + screenshots.

---

## 8. Mobile device walkthrough (`THC3Y19429006728`, native build `com.sanro.ai`)

| ID | Case | Expected | Observed | Status |
|---|---|---|---|---|
| MOB-01 | App cold-start (with Metro + `adb reverse`) | Splash → first screen | Loads; **0 ReactNativeJS errors** | PASS |
| MOB-02 | Home renders real student data | XP/Mastery/streak present | Aarav, 420 XP, 63% Mastery, L1, 7-day streak | PASS |
| MOB-03 | Library browse | CBSE Cl-10 Science/Mathematics | Rendered, progress bars | PASS |
| MOB-04 | Subject → chapters drill-down | Chapter list + mastery | 13 chapters, mastery 71/66/30/0% | PASS |
| MOB-05 | Assessments tab (diagnosis loop) | Core loop CTA + stats | 4% Mastered, 2 Weak, 105 Not tested, "Your Next Step: Reactivity Series"; Practice disabled w/ hint | PASS |
| MOB-06 | Ask Sanro AI empty state | Heading + prompts + input | 6 prompts, input, send | PASS |
| MOB-07 | Me tab | Profile + stats + achievements | Aarav, 420 XP, 63% Mastery, learning progress, achievements | PASS |
| MOB-08 | AI chat round-trip (end-to-end) | Send → AI reply bubbles | User bubble + mock AI reply, no error | PASS |
| MOB-09 | Achievement badge glyphs | All badges show an icon | **Week Warrior = empty green square** → BUG-K | FAIL (cosmetic) |

**Result: 8/9 PASS, 1 cosmetic FAIL (BUG-K)** · Evidence: `VERIFIED` · screenshots `mobile-04` … `mobile-13`.

**Environment note (not a defect):** without the Metro bundler on tcp:8081 the debug build hangs on the splash (`Displayed … +3m21s`). Metro + `EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1` + `adb reverse tcp:4000` are required for local runs.

---

## 9. Regression suites (Vitest)

| ID | Suite | Cases | Result | Status |
|---|---|---|---|---|
| REG-01 | `all-exceptions.filter.spec.ts` (BUG-B P2023→400, BUG-J P2002→409) | 6 | 6/6 | PASS |
| REG-02 | `content-library-assignments.e2e-spec.ts` (BUG-A) | 6 | pass | PASS |
| REG-03 | `diagnosis-scoping.e2e-spec.ts` (BUG-C) | 9 | pass | PASS |
| REG-04 | `attempt-read-scoping.e2e-spec.ts` (BUG-D) | 5 | pass | PASS |
| REG-05 | Full API suite `pnpm --filter @sanro/api test` | 563 | 563/563, 27 files | PASS |
| REG-06 | Web suite | 15 | 15/15 | PASS |
| REG-07 | Mobile suite | 5 | 5/5 | PASS |

**Result: all PASS** · Evidence: `VERIFIED`

---

## 10. Not run / blocked

| ID | Case | Reason | Status |
|---|---|---|---|
| NR-01 | Live-provider AI injection & timeout behaviour | Requires `AI_API_KEY` (mock provider configured) | BLOCKED |
| NR-02 | Formal a11y audit (WCAG) | Not performed; only manual visual review | NOT RUN |
| NR-03 | Responsive breakpoint matrix | Desktop 1440×900 + phone 1080×2340 sampled only | PARTIAL |
| NR-04 | Load / stress testing | Out of scope this session | NOT RUN |
