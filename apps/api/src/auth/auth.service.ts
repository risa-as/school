import { randomBytes, createHash } from 'node:crypto';
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context/tenant-context';
import { ErrorCode } from '../common/errors/error-codes';
import type { JwtAccessPayload } from './types/jwt-payload.type';
import type { LoginDto } from './dto/login.dto';
import type { RefreshTokenDto } from './dto/refresh-token.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: { id: string; fullName: string; locale: string; membershipId: string; roleId: string; roleKey: string };
}

const REFRESH_TOKEN_BYTES = 48;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthTokens> {
    // Membership is tenant-scoped: login requires the same X-Tenant-Id
    // header as any other request, resolved into TenantContext by
    // TenantContextMiddleware before this handler ever runs.
    const tenantId = TenantContext.getTenantIdOrThrow();

    const user = await this.prisma.client.user.findFirst({
      where: { OR: [{ phone: dto.identifier }, { email: dto.identifier }], isActive: true },
    });
    if (!user) {
      throw new UnauthorizedException({ code: ErrorCode.INVALID_CREDENTIALS, message: 'بيانات الدخول غير صحيحة' });
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException({ code: ErrorCode.INVALID_CREDENTIALS, message: 'بيانات الدخول غير صحيحة' });
    }

    const membership = await this.prisma.client.membership.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });
    if (!membership) {
      throw new ForbiddenException({ code: ErrorCode.NO_SCHOOL_ACCESS, message: 'لا تملك صلاحية الوصول لهذه المدرسة' });
    }

    const accessToken = this.signAccessToken({
      sub: user.id,
      tenantId,
      membershipId: membership.id,
      roleId: membership.roleId,
      permissions: membership.role.rolePermissions.map((rp) => rp.permission.key),
    });
    const refreshToken = await this.issueRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      user: {
        id: user.id,
        fullName: user.fullName,
        locale: user.locale,
        membershipId: membership.id,
        roleId: membership.roleId,
        roleKey: membership.role.key,
      },
    };
  }

  /** Rotating refresh: the presented token is revoked and replaced atomically. */
  async refresh(dto: RefreshTokenDto): Promise<AuthTokens> {
    const tenantId = TenantContext.getTenantIdOrThrow();
    const tokenHash = hashToken(dto.refreshToken);

    const existing = await this.prisma.client.refreshToken.findUnique({ where: { tokenHash } });

    if (!existing) {
      throw new UnauthorizedException({
        code: ErrorCode.SESSION_INVALID,
        message: 'جلسة غير صالحة، الرجاء تسجيل الدخول من جديد',
      });
    }

    if (existing.revokedAt) {
      // Reuse of an already-rotated (or already-logged-out) refresh token —
      // a live sign that the token was stolen and the thief raced (or
      // followed) the legitimate user through rotation. Revoke the ENTIRE
      // descendant chain (every token this one was ever rotated into, walked
      // via replacedByTokenHash) so a stolen-then-rotated token can't keep a
      // live session alive even though the thief already holds a newer one.
      await this.revokeDescendantChain(existing);
      throw new UnauthorizedException({
        code: ErrorCode.REFRESH_TOKEN_REUSE_DETECTED,
        message: 'تم اكتشاف إعادة استخدام لجلسة سبق إبطالها، تم إنهاء كل الجلسات المرتبطة بها',
      });
    }

    if (existing.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: ErrorCode.SESSION_EXPIRED,
        message: 'انتهت صلاحية الجلسة، الرجاء تسجيل الدخول من جديد',
      });
    }

    const membership = await this.prisma.client.membership.findFirst({
      where: { userId: existing.userId, status: 'ACTIVE' },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });
    if (!membership) {
      throw new ForbiddenException({ code: ErrorCode.NO_SCHOOL_ACCESS, message: 'لا تملك صلاحية الوصول لهذه المدرسة' });
    }

    const user = await this.prisma.client.user.findUniqueOrThrow({ where: { id: existing.userId } });

    const newRefreshToken = await this.issueRefreshToken(user.id);
    await this.prisma.client.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date(), replacedByTokenHash: hashToken(newRefreshToken) },
    });

    const accessToken = this.signAccessToken({
      sub: user.id,
      tenantId,
      membershipId: membership.id,
      roleId: membership.roleId,
      permissions: membership.role.rolePermissions.map((rp) => rp.permission.key),
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      user: {
        id: user.id,
        fullName: user.fullName,
        locale: user.locale,
        membershipId: membership.id,
        roleId: membership.roleId,
        roleKey: membership.role.key,
      },
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.client.refreshToken
      .update({ where: { tokenHash }, data: { revokedAt: new Date() } })
      .catch(() => undefined); // idempotent: already-revoked/unknown tokens are a no-op
  }

  /**
   * Walks `replacedByTokenHash` forward from a reused token and revokes
   * every descendant found, so the family this token belongs to can never
   * issue a live session again — regardless of how many times it was
   * rotated after the theft. `visited` bounds the walk against a
   * (should-be-impossible) cycle; a missing link just ends the walk.
   */
  private async revokeDescendantChain(start: { tokenHash: string; replacedByTokenHash: string | null }): Promise<void> {
    const visited = new Set<string>([start.tokenHash]);
    let cursor = start.replacedByTokenHash;

    while (cursor && !visited.has(cursor)) {
      visited.add(cursor);
      const next = await this.prisma.client.refreshToken.findUnique({ where: { tokenHash: cursor } });
      if (!next) break;

      if (!next.revokedAt) {
        await this.prisma.client.refreshToken.update({
          where: { tokenHash: cursor },
          data: { revokedAt: new Date() },
        });
      }

      cursor = next.replacedByTokenHash;
    }
  }

  private signAccessToken(payload: JwtAccessPayload): string {
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });
  }

  private async issueRefreshToken(userId: string): Promise<string> {
    const rawToken = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const days = this.config.get<number>('JWT_REFRESH_EXPIRES_IN_DAYS', 30);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.client.refreshToken.create({
      data: { userId, tokenHash: hashToken(rawToken), expiresAt },
    });

    return rawToken;
  }
}

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
