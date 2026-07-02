import type { ExtendedPrismaClient } from '../prisma/prisma.service';
import { PERMISSIONS_CATALOG } from './permissions.catalog';
import { DEFAULT_ROLES } from './default-roles';

/**
 * Ensures the global permission catalog exists, then creates the default
 * per-school roles (owner/principal/registrar/accountant/teacher/parent/
 * student) plus their RolePermission grants for one school.
 *
 * IMPORTANT: Role/RolePermission are tenant-scoped models — the caller MUST
 * invoke this inside `TenantContext.run({ tenantId }, ...)` (TenantsService
 * does this right after creating the School row) or the Prisma tenant-
 * scoping extension will throw TenantContextMissingError.
 */
export async function seedDefaultRolesForSchool(prisma: ExtendedPrismaClient, tenantId: string): Promise<void> {
  const permissions = await Promise.all(
    PERMISSIONS_CATALOG.map((entry) =>
      prisma.permission.upsert({
        where: { key: entry.key },
        update: { description: entry.description, category: entry.category },
        create: entry,
      }),
    ),
  );
  const permissionIdByKey = new Map(permissions.map((p) => [p.key, p.id]));

  for (const roleDef of DEFAULT_ROLES) {
    const role = await prisma.role.upsert({
      where: { tenantId_key: { tenantId, key: roleDef.key } },
      update: { name: roleDef.name },
      create: { tenantId, key: roleDef.key, name: roleDef.name, isSystem: true },
    });

    for (const permissionKey of roleDef.permissions) {
      const permissionId = permissionIdByKey.get(permissionKey);
      if (!permissionId) continue; // defensive: catalog/role definitions stay in sync in practice
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { tenantId, roleId: role.id, permissionId },
      });
    }
  }
}
