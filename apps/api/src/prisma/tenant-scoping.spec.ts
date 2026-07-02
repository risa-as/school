import { applyTenantScope } from './tenant-scoping';
import { TenantContextMissingError } from '../common/tenant-context/tenant-context';
import type { RelationMap } from './relation-map';

// Fixture relation map mirroring a slice of schema.prisma — kept hand-written
// (not derived from the real client) so these tests don't require `prisma
// generate` to have run and stay focused purely on the scoping algorithm.
const relationMap: RelationMap = {
  Student: {
    enrollments: { relatedModel: 'Enrollment', isList: true },
    studentGuardians: { relatedModel: 'StudentGuardian', isList: true },
    school: { relatedModel: 'School', isList: false }, // platform-level relation
  },
  Enrollment: {
    student: { relatedModel: 'Student', isList: false },
    section: { relatedModel: 'Section', isList: false },
  },
  Section: {
    enrollments: { relatedModel: 'Enrollment', isList: true },
  },
  StudentGuardian: {
    student: { relatedModel: 'Student', isList: false },
    guardian: { relatedModel: 'Guardian', isList: false },
  },
};

describe('applyTenantScope', () => {
  describe('platform-level models', () => {
    it('passes args through completely untouched, even without a tenantId', () => {
      const args = { where: { id: '1' } };
      const result = applyTenantScope({ model: 'School', operation: 'findMany', args, tenantId: undefined });
      expect(result).toBe(args);
    });

    it('never throws for platform-level models regardless of missing tenant context', () => {
      expect(() =>
        applyTenantScope({ model: 'User', operation: 'create', args: { data: {} }, tenantId: undefined }),
      ).not.toThrow();
    });
  });

  describe('missing tenant context on tenant-scoped models', () => {
    it.each(['findMany', 'findFirst', 'create', 'createMany', 'update', 'delete', 'upsert', 'count', 'aggregate', 'groupBy'])(
      'throws TenantContextMissingError for %s',
      (operation) => {
        expect(() => applyTenantScope({ model: 'Student', operation, args: {}, tenantId: undefined })).toThrow(
          TenantContextMissingError,
        );
      },
    );

    it('the error message names the offending model', () => {
      try {
        applyTenantScope({ model: 'Student', operation: 'findMany', args: {}, tenantId: undefined });
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(TenantContextMissingError);
        expect((err as Error).message).toContain('Student');
      }
    });
  });

  describe('reads', () => {
    it('injects tenantId into where, merging with existing filters', () => {
      const result: any = applyTenantScope({
        model: 'Student',
        operation: 'findMany',
        args: { where: { isActive: true } },
        tenantId: 'school-1',
      });
      expect(result.where).toEqual({ isActive: true, tenantId: 'school-1' });
    });

    it('overrides a caller-supplied tenantId rather than trusting client input', () => {
      const result: any = applyTenantScope({
        model: 'Student',
        operation: 'findFirst',
        args: { where: { tenantId: 'attacker-school' } },
        tenantId: 'school-1',
      });
      expect(result.where.tenantId).toBe('school-1');
    });

    it('injects tenantId for count/aggregate/groupBy which have no default where', () => {
      for (const operation of ['count', 'aggregate', 'groupBy']) {
        const result: any = applyTenantScope({ model: 'Student', operation, args: {}, tenantId: 'school-1' });
        expect(result.where).toEqual({ tenantId: 'school-1' });
      }
    });
  });

  describe('create', () => {
    it('stamps tenantId onto data', () => {
      const result: any = applyTenantScope({
        model: 'Student',
        operation: 'create',
        args: { data: { fullName: 'Ali' } },
        tenantId: 'school-1',
      });
      expect(result.data).toEqual({ fullName: 'Ali', tenantId: 'school-1' });
    });

    it('overrides an attacker-supplied tenantId in data', () => {
      const result: any = applyTenantScope({
        model: 'Student',
        operation: 'create',
        args: { data: { fullName: 'Ali', tenantId: 'attacker-school' } },
        tenantId: 'school-1',
      });
      expect(result.data.tenantId).toBe('school-1');
    });

    it('recursively stamps a nested create relation that is tenant-scoped', () => {
      const result: any = applyTenantScope({
        model: 'Student',
        operation: 'create',
        args: {
          data: {
            fullName: 'Ali',
            enrollments: { create: { academicYearId: 'ay-1', gradeLevelId: 'gl-1' } },
          },
        },
        tenantId: 'school-1',
        relationMap,
      });
      expect(result.data.tenantId).toBe('school-1');
      expect(result.data.enrollments.create.tenantId).toBe('school-1');
    });

    it('stamps every row of a nested createMany block', () => {
      const result: any = applyTenantScope({
        model: 'Student',
        operation: 'create',
        args: {
          data: {
            fullName: 'Ali',
            enrollments: { createMany: { data: [{ academicYearId: 'ay-1' }, { academicYearId: 'ay-2' }] } },
          },
        },
        tenantId: 'school-1',
        relationMap,
      });
      expect(result.data.enrollments.createMany.data).toEqual([
        { academicYearId: 'ay-1', tenantId: 'school-1' },
        { academicYearId: 'ay-2', tenantId: 'school-1' },
      ]);
    });

    it('stamps nested connectOrCreate.create blocks without touching the where clause', () => {
      const result: any = applyTenantScope({
        model: 'Student',
        operation: 'create',
        args: {
          data: {
            fullName: 'Ali',
            enrollments: { connectOrCreate: { where: { id: 'e1' }, create: { academicYearId: 'ay-1' } } },
          },
        },
        tenantId: 'school-1',
        relationMap,
      });
      expect(result.data.enrollments.connectOrCreate.create.tenantId).toBe('school-1');
      expect(result.data.enrollments.connectOrCreate.where).toEqual({ id: 'e1' });
    });

    it('preserves the array shape of connectOrCreate for to-many relations', () => {
      const result: any = applyTenantScope({
        model: 'Student',
        operation: 'create',
        args: {
          data: {
            fullName: 'Ali',
            enrollments: {
              connectOrCreate: [
                { where: { id: 'e1' }, create: { academicYearId: 'ay-1' } },
                { where: { id: 'e2' }, create: { academicYearId: 'ay-2' } },
              ],
            },
          },
        },
        tenantId: 'school-1',
        relationMap,
      });
      expect(Array.isArray(result.data.enrollments.connectOrCreate)).toBe(true);
      expect(result.data.enrollments.connectOrCreate).toEqual([
        { where: { id: 'e1' }, create: { academicYearId: 'ay-1', tenantId: 'school-1' } },
        { where: { id: 'e2' }, create: { academicYearId: 'ay-2', tenantId: 'school-1' } },
      ]);
    });

    it('does not touch nested relations to platform-level models', () => {
      const result: any = applyTenantScope({
        model: 'Student',
        operation: 'create',
        args: { data: { fullName: 'Ali', school: { connect: { id: 'sch-1' } } } },
        tenantId: 'school-1',
        relationMap,
      });
      expect(result.data.school).toEqual({ connect: { id: 'sch-1' } });
    });

    it('recurses more than one level deep', () => {
      const result: any = applyTenantScope({
        model: 'Student',
        operation: 'create',
        args: {
          data: {
            fullName: 'Ali',
            enrollments: {
              create: {
                academicYearId: 'ay-1',
                section: { create: { name: 'A', academicYearId: 'ay-1', gradeLevelId: 'gl-1' } },
              },
            },
          },
        },
        tenantId: 'school-1',
        relationMap,
      });
      expect(result.data.enrollments.create.tenantId).toBe('school-1');
      expect(result.data.enrollments.create.section.create.tenantId).toBe('school-1');
    });

    it('does nothing extra when no relationMap is supplied (still stamps the top level)', () => {
      const result: any = applyTenantScope({
        model: 'Student',
        operation: 'create',
        args: { data: { fullName: 'Ali', enrollments: { create: { academicYearId: 'ay-1' } } } },
        tenantId: 'school-1',
      });
      expect(result.data.tenantId).toBe('school-1');
      expect(result.data.enrollments.create.tenantId).toBeUndefined();
    });
  });

  describe('createMany', () => {
    it('stamps tenantId onto every row', () => {
      const result: any = applyTenantScope({
        model: 'Student',
        operation: 'createMany',
        args: { data: [{ fullName: 'Ali' }, { fullName: 'Sara' }] },
        tenantId: 'school-1',
      });
      expect(result.data).toEqual([
        { fullName: 'Ali', tenantId: 'school-1' },
        { fullName: 'Sara', tenantId: 'school-1' },
      ]);
    });
  });

  describe('update / delete', () => {
    it('injects tenantId into where for update, leaving data untouched', () => {
      const result: any = applyTenantScope({
        model: 'Student',
        operation: 'update',
        args: { where: { id: 's1' }, data: { fullName: 'New name' } },
        tenantId: 'school-1',
      });
      expect(result.where).toEqual({ id: 's1', tenantId: 'school-1' });
      expect(result.data).toEqual({ fullName: 'New name' });
    });

    it('injects tenantId into where for delete', () => {
      const result: any = applyTenantScope({
        model: 'Student',
        operation: 'delete',
        args: { where: { id: 's1' } },
        tenantId: 'school-1',
      });
      expect(result.where.tenantId).toBe('school-1');
    });

    it('injects tenantId into where for updateMany/deleteMany', () => {
      for (const operation of ['updateMany', 'deleteMany']) {
        const result: any = applyTenantScope({
          model: 'Student',
          operation,
          args: { where: { isActive: true } },
          tenantId: 'school-1',
        });
        expect(result.where).toEqual({ isActive: true, tenantId: 'school-1' });
      }
    });

    it('strips an attacker-supplied tenantId from update/updateMany data — a row can never be reassigned to another tenant', () => {
      for (const operation of ['update', 'updateMany', 'updateManyAndReturn']) {
        const result: any = applyTenantScope({
          model: 'Student',
          operation,
          args: { where: { id: 's1' }, data: { fullName: 'New name', tenantId: 'attacker-school' } },
          tenantId: 'school-1',
        });
        expect(result.where.tenantId).toBe('school-1');
        expect(result.data).toEqual({ fullName: 'New name' });
        expect(result.data.tenantId).toBeUndefined();
      }
    });
  });

  describe('upsert', () => {
    it('stamps where and create with tenantId, and strips any tenantId from update', () => {
      const result: any = applyTenantScope({
        model: 'Student',
        operation: 'upsert',
        args: {
          where: { id: 's1' },
          create: { fullName: 'Ali' },
          update: { fullName: 'Ali 2', tenantId: 'attacker-school' },
        },
        tenantId: 'school-1',
      });
      expect(result.where.tenantId).toBe('school-1');
      expect(result.create.tenantId).toBe('school-1');
      expect(result.update).toEqual({ fullName: 'Ali 2' });
      expect(result.update.tenantId).toBeUndefined();
    });
  });
});
