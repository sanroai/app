// Adds dated XP ledger entries for the demo learners so the leaderboard's Weekly /
// Monthly / All-time views actually differ (synthetic demo data in the local dev DB).
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const daysAgo = (d) => new Date(Date.now() - d * 86400000);

try {
  const students = await prisma.student.findMany({
    where: { name: { in: ['Priya Sharma', 'Rohan Verma'] } },
    select: { id: true, name: true },
  });
  const plan = [
    { name: 'Priya Sharma', xp: 900, days: 40 },
    { name: 'Rohan Verma', xp: 300, days: 3 },
  ];
  for (const p of plan) {
    const s = students.find((x) => x.name === p.name);
    if (!s) { console.log(`  (no student named ${p.name})`); continue; }
    await prisma.xpEvent.deleteMany({ where: { studentId: s.id, reason: 'DEMO_PERIOD' } });
    await prisma.xpEvent.create({
      data: { studentId: s.id, xp: p.xp, reason: 'DEMO_PERIOD', createdAt: daysAgo(p.days) },
    });
    // keep the lifetime counter consistent with the ledger
    const lifetime = await prisma.xpEvent.aggregate({ where: { studentId: s.id }, _sum: { xp: true } });
    // the profile has to exist, otherwise the student never reaches the leaderboard
    await prisma.gamificationProfile.upsert({
      where: { studentId: s.id },
      create: { studentId: s.id, xp: lifetime._sum.xp ?? 0, streakDays: 1, lastActiveAt: new Date() },
      update: { xp: lifetime._sum.xp ?? 0 },
    });
    console.log(`  ${p.name}: +${p.xp} XP ${p.days} days ago (lifetime now ${lifetime._sum.xp ?? 0})`);
  }
  const all = await prisma.xpEvent.groupBy({ by: ['studentId'], _sum: { xp: true } });
  console.log(`  ledger rows by student: ${all.length}`);
} finally {
  await prisma.$disconnect();
}
