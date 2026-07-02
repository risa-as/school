import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext } from '../../common/tenant-context/tenant-context';
import { ErrorCode } from '../../common/errors/error-codes';
import type { CreateAcademicYearDto } from '../dto/create-academic-year.dto';
import type { UpdateAcademicYearDto } from '../dto/update-academic-year.dto';

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.client.academicYear.findMany({ orderBy: { startDate: 'desc' } });
  }

  async findOne(id: string) {
    const year = await this.prisma.client.academicYear.findUnique({ where: { id } });
    if (!year) {
      throw new NotFoundException({ code: ErrorCode.ACADEMIC_YEAR_NOT_FOUND, message: 'السنة الدراسية غير موجودة' });
    }
    return year;
  }

  create(dto: CreateAcademicYearDto) {
    return this.prisma.client.academicYear.create({
      data: {
        tenantId: TenantContext.getTenantIdOrThrow(),
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive ?? false,
      },
    });
  }

  async update(id: string, dto: UpdateAcademicYearDto) {
    await this.findOne(id);
    return this.prisma.client.academicYear.update({
      where: { id },
      data: {
        name: dto.name,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.client.academicYear.delete({ where: { id } });
  }
}
