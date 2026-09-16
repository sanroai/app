import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orphaned = await prisma.student.findMany({ where: { userId: null } });
  console.log(`Found ${orphaned.length} Student rows with no account link`);

  let linked = 0;
  let skipped = 0;

  for (const student of orphaned) {
    const candidates = await prisma.user.findMany({
      where: {
        OR: [
          ...(student.email ? [{ email: student.email.toLowerCase() }] : []),
          ...(student.phone ? [{ phone: student.phone }] : []),
        ],
        memberships: {
          some: { institutionId: student.institutionId, role: 'STUDENT', status: 'ACTIVE' },
        },
      },
    });

    if (candidates.length !== 1) {
      console.log(`SKIP ${student.id} (${student.email ?? student.phone ?? 'no contact'}) -> ${candidates.length} match(es)`);
      skipped += 1;
      continue;
    }

    await prisma.student.update({ where: { id: student.id }, data: { userId: candidates[0].id } });
    console.log(`LINK ${student.id} -> user ${candidates[0].id} (${candidates[0].email ?? candidates[0].phone})`);
    linked += 1;
  }

  console.log(`Done. Linked ${linked}, skipped ${skipped}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());