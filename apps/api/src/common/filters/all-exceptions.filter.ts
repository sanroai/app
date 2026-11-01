import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { randomUUID } from 'node:crypto';
import { Request, Response } from 'express';

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
  requestId: string;
  statusCode: number;
  error?: string;
}

/**
 * Prisma rejects a value that must be a UUID but is not parseable as one. Depending
 * on the client version that surfaces either as a `P2023` known error or as an
 * unknown request error whose message starts `Inconsistent column data: Error
 * creating UUID`. Both mean the same thing - a client sent `not-a-uuid` on an
 * `:id` route - so both are treated as a bad request rather than a server fault.
 */
function isMalformedUuid(exception: unknown): boolean {
  if (typeof exception !== 'object' || exception === null) return false;
  const code = (exception as { code?: unknown }).code;
  if (code === 'P2023') return true;
  const message = (exception as { message?: unknown }).message;
  return typeof message === 'string' && /Inconsistent column data: Error creating UUID/i.test(message);
}

/**
 * Prisma throws P2002 when a write violates a unique constraint, e.g. creating a
 * second `AcademicYear` with the same name in the same institution
 * (`@@unique([institutionId, name])`). That is a client conflict, not a server fault —
 * surface it as 409 instead of leaking a 500. The schema declares 29 `@@unique`
 * constraints, so this applies broadly across create/update paths.
 */
function isUniqueViolation(exception: unknown): boolean {
  return (
    typeof exception === 'object' &&
    exception !== null &&
    (exception as { code?: unknown }).code === 'P2002'
  );
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    const body: ErrorBody = {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
      requestId,
      statusCode: status,
    };

    if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      body.code = 'RATE_LIMITED';
      body.message = 'Too many requests. Please try again later.';
      body.statusCode = status;
    } else if (exception instanceof ServiceUnavailableException) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      body.code = 'SERVICE_UNAVAILABLE';
      body.message = 'AI generation is temporarily unavailable.';
      body.statusCode = status;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        body.message = res;
        body.code = 'HTTP_ERROR';
      } else if (res && typeof res === 'object') {
        const obj = res as Record<string, unknown>;
        body.message = typeof obj.message === 'string' ? obj.message : JSON.stringify(obj.message);
        body.code = typeof obj.code === 'string' ? obj.code : 'HTTP_ERROR';
        body.details = obj.details ?? (Array.isArray(obj.message) ? obj.message : undefined);
        if (obj.error) body.error = String(obj.error);
      }
      body.statusCode = status;
    } else if (isMalformedUuid(exception)) {
      // Prisma P2023: a client-supplied `:id` was not a valid UUID. This is a bad
      // request, not a server fault — surface it as 400 instead of leaking a 500.
      status = HttpStatus.BAD_REQUEST;
      body.code = 'VALIDATION_ERROR';
      body.message = 'Invalid identifier: expected a UUID.';
      body.statusCode = status;
    } else if (isUniqueViolation(exception)) {
      // Prisma P2002: the write collided with a unique constraint (duplicate name,
      // email, code, …). Return 409 CONFLICT so clients can show a meaningful
      // "already exists" message instead of an opaque 500. The raw constraint
      // details (model/field values) are deliberately not echoed.
      status = HttpStatus.CONFLICT;
      body.code = 'CONFLICT';
      body.message = 'A record with the same unique values already exists.';
      body.statusCode = status;
    } else {
      const err = exception as Error;
      this.logger.error(
        `Unhandled exception: ${err?.message ?? 'unknown'} ${request.method} ${request.url}`,
        err?.stack,
      );
      if (process.env.NODE_ENV === 'development') {
        body.message = err?.message ?? 'Unknown error';
      }
    }

    response.status(status).json(body);
  }
}