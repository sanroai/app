/**
 * Chapter markers of a video lesson.
 *
 * A 45-minute NCERT lesson is unusable as one blob, so a lesson can carry the
 * markers of the textbook sections it walks through:
 *   [{ "title": "Total Surface Area", "startSeconds": 2558 }]
 *
 * The data lives in the nullable `ContentItem.segments` JSON column, so it can
 * be edited by hand or by the content pipeline - which means it can be wrong.
 * Every read therefore goes through `normalizeChapterSegments`.
 */

/** The most chapter markers a lesson shows (a chapter list must stay scannable). */
export const CHAPTER_SEGMENT_LIMIT = 24;

export interface ChapterSegment {
  title: string;
  startSeconds: number;
  /**
   * True when the marker was derived from the chapter's own concept list because
   * the video carries no creator chapters. The clients label these as an
   * approximate concept split so a derived marker is never mistaken for a
   * timestamp the creator actually published.
   */
  derived?: boolean;
}

/** Shortest lesson worth splitting (a 3-minute clip has no room for sections). */
export const DERIVED_SEGMENT_MIN_SECONDS = 120;

/** Concept splits stay scannable, so a long chapter collapses to at most this many. */
export const DERIVED_SEGMENT_LIMIT = 12;

/**
 * Validates and normalises the raw JSON stored in `ContentItem.segments`:
 *  - at most `CHAPTER_SEGMENT_LIMIT` markers are kept
 *  - `startSeconds` must be a finite, non-negative number (floored to seconds)
 *  - `title` must be a non-empty string
 *  - markers are sorted by start time and de-duplicated by start time
 *
 * Anything unparsable is dropped rather than surfaced - a broken marker must
 * never break the lesson it belongs to.
 */
export function normalizeChapterSegments(raw: unknown): ChapterSegment[] {
  if (!Array.isArray(raw)) return [];

  const collected: ChapterSegment[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const record = entry as Record<string, unknown>;

    const title = typeof record.title === 'string' ? record.title.trim() : '';
    if (!title) continue;

    const start = record.startSeconds;
    if (typeof start !== 'number' || !Number.isFinite(start) || start < 0) continue;

    collected.push({ title, startSeconds: Math.floor(start) });
    if (record.derived === true) collected[collected.length - 1].derived = true;
  }

  collected.sort((a, b) => a.startSeconds - b.startSeconds);

  const seen = new Set<number>();
  const out: ChapterSegment[] = [];
  for (const segment of collected) {
    if (seen.has(segment.startSeconds)) continue;
    seen.add(segment.startSeconds);
    out.push(segment);
    if (out.length >= CHAPTER_SEGMENT_LIMIT) break;
  }
  return out;
}

/**
 * Drop markers that start at or past the end of the video.
 *
 * Creator chapters are authored against the video the creator published; when a
 * lesson is a re-upload (or the stored runtime is a trimmed edit) a description
 * timestamp can point beyond the end, and tapping it seeks nowhere. Five seconds
 * of slack keeps a marker that opens the closing section.
 */
export function clipSegmentsToDuration(
  segments: ChapterSegment[],
  durationSeconds: number | null | undefined,
): ChapterSegment[] {
  if (typeof durationSeconds !== 'number' || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return segments;
  }
  const limit = durationSeconds - 5;
  return segments.filter((segment) => segment.startSeconds < limit);
}

/**
 * Concept-wise split for a lesson that has no creator chapters.
 *
 * Most NCERT lesson videos on YouTube are uploaded as one long clip with no
 * chapter markers, so "jump to the concept you are stuck on" silently did
 * nothing for ~60% of the catalogue. This derives an even split across the
 * chapter's own concepts and flags every marker `derived: true` so the UI can
 * say the split is approximate.
 *
 * Returns `[]` when a split would be a lie or noise:
 *  - fewer than two concepts (nothing to jump between),
 *  - a runtime under `DERIVED_SEGMENT_MIN_SECONDS`,
 *  - a missing runtime (a marker we cannot place is worse than none).
 */
export function deriveConceptSegments(
  conceptNames: string[],
  durationSeconds: number | null | undefined,
): ChapterSegment[] {
  const names = conceptNames.map((n) => n.trim()).filter(Boolean).slice(0, DERIVED_SEGMENT_LIMIT);
  if (names.length < 2) return [];
  if (typeof durationSeconds !== 'number' || !Number.isFinite(durationSeconds)) return [];
  if (durationSeconds < DERIVED_SEGMENT_MIN_SECONDS) return [];

  const slice = Math.floor(durationSeconds / names.length);
  if (slice < 20) return [];

  return names.map((title, index) => ({ title, startSeconds: index * slice, derived: true }));
}
