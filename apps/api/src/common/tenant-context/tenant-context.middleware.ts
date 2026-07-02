import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { TenantContext } from './tenant-context';

/**
 * Resolves the tenant (School.id) for every incoming request from the
 * `X-Tenant-Id` header (dev/API-client convention; subdomain resolution
 * lands in production per docs/ARCHITECTURE.md) and binds it into
 * AsyncLocalStorage for the lifetime of the request.
 *
 * Deliberately permissive: it does NOT reject requests without the header
 * (platform routes like POST /tenants or well-known health checks have no
 * tenant). Enforcement lives one layer down, in the Prisma tenant-scoping
 * extension, which throws the instant a tenant-scoped model is touched
 * without a bound tenantId. That is the single, airtight choke point.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const header = req.header('X-Tenant-Id');
    const tenantId = header && header.trim().length > 0 ? header.trim() : undefined;
    TenantContext.run({ tenantId }, () => next());
  }
}
