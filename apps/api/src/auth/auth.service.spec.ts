import { createHash } from 'node:crypto';
import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { TenantContext } from '../common/tenant-context/tenant-context';
import type { PrismaService } from '../prisma/prisma.service';

function sha256(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

interface FakeToken {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenHash: string | null;
}

const FUTURE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const PAST_REVOKE = new Date(Date.now() - 60 * 60 * 1000);

function makeHarness(tokens: FakeToken[]) {
  const store = new Map<string, FakeToken>(tokens.map((t) => [t.tokenHash, t]));

  const findUnique = jest.fn((args: { where: { tokenHash: string } }) =>
    Promise.resolve(store.get(args.where.tokenHash) ?? null),
  );
  const update = jest.fn((args: { where: { tokenHash: string }; data: Partial<FakeToken> }) => {
    const existing = store.get(args.where.tokenHash);
    if (!existing) throw new Error('not found');
    const merged = { ...existing, ...args.data };
    store.set(args.where.tokenHash, merged);
    return Promise.resolve(merged);
  });
  const create = jest.fn((args: { data: { userId: string; tokenHash: string; expiresAt: Date } }) => {
    const record: FakeToken = { ...args.data, revokedAt: null, replacedByTokenHash: null };
    store.set(args.data.tokenHash, record);
    return Promise.resolve(record);
  });

  const membershipFindFirst = jest.fn().mockResolvedValue({
    id: 'membership-1',
    roleId: 'role-1',
    role: { key: 'owner', rolePermissions: [{ permission: { key: 'students.read' } }] },
  });
  const findUniqueOrThrow = jest.fn().mockResolvedValue({ id: 'user-1', fullName: 'مستخدم', locale: 'ar' });

  const prisma = {
    client: {
      refreshToken: { findUnique, update, create },
      membership: { findFirst: membershipFindFirst },
      user: { findUniqueOrThrow },
    },
  } as unknown as PrismaService;

  const jwt = { sign: jest.fn(() => 'signed-access-token') } as unknown as JwtService;
  const config = {
    get: jest.fn((key: string, fallback?: unknown) => fallback),
  } as unknown as ConfigService;

  const service = new AuthService(prisma, jwt, config);
  return { service, store, findUnique, update, create };
}

/** Regression test for QA finding #3 (MEDIUM) — refresh-token reuse had no theft detection. */
describe('AuthService.refresh — reuse detection', () => {
  it('revokes the entire descendant chain when a revoked (already-rotated) token is replayed', async () => {
    const rawA = 'raw-token-a';
    const hashA = sha256(rawA);
    const hashB = sha256('raw-token-b');
    const hashC = sha256('raw-token-c');

    // A was legitimately rotated into B, and B was legitimately rotated
    // further into C (the live token currently held by the real user) —
    // then the ATTACKER replays A, the token they stole before it was
    // first rotated.
    const { service, store, update } = makeHarness([
      { tokenHash: hashA, userId: 'user-1', expiresAt: FUTURE, revokedAt: PAST_REVOKE, replacedByTokenHash: hashB },
      { tokenHash: hashB, userId: 'user-1', expiresAt: FUTURE, revokedAt: PAST_REVOKE, replacedByTokenHash: hashC },
      { tokenHash: hashC, userId: 'user-1', expiresAt: FUTURE, revokedAt: null, replacedByTokenHash: null },
    ]);

    await TenantContext.run({ tenantId: 'school-a' }, async () => {
      await expect(service.refresh({ refreshToken: rawA })).rejects.toThrow(UnauthorizedException);
    });

    // The legitimate user's live token (C) must now be revoked too — the
    // whole family is dead, not just the replayed token.
    expect(store.get(hashC)?.revokedAt).not.toBeNull();
    expect(update).toHaveBeenCalledWith({ where: { tokenHash: hashC }, data: { revokedAt: expect.any(Date) } });
  });

  it('the reuse rejection carries a stable machine-readable code', async () => {
    const hashA = sha256('raw-token-a');
    const { service } = makeHarness([
      { tokenHash: hashA, userId: 'user-1', expiresAt: FUTURE, revokedAt: PAST_REVOKE, replacedByTokenHash: null },
    ]);

    await TenantContext.run({ tenantId: 'school-a' }, async () => {
      try {
        await service.refresh({ refreshToken: 'raw-token-a' });
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(UnauthorizedException);
        expect((err as UnauthorizedException).getResponse()).toMatchObject({
          code: 'REFRESH_TOKEN_REUSE_DETECTED',
        });
      }
    });
  });

  it('does not walk/revoke anything for an unknown token (nothing to walk)', async () => {
    const { service, update } = makeHarness([]);

    await TenantContext.run({ tenantId: 'school-a' }, async () => {
      await expect(service.refresh({ refreshToken: 'never-issued' })).rejects.toThrow(UnauthorizedException);
    });

    expect(update).not.toHaveBeenCalled();
  });

  it('regression: a fresh, unrevoked, unexpired token still rotates successfully', async () => {
    const rawA = 'raw-token-a';
    const hashA = sha256(rawA);
    const { service, store } = makeHarness([
      { tokenHash: hashA, userId: 'user-1', expiresAt: FUTURE, revokedAt: null, replacedByTokenHash: null },
    ]);

    const result = await TenantContext.run({ tenantId: 'school-a' }, () => service.refresh({ refreshToken: rawA }));

    expect(result.accessToken).toBe('signed-access-token');
    expect(result.refreshToken).not.toBe(rawA);
    // The old token is now revoked and points at the new one.
    const oldRecord = store.get(hashA);
    expect(oldRecord?.revokedAt).not.toBeNull();
    expect(oldRecord?.replacedByTokenHash).toBe(sha256(result.refreshToken));
  });
});
