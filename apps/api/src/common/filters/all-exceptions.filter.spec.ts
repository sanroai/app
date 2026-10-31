import { describe, expect, it } from 'vitest';
import { ArgumentsHost, ForbiddenException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

/** Builds a minimal ArgumentsHost that captures the JSON the filter writes. */
function makeHost() {
  const captured: { status?: number; body?: unknown } = {};
  const response = {
    status(code: number) {
      captured.status = code;
      return this;
    },
    json(body: unknown) {
      captured.body = body;
      return this;
    },
  };
  const request = { method: 'GET', url: '/api/v1/students/not-a-uuid' };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return { host, captured };
}

interface ErrorBody {
  code: string;
  message: string;
  statusCode: number;
  requestId: string;
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('maps Prisma P2023 (malformed UUID) to 400, not 500', () => {
    const { host, captured } = makeHost();
    const prismaError = Object.assign(
      new Error(
        'Error creating UUID, invalid character: expected an optional prefix of `urn:uuid:` followed by [0-9a-fA-F-], found `j` at 1',
      ),
      { code: 'P2023', clientVersion: '6.19.3' },
    );

    filter.catch(prismaError, host);

    expect(captured.status).toBe(400);
    const body = captured.body as ErrorBody;
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.statusCode).toBe(400);
    expect(body.message).toMatch(/invalid identifier/i);
    // must not leak the raw Prisma message or a 500
    expect(body.message).not.toMatch(/urn:uuid/);
    expect(body.code).not.toBe('INTERNAL_ERROR');
  });

  it('maps Prisma P2002 (unique-constraint violation) to 409, not 500', () => {
    const { host, captured } = makeHost();
    const prismaError = Object.assign(
      new Error(
        'Unique constraint failed on the fields: (`institutionId`,`name`)',
      ),
      { code: 'P2002', clientVersion: '6.19.3', meta: { target: ['institutionId', 'name'] } },
    );

    filter.catch(prismaError, host);

    expect(captured.status).toBe(409);
    const body = captured.body as ErrorBody;
    expect(body.code).toBe('CONFLICT');
    expect(body.statusCode).toBe(409);
    expect(body.message).toMatch(/already exists/i);
    // must not leak the raw Prisma constraint details or a 500
    expect(body.message).not.toMatch(/institutionId|Unique constraint/);
    expect(body.code).not.toBe('INTERNAL_ERROR');
  });

  it('genuine server faults (non-P2002/P2023) still return 500', () => {
    const { host, captured } = makeHost();
    // A P2025 (record not found) is NOT remapped here; services should translate it,
    // but if it escapes it remains a 500 rather than being silently masked as a conflict.
    const notFound = Object.assign(new Error('Record to update not found.'), {
      code: 'P2025',
      clientVersion: '6.19.3',
    });
    filter.catch(notFound, host);
    expect(captured.status).toBe(500);
    expect((captured.body as ErrorBody).code).toBe('INTERNAL_ERROR');
  });

  it('still returns 500 INTERNAL_ERROR for genuine server faults', () => {
    const { host, captured } = makeHost();
    filter.catch(new Error('connection pool exhausted'), host);

    expect(captured.status).toBe(500);
    const body = captured.body as ErrorBody;
    expect(body.code).toBe('INTERNAL_ERROR');
  });

  it('never leaks an internal error message from a non-HttpException', () => {
    const { host, captured } = makeHost();
    filter.catch(new Error('secret internal detail'), host);

    const body = captured.body as ErrorBody;
    expect(body.message).not.toContain('secret internal detail');
  });

  it('passes through HttpException status and code', () => {
    const { host, captured } = makeHost();
    filter.catch(
      new ForbiddenException({ code: 'FORBIDDEN', message: 'No access to this class' }),
      host,
    );
    expect(captured.status).toBe(403);
    expect((captured.body as ErrorBody).code).toBe('FORBIDDEN');
    expect((captured.body as ErrorBody).message).toBe('No access to this class');
  });
});
