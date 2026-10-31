import { describe, expect, it } from 'vitest';
import { normalizeSegments, sectionStartForConcept } from './video-segments';

const markers = normalizeSegments([
  { title: 'Degree', startSeconds: 0 },
  { title: 'Graph', startSeconds: 263 },
  { title: 'Division Algorithm', startSeconds: 526, derived: true },
]);

describe('sectionStartForConcept (concept deep link)', () => {
  it('starts the lesson at the marker that names the concept', () => {
    expect(sectionStartForConcept(markers, 'Graph')).toBe(263);
  });

  it('ignores punctuation and case when matching the marker title', () => {
    expect(sectionStartForConcept(markers, 'division-algorithm')).toBe(526);
  });

  it('returns 0 rather than guessing when no marker names the concept', () => {
    expect(sectionStartForConcept(markers, 'Remainder Theorem')).toBe(0);
    expect(sectionStartForConcept([], 'Graph')).toBe(0);
    expect(sectionStartForConcept(markers, '')).toBe(0);
  });
});
