// Removes the demo assessment row whose title was double-encoded (it showed as
// garbage on the student dashboard). The clean row is renamed by the seed.
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');

process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${process.argv[2] ?? 'sanro_dev'}`;
const prisma = new PrismaClient();

try {
  const all = await prisma.assessment.findMany({
    where: { totalMarks: 20 },
    select: { id: true, title: true },
  });
  console.log('  assessments with 20 marks:');
  for (const a of all) console.log(`    ${a.id}  ${JSON.stringify(a.title)}`);

  const broken = all.filter((a) => /[ÃÂ]/.test(a.title));
  // the demo assessment was renamed with its chapter, so the row that still
  // carries the old chapter name is a duplicate of the renamed one
  const stale = all.filter((a) => /Matter in Our Surroundings/.test(a.title));
  const doomed = [...new Map([...broken, ...stale].map((a) => [a.id, a])).values()];
  if (!doomed.length) {
    console.log('  nothing to clean');
  } else {
    for (const a of doomed) {
      const attempts = await prisma.assessmentAttempt.count({ where: { assessmentId: a.id } });
      await prisma.assessment.delete({ where: { id: a.id } });
      console.log(`  removed the stale row ${a.id} "${a.title}" (${attempts} attempt(s) cascaded)`);
    }
  }
  const after = await prisma.assessment.findMany({
    where: { totalMarks: 20 },
    select: { title: true },
  });
  console.log('  after: ' + after.map((a) => JSON.stringify(a.title)).join(', '));
} finally {
  await prisma.$disconnect();
}
