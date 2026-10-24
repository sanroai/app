# UX revamp — what changed and why

A record of the visual/product decisions taken in this pass, so the next change
starts from the reasoning instead of re-litigating it. Numbers in this file were
measured on `sanro_dev` (2026-10-24).

## 1. The dashboard answers one question

A student opens the app to answer **"what should I do today?"**. Everything that
did not help answer it was removed from the home screen:

| Removed | Why |
|---|---|
| **Badges earned** strip (web and mobile) | A badge is a reward, not an action. It occupied prime space, repeated the Progress tab, and pushed "Continue learning" below the fold. Achievements still live on `/app/achievements` (web) and the **Me** tab (mobile). |
| **Pending Assessments** card | The same assessments already appeared in "Your Focus Today" directly above, with a working CTA. Two lists of the same three rows is clutter, not emphasis. The Assessments tab remains the full list. |
| **Second Recent Activity** render | The right column and the main column both rendered the same component. One list, in the main column, with the score badge. |
| **Level** stat card | Level is derived from XP. It is now a subtitle inside the XP card (`Level 3 · 120/500 XP to next`), which is where a student looks for it anyway. |
| `👋` in the greeting | Emoji are not the app's visual language; the hero artwork carries the warmth. |

What remains, in learning-loop order: **hero (greeting + Continue learning)** →
**Your Focus Today** (weak concepts → "Fix This", upcoming assessments →
"Prepare") → **three numbers** (XP + level, streak, mastery) → **Continue
learning** (subject cards) → **Recent activity** → **Quick actions**.

## 2. Hero artwork, not a text header

The greeting sits on the `dashboard-hero` artwork with a left-to-right dark
gradient. Rules learned the hard way:

- Use **explicit hex** gradient stops (`from-[#0b0614]/92`), never a palette token
  that might not exist (`surface-950`), because Tailwind silently emits nothing
  and white text lands on white art.
- Keep the subject/object motif on the **right** of the frame: the text column is
  on the left on every screen size.

## 3. Premium 3D icons replace emoji everywhere

Source of truth: **34 PNGs** in `apps/mobile/assets/icons/` (Fluent-style 3D art),
copied to `apps/web/public/icons/`.

- Web: `<Icon3D name="streak" />` — keyed registry in `apps/web/lib/subject-art.ts`.
- Mobile: `components/Icon3D.tsx` (same keys).
- No emoji in UI copy. Where a glyph is still needed (chevrons, play), use the
  icon library, not an emoji.

`Icon3D` is a **plain `<img>`** on web, deliberately: `next/image` emitted
`loading="lazy"` for these 20 KB local PNGs inside the dashboard grid, and
Chromium never issued the request (`complete: false`, no network entry — verified
with Playwright), so the icons stayed blank until a scroll. Eager local images
are correct here.

## 4. Subject + chapter artwork

- **Subject cards** (`/app/library/subjects`): a 16:9 banner per subject (science,
  mathematics, english, plus a neutral fallback), name and code over the dark
  bottom band. The banner art already contains the subject's 3D icon, so the card
  does **not** repeat it.
- **Chapter hub** (web `/app/learn/chapters/[id]`, mobile `/chapter/[id]`): the
  same subject banner becomes the header, so opening a chapter feels like opening
  a book. Progress percentage sits in a translucent pill on the right.
- Assets are generated offline by `scripts/qa/build-brand-art.mjs` (sharp +
  SVG gradients + the 3D icons) into `apps/web/public/art/` and
  `apps/mobile/assets/art/`. Deterministic, no API key, ~40 KB each.
- **AI-generated imagery is not shipped**: every Gemini image model on the
  supplied key returns HTTP 429 quota-exceeded (see `docs/AI_PROVIDER.md`).
  `scripts/qa/generate-subject-art.mjs` is the ready swap path for a funded key.

## 5. Concept page stays three modes

`Learn · Practice · Ask SANRO AI`. AR/3D is a card **inside Learn**; Flashcards is
a **format inside Practice**. This is unchanged and documented in `AGENTS.md`.

## 6. Video sections are labelled honestly

Every lesson video now shows a jumpable strip under the player. See
`docs/VIDEO_CHAPTER_MARKERS.md`: real creator chapters when YouTube has them,
otherwise an even split across the chapter's concepts, marked
**"Sections · approximate"** so a derived marker is never mistaken for a
published timestamp.

## 7. Web ↔ mobile parity

Every item above landed on both platforms in the same change, except where the
capability is authoring/admin (web-only by design):

| Capability | Web | Mobile |
|---|---|---|
| Hero artwork on home | ✅ | ✅ (`assets/art/dashboard-hero.jpg`) |
| Badges removed from home | ✅ | ✅ |
| Pending assessments de-duplicated | ✅ | ✅ (Focus Today only) |
| 3D icon set | ✅ `/icons/*.png` | ✅ bundled |
| Subject banners | ✅ | chapter header (cards keep the 3D icon — a 64 px strip duplicated it) |
| Chapter header artwork | ✅ | ✅ |
| Approximate concept split label | ✅ | ✅ |
| Question counts | same API | same API |

## 8. Verification used

- `npx tsx scripts/verify-roles.mts student` → 8/8 pages clean (screenshots in
  `screenshots/student/`).
- Playwright DOM probes: one `header`, one `main`, one `h1`, 11 cards — any
  "duplicated" look in a stitched screenshot is a compositor artifact of the
  sticky blurred header, not duplicated DOM.
- `node scripts/qa/probe-video-segments.mjs [--grade 8|9]` → every student
  lesson video exposes markers.
