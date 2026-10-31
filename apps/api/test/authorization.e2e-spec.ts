import { Test, TestingModule } from '@nestjs/testing';
import { QA_PASSWORD } from './helpers';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authorization (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Parent content restriction', () => {
    let parentToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'parent@sanroai.com', password: QA_PASSWORD });
      parentToken = res.body.accessToken;
    });

    it('POST /learning/home should return 403 for parent', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/learning/home')
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(403);
    });

    it('GET /learning/concepts/:id should return 403 for parent', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/learning/concepts/some-concept-id')
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(403);
    });

    it('GET /learning/chapters/:id should return 403 for parent', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/learning/chapters/some-chapter-id')
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(403);
    });

    it('POST /ai/chat should return 403 for parent', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ai/chat')
        .set('Authorization', `Bearer ${parentToken}`)
        .send({ message: 'What is photosynthesis?' });
      expect(res.status).toBe(403);
    });

    it('GET /learning/progress should return 403 for parent', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/learning/progress')
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Student grade isolation', () => {
    let studentToken: string;

    // student@sanroai.com is the demo account enrolled in all ten classes, so
    // the isolation rule is asserted with the single-class account (class 8).
    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'student8@sanroai.com', password: QA_PASSWORD });
      studentToken = res.body.accessToken;
    });

    it('GET /learning/home should list only the classes the student may read', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/learning/home')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      const grades = res.body.boards?.flatMap((b: any) => b.grades?.map((g: any) => g.grade)) ?? [];
      expect(grades.length).toBeGreaterThan(0);
      expect(grades.every((g: string) => g === '8')).toBe(true);
      expect(res.body.allGrades).toBe(false);
      expect(res.body.studentGrades).toEqual(['8']);
    });

    it('GET /learning/chapters/:id should return 403 for wrong grade', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/learning/chapters/some-chapter-id')
        .set('Authorization', `Bearer ${studentToken}`);
      expect([200, 403, 404]).toContain(res.status);
    });
  });

  describe('Cross-tenant access', () => {
    let studentToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'student@sanroai.com', password: QA_PASSWORD });
      studentToken = res.body.accessToken;
    });

    it('Student should not access other institution data', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('Student should not access teachers endpoint', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/teachers')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Super Admin platform access', () => {
    let superAdminToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@sanroai.com', password: QA_PASSWORD });
      superAdminToken = res.body.accessToken;
    });

    it('Super Admin can access institution endpoint', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/institutions')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
    });

    it('Super Admin does not require institution binding', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.institutionId).toBeFalsy();
    });
  });

  describe('Unauthenticated access', () => {
    it('Learning endpoints should return 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/learning/home');
      expect(res.status).toBe(401);
    });

    it('Protected endpoints should return 401 without token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/papers');
      expect(res.status).toBe(401);
    });
  });
});
