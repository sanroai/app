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
}

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
