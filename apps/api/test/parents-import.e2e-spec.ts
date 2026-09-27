import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
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
  BASE,
} from './helpers';

/**
 * Contract: PARENTS is a first-class import entity type. A parent account is a
 * User + InstitutionMember(PARENT) + Parent row, optionally linked to an
 * existing student of the same institution. Unlike content/questions, parent
 * rows consume subscription seats.
 */

const HEADER = ['name', 'email', 'phone', 'studentEmail'];

function csv(rows: string[][]): Buffer {
  const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = [HEADER.join(','), ...rows.map((r) => r.map(escape).join(','))];
  return Buffer.from(`${lines.join('\n')}\n`, 'utf8');
}

function upload(app: INestApplication, token: string, body: Record<string, string>, buffer: Buffer) {
  let req = request(app.getHttpServer())
    .post(`${BASE}/imports/upload`)
    .set('Authorization', `Bearer ${token}`)
    .field('entityType', 'PARENTS');
  for (const [k, v] of Object.entries(body)) req = req.field(k, v);
  return req.attach('file', buffer, 'parents.csv');
}

describe('PARENTS import (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let subAccess: SubscriptionAccessService;
  let superAdminToken: string;
  let adminToken: string;
  let instId: string;
  let yearId: string;
  let adminEmail: string;
  let studentEmail: string;

  const linkedParentEmail = `linked${randomSuffix()}@qa.test`;
  const plainParentEmail = `plain${randomSuffix()}@qa.test`;
  const missingStudentEmail = `ghost${randomSuffix()}@qa.test`;

  const parentsBuffer = () =>
    csv([
      ['Linked Parent', linkedParentEmail, '9876543210', studentEmail],
      ['Plain Parent', plainParentEmail, '9876543211', ''],
      ['No Email Parent', '', '9876543212', ''],
      ['Unknown Student Parent', missingStudentEmail, '9876543213', `nobody${randomSuffix()}@qa.test`],
    ]);

  beforeAll(async () => {
    app = await startTestApp();
    prisma = makePrisma();
    subAccess = app.get(SubscriptionAccessService);

    const admin = await login(app, 'admin@sanroai.com', QA_PASSWORD);
    expect(admin.status).toBe(200);
    superAdminToken = admin.body.accessToken;

    adminEmail = `pimpu${randomSuffix()}@qa.test`;
    studentEmail = `pistu${randomSuffix()}@qa.test`;
    const planKey = await fetchFirstPlanKey(prisma);

    const institution = await api(app, 'post', '/admin/institutions', superAdminToken, {
      name: `QA Parent Import ${randomSuffix()}`,
      type: 'SCHOOL',
      code: `P${randomSuffix()}`.slice(0, 20),
      adminName: 'QA Parent Import Admin',
      adminEmail,
      adminPassword: QA_PASSWORD,
      planKey,
    });
    expect(institution.status).toBe(201);
    instId = institution.body.institution.id;
    await setUserPassword(prisma, adminEmail, QA_PASSWORD);

    await api(app, 'post', `/admin/institutions/${instId}/subscription`, superAdminToken, {
      planKey,
      status: 'ACTIVE',
      seatLimit: 50,
    });
    subAccess.invalidate(instId);

    const loginRes = await login(app, adminEmail, QA_PASSWORD);
    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.accessToken;

    const year = await api(app, 'post', '/academics/academic-years', adminToken, {
      name: `AY-${randomSuffix()}`,
      startDate: '2026-04-01',
      endDate: '2027-03-31',
    });
    expect(year.status).toBeLessThan(400);
    yearId = year.body.id;

    const student = await api(app, 'post', '/students', adminToken, {
      academicYearId: yearId,
      name: 'QA Parent Import Child',
      email: studentEmail,
      grade: '10',
    });
    expect(student.status).toBeLessThan(400);
  });

  afterAll(async () => {
    await prisma.importJob.deleteMany({ where: { institutionId: instId } });
    await cleanupInstitution(prisma, instId, [
      adminEmail,
      studentEmail,
      linkedParentEmail,
      plainParentEmail,
      missingStudentEmail,
    ]);
    await prisma.$disconnect();
    await app.close();
  });

  it('previews PARENTS with per-row validation and student resolution', async () => {
    const res = await upload(app, superAdminToken, { academicYearId: yearId, institutionId: instId }, parentsBuffer());
    expect(res.status).toBe(201);
    expect(res.body.entityType).toBe('PARENTS');
    expect(res.body.totalRows).toBe(4);
    expect(res.body.validRows).toBe(2);
    expect(res.body.invalidRows).toBe(2);

    const joined = res.body.errors.join(' | ');
    expect(joined).toContain('Email is required for parent accounts');
    expect(joined).toContain('not found in this institution');
  });

  it('commits parent accounts and links the requested child', async () => {
    const preview = await upload(app, superAdminToken, { academicYearId: yearId, institutionId: instId }, parentsBuffer());
    const commit = await api(app, 'post', `/imports/${preview.body.jobId}/commit`, superAdminToken);
    expect(commit.status).toBe(201);
    expect(commit.body).toEqual({ imported: 2, duplicates: 0, errors: [] });

    const parents = await prisma.parent.findMany({ where: { institutionId: instId }, orderBy: { name: 'asc' } });
    expect(parents).toHaveLength(2);

    const linked = parents.find((p) => p.email === linkedParentEmail);
    const plain = parents.find((p) => p.email === plainParentEmail);
    expect(linked).toBeTruthy();
    expect(plain).toBeTruthy();

    const members = await prisma.institutionMember.findMany({
      where: { institutionId: instId, role: 'PARENT' },
    });
    expect(members).toHaveLength(2);

    const child = await prisma.student.findFirst({ where: { institutionId: instId, email: studentEmail } });
    const links = await prisma.parentStudentLink.findMany({ where: { parentId: linked!.id } });
    expect(links).toHaveLength(1);
    expect(links[0].studentId).toBe(child?.id);
    expect(await prisma.parentStudentLink.count({ where: { parentId: plain!.id } })).toBe(0);

    const audit = await prisma.auditLog.findFirst({
      where: { institutionId: instId, action: 'PARENT_CREATED' },
    });
    expect(audit).toBeTruthy();
  });

  it('marks repeated parent rows as duplicates', async () => {
    const preview = await upload(app, superAdminToken, { academicYearId: yearId, institutionId: instId }, parentsBuffer());
    const commit = await api(app, 'post', `/imports/${preview.body.jobId}/commit`, superAdminToken);
    expect(commit.status).toBe(201);
    expect(commit.body.imported).toBe(0);
    expect(commit.body.duplicates).toBe(2);
    expect(await prisma.parent.count({ where: { institutionId: instId } })).toBe(2);
  });

  it('enforces the seat limit for parent accounts', async () => {
    await prisma.subscription.updateMany({ where: { institutionId: instId }, data: { seatLimit: 1 } });
    subAccess.invalidate(instId);

    const preview = await upload(app, superAdminToken, { academicYearId: yearId, institutionId: instId }, parentsBuffer());
    expect(preview.status).toBe(201);
    const commit = await api(app, 'post', `/imports/${preview.body.jobId}/commit`, superAdminToken);
    expect(commit.status).toBe(400);
    expect(commit.body.code).toBe('USER_LIMIT_REACHED');

    await prisma.subscription.updateMany({ where: { institutionId: instId }, data: { seatLimit: 50 } });
    subAccess.invalidate(instId);
  });
});
