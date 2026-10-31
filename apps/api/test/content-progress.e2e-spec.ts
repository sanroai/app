import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { startTestApp, login, api, makePrisma, QA_PASSWORD } from './helpers';

/**
 * Contract: "Mark as done" is a toggle. A student who completed a lesson by
 * mistake can undo it, and the stored row goes back to NOT_STARTED with no
 * completion timestamp so every completed-count (progress, leaderboard,
 * dashboard) drops it again. Both directions are idempotent and student-only.
 */
describe('Content completion toggle (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let studentToken: string;
  let teacherToken: string;
  let studentId: string;
  let contentId: string;
  let conceptId: string;

  beforeAll(async () => {
    app = await startTestApp();
    prisma = makePrisma();

    const student = await login(app, 'student@sanroai.com', QA_PASSWORD);
    expect(student.status).toBe(200);
    studentToken = student.body.accessToken;

    const teacher = await login(app, 'teacher@sanroai.com', QA_PASSWORD);
    expect(teacher.status).toBe(200);
    teacherToken = teacher.body.accessToken;

    const profile = await prisma.student.findFirst({
      where: { user: { email: 'student@sanroai.com' } },
      select: { id: true, grade: true },
    });
    expect(profile).toBeTruthy();
    studentId = profile!.id;

    const content = await prisma.contentItem.findFirst({
      where: {
        progress: { none: { studentId } },
        conceptId: { not: null },
        subjectId: { not: null },
        type: { in: ['VIDEO', 'NOTES'] },
        chapter: { grade: profile!.grade },
      },
      orderBy: { title: 'asc' },
      select: { id: true, conceptId: true },
    });
    expect(content).toBeTruthy();
    contentId = content!.id;
    conceptId = content!.conceptId!;
  });

  afterAll(async () => {
    if (studentId && contentId) {
      await prisma.contentProgress.deleteMany({ where: { studentId, contentId } });
    }
    await prisma.$disconnect();
    await app.close();
  });

  it('requires a token in both directions', async () => {
    const done = await api(app, 'post', `/learning/content/${contentId}/complete`, '');
    expect(done.status).toBe(401);

    const undone = await api(app, 'delete', `/learning/content/${contentId}/complete`, '');
    expect(undone.status).toBe(401);
  });

  it('refuses a non-student', async () => {
    const res = await api(app, 'delete', `/learning/content/${contentId}/complete`, teacherToken);
    expect(res.status).toBe(403);
  });

  it('marks the lesson complete, then undoes it', async () => {
    const done = await api(app, 'post', `/learning/content/${contentId}/complete`, studentToken);
    expect(done.status).toBe(201);
    expect(done.body.progress.state).toBe('COMPLETED');
    expect(done.body.progress.completedAt).toBeTruthy();

    const undone = await api(app, 'delete', `/learning/content/${contentId}/complete`, studentToken);
    expect(undone.status).toBe(200);
    expect(undone.body.progress.state).toBe('NOT_STARTED');
    expect(undone.body.progress.completedAt).toBeNull();

    const row = await prisma.contentProgress.findUnique({
      where: { contentId_studentId: { contentId, studentId } },
    });
    expect(row?.state).toBe('NOT_STARTED');
    expect(row?.completedAt).toBeNull();
  });

  it('undoing twice stays harmless and never creates a completed row', async () => {
    const first = await api(app, 'delete', `/learning/content/${contentId}/complete`, studentToken);
    expect(first.status).toBe(200);
    expect(first.body.progress.state).toBe('NOT_STARTED');

    const second = await api(app, 'delete', `/learning/content/${contentId}/complete`, studentToken);
    expect(second.status).toBe(200);
    expect(second.body.progress?.state ?? 'NOT_STARTED').toBe('NOT_STARTED');

    const completed = await prisma.contentProgress.count({
      where: { studentId, contentId, state: 'COMPLETED' },
    });
    expect(completed).toBe(0);
  });

  it('is not reported as completed by the concept detail while undone', async () => {
    const detail = await api(app, 'get', `/learning/concepts/${conceptId}`, studentToken);
    expect(detail.status).toBe(200);
    const item = (detail.body.content ?? []).find((i: { id: string }) => i.id === contentId);
    expect(item).toBeTruthy();
    expect(item.progress?.state).not.toBe('COMPLETED');
  });
});
