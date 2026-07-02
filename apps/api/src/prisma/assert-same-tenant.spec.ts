import { NotFoundException } from '@nestjs/common';
import { assertSameTenant } from './assert-same-tenant';

describe('assertSameTenant', () => {
  it('resolves without throwing when the finder returns a row', async () => {
    const finder = jest.fn().mockResolvedValue({ id: 'row-1' });

    await expect(assertSameTenant(finder, 'SOME_NOT_FOUND', 'غير موجود')).resolves.toBeUndefined();
    expect(finder).toHaveBeenCalledTimes(1);
  });

  it('throws a NotFoundException carrying the given code/message when the finder returns null', async () => {
    // A finder built on `PrismaService.client` already has the current
    // tenantId forced into `where` by the tenant-scoping extension — so a
    // row that exists but belongs to ANOTHER tenant comes back null here,
    // exactly like a row that never existed at all. This test only checks
    // the null -> throw contract; the actual cross-tenant scoping is
    // covered by tenant-scoping.spec.ts.
    const finder = jest.fn().mockResolvedValue(null);

    await expect(assertSameTenant(finder, 'ACADEMIC_YEAR_NOT_FOUND', 'السنة الدراسية غير موجودة')).rejects.toThrow(
      NotFoundException,
    );

    try {
      await assertSameTenant(finder, 'ACADEMIC_YEAR_NOT_FOUND', 'السنة الدراسية غير موجودة');
      fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundException);
      const response = (err as NotFoundException).getResponse();
      expect(response).toEqual({ code: 'ACADEMIC_YEAR_NOT_FOUND', message: 'السنة الدراسية غير موجودة' });
    }
  });

  it('also throws when the finder resolves undefined', async () => {
    const finder = jest.fn().mockResolvedValue(undefined);
    await expect(assertSameTenant(finder, 'X_NOT_FOUND', 'x')).rejects.toThrow(NotFoundException);
  });
});
