/**
 * Spaced review - one function, one table of intervals.
 *
 * Distributed practice is the second-strongest lever we have (d = 0.54 in the
 * 2025 classroom meta-analysis) and it costs nothing but a date: after every
 * piece of evidence the concept is given a `nextReviewAt`. A review queue then
 * asks for exactly the concepts whose date has arrived.
 *
 * The intervals are deliberately short at the start (a concept learned today is
 * fragile tomorrow) and stretch on success:
 *
 *   1 -> 3 -> 7 -> 21 -> 45 days
 *
 * A weak result collapses the interval back to a day, and a middling result
 * holds the current one, so a student who half-remembers something sees it again
 * sooner instead of being pushed further out.
 */

/** The ladder of intervals, in days. Ordered, smallest first. */
export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 21, 45] as const;

/** The shortest interval - what a concept gets after a weak result. */
export const REVIEW_FIRST_INTERVAL_DAYS = REVIEW_INTERVALS_DAYS[0];

/** The longest interval - a concept that has been recalled five times running. */
export const REVIEW_MAX_INTERVAL_DAYS = REVIEW_INTERVALS_DAYS[REVIEW_INTERVALS_DAYS.length - 1];

/** At or above this score a review stretches the interval to the next rung. */
const STRETCH_SCORE = 80;

/** Below this score the interval collapses to the first rung. */
const RESET_SCORE = 50;

/**
 * The interval to hand out next.
 *
 * @param currentDays the interval that produced this review (0 for a concept
 *                    that has never been scheduled)
 * @param score       this session's accuracy for the concept, 0-100
 */
export function nextReviewIntervalDays(currentDays: number, score: number): number {
  if (score < RESET_SCORE) return REVIEW_FIRST_INTERVAL_DAYS;
  if (score < STRETCH_SCORE) {
    return currentDays > 0 ? currentDays : REVIEW_FIRST_INTERVAL_DAYS;
  }
  const index = REVIEW_INTERVALS_DAYS.indexOf(currentDays as (typeof REVIEW_INTERVALS_DAYS)[number]);
  if (index < 0) return REVIEW_FIRST_INTERVAL_DAYS;
  return REVIEW_INTERVALS_DAYS[Math.min(index + 1, REVIEW_INTERVALS_DAYS.length - 1)];
}

/** `now` plus `days`, in whole days. */
export function addDays(now: Date, days: number): Date {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * The schedule a piece of evidence produces: the new interval and the date the
 * concept becomes due again.
 */
export function scheduleAfterEvidence(
  currentDays: number,
  score: number,
  now: Date = new Date(),
): { intervalDays: number; dueAt: Date } {
  const intervalDays = nextReviewIntervalDays(currentDays, score);
  return { intervalDays, dueAt: addDays(now, intervalDays) };
}
