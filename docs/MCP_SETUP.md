# MCP Setup — Connected Servers, Root Causes, and How to Re-verify

**Status:** UPDATED (2026-10-22, after "install all mcp")
**Config:** `C:\Users\Harish\.config\opencode\opencode.jsonc` (global OpenCode)
**Live state:** **27 servers configured, all enabled.** The keyless ones answer live in the
running catalog; the credentialed ones start but need their env var before they can do
anything (the list is in the table below). Config is valid JSON, 27 entries.

---

## The full server list (all enabled)

### Working right now, no credential needed

| Server | Transport | Tools | What it is for here |
|---|---|---|---|
| **playwright** | local `playwright-mcp` | 25 | Browser QA (the repo's own probes use it too). |
| **chrome-devtools** | local `npx chrome-devtools-mcp@latest` | 32 | Console + network inspection (AR, library, leaderboard checks). |
| **dart** | local `dart mcp-server` | 13 | Connected; the repo has **zero Dart** (NestJS + Next + Expo). Harmless, left on. |
| **memory** | local `@modelcontextprotocol/server-memory` | 9 | Cross-session knowledge graph (project + harness facts are stored there). |
| **iconify** | local `npx -y iconify-mcp` | 3 | Icon search for UI work. |
| **shadcn** | local `npx -y shadcn@4.22.1 mcp` | 7 | **Pinned** - see root cause 5. |
| **postgres** | local `uvx --with "mcp<2" postgres-mcp {env:SANRO_MCP_DB_URI}` | 1 | **Read-only** SQL against `sanro_dev` - see root cause 1. |
| **github** | remote `https://api.githubcopilot.com/mcp/` | 46 | Issues, PRs, code search. Uses the **User-scope** env var `GH_MCP_TOKEN`. |
| **context7** | remote `https://mcp.context7.com/mcp` | 2 | Library/framework docs (no key needed). |
| **exa** | remote `https://mcp.exa.ai/mcp` | 2 | Web search + page fetch (no key needed). |
| **deepwiki** | remote `https://mcp.deepwiki.com/mcp` | 3 | GitHub repo wikis / Q&A (no key needed). |
| **filesystem** | local `@modelcontextprotocol/server-filesystem D:\sanroaiapp` | 14 | Read/write the repo through MCP (books pipeline, docs). |
| **sequential-thinking** | local `@modelcontextprotocol/server-sequential-thinking` | 1 | Structured reasoning for the product decisions. |
| **fetch** | local `uvx mcp-server-fetch` | 1 | Fetch a URL as markdown (no key needed). |
| **time** | local `uvx mcp-server-time` | 2 | Current time in any timezone (used for week windows). |
| **git** | local `uvx mcp-server-git --repository D:\sanroaiapp` | 12 | Git history/diff queries without touching the working tree. |
| **duckduckgo** | local `uvx duckduckgo-mcp-server` | 3 | Keyless web search (a second opinion next to exa). |
| **sqlite** | local `uvx mcp-server-sqlite --db-path …\artifacts\qa\sanro-mcp.sqlite` | 8 | SQLite file exploration (scratch DB; the product itself uses PostgreSQL). |
| **huggingface** | remote `https://huggingface.co/mcp` | 4 | Model/dataset/paper discovery (anonymous; `HF_TOKEN` raises the rate limit). |

### Enabled, but each needs one credential before it can do anything

| Server | Command | Env var it reads | Notes |
|---|---|---|---|
| **aws** | `uvx --from awslabs.aws-api-mcp-server awslabs.aws-api-mcp-server` | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` | Works with an ambient AWS profile too. |
| **cloudflare** | `npx -y @cloudflare/mcp-server-cloudflare` | `CLOUDFLARE_API_TOKEN` | Also runs in local mode via wrangler auth. |
| **firecrawl** | `npx -y firecrawl-mcp` | `FIRECRAWL_API_KEY` | Scrape/crawl API (free tier key). |
| **netlify** | `npx -y @netlify/mcp` | `NETLIFY_ACCESS_TOKEN` | Deploys, site info, logs. |
| **sentry** | `npx -y @sentry/mcp-server` | `SENTRY_ACCESS_TOKEN` | Issues, traces, releases. |
| **supabase** | `npx -y @supabase/mcp-server-supabase` | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` | SQL + project info. |
| **vercel** | `npx -y vercel-mcp` | `VERCEL_TOKEN` | Deployments, domains, logs. |
| **unsplash** | `npx -y unsplash-mcp@0.1.0` | `UNSPLASH_ACCESS_KEY` | Photo search for content work. |

Set the env var in the **User scope** (Windows: `setx AWS_ACCESS_KEY_ID …`), then restart
OpenCode so the server picks it up. Nothing secret is ever written into the config file -
the config only references `{env:VAR}`.

### Verified startup (2026-10-22)

Every keyless server was launched from the shell before it was added:
`filesystem ok · sequential-thinking ok · fetch ok · time ok · git ok · duckduckgo ok · sqlite ok`,
and all of them appeared in the running tool catalog within the same session.

Removed: **youtube** (added, then proven dead - see P12 in `docs/qa/EXECUTION_LOG.md`),
**tavily** (401 without `TAVILY_API_KEY`; exa + duckduckgo cover search keyless).

---

## Root causes found and fixed (this is the part that was actually broken)

1. **postgres was wired wrongly twice over.** The old entry passed the DSN as
   `DATABASE_URI` **env** plus `--access-mode restricted`. But the build that
   `mcp<2` resolves to (**postgres-mcp 0.1.0**) does `if len(sys.argv) != 2: raise`
   - it wants the DSN as the **only positional argument** and ignores the env var.
   (postgres-mcp 0.3.0 does accept env + flags, but 0.3.0 requires `mcp>=2`.)
   **Fixed:** `uvx --with "mcp<2" postgres-mcp {env:SANRO_MCP_DB_URI}` - and 0.1.0 is
   **read-only by default** (`BEGIN TRANSACTION READ ONLY` + `ROLLBACK`, tool
   description "Run a read-only SQL query"), so this is also the safer pin.
   **Verified live:** `query` returns `sanro_dev` + 143 ContentItems; a `CREATE TABLE`
   probe is rejected with *"cannot execute CREATE TABLE in a read-only transaction"*.

2. **A transient DNS outage at 19:28 made three healthy servers look dead.**
   context7 / exa / deepwiki all failed with `getaddrinfo ENOTFOUND`, and OpenCode's
   MCP client did not retry. From the shell the same hosts resolve and answer
   `200` to an MCP `initialize` - so it was the network at that moment, not the config.
   **Fixed:** touching a server's definition re-initialises it in place (no restart
   needed) - all three are now connected.

3. **tavily 401s** (the URL needs `?tavilyApiKey=`). Removed - exa provides the same
   capability with no key.

4. **youtube transcript MCP is dead** (7/7 transcript fetches failed on videos with
   known-good captions while oEmbed controls returned 200 - the caption endpoint is
   blocked from this network). Removed rather than shipped; a working replacement
   needs a YouTube Data API key.

5. **shadcn timed out** because `shadcn@latest` was downloaded on every start.
   **Fixed:** pinned to `shadcn@4.22.1` (now in the npx cache) - connects immediately.

6. **postgres also needs pypi at start-up** (it is a Python package fetched by `uvx`).
   The package is now in the local uv cache, so start-up no longer depends on pypi
   being reachable.

---

## Re-verify (no restart needed)

```bash
# postgres MCP end-to-end (never prints the DSN)
node scripts/qa/mcp-postgres-check.mjs

# any local stdio MCP: initialize + tools/list
node scripts/qa/mcp-stdio-probe.mjs shadcn npx -y shadcn@4.22.1 mcp

# what OpenCode itself recorded
grep -E "mcp connected|mcp connect failed" %USERPROFILE%\.local\share\opencode\log\opencode.log | tail -20
```

**A server can be revived without restarting OpenCode:** change its entry in
`opencode.jsonc` (even a no-op-looking change such as adding `"oauth": false`) and
OpenCode re-initialises that server on the spot.

---

## Deliberately NOT added

| Candidate | Why not |
|---|---|
| **github** | **Now added** - the repo is private, so the token matters: the already-authenticated `gh` CLI token is stored in a **User-scope** env var (`GH_MCP_TOKEN`), never in the config file, and the endpoint answers MCP `initialize` with 200. |
| **firecrawl / sentry / figma / linear / notion** | All need API keys/accounts that are absent - would be dead on arrival. |
| **supabase / docker** | The project uses **native PostgreSQL 18** (explicitly no Docker) and no Supabase. |
| **puppeteer / fetch / filesystem** | Covered by playwright/chrome-devtools + the built-in `webfetch`/file tools. |

---

## Note on the Code Mode catalog

The Code Mode sandbox exposes a *subset* of the servers to the agent. That gap has
now closed for everything except `unsplash`: postgres, context7, exa, deepwiki and
shadcn are all callable from `execute` as of this update. A server missing from the
catalog but present in `opencode.jsonc` is a harness limitation, not a config failure -
check the log line (`mcp connected` / `mcp connect failed`) for the truth.

---

## Image generation: requested, evaluated, blocked (2026-10-24)

The product ask was "connect an MCP that can generate AI images and use it wherever
required". Three routes were evaluated before shipping composed artwork instead.

| Route | Result | Why |
|---|---|---|
| **Gemini image models** (via the existing `AI_API_KEY`, not an MCP) | **BLOCKED** | `gemini-2.5-flash-image`, `gemini-3-pro-image`, `gemini-3.1-flash-image`, `gemini-3.1-flash-lite-image` all return **HTTP 429 quota exceeded** on this free-tier key. Text works (20 requests/day); images are not provisioned at all. |
| **Keyless generation** (pollinations.ai / flux, no key) | **REJECTED** | Tested output is washed out and watermarked - not shippable next to the premium 3D icon set. |
| **A dedicated image MCP server** | **NOT INSTALLED** | Every maintained option (Replicate, fal.ai, Stability, OpenAI-images) needs a funded provider key. Installing a server that can only 429 would add a failure surface for no capability. |

What shipped instead: `scripts/qa/build-brand-art.mjs` composes the banners offline
(SVG gradient field + the subject's 3D icon + faint geometry, rasterised with sharp) into
`apps/web/public/art/` and `apps/mobile/assets/art/`. Deterministic, no key, ~40 KB each.

**To enable AI imagery later:** add a funded key, then either
`node scripts/qa/generate-subject-art.mjs` (already written, same filenames) or register an
image MCP in `opencode.jsonc`. No component change is needed - the UI resolves art through
`subjectArt()` / `subjectBanner()`. Full detail: `docs/AI_PROVIDER.md`.
