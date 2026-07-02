import { NotFoundException } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { TenantContext } from '../../common/tenant-context/tenant-context';
import type { PrismaService } from '../../prisma/prisma.service';
import type { CreateSubjectDto } from '../dto/create-subject.dto';

/** Regression test for QA finding #1 (CRITICAL) — see sections.service.spec.ts for the full scenario writeup. */
describe('SubjectsService — cross-tenant FK guard', () => {
  function makePrisma(gradeLevel: unknown) {
    const findFirst = jest.fn().mockResolvedValue(gradeLevel);
    const create = jest.fn().mockResolvedValue({ id: 'subject-1' });
    const prisma = {
      client: { gradeLevel: { findFirst }, subject: { create } },
    } as unknown as PrismaService;
    return { prisma, findFirst, create };
  }

  it('rejects creation when gradeLevelId belongs to another tenant', async () => {
    const { prisma, create } = makePrisma(null);
    const service = new SubjectsService(prisma);
    const dto: CreateSubjectDto = { name: 'رياضيات', gradeLevelId: 'grade-b' };

    await TenantContext.run({ tenantId: 'school-a' }, async () => {
      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    expect(create).not.toHaveBeenCalled();
  });

  it('the thrown error carries a stable machine-readable code', async () => {
    const { prisma } = makePrisma(null);
    const service = new SubjectsService(prisma);

    await TenantContext.run({ tenantId: 'school-a' }, async () => {
      try {
        await service.create({ name: 'رياضيات', gradeLevelId: 'grade-b' });
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect((err as NotFoundException).getResponse()).toMatchObject({ code: 'GRADE_LEVEL_NOT_FOUND' });
      }
    });
  });

  it('allows creation when gradeLevelId is omitted (it is optional on Subject)', async () => {
    const { prisma, findFirst, create } = makePrisma(null);
    const service = new SubjectsService(prisma);

    await TenantContext.run({ tenantId: 'school-a' }, async () => {
      await expect(service.create({ name: 'رياضيات' })).resolves.toEqual({ id: 'subject-1' });
    });

    expect(findFirst).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('allows creation when gradeLevelId belongs to the current tenant', async () => {
    const { prisma, create } = makePrisma({ id: 'grade-a' });
    const service = new SubjectsService(prisma);

    await TenantContext.run({ tenantId: 'school-a' }, async () => {
      await expect(service.create({ name: 'رياضيات', gradeLevelId: 'grade-a' })).resolves.toEqual({
        id: 'subject-1',
      });
    });

    expect(create).toHaveBeenCalledTimes(1);
  });
});
