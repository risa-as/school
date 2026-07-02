import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TenantContext } from '../tenant-context/tenant-context';
import type { JwtAccessPayload } from '../../auth/types/jwt-payload.type';

function makeContext(headers: Record<string, string> = {}): { context: ExecutionContext; request: Record<string, unknown> } {
  const request: Record<string, unknown> = { headers };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

const payload: JwtAccessPayload = {
  sub: 'user-1',
  tenantId: 'school-a',
  membershipId: 'membership-1',
  roleId: 'role-1',
  permissions: ['students.read'],
};

describe('JwtAuthGuard', () => {
  function makeGuard(verifyResult: JwtAccessPayload | (() => never)) {
    const jwtService = {
      verify: jest.fn(() => {
        if (typeof verifyResult === 'function') return verifyResult();
        return verifyResult;
      }),
    } as unknown as JwtService;
    const configService = { get: jest.fn(() => 'secret') } as unknown as ConfigService;
    return new JwtAuthGuard(jwtService, configService);
  }

  it('throws UnauthorizedException when no Authorization header is present', () => {
    const guard = makeGuard(payload);
    const { context } = makeContext();
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the token fails verification', () => {
    const guard = makeGuard(() => {
      throw new Error('bad signature');
    });
    const { context } = makeContext({ authorization: 'Bearer bad-token' });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects a structurally valid token whose tenantId does not match the request tenant', () => {
    const guard = makeGuard(payload); // token issued for "school-a"
    const { context } = makeContext({ authorization: 'Bearer valid-token' });

    TenantContext.run({ tenantId: 'school-b' }, () => {
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });

  it('rejects a valid token when no X-Tenant-Id was supplied at all', () => {
    const guard = makeGuard(payload);
    const { context } = makeContext({ authorization: 'Bearer valid-token' });

    TenantContext.run({ tenantId: undefined }, () => {
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });

  it('accepts a valid token whose tenantId matches the request tenant, and attaches request.user', () => {
    const guard = makeGuard(payload);
    const { context, request } = makeContext({ authorization: 'Bearer valid-token' });

    TenantContext.run({ tenantId: 'school-a' }, () => {
      expect(guard.canActivate(context)).toBe(true);
    });

    expect(request.user).toEqual(payload);
  });
});
