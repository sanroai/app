import { describe, it, expect } from 'vitest';
import {
  REVIEW_FIRST_INTERVAL_DAYS,
  REVIEW_MAX_INTERVAL_DAYS,
  nextReviewIntervalDays,
  scheduleAfterEvidence,
} from './review-schedule';

describe('nextReviewIntervalDays', () => {
  it('starts a concept on the first rung after a good result', () => {
    expect(nextReviewIntervalDays(0, 100)).toBe(1);
    expect(nextReviewIntervalDays(0, 80)).toBe(1);
  });

  it('stretches on success: 1 -> 3 -> 7 -> 21 -> 45', () => {
    expect(nextReviewIntervalDays(1, 90)).toBe(3);
    expect(nextReviewIntervalDays(3, 90)).toBe(7);
    expect(nextReviewIntervalDays(7, 90)).toBe(21);
    expect(nextReviewIntervalDays(21, 90)).toBe(45);
  });

  it('stops stretching at the longest interval', () => {
    expect(nextReviewIntervalDays(REVIEW_MAX_INTERVAL_DAYS, 100)).toBe(REVIEW_MAX_INTERVAL_DAYS);
  });

  it('collapses to one day after a weak result', () => {
    expect(nextReviewIntervalDays(21, 40)).toBe(REVIEW_FIRST_INTERVAL_DAYS);
    expect(nextReviewIntervalDays(7, 0)).toBe(REVIEW_FIRST_INTERVAL_DAYS);
  });

  it('holds the current interval on a middling result', () => {
    expect(nextReviewIntervalDays(7, 60)).toBe(7);
    // never scheduled yet -> a middling result still schedules tomorrow
    expect(nextReviewIntervalDays(0, 60)).toBe(1);
  });
});

describe('scheduleAfterEvidence', () => {
  it('returns the interval and the date it becomes due', () => {
    const now = new Date('2026-11-03T09:00:00.000Z');
    const scheduled = scheduleAfterEvidence(0, 90, now);
    expect(scheduled.intervalDays).toBe(1);
    expect(scheduled.dueAt.toISOString()).toBe('2026-11-04T09:00:00.000Z');
  });
});
