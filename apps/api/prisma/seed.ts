/**
 * One-off seed script — NOT run automatically (no build/start hook calls
 * this). Run manually with `pnpm seed` after `pnpm prisma migrate dev`.
 *
 * Seeds only the GLOBAL permission catalog (Permission is platform-level,
 * not tenant-scoped, so this needs no TenantContext). Per-school default
 * roles are created automatically by TenantsService.createSchool() via
 * rbac/seed-default-roles.ts whenever a new school is onboarded — there is
 * nothing to backfill here on a fresh environment.
 */
import { PrismaClient } from '@prisma/client';
import { PERMISSIONS_CATALOG } from '../src/rbac/permissions.catalog';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log(`Seeding ${PERMISSIONS_CATALOG.length} global permissions...`);

  for (const entry of PERMISSIONS_CATALOG) {
    await prisma.permission.upsert({
      where: { key: entry.key },
      update: { description: entry.description, category: entry.category },
      create: entry,
    });
  }

  console.log('Done. Default per-school roles are seeded when each School is created (see TenantsService).');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
