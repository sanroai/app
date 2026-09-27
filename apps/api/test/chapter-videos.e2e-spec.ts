import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { startTestApp, login, api, makePrisma, QA_PASSWORD } from './helpers';

/**
 * Contract: staff upload YouTube lessons chapter-wise and they become real,
 * curriculum-linked VIDEO ContentItems that students can watch on the chapter
 * page (docs/AGENTS.md — Library lesson types).
 */
describe('Chapter-wise YouTube videos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let studentToken: string;
  let chapterId: string;
  let foreignConceptId: string | null;

  const createdIds: string[] = [];

  const VIDEO_A = { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Reflection of light intro' };
  const VIDEO_B = { url: 'https://youtu.be/abcDEF12345?t=12', title: 'Spherical mirrors explained' };

  beforeAll(async () => {
    app = await startTestApp();
    prisma = makePrisma();

    const admin = await login(app, 'admin@sanroai.com', QA_PASSWORD);
    expect(admin.status).toBe(200);
    adminToken = admin.body.accessToken;

    const student = await login(app, 'student@sanroai.com', QA_PASSWORD);
    expect(student.status).toBe(200);
    studentToken = student.body.accessToken;

    const chapter = await prisma.chapter.findFirst({ orderBy: { order: 'asc' } });
    expect(chapter).toBeTruthy();
    chapterId = chapter!.id;

    const foreign = await prisma.concept.findFirst({ where: { topic: { chapterId: { not: chapterId } } } });
    foreignConceptId = foreign?.id ?? null;
  });

  afterAll(async () => {
    if (createdIds.length > 0) {
      await prisma.contentProgress.deleteMany({ where: { contentId: { in: createdIds } } });
      await prisma.contentVersion.deleteMany({ where: { contentId: { in: createdIds } } });
      await prisma.contentItem.deleteMany({ where: { id: { in: createdIds } } });
    }
    await prisma.$disconnect();
    await app.close();
  });

  it('requires a chapterId when listing', async () => {
    const res = await api(app, 'get', '/content/videos', adminToken);
    expect(res.status).toBe(400);
  });

  it('forbids students from uploading videos', async () => {
    const res = await api(app, 'post', '/content/videos', studentToken, {
      chapterId,
      videos: [VIDEO_A],
    });
    expect(res.status).toBe(403);
  });

  it('rejects URLs that are not YouTube', async () => {
    const res = await api(app, 'post', '/content/videos', adminToken, {
      chapterId,
      videos: [{ url: 'https://vimeo.com/123456', title: 'Not YouTube' }],
    });
    expect(res.status).toBe(400);
  });

  it('rejects a concept that belongs to another chapter', async () => {
    if (!foreignConceptId) return;
    const res = await api(app, 'post', '/content/videos', adminToken, {
      chapterId,
      conceptId: foreignConceptId,
      videos: [VIDEO_A],
    });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain('conceptId');
  });

  it('creates chapter-linked videos with derived curriculum fields', async () => {
    const res = await api(app, 'post', '/content/videos', adminToken, {
      chapterId,
      videos: [VIDEO_A, VIDEO_B],
    });
    expect(res.status).toBe(201);
    expect(res.body.created).toHaveLength(2);
    expect(res.body.duplicates).toHaveLength(0);

    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, include: { subject: true } });

    for (const item of res.body.created) {
      createdIds.push(item.id);
      expect(item.type).toBe('VIDEO');
      expect(item.status).toBe('APPROVED');
      expect(item.chapterId).toBe(chapterId);
      expect(item.subjectId).toBe(chapter!.subjectId);
      expect(item.boardId).toBe(chapter!.subject.boardId);
      expect(item.grade).toBe(chapter!.grade);
      expect(item.sourceType).toBe('YOUTUBE');
      expect(item.videoId).toMatch(/^[A-Za-z0-9_-]{6,20}$/);
      expect(item.thumbnailUrl).toContain(`i.ytimg.com/vi/${item.videoId}/`);
    }

    const [first, second] = res.body.created;
    expect(first.videoId).toBe('dQw4w9WgXcQ');
    expect(second.videoId).toBe('abcDEF12345');
    expect(first.order).toBeLessThan(second.order);
  });

  it('is idempotent for videos already in the chapter', async () => {
    const res = await api(app, 'post', '/content/videos', adminToken, {
      chapterId,
      videos: [VIDEO_A, { url: 'https://www.youtube.com/watch?v=zzzZZZ98765', title: 'Brand new' }],
    });
    expect(res.status).toBe(201);
    expect(res.body.created).toHaveLength(1);
    expect(res.body.duplicates).toHaveLength(1);
    expect(res.body.duplicates[0].videoId).toBe('dQw4w9WgXcQ');
    createdIds.push(res.body.created[0].id);
  });

  it('lists the chapter videos in order for the uploader', async () => {
    const res = await api(app, 'get', `/content/videos?chapterId=${chapterId}`, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(3);

    const orders = res.body.map((v: { order: number }) => v.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);

    const first = res.body[0];
    expect(first).toHaveProperty('videoId');
    expect(first).toHaveProperty('thumbnailUrl');
    expect(first).toHaveProperty('url');
  });

  it('surfaces chapter-level videos on the chapter detail used by learners', async () => {
    const res = await api(app, 'get', `/learning/chapters/${chapterId}`, adminToken);
    expect(res.status).toBe(200);
    const chapterContent = res.body.chapterContent ?? [];
    expect(Array.isArray(chapterContent)).toBe(true);

    const videoIds = chapterContent
      .filter((c: { type: string }) => c.type === 'VIDEO')
      .map((c: { id: string }) => c.id);
    for (const id of createdIds) {
      expect(videoIds).toContain(id);
    }
  });

  it('removes a video', async () => {
    const victim = createdIds[createdIds.length - 1];
    const res = await api(app, 'delete', `/content/videos/${victim}`, adminToken);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const row = await prisma.contentItem.findUnique({ where: { id: victim } });
    expect(row).toBeNull();
    createdIds.pop();
  });

  it('returns 404 when removing an unknown video', async () => {
    const res = await api(app, 'delete', '/content/videos/00000000-0000-0000-0000-000000000000', adminToken);
    expect(res.status).toBe(404);
  });
});
