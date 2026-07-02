import { ALL_PERMISSION_KEYS } from './permissions.catalog';

export interface DefaultRoleDefinition {
  key: string;
  name: string;
  permissions: string[];
}

/**
 * Default per-school roles, created automatically for every new School
 * (see rbac/seed-default-roles.ts, invoked from TenantsService.createSchool).
 * `key` is stable and machine-readable; `name` is the Arabic display name.
 */
export const DEFAULT_ROLES: DefaultRoleDefinition[] = [
  {
    key: 'owner',
    name: 'مالك المدرسة',
    permissions: ALL_PERMISSION_KEYS,
  },
  {
    key: 'principal',
    name: 'مدير المدرسة',
    permissions: [
      'students.read',
      'students.write',
      'guardians.read',
      'guardians.write',
      'academics.read',
      'academics.write',
      'attendance.read',
      'grades.read',
      'grades.write',
      'fees.read',
      'fees.manage',
      'users.manage',
      'roles.manage',
      'school.settings.manage',
      'reports.read',
    ],
  },
  {
    key: 'registrar',
    name: 'موظف التسجيل',
    permissions: [
      'students.read',
      'students.write',
      'guardians.read',
      'guardians.write',
      'academics.read',
      'reports.read',
    ],
  },
  {
    key: 'accountant',
    name: 'محاسب',
    permissions: ['students.read', 'fees.collect', 'fees.read', 'fees.manage', 'reports.read'],
  },
  {
    key: 'teacher',
    name: 'معلم',
    permissions: ['students.read', 'academics.read', 'attendance.take', 'attendance.read', 'grades.write', 'grades.read'],
  },
  {
    key: 'parent',
    name: 'ولي أمر',
    permissions: ['students.read', 'attendance.read', 'grades.read', 'fees.read'],
  },
  {
    key: 'student',
    name: 'طالب',
    permissions: ['attendance.read', 'grades.read'],
  },
];
