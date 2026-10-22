import {
  conceptStatusLabel,
  formatTimestamp,
  isMasteredConcept,
  masteryLabel,
  masteryTone,
  normalizeSegments,
  pickContinueConcept,
  progressPercent,
  type ChapterConcept,
} from './chapter-hub';

function concept(overrides: Partial<ChapterConcept>): ChapterConcept {
  return {
    id: 'c1',
    name: 'Concept',
    mastery: null,
    hasVideo: false,
    status: 'NOT_STARTED',
    ...overrides,
  };
}

describe('formatTimestamp (chapter markers)', () => {
  it('formats as mm:ss', () => {
    expect(formatTimestamp(0)).toBe('00:00');
    expect(formatTimestamp(9)).toBe('00:09');
    expect(formatTimestamp(2558)).toBe('42:38');
    expect(formatTimestamp(600)).toBe('10:00');
  });

  it('adds the hour for long lessons', () => {
    expect(formatTimestamp(3600)).toBe('1:00:00');
    expect(formatTimestamp(13515)).toBe('3:45:15');
  });

  it('never throws on rubbish input', () => {
    expect(formatTimestamp(null)).toBe('0:00');
    expect(formatTimestamp(undefined)).toBe('0:00');
    expect(formatTimestamp(-5)).toBe('0:00');
    expect(formatTimestamp(Number.NaN)).toBe('0:00');
  });
});

describe('normalizeSegments (chapter markers)', () => {
  it('sorts the markers by time', () => {
    const markers = normalizeSegments([
      { title: 'Second', startSeconds: 120 },
      { title: 'First', startSeconds: 0 },
    ]);
    expect(markers.map((m) => m.title)).toEqual(['First', 'Second']);
  });

  it('drops markers without a usable offset', () => {
    const markers = normalizeSegments([
      { title: 'Good', startSeconds: 10 },
      { title: 'Negative', startSeconds: -1 },
      { title: 'Broken', startSeconds: Number.NaN },
    ]);
    expect(markers).toHaveLength(1);
    expect(markers[0].title).toBe('Good');
  });

  it('gives an untitled marker a readable name', () => {
    const markers = normalizeSegments([{ title: '   ', startSeconds: 5 }]);
    expect(markers[0].title).toBe('Marker');
  });

  it('returns an empty list for empty input', () => {
    expect(normalizeSegments(null)).toEqual([]);
    expect(normalizeSegments(undefined)).toEqual([]);
    expect(normalizeSegments([])).toEqual([]);
  });
});

describe('mastery', () => {
  it('maps the levels to a tone', () => {
    expect(masteryTone('MASTERED')).toBe('mastered');
    expect(masteryTone('GOOD')).toBe('mastered');
    expect(masteryTone('WEAK')).toBe('weak');
    expect(masteryTone('NEEDS_INTERVENTION')).toBe('weak');
    expect(masteryTone('DEVELOPING')).toBe('developing');
    expect(masteryTone(null)).toBe('unknown');
  });

  it('labels the levels for a student', () => {
    expect(masteryLabel('MASTERED')).toBe('Mastered');
    expect(masteryLabel('NEEDS_INTERVENTION')).toBe('Intervene');
    expect(masteryLabel(null)).toBe('Not started');
  });

  it('treats a mastered level or a high score as mastered', () => {
    expect(isMasteredConcept(concept({ mastery: { score: 90, level: 'MASTERED' } }))).toBe(true);
    expect(isMasteredConcept(concept({ mastery: { score: 85, level: 'DEVELOPING' } }))).toBe(true);
    expect(isMasteredConcept(concept({ mastery: { score: 40, level: 'WEAK' } }))).toBe(false);
    expect(isMasteredConcept(concept({ mastery: null }))).toBe(false);
  });

  it('labels the concept status', () => {
    expect(conceptStatusLabel('NOT_STARTED')).toBe('Not started');
    expect(conceptStatusLabel('IN_PROGRESS')).toBe('In progress');
    expect(conceptStatusLabel(null)).toBe('Not started');
  });
});

describe('pickContinueConcept (continue where you left off)', () => {
  it('picks the weakest concept that already has evidence', () => {
    const picked = pickContinueConcept([
      concept({ id: 'mastered', mastery: { score: 95, level: 'MASTERED' } }),
      concept({ id: 'weak', mastery: { score: 30, level: 'WEAK' } }),
      concept({ id: 'ok', mastery: { score: 70, level: 'DEVELOPING' } }),
      concept({ id: 'untouched' }),
    ]);
    expect(picked?.id).toBe('weak');
  });

  it('falls back to the first untouched concept', () => {
    const picked = pickContinueConcept([concept({ id: 'a' }), concept({ id: 'b' })]);
    expect(picked?.id).toBe('a');
  });

  it('returns null when everything is mastered', () => {
    expect(pickContinueConcept([concept({ mastery: { score: 95, level: 'MASTERED' } })])).toBeNull();
    expect(pickContinueConcept([])).toBeNull();
    expect(pickContinueConcept(undefined)).toBeNull();
  });
});

describe('progressPercent', () => {
  it('clamps into 0..100', () => {
    expect(progressPercent(25)).toBe(25);
    expect(progressPercent(-10)).toBe(0);
    expect(progressPercent(140)).toBe(100);
    expect(progressPercent(null)).toBe(0);
    expect(progressPercent(undefined)).toBe(0);
  });
});
