import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { startTestApp, login, api, makePrisma, QA_PASSWORD } from './helpers';

/**
 * Contract: the Assessments menu owns a student Learning Path — an ordered,
 * stateful sequence derived from diagnosis (weak concepts first, then the
 * curriculum spine). Library owns browsing; the Path owns "what do I do next".
 * Students may request their own retest; staff may request one for a student.
 */
describe('Learning path & student retest (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let studentToken: string;
  let scopedToken: string;
  let teacherToken: string;
  let parentToken: string;
  let studentId: string;
  const createdAssessmentIds: string[] = [];

  beforeAll(async () => {
    app = await startTestApp();
    prisma = makePrisma();

    const student = await login(app, 'student@sanroai.com', QA_PASSWORD);
    expect(student.status).toBe(200);
    studentToken = student.body.accessToken;

    // The demo account is enrolled in every class, so the path-scope rule is
    // exercised with the single-class account.
    const scoped = await login(app, 'student8@sanroai.com', QA_PASSWORD);
    expect(scoped.status).toBe(200);
    scopedToken = scoped.body.accessToken;

    const teacher = await login(app, 'teacher@sanroai.com', QA_PASSWORD);
    expect(teacher.status).toBe(200);
    teacherToken = teacher.body.accessToken;

    const parent = await login(app, 'parent@sanroai.com', QA_PASSWORD);
    expect(parent.status).toBe(200);
    parentToken = parent.body.accessToken;

    const row = await prisma.student.findFirst({
      where: { user: { email: 'student@sanroai.com' } },
      select: { id: true },
    });
    expect(row).toBeTruthy();
    studentId = row!.id;
  });

  afterAll(async () => {
    if (createdAssessmentIds.length > 0) {
      await prisma.notification.deleteMany({ where: { entityId: { in: createdAssessmentIds } } });
      await prisma.assessmentAssignment.deleteMany({ where: { assessmentId: { in: createdAssessmentIds } } });
      await prisma.assessmentQuestion.deleteMany({ where: { assessmentId: { in: createdAssessmentIds } } });
      await prisma.assessment.deleteMany({ where: { id: { in: createdAssessmentIds } } });
    }
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /learning/path', () => {
    it('requires authentication', async () => {
      const res = await api(app, 'get', '/learning/path', '');
      expect(res.status).toBe(401);
    });

    it('returns 403 for a parent', async () => {
      const res = await api(app, 'get', '/learning/path', parentToken);
      expect(res.status).toBe(403);
    });

    it('returns 403 for staff', async () => {
      const res = await api(app, 'get', '/learning/path', teacherToken);
      expect(res.status).toBe(403);
    });

    it('returns an ordered track with mastery state for the student', async () => {
      const res = await api(app, 'get', '/learning/path', studentToken);
      expect(res.status).toBe(200);

      const { summary, focus, track, retests, next } = res.body;
      expect(Array.isArray(track)).toBe(true);
      expect(Array.isArray(focus)).toBe(true);
      expect(Array.isArray(retests)).toBe(true);

      expect(summary.totalConcepts).toBe(track.length);
      expect(summary.done + summary.inProgress + summary.notStarted).toBe(track.length);
      expect(summary.weakConcepts).toBe(focus.length);
      expect(summary.untestedConcepts).toBe(summary.notStarted);
      expect(summary.pendingRetests).toBe(retests.length);

      if (track.length > 0) {
        const keys = track.map((t: Record<string, number>) => [
          t.subjectOrder,
          t.chapterOrder,
          t.topicOrder,
          t.order,
        ]);
        const sorted = [...keys].sort((a: number[], b: number[]) =>
          a[0] - b[0] || a[1] - b[1] || a[2] - b[2] || a[3] - b[3],
        );
        expect(keys).toEqual(sorted);

        for (const step of track) {
          expect(['NOT_STARTED', 'IN_PROGRESS', 'DONE']).toContain(step.state);
          expect(['MASTERED', 'GOOD', 'DEVELOPING', 'WEAK', 'NEEDS_INTERVENTION', 'INSUFFICIENT_EVIDENCE']).toContain(
            step.level,
          );
          if (step.state === 'DONE') expect(['MASTERED', 'GOOD']).toContain(step.level);
          if (step.state === 'NOT_STARTED') expect(step.level).toBe('INSUFFICIENT_EVIDENCE');
        }
      }
    });

    it('orders weak concepts by severity then score', async () => {
      const res = await api(app, 'get', '/learning/path', studentToken);
      expect(res.status).toBe(200);
      const focus = res.body.focus as Array<{ level: string; score: number | null }>;
      if (focus.length < 2) return;

      const severity = (level: string) => (level === 'NEEDS_INTERVENTION' ? 0 : 1);
      for (let i = 1; i < focus.length; i++) {
        const prev = focus[i - 1];
        const cur = focus[i];
        expect(severity(prev.level) <= severity(cur.level)).toBe(true);
        if (severity(prev.level) === severity(cur.level)) {
          expect((prev.score ?? 0) <= (cur.score ?? 0)).toBe(true);
        }
      }
    });

    it('gives exactly one actionable next step', async () => {
      const res = await api(app, 'get', '/learning/path', studentToken);
      expect(res.status).toBe(200);
      const { next, focus, retests, track } = res.body;

      if (focus.length > 0) {
        expect(next.action).toBe('FIX');
        expect(next.conceptId).toBe(focus[0].conceptId);
      } else if (retests.length > 0) {
        expect(next.action).toBe('RETEST');
      } else if (track.some((t: { state: string }) => t.state !== 'DONE')) {
        expect(next.action).toBe('STUDY');
      } else {
        expect(next).toBeNull();
      }
    });

    it('scoped the path to the student grade', async () => {
      const res = await api(app, 'get', '/learning/path', scopedToken);
      expect(res.status).toBe(200);
      const grades = new Set(res.body.track.map((t: { grade: string }) => t.grade));
      expect(grades.size).toBeLessThanOrEqual(1);
      if (grades.size === 1) expect([...grades][0]).toBe(res.body.student.grade);
    });

    it('lets the all-classes demo account see every class', async () => {
      const res = await api(app, 'get', '/learning/path', studentToken);
      expect(res.status).toBe(200);
      expect(res.body.student.allGrades).toBe(true);
      const grades = new Set(res.body.track.map((t: { grade: string }) => t.grade));
      expect(grades.size).toBeGreaterThan(1);
    });
  });

  describe('POST /remediation/retest', () => {
    let conceptId: string;

    beforeAll(async () => {
      const question = await prisma.question.findFirst({
        where: { status: 'APPROVED', conceptId: { not: null } },
        select: { conceptId: true },
      });
      expect(question).toBeTruthy();
      conceptId = question!.conceptId!;
    });

    it('rejects an empty concept list', async () => {
      const res = await api(app, 'post', '/remediation/retest', studentToken, { conceptIds: [] });
      expect(res.status).toBe(400);
    });

    it('rejects a student requesting a retest for someone else', async () => {
      const other = await prisma.student.findFirst({
        where: { id: { not: studentId } },
        select: { id: true },
      });
      if (!other) return;
      const res = await api(app, 'post', '/remediation/retest', studentToken, {
        studentId: other.id,
        conceptIds: [conceptId],
      });
      expect(res.status).toBe(403);
    });

    it('lets a student trigger their own retest without passing a studentId', async () => {
      const res = await api(app, 'post', '/remediation/retest', studentToken, {
        conceptIds: [conceptId],
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Retest');
      createdAssessmentIds.push(res.body.id);

      const assignment = await prisma.assessmentAssignment.findFirst({
        where: { assessmentId: res.body.id },
      });
      expect(assignment?.studentId).toBe(studentId);
    });

    it('lets staff trigger a retest for a student', async () => {
      const res = await api(app, 'post', '/remediation/retest', teacherToken, {
        studentId,
        conceptIds: [conceptId],
      });
      expect(res.status).toBe(201);
      createdAssessmentIds.push(res.body.id);
    });

    it('requires a studentId when staff omit it', async () => {
      const res = await api(app, 'post', '/remediation/retest', teacherToken, {
        conceptIds: [conceptId],
      });
      expect(res.status).toBe(400);
    });

    it('does not let staff create a retest for another institution', async () => {
      const stray = await prisma.student.findFirst({
        where: { id: { not: studentId }, institutionId: { not: null } },
        select: { id: true, institutionId: true },
      });
      if (!stray || stray.institutionId === null) return;
      const teacherMembership = await prisma.institutionMember.findFirst({
        select: { institutionId: true },
      });
      if (!teacherMembership || teacherMembership.institutionId === stray.institutionId) return;
      const res = await api(app, 'post', '/remediation/retest', teacherToken, {
        studentId: stray.id,
        conceptIds: [conceptId],
      });
      expect([403, 404]).toContain(res.status);
    });

    it('rejects a malformed payload', async () => {
      const res = await api(app, 'post', '/remediation/retest', studentToken, {
        conceptIds: ['not-a-uuid'],
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /remediation/weak', () => {
    it('requires authentication', async () => {
      const res = await api(app, 'get', '/remediation/weak', '');
      expect(res.status).toBe(401);
    });

    it('returns weak concepts for a student without passing a studentId', async () => {
      const res = await api(app, 'get', '/remediation/weak', studentToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns weak concepts when the student passes their own studentId', async () => {
      const res = await api(app, 'get', `/remediation/weak?studentId=${studentId}`, studentToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('rejects a student querying someone else', async () => {
      const other = await prisma.student.findFirst({
        where: { id: { not: studentId } },
        select: { id: true },
      });
      if (!other) return;
      const res = await api(app, 'get', `/remediation/weak?studentId=${other.id}`, studentToken);
      expect(res.status).toBe(403);
    });

    it('requires a studentId when staff omit it', async () => {
      const res = await api(app, 'get', '/remediation/weak', teacherToken);
      expect(res.status).toBe(400);
    });

    it('rejects a malformed studentId instead of failing in Prisma', async () => {
      const res = await api(app, 'get', '/remediation/weak?studentId=not-a-uuid', teacherToken);
      expect(res.status).toBe(400);
    });

    it('returns weak concepts for staff inspecting a student', async () => {
      const res = await api(app, 'get', `/remediation/weak?studentId=${studentId}`, teacherToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('returns 403 for a parent', async () => {
      const res = await api(app, 'get', '/remediation/weak', parentToken);
      expect(res.status).toBe(403);
    });
  });
});
