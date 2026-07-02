import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context/tenant-context';
import { assertSameTenant } from '../../prisma/assert-same-tenant';
import { ErrorCode } from '../../common/errors/error-codes';
import type { CreateSectionDto } from '../dto/create-section.dto';
import type { UpdateSectionDto } from '../dto/update-section.dto';

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(academicYearId?: string) {
    return this.prisma.client.section.findMany({
      where: academicYearId ? { academicYearId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const section = await this.prisma.client.section.findUnique({ where: { id } });
    if (!section) {
      throw new NotFoundException({ code: ErrorCode.SECTION_NOT_FOUND, message: 'الشعبة غير موجودة' });
    }
    return section;
  }

  async create(dto: CreateSectionDto) {
    await this.assertReferencedRowsBelongToTenant(dto.academicYearId, dto.gradeLevelId);
    return this.prisma.client.section.create({
      data: { ...dto, tenantId: TenantContext.getTenantIdOrThrow() },
    });
  }

  async update(id: string, dto: UpdateSectionDto) {
    await this.findOne(id);
    await this.assertReferencedRowsBelongToTenant(dto.academicYearId, dto.gradeLevelId);
    return this.prisma.client.section.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.client.section.delete({ where: { id } });
  }

  /**
   * Cross-tenant FK guard (docs/ARCHITECTURE.md "Cross-tenant FK rule"):
   * `academicYearId`/`gradeLevelId` arrive as bare scalar FK strings from
   * the DTO. Only checked when present so partial updates that don't touch
   * these fields skip the extra round trip.
   */
  private async assertReferencedRowsBelongToTenant(academicYearId?: string, gradeLevelId?: string): Promise<void> {
    if (academicYearId) {
      await assertSameTenant(
        () => this.prisma.client.academicYear.findFirst({ where: { id: academicYearId } }),
        ErrorCode.ACADEMIC_YEAR_NOT_FOUND,
        'السنة الدراسية غير موجودة',
      );
    }
    if (gradeLevelId) {
      await assertSameTenant(
        () => this.prisma.client.gradeLevel.findFirst({ where: { id: gradeLevelId } }),
        ErrorCode.GRADE_LEVEL_NOT_FOUND,
        'الصف الدراسي غير موجود',
      );
    }
  }
}
