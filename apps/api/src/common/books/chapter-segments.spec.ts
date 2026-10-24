import { describe, expect, it } from 'vitest';
import {
  clipSegmentsToDuration,
  deriveConceptSegments,
  normalizeChapterSegments,
} from './chapter-segments';

/**
 * The concept-wise video split is the difference between "this video is one
 * 18-minute blur" and "jump to the part I am stuck on". Only 86 of the 221 lesson
 * videos have creator chapters, so the derived split is what most students see -
 * these assertions are the contract the clients rely on.
 */
describe('deriveConceptSegments', () => {
  it('splits the runtime evenly across the concepts, in curriculum order', () => {
    const segments = deriveConceptSegments(['HCF', 'LCM', 'Irrationality'], 600);

    expect(segments.map((s) => s.title)).toEqual(['HCF', 'LCM', 'Irrationality']);
    expect(segments.map((s) => s.startSeconds)).toEqual([0, 200, 400]);
    expect(segments.every((s) => s.derived === true)).toBe(true);
  });

  it('does nothing when the chapter has a single concept', () => {
    expect(deriveConceptSegments(['Only one'], 600)).toEqual([]);
  });

  it('does nothing for a clip too short to split', () => {
    expect(deriveConceptSegments(['A', 'B', 'C'], 90)).toEqual([]);
  });

  it('stops adding markers when a slice would be under 20 seconds', () => {
    const concepts = Array.from({ length: 8 }, (_, i) => `Concept ${i + 1}`);
    const segments = deriveConceptSegments(concepts, 180);

    expect(segments).toHaveLength(8);
    expect(segments.at(-1)!.startSeconds).toBeLessThanOrEqual(180 - 20);
  });

  it('caps the number of markers so the strip stays usable', () => {
    const concepts = Array.from({ length: 40 }, (_, i) => `Concept ${i + 1}`);
    expect(deriveConceptSegments(concepts, 7200).length).toBeLessThanOrEqual(12);
  });

  it('ignores blank concept names', () => {
    const segments = deriveConceptSegments(['HCF', '   ', 'LCM'], 600);
    expect(segments.map((s) => s.title)).toEqual(['HCF', 'LCM']);
  });

  it('returns nothing when the runtime is unknown', () => {
    expect(deriveConceptSegments(['A', 'B'], null)).toEqual([]);
  });
});

describe('clipSegmentsToDuration', () => {
  const segments = normalizeChapterSegments([
    { title: 'Intro', startSeconds: 0 },
    { title: 'Middle', startSeconds: 300 },
    { title: 'Past the end', startSeconds: 14040 },
  ]);

  it('drops a marker that points past the runtime', () => {
    expect(clipSegmentsToDuration(segments, 13515).map((s) => s.title)).toEqual([
      'Intro',
      'Middle',
    ]);
  });

  it('keeps everything when the runtime is unknown', () => {
    expect(clipSegmentsToDuration(segments, null)).toHaveLength(3);
  });

  it('keeps a marker that opens the closing chapter', () => {
    const late = normalizeChapterSegments([{ title: 'Close', startSeconds: 350 }]);
    expect(clipSegmentsToDuration(late, 360)).toHaveLength(1);
  });
});
