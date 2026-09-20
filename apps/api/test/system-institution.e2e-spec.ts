import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { startTestApp, login, api, makePrisma, QA_PASSWORD, randomSuffix } from './helpers';

const SANRO_AI_SYSTEM_INSTITUTION_ID = '00000000-0000-0000-0000-00000000a5a1';

/**
 * Contract: the "SANRO AI" system institution is provisioned exactly once,
 * is excluded from tenant listings, can never be duplicated, and is immune to
 * destructive lifecycle operations (docs/PEOPLE_MANAGEMENT.md).
 */
describe('SANRO AI System Institution (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let sysInstId: string;
  let academicYearId: string | null;

  const cleanStudentIds: string[] = [];

  beforeAll(async () => {
    app = await startTestApp();
    prisma = makePrisma();
    const loginRes = await login(app, 'admin@sanroai.com', QA_PASSWORD);
    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.accessToken;
    const sys = await prisma.institution.findFirst({ where: { isSystemInstitution: true } });
    expect(sys).toBeTruthy();
    sysInstId = sys!.id;
    const year = await prisma.academicYear.findFirst();
    academicYearId = year?.id ?? null;
  });

  afterAll(async () => {
    if (cleanStudentIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: { entityId: { in: cleanStudentIds } },
      });
      await prisma.student.deleteMany({ where: { id: { in: cleanStudentIds } } });
    }
    await prisma.$disconnect();
    await app.close();
  });

  it('provisions exactly one system institution', async () => {
    const rows = await prisma.institution.findMany({ where: { isSystemInstitution: true } });
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe('SANRO_PLATFORM');
    expect(rows[0].status).toBe('ACTIVE');
    expect(rows[0].code).toBe('SANRO-AI');
  });

  it('excludes the system institution from the tenant list', async () => {
    const res = await api(app, 'get', '/admin/institutions', adminToken);
    expect(res.status).toBe(200);
    const items = res.body.items ?? res.body;
    const rows: Array<{ id: string }> = Array.isArray(items) ? items : [];
    expect(rows.some((r) => r.id === sysInstId)).toBe(false);
    expect(rows.some((r) => r.type === 'SANRO_PLATFORM')).toBe(false);
  });

  it('rejects creating a second SANRO_PLATFORM / system institution', async () => {
    const res = await api(app, 'post', '/admin/institutions', adminToken, {
      name: `QA System Clone ${randomSuffix()}`,
      type: 'SANRO_PLATFORM',
      code: `CL${randomSuffix()}`.slice(0, 20),
      adminName: 'QA Clone Admin',
      adminEmail: `clone${randomSuffix()}@qa.test`,
      adminPassword: QA_PASSWORD,
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);

    const sysCountBefore = await prisma.institution.count({ where: { isSystemInstitution: true } });
    await expect(
      prisma.institution.create({
        data: {
          name: 'Rogue System Clone',
          type: 'SANRO_PLATFORM',
          isSystemInstitution: true,
          status: 'ACTIVE',
          code: `RG${randomSuffix()}`.slice(0, 20),
        },
      }),
    ).rejects.toThrow();
    const sysCountAfter = await prisma.institution.count({ where: { isSystemInstitution: true } });
    expect(sysCountAfter).toBe(sysCountBefore);
  });

  it('rejects destructive lifecycle operations on the system institution', async () => {
    const reason = 'system-institution protection check';
    const targets: Array<{ method: 'post' | 'patch'; path: string; body?: unknown }> = [
      { method: 'post', path: `/admin/institutions/${sysInstId}/suspend`, body: { reason } },
      { method: 'post', path: `/admin/institutions/${sysInstId}/archive`, body: { reason } },
      { method: 'post', path: `/admin/institutions/${sysInstId}/expire`, body: { reason } },
      { method: 'post', path: `/admin/institutions/${sysInstId}/restore`, body: { reason } },
      { method: 'patch', path: `/admin/institutions/${sysInstId}/status`, body: { status: 'SUSPENDED', reason } },
      { method: 'patch', path: `/admin/institutions/${sysInstId}`, body: { name: 'Renamed SANRO AI' } },
    ];
    for (const t of targets) {
      const res = await api(app, t.method, t.path, adminToken, t.body);
      expect(res.status, t.path).toBe(403);
    }
    const still = await prisma.institution.findUnique({ where: { id: sysInstId } });
    expect(still?.status).toBe('ACTIVE');
    expect(still?.name).toBe('SANRO AI');
    expect(still?.isSystemInstitution).toBe(true);
  });

  it('assigns direct-created people to the SANRO AI system institution', async () => {
    expect(academicYearId).toBeTruthy();
    const email = `sysdirect${randomSuffix()}@qa.test`;
    const res = await api(app, 'post', '/admin/people/students', adminToken, {
      name: 'QA System Direct Student',
      email,
      grade: '10',
      academicYearId,
    });
    expect(res.status).toBe(201);
    const id = res.body.id;
    cleanStudentIds.push(id);
    expect(res.body.institutionId).toBe(SANRO_AI_SYSTEM_INSTITUTION_ID);
    expect(res.body.institutionName).toBe('SANRO AI');
    expect(res.body.source).toBe('DIRECT_SANRO');

    const list = await api(app, 'get', `/admin/people/students?source=DIRECT_SANRO&search=${encodeURIComponent(email)}`, adminToken);
    expect(list.status).toBe(200);
    const found = (list.body.items ?? list.body).find((s: any) => s.id === id);
    expect(found).toBeTruthy();
    expect(found.institutionId).toBe(SANRO_AI_SYSTEM_INSTITUTION_ID);
    expect(found.institutionName).toBe('SANRO AI');
  });

  it('keeps RBAC/tenant isolation: institution admins cannot reach super-admin surfaces or other tenants', async () => {
    const principal = await login(app, 'principal@sanroai.com', QA_PASSWORD);
    expect(principal.status).toBe(200);
    const res = await api(app, 'get', '/admin/institutions', principal.body.accessToken);
    expect(res.status).toBe(403);
  });
});