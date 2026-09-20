import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';

export const QA_PASSWORD = 'Sanro@123';
export const BASE = '/api/v1';

export async function startTestApp(): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  await app.init();
  return app;
}

export function login(app: INestApplication, email: string, password: string) {
  return request(app.getHttpServer()).post(`${BASE}/auth/login`).send({ email, password });
}

export function api(app: INestApplication, method: 'get' | 'post' | 'patch', path: string, token: string, body?: unknown) {
  let req = request(app.getHttpServer())[method](`${BASE}${path}`);
  if (token) req = req.set('Authorization', `Bearer ${token}`);
  if (body !== undefined) req = req.send(body as Record<string, unknown>);
  return req;
}

export function createInstitution(app: INestApplication, token: string, body: Record<string, unknown>) {
  return api(app, 'post', '/admin/institutions', token, body);
}

export function makePrisma(): PrismaClient {
  return new PrismaClient();
}

export async function findUserId(client: PrismaClient, email: string): Promise<string | undefined> {
  const user = await client.user.findUnique({ where: { email: email.toLowerCase() } });
  return user?.id;
}

export async function setUserPassword(client: PrismaClient, email: string, password: string): Promise<void> {
  const hash = await bcrypt.hash(password, 10);
  await client.user.updateMany({ where: { email: email.toLowerCase() }, data: { passwordHash: hash, isActive: true } });
}

export async function fetchFirstPlanKey(client: PrismaClient): Promise<string> {
  const plan = await client.plan.findFirst({ where: { key: 'INSTITUTION', active: true } });
  return plan?.key ?? 'INSTITUTION';
}

export async function fetchAdminUserFor(client: PrismaClient, institutionId: string): Promise<{ id: string; email: string } | null> {
  const member = await client.institutionMember.findFirst({
    where: { institutionId, role: 'INSTITUTION_ADMIN' },
    include: { user: { select: { id: true, email: true } } },
    orderBy: { joinedAt: 'asc' },
  });
  return member ? { id: member.userId, email: member.user.email } : null;
}

/**
 * Removes every trace of a QA-created institution and its users.
 * Deletion order matters because of FK enforcement on non-cascading edges.
 */
export async function cleanupInstitution(client: PrismaClient, institutionId: string | undefined, userEmails: string[] = []): Promise<void> {
  if (!institutionId) return;
  await client.subscriptionHistory.deleteMany({ where: { institutionId } });
  await client.auditLog.deleteMany({ where: { institutionId } });
  await client.institutionMember.deleteMany({ where: { institutionId } });
  await client.parent.deleteMany({ where: { institutionId } });
  await client.student.deleteMany({ where: { institutionId } });
  await client.teacher.deleteMany({ where: { institutionId } });
  await client.subscription.deleteMany({ where: { institutionId } });
  await client.academicYear.deleteMany({ where: { institutionId } });
  await client.institution.deleteMany({ where: { id: institutionId } });
  if (userEmails.length) {
    const normalized = userEmails.map((e) => e.toLowerCase());
    await client.auditLog.deleteMany({ where: { user: { email: { in: normalized } } } });
    await client.user.deleteMany({ where: { email: { in: normalized } } });
  }
}

export function randomSuffix(): string {
  return String(Date.now()) + Math.floor(Math.random() * 1000);
}