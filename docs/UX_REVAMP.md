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

## 3. 3D art for content, one vector set for navigation

Source of truth: **34 PNGs** in `apps/mobile/assets/icons/` (Fluent-style 3D art),
copied to `apps/web/public/icons/`.

- Web: `<Icon3D name="streak" />` — keyed registry in `apps/web/lib/subject-art.ts`.
- Mobile: `components/Icon3D.tsx` (same keys).
- No emoji in UI copy. Where a glyph is still needed (chevrons, play), use the
  icon library, not an emoji.
- **Not in the navigation (2026-10-30).** A row of small glossy objects reads as a
  row of emoji, which is exactly what the user rejected: the mobile tab bar now uses
  Ionicons (outline idle / filled active, tinted by the role theme) and the web menu
  uses one lucide glyph per item at one weight and size inside a tinted chip (the
  active item inverts the chip). `Icon3D` stays on content — lessons, AR, subject and
  chapter banners, achievements, dashboard stats — where it illustrates a thing
  rather than standing in for a menu item.

`Icon3D` is a **plain `<img>`** on web, deliberately: `next/image` emitted
`loading="lazy"` for these 20 KB local PNGs inside the dashboard grid, and
Chromium never issued the request (`complete: false`, no network entry — verified
with Playwright), so the icons stayed blank until a scroll. Eager local images
are correct here.

## 4. Subject + chapter artwork

- **Subject cards** (`/app/library/subjects`): a 16:9 banner per subject (science,
  mathematics, english, plus a neutral fallback), name and code over the dark
  bottom band. The subject banner carries **no** 3D icon anymore — the card sets a
  typographic monogram (`SCI` / `MAT` / `ENG`) instead, because a sentence-case
  subject name next to a small glossy object read as a sticker.
- **Every class gets its own framing** (2026-10-30). A subject repeats in ten
  classes, so one photograph made ten identical cards. Each subject now ships three
  framings (`-a` wide / `-b` mirrored closer / `-c` close-up, produced by the same
  script from the class's photo) and each class takes one deterministically
  (`classSubjectVariant`, mirrored on web and mobile), plus a large ghost class
  numeral on the banner. Same subject identity, different picture.
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

`Learn · Practice · Ask SANRO AI`. AR/3D is a card **inside Learn**; Practice is one
graded quiz action (Flashcards were cut on 2026-10-30 - see `AGENTS.md`).

## 6. Video sections are labelled honestly

Every lesson video now shows a jumpable section list under the player - every
section visible, stacked vertically (no horizontal scroller). See
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
| Read the textbook (page images) | ✅ dialog on the chapter hub | ✅ `/textbook/[chapterId]` screen |

## 7b. The textbook opens inside the app

The chapter PDF used to be handed to another app: a WebView cannot render it on Android
("Download unsuccessful"), and Chrome only downloads it. The chapter's own NCERT pages are
already rendered by the book pipeline (`books/.../chapters/<slug>/screenshots/pNNN.png`,
1240 px), so both clients now read those pages in place - the same content, one image per
page, no PDF plugin:

- the row is labelled **Read the textbook** (it said "Open chapter PDF"); the PDF survives as
  **Download PDF** next to the pages on web, and as the fallback on mobile for a chapter
  whose screenshots are not on disk;
- mobile is a vertical `FlatList` (page label under each image, tap to retry a failed page,
  lazy pages with `windowSize` 3 so a 16-page chapter does not hold 7 MB of bitmaps);
- the page URLs are signed (`/learning/pdf/:chapterId/pages/:page?exp&sig`, valid 60
  minutes) because an `<img>`/`<Image>` cannot send the bearer token;
- the page response must carry `Cross-Origin-Resource-Policy: cross-origin`: helmet's
  default `same-origin` makes Chrome drop the image on any other origin, which is *always*
  the case in production (`app.sanroai.com` vs `api.sanroai.com`).

## 8. Verification used

- `npx tsx scripts/verify-roles.mts student` → 8/8 pages clean (screenshots in
  `screenshots/student/`).
- Playwright DOM probes: one `header`, one `main`, one `h1`, 11 cards — any
  "duplicated" look in a stitched screenshot is a compositor artifact of the
  sticky blurred header, not duplicated DOM.
- `node scripts/qa/probe-video-segments.mjs [--grade 8|9]` → every student
  lesson video exposes markers.
- `node scripts/qa/probe-chapter-pages.mjs` → signed page list + real PNG bytes, 404 past the
  last page, 401 for a tampered signature (16/20/21 pages on SCI-10-1/2/3).
- `npx tsx scripts/qa/probe-textbook-reader.mts` → the web dialog paints the first page
  (`naturalWidth` 1240) and **Download PDF** emits the chapter file.
- On the phone (1080x2340): chapter hub → **Read the textbook** → page 1 of 16 renders
  in-app, scrolling loads the next pages.
