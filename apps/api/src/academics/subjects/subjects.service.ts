import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context/tenant-context';
import { assertSameTenant } from '../../prisma/assert-same-tenant';
import { ErrorCode } from '../../common/errors/error-codes';
import type { CreateSubjectDto } from '../dto/create-subject.dto';
import type { UpdateSubjectDto } from '../dto/update-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(gradeLevelId?: string) {
    return this.prisma.client.subject.findMany({
      where: gradeLevelId ? { gradeLevelId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const subject = await this.prisma.client.subject.findUnique({ where: { id } });
    if (!subject) {
      throw new NotFoundException({ code: ErrorCode.SUBJECT_NOT_FOUND, message: 'المادة الدراسية غير موجودة' });
    }
    return subject;
  }

  async create(dto: CreateSubjectDto) {
    await this.assertReferencedRowsBelongToTenant(dto.gradeLevelId);
    return this.prisma.client.subject.create({
      data: { ...dto, tenantId: TenantContext.getTenantIdOrThrow() },
    });
  }

  async update(id: string, dto: UpdateSubjectDto) {
    await this.findOne(id);
    await this.assertReferencedRowsBelongToTenant(dto.gradeLevelId);
    return this.prisma.client.subject.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.client.subject.delete({ where: { id } });
  }

  /**
   * Cross-tenant FK guard (docs/ARCHITECTURE.md "Cross-tenant FK rule"):
   * `gradeLevelId` is optional on Subject, so only checked when present.
   */
  private async assertReferencedRowsBelongToTenant(gradeLevelId?: string): Promise<void> {
    if (gradeLevelId) {
      await assertSameTenant(
        () => this.prisma.client.gradeLevel.findFirst({ where: { id: gradeLevelId } }),
        ErrorCode.GRADE_LEVEL_NOT_FOUND,
        'الصف الدراسي غير موجود',
      );
    }
  }
}
