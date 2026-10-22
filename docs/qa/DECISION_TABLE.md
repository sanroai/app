# Product-Decision Table — SANRO AI

Date: 2026-10-19 · Status: **DECIDED & IMPLEMENTED** · Evidence: VERIFIED against source + live services (`:4000`/`:3000`).

Product-owner sign-off received 2026-10-19 (implementation batch). The four
recommendations below (C-B, D-B, G-A, H-A) were confirmed against the master
specification and the actual code, then applied as a single scoped batch. UI guards
and doc edits are *not* a substitute for the API authorization already in place —
the API remains the security boundary.

---

## Decision summary (final)

| # | Finding | Verified current behavior | Decision | Action taken | Regression evidence |
|---|---------|---------------------------|----------|--------------|---------------------|
| **C** | `/auth/me` institutionId | `GET /auth/me` returns user + `memberships[]`, **no top-level `institutionId`**. **Zero production consumers** — both auth stores read `institutionId` from the **login** payload; `content-library-assignments.e2e-spec.ts:91` asserts its absence. No spec text requires it. | **C-B — keep response unchanged.** No redundant field added (no concrete requirement). | **No code change.** No doc claimed `/auth/me` returns a top-level `institutionId`, so no correction needed. | Unchanged; existing e2e (564 suite) green. Sweep shows `/auth/me` 200 self-scoped for all roles (returns *own* record). |
| **D** | `/learning/home` staff access | No `@Roles`; returns **200** for staff, **self-scoped** (`identity.resolveForUser` → null for staff ⇒ `averageMastery:0`, `completedContent:0`). **No cross-student leak.** Matrix: `LEARN-HOME allow:['STUDENT'] denied:'lenient'` ⇒ 200 already within contract. | **D-B — keep self-scoped 200.** Staff may preview the student catalog; do **not** flip to 403 merely because it isn't a staff's primary screen. | **No code change.** | Re-verified live via `diagnose-matrix.mjs`: `LEARN-HOME SA/IA/TEACHER = 200`, `PARENT = 403` — matches documented contract. |
| **G** | `/app/papers` UI route guard | Page had **no role guard**; nav already gates `/app/papers` behind `staff` (`layout.tsx:132`). API mutations are `@Roles(INSTITUTION_ADMIN, TEACHER)`; reads are self-scoped. "New paper" button showed for students/parents ⇒ dead button (403 on POST). | **G-A — add staff-only UI guard** (TEACHER / INSTITUTION_ADMIN / SUPER_ADMIN), matching the existing `content-processing` render-guard pattern. API `@Roles` stays the actual boundary. | **IMPLEMENTED** — render-guard added to `papers/page.tsx` (reuse of `useAuthStore` + "Access Denied" pattern). Students/parents blocked; staff see the list; "New paper" button already excluded `SUPER_ADMIN` (matching `POST @Roles(IA, TEACHER)`), so authorized creators unchanged. | New unit test `papers/page.test.tsx` **7/7**; new browser probe `scripts/qa/probe-papers-guard.mts` **5/5** (student/parent blocked, teacher/principal/admin allowed); full web suite **22/22**. |
| **H** | `forbidUnknownValues` documentation | `ZodValidationPipe` runs `schema.safeParse(value)` with **no** `forbidUnknownValues`. Zod **strips** unknown keys (does not reject). `AGENTS.md:106` and `MASTER_PRODUCT_SPEC.md:195` claimed `forbidUnknownValues: true` — **inaccurate**. Strip still **neutralizes mass-assignment**. A few schemas opt into `.strict()` (admin-curriculum ×1, content-ingest ×2). | **H-A — correct the documentation** to match reality (strip by default; `.strict()` where rejection is required). Preserve existing mass-assignment/privilege-escalation protection; do not change validation behavior. | **IMPLEMENTED** — `AGENTS.md:106` and `MASTER_PRODUCT_SPEC.md:195` rewritten (spec amendment approved by product owner in this batch per its morale rule). No validation code changed. | Existing strip test (`validation.constraints.e2e-spec.ts:61` login `bogusField` → 200) + **new** strict test (same file: `POST /admin/curriculum/access` with unknown key → 400) ⇒ suite **8/8**; write-path fuzz **11/11** (mass-assignment/guards hold). |

---

## Implementation batch — files changed

| File | Change | Why |
|------|--------|-----|
| `apps/web/app/(dashboard)/app/papers/page.tsx` | Added staff-only render-guard (`TEACHER`/`INSTITUTION_ADMIN`/`SUPER_ADMIN`), reused `content-processing` pattern | FINDING-G |
| `apps/web/app/(dashboard)/app/papers/page.test.tsx` | **New** — 7 role-guard regression cases | FINDING-G coverage (authorized + unauthorized roles) |
| `scripts/qa/probe-papers-guard.mts` | **New** — browser route-guard probe (5 roles, screenshots) | FINDING-G end-to-end evidence |
| `AGENTS.md` | Line 106 corrected: unknown keys stripped by default; `.strict()` where needed | FINDING-H |
| `docs/MASTER_PRODUCT_SPEC.md` | Line 195 corrected (spec amendment, owner-approved) | FINDING-H |
| `apps/api/test/validation.constraints.e2e-spec.ts` | Added `.strict()` unknown-key → 400 test | FINDING-H substantiation |
| `scripts/qa/_gen-routes.mjs` | **New** — regenerates `routes-for-sweep.txt` (was a hand-made artifact with no generator) | reproducibility of `sweep-authz` |
| `apps/api/src/routes-for-sweep.txt` | **New** — generated GET-route probe artifact (`.txt`, not compiled) | consumed by `sweep-authz.mjs` |

**No API business logic changed** (`apps/api/src/*.ts` untouched by this batch).
FINDING-C and FINDING-D required **no code change** (decisions: keep as-is).

---

## Decisions (resolved)

1. **FINDING-C** — keep `/auth/me` as-is; no `institutionId` added. *(No consumer, no spec requirement.)*
2. **FINDING-D** — keep self-scoped `200` on `/learning/home`. *(No leak; matrix lenient; re-verified live.)*
3. **FINDING-G** — staff-only page guard on `/app/papers` (TEACHER/IA/SA). *(Implemented + tested; API `@Roles` still the boundary.)*
4. **FINDING-H** — correct the docs to "strip by default / `.strict()` where required." *(Owner-approved spec amendment; validation behavior unchanged.)*

## No longer blocked

- ~~FINDING-H spec amendment~~ → owner-approved in this batch and applied.
- All four findings are **resolved**; none remains an open product decision.

---

## Phase P11-P12 decisions (2026-10-19, later batches)

1. **Content types 17 to 6 canonical** (`VIDEO / NOTES / WORKSHEET / INTERACTIVE /
   EXAMPLE / OTHER`), researched against Khan Academy / BYJU'S / Tedantu /
   Google Classroom conventions. `OTHER` surfaces as the label **"Resource"** — no
   `RESOURCE` enum value (label-only, so no migration). Legacy values fold at read
   time (`apps/api/src/common/content/content-types.ts`); gates narrowed 17 to 6;
   seed ARTICLE -> NOTES; both local DBs remapped (0 legacy rows remain).
2. **Prisma enum intentionally stays at 17 values.** `RemediationItem.contentType`
   legitimately writes `PRACTICE_SET`/`QUIZ` as plan-step markers, and prod row
   state is unverified — runtime folding makes prod correct without a risky
   enum-recreate migration.
3. **AR defects fixed client-side, no API change.** BUG-L (activity loop) fixed via
   callback refs + event listeners; BUG-M (GLB 404) fixed by a web rewrite proxying
   `/api/v1/files/*` to the API origin — chosen over per-consumer URL joining because
   mobile's `resolveAssetUrl` already assumes web-origin files (one mechanism fixes
   both clients). API `listForConcept`/`listForStudent` grade gating was **tested and
   found correct** (grade-8 Atom -> 0 items for a grade-10 student); deliberately not
   touched after an initial suspicion of a scope leak.
4. **Dead seed videos NOT auto-replaced.** All 24 distinct embed IDs are fabricated
   placeholders (seed.ts:2061-2130); choosing ~69 real CBSE-aligned videos is a
   content-authoring decision — recorded as BLOCKED for the content owner (BUG-H
   residual). The user's standing "fix all issues" authority covers engineering
   defects, not unilateral curriculum substitution.
5. **youtube MCP added, proven dead, removed.** 7/7 transcript failures from this
   network while oEmbed controls succeeded; a dead server is not shipped. Working
   replacement requires `YOUTUBE_API_KEY` (absent). Config re-validated: 12 servers.
