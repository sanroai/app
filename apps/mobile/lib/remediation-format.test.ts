import {
  buildWeakConcepts,
  masteryReason,
  planProgress,
  stepAction,
  stepActionLabel,
  stepStatusMeta,
} from './remediation-format';
import type { MasteryRow, WeakConceptRow } from './remediation-hooks';

function masteryRow(overrides: Partial<MasteryRow>): MasteryRow {
  return {
    id: 'm1',
    studentId: 's1',
    conceptId: 'c1',
    score: 0,
    attempts: 0,
    correct: 0,
    evidenceCount: 0,
    level: 'NEEDS_INTERVENTION',
    lastUpdatedAt: '2026-10-22T00:00:00.000Z',
    concept: null,
    ...overrides,
  };
}

function weakRow(overrides: Partial<WeakConceptRow>): WeakConceptRow {
  return {
    id: 'c1',
    name: 'Concept',
    topicId: null,
    score: 0,
    level: 'NEEDS_INTERVENTION',
    weak: true,
    ...overrides,
  };
}

describe('remediation view helpers (mobile)', () => {
  it('keeps only the weak concepts', () => {
    const list = buildWeakConcepts(
      [
        masteryRow({ conceptId: 'c1', level: 'NEEDS_INTERVENTION', score: 10 }),
        masteryRow({ conceptId: 'c2', level: 'WEAK', score: 40 }),
        masteryRow({ conceptId: 'c3', level: 'DEVELOPING', score: 55 }),
        masteryRow({ conceptId: 'c4', level: 'GOOD', score: 70 }),
        masteryRow({ conceptId: 'c5', level: 'MASTERED', score: 95 }),
      ],
      [],
    );
    expect(list.map((c) => c.conceptId)).toEqual(['c1', 'c2']);
  });

  it('sorts the weak concepts worst first', () => {
    const list = buildWeakConcepts(
      [
        masteryRow({ conceptId: 'mid', level: 'WEAK', score: 45 }),
        masteryRow({ conceptId: 'low', level: 'NEEDS_INTERVENTION', score: 5 }),
        masteryRow({ conceptId: 'high', level: 'WEAK', score: 58 }),
      ],
      [],
    );
    expect(list.map((c) => c.conceptId)).toEqual(['low', 'mid', 'high']);
  });

  it('merges the weak-concept rows the mastery list does not know yet', () => {
    const list = buildWeakConcepts(
      [masteryRow({ conceptId: 'c1', level: 'WEAK', score: 40 })],
      [weakRow({ id: 'c1', score: 40 }), weakRow({ id: 'c2', name: 'New one', score: 20 })],
    );
    expect(list.map((c) => c.conceptId)).toEqual(['c2', 'c1']);
    expect(list[0].name).toBe('New one');
  });

  it('survives an empty or broken payload', () => {
    expect(buildWeakConcepts(null, null)).toEqual([]);
    expect(buildWeakConcepts([], [])).toEqual([]);
  });

  it('explains why a concept is weak', () => {
    expect(masteryReason({ level: 'NEEDS_INTERVENTION', attempts: 5, correct: 0 })).toContain(
      '0 correct out of 5 attempts',
    );
    expect(masteryReason({ level: 'WEAK', score: 40, attempts: 3, correct: 1 })).toContain('40%');
    expect(masteryReason({ level: 'MASTERED', score: 95 })).toContain('Mastered');
    expect(masteryReason({})).toBe('0% mastery');
  });

  it('sends a quiz step to the practice flow and the rest to the concept', () => {
    expect(stepAction('QUIZ')).toBe('practice');
    expect(stepAction('PRACTICE_SET')).toBe('practice');
    expect(stepAction('VIDEO')).toBe('concept');
    expect(stepAction('NOTES')).toBe('concept');
    expect(stepAction(undefined)).toBe('concept');
    expect(stepActionLabel('practice')).toBe('Start practice');
    expect(stepActionLabel('concept')).toBe('Practise this concept');
  });

  it('labels every step status', () => {
    expect(stepStatusMeta('PENDING').label).toBe('To do');
    expect(stepStatusMeta('IN_PROGRESS').label).toBe('In progress');
    expect(stepStatusMeta('COMPLETED').label).toBe('Done');
    expect(stepStatusMeta('SKIPPED').label).toBe('Skipped');
    expect(stepStatusMeta('COMPLETED').done).toBe(true);
  });

  it('falls back to the items when the plan carries no progress', () => {
    const progress = planProgress({
      items: [{ status: 'COMPLETED' }, { status: 'PENDING' }],
    });
    expect(progress.done).toBe(1);
    expect(progress.total).toBe(2);
    expect(progress.percent).toBe(50);
  });

  it('never reports a progress above 100', () => {
    expect(planProgress({ progress: 140, items: [] }).percent).toBe(100);
  });
});
