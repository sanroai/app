# AI provider — Gemini wiring, measured latency, and the image quota wall

## Configuration

| Variable | Where | Value |
|---|---|---|
| `AI_PROVIDER` | `apps/api/.env` | `gemini` |
| `AI_API_KEY` | `apps/api/.env` (git-ignored) | Google AI Studio key |
| `AI_MODEL` | `apps/api/.env` | `gemini-3-flash-preview` |
| `AI_BASE_URL` | optional | `https://generativelanguage.googleapis.com/v1beta` |

The key never leaves the API: the web and mobile clients call
`POST /ai/chat`, `POST /ai/explain`, and the question endpoints. Nothing reads
`AI_API_KEY` outside `apps/api/src/ai/ai.service.ts` and the two QA scripts.

## Model choice (measured, same 120-word prompt)

| Model | Latency | Verdict |
|---|---|---|
| `gemini-3-flash-preview` | **3.6 s** | default |
| `gemini-3.8-flash` | 18.8 s | too slow |
| `gemini-flash-latest` | 39.4 s | near the 45 s abort → silent mock fallback |

Retry chain: configured model → `gemini-3-flash-preview` → `gemini-flash-latest`.

- **429** retries the *same* (fast) model twice with 1.5 s / 3 s backoff instead
  of switching to a slower one — switching is what used to push a chat past the
  request timeout.
- **404 / timeout** moves to the next model. Google retires model ids for new
  keys without notice (`gemini-2.5-flash`, `gemini-2.0-flash` already 404), so the
  alias is the safety net.
- `maxOutputTokens`: 2048 for JSON, 1200 for prose.

## Live gate

```bash
node scripts/qa/probe-ai-live.mjs     # 7/7 PASS
```

Covers: chat, explain, question generation, latency ceilings, no key leakage in
responses or logs, and cleanup of generated rows. `/ai/explain` returns **201**,
so the probe asserts `2xx`, not `200` (that was a false failure).

## The image wall

Every image-capable model on the supplied key answers **HTTP 429, "exceeded your
current quota"**:

- `gemini-2.5-flash-image`
- `gemini-3-pro-image`
- `gemini-3.1-flash-image`
- `gemini-3.1-flash-lite-image`

The keyless fallback (pollinations.ai / flux) was tested and **rejected**: washed
out, watermarked, not shippable.

So the shipped artwork is composed offline — SVG gradient fields + the premium 3D
icon PNGs, rasterised with sharp:

```bash
node scripts/qa/build-brand-art.mjs
# -> apps/web/public/art/{subject-science,subject-mathematics,subject-english,chapter-banner,dashboard-hero}.jpg
# -> apps/mobile/assets/art/  +  manifest.json
```

When a funded image key arrives, the swap path is already written:

```bash
node scripts/qa/generate-subject-art.mjs            # writes the same filenames + manifest
node scripts/qa/build-brand-art.mjs --verify        # confirms every banner exists
```

No component change is needed: the UI resolves art through
`subjectArt()` (web) / `subjectBanner()` (mobile).

## Text generation quota (matters for the question bank)

Free tier for `gemini-3-flash` is **20 requests per day** (quota id
`GenerateRequestsPerDayPerProjectPerModel-FreeTier`). The 429 body states the
reset time; a heavy authoring run exhausts it in minutes.

Consequences and the workaround are in `docs/QUESTION_BANK_GROWTH.md`: one
request authors a **batch of concepts** (default 5), so 20 requests/day still
moves ~100 concepts/day, and the curated fragments are committed per subject so
progress is never lost.
