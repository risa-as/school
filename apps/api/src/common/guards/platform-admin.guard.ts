import { timingSafeEqual } from 'node:crypto';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { ErrorCode } from '../errors/error-codes';

const API_KEY_HEADER = 'x-platform-admin-key';

/**
 * Guards platform-level routes (currently just school/tenant creation) that
 * cannot use JwtAuthGuard/PermissionsGuard — there is no Membership/Role for
 * a school that doesn't exist yet. This is a stopgap shared-secret check,
 * not real platform-admin auth (that's a later phase); it exists only to
 * close the "anyone can POST /tenants" hole today.
 *
 * Deliberately fails CLOSED: if PLATFORM_ADMIN_API_KEY is unset or empty in
 * this environment, every request is rejected rather than silently letting
 * the route through unguarded (the exact bug this guard exists to fix).
 * Compares with `timingSafeEqual` to avoid leaking the secret via response
 * timing.
 */
@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers[API_KEY_HEADER];
    const expected = this.config.get<string>('PLATFORM_ADMIN_API_KEY');

    if (!expected || typeof provided !== 'string' || !constantTimeEquals(provided, expected)) {
      throw new UnauthorizedException({
        code: ErrorCode.PLATFORM_ADMIN_KEY_INVALID,
        message: 'مفتاح إدارة المنصة غير صالح',
      });
    }

    return true;
  }
}

function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
