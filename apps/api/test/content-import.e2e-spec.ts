import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
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
 * Contract: CONTENT and QUESTIONS are first-class import entity types.
 * A CSV is validated (syntax + curriculum resolution) at preview time, then
 * materialised into ContentItem / Question rows on commit — with no seat-limit
 * consumption, duplicate detection, and MCQ option wiring.
 */

const CONTENT_HEADER = [
  'type',
  'title',
  'description',
  'board',
  'grade',
  'subject',
  'chapter',
  'topic',
  'concept',
  'url',
  'order',
  'status',
  'language',
];

const QUESTION_HEADER = [
  'type',
  'text',
  'options',
  'answer',
  'difficulty',
  'marks',
  'board',
  'grade',
  'subject',
  'chapter',
  'topic',
  'concept',
  'hint',
  'explanation',
];

function csv(header: string[], rows: string[][]): Buffer {
  const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = [header.join(','), ...rows.map((r) => r.map(escape).join(','))];
  return Buffer.from(`${lines.join('\n')}\n`, 'utf8');
}

function upload(app: INestApplication, token: string, entityType: string, body: Record<string, string>, buffer: Buffer) {
  let req = request(app.getHttpServer())
    .post(`${BASE}/imports/upload`)
    .set('Authorization', `Bearer ${token}`)
    .field('entityType', entityType);
  for (const [k, v] of Object.entries(body)) req = req.field(k, v);
  return req.attach('file', buffer, `${entityType.toLowerCase()}.csv`);
}

describe('CONTENT + QUESTIONS import (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let superAdminToken: string;
  let studentToken: string;
  let instId: string;
  let yearId: string;
  let adminEmail: string;
  let chapterName: string;

  const contentBuffer = (chapter: string) =>
    csv(CONTENT_HEADER, [
      ['NOTES', 'Laws of Reflection - Study Note', 'Angle of incidence equals angle of reflection', 'CBSE', '10', 'Science', chapter, '', '', '', '1', 'APPROVED', 'EN'],
      ['VIDEO', 'Reflection of Light - Video Lesson', '', 'CBSE', '10', 'Science', chapter, '', '', 'https://www.youtube.com/watch?v=demo', '2', 'APPROVED', 'EN'],
      ['NOT_A_TYPE', 'Broken Type Row', '', 'CBSE', '10', 'Science', chapter, '', '', '', '', '', ''],
      ['NOTES', 'Ghost Chapter Row', '', 'CBSE', '10', 'Science', 'Ghost Chapter', '', '', '', '', '', ''],
      ['NOTES', 'Ghost Board Row', '', 'NOPE', '10', 'Science', chapter, '', '', '', '', '', ''],
      ['NOTES', 'Concept Without Topic', '', 'CBSE', '10', 'Science', chapter, '', 'Laws of Reflection', '', '', '', ''],
    ]);

  const questionBuffer = (chapter: string) =>
    csv(QUESTION_HEADER, [
      ['MCQ', 'In reflection of light the angle of incidence is', 'equal to the angle of reflection|greater than the angle of reflection|half the angle of reflection|always zero', 'equal to the angle of reflection', 'MEDIUM', '1', 'CBSE', '10', 'Science', chapter, '', '', '', ''],
      ['SHORT_ANSWER', 'State the laws of reflection of light', '', 'The angle of incidence equals the angle of reflection', 'MEDIUM', '2', 'CBSE', '10', 'Science', chapter, '', '', '', ''],
      ['MCQ', 'Row with no answer at all', 'alpha|beta', '', 'EASY', '1', 'CBSE', '10', 'Science', chapter, '', '', '', ''],
      ['MCQ', 'Row whose answer matches nothing', 'alpha|beta|gamma', 'omega', 'EASY', '1', 'CBSE', '10', 'Science', chapter, '', '', '', ''],
    ]);

  beforeAll(async () => {
    app = await startTestApp();
    prisma = makePrisma();

    const admin = await login(app, 'admin@sanroai.com', QA_PASSWORD);
    expect(admin.status).toBe(200);
    superAdminToken = admin.body.accessToken;

    const student = await login(app, 'student@sanroai.com', QA_PASSWORD);
    expect(student.status).toBe(200);
    studentToken = student.body.accessToken;

    adminEmail = `cimpu${randomSuffix()}@qa.test`;
    const institution = await api(app, 'post', '/admin/institutions', superAdminToken, {
      name: `QA Content Import ${randomSuffix()}`,
      type: 'SCHOOL',
      code: `C${randomSuffix()}`.slice(0, 20),
      adminName: 'QA Content Import Admin',
      adminEmail,
      adminPassword: QA_PASSWORD,
      planKey: await fetchFirstPlanKey(prisma),
    });
    expect(institution.status).toBe(201);
    instId = institution.body.institution.id;
    await setUserPassword(prisma, adminEmail, QA_PASSWORD);

    await api(app, 'post', `/admin/institutions/${instId}/subscription`, superAdminToken, {
      planKey: await fetchFirstPlanKey(prisma),
      status: 'ACTIVE',
      seatLimit: 100,
    });

    const adminLogin = await login(app, adminEmail, QA_PASSWORD);
    expect(adminLogin.status).toBe(200);
    const year = await api(app, 'post', '/academics/academic-years', adminLogin.body.accessToken, {
      name: `AY-${randomSuffix()}`,
      startDate: '2026-04-01',
      endDate: '2027-03-31',
    });
    expect(year.status).toBeLessThan(400);
    yearId = year.body.id;

    const board = await prisma.board.findFirst({ where: { code: 'CBSE' } });
    const subject = board ? await prisma.subject.findFirst({ where: { boardId: board.id, name: 'Science' } }) : null;
    const chapter =
      subject ? await prisma.chapter.findFirst({ where: { subjectId: subject.id, grade: '10' }, orderBy: { order: 'asc' } }) : null;
    if (!chapter) throw new Error('QA seed is missing a grade-10 Science chapter');
    chapterName = chapter.name;
  });

  afterAll(async () => {
    await prisma.question.deleteMany({ where: { institutionId: instId } });
    await prisma.contentItem.deleteMany({ where: { institutionId: instId } });
    await prisma.importJob.deleteMany({ where: { institutionId: instId } });
    await cleanupInstitution(prisma, instId, [adminEmail]);
    await prisma.$disconnect();
    await app.close();
  });

  it('rejects an unsupported entity type', async () => {
    const res = await upload(app, superAdminToken, 'CLASSES', { academicYearId: yearId, institutionId: instId }, csv(['name'], [['Someone']]));
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain('Unsupported entity type');
  });

  it('rejects uploads from students', async () => {
    const res = await upload(app, studentToken, 'CONTENT', { academicYearId: yearId }, contentBuffer(chapterName));
    expect(res.status).toBe(403);
  });

  it('previews CONTENT with syntax and curriculum errors surfaced per row', async () => {
    const res = await upload(app, superAdminToken, 'CONTENT', { academicYearId: yearId, institutionId: instId }, contentBuffer(chapterName));
    expect(res.status).toBe(201);
    expect(res.body.entityType).toBe('CONTENT');
    expect(res.body.totalRows).toBe(6);
    expect(res.body.validRows).toBe(2);
    expect(res.body.invalidRows).toBe(4);

    const joined = res.body.errors.join(' | ');
    expect(joined).toContain('Unknown content type "NOT_A_TYPE"');
    expect(joined).toContain('Chapter "Ghost Chapter" not found');
    expect(joined).toContain('Board "NOPE" not found');
    expect(joined).toContain('"concept" requires a "topic"');
  });

  it('commits valid CONTENT rows into institution-scoped ContentItems', async () => {
    const preview = await upload(app, superAdminToken, 'CONTENT', { academicYearId: yearId, institutionId: instId }, contentBuffer(chapterName));
    const commit = await api(app, 'post', `/imports/${preview.body.jobId}/commit`, superAdminToken);
    expect(commit.status).toBe(201);
    expect(commit.body).toEqual({ imported: 2, duplicates: 0, errors: [] });

    const items = await prisma.contentItem.findMany({ where: { institutionId: instId } });
    expect(items).toHaveLength(2);

    const video = items.find((i) => i.type === 'VIDEO');
    expect(video?.status).toBe('APPROVED');
    expect(video?.url).toBe('https://www.youtube.com/watch?v=demo');
    expect(video?.ownerType).toBe('INSTITUTION');
    expect(video?.visibility).toBe('INSTITUTION_ONLY');
    expect(video?.grade).toBe('10');
    expect(video?.chapterId).toBeTruthy();
    expect(video?.publishedAt).toBeNull();

    for (const item of items) {
      expect(['NOTES', 'VIDEO']).toContain(item.type);
      expect(item.institutionId).toBe(instId);
    }
  });

  it('marks repeated CONTENT rows as duplicates instead of re-inserting', async () => {
    const preview = await upload(app, superAdminToken, 'CONTENT', { academicYearId: yearId, institutionId: instId }, contentBuffer(chapterName));
    const commit = await api(app, 'post', `/imports/${preview.body.jobId}/commit`, superAdminToken);
    expect(commit.status).toBe(201);
    expect(commit.body.imported).toBe(0);
    expect(commit.body.duplicates).toBe(2);

    expect(await prisma.contentItem.count({ where: { institutionId: instId } })).toBe(2);
  });

  it('previews QUESTIONS with answer/option validation', async () => {
    const res = await upload(app, superAdminToken, 'QUESTIONS', { academicYearId: yearId, institutionId: instId }, questionBuffer(chapterName));
    expect(res.status).toBe(201);
    expect(res.body.entityType).toBe('QUESTIONS');
    expect(res.body.totalRows).toBe(4);
    expect(res.body.validRows).toBe(2);
    expect(res.body.invalidRows).toBe(2);

    const joined = res.body.errors.join(' | ');
    expect(joined).toContain('Answer is required');
    expect(joined).toContain('does not match any option');
  });

  it('commits QUESTIONS with wired MCQ options and IMPORT source', async () => {
    const preview = await upload(app, superAdminToken, 'QUESTIONS', { academicYearId: yearId, institutionId: instId }, questionBuffer(chapterName));
    const commit = await api(app, 'post', `/imports/${preview.body.jobId}/commit`, superAdminToken);
    expect(commit.status).toBe(201);
    expect(commit.body).toEqual({ imported: 2, duplicates: 0, errors: [] });

    const mcq = await prisma.question.findFirst({
      where: { institutionId: instId, type: 'MCQ' },
      include: { options: { orderBy: { order: 'asc' } } },
    });
    expect(mcq).toBeTruthy();
    expect(mcq?.source).toBe('IMPORT');
    expect(mcq?.status).toBe('APPROVED');
    expect(mcq?.answer).toBe('equal to the angle of reflection');
    expect(mcq?.chapterId).toBeTruthy();
    expect(mcq?.options).toHaveLength(4);
    expect(mcq?.options.filter((o) => o.isCorrect)).toHaveLength(1);
    expect(mcq?.options.find((o) => o.isCorrect)?.text).toBe('equal to the angle of reflection');

    const short = await prisma.question.findFirst({ where: { institutionId: instId, type: 'SHORT_ANSWER' } });
    expect(short?.marks).toBe(2);
    expect(await prisma.questionOption.count({ where: { questionId: short!.id } })).toBe(0);
  });

  it('does not consume seats when importing content or questions', async () => {
    const jobs = await prisma.importJob.findMany({ where: { institutionId: instId }, select: { entityType: true } });
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs.every((j) => j.entityType === 'CONTENT' || j.entityType === 'QUESTIONS')).toBe(true);

    const members = await prisma.institutionMember.count({ where: { institutionId: instId } });
    expect(members).toBe(1);
  });

  it('records CONTENT and QUESTIONS jobs in the import history', async () => {
    const res = await api(app, 'get', '/imports', superAdminToken);
    expect(res.status).toBe(200);
    const types = res.body.map((j: { entityType: string }) => j.entityType);
    expect(types).toContain('CONTENT');
    expect(types).toContain('QUESTIONS');
  });
});
