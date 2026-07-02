import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context/tenant-context';
import { ErrorCode } from '../../common/errors/error-codes';
import type { CreateGradeLevelDto } from '../dto/create-grade-level.dto';
import type { UpdateGradeLevelDto } from '../dto/update-grade-level.dto';

@Injectable()
export class GradeLevelsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.client.gradeLevel.findMany({ orderBy: { order: 'asc' } });
  }

  async findOne(id: string) {
    const gradeLevel = await this.prisma.client.gradeLevel.findUnique({ where: { id } });
    if (!gradeLevel) {
      throw new NotFoundException({ code: ErrorCode.GRADE_LEVEL_NOT_FOUND, message: 'الصف الدراسي غير موجود' });
    }
    return gradeLevel;
  }

  create(dto: CreateGradeLevelDto) {
    return this.prisma.client.gradeLevel.create({
      data: { ...dto, tenantId: TenantContext.getTenantIdOrThrow() },
    });
  }

  async update(id: string, dto: UpdateGradeLevelDto) {
    await this.findOne(id);
    return this.prisma.client.gradeLevel.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.client.gradeLevel.delete({ where: { id } });
  }
}
