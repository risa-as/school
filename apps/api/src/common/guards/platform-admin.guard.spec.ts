import type { ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { PlatformAdminGuard } from './platform-admin.guard';

function makeContext(headers: Record<string, string> = {}): ExecutionContext {
  const request = { headers };
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

function makeConfig(value: string | undefined): ConfigService {
  return { get: jest.fn(() => value) } as unknown as ConfigService;
}

/** Regression test for QA finding #2 (HIGH) — POST /tenants was completely unguarded. */
describe('PlatformAdminGuard', () => {
  it('rejects when no key header is sent', () => {
    const guard = new PlatformAdminGuard(makeConfig('secret-key'));
    expect(() => guard.canActivate(makeContext())).toThrow(UnauthorizedException);
  });

  it('rejects when the provided key does not match', () => {
    const guard = new PlatformAdminGuard(makeConfig('secret-key'));
    expect(() => guard.canActivate(makeContext({ 'x-platform-admin-key': 'wrong-key' }))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a key of different length than the configured secret (no length-based bypass)', () => {
    const guard = new PlatformAdminGuard(makeConfig('secret-key'));
    expect(() => guard.canActivate(makeContext({ 'x-platform-admin-key': 'short' }))).toThrow(UnauthorizedException);
  });

  it('fails CLOSED when PLATFORM_ADMIN_API_KEY is unset — never silently opens the route', () => {
    const guard = new PlatformAdminGuard(makeConfig(undefined));
    expect(() => guard.canActivate(makeContext({ 'x-platform-admin-key': 'anything' }))).toThrow(
      UnauthorizedException,
    );
  });

  it('fails CLOSED when PLATFORM_ADMIN_API_KEY is an empty string', () => {
    const guard = new PlatformAdminGuard(makeConfig(''));
    expect(() => guard.canActivate(makeContext({ 'x-platform-admin-key': '' }))).toThrow(UnauthorizedException);
  });

  it('accepts a request bearing the exact configured key', () => {
    const guard = new PlatformAdminGuard(makeConfig('secret-key'));
    expect(guard.canActivate(makeContext({ 'x-platform-admin-key': 'secret-key' }))).toBe(true);
  });

  it('the thrown error carries a stable machine-readable code', () => {
    const guard = new PlatformAdminGuard(makeConfig('secret-key'));
    try {
      guard.canActivate(makeContext());
      fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(UnauthorizedException);
      expect((err as UnauthorizedException).getResponse()).toMatchObject({ code: 'PLATFORM_ADMIN_KEY_INVALID' });
    }
  });
});
