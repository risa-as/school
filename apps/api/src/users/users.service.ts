import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/errors/error-codes';
import type { UpdateUserDto } from './dto/update-user.dto';

/**
 * User is platform-level (not tenant-scoped) — a user's profile is shared
 * across every school they belong to via Membership. No TenantContext is
 * required for anything in this service.
 */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
      select: { id: true, fullName: true, phone: true, email: true, locale: true, isActive: true, createdAt: true },
    });
    if (!user) {
      throw new NotFoundException({ code: ErrorCode.USER_NOT_FOUND, message: 'المستخدم غير موجود' });
    }
    return user;
  }

  async updateProfile(id: string, dto: UpdateUserDto) {
    await this.findById(id);
    return this.prisma.client.user.update({
      where: { id },
      data: { fullName: dto.fullName, locale: dto.locale },
      select: { id: true, fullName: true, phone: true, email: true, locale: true, isActive: true, createdAt: true },
    });
  }
}
