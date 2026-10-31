import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { startTestApp, login, api, makePrisma, QA_PASSWORD } from './helpers';

/**
 * Contract: the chapter hub is a map, not a list.
 *
 * Every concept carries its curriculum number and - when the chapter's video
 * actually covers it - the exact slice of that video (`section`). The number on
 * the chapter is the curriculum order, not the code, because codes are
 * volume-scoped (`MAT-8P2-3`). A missing match must be null: the clients print
 * no times rather than inventing a range.
 */
describe('Chapter hub sections (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let studentToken: string;
  let scopedToken: string;
  let chapterId: string;
  let subjectId: string;
  let boardId: string;
  let grade: string;

  beforeAll(async () => {
    app = await startTestApp();
    prisma = makePrisma();

    const student = await login(app, 'student@sanroai.com', QA_PASSWORD);
    expect(student.status).toBe(200);
    studentToken = student.body.accessToken;

    // student@sanroai.com opens every class, so the "another grade" assertion
    // needs the single-class account instead.
    const scoped = await login(app, 'student8@sanroai.com', QA_PASSWORD);
    expect(scoped.status).toBe(200);
    scopedToken = scoped.body.accessToken;

    // Pick a chapter that really produces sections: a grade-10 chapter with a
    // video and at least one concept. Candidates are probed in curriculum order
    // and the first one whose hub carries a section is used, so the assertions
    // below test the contract instead of whatever the seed happens to store.
    const candidates = await prisma.chapter.findMany({
      where: {
        grade: '10',
        content: { some: { type: 'VIDEO' } },
        topics: { some: { concepts: { some: {} } } },
      },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
      take: 40,
      select: { id: true, grade: true, subjectId: true, subject: { select: { boardId: true } } },
    });
    expect(candidates.length).toBeGreaterThan(0);

    let chosen = candidates[0];
    let chosenSections = 0;
    for (const candidate of candidates) {
      const res = await api(app, 'get', `/learning/chapters/${candidate.id}`, studentToken);
      if (res.status !== 200) continue;
      const sections = (res.body.concepts as Array<{ section: unknown }>).filter((c) => c.section).length;
      if (sections > 0) {
        chosen = candidate;
        chosenSections = sections;
        break;
      }
    }
    expect(chosenSections).toBeGreaterThan(0);

    chapterId = chosen.id;
    grade = chosen.grade;
    subjectId = chosen.subjectId;
    boardId = chosen.subject.boardId;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('numbers concepts in curriculum order', async () => {
    const res = await api(app, 'get', `/learning/chapters/${chapterId}`, studentToken);
    expect(res.status).toBe(200);

    expect(typeof res.body.order).toBe('number');
    expect(res.body.order).toBeGreaterThan(0);

    const concepts = res.body.concepts as Array<{ id: string; order: number }>;
    expect(concepts.length).toBeGreaterThan(0);
    const orders = concepts.map((c) => c.order);
    expect([...orders].sort((a, b) => a - b)).toEqual(orders);
    expect(new Set(orders).size).toBe(orders.length);
    for (const order of orders) expect(Number.isInteger(order)).toBe(true);
  });

  it('maps concepts to real, non-overlapping slices of the chapter video', async () => {
    const res = await api(app, 'get', `/learning/chapters/${chapterId}`, studentToken);
    expect(res.status).toBe(200);

    const videos = res.body.videos as Array<{
      contentId: string;
      durationSeconds: number | null;
      segments: Array<{ title: string; startSeconds: number }>;
    }>;
    const videoById = new Map(videos.map((v) => [v.contentId, v]));

    const sections = (res.body.concepts as Array<{
      id: string;
      section: {
        contentId: string;
        startSeconds: number;
        endSeconds: number;
        durationSeconds: number;
        derived: boolean;
      } | null;
    }>).filter((c) => c.section !== null);
    expect(sections.length).toBeGreaterThan(0);

    for (const concept of sections) {
      const section = concept.section!;
      const video = videoById.get(section.contentId);
      expect(video, `section points at a chapter video (${section.contentId})`).toBeTruthy();
      expect(section.startSeconds).toBeGreaterThanOrEqual(0);
      expect(section.endSeconds).toBeGreaterThan(section.startSeconds);
      expect(section.durationSeconds).toBe(section.endSeconds - section.startSeconds);
      expect(typeof section.derived).toBe('boolean');
      if (video?.durationSeconds) {
        expect(section.startSeconds).toBeLessThan(video.durationSeconds);
        expect(section.endSeconds).toBeLessThanOrEqual(video.durationSeconds);
      }
      // The slice must line up with a marker the player renders.
      expect(video!.segments.some((s) => s.startSeconds === section.startSeconds)).toBe(true);
    }

    // Slices of the same video never overlap and never run backwards.
    const byVideo = new Map<string, Array<{ start: number; end: number }>>();
    for (const concept of sections) {
      const s = concept.section!;
      const list = byVideo.get(s.contentId) ?? [];
      list.push({ start: s.startSeconds, end: s.endSeconds });
      byVideo.set(s.contentId, list);
    }
    for (const list of byVideo.values()) {
      const sorted = [...list].sort((a, b) => a.start - b.start);
      for (let i = 1; i < sorted.length; i += 1) {
        expect(sorted[i].start).toBeGreaterThanOrEqual(sorted[i - 1].end);
      }
    }
  });

  it('exposes a real chapter thumbnail on the chapter list', async () => {
    const res = await api(
      app,
      'get',
      `/learning/boards/${boardId}/grades/${grade}/subjects/${subjectId}/chapters`,
      studentToken,
    );
    expect(res.status).toBe(200);

    const items = res.body.chapters as Array<{ id: string; order: number; thumbnailUrl: string | null }>;
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(Number.isInteger(item.order)).toBe(true);
      expect(item).toHaveProperty('thumbnailUrl');
      if (item.thumbnailUrl) expect(item.thumbnailUrl).toMatch(/^https:\/\/i\.ytimg\.com\/vi\//);
    }
  });

  it('keeps sections out of another grade, just like the rest of the hub', async () => {
    const other = await prisma.chapter.findFirst({ where: { grade: { not: '8' } }, select: { id: true } });
    if (!other) return;
    const res = await api(app, 'get', `/learning/chapters/${other.id}`, scopedToken);
    expect([403, 404]).toContain(res.status);
  });
});
