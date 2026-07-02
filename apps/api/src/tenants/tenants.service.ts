import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../common/tenant-context/tenant-context';
import { seedDefaultRolesForSchool } from '../rbac/seed-default-roles';
import { ErrorCode } from '../common/errors/error-codes';
import type { CreateSchoolDto } from './dto/create-school.dto';

/**
 * Platform-level module: NOT tenant-scoped. This is where a tenant (School)
 * comes into existence in the first place, so — unlike every other
 * module — it must run before any TenantContext exists for the new school,
 * and it manually enters one (via TenantContext.run) only for the handful
 * of tenant-scoped writes needed to bootstrap the school (default roles,
 * owner membership).
 */
@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSchool(dto: CreateSchoolDto) {
    const existingSlug = await this.prisma.client.school.findUnique({ where: { slug: dto.slug } });
    if (existingSlug) {
      throw new ConflictException({
        code: ErrorCode.SCHOOL_SLUG_TAKEN,
        message: 'يوجد مدرسة أخرى بنفس المعرّف (slug)',
      });
    }

    const ownerUser = await this.findOrCreateOwnerUser(dto.owner);

    const school = await this.prisma.client.school.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        organizationId: dto.organizationId,
        stageTypes: dto.stageTypes ?? [],
      },
    });

    await TenantContext.run({ tenantId: school.id }, async () => {
      await seedDefaultRolesForSchool(this.prisma.client, school.id);

      const ownerRole = await this.prisma.client.role.findUniqueOrThrow({
        where: { tenantId_key: { tenantId: school.id, key: 'owner' } },
      });

      await this.prisma.client.membership.create({
        data: { tenantId: school.id, userId: ownerUser.id, roleId: ownerRole.id },
      });
    });

    return { school, owner: { id: ownerUser.id, fullName: ownerUser.fullName } };
  }

  private async findOrCreateOwnerUser(owner: CreateSchoolDto['owner']) {
    if (!owner.phone && !owner.email) {
      throw new BadRequestException({
        code: ErrorCode.SCHOOL_OWNER_CONTACT_REQUIRED,
        message: 'يجب إدخال رقم هاتف أو بريد إلكتروني لمالك المدرسة',
      });
    }

    // Build the OR clause only from fields that are actually present —
    // Prisma treats `{ field: undefined }` as "omit this filter", so
    // naively including both would turn into `{}` and match any row.
    const identifiers = [
      owner.phone ? { phone: owner.phone } : undefined,
      owner.email ? { email: owner.email } : undefined,
    ].filter((clause): clause is { phone: string } | { email: string } => clause !== undefined);

    const existing = await this.prisma.client.user.findFirst({ where: { OR: identifiers } });
    if (existing) {
      return existing;
    }

    const passwordHash = await argon2.hash(owner.password);
    return this.prisma.client.user.create({
      data: {
        fullName: owner.fullName,
        phone: owner.phone,
        email: owner.email,
        passwordHash,
      },
    });
  }
}
