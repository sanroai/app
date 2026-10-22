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
  setUserPassword,
} from './helpers';

/**
 * Regression: BUG-D (2026-10-19) — GET /assessments/attempts/:attemptId scoped
 * its Prisma where-clause with `OR student.institutionId = <caller's tenant>`.
 * Because a STUDENT is themselves institution-bound, that clause matched ANY
 * peer in the same tenant, so any classmate could read another student's
 * attempt detail — including student name, roll number and score — without any
 * staff role check.
 *
 * Expected policy:
 *   INSTITUTION_ADMIN / TEACHER / SUPER_ADMIN -> any attempt in their tenant
 *   STUDENT (and any non-staff role)          -> only attempts they own
 */
describe('Assessment attempt read scoping (e2e)', () => {
  let app: INestApplication;
  const prisma = makePrisma();
  const suffix = randomSuffix();
  const tag = randomUUID().slice(0, 8);

  const ownerEmail = `qa-att-owner-${tag}@test.local`;
  const peerEmail = `qa-att-peer-${tag}@test.local`;

  let institutionId: string | undefined;
  let tokenOwner: string;
  let tokenPeer: string;
  let tokenIA: string;
  let attemptId = '';

  const ownerId = randomUUID();
  const peerId = randomUUID();

  beforeAll(async () => {
    app = await startTestApp();

    const sa = await request(app.getHttpServer())
      .post(`${BASE}/auth/login`)
      .send({ email: 'admin@sanroai.com', password: QA_PASSWORD });
    const planKey = await fetchFirstPlanKey(prisma);

    const created = await createInstitution(app, sa.body.accessToken, {
      name: `QA Attempts ${suffix}`,
      code: `QAT${suffix}`.slice(0, 20),
      type: 'SCHOOL',
      adminName: 'QA Attempts Admin',
      adminEmail: `qa-att-admin-${tag}@test.local`,
      adminPassword: QA_PASSWORD,
      planKey,
    });
    institutionId = created.body?.institution?.id ?? created.body?.id;
    if (!institutionId) {
      throw new Error(`Institution not created: ${created.status} ${JSON.stringify(created.body)}`);
    }

    // Two students in the SAME tenant; only `owner` has an attempt.
    for (const [uid, sid, email, name] of [
      [randomUUID(), ownerId, ownerEmail, 'QA Attempt Owner'],
      [randomUUID(), peerId, peerEmail, 'QA Attempt Peer'],
    ] as const) {
      await prisma.user.create({
        data: {
          id: uid,
          email,
          name,
          passwordHash: '',
          isActive: true,
          isSuperAdmin: false,
          memberships: { create: { institutionId, role: 'STUDENT', status: 'ACTIVE' } },
          student: { create: { id: sid, institutionId, name, email, status: 'ACTIVE' } },
        },
      });
      await setUserPassword(prisma, email, QA_PASSWORD);
    }

    // A fresh tenant has no assessments, so create the minimal one an attempt
    // can hang off. `createdById` is a required FK on the institution admin.
    const adminUser = await prisma.institutionMember.findFirst({
      where: { institutionId, role: 'INSTITUTION_ADMIN' },
      select: { userId: true },
    });
    if (!adminUser) throw new Error('no institution admin to own the assessment');
    const assessmentId = randomUUID();
    await prisma.assessment.create({
      data: {
        id: assessmentId,
        institutionId,
        title: 'QA Attempt Fixture',
        totalMarks: 20,
        durationMinutes: 30,
        status: 'PUBLISHED',
        createdById: adminUser.userId,
      },
    });

    attemptId = randomUUID();
    await prisma.assessmentAttempt.create({
      data: {
        id: attemptId,
        assessmentId,
        studentId: ownerId,
        status: 'SUBMITTED',
        score: 14,
        maxScore: 20,
        correctCount: 7,
        wrongCount: 3,
        submittedAt: new Date(),
      },
    });

    const login = async (email: string) => {
      const r = await request(app.getHttpServer())
        .post(`${BASE}/auth/login`)
        .send({ email, password: QA_PASSWORD });
      return r.body.accessToken as string;
    };
    tokenOwner = await login(ownerEmail);
    tokenPeer = await login(peerEmail);

    const iaMember = await prisma.institutionMember.findFirst({
      where: { institutionId, role: 'INSTITUTION_ADMIN' },
      include: { user: { select: { email: true } } },
    });
    if (iaMember) tokenIA = await login(iaMember.user.email);
  });

  afterAll(async () => {
    if (attemptId) {
      await prisma.assessmentAttempt.deleteMany({ where: { id: attemptId } });
      await prisma.assessment.deleteMany({ where: { title: 'QA Attempt Fixture' } });
    }
    await prisma.user.deleteMany({ where: { email: { in: [ownerEmail, peerEmail] } } });
    await cleanupInstitution(prisma, institutionId, [`qa-att-admin-${tag}@test.local`]);
    await prisma.$disconnect();
    await app.close();
  });

  function get(path: string, token: string) {
    return request(app.getHttpServer()).get(`${BASE}${path}`).set('Authorization', `Bearer ${token}`);
  }

  it('fixture: the attempt exists with a real score', async () => {
    const row = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
    expect(row?.score).toBe(14);
  });

  it('owner may read their own attempt', async () => {
    const res = await get(`/assessments/attempts/${attemptId}`, tokenOwner);
    expect(res.status).toBe(200);
  });

  it('FIXED: a classmate may NOT read a peer attempt (was 200 + name/roll/score)', async () => {
    const res = await get(`/assessments/attempts/${attemptId}`, tokenPeer);
    expect(res.status).toBe(404);
    const s = JSON.stringify(res.body);
    expect(s).not.toContain('QA Attempt Owner');
    expect(s).not.toContain('14');
  });

  it('institution admin may still read any attempt in their tenant', async () => {
    if (!tokenIA) return;
    const res = await get(`/assessments/attempts/${attemptId}`, tokenIA);
    expect(res.status).toBe(200);
  });

  it('an unknown attempt id 404s for the owner', async () => {
    const res = await get(`/assessments/attempts/${randomUUID()}`, tokenOwner);
    expect(res.status).toBe(404);
  });
});
