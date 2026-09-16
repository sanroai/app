import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const email = `orphan-e2e-${Date.now()}@sanroai.com`;

async function main() {
  const inst = await prisma.institution.findFirst({ select: { id: true } });
  if (!inst) throw new Error('No institution found');
  const acYear = await prisma.academicYear.findFirst({ select: { id: true } });
  if (!acYear) throw new Error('No academic year found');

  await prisma.student.deleteMany({ where: { email: { startsWith: 'orphan-e2e-' } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: 'orphan-e2e-' } } });

  const user = await prisma.user.create({
    data: {
      email,
      name: 'Orphan E2E',
      passwordHash: await bcrypt.hash('Sanro@123', 10),
      memberships: { create: { institutionId: inst.id, role: 'STUDENT', status: 'ACTIVE' } },
    },
  });

  const orphan = await prisma.student.create({
    data: {
      institution: { connect: { id: inst.id } },
      academicYear: { connect: { id: acYear.id } },
      name: 'Orphan E2E',
      email,
      gender: 'OTHER',
    },
  });
  console.log(`Created account ${user.id} + orphan student ${orphan.id}`);

  const login = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Sanro@123' }),
  });
  const body: any = await login.json();
  if (login.status !== 201 && login.status !== 200) {
    throw new Error(`Login failed (${login.status}): ${JSON.stringify(body)}`);
  }

  const res = await fetch('http://localhost:4000/api/v1/remediation/my', {
    headers: { Authorization: `Bearer ${body.accessToken}` },
  });
  const txt = await res.text();
  console.log(`remediation/my -> ${res.status} ${txt.slice(0, 120)}`);

  const linked = await prisma.student.findUnique({ where: { id: orphan.id } });
  const linkOk = linked?.userId === user.id;
  console.log(`Student row linked to account: ${linkOk ? 'YES' : 'NO'}`);

  if (res.status === 200 && linkOk) {
    console.log('E2E PASS');
  } else {
    console.log('E2E FAIL');
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());