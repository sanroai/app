import { Prisma, PrismaClient } from '@prisma/client';

/** XP for each correct answer in a practice session. */
export const XP_PER_PRACTICE_CORRECT = 5;
/** XP for finishing a practice session, on top of the per-correct answers. */
export const XP_PRACTICE_COMPLETION = 10;

/** The start of the local calendar day - a streak is counted in calendar days. */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * The streak rule: the same calendar day keeps the streak, yesterday extends
 * it, an older day restarts it at 1.
 *
 * (Comparing "yesterday" to "today" naively reset the streak to 1 whenever a
 * student did a second activity on the same day.)
 */
export function nextStreakDays(streakDays: number, lastActiveAt: Date | null, now: Date): number {
  if (!lastActiveAt) return 1;
  const startOfToday = startOfLocalDay(now);
  const startOfLast = startOfLocalDay(new Date(lastActiveAt));
  const daysSinceLast = Math.round((startOfToday.getTime() - startOfLast.getTime()) / 86400000);
  if (daysSinceLast === 0) return Math.max(streakDays, 1);
  if (daysSinceLast === 1) return streakDays + 1;
  return 1;
}

/**
 * Award XP to a student and keep the daily streak correct.
 *
 * The XP ledger (`XpEvent`) is the single source of truth for the leaderboard, so
 * every award is written there and the lifetime counter is kept in step.
 *
 * Both writes happen in ONE transaction, so the counter and the ledger can never
 * disagree (a failed ledger write used to leave the lifetime counter moved while
 * the leaderboard - which reads the ledger - had not).  The profile row is locked
 * (`SELECT ... FOR UPDATE`) for the transaction, because the streak is a
 * read-modify-write: without the lock two concurrent awards would both read the
 * same value and write the same streak back (under-counting it).
 *
 * An activity with 0 XP still counts as activity: it updates `lastActiveAt` and
 * the streak, it just does not write a ledger row (a 0 XP row would change
 * nothing) and it does not move the lifetime counter.
 */
export async function awardStudentXp(
  prisma: PrismaClient,
  studentId: string,
  xp: number,
  reason: string,
): Promise<void> {
  const amount = Number.isFinite(xp) ? Math.max(0, Math.trunc(xp)) : 0;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // The profile has to exist before its row can be locked.  `createMany` with
    // `skipDuplicates` is an `INSERT ... ON CONFLICT DO NOTHING`, so two
    // concurrent awards for the same student cannot trip over each other.
    await tx.gamificationProfile.createMany({
      data: [{ studentId, xp: 0, streakDays: 1, lastActiveAt: now }],
      skipDuplicates: true,
    });

    // Lock the profile row for the rest of the transaction: the streak is a
    // read-modify-write, so without the lock two concurrent awards would both
    // read the same value and write the same streak back (under-counting it).
    const rows = await tx.$queryRaw<Array<{ streakDays: number; lastActiveAt: Date | null }>>`
      SELECT "streakDays", "lastActiveAt"
      FROM "GamificationProfile"
      WHERE "studentId" = ${studentId}::uuid
      FOR UPDATE
    `;
    const current = rows[0] ?? null;
    const streakDays = nextStreakDays(current?.streakDays ?? 0, current?.lastActiveAt ?? null, now);

    const data: Prisma.GamificationProfileUpdateInput = { streakDays, lastActiveAt: now };
    if (amount > 0) data.xp = { increment: amount };
    await tx.gamificationProfile.update({ where: { studentId }, data });

    if (amount > 0) {
      await tx.xpEvent.create({ data: { studentId, xp: amount, reason } });
    }
  });
}
