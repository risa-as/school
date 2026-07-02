import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Marks a route as requiring one or more RBAC permission keys, e.g.
 * `@Permissions('students.read')`. Enforced by PermissionsGuard, which
 * reads the caller's permission keys off the JWT access token payload
 * (populated at login from Role -> RolePermission -> Permission).
 */
export const Permissions = (...permissions: string[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(PERMISSIONS_KEY, permissions);
