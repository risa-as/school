import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { JwtAccessPayload } from '../../auth/types/jwt-payload.type';

interface RequestWithUser {
  user?: JwtAccessPayload;
}

/** Injects the JWT access payload attached by JwtAuthGuard into a controller method param. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtAccessPayload | undefined => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  return request.user;
});
