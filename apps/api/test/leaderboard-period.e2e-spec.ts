import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { startTestApp, login, api, makePrisma, QA_PASSWORD } from './helpers';

/**
 * Contract: the leaderboard period filter (Weekly / Monthly / All time) is real.
 * Weekly and monthly XP come from the XP ledger (XpEvent), all-time from the
 * lifetime counter on GamificationProfile. Before the ledger existed the API
 * accepted `period` and ignored it, so every period returned identical rows.
 *
 * The assertions always look the student up BY ID: the leaderboard is sorted by
 * XP, so `entries[0]` is whichever student happens to be on top - measuring
 * that one measures the wrong person as soon as somebody else outranks them.
 *
 * The fixture students live in the demo institution but are only touched by this
 * suite, so a parallel suite cannot move their numbers.
 */
describe('Leaderboard period filtering (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let studentToken: string;
  let studentUserId = '';
  let institutionId = '';
  let academicYearId = '';

  /** The student whose numbers the assertions are about. */
  const ledgerUserId = randomUUID();
  const ledgerStudentId = randomUUID();
  /** A profile that predates the ledger: a counter but no ledger rows. */
  const preLedgerUserId = randomUUID();
  const preLedgerStudentId = randomUUID();

  const eventIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdStudentIds: string[] = [];
  const createdGroupIds: string[] = [];

  /** Monday 00:00 local - the same rule the API uses for "This Week". */
  const weekStart = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    return start;
  };

  const fromWeekStart = (days: number) => new Date(weekStart().getTime() + days * 86400000);
  const monthStart = () => new Date(Date.now() - 30 * 86400000);

  /** The sum the ledger holds for a student inside a window. */
  const ledgerSum = async (student: string, from: Date) => {
    const rows = await prisma.xpEvent.findMany({
      where: { studentId: student, createdAt: { gte: from } },
      select: { xp: true },
    });
    return rows.reduce((a, e) => a + e.xp, 0);
  };

  beforeAll(async () => {
    app = await startTestApp();
    prisma = makePrisma();

    const student = await login(app, 'student@sanroai.com', QA_PASSWORD);
    expect(student.status).toBe(200);
    studentToken = student.body.accessToken;

    const user = await prisma.user.findUnique({ where: { email: 'student@sanroai.com' } });
    studentUserId = user!.id;
    const record = await prisma.student.findFirst({ where: { userId: user!.id } });
    institutionId = record!.institutionId!;
    academicYearId = record!.academicYearId!;

    // A student of the demo institution with a known ledger.  Every XP event is
    // written through the API-equivalent pair (ledger row + lifetime counter),
    // so the counter and the ledger agree.
    const fixtures = [
      { userId: ledgerUserId, studentId: ledgerStudentId, email: `ledger-${ledgerUserId}@qa.test`, xp: 7950 },
      { userId: preLedgerUserId, studentId: preLedgerStudentId, email: `preledger-${preLedgerUserId}@qa.test`, xp: 999 },
    ];
    for (const f of fixtures) {
      await prisma.user.create({
        data: {
          id: f.userId,
          email: f.email,
          name: 'QA Leaderboard Student',
          passwordHash: '',
          isActive: true,
          isSuperAdmin: false,
          memberships: { create: { institutionId, role: 'STUDENT', status: 'ACTIVE' } },
          student: {
            create: {
              id: f.studentId,
              institutionId,
              academicYearId,
              name: 'QA Leaderboard Student',
              email: f.email,
              grade: '10',
              status: 'ACTIVE',
            },
          },
        },
      });
      await prisma.gamificationProfile.create({
        data: { studentId: f.studentId, xp: f.xp, streakDays: 2 },
      });
      createdUserIds.push(f.userId);
      createdStudentIds.push(f.studentId);
    }

    // 1 hour into the current week -> inside weekly and monthly
    // 10 days before the week  -> inside monthly, outside weekly
    // 60 days before the week  -> all-time only
    for (const [xp, at] of [[50, fromWeekStart(0.04)], [900, fromWeekStart(-10)], [7000, fromWeekStart(-60)]] as const) {
      const event = await prisma.xpEvent.create({
        data: { studentId: ledgerStudentId, xp, reason: 'TEST_PERIOD', createdAt: at },
      });
      eventIds.push(event.id);
    }

    // A class the student is NOT a member of: requesting it must be refused.
    const other = await prisma.group.create({
      data: {
        institutionId,
        academicYearId,
        name: `Class 10 - QA ${randomUUID().slice(0, 8)}`,
        type: 'CLASS',
        grade: '10',
        status: 'ACTIVE',
      },
    });
    createdGroupIds.push(other.id);
  });

  afterAll(async () => {
    if (eventIds.length) {
      await prisma.xpEvent.deleteMany({ where: { id: { in: eventIds } } });
    }
    if (createdGroupIds.length) {
      await prisma.group.deleteMany({ where: { id: { in: createdGroupIds } } });
    }
    if (createdStudentIds.length) {
      await prisma.student.deleteMany({ where: { id: { in: createdStudentIds } } });
    }
    if (createdUserIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await prisma.$disconnect();
    await app.close();
  });

  it('requires authentication', async () => {
    const res = await api(app, 'get', '/learning/gamification/leaderboard?period=weekly', '');
    expect(res.status).toBe(401);
  });

  const leaderboard = async (period: string, groupId?: string) => {
    const query = groupId ? `?period=${period}&groupId=${groupId}` : `?period=${period}`;
    const res = await api(app, 'get', `/learning/gamification/leaderboard${query}`, studentToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.entries)).toBe(true);
    return res.body as {
      entries: Array<{ userId: string; xp: number; totalXp: number; rank: number }>;
      myRank: number;
      period: string;
      groupId: string | null;
      groups: Array<{ id: string; name: string; grade: string | null }>;
    };
  };

  /** The entry of ONE student - never `entries[0]`. */
  const entryOf = (body: { entries: Array<{ userId: string }> }, userId: string) =>
    body.entries.find((e) => e.userId === userId);

  it('excludes XP older than the window and keeps the lifetime total', async () => {
    const weekly = await leaderboard('weekly');
    const monthly = await leaderboard('monthly');
    const all = await leaderboard('all');

    const w = entryOf(weekly, ledgerUserId);
    const m = entryOf(monthly, ledgerUserId);
    const a = entryOf(all, ledgerUserId);
    expect(w).toBeTruthy();
    expect(m).toBeTruthy();
    expect(a).toBeTruthy();

    // the window is the ledger, filtered by date
    expect(w!.xp).toBe(await ledgerSum(ledgerStudentId, weekStart()));
    expect(m!.xp).toBe(await ledgerSum(ledgerStudentId, monthStart()));
    // the 20-day-old event is in monthly but not weekly
    expect(m!.xp - w!.xp).toBe(900);
    // the 90-day-old event is only in all-time
    expect(a!.xp - m!.xp).toBe(7000);
    // the lifetime counter never changes with the period
    expect(w!.totalXp).toBe(m!.totalXp);
    expect(m!.totalXp).toBe(a!.totalXp);
    expect(a!.totalXp).toBe(7950);
  });

  it('counts only XP earned since Monday for "This Week"', async () => {
    const weekly = await leaderboard('weekly');
    const expected = await ledgerSum(ledgerStudentId, weekStart());
    const mine = entryOf(weekly, ledgerUserId);
    expect(mine?.xp).toBe(expected);
  });

  it('a profile without ledger rows contributes 0 to a window but keeps its lifetime', async () => {
    const weekly = await leaderboard('weekly');
    const monthly = await leaderboard('monthly');
    const all = await leaderboard('all');

    const w = entryOf(weekly, preLedgerUserId);
    const m = entryOf(monthly, preLedgerUserId);
    const a = entryOf(all, preLedgerUserId);
    expect(w).toBeTruthy();
    expect(m).toBeTruthy();
    expect(a).toBeTruthy();

    // "This Week" is not "All time": a profile that predates the ledger has no
    // XP in the window, so it must not show its lifetime there.
    expect(w!.xp).toBe(0);
    expect(m!.xp).toBe(0);
    // the lifetime is still the real lifetime
    expect(a!.xp).toBe(999);
    expect(w!.totalXp).toBe(999);
    expect(a!.totalXp).toBe(999);
  });

  it('ranks entries by the XP of the selected period', async () => {
    for (const period of ['weekly', 'monthly', 'all']) {
      const entries = (await leaderboard(period)).entries;
      for (let i = 1; i < entries.length; i++) {
        expect(entries[i - 1].xp).toBeGreaterThanOrEqual(entries[i].xp);
        expect(entries[i].rank).toBe(i + 1);
      }
    }
  });

  it('accepts the mobile client period names', async () => {
    const allTime = await leaderboard('allTime');
    const all = await leaderboard('all');
    // only the fixture student: another student's XP can move between the two
    // requests (a parallel suite awards XP to the demo student)
    expect(entryOf(allTime, ledgerUserId)?.xp).toBe(entryOf(all, ledgerUserId)?.xp);
  });

  describe('class scope (groupId)', () => {
    it('returns the permitted scopes in "groups"', async () => {
      const body = await leaderboard('weekly');
      const memberships = await prisma.groupMembership.findMany({
        where: { student: { userId: studentUserId }, leftAt: null },
        select: { groupId: true },
      });
      const permitted = memberships.map((m) => m.groupId).sort();
      expect(body.groups.map((g) => g.id).sort()).toEqual(permitted);
    });

    it('lets a student read the leaderboard of their own class', async () => {
      const membership = await prisma.groupMembership.findFirst({
        where: { student: { userId: studentUserId }, leftAt: null },
        select: { groupId: true },
      });
      expect(membership).toBeTruthy();

      const body = await leaderboard('weekly', membership!.groupId);
      expect(body.groupId).toBe(membership!.groupId);
      // only the students of that class are ranked
      const members = await prisma.groupMembership.findMany({
        where: { groupId: membership!.groupId, leftAt: null },
        select: { student: { select: { userId: true } } },
      });
      const memberUserIds = members.map((m) => m.student.userId);
      expect(body.entries.length).toBeGreaterThan(0);
      for (const entry of body.entries) {
        expect(memberUserIds).toContain(entry.userId);
      }
    });

    it('refuses a class the student may not see', async () => {
      const other = createdGroupIds[0];
      expect(other).toBeTruthy();
      const res = await api(
        app,
        'get',
        `/learning/gamification/leaderboard?period=weekly&groupId=${other}`,
        studentToken,
      );
      expect(res.status).toBe(403);
    });
  });
});
