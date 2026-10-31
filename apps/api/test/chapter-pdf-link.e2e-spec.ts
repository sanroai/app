import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { startTestApp, login, api, makePrisma, QA_PASSWORD, BASE } from './helpers';

/**
 * Contract: a browser or the platform PDF viewer cannot send the bearer token,
 * and Android's WebView cannot render PDFs at all - so the app mints a
 * short-lived signed link and hands it to the system viewer.
 *
 * The link must (1) work without an Authorization header, (2) be un-forgeable,
 * (3) be bound to one chapter, and (4) only be mintable by an authenticated,
 * grade-checked user.
 */
describe('Chapter PDF signed link (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let studentToken: string;
  let chapterId: string;
  let otherChapterId: string;

  /** Fetches a signed path with no Authorization header, returning the first bytes. */
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
      magic: body.subarray(0, 5).toString('latin1'),
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

    const other = await prisma.chapter.findFirst({ where: { id: { not: chapterId } }, orderBy: { order: 'asc' } });
    expect(other).toBeTruthy();
    otherChapterId = other!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('requires authentication to mint a link', async () => {
    const res = await api(app, 'post', `/learning/chapters/${chapterId}/pdf-link`, '');
    expect(res.status).toBe(401);
  });

  it('issues a link the platform viewer can open without a token', async () => {
    const minted = await api(app, 'post', `/learning/chapters/${chapterId}/pdf-link`, studentToken);
    expect([201, 404]).toContain(minted.status);
    if (minted.status === 404) return; // books are git-ignored: not on every machine

    expect(minted.body.path).toContain(chapterId);
    expect(minted.body.expiresAt).toBeTruthy();

    const file = await open(minted.body.path);
    expect(file.status).toBe(200);
    expect(file.contentType).toContain('application/pdf');
    expect(file.magic).toBe('%PDF-');
  });

  it('rejects a forged signature', async () => {
    const minted = await api(app, 'post', `/learning/chapters/${chapterId}/pdf-link`, studentToken);
    if (minted.status === 404) return;

    const res = await open(String(minted.body.path).replace(/sig=[^&]+/, 'sig=deadbeefdeadbeef'));
    expect(res.status).toBe(401);
  });

  it('rejects a link reused for another chapter', async () => {
    const minted = await api(app, 'post', `/learning/chapters/${chapterId}/pdf-link`, studentToken);
    if (minted.status === 404) return;

    const res = await open(String(minted.body.path).replace(chapterId, otherChapterId));
    expect(res.status).toBe(401);
  });

  it('rejects an expired link', async () => {
    const minted = await api(app, 'post', `/learning/chapters/${chapterId}/pdf-link`, studentToken);
    if (minted.status === 404) return;

    const res = await open(String(minted.body.path).replace(/exp=\d+/, 'exp=1'));
    expect(res.status).toBe(401);
  });
});
