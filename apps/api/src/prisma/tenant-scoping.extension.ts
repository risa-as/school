import { Prisma } from '@prisma/client';
import { TenantContext } from '../common/tenant-context/tenant-context';
import { applyTenantScope } from './tenant-scoping';
import { buildRelationMap, type RelationMap } from './relation-map';

let cachedRelationMap: RelationMap | undefined;

function getRelationMap(): RelationMap {
  if (!cachedRelationMap) {
    cachedRelationMap = buildRelationMap(Prisma.dmmf.datamodel.models);
  }
  return cachedRelationMap;
}

/**
 * The only place the pure logic in tenant-scoping.ts touches a real Prisma
 * Client. `$allOperations` fires for every query on every model; we hand
 * off to `applyTenantScope` to decide whether/how to mutate `args`, then
 * forward to the untouched `query()` continuation.
 */
export const tenantScopingExtension = Prisma.defineExtension((client) =>
  client.$extends({
    name: 'tenant-scoping',
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          const scopedArgs = applyTenantScope({
            model,
            operation,
            args,
            tenantId: TenantContext.tenantId,
            relationMap: getRelationMap(),
          });
          return query(scopedArgs as never);
        },
      },
    },
  }),
);
