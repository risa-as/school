import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ErrorCode } from '../errors/error-codes';
import type { JwtAccessPayload } from '../../auth/types/jwt-payload.type';

interface RequestWithUser extends Request {
  user?: JwtAccessPayload;
}

/**
 * Must run after JwtAuthGuard (relies on request.user). Checks the route's
 * required `@Permissions(...)` keys against the caller's permission keys,
 * which were baked into the access token at login from
 * Role -> RolePermission -> Permission.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const granted = new Set(request.user?.permissions ?? []);
    const hasAll = required.every((permission) => granted.has(permission));

    if (!hasAll) {
      throw new ForbiddenException({
        code: ErrorCode.PERMISSION_DENIED,
        message: 'لا تملك الصلاحية اللازمة لتنفيذ هذا الإجراء',
      });
    }

    return true;
  }
}
