/**
 * The exhaustive list of Prisma model names that carry `tenantId`.
 * Kept as an explicit allowlist (rather than derived implicitly) so adding a
 * new tenant-scoped model to schema.prisma is a deliberate, reviewable step
 * here too — silence would mean "not tenant-scoped", which is the wrong
 * failure mode for a security boundary.
 *
 * Phase 1 — keep in sync with prisma/schema.prisma. Do NOT add
 * attendance/grades/fees models until they exist in the schema.
 */
export const TENANT_SCOPED_MODELS = [
  'Membership',
  'Role',
  'RolePermission',
  'AcademicYear',
  'GradeLevel',
  'Section',
  'Subject',
  'Student',
  'Guardian',
  'StudentGuardian',
  'Enrollment',
] as const;

export type TenantScopedModel = (typeof TENANT_SCOPED_MODELS)[number];

const TENANT_SCOPED_MODEL_SET: ReadonlySet<string> = new Set(TENANT_SCOPED_MODELS);

export function isTenantScopedModel(model: string | undefined | null): model is TenantScopedModel {
  return !!model && TENANT_SCOPED_MODEL_SET.has(model);
}
