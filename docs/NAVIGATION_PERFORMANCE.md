# Navigation speed — prefetch, skeletons and the dev-vs-production gap

Status: **shipped 2026-10-25**. Applies to the web app (`apps/web`).

## The symptom

"Library → Subjects → a chapter takes time to load, it doesn't open immediately."
Measured on the dev server (`next dev`, port 3000) with Playwright:

| Step | Before | After |
|---|---|---|
| nav Library | 4.9 s | 1.15 s |
| Browse by subject | 2.5 s | 0.88 s |
| subject card → chapters | 3.9 s | 0.92 s |
| chapter → chapter hub | 3.1 s | 0.84 s |
| concept → concept page | 7.3 s | 3.8 s (first visit in dev) |
| warm re-visit of any step | 5.0 s | 0.85–0.94 s |

The API was never the problem: `/learning/home` 28–32 ms, `/content/browse` ~30 ms,
chapters ~3 ms locally. The delay was the **Next dev server compiling the next route
segment on demand** (the click waits for the compile + chunk load, not for data).

## What we changed

1. **Warm the route and its data on intent** — `components/prefetch-link.tsx`.
   `PrefetchLink` is a `<Link>` that, on `mouseenter` / `focus` / `touchstart`, calls
   `router.prefetch(href)` once **and** the screen's own React Query prefetch
   (`lib/prefetch.ts`). It is used by the top-level nav, subject cards, chapter cards and
   concept rows. Offline it does nothing; failures are swallowed.
2. **Warm the next screen during idle time** — `lib/use-idle-prefetch.ts`.
   Each screen prefetches the screen it is most likely to send the student to, inside
   `requestIdleCallback`: library → subjects, subjects → first subject's chapters,
   chapters → first chapter hub, hub → the first unmastered concept. This is the
   YouTube/Instagram "the next thing is already loaded" behaviour, and it is what cut the
   chapter hub from 3.1 s to 0.84 s.
3. **Paint a shell immediately** — `components/route-skeletons.tsx` +
   `app/(dashboard)/app/library/loading.tsx`, `app/(dashboard)/app/learn/loading.tsx`.
   A route-level skeleton means a click never shows the previous page frozen.
4. **Shared query keys** — `learningKeys`, `chapterKeys.hub`, `libraryKeys` are exported by
   their hook modules so a prefetch can never warm a different key than the screen reads.

## Why Turbopack is not the answer (yet)

`next dev --turbopack` starts fine (ready in 5.3 s) but the app dies at hydration in the
browser with `TypeError: (void 0) is not a function` on `/login`. Until that is traced,
the dev script stays on Webpack. The numbers above are Webpack.

## What is a dev-only artifact and what is real

- The compile cost exists **only in `next dev`**. A production build ships the route
  chunks, and `router.prefetch` fetches the RSC payload ahead of the click, so the tap is
  a client-side transition.
- The skeleton and the idle prefetch are **production behaviour**, not dev scaffolding.
- `PrefetchLink` prefetches exactly the route the user is about to open; on a metered
  phone connection the cost is one screen's payload, not the whole app.

## Verifying it

```bash
npx tsx scripts/qa/probe-nav-timing.mts                     # dev server on :3000
WEB_URL=http://localhost:3001 npx tsx scripts/qa/probe-nav-timing.mts
```

The harness hovers the target for 400 ms (a real pointer does this before it clicks), so it
measures what a user feels rather than a synthetic instant click. It logs click → target
content visible, plus the API milliseconds spent inside that window.
