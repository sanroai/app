import { describe, it, expect } from 'vitest';
import {
  formatJoinedAnswer,
  formatMultiSelectAnswer,
  isAutoGradedType,
  isMultiSelectType,
  parseJoinedAnswer,
  parseMultiSelectAnswer,
  toggleMultiSelectAnswer,
} from './answer-format';

describe('isAutoGradedType', () => {
  it('marks the types the API grades automatically', () => {
    expect(isAutoGradedType('MCQ')).toBe(true);
    expect(isAutoGradedType('TRUE_FALSE')).toBe(true);
    expect(isAutoGradedType('MULTI_SELECT')).toBe(true);
    expect(isAutoGradedType('FILL_BLANK')).toBe(true);
  });

  it('does not mark written answers as auto-graded', () => {
    expect(isAutoGradedType('SHORT_ANSWER')).toBe(false);
    expect(isAutoGradedType('LONG_ANSWER')).toBe(false);
    expect(isAutoGradedType('VERY_SHORT_ANSWER')).toBe(false);
    expect(isAutoGradedType(undefined)).toBe(false);
    expect(isAutoGradedType(null)).toBe(false);
  });
});

describe('isMultiSelectType', () => {
  it('only matches MULTI_SELECT', () => {
    expect(isMultiSelectType('MULTI_SELECT')).toBe(true);
    expect(isMultiSelectType('MCQ')).toBe(false);
  });
});

describe('parseMultiSelectAnswer', () => {
  it('reads the JSON array of selected option texts', () => {
    expect(parseMultiSelectAnswer('["A","B"]')).toEqual(['A', 'B']);
  });

  it('returns an empty list for an unparsable or empty answer', () => {
    expect(parseMultiSelectAnswer('')).toEqual([]);
    expect(parseMultiSelectAnswer('A')).toEqual([]);
    expect(parseMultiSelectAnswer('{bad json')).toEqual([]);
    expect(parseMultiSelectAnswer(null)).toEqual([]);
    expect(parseMultiSelectAnswer(undefined)).toEqual([]);
  });

  it('returns an empty list when the JSON is not an array', () => {
    expect(parseMultiSelectAnswer('{"a":1}')).toEqual([]);
  });
});

describe('formatMultiSelectAnswer', () => {
  it('renders the selected options as a readable list', () => {
    expect(formatMultiSelectAnswer('["A","B"]')).toBe('A, B');
    expect(formatMultiSelectAnswer('[]')).toBe('');
  });
});

describe('parseJoinedAnswer / formatJoinedAnswer', () => {
  it('splits the canonical answer the API stores for MULTI_SELECT', () => {
    expect(parseJoinedAnswer('A||B')).toEqual(['A', 'B']);
    expect(formatJoinedAnswer('A||B')).toBe('A, B');
  });

  it('ignores empty parts', () => {
    expect(parseJoinedAnswer('A||')).toEqual(['A']);
    expect(parseJoinedAnswer(null)).toEqual([]);
  });
});

describe('toggleMultiSelectAnswer', () => {
  it('adds an option that is not selected yet', () => {
    expect(toggleMultiSelectAnswer('["A"]', 'B')).toBe('["A","B"]');
  });

  it('removes an option that is already selected', () => {
    expect(toggleMultiSelectAnswer('["A","B"]', 'A')).toBe('["B"]');
  });

  it('starts from an empty selection', () => {
    expect(toggleMultiSelectAnswer(undefined, 'A')).toBe('["A"]');
    expect(toggleMultiSelectAnswer('[]', 'A')).toBe('["A"]');
  });
});
