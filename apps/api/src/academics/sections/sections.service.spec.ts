import { NotFoundException } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { TenantContext } from '../../common/tenant-context/tenant-context';
import type { PrismaService } from '../../prisma/prisma.service';
import type { CreateSectionDto } from '../dto/create-section.dto';

/**
 * Regression test for QA finding #1 (CRITICAL): a scalar FK accepted from a
 * DTO (academicYearId/gradeLevelId) used to be spread straight into
 * `data` with no check that the referenced row belongs to the caller's
 * tenant. This simulates exactly that attack: School A calls
 * POST /sections with an academicYearId/gradeLevelId that only exists in
 * School B — the tenant-scoping extension would happily stamp the new
 * Section with School A's tenantId while pointing its FK into School B.
 */
describe('SectionsService — cross-tenant FK guard', () => {
  function makePrisma(overrides: {
    academicYear?: unknown;
    gradeLevel?: unknown;
  }): { prisma: PrismaService; create: jest.Mock; findFirstAcademicYear: jest.Mock; findFirstGradeLevel: jest.Mock } {
    const findFirstAcademicYear = jest.fn().mockResolvedValue(overrides.academicYear ?? null);
    const findFirstGradeLevel = jest.fn().mockResolvedValue(overrides.gradeLevel ?? null);
    const create = jest.fn().mockResolvedValue({ id: 'section-1' });

    const prisma = {
      client: {
        academicYear: { findFirst: findFirstAcademicYear },
        gradeLevel: { findFirst: findFirstGradeLevel },
        section: { create },
      },
    } as unknown as PrismaService;

    return { prisma, create, findFirstAcademicYear, findFirstGradeLevel };
  }

  const dto: CreateSectionDto = { academicYearId: 'year-b', gradeLevelId: 'grade-b', name: 'أ' };

  it('rejects creation when academicYearId belongs to another tenant (findFirst returns null)', async () => {
    const { prisma, create } = makePrisma({ academicYear: null, gradeLevel: { id: 'grade-b' } });
    const service = new SectionsService(prisma);

    await TenantContext.run({ tenantId: 'school-a' }, async () => {
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    expect(create).not.toHaveBeenCalled();
  });

  it('rejects creation when gradeLevelId belongs to another tenant', async () => {
    const { prisma, create } = makePrisma({ academicYear: { id: 'year-b' }, gradeLevel: null });
    const service = new SectionsService(prisma);

    await TenantContext.run({ tenantId: 'school-a' }, async () => {
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    expect(create).not.toHaveBeenCalled();
  });

  it('the thrown error carries a stable machine-readable code', async () => {
    const { prisma } = makePrisma({ academicYear: null, gradeLevel: { id: 'grade-b' } });
    const service = new SectionsService(prisma);

    await TenantContext.run({ tenantId: 'school-a' }, async () => {
      try {
        await service.create(dto);
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect((err as NotFoundException).getResponse()).toMatchObject({ code: 'ACADEMIC_YEAR_NOT_FOUND' });
      }
    });
  });

  it('allows creation when both referenced rows belong to the current tenant', async () => {
    const { prisma, create } = makePrisma({ academicYear: { id: 'year-a' }, gradeLevel: { id: 'grade-a' } });
    const service = new SectionsService(prisma);

    await TenantContext.run({ tenantId: 'school-a' }, async () => {
      await expect(service.create(dto)).resolves.toEqual({ id: 'section-1' });
    });

    expect(create).toHaveBeenCalledTimes(1);
  });

  it('also validates the FKs on update (partial DTO)', async () => {
    const { prisma, findFirstAcademicYear, findFirstGradeLevel } = makePrisma({
      academicYear: null,
      gradeLevel: { id: 'grade-a' },
    });
    const findUnique = jest.fn().mockResolvedValue({ id: 'section-1' });
    (prisma.client as unknown as { section: Record<string, unknown> }).section.findUnique = findUnique;

    const service = new SectionsService(prisma);

    await TenantContext.run({ tenantId: 'school-a' }, async () => {
      await expect(service.update('section-1', { academicYearId: 'year-b' })).rejects.toThrow(NotFoundException);
    });

    expect(findFirstAcademicYear).toHaveBeenCalledWith({ where: { id: 'year-b' } });
    expect(findFirstGradeLevel).not.toHaveBeenCalled();
  });
});
