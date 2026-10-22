# Agent Operating Policy

**Status:** Proposed policy — adopted for local development; MCP configuration changes require separate approval.
**Last updated:** 2026-10-18 (Batch B1).

## Purpose

Define how AI agents (and their tools/MCP servers) may operate on this repository so that automation stays evidence-based, reversible, and inside approved boundaries.

## Tool inventory and boundaries

| Tool | Verified status | Legitimate use | Can write / execute / reach external systems? | Necessary? | Recommended boundary | Config change needed? |
|------|-----------------|----------------|-----------------------------------------------|-----------|----------------------|-----------------------|
| Playwright | Working | Local UI end-to-end checks | Yes — navigates, types, can save files | Yes (guarded) | Localhost only; never production; never with production credentials | No |
| Postgres | Working; **target unknown** | — (prefer local read-only `psql`) | Yes — arbitrary SQL | No | Disable, or pin to a local read-only role with a verified loopback target | Possibly (separate approval) |
| context7 | Working | Library/API documentation lookup | External read only | Optional | Read-only | No |
| iconify | Working | Icon lookup | External read only | Optional | Read-only | No |
| dart | Working (DTD disconnected) | Flutter tooling | Yes | **No — not applicable** (this repo is Expo/React Native, no Flutter dependency) | Disable for this repo | Possibly (separate approval) |
| shadcn | 0 tools exposed (dead) | — | — | No | Remove | Possibly (separate approval) |
| unsplash | Disabled | — | — | No | Leave disabled | No |

> MCP inventory reflects configuration read on 2026-10-17. No MCP configuration has been changed.

## Operating policy

1. **Read first.** Inspect before acting; prefer existing native tools and scripts over new dependencies.
2. **Workspace-only writes.** Write only inside this repository, only when the specific change is authorized.
3. **Verify the database target before any database operation.** Echo the resolved target host and assert it is loopback/local. If the target is remote or ambiguous, **stop and report**.
4. **No production by default.** No production login, database access, mutation endpoint, migration, seed, deploy, or cloud configuration change without explicit, separately recorded authorization.
5. **Human approval for destructive actions.** Resets, seeds, DDL/migrations, dependency installs/upgrades, credential rotation, and MCP changes each require explicit approval.
6. **Evidence-backed reporting.** Every claim is labelled `VERIFIED` / `HISTORICAL` / `INFERRED` / `UNVERIFIED` / `BLOCKED`. Never present a historical observation as current. Never claim a test, fix, or deployment succeeded without evidence.
7. **Test and release gates.** Run lint, typecheck, and tests before declaring work complete. A command is not "safe" merely because it is named `test`, `verify`, `build`, or `lint` — its side effects must be understood first.
8. **Secrets and personal data.** Never print, copy, or commit credentials, tokens, environment values, student information, or other personal data.
9. **Preserve user work.** Never delete or overwrite untracked files or user changes without explicit approval.
10. **Documentation.** For each authorized batch, document the date, objective, changed files, rationale, commands run, side effects, verification results, known limitations, and rollback procedure.

## Approval matrix

| Action class | Approval required |
|--------------|-------------------|
| Read-only inspection (git, file reads, read-only SELECT on a verified local target) | None |
| Workspace file edits within an authorized batch | Batch authorization |
| Dependency install / upgrade / lockfile change | Separate install authorization |
| Database seed / push / migrate / reset | Separate authorization + confirmed target |
| MCP configuration change | Separate authorization |
| Credential rotation | Separate authorization |
| Production access / deploy / migration / content operation | Separate production authorization |
