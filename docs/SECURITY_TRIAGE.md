# SECURITY_TRIAGE.md — Dependency Vulnerability Analysis

**Date:** 2026-10-22
**Scope:** `pnpm audit --prod` on Sanro AI monorepo (master, post-override-bump)
**Evidence Label:** VERIFIED (observed via `pnpm audit --prod` and `pnpm why`)

## 1. Summary

| Severity | Current (after 2026-10-22 bumps) |
|---|---|
| Critical | 0 |
| High | 4 |
| Moderate | 1 |
| Low | 0 |
| **Total** | **5** |

Down from **10** (6 high / 3 moderate / 1 low) before this pass, and from **69** (3 critical / 43 high / 22 moderate / 1 low) at the 2026-10-18 baseline. All advisories are **transitive prod dependencies** — none appear directly in any package.json `dependencies` block.

## 2. Overrides in force (pnpm-workspace.yaml)

Overrides live in `pnpm-workspace.yaml` under `overrides:` (pnpm >=10 reads them from there; the npm-style top-level field in package.json is ignored by pnpm — see `docs/AGENTS.md` §"Dependency overrides"). All pins are same-major, validated by `pnpm peers check` (no peer issues) and the full gate suite.

| Package | Pinned | Cleared | Path |
|---|---|---|---|
| multer | 2.4.0 | DoS via orphaned disk writes | API (@nestjs/platform-express) |
| postcss | 8.5.31 | arbitrary file read / info disclosure | web (sentry/nextjs → postcss) |
| sharp | 0.35.5 | heap overflow in image processing | mobile (expo-image → sharp) |
| fast-uri | 3.1.8 | ReDoS in ajv's URI parser | web (ajv → fast-uri) |
| decode-uri-component | 0.5.0 | ReDoS | mobile (expo → decode-uri-component) |
| deepmerge-ts | 8.0.0 | prototype pollution via @prisma/config | API (prisma) |
| markdown-it | 14.3.3 | 2 HIGH + 1 LOW ReDoS chain | mobile (react-native-markdown-display) — **RUNTIME path** |
| linkify-it | 5.0.2 | quadratic-complexity DoS | mobile (markdown-it → linkify-it) |
| minimatch@3>brace-expansion | 1.1.21 | brace-expansion quadratic expansion | mobile + web (glob → minimatch) |
| minimatch@9>brace-expansion | 2.1.7 | (same advisory) | mobile + web |
| minimatch@10>brace-expansion | 5.0.12 | (same advisory) | mobile + web |
| postcss-selector-parser | 7.1.6 | ReDoS (tailwind/postcss-nested) | web (tailwindcss) |
| js-yaml | 5.4.3 | CPU DoS via merge keys | API (@nestjs/swagger) |
| tar | 7.5.22 | decompression/parse DoS + path traversal | mobile (expo → tar) |
| proxy-addr | 2.0.8 | IP spoofing via IPv4-mapped IPv6 | API (express → platform-express) |
| shell-quote | 1.12.0 | command injection via `{ comment }` | mobile (expo → shell-quote) |

## 3. Remaining 5 (deliberately not pinned)

| # | Package | Severity | Vulnerable | Path | Why not pinned |
|---|---|---|---|---|---|
| 1 | image-size | HIGH | `>=1.2.0 <=2.0.2` | mobile (metro@0.81.5 → image-size@1.2.1) | **Breaking override.** `metro/src/Assets.js:6` does `const getImageSize = require("image-size")` then calls it directly. In v1.x `require("image-size")` is a callable function; in v2.x it is a named-export object `{ imageSize, imageSizeFromFile }`, so metro fails with `getImageSize is not a function` and the Expo bundler breaks. The advisory needs a malicious JXL/HEIF/ICNS image fed to the parser; metro only parses images in the app's own `assets/` folder (developer-controlled), so it is not attacker-reachable. |
| 2 | image-size | HIGH | `>=0.6.3 <=2.0.2` | (same as above) | (same as above) |
| 3 | node-forge | HIGH | `<=1.4.0` | mobile (expo → node-forge@1.4.0) | **No patched version exists upstream** (1.4.0 is the latest release). RSA PKCS#1 v1.5 signature verification accepts extraneous trailing data. Only reachable through Expo CLI tooling, not production runtime code. |
| 4 | braces | HIGH | `<=3.0.3` | mobile + web (tailwind → chokidar → braces@3.0.3) | **No patched version exists upstream** (3.0.3 is the latest release). Stack-exhaustion DoS via nested quantifiers; requires attacker-controlled glob input, which neither Tailwind nor chokidar receives. |
| 5 | uuid | MODERATE | `<11.1.1` | mobile (xcode@3.0.1 → uuid@7.0.3) | **Major bump 7 → 11 with no exploitable gain.** The advisory requires passing a `buf` argument to `uuid.v3/v5/v6`; `xcode@3.0.1` calls `uuid.v4()` with no buffer. iOS-only build tooling that we do not use (Android-only builds). |

` sprintf-js` (previously listed, moderate, no patch) is no longer in the audit output — `js-yaml@5.4.3` dropped the `argparse → sprintf-js` transitive chain, so it fell out automatically.

## 4. Quality Gates After Remediation (VERIFIED)

| Check | Exit Code | Result |
|---|---|---|
| `pnpm -r typecheck` | 0 | 6/6 packages pass |
| `pnpm -r lint` | 0 | 0 errors (warnings are a backlog) |
| `pnpm --filter @sanro/api test` | 0 | 596/596 pass (31 files) |
| `pnpm --filter @sanro/web test` | 0 | 51/51 pass (7 files) |
| `pnpm --filter @sanro/mobile test` | 0 | 82/82 pass (12 suites) |
| `pnpm peers check` | 0 | No peer dependency issues |

All gates pass after the 2026-10-22 override bumps (`markdown-it 14.3.1 → 14.3.3`, `js-yaml 5.3.0 → 5.4.3`).

## 5. Remaining Blockers

1. **image-size / node-forge / braces** — no upstream fix exists (node-forge, braces) or the fix breaks the build (image-size). All three are dev/build tooling, not production runtime code. Re-evaluate on the next Expo SDK upgrade.
2. **uuid** — iOS-only tooling, not exploitable as used. Re-evaluate only if we start building iOS.
3. **Next.js cache poisoning (moderate)** — `next@15.5.25` needs `>=15.5.27`. **Not currently in the audit** (the audit reports 0 low); re-check after the next `pnpm update` of `next`. If it resurfaces, bump `next` in `apps/web` and re-run `pnpm build`.
4. **Credential rotation (D4)** — seed defaults + `.env.example` still contain credentials; separate authorization required. Never printed in output.

## 6. Verification commands

```bash
pnpm audit --prod                       # 5 vulns (4 high, 1 moderate)
pnpm peers check                        # no peer issues
pnpm -r typecheck && pnpm -r lint
pnpm --filter @sanro/api test
pnpm --filter @sanro/web test
pnpm --filter @sanro/mobile test
pnpm build                              # full Turborepo build (stop next dev first)
```
