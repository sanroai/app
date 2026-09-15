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
    } else if (exception instanceof ServiceUnavailableException) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      body.code = 'SERVICE_UNAVAILABLE';
      body.message = 'AI generation is temporarily unavailable.';
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