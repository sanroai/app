import { describe, it, expect } from 'vitest';
import {
  gradeObjectiveResponse,
  masteryLevelForScore,
  isWeakLevel,
  type GradableQuestion,
} from './mastery.service';

describe('gradeObjectiveResponse', () => {
const mcq: GradableQuestion = {
    id: 'q1',
    type: 'MCQ',
    marks: 1,
    answer: 'B',
    options: [
      { text: 'A', isCorrect: false },
      { text: 'B', isCorrect: true },
      { text: 'C', isCorrect: false },
    ],
  };

  it('marks correct MCQ when text matches option text', () => {
    const result = gradeObjectiveResponse(mcq, 'B');
    expect(result).toEqual({ correct: true, skipped: false });
  });

  it('marks incorrect MCQ when text does not match', () => {
    const result = gradeObjectiveResponse(mcq, 'A');
    expect(result).toEqual({ correct: false, skipped: false });
  });

  it('returns null for unsupported question type', () => {
    const q: GradableQuestion = { id: 'q2', type: 'LONG_ANSWER', marks: 2, answer: 'x', options: [] };
    expect(gradeObjectiveResponse(q, 'any')).toBeNull();
  });
});

describe('masteryLevelForScore', () => {
  it('returns MASTERED when score >= 90 and sufficient evidence', () => {
    expect(masteryLevelForScore(90, 5)).toBe('MASTERED');
  });

  it('returns NEEDS_INTERVENTION when score is low', () => {
    expect(masteryLevelForScore(10, 5)).toBe('NEEDS_INTERVENTION');
  });

  it('returns INSUFFICIENT_EVIDENCE when evidence is below threshold', () => {
    expect(masteryLevelForScore(50, 0)).toBe('INSUFFICIENT_EVIDENCE');
  });
});

describe('isWeakLevel', () => {
  it('returns true for NEEDS_INTERVENTION', () => {
    expect(isWeakLevel('NEEDS_INTERVENTION')).toBe(true);
  });

  it('returns false for MASTERED', () => {
    expect(isWeakLevel('MASTERED')).toBe(false);
  });
});
