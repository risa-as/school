/**
 * Stable, machine-readable error codes for every `HttpException` thrown
 * across the API. Per docs/ARCHITECTURE.md, the response body is
 * `{ statusCode, code, message, errors[] }` — `message` stays Arabic (the
 * default/dev-facing string), `code` is what the 3-locale (ar/ckb/en) web
 * app maps through its own i18n dictionaries instead of parsing prose.
 *
 * Keep this list flat and exhaustive-by-convention: add a new key here
 * whenever a service throws a new distinct error condition, and reuse an
 * existing key when the condition is genuinely the same (e.g. every
 * "row not found in this tenant" case for a given entity uses one code).
 */
export const ErrorCode = {
  // Generic / fallback (used by the global filter for exceptions that were
  // not constructed with an explicit code, e.g. framework-thrown errors).
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TENANT_CONTEXT_MISSING: 'TENANT_CONTEXT_MISSING',

  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  NO_SCHOOL_ACCESS: 'NO_SCHOOL_ACCESS',
  SESSION_INVALID: 'SESSION_INVALID',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  REFRESH_TOKEN_REUSE_DETECTED: 'REFRESH_TOKEN_REUSE_DETECTED',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  SESSION_TENANT_MISMATCH: 'SESSION_TENANT_MISMATCH',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  PLATFORM_ADMIN_KEY_INVALID: 'PLATFORM_ADMIN_KEY_INVALID',

  // Users / memberships
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
  MEMBERSHIP_NOT_FOUND: 'MEMBERSHIP_NOT_FOUND',
  MEMBERSHIP_USER_DATA_REQUIRED: 'MEMBERSHIP_USER_DATA_REQUIRED',
  MEMBERSHIP_USER_CONTACT_REQUIRED: 'MEMBERSHIP_USER_CONTACT_REQUIRED',
  MEMBERSHIP_USER_PASSWORD_REQUIRED: 'MEMBERSHIP_USER_PASSWORD_REQUIRED',

  // Tenants / schools
  SCHOOL_SLUG_TAKEN: 'SCHOOL_SLUG_TAKEN',
  SCHOOL_OWNER_CONTACT_REQUIRED: 'SCHOOL_OWNER_CONTACT_REQUIRED',

  // Students
  STUDENT_NOT_FOUND: 'STUDENT_NOT_FOUND',
  STUDENT_NUMBER_TAKEN: 'STUDENT_NUMBER_TAKEN',

  // Academics
  ACADEMIC_YEAR_NOT_FOUND: 'ACADEMIC_YEAR_NOT_FOUND',
  GRADE_LEVEL_NOT_FOUND: 'GRADE_LEVEL_NOT_FOUND',
  SECTION_NOT_FOUND: 'SECTION_NOT_FOUND',
  SUBJECT_NOT_FOUND: 'SUBJECT_NOT_FOUND',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
