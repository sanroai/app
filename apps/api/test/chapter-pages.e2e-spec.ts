import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { startTestApp, login, api, makePrisma, QA_PASSWORD, BASE } from './helpers';

/**
 * Contract: the chapter textbook is read as rendered page images, because an
 * Android WebView cannot render a PDF at all and a plain link only downloads it.
 *
 * The pages endpoint returns signed image URLs (so `<img>` / `<Image>` needs no
 * Authorization header), the public route validates the page index against the
 * files on disk, and the image must be embeddable from another origin - helmet's
 * default `Cross-Origin-Resource-Policy: same-origin` silently blocks it, which
 * is a regression this spec exists to catch.
 */
describe('Chapter textbook pages (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let studentToken: string;
  let chapterId: string;

  async function open(path: string) {
    const res = await request(app.getHttpServer())
      .get(`${BASE}${path.replace(/^\/api\/v1/, '')}`)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => callback(null, Buffer.concat(chunks)));
      });
    const body = Buffer.isBuffer(res.body) ? res.body : Buffer.alloc(0);
    return {
      status: res.status,
      contentType: String(res.headers['content-type'] ?? ''),
      resourcePolicy: String(res.headers['cross-origin-resource-policy'] ?? ''),
      png: body.subarray(1, 4).toString('latin1') === 'PNG',
    };
  }

  beforeAll(async () => {
    app = await startTestApp();
    prisma = makePrisma();

    const student = await login(app, 'student@sanroai.com', QA_PASSWORD);
    expect(student.status).toBe(200);
    studentToken = student.body.accessToken;

    const chapter = await prisma.chapter.findFirst({ where: { code: 'SCI-10-1' } });
    const fallback = chapter ?? (await prisma.chapter.findFirst({ orderBy: { order: 'asc' } }));
    expect(fallback).toBeTruthy();
    chapterId = fallback!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('requires authentication to list the pages', async () => {
    const res = await api(app, 'get', `/learning/chapters/${chapterId}/pages`, '');
    expect(res.status).toBe(401);
  });

  it('lists signed page URLs for an authenticated student', async () => {
    const res = await api(app, 'get', `/learning/chapters/${chapterId}/pages`, studentToken);
    expect(res.status).toBe(200);
    expect(typeof res.body.count).toBe('number');
    expect(res.body.expiresAt).toBeTruthy();
    expect(Array.isArray(res.body.pages)).toBe(true);
    // The books tree is git-ignored, so a machine without it legitimately has no
    // pages; every machine with the book must expose one URL per page.
    expect(res.body.pages.length).toBe(res.body.count);
    for (const page of res.body.pages) {
      expect(page.path).toContain(`/learning/pdf/${chapterId}/pages/${page.index}`);
      expect(page.path).toMatch(/exp=\d+/);
      expect(page.path).toMatch(/sig=[\w-]+/);
    }
  });

  it('serves each page as an embeddable PNG without a token', async () => {
    const listed = await api(app, 'get', `/learning/chapters/${chapterId}/pages`, studentToken);
    if (!listed.body.count) return; // no books on this machine

    const first = await open(String(listed.body.pages[0].path));
    expect(first.status).toBe(200);
    expect(first.contentType).toContain('image/png');
    expect(first.png).toBe(true);
    // Without this the web app cannot show the page at all (helmet defaults to
    // same-origin, and the app and the API are different origins).
    expect(first.resourcePolicy).toBe('cross-origin');

    const last = await open(String(listed.body.pages[listed.body.count - 1].path));
    expect(last.status).toBe(200);
  });

  it('rejects a page that does not exist', async () => {
    const listed = await api(app, 'get', `/learning/chapters/${chapterId}/pages`, studentToken);
    if (!listed.body.count) return;

    const beyond = String(listed.body.pages[0].path).replace(
      /pages\/\d+/,
      `pages/${listed.body.count + 1}`,
    );
    const res = await open(beyond);
    expect(res.status).toBe(404);
  });

  it('rejects a forged or re-bound page ticket', async () => {
    const listed = await api(app, 'get', `/learning/chapters/${chapterId}/pages`, studentToken);
    if (!listed.body.count) return;

    const forged = await open(String(listed.body.pages[0].path).replace(/sig=[^&]+/, 'sig=deadbeef'));
    expect(forged.status).toBe(401);

    const other = await prisma.chapter.findFirst({
      where: { id: { not: chapterId }, code: { startsWith: 'SCI-10' } },
      orderBy: { order: 'asc' },
    });
    if (other) {
      const rebound = await open(String(listed.body.pages[0].path).replace(chapterId, other.id));
      expect(rebound.status).toBe(401);
    }
  });

  it('does not let another grade read a chapter it is not assigned', async () => {
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { grade: true } });
    if (!chapter || chapter.grade === '8') return;

    const other = await login(app, 'student8@sanroai.com', QA_PASSWORD);
    if (other.status !== 200) return;

    const res = await api(app, 'get', `/learning/chapters/${chapterId}/pages`, other.body.accessToken);
    expect(res.status).toBe(403);
  });
});
