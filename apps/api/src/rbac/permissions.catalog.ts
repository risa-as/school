export interface PermissionCatalogEntry {
  key: string;
  category: string;
  description: string;
}

/**
 * Global permission catalog (NOT tenant-scoped — Permission has no
 * tenantId). Seeded once per environment via `pnpm seed`. Each school's
 * Roles reference these through RolePermission.
 *
 * Phase 1 only — no attendance/grades/fees UI exists yet, but the
 * permission keys are included now so RBAC/seed plumbing doesn't need to
 * change shape when those modules land.
 */
export const PERMISSIONS_CATALOG: PermissionCatalogEntry[] = [
  { key: 'students.read', category: 'students', description: 'عرض بيانات الطلاب' },
  { key: 'students.write', category: 'students', description: 'إضافة وتعديل بيانات الطلاب' },

  { key: 'guardians.read', category: 'guardians', description: 'عرض بيانات أولياء الأمور' },
  { key: 'guardians.write', category: 'guardians', description: 'إضافة وتعديل أولياء الأمور' },

  { key: 'academics.read', category: 'academics', description: 'عرض الهيكل الأكاديمي (سنوات، صفوف، شعب، مواد)' },
  { key: 'academics.write', category: 'academics', description: 'إدارة الهيكل الأكاديمي' },

  { key: 'attendance.take', category: 'attendance', description: 'تسجيل الحضور والغياب' },
  { key: 'attendance.read', category: 'attendance', description: 'عرض سجلات الحضور' },

  { key: 'grades.write', category: 'grades', description: 'إدخال الدرجات' },
  { key: 'grades.read', category: 'grades', description: 'عرض الدرجات' },

  { key: 'fees.collect', category: 'fees', description: 'تحصيل الرسوم الدراسية' },
  { key: 'fees.read', category: 'fees', description: 'عرض السجلات المالية' },
  { key: 'fees.manage', category: 'fees', description: 'إدارة هيكل الرسوم والخصومات' },

  { key: 'users.manage', category: 'users', description: 'إدارة المستخدمين والعضويات' },
  { key: 'roles.manage', category: 'users', description: 'إدارة الأدوار والصلاحيات' },

  { key: 'school.settings.manage', category: 'school', description: 'إدارة إعدادات المدرسة' },
  { key: 'reports.read', category: 'reports', description: 'عرض التقارير' },
];

export const ALL_PERMISSION_KEYS: string[] = PERMISSIONS_CATALOG.map((p) => p.key);
