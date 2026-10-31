import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import {
  startTestApp,
  BASE,
  QA_PASSWORD,
  makePrisma,
  cleanupInstitution,
  createInstitution,
  fetchFirstPlanKey,
  randomSuffix,
} from './helpers';

/**
 * Regression: BUG-C (2026-10-19) — GET /diagnosis/students/:studentId had no
 * role check and scoped only by institution. Any STUDENT or PARENT could read
 * any peer's full diagnosis, including PII (email, phone, DOB, roll number).
 *
 * Expected policy:
 *   INSTITUTION_ADMIN / TEACHER -> any student in their own institution
 *   STUDENT                     -> their own record only
 *   PARENT                      -> explicitly linked children only
 *   SUPER_ADMIN                 -> rejected (no institution binding)
 */
describe('Diagnosis student scoping (e2e)', () => {
  let app: INestApplication;
  const prisma = makePrisma();
  const suffix = randomSuffix();
  const suffix2 = randomUUID().slice(0, 8);

  const studentAEmail = `qa-dx-a-${suffix2}@test.local`;
  const studentBEmail = `qa-dx-b-${suffix2}@test.local`;
  const parentEmail = `qa-dx-parent-${suffix2}@test.local`;

  let institutionId: string | undefined;
  let tokenIA: string;
  let tokenTeacher: string;
  let tokenStudentA: string;
  let tokenStudentB: string;
  let tokenParent: string;
  let tokenSuper: string;
  let studentAId = '';
  let studentBId = '';

  beforeAll(async () => {
    app = await startTestApp();

    const sa = await request(app.getHttpServer())
      .post(`${BASE}/auth/login`)
      .send({ email: 'admin@sanroai.com', password: QA_PASSWORD });
    tokenSuper = sa.body.accessToken;
    const planKey = await fetchFirstPlanKey(prisma);

    const created = await createInstitution(app, tokenSuper, {
      name: `QA Diagnosis ${suffix}`,
      code: `QDX${suffix}`.slice(0, 20),
      type: 'SCHOOL',
      adminName: 'QA Diagnosis Admin',
      adminEmail: `qa-dx-admin-${suffix2}@test.local`,
      adminPassword: QA_PASSWORD,
      planKey,
    });
    institutionId = created.body?.institution?.id ?? created.body?.id;
    if (!institutionId) {
      throw new Error(`Institution not created: ${created.status} ${JSON.stringify(created.body)}`);
    }

    // Two students + a parent linked ONLY to student A.
    studentAId = randomUUID();
    studentBId = randomUUID();
    await prisma.user.create({
      data: {
        id: randomUUID(),
        email: studentAEmail,
        name: 'QA Diagnosis Student A',
        passwordHash: '',
        isActive: true,
        isSuperAdmin: false,
        memberships: { create: { institutionId, role: 'STUDENT', status: 'ACTIVE' } },
        student: {
          create: { id: studentAId, institutionId, name: 'QA Diagnosis Student A', email: studentAEmail, status: 'ACTIVE' },
        },
      },
    });
    await prisma.user.create({
      data: {
        id: randomUUID(),
        email: studentBEmail,
        name: 'QA Diagnosis Student B',
        passwordHash: '',
        isActive: true,
        isSuperAdmin: false,
        memberships: { create: { institutionId, role: 'STUDENT', status: 'ACTIVE' } },
        student: {
          create: { id: studentBId, institutionId, name: 'QA Diagnosis Student B', email: studentBEmail, status: 'ACTIVE' },
        },
      },
    });

    const parentUserId = randomUUID();
    const parentId = randomUUID();
    await prisma.user.create({
      data: {
        id: parentUserId,
        email: parentEmail,
        name: 'QA Diagnosis Parent',
        passwordHash: '',
        isActive: true,
        isSuperAdmin: false,
        memberships: { create: { institutionId, role: 'PARENT', status: 'ACTIVE' } },
        parent: { create: { id: parentId, institutionId, name: 'QA Diagnosis Parent', email: parentEmail } },
      },
    });
    await prisma.parentStudentLink.create({ data: { parentId, studentId: studentAId } });

    // Set known passwords for every synthetic account.
    const { setUserPassword } = await import('./helpers');
    for (const e of [studentAEmail, studentBEmail, parentEmail]) {
      await setUserPassword(prisma, e, QA_PASSWORD);
    }

    // Institution admin + teacher accounts from the created institution.
    const iaMember = await prisma.institutionMember.findFirst({
      where: { institutionId, role: 'INSTITUTION_ADMIN' },
      include: { user: { select: { email: true } } },
    });
    if (iaMember) {
      const r = await request(app.getHttpServer())
        .post(`${BASE}/auth/login`)
        .send({ email: iaMember.user.email, password: QA_PASSWORD });
      tokenIA = r.body.accessToken;
    }
    // Reuse the seeded demo teacher only for a "staff from another tenant" check.
    const teacherLogin = await request(app.getHttpServer())
      .post(`${BASE}/auth/login`)
      .send({ email: 'teacher@sanroai.com', password: QA_PASSWORD });
    tokenTeacher = teacherLogin.body.accessToken;

    for (const [tok, email] of [
      [studentAEmail, studentAEmail],
      [studentBEmail, studentBEmail],
      [parentEmail, parentEmail],
    ] as const) {
      const r = await request(app.getHttpServer())
        .post(`${BASE}/auth/login`)
        .send({ email, password: QA_PASSWORD });
      if (tok === studentAEmail) tokenStudentA = r.body.accessToken;
      else if (tok === studentBEmail) tokenStudentB = r.body.accessToken;
      else tokenParent = r.body.accessToken;
    }
  });

  afterAll(async () => {
    await prisma.parentStudentLink.deleteMany({ where: { studentId: studentAId } });
    await prisma.user.deleteMany({
      where: { email: { in: [studentAEmail, studentBEmail, parentEmail] } },
    });
    await cleanupInstitution(prisma, institutionId, [
      `qa-dx-admin-${suffix2}@test.local`,
    ]);
    await prisma.$disconnect();
    await app.close();
  });

  function get(path: string, token: string) {
    return request(app.getHttpServer()).get(`${BASE}${path}`).set('Authorization', `Bearer ${token}`);
  }

  it('fixture: both students exist in the institution', async () => {
    const rows = await prisma.student.count({ where: { id: { in: [studentAId, studentBId] } } });
    expect(rows).toBe(2);
  });

  it('FIXED: a student may read their OWN diagnosis', async () => {
    const res = await get(`/diagnosis/students/${studentAId}`, tokenStudentA);
    expect(res.status).toBe(200);
  });

  it('FIXED: a student is denied a CLASSMATE diagnosis (was 200 + PII)', async () => {
    const res = await get(`/diagnosis/students/${studentBId}`, tokenStudentA);
    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).not.toContain(studentBEmail);
  });

  it('FIXED: a parent may read a LINKED child diagnosis', async () => {
    const res = await get(`/diagnosis/students/${studentAId}`, tokenParent);
    expect(res.status).toBe(200);
  });

  it('FIXED: a parent is denied an UNLINKED student (was 200 + PII)', async () => {
    const res = await get(`/diagnosis/students/${studentBId}`, tokenParent);
    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).not.toContain(studentBEmail);
  });

  it('institution admin may read any student in their own institution', async () => {
    if (!tokenIA) return;
    const res = await get(`/diagnosis/students/${studentBId}`, tokenIA);
    expect(res.status).toBe(200);
  });

  it('super admin is rejected (no institution binding)', async () => {
    const res = await get(`/diagnosis/students/${studentAId}`, tokenSuper);
    expect(res.status).toBe(403);
  });

  it('unknown student id still 404s for staff (no enumeration change)', async () => {
    const res = await get(`/diagnosis/students/${randomUUID()}`, tokenIA);
    expect(res.status).toBe(404);
  });

  it('cross-tenant staff cannot read another tenant student (404 concealment)', async () => {
    // tokenTeacher belongs to the seeded demo tenant, not `institutionId`.
    const res = await get(`/diagnosis/students/${studentAId}`, tokenTeacher);
    expect([403, 404]).toContain(res.status);
    expect(JSON.stringify(res.body)).not.toContain(studentAEmail);
  });
});
