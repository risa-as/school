import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { TenantContextMissingError } from '../tenant-context/tenant-context';
import { ErrorCode } from '../errors/error-codes';

export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
  errors: string[];
}

/**
 * Every error thrown anywhere in the app lands here and is normalized into
 * `{ statusCode, code, message, errors[] }` per docs/ARCHITECTURE.md, so API
 * consumers (the Next.js app, mobile apps) never have to branch on
 * framework-specific error shapes.
 *
 * `code` is a stable, machine-readable identifier (see
 * common/errors/error-codes.ts) the 3-locale (ar/ckb/en) frontend maps
 * through its own dictionaries; `message` stays the Arabic default string
 * for now. Services attach a code by throwing
 * `new XxxException({ code, message })` — the filter reads `record.code`
 * when present, and otherwise falls back to a generic code derived from the
 * HTTP status so nothing ships without SOME machine-readable code.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    const body = this.toApiErrorBody(exception);

    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(body.statusCode).json(body);
  }

  private toApiErrorBody(exception: unknown): ApiErrorBody {
    if (exception instanceof TenantContextMissingError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: ErrorCode.TENANT_CONTEXT_MISSING,
        message: exception.message,
        errors: [],
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        return { statusCode: status, code: fallbackCodeForStatus(status), message: payload, errors: [] };
      }

      if (typeof payload === 'object' && payload !== null) {
        const record = payload as Record<string, unknown>;
        const rawMessage = record.message;
        const explicitCode = typeof record.code === 'string' ? record.code : undefined;

        if (Array.isArray(rawMessage)) {
          // class-validator ValidationPipe shape: message is string[]
          return {
            statusCode: status,
            code: explicitCode ?? ErrorCode.VALIDATION_ERROR,
            message: 'خطأ في التحقق من البيانات',
            errors: rawMessage.map(String),
          };
        }

        return {
          statusCode: status,
          code: explicitCode ?? fallbackCodeForStatus(status),
          message: typeof rawMessage === 'string' ? rawMessage : exception.message,
          errors: Array.isArray(record.errors) ? (record.errors as string[]) : [],
        };
      }

      return { statusCode: status, code: fallbackCodeForStatus(status), message: exception.message, errors: [] };
    }

    const message = exception instanceof Error ? exception.message : 'حدث خطأ غير متوقع';
    return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, code: ErrorCode.INTERNAL_ERROR, message, errors: [] };
  }
}

/** Generic fallback when an exception was not constructed with an explicit `code`. */
function fallbackCodeForStatus(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return ErrorCode.BAD_REQUEST;
    case HttpStatus.UNAUTHORIZED:
      return ErrorCode.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return ErrorCode.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return ErrorCode.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return ErrorCode.CONFLICT;
    default:
      return status >= HttpStatus.INTERNAL_SERVER_ERROR ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST;
  }
}
