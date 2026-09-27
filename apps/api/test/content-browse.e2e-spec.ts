import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { startTestApp, login, api, makePrisma, QA_PASSWORD } from './helpers';

/**
 * Contract: the Library menu is a browsable index of lesson content —
 * paginated, filterable by type/chapter/search, with facet counts, and
 * scoped to what the caller is allowed to see.
 */
describe('Library content browse (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let studentToken: string;
  let adminToken: string;

  beforeAll(async () => {
    app = await startTestApp();
    prisma = makePrisma();

    const student = await login(app, 'student@sanroai.com', QA_PASSWORD);
    expect(student.status).toBe(200);
    studentToken = student.body.accessToken;

    const admin = await login(app, 'admin@sanroai.com', QA_PASSWORD);
    expect(admin.status).toBe(200);
    adminToken = admin.body.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('requires authentication', async () => {
    const res = await api(app, 'get', '/content/browse', '');
    expect(res.status).toBe(401);
  });

  it('returns a paginated payload with facet counts', async () => {
    const res = await api(app, 'get', '/content/browse?pageSize=5', studentToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeLessThanOrEqual(5);
    expect(res.body.total).toBeGreaterThanOrEqual(res.body.items.length);
    expect(res.body.page).toBe(1);
    expect(res.body.pageCount).toBe(Math.max(Math.ceil(res.body.total / 5), 1));

    expect(res.body.facets).toHaveProperty('byType');
    expect(res.body.facets).toHaveProperty('byChapter');
    expect(Array.isArray(res.body.facets.byChapter)).toBe(true);

    for (const item of res.body.items) {
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('type');
      expect(item).toHaveProperty('chapterId');
    }
  });

  it('only exposes content the caller may see', async () => {
    const student = await api(app, 'get', '/content/browse?pageSize=100', studentToken);
    const admin = await api(app, 'get', '/content/browse?pageSize=100', adminToken);
    expect(student.status).toBe(200);
    expect(admin.status).toBe(200);

    for (const item of student.body.items) {
      expect(['APPROVED', 'PUBLISHED']).toContain(item.status);
    }
    expect(admin.body.total).toBeGreaterThanOrEqual(student.body.total);
  });

  it('filters by content type', async () => {
    const all = await api(app, 'get', '/content/browse?pageSize=100', studentToken);
    const type = Object.keys(all.body.facets.byType)[0];
    if (!type) return;

    const res = await api(app, 'get', `/content/browse?type=${type}&pageSize=100`, studentToken);
    expect(res.status).toBe(200);
    expect(res.body.items.every((i: { type: string }) => i.type === type)).toBe(true);
    expect(res.body.total).toBe(all.body.facets.byType[type]);
  });

  it('filters by chapter and reports chapter facets', async () => {
    const all = await api(app, 'get', '/content/browse?pageSize=100', studentToken);
    const facet = all.body.facets.byChapter[0];
    if (!facet) return;

    const res = await api(app, 'get', `/content/browse?chapterId=${facet.chapterId}&pageSize=100`, studentToken);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(facet.count);
    expect(res.body.items.every((i: { chapterId: string }) => i.chapterId === facet.chapterId)).toBe(true);
    expect(res.body.facets.byChapter).toHaveLength(1);
    expect(res.body.facets.byChapter[0].name).toBe(facet.name);
  });

  it('filters by search term', async () => {
    const all = await api(app, 'get', '/content/browse?pageSize=100', studentToken);
    const seed = all.body.items.find((i: { title: string }) => i.title.length >= 4);
    if (!seed) return;
    const needle = seed.title.slice(0, 4);

    const res = await api(app, 'get', `/content/browse?search=${encodeURIComponent(needle)}&pageSize=100`, studentToken);
    expect(res.status).toBe(200);
    for (const item of res.body.items) {
      expect(`${item.title} ${item.description ?? ''}`.toLowerCase()).toContain(needle.toLowerCase());
    }
  });

  it('rejects an unknown content type', async () => {
    const res = await api(app, 'get', '/content/browse?type=NOT_A_TYPE', studentToken);
    expect(res.status).toBe(400);
  });

  it('rejects an out-of-range page size', async () => {
    const res = await api(app, 'get', '/content/browse?pageSize=999', studentToken);
    expect(res.status).toBe(400);
  });

  it('pages through the same result set without overlap', async () => {
    const first = await api(app, 'get', '/content/browse?pageSize=3&page=1&sort=title', studentToken);
    const second = await api(app, 'get', '/content/browse?pageSize=3&page=2&sort=title', studentToken);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const firstIds = first.body.items.map((i: { id: string }) => i.id);
    const secondIds = second.body.items.map((i: { id: string }) => i.id);
    expect(firstIds.filter((id: string) => secondIds.includes(id))).toHaveLength(0);

    const titles = [...first.body.items, ...second.body.items].map((i: { title: string }) => i.title);
    expect([...titles].sort((a, b) => a.localeCompare(b))).toEqual(titles);
  });

  it('does not shadow the content detail route', async () => {
    const res = await api(app, 'get', '/content/browse', studentToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).not.toHaveProperty('progress');
  });
});
