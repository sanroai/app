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
} from './helpers';

/**
 * Regression: BUG-A (2026-10-19) — GET /admin/library/assignments accepted an
 * arbitrary ?institutionId= and returned that tenant's rows to any staff member,
 * with no check against the caller's own institution (contrast with assign()).
 * A teacher in tenant A could read tenant B's content assignments (OWASP A01/IDOR).
 */
describe('Content-library assignment tenant isolation (e2e)', () => {
  let app: INestApplication;
  const prisma = makePrisma();
  const suffix = randomUUID().slice(0, 8);
  const ownerBEmail = `qa-lib-owner-b-${suffix}@test.local`;
  let tokenA: string;
  let tokenB: string;
  let tenantB: string | undefined;
  let contentId: string;

  beforeAll(async () => {
    app = await startTestApp();

    // Tenant B is the "victim": created via the real super-admin API, then given
    // one platform content assignment so there is something to leak.
    const sa = await request(app.getHttpServer())
      .post(`${BASE}/auth/login`)
      .send({ email: 'admin@sanroai.com', password: QA_PASSWORD });
    const planKey = await fetchFirstPlanKey(prisma);

    const created = await createInstitution(app, sa.body.accessToken, {
      name: `QA Lib Tenant B ${suffix}`,
      code: `QLB${suffix}`.slice(0, 20),
      type: 'SCHOOL',
      adminName: 'QA Owner B',
      adminEmail: ownerBEmail,
      adminPassword: QA_PASSWORD,
      planKey,
    });
    tenantB = created.body?.institution?.id ?? created.body?.id;
    if (!tenantB) throw new Error(`Tenant B not created: ${created.status} ${JSON.stringify(created.body)}`);

    const ownerB = await prisma.institutionMember.findFirst({
      where: { institutionId: tenantB, role: 'INSTITUTION_ADMIN' },
      include: { user: { select: { email: true } } },
    });
    if (ownerB) {
      const loginB = await request(app.getHttpServer())
        .post(`${BASE}/auth/login`)
        .send({ email: ownerB.user.email, password: QA_PASSWORD });
      tokenB = loginB.body.accessToken;
    }

    // A platform content item to assign (any APPROVED/PUBLISHED item will do).
    const item = await prisma.contentItem.findFirst({
      where: { ownerType: 'PLATFORM' },
      select: { id: true },
    });
    contentId = item?.id ?? '';
    if (contentId) {
      await prisma.contentAssignment.create({
        data: { contentId, institutionId: tenantB },
      });
    }

    // Tenant A is the "attacker": the seeded demo tenant + its teacher.
    const loginA = await request(app.getHttpServer())
      .post(`${BASE}/auth/login`)
      .send({ email: 'teacher@sanroai.com', password: QA_PASSWORD });
    tokenA = loginA.body.accessToken;
  });

  afterAll(async () => {
    if (contentId && tenantB) {
      await prisma.contentAssignment.deleteMany({ where: { contentId, institutionId: tenantB } });
    }
    await cleanupInstitution(prisma, tenantB, [ownerBEmail]);
    await prisma.$disconnect();
    await app.close();
  });

  /** `/auth/me` omits top-level institutionId; it is only reachable via memberships[]. */
  async function ownTenantFor(token: string): Promise<string> {
    const me = await request(app.getHttpServer())
      .get(`${BASE}/auth/me`)
      .set('Authorization', `Bearer ${token}`);
    const id = me.body?.memberships?.[0]?.institution?.id;
    if (!id) throw new Error(`no membership institution on /auth/me: ${JSON.stringify(me.body)}`);
    return id as string;
  }

  it('fixture: tenant B has a content assignment to leak', async () => {
    const rows = await prisma.contentAssignment.count({ where: { institutionId: tenantB } });
    expect(rows).toBeGreaterThan(0);
  });

  it('FIXED: teacher of tenant A is denied tenant B assignments', async () => {
    const res = await request(app.getHttpServer())
      .get(`${BASE}/admin/library/assignments?institutionId=${tenantB}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).not.toContain('QA Lib Tenant B');
  });

  it('FIXED: teacher of tenant A sees only their own tenant rows', async () => {
    const own = await ownTenantFor(tokenA);

    const res = await request(app.getHttpServer())
      .get(`${BASE}/admin/library/assignments?institutionId=${own}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    const rows = Array.isArray(res.body) ? res.body : [];
    expect(rows.every((r: { institutionId?: string }) => r.institutionId === own)).toBe(true);
  });

  it('FIXED: teacher of tenant A defaults to own tenant when no institutionId is given', async () => {
    const own = await ownTenantFor(tokenA);

    const res = await request(app.getHttpServer())
      .get(`${BASE}/admin/library/assignments`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    const rows = Array.isArray(res.body) ? res.body : [];
    expect(rows.every((r: { institutionId?: string }) => r.institutionId === own)).toBe(true);
  });

  it('owner of tenant B still reads their own assignments', async () => {
    if (!tokenB) return;
    const res = await request(app.getHttpServer())
      .get(`${BASE}/admin/library/assignments?institutionId=${tenantB}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(res.status).toBe(200);
    const rows = Array.isArray(res.body) ? res.body : [];
    expect(rows.every((r: { institutionId?: string }) => r.institutionId === tenantB)).toBe(true);
  });

  it('students are still blocked from the endpoint by RBAC', async () => {
    const login = await request(app.getHttpServer())
      .post(`${BASE}/auth/login`)
      .send({ email: 'student@sanroai.com', password: QA_PASSWORD });
    const res = await request(app.getHttpServer())
      .get(`${BASE}/admin/library/assignments`)
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(res.status).toBe(403);
  });
});
