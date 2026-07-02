import { NotFoundException } from '@nestjs/common';

/**
 * Cross-tenant FK guard.
 *
 * The Prisma tenant-scoping extension (`tenant-scoping.ts`) stamps/validates
 * the OWN `tenantId` of the row being written and walks nested relation
 * *objects* (`create`/`createMany`/`connectOrCreate`) — but it has no way to
 * know which plain scalar fields on a DTO (e.g. `academicYearId`,
 * `gradeLevelId`) are foreign keys into ANOTHER tenant-scoped model. Without
 * an explicit check, a caller in School A could attach a row to School B's
 * academic structure just by guessing/leaking a UUID.
 *
 * Call this for every scalar FK field accepted from a DTO that references a
 * tenant-scoped model, in BOTH `create` and `update`, before writing.
 * `finder` MUST be a call through `PrismaService.client` (never a raw
 * Prisma delegate) so the tenant-scoping extension injects `where.tenantId`
 * for you — a row belonging to another tenant then comes back `null`
 * exactly like a row that doesn't exist at all, so this reveals no more
 * than a plain "not found" (no cross-tenant existence oracle).
 *
 * See docs/ARCHITECTURE.md "Cross-tenant FK rule" — every new module that
 * accepts a scalar FK from a DTO must add this check.
 */
export async function assertSameTenant(
  finder: () => Promise<unknown>,
  code: string,
  message: string,
): Promise<void> {
  const row = await finder();
  if (!row) {
    throw new NotFoundException({ code, message });
  }
}
