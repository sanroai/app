import { describe, it, expect } from 'vitest';
import {
  titleCase,
  formatDate,
  formatDurationMinutes,
  formatScore,
  accuracyPct,
} from './format';

describe('titleCase', () => {
  it('converts snake_case to Title case', () => {
    expect(titleCase('short_answer')).toBe('Short answer');
    expect(titleCase('long_answer')).toBe('Long answer');
  });

  it('capitalises the first letter of a plain string', () => {
    expect(titleCase('mcq')).toBe('Mcq');
    expect(titleCase('already spaced')).toBe('Already spaced');
  });

  it('collapses repeated whitespace', () => {
    // Observed behaviour: capitalisation targets the first *character*, so a
    // leading space means the first letter stays lowercase. Trailing whitespace
    // is trimmed. (Recorded as a minor cosmetic quirk, not changed here.)
    expect(titleCase('  multiple   spaces ')).toBe('multiple spaces');
    expect(titleCase('multiple   spaces')).toBe('Multiple spaces');
  });

  it('handles empty input', () => {
    expect(titleCase('')).toBe('');
  });
});

describe('formatDate', () => {
  it('returns an em dash for null, undefined or invalid input', () => {
    expect(formatDate()).toBe('—');
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
    expect(formatDate('2026-13-45')).toBe('—');
  });

  it('formats a valid ISO date in the en-IN style', () => {
    expect(formatDate('2026-01-15')).toBe('15 Jan 2026');
  });

  it('accepts a Date instance', () => {
    expect(formatDate(new Date(Date.UTC(2026, 0, 15)))).toBe('15 Jan 2026');
  });
});

describe('formatDurationMinutes', () => {
  it('returns an em dash for null, undefined and zero', () => {
    expect(formatDurationMinutes()).toBe('—');
    expect(formatDurationMinutes(null)).toBe('—');
    expect(formatDurationMinutes(0)).toBe('—');
  });

  it('renders minutes only when there is no whole hour', () => {
    expect(formatDurationMinutes(45)).toBe('45 min');
  });

  it('renders hours and minutes together', () => {
    expect(formatDurationMinutes(90)).toBe('1h 30m');
    expect(formatDurationMinutes(120)).toBe('2h 0m');
  });
});

describe('formatScore', () => {
  it('returns an em dash when score is missing', () => {
    expect(formatScore()).toBe('—');
    expect(formatScore(null)).toBe('—');
    expect(formatScore(undefined)).toBe('—');
  });

  it('renders the bare score when max is absent', () => {
    expect(formatScore(12)).toBe('12');
  });

  it('renders score/max when max is provided', () => {
    expect(formatScore(12, 20)).toBe('12/20');
    expect(formatScore(0, 20)).toBe('0/20');
  });
});

describe('accuracyPct', () => {
  it('returns an em dash when accuracy is missing', () => {
    expect(accuracyPct()).toBe('—');
    expect(accuracyPct(null)).toBe('—');
    expect(accuracyPct(undefined)).toBe('—');
  });

  it('renders a percentage', () => {
    expect(accuracyPct(85)).toBe('85%');
    expect(accuracyPct(0)).toBe('0%');
  });
});
