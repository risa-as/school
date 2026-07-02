import { AsyncLocalStorage } from 'node:async_hooks';

export interface TenantStore {
  tenantId?: string;
}

/**
 * Process-wide AsyncLocalStorage instance. One per Node process, shared by
 * every request — safe because ALS gives each async call chain its own
 * isolated store, so concurrent requests never see each other's tenantId.
 */
const storage = new AsyncLocalStorage<TenantStore>();

/**
 * Thin static wrapper around AsyncLocalStorage for resolving the current
 * tenant (School.id) anywhere in the request's async call chain — no need
 * to thread tenantId through every function signature.
 *
 * Populated by TenantContextMiddleware (from the `X-Tenant-Id` header) for
 * normal HTTP requests, and can also be entered manually via `run()` for
 * platform-triggered writes (e.g. TenantsService seeding a brand-new
 * school's default roles right after creating it).
 */
export class TenantContext {
  static run<T>(store: TenantStore, callback: () => T): T {
    return storage.run(store, callback);
  }

  static get tenantId(): string | undefined {
    return storage.getStore()?.tenantId;
  }

  static getStore(): TenantStore | undefined {
    return storage.getStore();
  }

  /** Like `tenantId`, but throws if no tenant is bound to the current context. */
  static getTenantIdOrThrow(): string {
    const tenantId = TenantContext.tenantId;
    if (!tenantId) {
      throw new TenantContextMissingError();
    }
    return tenantId;
  }
}

/**
 * Thrown whenever code requires a tenant (School.id) but none is bound to
 * the current AsyncLocalStorage context. Framework-agnostic on purpose —
 * both the Prisma extension and plain services can throw/catch it without
 * depending on Nest. The global exception filter maps it to HTTP 400.
 */
export class TenantContextMissingError extends Error {
  constructor(model?: string) {
    super(
      model
        ? `Tenant context is required to query "${model}" but none was found. ` +
          'Ensure the request carried a valid X-Tenant-Id header, or that the ' +
          'operation runs inside TenantContext.run().'
        : 'Tenant context is required but none was found.',
    );
    this.name = 'TenantContextMissingError';
  }
}
