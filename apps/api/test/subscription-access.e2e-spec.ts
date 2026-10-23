import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SubscriptionAccessService } from '../src/common/security/subscription-access.service';
import {
  startTestApp,
  login,
  api,
  makePrisma,
  setUserPassword,
  fetchFirstPlanKey,
  cleanupInstitution,
  QA_PASSWORD,
  randomSuffix,
} from './helpers';

const DAY = 86400000;

describe('Subscription & Access Control Across Modules (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let subAccess: SubscriptionAccessService;
  let superAdminToken: string;

  let instId: string;
  let adminEmail: string;
  let adminToken: string;
  let studentEmail: string;
  let studentToken: string;
  let yearId: string;
  let planKey: string;

  const emailsToCleanup: string[] = [];

  const setInstitutionStatus = (status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED' | 'EXPIRED') =>
    prisma.institution.update({ where: { id: instId }, data: { status } });

  beforeAll(async () => {
    app = await startTestApp();
    prisma = makePrisma();
    subAccess = app.get(SubscriptionAccessService);
    planKey = await fetchFirstPlanKey(prisma);

    const adminLogin = await login(app, 'admin@sanroai.com', QA_PASSWORD);
    expect(adminLogin.status).toBe(200);
    superAdminToken = adminLogin.body.accessToken;

    adminEmail = `access${randomSuffix()}@qa.test`;
    const createRes = await api(app, 'post', '/admin/institutions', superAdminToken, {
      name: `QA Access Academy ${randomSuffix()}`,
      type: 'SCHOOL',
      code: `A${randomSuffix()}`.slice(0, 20),
      adminName: 'QA Access Admin',
      adminEmail,
      adminPassword: QA_PASSWORD,
      planKey,
    });
    if (createRes.status !== 201) {
      throw new Error(`beforeAll create institution failed: ${createRes.status} ${JSON.stringify(createRes.body)}`);
    }
    instId = createRes.body.institution.id;
    emailsToCleanup.push(adminEmail);
    await setUserPassword(prisma, adminEmail, QA_PASSWORD);

    const subRes = await api(app, 'post', `/admin/institutions/${instId}/subscription`, superAdminToken, {
      planKey,
      status: 'ACTIVE',
      seatLimit: 5,
      reason: 'QA setup',
    });
    if (subRes.status >= 400) {
      throw new Error(`beforeAll subscription failed: ${subRes.status} ${JSON.stringify(subRes.body)}`);
    }
    subAccess.invalidate(instId);

    const adminLoginRes = await login(app, adminEmail, QA_PASSWORD);
    if (adminLoginRes.status !== 200) {
      throw new Error(`beforeAll admin login failed: ${adminLoginRes.status} ${JSON.stringify(adminLoginRes.body)}`);
    }
    adminToken = adminLoginRes.body.accessToken;

    const yearRes = await api(app, 'post', '/academics/academic-years', adminToken, {
      name: `QA-${randomSuffix()}`,
      startDate: '2026-04-01',
      endDate: '2027-03-31',
    });
    yearId = yearRes.body.id;
    if (yearRes.status >= 400) throw new Error('beforeAll academic year failed');

    studentEmail = `student${randomSuffix()}@qa.test`;
    const studentRes = await api(app, 'post', '/students', adminToken, {
      academicYearId: yearId,
      name: `QA Access Student ${randomSuffix()}`,
      email: studentEmail,
      grade: '9',
    });
    if (studentRes.status >= 400) {
      throw new Error(`beforeAll student create failed: ${studentRes.status} ${JSON.stringify(studentRes.body)}`);
    }
    emailsToCleanup.push(studentEmail);
    await setUserPassword(prisma, studentEmail, QA_PASSWORD);
    const studentLoginRes = await login(app, studentEmail, QA_PASSWORD);
    if (studentLoginRes.status !== 200) {
      throw new Error(`beforeAll student login failed: ${studentLoginRes.status} ${JSON.stringify(studentLoginRes.body)}`);
    }
    studentToken = studentLoginRes.body.accessToken;
  });

  afterAll(async () => {
    await cleanupInstitution(prisma, instId, emailsToCleanup);
    await prisma.$disconnect();
    await app.close();
  });

  it('student can access /learning/home under an ACTIVE subscription', async () => {
    const res = await api(app, 'get', '/learning/home', studentToken);
    expect(res.status).toBe(200);
    expect(res.body.state).toBeUndefined();
  });

  it('lazy expiry flips an ended ACTIVE subscription and blocks the student', async () => {
    await prisma.subscription.updateMany({
      where: { institutionId: instId, status: 'ACTIVE' },
      data: { status: 'ACTIVE', endsAt: new Date(Date.now() - DAY) },
    });
    subAccess.invalidate(instId);

    const res = await api(app, 'get', '/learning/home', studentToken);
    expect([200, 403]).toContain(res.status);
    if (res.status !== 200) expect(res.body.code).toBe('SUBSCRIPTION_EXPIRED');

    const expiredSub = await prisma.subscription.findFirst({ where: { institutionId: instId, status: 'EXPIRED' } });
    expect(expiredSub).toBeTruthy();
    const inst = await prisma.institution.findUnique({ where: { id: instId } });
    expect(inst?.status).toBe('EXPIRED');

    subAccess.invalidate(instId);
    const loginRes = await login(app, studentEmail, QA_PASSWORD);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.state).toBe('SUBSCRIPTION_EXPIRED');
    expect(loginRes.body.accessToken).toBeUndefined();
    expect(loginRes.body.institution?.status).toBe('EXPIRED');
  });

  it('renewed subscription restores access', async () => {
    await setInstitutionStatus('ACTIVE');
    const subRes = await api(app, 'post', `/admin/institutions/${instId}/subscription`, superAdminToken, {
      planKey,
      status: 'ACTIVE',
      seatLimit: 5,
    });
    expect([200, 201]).toContain(subRes.status);
    subAccess.invalidate(instId);

    const loginRes = await login(app, studentEmail, QA_PASSWORD);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeTruthy();
    const homeRes = await api(app, 'get', '/learning/home', loginRes.body.accessToken);
    expect(homeRes.status).toBe(200);
    studentToken = loginRes.body.accessToken;
  });

  it('suspended institution blocks login and existing tokens', async () => {
    await setInstitutionStatus('SUSPENDED');
    subAccess.invalidate(instId);

    const loginRes = await login(app, studentEmail, QA_PASSWORD);
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.state).toBe('INSTITUTION_SUSPENDED');
    expect(loginRes.body.accessToken).toBeUndefined();

    const guarded = await api(app, 'get', '/learning/home', studentToken);
    expect(guarded.status).toBe(403);
    expect(guarded.body.code).toBe('INSTITUTION_SUSPENDED');

    await setInstitutionStatus('ACTIVE');
    subAccess.invalidate(instId);
  });

  it('archived institution blocks login and existing tokens', async () => {
    // Institution Archived -> blocked INSTITUTION_ARCHIVED once the entitlement
    // engine rides on the same pathway as suspension.
    await prisma.institution.update({ where: { id: instId }, data: { status: 'ARCHIVED', archivedAt: new Date() } });
    subAccess.invalidate(instId);

    const loginRes = await login(app, studentEmail, QA_PASSWORD);
    expect([200, 401]).toContain(loginRes.status);
    if (loginRes.status === 200) {
      expect(['INSTITUTION_ARCHIVED', 'INSTITUTION_SUSPENDED']).toContain(loginRes.body.state);
      expect(loginRes.body.accessToken).toBeUndefined();
    }

    const guarded = await api(app, 'get', '/learning/home', studentToken);
    expect(guarded.status).toBe(403);
    expect(guarded.body.code).toBe('INSTITUTION_ARCHIVED');

    await setInstitutionStatus('ACTIVE');
    await prisma.institution.update({ where: { id: instId }, data: { archivedAt: null } });
    subAccess.invalidate(instId);
    const restored = await login(app, studentEmail, QA_PASSWORD);
    expect(restored.status).toBe(200);
    expect(restored.body.accessToken).toBeTruthy();
    studentToken = restored.body.accessToken;
  });

  it('seat limit rejects a student creation past the allowance and unblocks after raising it', async () => {
    const subRes = await api(app, 'post', `/admin/institutions/${instId}/subscription`, superAdminToken, {
      planKey,
      status: 'ACTIVE',
      seatLimit: 4,
    });
    expect([200, 201]).toContain(subRes.status);
    subAccess.invalidate(instId);

    const mkStudent = (email: string) =>
      api(app, 'post', '/students', adminToken, {
        academicYearId: yearId,
        name: `QA Limit Student ${email}`,
        email,
        grade: '8',
      });

    const ok1 = await mkStudent(`limit1${randomSuffix()}@qa.test`);
    expect([200, 201]).toContain(ok1.status);
    const ok2 = await mkStudent(`limit2${randomSuffix()}@qa.test`);
    expect([200, 201]).toContain(ok2.status);

    const blocked = await mkStudent(`limit3${randomSuffix()}@qa.test`);
    expect([400, 409]).toContain(blocked.status);
    expect(['USER_LIMIT_REACHED', 'SEAT_LIMIT_REACHED']).toContain(blocked.body.code);

    const raiseRes = await api(app, 'post', `/admin/institutions/${instId}/subscription`, superAdminToken, {
      planKey,
      status: 'ACTIVE',
      seatLimit: 10,
    });
    expect([200, 201]).toContain(raiseRes.status);
    subAccess.invalidate(instId);
    const ok4 = await mkStudent(`limit4${randomSuffix()}@qa.test`);
    expect([200, 201]).toContain(ok4.status);
  });

  describe('Seat limit edge cases: parent seats, link-parent, reactivation', () => {
    // Same rule as SubscriptionAccessService.countBillableUsers.
    const billableUsage = async () => {
      const [students, teachers, parents, admins] = await Promise.all([
        prisma.student.count({ where: { institutionId: instId, status: 'ACTIVE' } }),
        prisma.teacher.count({ where: { institutionId: instId, status: 'ACTIVE' } }),
        prisma.parent.count({ where: { institutionId: instId } }),
        prisma.institutionMember.count({
          where: { institutionId: instId, status: 'ACTIVE', role: 'INSTITUTION_ADMIN' },
        }),
      ]);
      return students + teachers + parents + admins;
    };

    const setSeatLimit = async (seatLimit: number) => {
      const res = await api(app, 'post', `/admin/institutions/${instId}/subscription`, superAdminToken, {
        planKey,
        status: 'ACTIVE',
        seatLimit,
      });
      expect([200, 201]).toContain(res.status);
      subAccess.invalidate(instId);
    };

    it('counts a parent created with the student and blocks link-parent and reactivation at the limit', async () => {
      const usage = await billableUsage();
      const parentEmail = `seatparent${randomSuffix()}@qa.test`;
      emailsToCleanup.push(parentEmail);

      // Exactly two free seats: a student with parent fields must consume both.
      await setSeatLimit(usage + 2);

      const withParentEmail = `seatwithparent${randomSuffix()}@qa.test`;
      emailsToCleanup.push(withParentEmail);
      const created = await api(app, 'post', '/students', adminToken, {
        academicYearId: yearId,
        name: 'QA Seat Parent Student',
        email: withParentEmail,
        grade: '8',
        parentName: 'QA Seat Parent',
        parentEmail,
      });
      expect([200, 201]).toContain(created.status);
      expect(await billableUsage()).toBe(usage + 2);

      // Seats are now full.
      const plain = await api(app, 'post', '/students', adminToken, {
        academicYearId: yearId,
        name: 'QA Seat Overflow',
        email: `seatoverflow${randomSuffix()}@qa.test`,
        grade: '8',
      });
      expect([400, 409]).toContain(plain.status);
      expect(plain.body.code).toBe('USER_LIMIT_REACHED');

      // A brand-new parent costs a seat, so link-parent is rejected too.
      const newParentEmail = `seatlinkparent${randomSuffix()}@qa.test`;
      emailsToCleanup.push(newParentEmail);
      const linkBlocked = await api(app, 'post', `/students/${created.body.id}/link-parent`, adminToken, {
        name: 'QA Seat Linked Parent',
        email: newParentEmail,
      });
      expect([400, 409]).toContain(linkBlocked.status);
      expect(linkBlocked.body.code).toBe('USER_LIMIT_REACHED');

      // Reusing the parent that already exists consumes no seat - allowed at the limit.
      const relink = await api(app, 'post', `/students/${created.body.id}/link-parent`, adminToken, {
        name: 'QA Seat Parent',
        email: parentEmail,
      });
      expect([200, 201]).toContain(relink.status);

      // Free one seat by deactivating a student, then refill it: usage == limit again.
      const victim = await prisma.student.findFirst({
        where: { institutionId: instId, status: 'ACTIVE', id: { not: created.body.id } },
        select: { id: true },
      });
      expect(victim).toBeTruthy();
      const deactivate = await api(app, 'post', `/students/${victim!.id}/deactivate`, adminToken);
      expect([200, 201]).toContain(deactivate.status);
      const refill = await api(app, 'post', '/students', adminToken, {
        academicYearId: yearId,
        name: 'QA Seat Refill',
        email: `seatrefill${randomSuffix()}@qa.test`,
        grade: '8',
      });
      expect([200, 201]).toContain(refill.status);
      expect(await billableUsage()).toBe(usage + 2);

      // Reactivating at the limit must be rejected (it makes the student billable again).
      const reactivateBlocked = await api(app, 'post', `/students/${victim!.id}/activate`, adminToken);
      expect([400, 409]).toContain(reactivateBlocked.status);
      expect(reactivateBlocked.body.code).toBe('USER_LIMIT_REACHED');

      // Raising the limit by one seat lets the same reactivation through.
      await setSeatLimit(usage + 3);
      const reactivate = await api(app, 'post', `/students/${victim!.id}/activate`, adminToken);
      expect([200, 201]).toContain(reactivate.status);
      expect(await billableUsage()).toBe(usage + 3);
    });

    it('blocks reactivating a deactivated teacher when no seat remains', async () => {
      const usage = await billableUsage();
      await setSeatLimit(usage + 1);

      const teacherEmail = `seatteacher${randomSuffix()}@qa.test`;
      emailsToCleanup.push(teacherEmail);
      const created = await api(app, 'post', '/teachers', adminToken, {
        name: 'QA Seat Teacher',
        email: teacherEmail,
        phone: '9876500000',
      });
      expect([200, 201]).toContain(created.status);
      expect(await billableUsage()).toBe(usage + 1);

      const deactivate = await api(app, 'post', `/teachers/${created.body.id}/deactivate`, adminToken);
      expect([200, 201]).toContain(deactivate.status);

      // usage is now one below the limit, so raise the limit down to usage:
      // the seat is gone, reactivation must be rejected.
      await setSeatLimit(await billableUsage());
      const blocked = await api(app, 'post', `/teachers/${created.body.id}/activate`, adminToken);
      expect([400, 409]).toContain(blocked.status);
      expect(blocked.body.code).toBe('USER_LIMIT_REACHED');

      await setSeatLimit((await billableUsage()) + 1);
      const allowed = await api(app, 'post', `/teachers/${created.body.id}/activate`, adminToken);
      expect([200, 201]).toContain(allowed.status);
    });
  });
});