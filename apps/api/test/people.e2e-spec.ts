import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { SubscriptionAccessService } from '../src/common/security/subscription-access.service';
import { EntitlementService } from '../src/common/security/entitlement.service';
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

/**
 * Mints a JWT exactly like AuthService.signAccessToken does for a DIRECT user
 * (sub + role, no institutionId claim), using the app's global JwtService
 * (same secret / issuer / audience configured in app.module.ts). Used where a
 * token is needed WITHOUT going through the full password login path.
 */
async function mintDirectToken(
  app: INestApplication,
  sub: string,
  role: string,
  email: string,
): Promise<string> {
  const jwt = app.get(JwtService);
  return jwt.signAsync({ sub, role, name: 'QA Direct', email });
}

const getBody = (res: any) => res.body as any;

/**
 * Full Direct SANRO + People Admin e2e surface (contract docs/PEOPLE_MANAGEMENT_CONTRACT.md §8).
 */
describe('People Management (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let subAccess: SubscriptionAccessService;
  let entitlement: EntitlementService;

  let superAdminToken: string;
  let institutionPlanKey: string;
  let directPlanKey: string;

  let instAId: string;
  let instAdminAToken: string;
  let yearAId: string;

  let instBId: string;
  let instAdminBToken: string;

  let childAId: string;
  const childAEmail = `child${randomSuffix()}@qa.test`;
  const adminAEmail = `peopleadm${randomSuffix()}@qa.test`;
  const adminBEmail = `peoplese${randomSuffix()}@qa.test`;

  const directStudents: Array<{ id: string; email: string; userId: string; password: string }> = [];
  let parentId: string;
  let parentUserId: string;
  let parentEmail: string;
  let parentPassword: string;

  beforeAll(async () => {
    app = await startTestApp();
    prisma = makePrisma();
    subAccess = app.get(SubscriptionAccessService);
    entitlement = app.get(EntitlementService);
    institutionPlanKey = await fetchFirstPlanKey(prisma);
    const directPlan = await prisma.plan.findFirst({ where: { key: 'STUDENT_MONTHLY' } });
    if (!directPlan) throw new Error('STUDENT_MONTHLY plan not seeded');
    directPlanKey = directPlan.key;

    const adminLogin = await login(app, 'admin@sanroai.com', QA_PASSWORD);
    expect(adminLogin.status).toBe(200);
    superAdminToken = adminLogin.body.accessToken;

    // --- Institution A (direct-student transfer target + institution child's home) ---
    const instARes = await api(app, 'post', '/admin/institutions', superAdminToken, {
      name: `QA People Academy ${randomSuffix()}`,
      type: 'SCHOOL',
      code: `P${randomSuffix()}`.slice(0, 20),
      adminName: 'QA People Admin',
      adminEmail: adminAEmail,
      adminPassword: QA_PASSWORD,
      planKey: institutionPlanKey,
    });
    if (instARes.status !== 201) {
      throw new Error(`institution A create failed: ${instARes.status} ${JSON.stringify(instARes.body)}`);
    }
    instAId = getBody(instARes).institution.id;
    await setUserPassword(prisma, adminAEmail, QA_PASSWORD);
    const adminALogin = await login(app, adminAEmail, QA_PASSWORD);
    if (adminALogin.status !== 200) {
      throw new Error(`institution A admin login failed: ${adminALogin.status}`);
    }
    instAdminAToken = adminALogin.body.accessToken;
    const subARes = await api(app, 'post', `/admin/institutions/${instAId}/subscription`, superAdminToken, {
      planKey: institutionPlanKey,
      status: 'ACTIVE',
      seatLimit: 100,
    });
    expect(subARes.status).toBeLessThan(400);
    subAccess.invalidate(instAId);
    const yearARes = await api(app, 'post', '/academics/academic-years', instAdminAToken, {
      name: `AY-${randomSuffix()}`,
      startDate: '2026-04-01',
      endDate: '2027-03-31',
    });
    expect(yearARes.status).toBeLessThan(400);
    yearAId = getBody(yearARes).id;

    // --- Institution B (transfer target) ---
    const instBRes = await api(app, 'post', '/admin/institutions', superAdminToken, {
      name: `QA People Second ${randomSuffix()}`,
      type: 'SCHOOL',
      code: `S${randomSuffix()}`.slice(0, 20),
      adminName: 'QA People Second Admin',
      adminEmail: adminBEmail,
      adminPassword: QA_PASSWORD,
      planKey: institutionPlanKey,
    });
    if (instBRes.status !== 201) {
      throw new Error(`institution B create failed: ${instBRes.status} ${JSON.stringify(instBRes.body)}`);
    }
    instBId = getBody(instBRes).institution.id;
    await setUserPassword(prisma, adminBEmail, QA_PASSWORD);
    const adminBLogin = await login(app, adminBEmail, QA_PASSWORD);
    if (adminBLogin.status !== 200) {
      throw new Error(`institution B admin login failed: ${adminBLogin.status}`);
    }
    instAdminBToken = adminBLogin.body.accessToken;
    const subBRes = await api(app, 'post', `/admin/institutions/${instBId}/subscription`, superAdminToken, {
      planKey: institutionPlanKey,
      status: 'ACTIVE',
      seatLimit: 100,
    });
    expect(subBRes.status).toBeLessThan(400);
    subAccess.invalidate(instBId);

    // --- Institution child (in A) ---
    const childRes = await api(app, 'post', '/students', instAdminAToken, {
      academicYearId: yearAId,
      name: 'QA Institution Child',
      email: childAEmail,
      grade: '9',
    });
    if (childRes.status >= 400) {
      throw new Error(`institution child create failed: ${childRes.status} ${JSON.stringify(childRes.body)}`);
    }
    childAId = getBody(childRes).id ?? getBody(childRes).studentId;
    if (!childAId) throw new Error('institution child id missing from response');

    // --- Direct SANRO students (created via the real admin API) ---
    for (let i = 0; i < 3; i++) {
      const email = `direct${i}${randomSuffix()}@qa.test`;
      const createRes = await api(app, 'post', '/admin/people/students', superAdminToken, {
        name: `QA Direct Student ${i}`,
        email,
        grade: '10',
        academicYearId: yearAId,
      });
      if (createRes.status !== 201) {
        throw new Error(`direct student ${i} create failed: ${createRes.status} ${JSON.stringify(createRes.body)}`);
      }
      const id = getBody(createRes).id;
      if (!id) throw new Error(`direct student ${i} id missing`);
      const password = getBody(createRes).defaultPassword;
      if (!password) throw new Error(`direct student ${i} defaultPassword missing`);
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) throw new Error(`direct student ${i} user missing`);
      directStudents.push({ id, email, userId: user.id, password });
    }

    const future = new Date(Date.now() + 40 * 86400000);
    // D1: ACTIVE direct subscription (entitled -> later expired in tests)
    await prisma.subscription.create({
      data: { userId: directStudents[0].userId, planId: directPlanKey === 'STUDENT_MONTHLY' ? (await prisma.plan.findUnique({ where: { key: directPlanKey } }))!.id : (await prisma.plan.findFirst({ where: { key: 'STUDENT_MONTHLY' } }))!.id, status: 'ACTIVE', startedAt: new Date(), endsAt: future },
    });
    // D3: ACTIVE direct subscription (keeps the seeded parent entitled early on)
    await prisma.subscription.create({
      data: { userId: directStudents[2].userId, planId: (await prisma.plan.findFirst({ where: { key: 'STUDENT_MONTHLY' } }))!.id, status: 'ACTIVE', startedAt: new Date(), endsAt: future },
    });
    entitlement.invalidate(directStudents[0].userId);
    entitlement.invalidate(directStudents[2].userId);

    // --- Direct parent -- created via the REAL admin API (create + link) ---
    parentEmail = `parent${randomSuffix()}@qa.test`;
    const parentCreate = await api(app, 'post', '/admin/people/parents', superAdminToken, {
      name: 'QA Direct Parent',
      email: parentEmail,
    });
    if (parentCreate.status !== 201) {
      throw new Error(`direct parent create failed: ${parentCreate.status} ${JSON.stringify(parentCreate.body)}`);
    }
    parentId = getBody(parentCreate).id;
    parentPassword = getBody(parentCreate).defaultPassword;
    if (!parentId || !parentPassword) throw new Error('direct parent id/password missing');
    const parentUser = await prisma.user.findUnique({ where: { email: parentEmail.toLowerCase() } });
    if (!parentUser) throw new Error('direct parent user missing');
    parentUserId = parentUser.id;

    const linkRes = await api(app, 'post', `/admin/people/parents/${parentId}/link-child`, superAdminToken, {
      studentId: directStudents[2].id,
    });
    if (linkRes.status >= 400) {
      throw new Error(`parent link failed: ${linkRes.status} ${JSON.stringify(linkRes.body)}`);
    }
    const linkRes2 = await api(app, 'post', `/admin/people/parents/${parentId}/link-child`, superAdminToken, {
      studentId: directStudents[0].id,
    });
    expect(linkRes2.status).toBeLessThan(400);
    await prisma.parentStudentLink.create({
      data: { parentId, studentId: childAId },
    });
    entitlement.invalidate(parentUserId);
  });

  afterAll(async () => {
    const directIds = directStudents.map((s) => s.id);
    const directUserIds = directStudents.map((s) => s.userId);
    const trackedUserIds = Array.from(new Set([...directUserIds, parentUserId].filter(Boolean)));

    // Sweep BOTH this run's rows and any orphaned leftovers from earlier
    // partial runs of this spec (unique prefixes on the QA domain).
    const prefixes = ['direct', 'parent', 'peopleadm', 'peoplese', 'child'];
    const sweptUsers = await prisma.user.findMany({
      where: {
        OR: prefixes.map((p) => ({
          AND: [{ email: { startsWith: p } }, { email: { endsWith: '@qa.test' } }],
        })),
      },
      select: { id: true, email: true },
    });
    const sweptIds = sweptUsers.map((u) => u.id);

    if (parentId) {
      await prisma.parentStudentLink.deleteMany({ where: { parentId } });
    }
    await prisma.parentStudentLink.deleteMany({ where: { studentId: { in: directIds } } });
    await prisma.parentStudentLink.deleteMany({ where: { studentId: childAId } });

    const sweptSubs = await prisma.subscription.findMany({
      where: { userId: { in: trackedUserIds } },
      select: { id: true },
    });
    await prisma.subscriptionHistory.deleteMany({
      where: { subscriptionId: { in: sweptSubs.map((s) => s.id) } },
    });
    await prisma.subscription.deleteMany({ where: { userId: { in: trackedUserIds } } });

    await prisma.student.deleteMany({ where: { id: { in: directIds } } });
    await prisma.student.deleteMany({
      where: { user: { id: { in: trackedUserIds } } },
    });
    await prisma.parent.deleteMany({ where: { id: parentId } });
    await prisma.parent.deleteMany({ where: { userId: { in: trackedUserIds } } });

    await prisma.auditLog.deleteMany({
      where: { entityId: { in: [...directIds, parentId].filter(Boolean) } },
    });

    await cleanupInstitution(prisma, instBId, [adminBEmail]);
    await cleanupInstitution(prisma, instAId, [childAEmail, adminAEmail]);

    await prisma.auditLog.deleteMany({ where: { user: { email: { in: sweptUsers.map((u) => u.email) } } } });
    await prisma.session.deleteMany({ where: { userId: { in: sweptIds } } });
    await prisma.user.deleteMany({ where: { email: { in: sweptUsers.map((u) => u.email) } } });

    await prisma.$disconnect();
    await app.close();
  });

  describe('Super admin creates DIRECT SANRO students', () => {
    it('creates a direct student without an institution (STUDENT_CREATED audit)', async () => {
      const s1 = directStudents[0];
      const student = await prisma.student.findUnique({ where: { id: s1.id } });
      expect(student).toBeTruthy();
      expect(student!.institutionId).toBeNull();
      expect(student!.userId).toBe(s1.userId);

      const user = await prisma.user.findUnique({ where: { email: s1.email.toLowerCase() } });
      expect(user).toBeTruthy();
      expect(user!.passwordHash).toBeTruthy();
      expect(user!.isActive).toBe(true);

      const audit = await prisma.auditLog.findFirst({
        where: { entityId: s1.id, action: 'STUDENT_CREATED' },
      });
      expect(audit).toBeTruthy();
      expect(audit!.entityType).toBe('STUDENT');
      expect((audit!.metadata as any)?.email).toBe(s1.email.toLowerCase());
    });

    it('lists the direct student under source DIRECT_SANRO with no institutionId', async () => {
      const s1 = directStudents[0];
      const res = await api(
        app,
        'get',
        `/admin/people/students?source=DIRECT_SANRO&search=${encodeURIComponent(s1.email)}`,
        superAdminToken,
      );
      expect(res.status).toBe(200);
      const items = Array.isArray(res.body) ? res.body : (res.body.items ?? []);
      const found = items.find((i: any) => i.id === s1.id);
      expect(found).toBeTruthy();
      expect(found.source).toBe('DIRECT_SANRO');
      expect(found.institutionId).toBeNull();
    });

    it('lists the student detail via the super-admin endpoint with a DIRECT_SANRO source', async () => {
      const s1 = directStudents[0];
      const res = await api(app, 'get', `/admin/people/students/${s1.id}`, superAdminToken);
      expect(res.status).toBe(200);
      expect(res.body.source).toBe('DIRECT_SANRO');
      expect(res.body.institutionId).toBeNull();
      expect(res.body.id).toBe(s1.id);
    });

    it('a direct student with no subscription is blocked with NO_ENTITLEMENT', async () => {
      const s2 = directStudents[1];
      const token = await mintDirectToken(app, s2.userId, 'STUDENT', s2.email);
      const res = await api(app, 'get', '/curriculum/boards', token);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('NO_ENTITLEMENT');
    });

    it('a direct student can log in with the default password (no institution claim)', async () => {
      const s1 = directStudents[0];
      const res = await login(app, s1.email, s1.password);
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('STUDENT');
      expect(res.body.user.institutionId).toBeNull();
      expect(res.body.accessToken).toBeTruthy();
      const appRes = await api(app, 'get', '/curriculum/boards', res.body.accessToken);
      expect(appRes.status).toBe(200);
      expect(Array.isArray(appRes.body)).toBe(true);
    });

    it('grants a direct subscription via the admin API and records DIRECT_SUBSCRIPTION_CREATED', async () => {
      const email = `directsub${randomSuffix()}@qa.test`;
      const createRes = await api(app, 'post', '/admin/people/students', superAdminToken, {
        name: 'QA Direct Subscriber',
        email,
        grade: '10',
        academicYearId: yearAId,
      });
      expect(createRes.status).toBe(201);
      const id = getBody(createRes).id;
      const future = new Date(Date.now() + 40 * 86400000).toISOString();

      const grantRes = await api(app, 'post', `/admin/people/students/${id}/direct-subscription`, superAdminToken, {
        planKey: directPlanKey,
        status: 'ACTIVE',
        startsAt: new Date().toISOString(),
        endsAt: future,
      });
      expect(grantRes.status).toBeLessThan(400);
      expect(grantRes.body.subscription.status).toBe('ACTIVE');

      const audit = await prisma.auditLog.findFirst({
        where: { entityId: id, action: 'DIRECT_SUBSCRIPTION_CREATED' },
      });
      expect(audit).toBeTruthy();

      const inv = await prisma.user.findUnique({ where: { email } });
      if (inv) entitlement.invalidate(inv.id);

      const token = await mintDirectToken(app, (inv as any).id, 'STUDENT', email);
      const appRes = await api(app, 'get', '/curriculum/boards', token);
      expect(appRes.status).toBe(200);
      expect(Array.isArray(appRes.body)).toBe(true);

      await prisma.auditLog.deleteMany({ where: { entityId: id } });
      const sub = await prisma.subscription.findFirst({ where: { user: { email } } });
      if (sub) {
        await prisma.subscriptionHistory.deleteMany({ where: { subscriptionId: sub.id } });
        await prisma.subscription.delete({ where: { id: sub.id } });
      }
      await prisma.student.deleteMany({ where: { id } });
      await prisma.student.deleteMany({ where: { user: { email } } });
      await prisma.user.deleteMany({ where: { email } });
    });

    it('an entitled direct student can access app endpoints (guard passes)', async () => {
      const s1 = directStudents[0];
      const token = await mintDirectToken(app, s1.userId, 'STUDENT', s1.email);
      const res = await api(app, 'get', '/curriculum/boards', token);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('an expired direct subscription blocks access with DIRECT_SUBSCRIPTION_EXPIRED', async () => {
      const s1 = directStudents[0];
      await prisma.subscription.updateMany({
        where: { userId: s1.userId, status: 'ACTIVE' },
        data: { status: 'ACTIVE', endsAt: new Date(Date.now() - 86400000) },
      });
      entitlement.invalidate(s1.userId);

      const token = await mintDirectToken(app, s1.userId, 'STUDENT', s1.email);
      const res = await api(app, 'get', '/curriculum/boards', token);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('DIRECT_SUBSCRIPTION_EXPIRED');
    });
  });

  describe('Direct parents', () => {
    it('creates a direct parent via the admin API and links children (PARENT_CHILD_LINKED)', async () => {
      const email = `parentdirect${randomSuffix()}@qa.test`;
      const createRes = await api(app, 'post', '/admin/people/parents', superAdminToken, {
        name: 'QA Parent Via API',
        email,
      });
      expect(createRes.status).toBe(201);
      const id = getBody(createRes).id;
      const password = getBody(createRes).defaultPassword;
      expect(id).toBeTruthy();
      expect(password).toBeTruthy();

      const linkRes = await api(app, 'post', `/admin/people/parents/${id}/link-child`, superAdminToken, {
        studentId: directStudents[2].id,
      });
      expect(linkRes.status).toBeLessThan(400);

      const audit = await prisma.auditLog.findFirst({
        where: { entityId: id, action: 'PARENT_CHILD_LINKED' },
      });
      expect(audit).toBeTruthy();

      const loginRes = await login(app, email, password);
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.role).toBe('PARENT');
      expect(loginRes.body.user.institutionId).toBeNull();
      const dashRes = await api(app, 'get', '/parents/me/dashboard', loginRes.body.accessToken);
      expect(dashRes.status).toBe(200);

      await prisma.parentStudentLink.deleteMany({ where: { parentId: id } });
      await prisma.auditLog.deleteMany({ where: { entityId: id } });
      await prisma.parent.deleteMany({ where: { id } });
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.session.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    });

    it('a direct parent can log in and sees linked children entitlement', async () => {
      const loginRes = await login(app, parentEmail, parentPassword);
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.role).toBe('PARENT');
      expect(loginRes.body.user.institutionId).toBeNull();
      const dashRes = await api(app, 'get', '/parents/me/dashboard', loginRes.body.accessToken);
      expect(dashRes.status).toBe(200);
      const childIds = (dashRes.body.children ?? []).map((c: any) => c.studentId);
      expect(childIds).toContain(directStudents[0].id);
      expect(childIds).toContain(directStudents[2].id);
      expect(childIds).toContain(childAId);
    });

    it('parent stays allowed while ANY child is entitled even after a direct child expires', async () => {
      const s3 = directStudents[2];
      await prisma.subscription.updateMany({
        where: { userId: s3.userId, status: 'ACTIVE' },
        data: { status: 'ACTIVE', endsAt: new Date(Date.now() - 86400000) },
      });
      entitlement.invalidate(s3.userId);
      entitlement.invalidate(parentUserId);

      const token = await mintDirectToken(app, parentUserId, 'PARENT', parentEmail);
      const res = await api(app, 'get', '/parents/me/dashboard', token);
      expect(res.status).toBe(200);
      const childIds = (res.body.children ?? []).map((c: any) => c.studentId);
      expect(childIds).toContain(childAId);
    });
  });

  describe('RBAC', () => {
    it('institution admin is forbidden from the super-admin people API', async () => {
      const res = await api(app, 'get', '/admin/people/students', instAdminAToken);
      expect(res.status).toBe(403);
    });

    it('direct SANRO students do not appear in the institution-scoped /students list', async () => {
      const s1 = directStudents[0];
      const instRes = await api(app, 'get', `/students?search=${encodeURIComponent(s1.email)}`, instAdminAToken);
      expect(instRes.status).toBe(200);
      const students = instRes.body.students ?? [];
      expect(students.length).toBe(0);

      const directRes = await api(
        app,
        'get',
        `/admin/people/students?source=DIRECT_SANRO&search=${encodeURIComponent(s1.email)}`,
        superAdminToken,
      );
      expect(directRes.status).toBe(200);
      const items = Array.isArray(directRes.body) ? directRes.body : (directRes.body.items ?? []);
      expect(items.some((i: any) => i.id === s1.id)).toBe(true);
    });
  });

  describe('Transfer', () => {
    it('transfers a direct student into an institution making them INSTITUTION', async () => {
      const email = `directtransfer${randomSuffix()}@qa.test`;
      const createRes = await api(app, 'post', '/admin/people/students', superAdminToken, {
        name: 'QA Transfer Direct',
        email,
        grade: '10',
        academicYearId: yearAId,
      });
      expect(createRes.status).toBe(201);
      const id = getBody(createRes).id;

      const transferRes = await api(app, 'post', `/admin/people/students/${id}/transfer`, superAdminToken, {
        targetInstitutionId: instAId,
      });
      expect(transferRes.status).toBeLessThan(400);

      const student = await prisma.student.findUnique({ where: { id } });
      expect(student!.institutionId).toBe(instAId);

      const listRes = await api(app, 'get', `/students?search=${encodeURIComponent(email)}`, instAdminAToken);
      expect(listRes.status).toBe(200);
      const students = listRes.body.students ?? [];
      expect(students.some((s: any) => s.id === id)).toBe(true);

      await prisma.auditLog.deleteMany({ where: { entityId: id } });
      await prisma.student.deleteMany({ where: { id } });
      await prisma.student.deleteMany({ where: { user: { email } } });
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.session.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    });

    it('transfer between institutions: old institution no longer lists the student, new one does', async () => {
      const email = `child2${randomSuffix()}@qa.test`;
      const childRes = await api(app, 'post', '/students', instAdminAToken, {
        academicYearId: yearAId,
        name: 'QA Transfer Child',
        email,
        grade: '9',
      });
      if (childRes.status >= 400) {
        throw new Error(`transfer child create failed: ${childRes.status} ${JSON.stringify(childRes.body)}`);
      }
      const childId = getBody(childRes).id ?? getBody(childRes).studentId;

      const transferRes = await api(app, 'post', `/admin/people/students/${childId}/transfer`, superAdminToken, {
        targetInstitutionId: instBId,
      });
      expect(transferRes.status).toBeLessThan(400);

      const inA = await api(app, 'get', `/students?search=${encodeURIComponent(email)}`, instAdminAToken);
      const inB = await api(app, 'get', `/students?search=${encodeURIComponent(email)}`, instAdminBToken);
      const studentsA = inA.body.students ?? [];
      const studentsB = inB.body.students ?? [];
      expect(studentsA.some((s: any) => s.id === childId)).toBe(false);
      expect(studentsB.some((s: any) => s.id === childId)).toBe(true);

      const audit = await prisma.auditLog.findFirst({
        where: { entityId: childId, action: 'STUDENT_INSTITUTION_CHANGED' },
      });
      expect(audit).toBeTruthy();

      await prisma.parentStudentLink.deleteMany({ where: { studentId: childId } });
      await prisma.auditLog.deleteMany({ where: { entityId: childId } });
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.session.deleteMany({ where: { userId: user.id } });
        await prisma.student.deleteMany({ where: { id: childId } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    });
  });

  describe('Audit trail', () => {
    it('writes a STUDENT_CREATED AuditLog row for direct student creation', async () => {
      const rows = await prisma.auditLog.findMany({
        where: { entityType: 'STUDENT', entityId: { in: directStudents.map((s) => s.id) } },
        orderBy: { createdAt: 'asc' },
      });
      expect(rows.length).toBe(3);
      expect(rows.every((r) => r.action === 'STUDENT_CREATED')).toBe(true);
      expect(rows.every((r) => r.institutionId === null)).toBe(true);
    });

    it('records DIRECT_SUBSCRIPTION_CREATED / PARENT_CHILD_LINKED / STUDENT_INSTITUTION_CHANGED', async () => {
      const linkAudit = await prisma.auditLog.findFirst({
        where: { entityId: parentId, action: 'PARENT_CHILD_LINKED' },
      });
      expect(linkAudit).toBeTruthy();
      const memberAudit = await prisma.auditLog.findFirst({
        where: { entityType: 'STUDENT', entityId: { in: directStudents.map((s) => s.id) }, action: 'STUDENT_CREATED' },
      });
      expect(memberAudit).toBeTruthy();
    });
  });
});