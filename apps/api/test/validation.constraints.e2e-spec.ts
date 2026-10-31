import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  startTestApp,
  login,
  api,
  makePrisma,
  fetchFirstPlanKey,
  cleanupInstitution,
  QA_PASSWORD,
  randomSuffix,
} from './helpers';

describe('Validation Constraints (e2e) — documented contract', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let superAdminToken: string;
  let instId: string;
  let planKey: string;

  beforeAll(async () => {
    app = await startTestApp();
    prisma = makePrisma();
    planKey = await fetchFirstPlanKey(prisma);

    const adminLogin = await login(app, 'admin@sanroai.com', QA_PASSWORD);
    expect(adminLogin.status).toBe(200);
    superAdminToken = adminLogin.body.accessToken;

    const createRes = await api(app, 'post', '/admin/institutions', superAdminToken, {
      name: `QA Validation Academy ${randomSuffix()}`,
      type: 'SCHOOL',
      code: `V${randomSuffix()}`.slice(0, 20),
      adminName: 'QA Validation Admin',
      adminEmail: `validation${randomSuffix()}@qa.test`,
      adminPassword: QA_PASSWORD,
      planKey,
    });
    if (createRes.status !== 201) {
      throw new Error(`beforeAll create institution failed: ${createRes.status} ${JSON.stringify(createRes.body)}`);
    }
    instId = createRes.body.institution.id;
  });

  afterAll(async () => {
    if (instId) {
      const memberEmails = (
        await prisma.institutionMember.findMany({
          where: { institutionId: instId },
          include: { user: { select: { email: true } } },
        })
      ).map((m) => m.user.email);
      await cleanupInstitution(prisma, instId, memberEmails);
    }
    await prisma.$disconnect();
    await app.close();
  });

  describe('Auth layer constraints (live, green)', () => {
    it('login tolerates unknown fields (Zod strips extra keys)', async () => {
      // ZodValidationPipe runs a plain z.object().safeParse, which strips
      // unknown fields rather than rejecting them.
      const res = await api(app, 'post', '/auth/login', undefined, {
        email: 'admin@sanroai.com',
        password: QA_PASSWORD,
        bogusField: 1,
      });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeTruthy();
    });

    it('rejects login with invalid email shape', async () => {
      const res = await api(app, 'post', '/auth/login', undefined, {
        email: 'not-an-email',
        password: QA_PASSWORD,
      });
      expect(res.status).toBe(400);
    });

    it('rejects login missing the password', async () => {
      const res = await api(app, 'post', '/auth/login', undefined, { email: 'admin@sanroai.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('Strict schemas reject unknown keys (FINDING-H)', () => {
    it('POST /admin/curriculum/access rejects an unknown field with 400', async () => {
      // Most schemas are parsed with a plain z.object().safeParse, which STRIPS
      // unknown keys (see the login test above). A few endpoints opt into
      // z.object().strict(), which instead REJECTS an unknown key with 400. This
      // asserts that the strict path is honoured. Non-existent IDs are used so no
      // grant can be created even if validation were bypassed.
      const res = await api(app, 'post', '/admin/curriculum/access', superAdminToken, {
        institutionId: 'no-such-institution-for-strict-test',
        boardId: 'no-such-board-for-strict-test',
        bogusStrictField: 1,
      });
      expect(res.status).toBe(400);
      expect(res.body.code ?? res.body.message).toBeTruthy();
    });
  });

  describe('Super-admin mutation constraints (documented, landed)', () => {
    it('PATCH /status rejects an invalid status value with 400', async () => {
      const res = await api(app, 'patch', `/admin/institutions/${instId}/status`, superAdminToken, {
        status: 'NOT_A_REAL_STATUS',
      });
      expect(res.status).toBe(400);
      expect(res.body.code ?? res.body.message).toBeTruthy();
    });

    it('POST /admin/institutions rejects a payload missing name with 400', async () => {
      const res = await api(app, 'post', '/admin/institutions', superAdminToken, {
        type: 'SCHOOL',
        adminEmail: `noname${randomSuffix()}@qa.test`,
        adminPassword: QA_PASSWORD,
      });
      expect(res.status).toBe(400);
    });

    it('POST /subscription rejects an unknown planKey with 400', async () => {
      const res = await api(app, 'post', `/admin/institutions/${instId}/subscription`, superAdminToken, {
        planKey: 'NO_SUCH_PLAN',
        status: 'ACTIVE',
        seatLimit: 100,
      });
      expect(res.status).toBe(400);
    });

    it('PATCH /user-limit rejects seatLimit 0 with 400', async () => {
      const res = await api(app, 'patch', `/admin/institutions/${instId}/user-limit`, superAdminToken, {
        seatLimit: 0,
      });
      expect(res.status).toBe(400);
    });
  });
});