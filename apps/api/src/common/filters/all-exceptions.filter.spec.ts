import { BadRequestException, HttpStatus, NotFoundException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { TenantContextMissingError } from '../tenant-context/tenant-context';

function makeHost() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const response = { status };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

/** Regression test for QA finding #4 (MEDIUM) — errors need a stable machine-readable `code`. */
describe('AllExceptionsFilter', () => {
  it('passes through an explicit { code, message } body attached to an HttpException', () => {
    const filter = new AllExceptionsFilter();
    const { host, status, json } = makeHost();

    filter.catch(new NotFoundException({ code: 'STUDENT_NOT_FOUND', message: 'الطالب غير موجود' }), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      code: 'STUDENT_NOT_FOUND',
      message: 'الطالب غير موجود',
      errors: [],
    });
  });

  it('falls back to a generic status-derived code for exceptions without an explicit code', () => {
    const filter = new AllExceptionsFilter();
    const { host, json } = makeHost();

    filter.catch(new NotFoundException('غير موجود'), host);

    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: 'NOT_FOUND' }));
  });

  it('maps class-validator array-message bodies to VALIDATION_ERROR', () => {
    const filter = new AllExceptionsFilter();
    const { host, json } = makeHost();

    filter.catch(new BadRequestException(['name must not be empty']), host);

    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      code: 'VALIDATION_ERROR',
      message: 'خطأ في التحقق من البيانات',
      errors: ['name must not be empty'],
    });
  });

  it('maps TenantContextMissingError to TENANT_CONTEXT_MISSING', () => {
    const filter = new AllExceptionsFilter();
    const { host, json } = makeHost();

    filter.catch(new TenantContextMissingError('Student'), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.BAD_REQUEST, code: 'TENANT_CONTEXT_MISSING' }),
    );
  });

  it('maps an unknown thrown value to INTERNAL_ERROR / 500', () => {
    const filter = new AllExceptionsFilter();
    const { host, json } = makeHost();

    filter.catch(new Error('boom'), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, code: 'INTERNAL_ERROR' }),
    );
  });
});
