import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { startTestApp, login, api, makePrisma, QA_PASSWORD } from './helpers';

const SANRO_AI_SYSTEM_INSTITUTION_ID = '00000000-0000-0000-0000-00000000a5a1';
const RANGES = ['today', '7d', '30d', 'month'] as const;

/**
 * Super-admin dashboard aggregations (GET /admin/super-admin/dashboard/*).
 * All metrics are real DB aggregations; the system institution is excluded
 * from health/attention unless includeSystem=true.
 */
describe('Super-Admin Dashboard (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let teacherToken: string;

  beforeAll(async () => {
    app = await startTestApp();
    prisma = makePrisma();
    const adminLogin = await login(app, 'admin@sanroai.com', QA_PASSWORD);
    expect(adminLogin.status).toBe(200);
    adminToken = adminLogin.body.accessToken;
    const teacherLogin = await login(app, 'teacher@sanroai.com', QA_PASSWORD);
    expect(teacherLogin.status).toBe(200);
    teacherToken = teacherLogin.body.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('overview reports real aggregates with exactly one system institution for every range', async () => {
    for (const range of RANGES) {
      const res = await api(app, 'get', `/admin/super-admin/dashboard/overview?range=${range}`, adminToken);
      expect(res.status, range).toBe(200);
      const body = res.body;
      expect(body.range).toBe(range);
      expect(typeof body.generatedAt).toBe('string');
      expect(body.institutions.systemCount).toBe(1);
      expect(body.institutions.total).toBeGreaterThanOrEqual(1);
      expect(typeof body.institutions.active).toBe('number');
      expect(typeof body.institutions.expiringSoon).toBe('number');
      expect(typeof body.users.total).toBe('number');
      expect(typeof body.users.newInRange).toBe('number');
      expect(typeof body.students.active).toBe('number');
      expect(typeof body.students.newInRange).toBe('number');
      expect(typeof body.assessments.total).toBe('number');
      expect(typeof body.assessments.conductedInRange).toBe('number');
      expect(typeof body.assessments.gradedInRange).toBe('number');
      expect(typeof body.seats.used).toBe('number');
      expect(typeof body.seats.capacity).toBe('number');
      expect(typeof body.seats.utilizationPct).toBe('number');
    }
  });

  it('health excludes the system institution by default and includes it with includeSystem=true', async () => {
    const res = await api(app, 'get', '/admin/super-admin/dashboard/health?range=7d', adminToken);
    expect(res.status).toBe(200);
    const rows: Array<{ id: string; isSystemInstitution: boolean }> = res.body.rows;
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((r) => r.id === SANRO_AI_SYSTEM_INSTITUTION_ID)).toBe(false);

    const included = await api(app, 'get', '/admin/super-admin/dashboard/health?range=7d&includeSystem=true', adminToken);
    expect(included.status).toBe(200);
    const sysRow = included.body.rows.find(
      (r: { id: string }) => r.id === SANRO_AI_SYSTEM_INSTITUTION_ID,
    );
    expect(sysRow).toBeTruthy();
    expect(sysRow.isSystemInstitution).toBe(true);

    const first = (included.body.rows as Array<{ lastActivityAt: string }>)[0];
    for (const r of included.body.rows as Array<{ lastActivityAt: string }>) {
      expect(new Date(first.lastActivityAt).getTime()).toBeGreaterThanOrEqual(
        new Date(r.lastActivityAt).getTime(),
      );
    }
  });

  it('attention returns all six buckets and never includes the system institution', async () => {
    const res = await api(app, 'get', '/admin/super-admin/dashboard/attention', adminToken);
    expect(res.status).toBe(200);
    for (const key of ['expiringSoon', 'suspended', 'expired', 'overSeatLimit', 'pastDue', 'noSubscription']) {
      expect(Array.isArray(res.body[key]), key).toBe(true);
    }
    const all = [
      ...res.body.expiringSoon,
      ...res.body.suspended,
      ...res.body.expired,
      ...res.body.overSeatLimit,
      ...res.body.pastDue,
      ...res.body.noSubscription,
    ];
    expect(all.some((r: { id: string }) => r.id === SANRO_AI_SYSTEM_INSTITUTION_ID)).toBe(false);
  });

  it('activity returns audit items bounded by limit and ordered newest-first', async () => {
    const res = await api(app, 'get', '/admin/super-admin/dashboard/activity?limit=5&range=30d', adminToken);
    expect(res.status).toBe(200);
    const items = res.body.items;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeLessThanOrEqual(5);
    for (const it of items) {
      expect(typeof it.action).toBe('string');
      expect(typeof it.actorEmail).toBe('string');
      expect(typeof it.createdAt).toBe('string');
    }
    const times = items.map((i: { createdAt: string }) => new Date(i.createdAt).getTime());
    for (let i = 1; i < times.length; i++) {
      expect(times[i - 1]).toBeGreaterThanOrEqual(times[i]);
    }
  });

  it('RBAC: non-super-admin roles are forbidden from every dashboard endpoint', async () => {
    for (const endpoint of ['overview', 'health', 'attention', 'activity']) {
      const res = await api(app, 'get', `/admin/super-admin/dashboard/${endpoint}`, teacherToken);
      expect(res.status, endpoint).toBe(403);
    }
  });
});