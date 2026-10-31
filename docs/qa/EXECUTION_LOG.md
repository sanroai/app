# QA Execution Log — SANRO AI

Session date: **2026-10-19** · Workspace: `D:\sanroaiapp` · Branch: `master` (uncommitted, 0 deletions throughout)

Rules in force: synthetic data only; local DBs only (`sanro_dev`, `sanro_test`); no production mutation; no secrets in evidence.

---

## P1 — Context refresh & environment

- Verified toolchain: Node v24.15.0, pnpm 12.4.2, Git 2.54.0, OpenCode v2.0.32.
- Read `chatgpt.md` in full (140 lines); three explore subagents produced exhaustive inventories of API / web / mobile.
- Live services: API `:4000` (`sanro_dev`), web `:3000`, device `THC3Y19429006728` connected with `adb reverse tcp:4000`.
- Test accounts confirmed in `sanro_dev`: 5 demo roles, password `Sanro@123`. All roles `access:true`; institution + subscription ACTIVE.

**Result:** DONE.

---

## P2 — Feature inventory + role-permission matrix

- Dumped every `@Controller`/`@Roles`/verb decorator to `docs/qa/route-roles-raw.txt`: **29 controllers, 272 routes, 120 GET**.
- Wrote `apps/api/test/role-permission-matrix.e2e-spec.ts` — a 296-case live matrix. Contract: unauth → 401 everywhere; allowlisted roles must not get 401/403; non-allowlisted roles → exactly 403 (or `denied:'lenient'` where the service legitimately raises 400/404).
- Reconciled matrix expectations against service-level policies (staff-only assessments, students-only gamification, SUPER_ADMIN-has-no-institution, bogus-UUID tenant concealment).
- Wrote `docs/qa/FEATURE_INVENTORY.md`.

**Result:** DONE — matrix 296/296 green.

---

## P3 — Auth + role/data-isolation testing

- Wrote `scripts/qa/probe-auth-security.mjs` (10 probes) and `scripts/qa/sweep-authz.mjs` (116 GET routes x 5 roles).
- **Auth probes: 10/10 PASS** — unauth→401, forged JWT rejected, no user enumeration, forgot-password returns no raw token, `account-state` requires auth + omits secrets, garbage refresh rejected, student blocked from admin surfaces, no stack traces, production CORS is a fixed 3-origin allowlist.
- Sweep flagged two 5xx-for-every-role routes (→ BUG-E) and confirmed tenant concealment on `/admin/*`, `/reports/*`, `/ar/*`, `/knowledge-base/*`, `/imports/*` with bogus ids.

**Result:** DONE (API only).

---

## P4 — Granular feature testing (API)

- Confirmed tenant-scoping on `GET /questions`, `GET /papers`, `GET /academics/*`, `GET /users/me*` — all return empty/self-scoped payloads for STUDENT and PARENT (no leak).
- Write-path (POST/PATCH/DELETE) fuzzing: **DONE** — `scripts/qa/fuzz-write-path.mjs` → **11/11 PASS**.
  Contract: unauth writes → 401; wrong-role writes → exactly 403; malformed `:id` writes → 4xx never 5xx (BUG-B regression, WP-C); invalid bodies → 400 (WP-D); malformed JSON → 400 (WP-E); text/plain on JSON endpoint → 4xx (WP-F); action routes bad id → no 5xx (WP-G); cross-tenant/bogus-id writes concealed (WP-H); validation error body has `code`+`details` (WP-I); write-path errors never leak internals (WP-J); **duplicate create → 409** (WP-K, verifies BUG-J fix).

**Result:** DONE.

---

## P5 — Mobile + UI + responsive + a11y

**Web UI walkthrough — DONE.** `scripts/qa/web-walkthrough.mts` (Playwright, real logins) → **69 pages: 58 PASS / 10 PARTIAL / 1 FAIL** (the 1 FAIL was a transient landing-page timeout). JSON + real screenshots in `artifacts/qa/2026-10-19/web-walkthrough.json` and `.../screenshots/`. PARTIALs were mostly external YouTube thumbnail 404s (→ BUG-H) and empty-list empty states, not app defects.

**Mobile device walkthrough — DONE.** Device `THC3Y19429006728`, native debug build `com.sanro.ai` (v1.1.0). Required Metro bundler (tcp:8081, reversed) + `EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1` (adb reverse tcp:4000) — without Metro the debug build hung on the splash (environment gap, **not** a defect; first launch logged `Displayed … +3m21s` while waiting for a JS bundle). After Metro: full student journey captured with **0 JS errors**:
`mobile-04` (Metro load) → `05` Home (Aarav, 420 XP, 63% Mastery, L1, 7-day streak) → `06` Library (CBSE Cl-10 Sci/Math) → `07` Science chapters (13 ch, mastery 71/66/30/0%) → `08` Assessments (4% Mastered, 2 Weak, 105 Not tested, "Your Next Step: Reactivity Series", Practice disabled w/ hint) → `09` Ask Sanro AI (empty state + 6 prompts) → `10` Me (profile, learning progress, achievements) → `12` chip fills input → `13` **AI round-trip** (user bubble + mock AI reply). Screenshots in `artifacts/qa/2026-10-19/screenshots/mobile-*.png`.

- One cosmetic defect noted: **"Week Warrior" achievement badge renders an empty green square** (missing icon/emoji) on Home — logged as BUG-K (low).
- a11y/responsive: not formally audited; Playwright desktop (1440×900) + phone (1080×2340) captures reviewed manually.

**Result:** DONE.

---

## P6 — Backend + security + AI

- Auth/session security: DONE (see P3).
- AI chat / prompt-injection surface: **DONE** — `scripts/qa/probe-ai-surface.mjs` → **12/12 PASS**. API runs **mock** AI provider (`AI_PROVIDER='mock'`, no `AI_*` in `apps/api/.env`). Hostile prompts never reflected; PARENT role blocked 403; no provider-key leak; no 5xx on hostile input; unknown-field injection stripped (no escalation).
- Rate-limiting probes: **DONE** — `scripts/qa/probe-rate-limit.mjs` → **5/5 PASS**. login 10/min, forgot-password 3/min, register-institution 5/min, site/contact 3/min all enforced; 429 body clean (`RATE_LIMITED` + `Retry-After: 60`); global 120/60s.

**Result:** DONE.

---

## P7 — Bug fixes + regression

Ten defects found this session, all fixed and retested (or logged as cosmetic), plus product-decision findings. Full register in `docs/qa/BUG_REPORT.md`.

| ID | Severity | Summary | Status |
|---|---|---|---|
| BUG-A | High | `GET /admin/library/assignments` cross-tenant read (IDOR) | FIXED, RETESTED |
| BUG-B | Medium | Malformed `:id` → 500 instead of 400 on every `:id` route (Prisma `P2023`) | FIXED, RETESTED |
| BUG-C | High | `GET /diagnosis/students/:id` horizontal IDOR — PII (email/phone/DOB/roll) | FIXED, RETESTED |
| BUG-D | High | `GET /assessments/attempts/:id` horizontal IDOR — peer score/answers | FIXED, RETESTED |
| BUG-E | Medium | `GET /curriculum/{topics,concepts}` → 500 for all roles on missing/malformed param | FIXED, RETESTED |
| BUG-F | Low | Invalid Prisma filter in `learning-path` spec fixture (`{ not: null }` on a non-nullable column) | FIXED, RETESTED |
| BUG-G | Medium | Teacher **Reports** page data-contract mismatch → `NaN%`, `key={undefined}`, empty Top/Struggling lists | FIXED, RETESTED |
| BUG-H | Low | Library video thumbnails 404 for stale external YouTube IDs (`i.ytimg.com`) | FIXED, RETESTED (2026-10-19) |
| BUG-I | Low–Med | Staff nav exposed SUPER_ADMIN-only **Curriculum** console → 403 dead link | FIXED, RETESTED |
| BUG-J | Medium | Duplicate create → 500 instead of 409 (Prisma `P2002` unhandled, 29 unique constraints) | FIXED, RETESTED |
| BUG-K | Low | Mobile **"Week Warrior"** achievement badge renders empty green square (missing icon) | FIXED, RETESTED (2026-10-19) |

New/extended regression suites: `content-library-assignments.e2e-spec.ts` (6), `diagnosis-scoping.e2e-spec.ts` (9), `attempt-read-scoping.e2e-spec.ts` (5), `all-exceptions.filter.spec.ts` (6, incl. 2 new P2002→409 cases).

Live post-fix verifications: `scripts/qa/verify-reports-fix.mts` (0 console errors, no NaN, real data), `scripts/qa/verify-nav-fix.mts` (3/3 nav-gating PASS), `fuzz-write-path.mjs` WP-K (201 then 409).

Synthetic fixtures created for proof, then **fully removed**: synthetic tenant `1111…`, peer/classmate students, and `QA-DUP-%` duplicate academic years. Verified `sanro_dev` back to 5 users / 143 assignments / 1 attempt / 1 academic year.

**Result:** DONE — `pnpm --filter @sanro/api test` → **563 passed / 563** across 27 files; `tsc --noEmit` exit 0.

---

## Phase P9 (2026-10-19) — Product-decision review + cosmetic fixes + security/MCP assessment

Scope per master prompt: review FINDING-C/D/G/H (no contract changes without approval),
fix the two authorized cosmetic defects, assess dependencies / postgres MCP / live AI,
prepare the credential-rotation checklist.

### Product decisions (reviewed, NOT changed)
All four findings inspected against source + spec. None is a clear spec-mandated
non-contract fix, so all four are held for product-owner sign-off. Full analysis in
`docs/qa/DECISION_TABLE.md`.
- **FINDING-C** (`/auth/me` institutionId): zero production consumers; recommend document-as-is.
- **FINDING-D** (`/learning/home` staff 200): self-scoped, no leak, matrix is `lenient`; recommend keep.
- **FINDING-G** (`/app/papers` UI guard): API mutations already `@Roles`-guarded; recommend staff-only page guard (UX defense-in-depth).
- **FINDING-H** (`forbidUnknownValues`): pipe **strips** unknown keys (no `.strict()`); docs inaccurate. Strip already blocks mass-assignment; recommend correct the docs (spec amendment needs sign-off).

### Cosmetic defects — FIXED, RETESTED
- **BUG-H** (stale YouTube thumbnails): `ItemCard` now swaps a failed `<img>` to the type-icon
  fallback via `onError` (`apps/web/.../app/library/page.tsx`). Verified live:
  `scripts/qa/verify-library-thumb-fix.mts` → 12 images, **0 broken** (screenshot
  `web-library-BUGH-FIXED.png`). The 10 network 404s still occur upstream but no longer render broken.
- **BUG-K** (Week Warrior empty badge): seed `icon:'zap'` had no `BADGE_ICONS` entry and no asset;
  the fuzzy matcher self-matched so it never fell back. Added `zap`/`clock` mappings + a
  `hasIcon3D` guard in `apps/mobile/components/visuals.tsx`. New regression suite
  `apps/mobile/components/visuals.test.tsx` (7 cases).

### Regression gates (this session)
| Gate | Result |
|---|---|
| `pnpm -r typecheck` | **6/6** exit 0 |
| `pnpm -r lint` | **0 errors** (API 212 / mobile 27 / web 99 warnings — unchanged) |
| `pnpm --filter @sanro/mobile test` | **12/12** (was 5/5; +7 BUG-K cases) |
| `pnpm --filter @sanro/web test` | **15/15** |
| BUG-H live verify | PASS (0 broken images) |
| API suite | **563/563** (unchanged — no `apps/api/src` edits this session) |

### Security / dependency / MCP assessment (no config or version changes made)
- `pnpm audit --prod` (live, 2026-10-19): **0 critical / 22 high / 17 moderate / 1 low** — differs from
  the historical 0/35/19/1; grouped by package in the handoff. No upgrades applied.
- `expo-system-ui`: **not** declared, not in lockfile, not installed → prebuild-time advisory only, not a vuln.
- **postgres MCP root cause (verified, not fixed — config change needs approval):** the configured
  `uvx --with mcp<2 postgres-mcp …` resolves to **0.1.0**, which reads the DSN **only from a CLI arg**
  (`sys.argv[1]`, `len(sys.argv)!=2` → exits 1 with *"Please provide a database URL…"*), ignoring the
  `DATABASE_URI` env the config supplies. **0.3.0** *does* read `DATABASE_URI` but cannot resolve
  (`pglast==7.2.0` unsatisfiable). Target is `localhost:5433/friicrm` — a **different** project's DB,
  not SANRO's `sanro_dev`/`sanro_test` on 5432. Repair steps documented; **no config/cache/permission touched**.
- **Live AI:** no `AI_*` keys in `apps/api/.env` → `AI_PROVIDER` defaults to `mock`. Live injection/timeout
  testing remains **BLOCKED** (intentional); test plan prepared.
- **Credential-rotation checklist** prepared (locations only, no values) for the separate authorized batch.

**Result:** DONE — 2 cosmetic defects fixed + retested; 4 findings held for decision; deps/MCP/AI assessed
without config changes; **0 deletions** maintained.

---

## Phase P10 (2026-10-19) — FINDING-C/D/G/H decisions implemented + regression

Scope per master prompt: apply the four proposed decisions (verified first against
`DECISION_TABLE.md` + master spec + source), implement only what the spec supports,
re-run targeted then full gates, preserve all security boundaries.

### Decisions applied (all four matched the table's recommendations)
- **FINDING-C → C-B (keep).** Verified zero production consumers; both auth stores read
  `institutionId` from the **login** payload; no spec requires it. **No code change.** No doc
  claimed `/auth/me` returns it → no doc correction needed.
- **FINDING-D → D-B (keep 200).** Verified self-scoped, no leak, matrix `lenient`.
  **No code change.** Re-verified live via `diagnose-matrix.mjs`: `LEARN-HOME SA/IA/TEACHER=200`,
  `PARENT=403`.
- **FINDING-G → G-A (staff-only UI guard). IMPLEMENTED.** Nav already gated `/app/papers`
  behind `staff`; API mutations `@Roles(IA, TEACHER)`. Added `useAuthStore` render-guard
  (`TEACHER`/`INSTITUTION_ADMIN`/`SUPER_ADMIN`) to `papers/page.tsx`, reusing the
  `content-processing` pattern. API `@Roles` remains the security boundary.
- **FINDING-H → H-A (correct docs). IMPLEMENTED.** `AGENTS.md:106` + `MASTER_PRODUCT_SPEC.md:195`
  rewritten: unknown keys **stripped** by default, `.strict()` where rejection is required
  (admin-curriculum ×1, content-ingest ×2). Validation behaviour unchanged. Spec amendment
  owner-approved this batch.

### Files changed (this batch)
| File | Change |
|---|---|
| `apps/web/.../app/papers/page.tsx` | staff-only render-guard (FINDING-G) |
| `apps/web/.../app/papers/page.test.tsx` | **new** — 7 role-guard regression cases |
| `scripts/qa/probe-papers-guard.mts` | **new** — browser route-guard probe (5 roles) |
| `AGENTS.md` | line 106 corrected (FINDING-H) |
| `docs/MASTER_PRODUCT_SPEC.md` | line 195 corrected (FINDING-H, owner-approved) |
| `apps/api/test/validation.constraints.e2e-spec.ts` | **+1** `.strict()` unknown-key→400 test |
| `scripts/qa/_gen-routes.mjs` | **new** — regenerates `routes-for-sweep.txt` |
| `apps/api/src/routes-for-sweep.txt` | **new** — generated probe artifact (`.txt`, not compiled) |

No API business-logic change (`apps/api/src/*.ts` untouched by this batch).

### Targeted gates (run first)
| Gate | Result |
|---|---|
| `vitest run papers/page.test.tsx` | **7/7 PASS** (FINDING-G guard) |
| `vitest run validation.constraints.e2e-spec.ts` | **8/8 PASS** (was 7, +strict test) |

### Full regression gates (this execution — actual results)
| Gate | Command | Result | Baseline |
|---|---|---|---|
| API tests | `pnpm --filter @sanro/api test` | **564/564**, 27 files, exit 0 | 563 → +1 strict |
| Web tests | `pnpm --filter @sanro/web test` | **22/22**, 2 files, exit 0 | 15 → +7 guard |
| Mobile tests | `pnpm --filter @sanro/mobile test` | **12/12**, 2 suites, exit 0 | 12 |
| Typecheck | `pnpm -r typecheck` | **6/6 packages**, exit 0 | 6/6 |
| Lint | `pnpm -r lint` | **0 errors** (API 212 / web 99 / mobile 27 warnings) | 0 errors |

### Authorization / route-guard probes (re-run — actual results)
| Probe | Result | Notes |
|---|---|---|
| Route-guard (new) `probe-papers-guard.mts` | **5/5 PASS** | student/parent blocked; teacher/principal/admin allowed |
| `diagnose-matrix.mjs` | **exit 0** | `LEARN-HOME` staff 200 / parent 403 (FINDING-D) |
| `fuzz-write-path.mjs` | **11/11 PASS** | guards + mass-assignment hold (FINDING-H) |
| `probe-auth-security.mjs` | **10/10 PASS** | session/auth boundary intact (FINDING-C) |
| `probe-rate-limit.mjs` | **5/5 PASS** | clean-window run (earlier FAIL was back-to-back artifact) |
| `probe-ai-surface.mjs` | **12/12 PASS** | injected role stripped, no escalation (FINDING-H) |
| `sweep-authz.mjs` | **120 routes, 0 five-xx** | regenerated artifact; always-200 routes spot-checked → self-scoped/reference; no cross-tenant leak |

**Result:** DONE — 4 decisions resolved (2 no-change, 2 implemented); targeted + full gates green;
authorization/route-guard probes re-run green; **0 deletions**, HEAD unchanged (`1b1f664`).

---

## P8 — Final validation + report

- API final validation: DONE (563/563, typecheck clean).
- UI/mobile final validation: DONE — web walkthrough 69 pages; mobile 5-tab student journey + AI round-trip (see P5); post-fix re-verifications green.

**Result:** DONE.

### Final gate confirmation (2026-10-19, end of session)

| Gate | Command | Result |
|---|---|---|
| API tests | `pnpm --filter @sanro/api test` | **563/563 passed**, 27 files, exit 0 |
| Web tests | `pnpm --filter @sanro/web test` | **15/15 passed**, exit 0 |
| Mobile tests | `pnpm --filter @sanro/mobile test` | **5/5 passed**, exit 0 |
| Typecheck | `pnpm -r typecheck` | **6/6 packages**, exit 0 |
| Write-path fuzz | `node scripts/qa/fuzz-write-path.mjs` | **11/11 passed** |
| Rate-limit probes | `node scripts/qa/probe-rate-limit.mjs` | **5/5 passed** |
| AI-surface probes | `node scripts/qa/probe-ai-surface.mjs` | **12/12 passed** |
| Web walkthrough | `npx tsx scripts/qa/web-walkthrough.mts` | **58 PASS / 10 PARTIAL / 1 transient FAIL** (69 pages) |
| Nav + Reports re-verify | `npx tsx scripts/qa/verify-nav-fix.mts`, `verify-reports-fix.mts` | **3/3**, **0 console errors** |
| Git deletions | `git status --porcelain` | **0** (modified + untracked only) |

---

## Pending work (next session)

1. ~~FINDING-C/D/G/H~~ — **resolved** in P10 (C-B/D-B keep as-is, G-A guard implemented, H-A docs corrected).
2. `pnpm audit --prod`: 0 critical / 22 high / 17 moderate / 1 low outstanding (no versions changed this session).
3. ~~BUG-H + BUG-K~~ — fixed + retested (P9).
4. PostgreSQL MCP repair (separate approval; needs config change + OpenCode restart).
5. Credential rotation (approved, deferred; separate batch — never reprint values).
6. Live-provider AI injection/timeout testing (needs `AI_API_KEY` — intentionally not run).
7. `leaderboard.tsx` 3D upgrade (deferred).

## Next exact action

Remaining work = the separate follow-up tasks (2, 4, 5, 6, 7 above). The four product
decisions (P10) and both cosmetic defects (P9) are complete and retested; refresh
`chatgpt.md` only if project state or next steps materially change.

Write `docs/qa/FINAL_QA_REPORT.md` + `docs/qa/TEST_CASES.md`, refresh `chatgpt.md`, then triage FINDING-C/D/G/H (product decisions).

---

## Phase P11 (2026-10-19) — MCP repair + content taxonomy 17 to 6 + roadmap rewrite

Mandate: connect/extend MCPs, remove unneeded lesson types, rewrite the plan.

- **MCP:** `opencode.jsonc` postgres `DATABASE_URI` repointed from the dead
  `FRIICRM_MCP_DB_URI` (wrong project's DB, 0 tools) to `{env:SANRO_MCP_DB_URI}`
  (User-scope env var; value never printed). `docs/MCP_SETUP.md` written
  (decision matrix + research citations + restart note).
- **Content taxonomy:** new `apps/api/src/common/content/content-types.ts`
  (+ `content-types.spec.ts`, 5/5); read-path expansion + facet merge in
  `curriculum/content.service.ts`; authoring/query gates 17 to 6
  (`content-library.controller.ts`, `curriculum.controller.ts`);
  `content-library.service.ts` filter via `canonicalTypeMembers`; writers
  aligned (PDF_BOOK->NOTES, QUIZ->OTHER); seed `ARTICLE`->`NOTES` (7x);
  both local DBs remapped (dev + test: VIDEO 69 / NOTES 74, 0 legacy rows).
  Web library `TYPE_META` down to 6 + legacy alias + copy fix.
- **Plan:** new `docs/ROADMAP.md` (P0/P1/P2/CUT + failure modes).
  `docs/MASTER_PRODUCT_SPEC.md` preserved untouched.
- **Evidence:** `artifacts/qa/2026-10-19/screenshots/library-taxonomy-canonical.png`
  (chips `All 143 / Video 69 / Notes 74`, no legacy labels).
- **Gates:** typecheck 6/6; API 569/569 (28 files); web 22/22; mobile 12/12.

## Phase P12 (2026-10-19) — "fix all issues": AR defects fixed + content audit

Browser-driven (chrome-devtools) AR verification found two real defects, both
fixed and verified:

1. **AR activity request storm (high).** `POST /ar/:id/activity` ran in a
   self-sustaining loop: **201 x23 then 429 x475** (+500 preflights) in one
   page load (console: 429 x6278 aggregate). Root cause: `Model3DViewer`
   effect deps `[src, attempt, onReady, onError]` while `ConceptArPanel`
   passed an inline `onReady` arrow -> mutate -> rerender -> new identity ->
   effect rerun -> `setStatus('loading')` + mutate ... (this also caused the
   permanent "Loading 3D model..." spinner). Fix: callbacks moved to refs
   (deps `[src, attempt]`), native `load`/`error` listeners for status, and a
   per-model `startedRef` dedupe for `AR_STARTED`.
   **Verified: 2 posts per page load, stable; spinner resolves.**
2. **3D model never loaded (high).** `<model-viewer src="/api/v1/files/...">`
   resolved against the web origin (`:3000`) -> **404**
   (`wl: fetch .../sphere.glb responded with 404`); files live on API `:4000`.
   Mobile already assumed web-origin files (`lib/ar-assets.ts` resolves against
   `WEB_BASE`) but no proxy existed on the web origin. Fix:
   `apps/web/next.config.mjs` rewrite `/api/v1/files/:path*` -> API origin
   (covers web + mobile consumers).
   **Verified: `GET :3000/api/v1/files/ar/models/sphere.glb -> 200`,
   `model-viewer.loaded=true`, hotspots render.**
   Screenshot: `artifacts/qa/2026-10-19/screenshots/ar-3d-model-renders.png`.

**Verified non-issues (tested; deliberately no code change):**

- AR grade gating works: grade-8 Atom AR for a grade-10 student -> `count: 0`;
  grade-10 shapes -> `count: 3`.
- Concept `403` on `/learning/concepts/:id` is correct assigned-grade
  enforcement (`learning.service.ts:441`), not a bug.
- Desktop `canActivateAR=false` hides the "View in your space" button by
  design; the AR affordance is phone-only (WebXR/Scene Viewer).

**Content audit (BLOCKED - content owner):** all **24 distinct** YouTube
embeds behind the 69 seed video lessons are dead on YouTube. Evidence:
oEmbed 404 for every one of the 24 IDs; watch-page `playabilityStatus:ERROR`
sampled; controls (Rick Astley / Me at the zoo / Gangnam Style) all 200 in the
same run, so the probe is sound. Source: `apps/api/prisma/seed.ts:2061-2130`
recycles fabricated placeholder IDs across ~70 lesson titles (e.g. a statistics
lesson mapped to a chemistry video). **Not auto-replaced:** choosing ~69
curriculum-aligned videos is a content-authoring decision; the player already
degrades gracefully (dark poster, YouTube's own error card on play). Prod not
probeable read-only (gateway 404 without credentials).

**youtube MCP:** added in P11, **removed in P12** after proving it dead:
7/7 transcript fetches failed from this network (2 x `-32603 Could not find
captions`, 5 x `null`) on videos with known-good captions, while oEmbed
controls returned 200 (so egress works; the caption endpoint this scraper
uses is blocked). Config re-validated: **JSON valid, 12 servers**. A working
replacement needs a YouTube Data API key (`YOUTUBE_API_KEY`, absent).

## Phase P12 - final gates (supersede the table above)

| Gate | Command | Result |
|---|---|---|
| Typecheck | `pnpm -r typecheck` | **6/6 packages**, exit 0 |
| Web tests | `pnpm --filter @sanro/web test` | **22/22 passed** (fresh) |
| API tests | `pnpm --filter @sanro/api test` | **569/569 passed**, 28 files (API source untouched in P12) |
| Mobile tests | `pnpm --filter @sanro/mobile test` | **12/12 passed** (mobile untouched in P12) |
| Browser verify | chrome-devtools | GLB 200 via rewrite; `model-viewer.loaded=true`; activity 2/load stable; screenshots saved |
| MCP config | `ConvertFrom-Json` | valid, 12 servers, youtube absent |
| Git deletions | `git status --porcelain` | 0 |

## Updated pending (supersedes the list above)

1. ~~postgres MCP~~ - **done** (wiring fixed; verified read-only against `sanro_dev`).
2. ~~MCP restart~~ - **done** (all 10 configured servers connect at boot).
3. ~~leaderboard 3D~~ - **done** (web + mobile, with unit coverage).
4. ~~on-device mobile/AR~~ - **done** for AR/3D (3D model + hotspots verified on the
   phone); the mobile podium's device screenshot is queued (the USB device dropped off
   mid-session).
5. **Content owner:** replace the 24 dead seed video IDs (69 VIDEO lessons) -
   BLOCKED on selecting/verifying real CBSE-aligned videos. Audit method above.
6. **Leaderboard `period`** is accepted but ignored by the API - needs an XP-event ledger (P2).
7. `pnpm audit --prod`: 4 high / 3 moderate outstanding, all without a safe upstream fix.
8. Credential rotation (approved, deferred; never reprint values).
9. Live-provider AI injection/timeout testing (needs `AI_API_KEY`).
10. Prod read-only checks (dead-video state, content cleanup) - no prod credentials here.

---

## Phase P13 (2026-10-20) — dependency remediation + leaderboard 3D + device harness

Mandate: "continue all" - finish every deferred item that is actionable.

### Advisories: 22 high / 17 moderate / 1 low -> **4 high / 3 moderate / 0 low**

**Root cause of a silently inert control:** the root `package.json` carried an npm-style
top-level `"overrides"` block (`tar`, `proxy-addr`, `shell-quote`). **pnpm never reads that
field** - the lockfile had no `overrides:` section and the installed versions were the
un-pinned ones (`tar` 7.5.22, `shell-quote` 1.12.0). The block was moved to
`pnpm-workspace.yaml` (pnpm >=10 location) and is now recorded in the lockfile.

| Package | Before | After | Closed |
|---|---|---|---|
| xlsx (direct; parses user uploads) | 0.18.5 | 0.20.3 (SheetJS official CDN tarball - npm ships no patched release) | 2 HIGH |
| multer (Nest file upload) | 2.2.0 | 2.4.0 | 2 HIGH + 1 low + 1 moderate |
| postcss | 8.4.31 / 8.4.49 | 8.5.31 | 4 (1 HIGH + 3 moderate) |
| sharp | 0.35.4 | 0.35.5 | 1 HIGH |
| fast-uri | 3.1.7 | 3.1.8 | 1 moderate |
| decode-uri-component | 0.2.2 | 0.5.0 | 1 moderate |
| deepmerge-ts | 7.1.5 | 8.0.0 | 1 HIGH |
| markdown-it | 10.0.0 | 14.3.1 | 1 moderate |
| linkify-it | 2.2.0 | 5.0.2 | 2 HIGH |
| brace-expansion | 1.1.18 / 2.1.4 / 5.0.9 | 1.1.21 / 2.1.7 / 5.0.12 | 3 HIGH + 3 moderate |
| postcss-selector-parser | 6.1.4 | 7.1.6 | 1 moderate |
| next | 15.5.25 | 15.5.28 | 2 moderate |

Also fixed: **react/react-dom parity** - the web app had react 19.0.0 with react-dom 19.3.0
(a real peer mismatch that fails the test suite at import time); both are now pinned to
**19.3.0** and `pnpm peers check` reports **no issues** (it reported one before).

**Remaining 7 advisories - deliberately not "fixed"** (no upstream patch, or the fix is a
major/ESM break that would destabilise the in-flight Expo 53 upgrade): `image-size` x2
(metro build tooling; fix = 1.x -> 2.x major), `node-forge` (@expo/cli, no patched release),
`braces` (no patched release), `js-yaml` (jest/istanbul tooling; 3.x -> 5.x major removes
`safeLoad`), `sprintf-js` (no patched release, via js-yaml 3), `uuid` (patched release is
ESM-only; would break CJS consumers in the Expo toolchain).

### Install-induced failure mode found and fixed
The `@prisma/client` peer-hash changed during install, so its postinstall ran **without the
app's schema** and generated no client -> `ArModelFormat` undefined -> the API suite failed
at the seed step. Fix: `apps/api` now has `"pretest": "prisma generate"`, so the test gate
always regenerates the client first - this failure mode cannot recur.

### Leaderboard 3D podium
The flat top-3 cards are now a CSS-3D podium (perspective stage, per-rank column heights,
`rotateX` tilt, `translateZ` rank numeral, brand-tinted floor glow) - no new dependency.

### Device harness
New `scripts/qa/device-smoke.ps1` (adb reverse 4000/8081 -> launch `com.sanro.ai` ->
screencap into `artifacts/qa/<date>/screenshots/`) so on-device checks are reproducible
instead of ad-hoc.

### MCP: all servers connected (the "connect all mcp" mandate)

Root cause of the mass failures was a **transient DNS outage at 19:28** (OpenCode's MCP
client gave up and never retried), not missing configuration: context7/exa/deepwiki all
answer `200` to an MCP `initialize` from the shell. Two genuine wiring bugs were also found:

- **postgres MCP was mis-wired twice.** The old entry passed the DSN as a `DATABASE_URI`
  **env** var plus `--access-mode restricted`, but the build that `mcp<2` resolves to
  (postgres-mcp 0.1.0) does `if len(sys.argv) != 2: raise` - it wants the DSN as the
  **only positional argument** and ignores the env var. Fixed to
  `uvx --with "mcp<2" postgres-mcp {env:SANRO_MCP_DB_URI}`; 0.1.0 is read-only by default
  (`BEGIN TRANSACTION READ ONLY` + `ROLLBACK`).
  **Verified live:** `query` -> `sanro_dev`, 143 ContentItems; a `CREATE TABLE` probe is
  rejected ("cannot execute CREATE TABLE in a read-only transaction").
- **shadcn** timed out because `shadcn@latest` was re-downloaded on every start -> pinned
  to `shadcn@4.22.1` (now cached) -> 7 tools.

| Server | Tools | Note |
|---|---|---|
| playwright / chrome-devtools / dart / memory / iconify | 25 / 32 / 13 / 9 / 3 | already healthy |
| **postgres** | 1 | fixed + verified (read-only) |
| **context7** | 2 | reconnected (DNS outage) |
| **exa** | 2 | reconnected (DNS outage) |
| **deepwiki** | 3 | reconnected (DNS outage) |
| **shadcn** | 7 | pinned + cached |
| unsplash | - | disabled, no `UNSPLASH_ACCESS_KEY` (and no product need) |
| youtube / tavily | - | removed (dead / 401 without a key; exa covers search) |

Re-verification scripts: `scripts/qa/mcp-postgres-check.mjs`, `scripts/qa/mcp-stdio-probe.mjs`.
Full matrix + root causes: `docs/MCP_SETUP.md`.

### On-device verification (physical Android, THC3Y19429006728)

New reproducible harness: `scripts/qa/device-smoke.ps1` (adb reverse 4000/8081/3000 ->
launch `com.sanro.ai` -> screencap into `artifacts/qa/<date>/screenshots/`) and
`scripts/qa/device-tab-check.ps1` (drives every mode + measures the rendered label).

- App runs on the device against the **local** API via `adb reverse` (Home shows real
  data: 420 XP, 63% mastery, Science 28 topics / Maths 30 topics).
- **AR / 3D works on the phone:** deep link `sanro-ai://concept/<id>` -> AR tab -> the
  **sphere model renders** with hotspots ("Radius (r)", "Diameter (2r)"), and switching to
  the **cone** re-renders with its own hotspots ("Apex", "Slant height (l)", "Circular base").
  The model was fetched **through the new `/api/v1/files` proxy** (device -> :3000 ->
  adb reverse -> host web -> rewrite -> API), so the BUG-M fix is proven on real hardware.
  The build correctly reports *"This build does not include a native AR runtime"* - the
  "View in your space" affordance is device-gated (WebXR/ARCore), not a defect.
- **BUG-N found and fixed here** (mobile mode bar crushed by flex-shrink -> sliced
  labels). Verified: 53-68px labels in all 7 modes, portrait **and** landscape.

### Edge cases covered in this phase

| Edge case | Result |
|---|---|
| 7 concept modes, portrait | all labels 53-68px (uncompressed) |
| 7 concept modes, landscape (least vertical space) | all labels 53px |
| AR mode on a tall content page (the trigger) | fixed, verified |
| 3D model on a real phone | renders, hotspots work, model switch works |
| Native-AR affordance on a non-AR device | correctly hidden with an explanation |
| Dependency tree | 569/569 API, 22/22 web, 12/12 mobile, typecheck 6/6, `next build` 60/60 pages |
| `react`/`react-dom` parity | pinned 19.3.0/19.3.0 (was 19.0.0 vs 19.3.0 -> suite failed to import) |
| pnpm peer graph | no issues (was 1) |
| Fresh install -> Prisma client | `postinstall: prisma generate` added so the client can never be orphaned again |
| Leaderboard with <3 / >=3 entries | podium hidden / podium renders (2-1-3 order, gold/silver/bronze) |
| Leaderboard `period` parameter | **accepted but ignored by the API** (weekly/monthly/all return identical rows) - finding, needs an XP-event ledger to fix (P2) |
| Teacher creating a student | 403 by design (teachers are scoped to their groups); principal path returns 201 |
| MCP servers | 10 connected; the only non-connected one needs an API key that does not exist here |

### Synthetic data added to `sanro_dev`

Two demo students (**Priya Sharma**, **Rohan Verma**) created through the product's own
admin API (`POST /students` as the principal) so the leaderboard podium has >=3 entries
and could be verified. No credentials were printed; both are demo fixtures in the local dev DB.

### Phase P13 (continued) — MCP verified at boot + mobile leaderboard 3D podium

**MCP durability check.** After the OpenCode server restarted, **every configured server
connected on its own** - playwright, chrome-devtools, dart, memory, iconify, shadcn,
context7, exa, deepwiki, postgres (10/10, `mcp connected` in the log). The three remote
servers and shadcn had needed the "touch the definition" trick before; they no longer do,
which proves the fixes are durable rather than session-scoped. (The `github`/`tavily`/
`youtube` lines in the log are stale entries for servers no longer in the config.)

**Mobile leaderboard 3D podium** (the deferred `leaderboard.tsx` item - the *mobile*
screen had no podium at all, only a flat list). Implemented as a CSS-3D stage
(`perspective` + `rotateX` tilt, per-rank block heights 96/72/56, gold/silver/bronze,
upright labels, floor glow) with the logic extracted into
`apps/mobile/components/leaderboard-podium.ts` and covered by **6 new jest cases**
(`leaderboard-podium.test.tsx`): podium hidden below 3 learners, 2-1-3 order, height
ordering, distinct medal colours, missing-rank slot, order independence.
Mobile suite: **3 suites / 18 tests passing**.

**Limitation:** the USB device dropped off mid-session (`adb devices` -> empty), so the
on-device screenshot of the mobile podium could not be captured. The logic is unit-tested
and the identical design is screenshot-verified on the web
(`web-leaderboard-3d.png`); the on-device capture is queued for the next device session
(`scripts/qa/device-smoke.ps1 -Label device-12-mobile-leaderboard-3d`).

---

## Phase P14 (2026-10-21) — "run everything": full gate + probe sweep, harness improvements

### Gates (all run, all green)

| Gate | Command | Result |
|---|---|---|
| Typecheck | `pnpm -r typecheck` | **6/6 packages** |
| Lint | `pnpm -r lint` | **0 errors** (api 212 warnings, web 95, mobile 27 - all pre-existing style warnings) |
| Build | `pnpm build` | **6/6 tasks** (Next 15.5.28, 60/60 pages) |
| API tests | `pnpm --filter @sanro/api test` | **569/569** (28 files) |
| Web tests | `pnpm --filter @sanro/web test` | **22/22** |
| Mobile tests | `pnpm --filter @sanro/mobile test` | **18/18** (3 suites) |
| Dependency audit | `pnpm audit --prod` | 4 high / 3 moderate / 0 low |

**Lint is a working gate again** - the in-flight ESLint 9 flat-config migration landed
(`eslint.config.mjs` in api/web/mobile), so the "lint is broken repo-wide" note in
`AGENTS.md` was stale and has been corrected (with the real test counts: 569/28).

### QA probe suite (every script in `scripts/qa/`)

| Probe | Result |
|---|---|
| `fuzz-write-path.mjs` | **11/11 PASS** (no 2xx/5xx on unauth/wrong-role/malformed writes, no leaks) |
| `probe-auth-security.mjs` | **10/10 PASS** (enum-safe login, no raw reset token, CORS allowlist, no stack traces) |
| `sweep-authz.mjs` | **120 routes swept, no 5xx for any role** |
| `probe-ai-surface.mjs` | **12/12 PASS** (injection vectors never reflected, parent blocked, tenant context not leaked) |
| `probe-rate-limit.mjs` | **5/5 PASS** (login 10/min, forgot 3/min, register 5/min, contact 3/min, clean 429 body + `Retry-After`) |
| `probe-files-proxy.mjs` | **9/9 PASS** (new probe for the `/api/v1/files/*` proxy: faithful pass-through, 404 on missing, traversal blocked, non-GET not proxied, query string kept, range + HEAD OK, non-file routes not proxied) |
| `probe-papers-guard.mts` | **5/5 PASS** (staff-only route guard per role) |
| `verify-nav-fix.mts` | **3/3 PASS** (Curriculum visible to SUPER_ADMIN only) |
| `verify-library-thumb-fix.mts` | **PASS** (zero broken images rendered) |
| `verify-reports-fix.mts` | **PASS** (real data rendered) |
| `verify-roles.mts` | student **8/8**, teacher **8/8**, parent **3/3** |
| `verify-empty-states.mts` | **18/18 PASS** |
| `web-walkthrough.mts` | **60 PASS / 2 PARTIAL / 7 EXPECTED / 0 FAIL** (69 pages) |
| `live-verify.mts` | live screenshots captured (read-only) |

### Harness improvement - the walkthrough gate is actionable again
The walkthrough flagged **9 PARTIAL** pages, but every one was *expected* behaviour:
RBAC denials (403 on sub-requests a role may not make) and aborted RSC prefetches
(`ERR_ABORTED`). That noise made the gate useless - a real regression would have been
buried in it. The script now classifies errors into three honest buckets:
- **PARTIAL** - unexpected console/network errors (needs a human)
- **EXPECTED** - 403 RBAC denials and aborted prefetches (listed, but not defects)
- **KNOWN** - 404s on `i.ytimg.com` (the open dead-video content defect, BUG-H; still
  listed with URLs so it cannot be forgotten)
It also no longer hardcodes `2026-10-19` as the evidence folder (it uses today's date),
and non-ytimg 404s now surface **with their URL** instead of a bare "status of 404".
Result: **60 PASS / 2 PARTIAL (the open content defect) / 7 EXPECTED / 0 FAIL**, versus
58 PASS / 10 PARTIAL / 1 FAIL in the previous session.

### Lint debt cleared in the files this session touched
`apps/web/.../gamification/leaderboard/page.tsx` (removed 3 unused imports),
`apps/web/components/ar/Model3DViewer.tsx` (replaced both `any`s with a typed
`ModelViewerElement` + `ElementType`), and `apps/web/components/ar/ConceptArPanel.tsx`
(added an `eslint-disable` **with rationale** on the intentionally-omitted
`recordActivity` dependency, so nobody "fixes" it and re-creates the BUG-L request storm).

### New regression guard for BUG-L (the AR activity storm)
The request storm was fixed by hand and had **no automated coverage** - a future refactor
could have reintroduced it silently. New probe `scripts/qa/probe-ar-activity-loop.mjs`
drives a real browser through the AR / 3D tab and asserts the activity telemetry stays
bounded: **5/5 PASS** (`posts=2` - AR_OPENED + AR_STARTED only, `429s=0`, model loaded,
no unexpected console errors; the known dead-thumbnail 404s are classified, not ignored
blindly). The healthy page load posts **2** requests where the bug produced **475**.

### On-device results (physical Android, THC3Y19429006728) - all green
- **Mobile leaderboard 3D podium verified on the device**: gold #1 (Aarav Sharma, 420 XP,
  trophy), silver #2 (Priya), bronze #3 (Rohan), tilted 3D stage + floor line, and the full
  list below with the "You" badge. Evidence:
  `artifacts/qa/2026-10-21/screenshots/device-20-leaderboard-podium.png`.
- **Mode bar regression re-run with a healthy API**: all 7 modes render **53px** labels
  (PASS) - `scripts/qa/device-tab-check.ps1`.

### Two mobile defects found and fixed while doing it
1. **Cold-start race (fixed)**: `apiAuthed` used the token before the async SecureStore
   hydration had restored it -> `Not authenticated` was thrown and **cached** by the query,
   leaving screens permanently empty. `apiAuthed` now awaits the first hydration
   (`apps/mobile/lib/api.ts`), so no request can be made before the token exists.
2. **Endless spinner hid the failure (fixed)**: the mobile leaderboard ignored
   `isLoading`/`isError` and always rendered the list spinner, so a failed request looked
   identical to "loading". It now renders a real error state ("Could not load the
   leaderboard - Network request failed") and a real empty state, using the repo's existing
   `EmptyState` component.
   (The symptom that exposed both was the API dev server having died - its shell timed out -
   so the app showed zeros and a spinner instead of data. Fixing the *presentation* of that
   failure is what turned an invisible outage into a diagnosable one.)

### Leaderboard icons aligned with the app's own 3D artwork
The mobile podium originally used plain Ionicons glyphs (trophy/medal) on flat colour
discs, which did not match the rest of the app (the achievements screen renders the
`Icon3D` 3D asset set). Swapped to the real assets: **#1 `medal-1st`** (gold medal with a
"1"), **#2 `medal`** (ribboned medal with a star), **#3 `star`**, and the list rows now use
the 3D **`trophy`** artwork. The web app has no 3D asset set (it is uniformly lucide line
icons), so its podium keeps lucide `Crown`/`Medal` to stay consistent with that surface.
Evidence: `artifacts/qa/2026-10-21/screenshots/device-22-leaderboard-real-icons.png`.

### D4 credential rotation (executed)

- The demo/QA password is **no longer in the repository** (it was in 27 files: the seed,
  the e2e helpers, one spec and ~20 scripts). It now comes from `SEED_DEMO_PASSWORD`
  in `apps/api/.env` (git-ignored) through `apps/api/src/common/demo-password.ts` (API
  side) and `scripts/qa/_env.mjs` (scripts side). Both throw a clear error when the
  variable is missing, so a fresh clone cannot silently fall back to a guessable value.
- `.env.example` now documents `SEED_DEMO_PASSWORD=` (empty) and no longer ships a
  placeholder `AUTH_SECRET` (it is blank with a "generate with openssl rand -base64 48"
  note).
- The credential that had been printed in an earlier session
  (`~/.config/opencode/service.json`) was **rotated** to a fresh 64-character random
  value (never reprinted). The running OpenCode service keeps the previous value in
  memory until it restarts.
- Re-verified after the change: API **573/573**, fuzz-write-path **11/11**,
  probe-ai-surface **12/12**, probe-auth-security **10/10** - all green, and
  `grep Sanro@123` over the source tree returns **nothing**.

### MCP: 10 servers live, 1 needs a restart, 2 removed

| Server | State |
|---|---|
| playwright 25, chrome-devtools 32, dart 13, memory 9, iconify 3, shadcn 7 | connected |
| **postgres 1** | connected and **verified**: reads `sanro_dev`, and a write probe is rejected ("cannot execute CREATE TABLE in a read-only transaction") |
| **context7 2, exa 2, deepwiki 3** | connected (they had failed only because of the transient DNS outage at 19:28; a definition change re-initialised them in place - no restart needed) |
| **github** | wired and verified end-to-end (200 from the endpoint with the User-scope token), but the running OpenCode process predates that env var - it needs the next restart to be picked up |
| unsplash | disabled - needs `UNSPLASH_ACCESS_KEY` (absent) and the product has no image-search need |
| youtube, tavily | removed (youtube: proven dead; tavily: 401 without a key, exa covers search) |

### Phase P14 (2026-10-21) — "do all": research-driven changes + pruning

**Research (exa / context7 / deepwiki / postgres MCPs).** Leaderboard design: repeating
resettable boards beat perpetual ones and a *global* board is much weaker than a
segmented one (trophy.so leaderboard spec, 2025-10); in education, macro boards need
micro boards or low-ranked learners disengage (JCAL systematic review, 10.1111/jcal.13077).
Video curation: judge on curricular alignment, grade appropriateness, language, engagement
and inclusivity (ACER / EdTech Tulna standards); a standardised QA process is what makes
selection repeatable (ACER, NCERT CIET).

**Changes made**
1. **Leaderboard is a real loop now** — `?groupId=` class segmentation (the API returns the
   caller's permitted scopes inline, so web + mobile offer *Whole school* / *Class 10 - A*
   without an extra request), and "This Week" = the **calendar week** (Monday local), not a
   rolling 7x24h window. Verified live: class scope -> Aarav only (420 XP); whole school ->
   Aarav 420, Priya 900, Rohan 300 with the 3D podium. Spec: 5 cases
   (`leaderboard-period.e2e-spec.ts`, one of which asserts the Monday rule directly).
2. **Video curation is syllabus-verified** — `scripts/qa/audit-videos-vs-syllabus.mjs` scores
   every sourced video against the **chapter vocabulary extracted from `books/`** (science
   study notes, maths PDF text) and the lesson's concept terms. Result: **70/70 ALIGNED**
   (68 after three re-sourced videos, then 70 once the auditor's own chapter mapping was
   corrected — this NCERT edition has **no "Constructions" chapter**, so the order was
   off-by-one from chapter 12 and the maths chapters were silently unscored).
   Re-sourced during the pass: a Maharashtra-board video (wrong board), a video not about
   equations, a Bohr-only video where the lesson covers all three atomic models, and a
   sphere-only video for a cylinder+cone+sphere lesson (now a full chapter one-shot).
3. **Pruned 11 files** that were duplicated, one-off or dead (9 overlapping screenshot/login
   scripts -> one parameterised `scripts/screenshots.mts`; a one-off lesson parser; a prod
   probe that can never pass here; an orphaned prisma script) plus the duplicated `.env`
   parser (now one implementation in `src/common/api-env.ts`).
4. **Harness hardening** — `probe-rate-limit.mjs` now waits for a clean limiter window and
   retries instead of reporting a false failure (5/5 PASS confirmed); the consolidated
   screenshot tool reports *why* a login failed (e.g. HTTP 429) and resolves live
   concept/library ids at runtime, so it survives re-seeds.

**Rebuild + re-verification pass.** Full `pnpm build` re-run after the leaderboard work
(**6/6 tasks, 60/60 pages**) and every route re-verified:
- **Regression caught by the harness, not by luck** — the walkthrough reported 69/69 pages
  with console errors (`/_next/static/css/app/layout.css` → 404) because `next build` had
  replaced `apps/web/.next` *while `next dev` was running*. Fix: stop the dev server, build,
  restart (`.next` removed and rebuilt); the walkthrough returned to
  **69 pages: 62 PASS / 7 EXPECTED (RBAC), 0 console errors, 0 failed requests**.
  The ordering rule is now written into `AGENTS.md`.
- `verify-roles` — student **8/8**, teacher **8/8**, parent **3/3**.
- The consolidated screenshot tool was hardened while re-running it: it now waits for
  `networkidle` **and** for shadcn skeletons (`.animate-pulse`) to disappear, so a shot can
  no longer capture loading placeholders; it resolves the concept id from the real
  `/learning/path` shape (`next`/`track`, not `path`), clicks the mode switcher by
  `role="tab"` (the page sets that role explicitly, which overrides the implicit button
  role), and additionally captures a concept that **owns a 3D model** so the AR / 3D mode
  is covered. Output is now deterministic: 22 shots for the student role including all
  five modes on two concepts (one with AR) — VERIFIED by reading the PNGs.
- Login in that tool now waits out the auth limiter and retries instead of skipping a role.

**Edge-case investigation — transient `JSON.parse` in the web dev log.** The dev server
logged one `SyntaxError: Unexpected end of JSON input { page: '/features' }` while other
routes were compiling. Ruled out as an application defect:
- both API clients guard the parse (`apps/web/lib/api.ts` wraps `res.json()` in
  `try/catch` → `payload = null`; `apps/mobile/lib/api.ts` returns early on 204) — VERIFIED;
- `apps/web` contains **no runtime JSON data files** (only `package.json` / `tsconfig.json`) — VERIFIED;
- steady state 5/5 × 200 and under concurrent source-file rewrites 8/8 × 200, error not reproduced — VERIFIED;
- **production** path (`next build` + `next start -p 3100`): 15/15 × 200 and an **empty error log** — VERIFIED.
Cause is a dev-only watcher race: `next dev` rewrites its own `.next/*-manifest.json`
while serving, and a partial read of one of those manifests throws this. It cannot occur
in production (no manifest writes at runtime). No product code changed for it.

**Live leaderboard smoke (after the build replaced `apps/api/dist` and the API was restarted):**
`weekly` → 0/0/0 (no XP since Monday), `monthly` → Aarav 420 / Rohan 300, `all` →
Priya 900 / Aarav 420 / Rohan 300, `allTime` (mobile spelling) → normalised to `all`,
`groupId=<not-my-class>` → **403 rejected**. VERIFIED.

**Final gates:** typecheck 6/6 · lint 0 errors · build 6/6 (Next 15.5.28, 60/60 pages) ·
API 574/574 (29 files) · web 22/22 · mobile **24/24** (4 suites; the leaderboard scope
selector was extracted into `components/leaderboard-scope.ts` with 6 new cases so the
mobile UI is covered by tests, not just typechecked — the phone was offline for the
on-device pass) · audit 4 high / 3 moderate / 0 low ·
web walkthrough 62 PASS / 0 console errors / 0 dead thumbnails · rate-limit 5/5 ·
fuzz-write-path 11/11 · auth-security 10/10 · ai-surface 12/12 · files-proxy 9/9 ·
AR activity loop 5/5 · video liveness 67/67 · device modes 7/7 (portrait + landscape).

## Environment note
Metro crashed once with `ENOENT ... .pnpm-task-run-state-v1\start.lock` - a known
Metro-on-Windows watcher race that happens when pnpm writes under `node_modules`
during a concurrent install/build. Restarting Metro resolved it; the fix is to avoid
running `pnpm install`/`pnpm build` while Metro is watching.

### Phase P15 (2026-10-21) - "keep it simple": the concept page, 7 modes -> 4

**Decision (evidence-based, not preference).** The concept page exposed seven modes. An audit
of the code showed that *three* of them rendered the same `practiceQuestions` pool:
Quick Quiz (client-side, no mastery recorded), Challenge (routed to the very same practice
screen as Practice) and Practice (server-side, records mastery). Two of them also promised XP
that was never awarded. AR / 3D was lesson content sitting in a peer tab.

**Shipped**
1. **4 modes on web and mobile**: Learn - Practice - Flashcards - Ask Sanro AI.
   AR / 3D moved into Learn as an "Interactive 3D Model" card that opens the viewer in a
   dialog (web) / modal (mobile), so the heavy viewer no longer mounts on page load and the
   mode bar no longer needs to scroll.
2. **Cut**: Quick Quiz and Challenge (web panels deleted; the orphaned mobile
   `/quiz/[conceptId]` and `/challenge/[conceptId]` screens deleted).
3. **Practice XP is now real**: 5 XP per correct answer + 10 XP for finishing, written to the
   XP ledger; one shared implementation owns the award and the calendar-day streak rule.
4. **Fixed a P0 crash** found on the device: submitting a practice session failed with a
   foreign-key error (the practice id was written into the assessment-attempt foreign key).
   Provenance is now explicit (`DiagnosticResult.practiceSetId`) with a migration.
5. **Fixed the video player**: YouTube refused to play in the mobile WebView
   (Error 153, then 152-4). The embed now loads through an HTML wrapper with a real https
   origin and a matching `origin=` parameter, autoplays, and keeps the lesson in the app.
   New guard: `scripts/qa/device-video-play.ps1`.
6. **Harness**: the device tab check now drives 4 modes and waits for the mode bar to render
   instead of sleeping a fixed 10s (a cold bundle made the first mode look "not found");
   the consolidated screenshot tool captures the 3D viewer from the Learn card.

**Verified on the physical device (THC3Y19429006728)**
- 4/4 modes render un-compressed labels in portrait **and** landscape (53px labels);
- the video plays in-app (lesson frame captured, no error page);
- the 3D model card opens the viewer from Learn;
- the practice session submits (201) and the XP ledger moves (420 -> 430).

**Web verified in the browser**: 4 role tabs, no "Quick Quiz"/"Challenge" anywhere, the
Interactive 3D Model card inside Learn, the dialog opens with the models and the quick check,
and Practice states the exact XP rule.

**Tests**: API `practice-flow.e2e-spec.ts` (3 new cases), mobile `concept-modes.test.tsx`
(5 new cases) - the mode list is now asserted by a test, so a future mode cannot creep back
in unnoticed.

### Phase P16 (2026-10-22) - "do everything": truthfulness, 3 modes, all MCPs, the English book

**1. The concept page is now 3 modes (Learn - Practice - Ask Sanro AI).** The user's question
("why do we need flashcard and practice separately?") was the right one: they do not need to
be separate. Flashcards is now a *format* inside Practice (Quiz | Flashcards), AR / 3D lives
inside Learn as a card, and Quick Quiz / Challenge are gone. Verified in the browser and on the
phone (`device-tab-check`: 3/3 modes, 53px labels, portrait + landscape).

**2. The XP the UI promised is real.** Practice awards 5 XP per correct answer + 10 XP for
finishing; one implementation (`apps/api/src/common/xp.ts`) owns the award and the
calendar-day streak rule (the old inline copies reset the streak on a second activity in the
same day). The device shows 440 XP after a real practice.

**3. Three P0/P1 defects fixed and covered by tests:**
- the web practice never persisted its answers (every web practice scored 0) - BUG-V;
- the mobile clients sent the option **id** instead of the **text**, so every mobile
  practice and assessment was graded wrong, and written questions had no input field at all -
  BUG-W (the "unable to type answer" report);
- the practice submit crashed on a foreign key - BUG-T, now with a regression suite.

**4. Short videos are gone.** The duration audit found 21/70 videos under two minutes; the
sourcing pipeline now rejects candidates under 120s and the seed carries the **real**
durations. Result: 70/70 videos carry content (shortest 123s, median 15 min), 68/68 alive.

**5. Captions are off by default** on both platforms (`cc_load_policy=0`), because the embed
otherwise inherits the viewer's own YouTube caption preference.

**6. All MCP servers installed and enabled** (27 in
`C:\Users\Harish\.config\opencode\opencode.jsonc`): the keyless ones answer live in the
session (filesystem, sequential-thinking, fetch, time, git, duckduckgo, sqlite, huggingface,
aws, firecrawl, netlify, ...), the credentialed ones need their env var. Documented in
`docs/MCP_SETUP.md`.

**7. The NCERT English book is extracted like Science.** The books pipeline is subject-aware
(`--subject science|english`); English (10 PDFs, 152 pages, First Flight 2026-27) is
extracted with text, page screenshots, figures and an OCR cross-check (confidence 89.2,
text-layer similarity 0.955) plus the README/qc index.

**8. The mobile app no longer depends on an injected env var** - `apps/mobile/.env`
(git-ignored) is the single source for the local API/web origins, so a blank screen from a
missing variable cannot happen again (BUG-X).

### Phase P16 (2026-10-22) - the chapter layer, video coverage, parity, and a review that found real bugs

**Decisions taken (see `docs/FEATURE_CHAPTER_HUB.md` and `docs/PARITY_POLICY.md`)**
- Clicking a **chapter name** now means one of three unambiguous things: a curriculum chapter
  opens the **chapter hub**, a concept opens the concept page, and a **video chapter marker**
  (always shown with a timestamp) **seeks in place** and never navigates away.
- The hub is **one scroll, five sections** in learning-loop order - Continue, Contents, Learn,
  Practise, Ask - deliberately **no tabs** (tabs hide what a teacher wants a student to see, and
  on a phone every tab is a tap).
- **Every student-facing capability must exist on web and mobile with the same behaviour and the
  same numbers**; authoring and administration stay web-only by design. Both clients call the
  same API, so a missing capability is an API gap, not a mobile gap.

**Shipped**
1. **Chapter hub** on web + mobile + API: chapter notes, the **textbook chapter PDF viewable in
   the app**, one **practice session for the whole chapter**, **Ask SANRO AI about the chapter**,
   per-concept mastery, progress and "continue where you left off".
   Verified in the browser and **on the physical device** (screenshots in
   `artifacts/qa/2026-10-22/screenshots/`).
2. **Videos split by time**: `ContentItem.segments` holds the real chapter markers
   (YouTube's own chapter list, else the description timestamps); the web and mobile render them
   under the player and seek on tap. 72 of the seeded videos carry them.
3. **Video coverage**: 70 -> **124 video lessons**, English added, **86/86 curriculum chapters
   now have a video** across classes 8, 9 and 10, and **0 videos under two minutes** (shortest
   123s, median 15 minutes - the durations in the seed are now the real ones).
4. **Class 8 and 9 books** extracted with the same pipeline as class 10 (text, page screenshots,
   figures, OCR cross-check, README/qc index). The class-8 maths book is split into two volumes,
   so the chapter code needs the `MAT-8P2-n` form to select volume 2.
5. **Web/mobile parity**: a feature-by-feature sweep closed the gaps (level + XP bar, subject
   grid, badges on home, a dedicated flashcards screen, the learning-progress block, the "you"
   row highlight, chapter context in the AI chat) and
   `scripts/qa/audit-web-mobile-parity.mjs` now fails the build when a student capability
   exists on one side only.
6. **An independent review** of the learning flow found **two P0 silent-wrong-grade bugs** and
   several P1s - all fixed and covered by tests (BUG-Z1..BUG-Z7 in the bug report).

**The bugs that mattered most**
- **Multi-select and true/false were always graded wrong on mobile** (the card sent one option
  text; the API expects a JSON array) and were a free-text box on the web assessment screen. A
  student who answered correctly was recorded as wrong - with the mastery damage and the XP
  denial that follows. Reproduced against the real grading function, then fixed on both clients.
- **The last web answer was posted after the submit**, so on a slow link it was graded wrong.
  Both clients now await the in-flight saves before submitting.
- The practice e2e test was passing for the wrong reason (it sent `answerId` instead of
  `answer`, so every answer was stored as null). It now asserts the exact XP rule
  (`correct * 5 + 10`).

**Gates after this phase:** typecheck 6/6, lint 0 errors, API 578+, web 51+, mobile 83+,
chapter-hub probe 9/9, parity sweep clean, AR probe 5/5, video liveness 66/66, walkthrough
69 pages with 0 console errors.

### Phase P16 close-out (2026-10-22)

**Final numbers**
- **Release verification: PASS (10/10)** - `scripts/qa/verify-release.ps1` runs typecheck, lint,
  the three test suites, the parity sweep, the chapter-hub probe, video liveness, video lengths
  and curriculum coverage in one command.
- **Curriculum**: 86 seeded chapters, **124 video lessons** (every chapter has one, none under
  two minutes, durations are the real YouTube lengths), 129 notes lessons.
- **Chapter markers**: 72 videos carry real chapter markers (YouTube's own chapter list, else the
  description timestamps); the web and the mobile render them under the player and seek on tap.
- **Books extracted**: class 8 (36 chapters, 971 pages), class 9 (33, 808), class 10 (40, 615) -
  **109 chapters, 2,394 pages** of text, page renders, figures, OCR cross-check and indexes.
  The class-9 books are the new 2026 NCERT titles (Exploration, Ganita Manjari, Kaveri) and the
  class-8 maths book is split into two volumes.
- **MCP**: 27 servers configured and enabled.
- **Parity**: 22/22 student capabilities in sync, enforced by a script that fails the build.

**One invariant restored**: the demo student's XP counter and XP ledger disagreed (420 vs 885)
because a re-seed reset the counter but left the practice ledger rows. The seed now clears the
whole ledger for the demo student, and the demo-XP script creates the profile when it is
missing - so `xp` and `totalXp` can never disagree again, which is the whole point of the
ledger.

### Phase P17 - classes 8 and 9 seeded from the 2026 books (2026-10-22)

**Why this phase existed.** The class-8 and class-9 books were extracted but the curriculum
still held the *old syllabus*: 3 Science + 3 Maths class-8 chapters and 5 Science + 4 Maths
class-9 chapters, every one of them with an old title, old topics, old videos and old notes. The
class-9 English book was not seeded at all. A student of class 8 opened "Materials in Daily Life"
- a chapter that does not exist in Curiosity.

**What the seed holds now.** 132 chapters, 605 concepts, 144 video lessons and 144 notes lessons:

| Class | Science | Mathematics | English |
|---|---|---|---|
| 8 | 13 (Curiosity) | 14 (Ganita Prakash, 7 + 7 across the two volumes) | 5 (Poorvi) |
| 9 | 13 (Exploration) | 8 (Ganita Manjari) | 8 (Kaveri) |
| 10 | 13 | 15 (14 book chapters + Constructions) | 9 |

Every chapter has a video lesson; 0 lessons are under two minutes; 125 of the 144 videos carry
real chapter markers; every class-8/9/10 chapter code resolves to the chapter of its own PDF
except *Constructions* (rationalised out of the 2026 book, so the PDF route answers 404 and the
hub hides the button).

**What was broken along the way, and what fixed it.**

- **The merge wrote a computed property key.** The class-8/9 chapters were merged as
  `[SCIENCE, { ...new chapters }]: [ ...old chapters ]`, so the key evaluated to
  `"[object Object]"` and `CURRICULUM['8'].Science` was `undefined` - the seed crashed on class
  8 and the six new chapters were silently absent. The merge now opens the array at the second
  bracket (`[SCIENCE]: [`) and appends inside it; the repair is verified by reading the
  curriculum back, not by looking at the diff.
- **A stray comma made an array hole.** One merged line left a `,` alone on its own line, which
  elides an element: `contentNodes` had `length 289` and 288 entries, so `for (const c of
  contentNodes)` produced `undefined` and the seed died with
  `Cannot read properties of undefined (reading 'grade')`. A parse check cannot see this - the
  file is valid TypeScript - so the seed is now *run* in the gate, not just parsed.
- **Class-10 mathematics was off by one.** The 2026 book dropped *Constructions*, so
  `MAT-10-12` "Areas Related to Circles" opened the PDF of *Surface Areas and Volumes*. The
  codes now follow the book (`scripts/qa/align-class10-maths.mjs`), and
  `scripts/qa/audit-book-alignment.mjs` fails when a code points at a different chapter than
  the book's own title.
- **A demo assessment title was double-encoded** (`Matter in Our Surroundings ÃƒÆ’...`), visible
  on the student dashboard. The seed now names it after its chapter and renames the existing
  row in place; `scripts/qa/clean-garbled-assessments.mjs` removed the duplicate.
- **87 old-syllabus lessons stayed in the database** after the renames (the seed only upserts).
  They sat under the new chapter names - "Rutherford's Gold Foil Experiment Explained" under
  *Cell: The Building Block of Life*. `scripts/qa/prune-stale-lessons.mjs` removed them; the
  database now holds exactly 144 + 144, the numbers in the seed.
- **The AR seed pointed at a renamed chapter** (`Matter and its Properties`), so the 3D model
  was skipped on every seed run. Fixed, and the AR set now seeds 8/8.

**New gates.** `audit-chapter-pdfs.mjs` (every code -> a PDF on disk, or a documented
"beyond the book"), `audit-book-alignment.mjs` (the book's own chapter titles),
`audit-question-coverage.mjs` (which chapters can actually be practised),
`prune-stale-lessons.mjs` (the database vs the seed), all wired into
`scripts/qa/verify-release.ps1`.

**Still open.** 74 questions cover 39 of the 132 chapters, so most chapters show "No practice
questions for this chapter yet" (the API answers 400 and both clients handle it). Classes 1-7
are structure only. The class-10 science chapter *Heredity and Evolution* is still called that
although the 2026 book calls it *Heredity* - the PDF is the right one.

### Phase P18 - classes 8, 9 and 10 are practisable (2026-10-22)

**Why this phase existed.** P17 gave every chapter a video, notes and a textbook page, so a
chapter could be *read*. Only 74 questions covered 39 of the 132 chapters, so 93 chapters
answered "No practice questions for this chapter yet" - the ASSESS edge of the loop - and the
practice scoring path was never exercised against fresh content.

**What the seed holds now.** 310 questions, and every chapter of every seeded class has four
(two MCQs, one application/HOTS MCQ, one two-mark written answer):

| Class | Chapters with questions | Questions |
|---|---|---|
| 8 | 32 / 32 | 122 |
| 9 | 29 / 29 | 109 |
| 10 | 37 / 37 | 79 |

The 74 pre-existing questions are kept; 236 were authored this phase from each chapter's own
textbook text (`books/cbse/class-8|9|10/**/chapters/<slug>/text.merged.txt`).

**How it was done, and why that way.** Three authoring agents ran in parallel and each wrote a
JSON *fragment* rather than editing `seed.ts`, so they could not conflict: science (72), English
(52), mathematics (60), class 10 (52). Every fragment was checked against the live curriculum
before anything was merged - `validate-question-fragments.mjs` proves the chapter exists at that
grade, the concept belongs to that chapter, an MCQ has four options with exactly one correct and
an `answer` identical to that option's text, and that no text is duplicated - and it reported
**0 problems for 236 questions**. `merge-question-fragments.mjs` then writes each question into
the seed's array *and* into the `QUESTION_CONCEPT` map (the seed throws on an unmapped question),
idempotently by text; two of the four fragments were already merged, and the second run correctly
skipped 124 and added 112.

**The scoring path is now a gate.** `probe-practice-scoring.mjs` logs in as a demo student,
starts a practice set on the three chapters with the newest questions, answers every auto-graded
question with the option the *database* marks correct (the API deliberately strips `isCorrect`
from the payload), submits, and asserts the server reports **100** - and **0** when a set has no
auto-graded questions, because a written answer is neither right nor wrong. It caught nothing
broken, which is the point: it now proves it on every release, for **all three grades**.

**A class-8/9 curriculum nobody could open.** Content is grade-scoped (a class-10 student is
answered 403 for a class-8 chapter), and the demo held only class-10 students - so two thirds of
the seeded curriculum was unreachable in the demo. `db:seed:demo` now also creates
`student8@sanroai.com` (class 8, "Class 8 - A") and `student9@sanroai.com` (class 9,
"Class 9 - A"), each with a gamification profile and a ledger entry that matches its counter,
exactly like the class-10 student. The probes then confirm the whole path in every grade:

```
class 8  MAT-8P2-7 Area                                4 questions, score 100/100
class 9  MAT-9-8 Predicting What Comes Next             4 questions, score 100/100
class 10 MAT-10-9 Applications of Trigonometry          4 questions, score 100/100
```

**Two things were wrong and are fixed.**
- `/app/profile` offered XP, streak, mastery, learning progress and achievements to *every* role.
  A parent's profile fired a student-only endpoint and rendered a 403 as an empty Achievements
  card; the walkthrough had been calling that "EXPECTED RBAC". Gamification is student-only, so
  `useAchievements` takes `{ enabled }` and the cards sit inside `isStudent ? ... : null` - and
  the mobile Me tab, which showed the same blocks with zeroed numbers, is gated identically.
- The mobile Home tab fired five student-only queries for parents and teachers (home,
  assessments, diagnosis, gamification, progress). They now take `{ enabled: isStudent }`, the
  same separation the web gets by mounting `StudentContent` only for a student.

**Content quality.** The questions were reviewed by sampling: the science items are correct
(angle of incidence = angle of reflection; a concave mirror burns paper at the focus), the
mathematics items were re-derived (Heron 13-14-15 = 84 cm^2, sector 60 deg of r = 21 = 231 cm^2,
AP 5, 9, 13, ... term 65 = 16th term), and the literature items are answerable only from the
chapter's own text.

**Verification of this phase.**

| Gate | Result |
|---|---|
| `pnpm -r typecheck` | 6/6 tasks |
| `pnpm -r lint` | 0 errors (web 78 + mobile 17 warnings, unchanged) |
| `pnpm build` | 6/6 tasks, 1m19s (dev servers stopped first, restarted after) |
| API / web / mobile tests | 596 / 51 / 82 passed |
| `verify-release.ps1` | **PASS, 15 steps** |
| web walkthrough | 69 pages: 62 PASS, 7 EXPECTED (RBAC), 0 console errors, 0 failed requests |
| class 8 + 9 in the browser | dashboard, library, chapter hub, concept: 0 console errors, 0 failed requests |

The 15 gate steps now include the two grade-scoped practice probes, so a chapter that loses its
questions - or a student whose grade stops matching the content - fails the release rather than
shipping. The walkthrough's "EXPECTED RBAC" list lost the parent-profile achievements 403 because
that call no longer happens, and a fresh class-8 chapter hub renders its own textbook notes, its
16-minute video, its four concepts and a practice set of four questions.

Still open after this phase: classes 1-7 are structure only (no video, notes or questions), the
on-device checks could not run (no phone and no emulator attached), and the production smoke test
still cannot reach `api.sanroai.com`.

---

## Phase P15 (2026-10-24) - "all videos, all questions, all edge cases": content integrity + full probe sweep

This phase answered "check all videos, add the missing ones, add more questions and notes,
check every edge case". The video and question work is data work, so it was verified with the
audits rather than by reading the seed.

### Videos (221 lesson rows)

| Check | Result |
|---|---|
| `verify-video-liveness.mjs sanro_dev` | **221 rows, 219 distinct ids, 219 alive, 219 thumbnails** |
| `audit-video-durations.mjs --min 120` | **221 ok, 0 too short, 0 unknown** (shortest 179 s, median 1015 s, longest 16398 s) |
| `audit-curriculum-coverage.mjs` | **209 / 209 chapters have a video**, 0 URLs without a lesson, 0 unknown chapters |
| chapter markers | 86 of the 221 videos carry real YouTube chapter markers (creator list or description timestamps); no marker is synthesised |

The 94 videos that were dead or missing at the start of the wave were re-sourced, checked with
oEmbed, and applied to the seed *and* the database; `Number Play - Video Lesson` (class 8) was
restored. Two rows share one URL (the same lesson is the canonical video for two chapters) -
`videoId` itself has no duplicates.

### Questions and content (the "add more" part)

| Measure | Before | After |
|---|---|---|
| Questions | 753 | **1045** (+292) |
| Chapters with questions | 209 / 209 | **209 / 209** |
| Concepts | 1028 | **1009** (19 duplicate/stale rows merged) |
| Content items | 442 | 442 (221 video + 221 notes) |
| Question defects | - | **0** MCQs with !=4 options, 0 with !=1 correct, 0 answers that are not an option, 0 duplicate texts, 0 without a concept |

The 292 new questions came from authored fragments for classes 5-10 (mathematics, science and
English); every fragment went through `reconcile-question-fragments.mjs` (rewrite the chapter to
the concept's real owner) and `validate-question-fragments.mjs` (four options, one correct, answer
equals the option text, no duplicates) **before** the merge. Questions whose concept no longer
exists in the 2026 books (old-syllabus `Plotting Points`, `Substitution`, `Elimination`,
`Euclid's Postulates`, `Undefined Lines`) were dropped, and the ones whose concept survives under
the book's own fuller name were re-authored (`Degree` -> *Linear Polynomials and the Degree of a
Polynomial*, and so on).

### Defects found and fixed in this phase

- **BUG-AH** - the seed and the database carried double-encoded UTF-8 (`â€™` for `’`) in 19
  concept names, 39 question texts, 7 options, 19 answers and 30 lesson descriptions. Repaired
  with `fix-encoding.mjs`; a sweep of all 143 text columns now reports 0 mojibake rows.
- **BUG-AI** - 19 stale concepts survived the chapter realignment (duplicates inside one topic).
  `prune-stale-concepts.mjs` merges them and repoints their questions; 0 stale rows remain.
- **BUG-AJ** - the AR "atom" model pointed at a concept that no longer existed (and at a biology
  chapter). Retargeted to class-9 *Journey Inside the Atom*; the seed now reports 8/8, 0 skipped.
- **BUG-AK** - the walkthrough failed `/login` when `next dev` compiled it cold (a null response
  from `page.goto`). The harness now retries a null navigation twice.
- **Probe defect** - `probe-ar-activity-loop.mjs` carried a hard-coded concept id that the AR
  retarget invalidated. It now resolves the concept from the published AR list, so it cannot go
  stale again; result 5/5 (2 activity POSTs, model loaded).

### Gates (all run, all green)

| Gate | Result |
|---|---|
| `pnpm -r typecheck` | **6/6 packages** |
| `pnpm -r lint` | **0 errors** (web 78 warnings, pre-existing) |
| `pnpm build` | **6/6 tasks** (dev servers stopped first, restarted after) |
| API tests | **598 / 598** |
| Web tests | **51 / 51** |
| Mobile tests | **82 / 82** (12 suites) |
| `verify-release.ps1` | **PASS, 18 steps** |
| web walkthrough | **69 pages: 61 PASS, 8 EXPECTED (RBAC), 0 FAIL**, 0 console errors, 0 failed requests |

### Probe sweep (the edge cases)

| Probe | Result |
|---|---|
| `probe-auth-security.mjs` | **10/10** (enum-safe login, no raw reset token, CORS allowlist, no stack traces) |
| `fuzz-write-path.mjs` | **11/11** (no 2xx/5xx on unauth/wrong-role/malformed writes, no leaks) |
| `probe-files-proxy.mjs` | **9/9** (pass-through, 404, traversal blocked, range, HEAD, query string) |
| `probe-ai-surface.mjs` | **12/12** (injection never reflected, parent blocked, no tenant leak) |
| `sweep-authz.mjs` | **123 routes, 0 5xx for any role** (route list regenerated from the OpenAPI document) |
| `probe-rate-limit.mjs` | **5/5** (login 10/min, forgot 3/min, register 5/min, contact 3/min, clean 429 + Retry-After) |
| `probe-papers-guard.mts` | **5/5** (staff-only route guards) |
| `probe-chapter-hub.mjs` | **9/9** (payload, PDF, practice start, 404s) |
| `probe-practice-scoring.mjs` | **PASS for classes 5, 6, 7, 8, 9, 10** (server score 100/100 on every set) |
| `probe-ar-activity-loop.mjs` | **5/5** (2 activity POSTs, no 429 storm, model-viewer loaded) |
| `audit-web-mobile-parity.mjs` | **22/22 capabilities in sync**, 34 web-only admin groups by design |

### Still open (unchanged or newly recorded)

- **Concept descriptions are still empty**: `Concept.description` is null for all 1009 concepts,
  so the concept page's "Quick Revision" card shows the generic revision line plus the chapter's
  note links. The pipeline is ready (`export-concept-descriptions.mjs` ->
  `concept-descriptions-<grade>-<subject>.json` -> `merge-concept-descriptions.mjs --apply` ->
  re-seed); only the writing is outstanding. Class 9-10 science + mathematics is the highest-value
  first batch.
- **On-device checks could not run** - no phone and no emulator attached (`adb devices` empty).
- **Production smoke test** still cannot reach `api.sanroai.com` (the gateway answers 404 for
  `/api/v1/*`), so nothing in this phase was validated against production.
- **Classes 1-4** hold one video, one notes lesson and four questions per chapter - real content,
  but thin compared with classes 5-10.
- `AI_API_KEY` and `HF_TOKEN` are absent, so the AI surface is exercised with its mock provider.

## Phase P16 (2026-10-24) - "run on phone": physical-device verification

A phone was attached (Honor JSN-L42, Android 10, `THC3Y19429006728`), so the three device scripts
that had been blocked since Phase P14 were finally run against real hardware, plus a desktop-grade
walkthrough of the student loop driven by `adb` + `uiautomator` rather than Playwright.

### What was run

| Step | Result |
|---|---|
| `adb reverse` 4000 / 8081 / 3000 + Metro (`expo start`) | bundle served, 1410 modules, first paint ~69 s (cold) |
| `device-smoke.ps1 -Label launch` | **PASS** - `com.sanro.ai` launches, focus stays on `MainActivity` |
| Student Home on the device | `Good morning, Aarav`, 7-day streak, 420 XP, 74% mastery, Level 1, focus card (2 weak concepts + 2 retests), Continue learning, 5-tab bar |
| Concept page (deep link) | header + mastery badge, 3 mode pills, video lesson with the YouTube embed rendering, study notes, Quick Revision |
| `device-tab-check.ps1` | **PASS** - Learn / Practice / Ask Sanro AI labels measure **53 px**, none compressed |
| `device-video-play.ps1` | **PASS** - tapped "Play Physical Properties of Metals", no player configuration error (153) |
| Practice loop on the device | Start Quiz → answered "Sulphur" (correct) → **Score 100, Accuracy 100%**, mastery card updated, XP awarded |

### Defects found and fixed in this phase

- **BUG-AL** - the practice result card paired the **cumulative** mastery level with the
  **single-attempt** score (`"NEEDS INTERVENTION — 100%"` while the stored mastery was 29%).
  `masteryUpdate` now carries `combinedScore`, so the level and the percentage are one standing;
  both platforms label it `— N% overall`. New e2e test asserts the payload equals the stored row.
- **BUG-AM** - `device-tab-check.ps1` / `device-video-play.ps1` deep-linked to a hard-coded concept
  id that the class-10 realignment had deleted, so both reported an app failure that was really a
  stale fixture. They now resolve `GET /learning/path` → `next.conceptId`.

### Gates re-run after the change

| Gate | Result |
|---|---|
| `pnpm -r typecheck` | **6/6 packages** |
| `pnpm -r lint` | **0 errors** (api 213, web 78, mobile 17 warnings - pre-existing) |
| API tests | **599 / 599** (31 files; +1 new practice-mastery test) |
| Web tests | **51 / 51** |
| Mobile tests | **82 / 82** (12 suites) |

### Notes

- Screenshots taken with `adb shell screencap` on this EMUI build show a **compositing artifact**
  (UI text tiled across the frame). The accessibility tree (`uiautomator dump`) shows exactly one
  node per element, and `adb exec-out screencap` captures the same screen cleanly, so it is a
  capture artifact of the device, not a rendering bug.
- The remaining opens from P15 are unchanged: concept descriptions (0/1009), production smoke
  (gateway 404), classes 1-4 depth, and the absent `AI_API_KEY` / `HF_TOKEN`.

---

## Phase 16 - UX revamp, AI provider, video sections, question bank (2026-10-24)

### Goal

Finish the user-facing polish and close two functional gaps: "the YouTube video is
not split concept-wise" and "more questions per concept and per chapter".

### What shipped

| Area | Change | Doc |
|---|---|---|
| Dashboard | Badges strip, pending-assessment duplicate, second Recurrent Activity and the Level card removed; hero artwork with greeting; 3 numbers (XP+level, streak, mastery) | `docs/UX_REVAMP.md` |
| Icons | 34 premium 3D PNGs used app-wide (web `Icon3D`, mobile registry); emoji removed from copy | `docs/UX_REVAMP.md` |
| Artwork | Subject banners on `/app/library/subjects`; chapter header banner on web + mobile | `docs/UX_REVAMP.md` |
| Video sections | Real creator chapters where they exist, derived concept split otherwise, labelled "approximate"; markers clipped to the runtime | `docs/VIDEO_CHAPTER_MARKERS.md` |
| Question bank | 1045 -> 1229 (+184 curated grade-10 questions, validator 0 problems); AI generator ready | `docs/QUESTION_BANK_GROWTH.md` |
| AI | Gemini live (7/7 probe); image generation blocked by free-tier 429; composed art shipped instead | `docs/AI_PROVIDER.md` |

### Two defects found and fixed

- **BUG-AN** - `next/image` marked the dashboard 3D icons `loading="lazy"`; Chromium
  never issued the request (`complete: false`, zero network entries), so the stat
  cards rendered without icons until a scroll. `Icon3D` now renders a plain eager
  `<img>`.
- **BUG-AO** - the hero/chapter gradients used `from-surface-950/*`, a palette token
  that does not exist in `tailwind.config.ts`, so Tailwind emitted nothing and white
  text sat on light artwork (unreadable). Both heroes now use explicit
  `from-[#0b0614]/...` stops.

### Gates after the change

| Gate | Result |
|---|---|
| `pnpm -r typecheck` | 6/6 packages |
| `pnpm -r lint` | **0 errors** (api 213, web 78, mobile 22 warnings - pre-existing) |
| API tests | **609 / 609** (32 files; +10 new `chapter-segments.spec.ts`) |
| Web tests | **51 / 51** |
| Mobile tests | **82 / 82** |
| `web-walkthrough.mts` | **63 PASS / 6 EXPECTED / 0 PARTIAL / 0 FAIL** (69 pages) |
| `probe-chapter-hub.mjs` | 9/9 PASS |
| `probe-practice-scoring.mjs` | PASS (chapters now serve 9-10 questions, was 5) |
| `probe-video-segments.mjs` (grades 10 / 9 / 8) | PASS - 49 / 29 / 32 videos, all navigable |
| `audit-web-mobile-parity.mjs` | 22/22 capabilities in sync |
| `validate-question-fragments.mjs` | 185 questions, 0 problems (1 already seeded) |
| `audit-question-coverage.mjs` | 1229 questions, 209/209 chapters |
| `verify-roles.mts student` | 8/8 pages clean |
| On-device | Home renders the decluttered dashboard (2 stat tiles + level card); chapter hub shows the banner header and "10 questions across every concept" |

### Notes

- The first walkthrough of this pass reported one **PARTIAL** on `/forgot-password`
  (a React hydration attribute warning). It did not reproduce in two isolated
  Playwright loads and disappeared on a re-run once no files were being recompiled
  - a dev-server recompile artifact, not an app defect (final run: 63 PASS /
  6 EXPECTED / **0 PARTIAL**). Re-run the walkthrough when no edits are in flight
  before treating a PARTIAL as real.
- The free Gemini key is limited to **20 text requests/day** and **0 image
  requests**; both limits are recorded with reset mechanics in
  `docs/AI_PROVIDER.md` so nobody debugs a "broken" AI feature that is only
  throttled.
- Screenshot doubling over the sticky blurred header is a capture artifact: the
  DOM reports one `header`, one `main`, one `h1`, 11 cards. Element screenshots
  (`main`) and the device capture are clean.
