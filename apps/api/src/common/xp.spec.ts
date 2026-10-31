import { describe, it, expect } from 'vitest';
import { awardStudentXp, nextStreakDays, startOfLocalDay, XP_PER_PRACTICE_CORRECT, XP_PRACTICE_COMPLETION } from './xp';

/**
 * The XP rules are the product contract (the UI quotes them), so they are
 * locked down here:
 *  - the streak is counted in calendar days (today keeps it, yesterday extends
 *    it, an older day restarts it at 1),
 *  - the lifetime counter and the XP ledger always move together (one
 *    transaction),
 *  - an activity with 0 XP is still an activity: it advances the streak.
 */

function daysAgo(n: number, from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

describe('XP streak rule', () => {
  it('keeps the streak on a second activity of the same calendar day', () => {
    const now = new Date(2026, 9, 22, 18, 30);
    const lastActiveAt = new Date(2026, 9, 22, 8, 5);
    expect(nextStreakDays(4, lastActiveAt, now)).toBe(4);
  });

  it('extends the streak when the last activity was yesterday', () => {
    const now = new Date(2026, 9, 22, 9, 0);
    const lastActiveAt = new Date(2026, 9, 21, 23, 59);
    expect(nextStreakDays(4, lastActiveAt, now)).toBe(5);
  });

  it('restarts the streak when the last activity was older than yesterday', () => {
    const now = new Date(2026, 9, 22, 9, 0);
    const lastActiveAt = new Date(2026, 9, 20, 23, 59);
    expect(nextStreakDays(9, lastActiveAt, now)).toBe(1);
  });

  it('starts at 1 when the student was never active', () => {
    expect(nextStreakDays(0, null, new Date(2026, 9, 22, 9, 0))).toBe(1);
    expect(nextStreakDays(7, null, new Date(2026, 9, 22, 9, 0))).toBe(1);
  });

  it('never reports a streak below 1', () => {
    const now = new Date(2026, 9, 22, 9, 0);
    expect(nextStreakDays(0, new Date(2026, 9, 22, 1, 0), now)).toBe(1);
  });

  it('counts calendar days, not 24 hour blocks', () => {
    const now = new Date(2026, 9, 22, 0, 30);
    // 23 hours earlier is still "yesterday" as far as the streak is concerned
    const lastActiveAt = new Date(now.getTime() - 23 * 3600000);
    expect(startOfLocalDay(lastActiveAt).getDate()).toBe(21);
    expect(nextStreakDays(2, lastActiveAt, now)).toBe(3);
  });
});

interface FakeProfile {
  xp: number;
  streakDays: number;
  lastActiveAt: Date | null;
}

/** A Prisma stand-in that records what the transaction would have written. */
function buildPrisma(profile: FakeProfile) {
  const events: Array<{ studentId: string; xp: number; reason: string }> = [];
  const calls = { transactions: 0 };

  const tx = {
    gamificationProfile: {
      createMany: async () => ({ count: 0 }),
      update: async ({ data }: { data: { xp?: number | { increment: number }; streakDays?: number; lastActiveAt?: Date } }) => {
        if (data.xp && typeof data.xp === 'object') profile.xp += data.xp.increment;
        if (typeof data.streakDays === 'number') profile.streakDays = data.streakDays;
        if (data.lastActiveAt) profile.lastActiveAt = data.lastActiveAt;
        return { studentId: 'student-1', ...profile };
      },
    },
    xpEvent: {
      create: async ({ data }: { data: { studentId: string; xp: number; reason: string } }) => {
        events.push(data);
        return data;
      },
    },
    $queryRaw: async () => [{ streakDays: profile.streakDays, lastActiveAt: profile.lastActiveAt }],
  };

  const prisma = {
    $transaction: async (cb: (t: typeof tx) => Promise<void>) => {
      calls.transactions++;
      return cb(tx);
    },
  };

  return { prisma: prisma as never, events, calls };
}

describe('awardStudentXp', () => {
  it('moves the lifetime counter and the ledger together in one transaction', async () => {
    const profile: FakeProfile = { xp: 100, streakDays: 3, lastActiveAt: daysAgo(1) };
    const { prisma, events, calls } = buildPrisma(profile);

    await awardStudentXp(prisma, 'student-1', 15, 'PRACTICE_COMPLETED');

    expect(calls.transactions).toBe(1);
    expect(profile.xp).toBe(115);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ studentId: 'student-1', xp: 15, reason: 'PRACTICE_COMPLETED' });
    // yesterday -> the streak extends
    expect(profile.streakDays).toBe(4);
  });

  it('records a 0 XP activity as activity, without a ledger row or a counter move', async () => {
    const profile: FakeProfile = { xp: 100, streakDays: 3, lastActiveAt: daysAgo(1) };
    const { prisma, events } = buildPrisma(profile);

    await awardStudentXp(prisma, 'student-1', 0, 'ASSESSMENT_COMPLETED');

    expect(profile.xp).toBe(100);
    expect(events).toHaveLength(0);
    // the streak still moved: a zero-score assessment is still an activity
    expect(profile.streakDays).toBe(4);
    expect(profile.lastActiveAt).not.toBeNull();
  });

  it('ignores a negative or broken XP amount', async () => {
    const profile: FakeProfile = { xp: 100, streakDays: 2, lastActiveAt: daysAgo(0) };
    const { prisma, events } = buildPrisma(profile);

    await awardStudentXp(prisma, 'student-1', -50, 'PRACTICE_COMPLETED');
    await awardStudentXp(prisma, 'student-1', Number.NaN, 'PRACTICE_COMPLETED');

    expect(profile.xp).toBe(100);
    expect(events).toHaveLength(0);
  });

  it('keeps the documented XP amounts', () => {
    expect(XP_PER_PRACTICE_CORRECT).toBe(5);
    expect(XP_PRACTICE_COMPLETION).toBe(10);
  });
});
