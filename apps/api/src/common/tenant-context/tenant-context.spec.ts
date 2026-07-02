import { TenantContext, TenantContextMissingError } from './tenant-context';

describe('TenantContext', () => {
  it('returns undefined tenantId outside of run()', () => {
    expect(TenantContext.tenantId).toBeUndefined();
  });

  it('exposes the tenantId bound via run()', () => {
    TenantContext.run({ tenantId: 'school-1' }, () => {
      expect(TenantContext.tenantId).toBe('school-1');
    });
  });

  it('clears the tenantId once run() returns', () => {
    TenantContext.run({ tenantId: 'school-1' }, () => undefined);
    expect(TenantContext.tenantId).toBeUndefined();
  });

  it('getTenantIdOrThrow returns the bound tenantId', () => {
    TenantContext.run({ tenantId: 'school-1' }, () => {
      expect(TenantContext.getTenantIdOrThrow()).toBe('school-1');
    });
  });

  it('getTenantIdOrThrow throws TenantContextMissingError when unbound', () => {
    expect(() => TenantContext.getTenantIdOrThrow()).toThrow(TenantContextMissingError);
  });

  it('isolates concurrent async call chains from each other (no cross-request leakage)', async () => {
    const results: string[] = [];

    async function simulateRequest(tenantId: string, delayMs: number): Promise<void> {
      await TenantContext.run({ tenantId }, async () => {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        results.push(`${tenantId}:${TenantContext.tenantId}`);
      });
    }

    await Promise.all([simulateRequest('school-a', 20), simulateRequest('school-b', 5)]);

    expect(results.sort()).toEqual(['school-a:school-a', 'school-b:school-b']);
  });
});
