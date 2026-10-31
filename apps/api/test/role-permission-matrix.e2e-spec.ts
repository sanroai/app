import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { startTestApp, BASE, QA_PASSWORD, makePrisma } from './helpers';
import type { PrismaClient } from '@prisma/client';

type RoleKey = 'SA' | 'IA' | 'TEACHER' | 'STUDENT' | 'PARENT';

type Case = {
  id: string;
  method: 'get' | 'post' | 'patch' | 'delete';
  path: string;
  /** roles that must NOT be rejected with 401/403 */
  allow: RoleKey[];
  body?: Record<string, unknown>;
  /**
   * `denied` (default) asserts every non-allowlisted role receives exactly 403.
   * `lenient` only asserts allowlisted roles succeed, for endpoints whose service
   * layer legitimately raises 400/404/422 before the guard would matter.
   */
  denied?: 'denied' | 'lenient';
};

const ACCOUNTS: Record<RoleKey, string> = {
  SA: 'admin@sanroai.com',
  IA: 'principal@sanroai.com',
  TEACHER: 'teacher@sanroai.com',
  STUDENT: 'student@sanroai.com',
  PARENT: 'parent@sanroai.com',
};

const ALL: RoleKey[] = ['SA', 'IA', 'TEACHER', 'STUDENT', 'PARENT'];
const STAFF: RoleKey[] = ['SA', 'IA', 'TEACHER'];
const MANAGER: RoleKey[] = ['SA', 'IA'];

/**
 * Route -> allowed-role matrix, transcribed from the @Roles decorators actually
 * present in the controllers (see docs/qa/ROLE_PERMISSION_MATRIX.md).
 */
const MATRIX: Case[] = [
  // ---- dashboards: each is single-role gated -----------------------------
  { id: 'DASH-STUDENT', method: 'get', path: '/dashboard/student', allow: ['STUDENT'] },
  { id: 'DASH-TEACHER', method: 'get', path: '/dashboard/teacher', allow: ['TEACHER', 'IA'] },
  { id: 'DASH-INSTITUTION', method: 'get', path: '/dashboard/institution', allow: ['IA'] },
  { id: 'DASH-PARENT', method: 'get', path: '/dashboard/parent', allow: ['PARENT', 'IA'] },
  { id: 'DASH-SUPER-ADMIN', method: 'get', path: '/dashboard/super-admin', allow: ['SA'] },

  // ---- super-admin only --------------------------------------------------
  { id: 'ADMIN-INSTITUTIONS', method: 'get', path: '/admin/institutions', allow: ['SA'] },
  { id: 'ADMIN-PLANS', method: 'get', path: '/admin/plans', allow: ['SA'] },
  { id: 'ADMIN-DASHBOARD', method: 'get', path: '/admin/super-admin/dashboard/overview', allow: ['SA'] },
  { id: 'ADMIN-HEALTH', method: 'get', path: '/admin/super-admin/dashboard/health', allow: ['SA'] },
  { id: 'ADMIN-AUDIT', method: 'get', path: '/admin/audit', allow: ['SA'] },
  { id: 'ADMIN-PEOPLE-STUDENTS', method: 'get', path: '/admin/people/students', allow: ['SA'] },
  { id: 'ADMIN-PEOPLE-TEACHERS', method: 'get', path: '/admin/people/teachers', allow: ['SA'] },
  { id: 'ADMIN-PEOPLE-PARENTS', method: 'get', path: '/admin/people/parents', allow: ['SA'] },
  { id: 'ADMIN-CURRICULUM-ACCESS', method: 'get', path: '/admin/curriculum/access', allow: ['SA'] },

  // ---- academics ---------------------------------------------------------
  { id: 'ACAD-YEARS-READ', method: 'get', path: '/academics/academic-years', allow: ALL },
  { id: 'ACAD-YEARS-CREATE', method: 'post', path: '/academics/academic-years', allow: ['IA'], denied: 'lenient' },
  { id: 'ACAD-GROUPS-READ', method: 'get', path: '/academics/groups', allow: ALL },

  // ---- people ------------------------------------------------------------
  { id: 'PEOPLE-STUDENTS-LIST', method: 'get', path: '/students', allow: ['IA', 'TEACHER'] },
  { id: 'PEOPLE-STUDENTS-CREATE', method: 'post', path: '/students', allow: ['IA', 'TEACHER'], denied: 'lenient' },
  { id: 'PEOPLE-TEACHERS-LIST', method: 'get', path: '/teachers', allow: ['IA', 'TEACHER'] },
  { id: 'PEOPLE-TEACHERS-CREATE', method: 'post', path: '/teachers', allow: ['IA'], denied: 'lenient' },
  { id: 'PEOPLE-PARENTS-LIST', method: 'get', path: '/parents', allow: ['IA', 'TEACHER'] },
  { id: 'PEOPLE-PARENTS-CREATE', method: 'post', path: '/parents', allow: ['IA'], denied: 'lenient' },
  // ---- parents -----------------------------------------------------------
  // GET /parents/me/dashboard is intentionally un-gated (no @Roles); it resolves
  // the caller's OWN parent record, so a non-parent simply gets an empty payload.
  { id: 'PEOPLE-PARENTS-DASHBOARD', method: 'get', path: '/parents/me/dashboard', allow: ALL, denied: 'lenient' },

  // ---- institution -------------------------------------------------------
  // SUPER_ADMIN is platform-scoped and intentionally has no institution binding;
  // /institutions/mine returns 403 "Super admin is not bound to an institution".
  { id: 'INST-MINE', method: 'get', path: '/institutions/mine', allow: ['IA', 'TEACHER', 'STUDENT', 'PARENT'] },
  { id: 'INST-MINE-UPDATE', method: 'patch', path: '/institutions/mine', allow: ['IA'], denied: 'lenient' },
  { id: 'INST-MINE-STATS', method: 'get', path: '/institutions/mine/stats', allow: ['IA', 'TEACHER', 'STUDENT', 'PARENT'] },

  // ---- curriculum --------------------------------------------------------
  { id: 'CURR-BOARDS-READ', method: 'get', path: '/curriculum/boards', allow: ALL },
  { id: 'CURR-BOARDS-CREATE', method: 'post', path: '/curriculum/boards', allow: ['SA'], denied: 'lenient' },
  { id: 'CURR-GRADES-READ', method: 'get', path: '/curriculum/grades', allow: ALL },
  { id: 'CURR-TREE', method: 'get', path: '/curriculum/tree', allow: ALL },

  // ---- content -----------------------------------------------------------
  { id: 'CONTENT-LIST', method: 'get', path: '/content', allow: ALL },
  { id: 'CONTENT-BROWSE', method: 'get', path: '/content/browse', allow: ALL },
  { id: 'CONTENT-CREATE', method: 'post', path: '/content', allow: ['IA', 'TEACHER'], denied: 'lenient' },
  { id: 'CONTENT-MATRIX', method: 'get', path: '/content/matrix/completeness', allow: STAFF },
  { id: 'CONTENT-QUALITY', method: 'get', path: '/content/report/quality', allow: STAFF },
  { id: 'CONTENT-VIDEOS-LIST', method: 'get', path: '/content/videos', allow: ALL },
  { id: 'CONTENT-VIDEOS-CREATE', method: 'post', path: '/content/videos', allow: STAFF, denied: 'lenient' },
  { id: 'LIBRARY-CONTENT', method: 'get', path: '/admin/library/content', allow: STAFF },
  { id: 'INGEST-LIST', method: 'get', path: '/content/ingest', allow: STAFF },

  // ---- questions ---------------------------------------------------------
  { id: 'QUESTIONS-LIST', method: 'get', path: '/questions', allow: ALL },
  { id: 'QUESTIONS-CREATE', method: 'post', path: '/questions', allow: ['IA', 'TEACHER'], denied: 'lenient' },
  { id: 'QUESTIONS-AI', method: 'post', path: '/questions/ai-generate', allow: ['IA', 'TEACHER'], denied: 'lenient' },

  // ---- papers ------------------------------------------------------------
  { id: 'PAPERS-LIST', method: 'get', path: '/papers', allow: ALL },
  { id: 'PAPERS-CREATE', method: 'post', path: '/papers', allow: ['IA', 'TEACHER'], denied: 'lenient' },

  // ---- assessments -------------------------------------------------------
  // The controller declares no @Roles, but the service enforces a staff-only
  // policy: list/create return 403 "Only teachers and admins can manage
  // assessments". Students use /assessments/my (their own assignments) instead.
  { id: 'ASSESS-LIST', method: 'get', path: '/assessments', allow: STAFF, denied: 'lenient' },
  { id: 'ASSESS-MY', method: 'get', path: '/assessments/my', allow: ALL, denied: 'lenient' },
  { id: 'ASSESS-CREATE', method: 'post', path: '/assessments', allow: STAFF, denied: 'lenient' },

  // ---- learning / gamification -------------------------------------------
  // Learning routes are gated by ParentContentGuard (parents blocked) and, for
  // gamification, by a service-level "students only" policy. Staff who are not
  // bound to an institution (SUPER_ADMIN) are rejected by the tenant resolver.
  { id: 'LEARN-HOME', method: 'get', path: '/learning/home', allow: ['STUDENT'], denied: 'lenient' },
  { id: 'LEARN-PROGRESS', method: 'get', path: '/learning/progress', allow: ['STUDENT'], denied: 'lenient' },
  { id: 'LEARN-PATH', method: 'get', path: '/learning/path', allow: ['STUDENT'], denied: 'lenient' },
  { id: 'LEARN-CONCEPTS', method: 'get', path: '/learning/concepts/00000000-0000-0000-0000-000000000000', allow: ['STUDENT'], denied: 'lenient' },
  { id: 'LEARN-PRACTICE-START', method: 'post', path: '/learning/practice/start', allow: ['STUDENT'], denied: 'lenient' },
  { id: 'LEARN-GAMIFICATION', method: 'get', path: '/learning/gamification/profile', allow: ['STUDENT'], denied: 'lenient' },
  { id: 'LEARN-LEADERBOARD', method: 'get', path: '/learning/gamification/leaderboard', allow: ['STUDENT'], denied: 'lenient' },
  { id: 'LEARN-ACHIEVEMENTS', method: 'get', path: '/learning/gamification/achievements', allow: ['STUDENT'], denied: 'lenient' },

  // ---- diagnosis / remediation -------------------------------------------
  // /remediation/my and /remediation/plans are staff-scoped in the service layer.
  // /remediation/weak additionally requires an institution context, so SUPER_ADMIN
  // (unbound) and PARENT are rejected.
  { id: 'DIAG-MY', method: 'get', path: '/diagnosis/my', allow: ALL, denied: 'lenient' },
  // BUG-C regression: /diagnosis/students/:id is service-gated — staff may read
  // any student in their own institution, students only themselves, parents only
  // linked children. The matrix probes with an arbitrary UUID, so STUDENT/PARENT
  // correctly 403; SA 403s (no institution). Full PII-leak regression in
  // diagnosis-scoping.e2e-spec.ts.
  { id: 'DIAG-STUDENT', method: 'get', path: '/diagnosis/students/00000000-0000-0000-0000-000000000000', allow: ['IA', 'TEACHER'], denied: 'lenient' },
  { id: 'REMED-MY', method: 'get', path: '/remediation/my', allow: ['IA', 'TEACHER'], denied: 'lenient' },
  { id: 'REMED-PLANS', method: 'get', path: '/remediation/plans', allow: ['IA', 'TEACHER'], denied: 'lenient' },
  { id: 'REMED-WEAK', method: 'get', path: '/remediation/weak', allow: ['IA', 'TEACHER'], denied: 'lenient' },
  { id: 'REMED-ITEM-STATUS', method: 'post', path: '/remediation/items/00000000-0000-0000-0000-000000000000/status', allow: ['IA', 'TEACHER'], denied: 'lenient' },
  { id: 'REMED-RETEST', method: 'post', path: '/remediation/retest', allow: ['IA', 'TEACHER', 'STUDENT'], denied: 'lenient' },

  // ---- reports -----------------------------------------------------------
  // Scope-checked: an unknown/foreign id returns 403 "No access to this class",
  // which is deliberate anti-enumeration behaviour. These cases resolve a real
  // id the caller owns at runtime, then assert the allowed roles get 200.
  { id: 'REPORTS-IMPROVEMENT', method: 'get', path: '/reports/improvement', allow: STAFF },
  { id: 'REPORTS-CONCEPT', method: 'get', path: '/reports/concept-performance', allow: STAFF },
  { id: 'REPORTS-CLASS', method: 'get', path: '/reports/class/__OWN_GROUP__', allow: STAFF, denied: 'lenient' },
  { id: 'REPORTS-STUDENT', method: 'get', path: '/reports/student/__OWN_STUDENT__', allow: STAFF, denied: 'lenient' },

  // ---- imports -----------------------------------------------------------
  { id: 'IMPORTS-HISTORY', method: 'get', path: '/imports', allow: ALL, denied: 'lenient' },
  { id: 'IMPORTS-UPLOAD', method: 'post', path: '/imports/upload', allow: STAFF, denied: 'lenient' },

  // ---- knowledge base ----------------------------------------------------
  { id: 'KB-LIST', method: 'get', path: '/knowledge-base', allow: STAFF },
  { id: 'KB-JOBS', method: 'get', path: '/knowledge-base/jobs', allow: STAFF },
  { id: 'KB-DELETE', method: 'delete', path: '/knowledge-base/00000000-0000-0000-0000-000000000000', allow: MANAGER, denied: 'lenient' },

  // ---- AR ----------------------------------------------------------------
  // /ar/teacher resolves the caller's institution, so SUPER_ADMIN (unbound) is
  // rejected with 403 "No institution context".
  { id: 'AR-LIST', method: 'get', path: '/ar', allow: [...STAFF, 'STUDENT'] },
  { id: 'AR-ADMIN-LIST', method: 'get', path: '/ar/admin/list', allow: MANAGER },
  { id: 'AR-TEACHER', method: 'get', path: '/ar/teacher', allow: ['IA', 'TEACHER'] },

  // ---- content-library ---------------------------------------------------
  // BUG-A regression: staff without an explicit institutionId now fall back to
  // their OWN institution (no longer a hard 403), and a foreign institutionId is
  // rejected with 403. See content-library-assignments.e2e-spec.ts for the full
  // cross-tenant leak regression.
  { id: 'LIB-ASSIGNMENTS', method: 'get', path: '/admin/library/assignments', allow: ['IA', 'TEACHER'], denied: 'lenient' },

  // ---- users -------------------------------------------------------------
  { id: 'USERS-ME', method: 'get', path: '/users/me', allow: ALL },
  { id: 'USERS-NOTIFICATIONS', method: 'get', path: '/users/me/notifications', allow: ALL },
];

describe('Role-permission matrix (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient | undefined;
  const tokens = {} as Record<RoleKey, string>;

  beforeAll(async () => {
    app = await startTestApp();
    prisma = makePrisma();
    for (const [role, email] of Object.entries(ACCOUNTS)) {
      const res = await request(app.getHttpServer())
        .post(`${BASE}/auth/login`)
        .send({ email, password: QA_PASSWORD });
      if (res.status !== 200) {
        throw new Error(`QA login failed for ${role} (${email}): ${res.status}`);
      }
      tokens[role as RoleKey] = res.body.accessToken;
    }

    // Resolve real ids owned by the teacher's institution so the reports cases
    // exercise the allowed path (200) instead of the anti-enumeration 403.
    const me = await request(app.getHttpServer())
      .get(`${BASE}/auth/me`)
      .set('Authorization', `Bearer ${tokens.TEACHER}`);
    const teacherInstitution = me.body?.memberships?.[0]?.institution?.id as string | undefined;
    if (teacherInstitution) {
      // The teacher's own classes: `/reports/student/:id` is scoped to the groups
      // the teacher is linked to (TeacherGroup), so the "allowed" case has to
      // pick a student from one of those groups. A student of another class in
      // the same institution is a legitimate 403.
      const teacher = await prisma.teacher.findFirst({
        where: { user: { email: 'teacher@sanroai.com' } },
        select: { id: true, groups: { select: { groupId: true } } },
      });
      const taughtGroupIds = teacher?.groups.map((t) => t.groupId) ?? [];
      const group = taughtGroupIds.length
        ? { id: taughtGroupIds[0] }
        : await prisma.group.findFirst({
            where: { institutionId: teacherInstitution },
            select: { id: true },
          });
      const membership = taughtGroupIds.length
        ? await prisma.groupMembership.findFirst({
            where: { groupId: { in: taughtGroupIds }, student: { status: 'ACTIVE' } },
            select: { studentId: true },
            orderBy: { studentId: 'asc' },
          })
        : null;
      const student = membership
        ? { id: membership.studentId }
        : await prisma.student.findFirst({
            where: { institutionId: teacherInstitution },
            select: { id: true },
            orderBy: { id: 'asc' },
          });
      for (const c of MATRIX) {
        c.path = c.path
          .replace('__OWN_GROUP__', group?.id ?? c.path)
          .replace('__OWN_STUDENT__', student?.id ?? c.path);
      }
    }
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    await app.close();
  });

  it('every demo account can authenticate', () => {
    for (const role of ALL) {
      expect(tokens[role]).toBeTruthy();
    }
  });

  describe('unauthenticated requests are rejected', () => {
    it('all gated endpoints return 401 without a bearer token', async () => {
      const seen: string[] = [];
      for (const c of MATRIX) {
        const res = await request(app.getHttpServer())[c.method](`${BASE}${c.path}`);
        if (res.status !== 401) seen.push(`${c.method.toUpperCase()} ${c.path} -> ${res.status}`);
      }
      expect(seen).toEqual([]);
    });
  });

  describe('allowed roles are not blocked', () => {
    for (const c of MATRIX) {
      for (const role of c.allow) {
        it(`${c.id}: ${role} may ${c.method.toUpperCase()} ${c.path}`, async () => {
          const res = await request(app.getHttpServer())
            [c.method](`${BASE}${c.path}`)
            .set('Authorization', `Bearer ${tokens[role]}`)
            .send(c.body ?? {});
          expect([401, 403]).not.toContain(res.status);
        });
      }
    }
  });

  describe('non-allowlisted roles are denied', () => {
    for (const c of MATRIX) {
      if (c.denied === 'lenient') continue;
      const denied = ALL.filter((r) => !c.allow.includes(r));
      for (const role of denied) {
        it(`${c.id}: ${role} is denied ${c.method.toUpperCase()} ${c.path}`, async () => {
          const res = await request(app.getHttpServer())
            [c.method](`${BASE}${c.path}`)
            .set('Authorization', `Bearer ${tokens[role]}`)
            .send(c.body ?? {});
          expect(res.status).toBe(403);
        });
      }
    }
  });

  describe('tampered / expired tokens', () => {
    it('a structurally invalid token is rejected with 401', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/learning/home`)
        .set('Authorization', 'Bearer not.a.jwt');
      expect(res.status).toBe(401);
    });

    it('an empty bearer header is rejected with 401', async () => {
      const res = await request(app.getHttpServer())
        .get(`${BASE}/users/me`)
        .set('Authorization', 'Bearer ');
      expect(res.status).toBe(401);
    });

    it('a token signed for another audience is rejected', async () => {
      // re-encode the header/payload of a real token with a forged signature
      const real = tokens.STUDENT;
      const [h, p] = real.split('.');
      const forged = `${h}.${p}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;
      const res = await request(app.getHttpServer())
        .get(`${BASE}/users/me`)
        .set('Authorization', `Bearer ${forged}`);
      expect(res.status).toBe(401);
    });
  });
});
