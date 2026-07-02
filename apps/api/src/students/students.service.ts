import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination-query.dto';
import { TenantContext } from '../common/tenant-context/tenant-context';
import { ErrorCode } from '../common/errors/error-codes';
import type { CreateStudentDto } from './dto/create-student.dto';
import type { UpdateStudentDto } from './dto/update-student.dto';

/** Student is tenant-scoped — every method here relies on TenantContext being set. */
@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PaginationQueryDto) {
    const where = query.search
      ? {
          OR: [
            { fullName: { contains: query.search, mode: 'insensitive' as const } },
            { studentNumber: { contains: query.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.client.student.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.client.student.count({ where }),
    ]);

    return paginate(items, total, query);
  }

  async findOne(id: string) {
    const student = await this.prisma.client.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundException({ code: ErrorCode.STUDENT_NOT_FOUND, message: 'الطالب غير موجود' });
    }
    return student;
  }

  async create(dto: CreateStudentDto) {
    const duplicate = await this.prisma.client.student.findFirst({
      where: { studentNumber: dto.studentNumber },
    });
    if (duplicate) {
      throw new ConflictException({
        code: ErrorCode.STUDENT_NUMBER_TAKEN,
        message: 'رقم الطالب مستخدم من قبل في هذه المدرسة',
      });
    }

    return this.prisma.client.student.create({
      data: {
        // tenantId is redundant with the Prisma tenant-scoping extension (which
        // forcibly overwrites it anyway) but is spelled out explicitly here so
        // the create() call type-checks against Prisma's generated input types,
        // which have no way to know the extension injects it at runtime.
        tenantId: TenantContext.getTenantIdOrThrow(),
        studentNumber: dto.studentNumber,
        fullName: dto.fullName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        nationalId: dto.nationalId,
        address: dto.address,
      },
    });
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);
    return this.prisma.client.student.update({
      where: { id },
      data: {
        studentNumber: dto.studentNumber,
        fullName: dto.fullName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        nationalId: dto.nationalId,
        address: dto.address,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.client.student.delete({ where: { id } });
  }
}
