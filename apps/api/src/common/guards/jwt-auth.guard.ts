import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { TenantContext } from '../tenant-context/tenant-context';
import { ErrorCode } from '../errors/error-codes';
import type { JwtAccessPayload } from '../../auth/types/jwt-payload.type';

interface RequestWithUser extends Request {
  user?: JwtAccessPayload;
}

/**
 * Verifies the `Authorization: Bearer <token>` access token and attaches the
 * decoded payload to `request.user`. Deliberately hand-rolled (no
 * @nestjs/passport) to keep the auth surface small and easy to audit.
 *
 * Critically, this ALSO rejects the token if `payload.tenantId` does not
 * match the tenant bound by TenantContextMiddleware for this request. Without
 * this check, a token issued for school A remains structurally valid forever
 * and PermissionsGuard would authorize it using A's permissions on whatever
 * `X-Tenant-Id` the caller sends — including school B. The Prisma extension
 * would then faithfully (and dangerously) scope every query to B. Login only
 * ever issues a token for a school the user has an ACTIVE membership in; this
 * guard is what makes sure that binding is actually enforced on every
 * subsequent request, not just at issue time.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_REQUIRED,
        message: 'يجب تسجيل الدخول للوصول لهذا المورد',
      });
    }

    let payload: JwtAccessPayload;
    try {
      payload = this.jwtService.verify<JwtAccessPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException({
        code: ErrorCode.SESSION_EXPIRED,
        message: 'انتهت صلاحية الجلسة، الرجاء تسجيل الدخول من جديد',
      });
    }

    if (payload.tenantId !== TenantContext.tenantId) {
      throw new UnauthorizedException({
        code: ErrorCode.SESSION_TENANT_MISMATCH,
        message: 'الجلسة غير صالحة لهذه المدرسة، الرجاء تسجيل الدخول من جديد',
      });
    }

    request.user = payload;
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header) return undefined;
    const [scheme, token] = header.split(' ');
    return scheme === 'Bearer' ? token : undefined;
  }
}
