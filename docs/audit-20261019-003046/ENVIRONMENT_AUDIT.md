# Environment Audit (Phase A) — 2026-10-19 00:30:46

## System
- OS: Windows (win32)
- Node: v24.15.0, npm 11.12.1, pnpm 12.4.2
- Git: 2.54.0.windows.1
- OpenCode: v2.0.32

## OpenCode Global Config
Path: C:\Users\Harish\.config\opencode\
- opencode.jsonc (2234 bytes) — JSONC valid
- Backups: opencode.jsonc.bak-20261013-005836, opencode.jsonc.bak-20261019-001153
- cli.json, service.json, package.json, .gitignore
- Global AGENTS.md created (2026-10-19) — reusable workflow

## MCP Config (global)
Servers configured: playwright, dart, context7, postgres, unsplash (disabled), memory, deepwiki, chrome-devtools, exa, tavily, iconify, shadcn
- context7: remote https://mcp.context7.com/mcp — OK (live test)
- exa: remote https://mcp.exa.ai/mcp — OK (live test)
- deepwiki: remote https://mcp.deepwiki.com/mcp — OK (live test)
- memory (local npx @modelcontextprotocol/server-memory) — tools available, read_graph OK
- chrome-devtools (local npx chrome-devtools-mcp@latest) — list_pages OK
- playwright (local playwright-mcp) — browser_close OK (safe)
- iconify (local npx -y iconify-mcp) — search-icons OK
- shadcn (local npx -y shadcn@latest mcp) — get_audit_checklist OK
- tavily (remote https://mcp.tavily.com/mcp/?tavilyApiKey={env:TAVILY_API_KEY}) — tavily_search OK
- dart (local dart mcp-server) — pub_dev_search/get_runtime_errors OK
- opencode (native) — models OK
- postgres (uvx --with mcp<2 postgres-mcp --access-mode restricted; DATABASE_URI from {env:FRIICRM_MCP_DB_URI}) — tools exposed via runtime; configured with existing DB URI (FRIICRM) pointing to unrelated DB (configured as-is). Note: postgres-mcp expects DATABASE_URI; current env has FRIICRM_MCP_DB_URI set (len=71).
- unsplash: disabled (no UNSPLASH_ACCESS_KEY)

Other integrations not configured: GitHub, Figma, Sentry, Stripe, PostHog, Firecrawl.

Notes: 
- service.json contains credential (not printed). 
- multiple postgres-mcp dist-info versions cached (0.1.0/0.3.0); uv/uvx present. 

## Live MCP Verification (Phase B)
OK: context7, exa, memory, chrome-devtools, deepwiki, iconify, shadcn, playwright (safe op), tavily, opencode, dart. 
postgres: exposed at runtime; tools not enumerated via search in this session (catalog search returned empty for postgres namespace) but configured; connecting to FRIICRM DB URI (unrelated to Sanro) — preserved as configured.

## Git
- Branch: master
- Working tree: 29 modified, 16 untracked, 0 deletions (no reset/rebase/force-push)
- Backups created for README.md and AGENTS.md in project root (dated).

## Sanro AI Project (current workspace)
Path: D:\sanroaiapp
Apps: api, mobile, web (monorepo, pnpm)
Key docs: AGENTS.md, README.md, CHAT.md, chatgpt.md
Typecheck: mobile 0 TS errors (verified). API tests: 22 files, 244 passed (flaky “1 failed” observed once, subsequent runs all 244 passed). Lint: warnings only. 
Recent work: 3D Fluent Emoji icons, design system, data contracts fixed, library seed self-healing; no deletions.