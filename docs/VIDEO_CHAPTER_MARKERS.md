# Video chapter markers — real chapters, and the honest fallback

## The bug

"Split the video concept-wise" looked broken: the marker list under the player
appeared on only a minority of lessons. Measured on `sanro_dev`:

| Videos | Markers before this fix |
|---|---|
| 221 | 86 carried real creator chapters |
| 221 | 135 carried none (118 stored JSON `null`, 17 SQL `NULL`) |

YouTube simply has no chapter list for most NCERT lesson uploads
(`source-video-chapters.mjs` re-read all 221 watch pages: **86 with chapters, 135
with none** — no amount of re-sourcing fixes them). The concept page's own video
was usually one of the 135, so the feature looked dead exactly where a student
would look for it.

## The fix — two layers

### 1. Real creator chapters win

`GET /learning/chapters/:id` and `GET /learning/concepts/:id` return
`segments: [{ title, startSeconds }]` from `ContentItem.segments`, normalised by
`normalizeChapterSegments` (dedupes, sorts, caps at 24, drops junk).

Data path (unchanged): `scripts/qa/source-video-chapters.mjs` →
`scripts/qa/apply-video-chapters.mjs` → seed + database.

### 2. Derived concept split when there is nothing to split

`deriveConceptSegments(conceptNames, durationSeconds)` in
`apps/api/src/common/books/chapter-segments.ts`:

- requires **≥ 2 concepts** in the chapter,
- requires a runtime of **≥ 120 s** and a slice of **≥ 20 s**,
- splits the runtime evenly, one marker per concept, in curriculum order,
- marks every marker **`derived: true`**.

Both clients label such a list **"Sections · approximate"** (web
`components/video-segments.tsx`, mobile `components/ChapterMarkerStrip.tsx`), so a
derived marker is never presented as a published timestamp.

Derivation happens **at read time**, so:

- no schema change, no seed churn,
- web and mobile get it through the same API for free,
- a real marker set automatically replaces it the moment one exists.

`clipSegmentsToDuration` also drops markers that start at or past the end of the
video (creator timestamps can outlive a re-upload): a marker that seeks nowhere is
worse than no marker.

## Presentation — every section visible (2026-10-29)

The markers used to be one **horizontally scrolling row of chips**, which hid every
section past the first two or three: on a phone the student saw "Combination and
Decom…" and a sliver of the next chip, and a section they cannot see is a section
they will not jump to. Both clients now render the markers as a **vertical list**,
one full-width row per section, timestamp first and title un-truncated:

- web — `apps/web/components/video-segments.tsx` (`flex flex-col`, full-width rows);
- mobile — `apps/mobile/components/ChapterMarkerStrip.tsx` (a plain `View`, no
  `ScrollView horizontal`).

There is no scroller to discover and no clipped label. The list still seeks in place
on tap; the derived heading is unchanged.

## Regression gate

```bash
node scripts/qa/probe-video-segments.mjs            # class 10
node scripts/qa/probe-video-segments.mjs --grade 8
node scripts/qa/probe-video-segments.mjs --grade 9
```

It walks the student's own path, collects every chapter hub's videos, and fails
when a video has no markers, when markers are out of order, or when a marker
starts past the runtime.

Result after the fix:

| Class | Lesson videos | Creator chapters | Derived split |
|---|---|---|---|
| 10 | 49 | 17 | 32 |
| 9 | 29 | 10 | 19 |
| 8 | 32 | 13 | 19 |

Every video passes; `0` failures.

## Tuning knobs

| Constant | File | Default |
|---|---|---|
| `DERIVED_SEGMENT_MIN_SECONDS` | `chapter-segments.ts` | 120 |
| `DERIVED_SEGMENT_LIMIT` | `chapter-segments.ts` | 12 |
| `CHAPTER_SEGMENT_LIMIT` | `chapter-segments.ts` | 24 |

Lowering the minimum splits shorter clips; raising it keeps very short clips
marker-free (a 2-minute clip split four ways is noise).
