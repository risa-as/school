import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination-query.dto';
import { TenantContext } from '../common/tenant-context/tenant-context';
import { ErrorCode } from '../common/errors/error-codes';
import type { CreateMembershipDto } from './dto/create-membership.dto';
import type { UpdateMembershipDto } from './dto/update-membership.dto';

/** Membership is tenant-scoped — every method here runs inside the caller's TenantContext. */
@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationQueryDto) {
    const where = query.search
      ? { user: { fullName: { contains: query.search, mode: 'insensitive' as const } } }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.client.membership.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, fullName: true, phone: true, email: true } }, role: true },
      }),
      this.prisma.client.membership.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  async create(dto: CreateMembershipDto) {
    const userId = await this.resolveUserId(dto);

    const role = await this.prisma.client.role.findUnique({ where: { id: dto.roleId } });
    if (!role) {
      throw new NotFoundException({ code: ErrorCode.ROLE_NOT_FOUND, message: 'الدور غير موجود لهذه المدرسة' });
    }

    return this.prisma.client.membership.create({
      data: { tenantId: TenantContext.getTenantIdOrThrow(), userId, roleId: dto.roleId },
      include: { user: { select: { id: true, fullName: true, phone: true, email: true } }, role: true },
    });
  }

  async updateStatus(id: string, dto: UpdateMembershipDto) {
    await this.findOrThrow(id);
    return this.prisma.client.membership.update({
      where: { id },
      data: { roleId: dto.roleId, status: dto.status },
      include: { user: { select: { id: true, fullName: true, phone: true, email: true } }, role: true },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOrThrow(id);
    await this.prisma.client.membership.delete({ where: { id } });
  }

  private async findOrThrow(id: string) {
    const membership = await this.prisma.client.membership.findUnique({ where: { id } });
    if (!membership) {
      throw new NotFoundException({ code: ErrorCode.MEMBERSHIP_NOT_FOUND, message: 'العضوية غير موجودة' });
    }
    return membership;
  }

  private async resolveUserId(dto: CreateMembershipDto): Promise<string> {
    if (dto.userId) return dto.userId;

    if (!dto.user) {
      throw new BadRequestException({
        code: ErrorCode.MEMBERSHIP_USER_DATA_REQUIRED,
        message: 'يجب توفير userId أو بيانات مستخدم جديد',
      });
    }
    if (!dto.user.phone && !dto.user.email) {
      throw new BadRequestException({
        code: ErrorCode.MEMBERSHIP_USER_CONTACT_REQUIRED,
        message: 'يجب إدخال رقم هاتف أو بريد إلكتروني للمستخدم الجديد',
      });
    }
    if (!dto.user.password) {
      throw new BadRequestException({
        code: ErrorCode.MEMBERSHIP_USER_PASSWORD_REQUIRED,
        message: 'كلمة المرور مطلوبة عند إنشاء مستخدم جديد',
      });
    }

    const identifiers = [
      dto.user.phone ? { phone: dto.user.phone } : undefined,
      dto.user.email ? { email: dto.user.email } : undefined,
    ].filter((clause): clause is { phone: string } | { email: string } => clause !== undefined);

    const existing = await this.prisma.client.user.findFirst({ where: { OR: identifiers } });
    if (existing) return existing.id;

    const passwordHash = await argon2.hash(dto.user.password);
    const created = await this.prisma.client.user.create({
      data: { fullName: dto.user.fullName, phone: dto.user.phone, email: dto.user.email, passwordHash },
    });
    return created.id;
  }
}
