/**
 * Mirrors `apps/api/src/common/errors/error-codes.ts` exactly. `apps/api` is
 * READ-ONLY reference for this app (per the coordination rules), so this
 * list is hand-kept in sync rather than imported across the workspace
 * boundary — update both files together whenever a service starts throwing
 * a new distinct error condition.
 */
export const API_ERROR_CODES = [
  // Generic / fallback
  "VALIDATION_ERROR",
  "BAD_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "INTERNAL_ERROR",
  "TENANT_CONTEXT_MISSING",

  // Auth
  "INVALID_CREDENTIALS",
  "NO_SCHOOL_ACCESS",
  "SESSION_INVALID",
  "SESSION_EXPIRED",
  "REFRESH_TOKEN_REUSE_DETECTED",
  "AUTH_REQUIRED",
  "SESSION_TENANT_MISMATCH",
  "PERMISSION_DENIED",
  "PLATFORM_ADMIN_KEY_INVALID",

  // Users / memberships
  "USER_NOT_FOUND",
  "ROLE_NOT_FOUND",
  "MEMBERSHIP_NOT_FOUND",
  "MEMBERSHIP_USER_DATA_REQUIRED",
  "MEMBERSHIP_USER_CONTACT_REQUIRED",
  "MEMBERSHIP_USER_PASSWORD_REQUIRED",

  // Tenants / schools
  "SCHOOL_SLUG_TAKEN",
  "SCHOOL_OWNER_CONTACT_REQUIRED",

  // Students
  "STUDENT_NOT_FOUND",
  "STUDENT_NUMBER_TAKEN",

  // Academics
  "ACADEMIC_YEAR_NOT_FOUND",
  "GRADE_LEVEL_NOT_FOUND",
  "SECTION_NOT_FOUND",
  "SUBJECT_NOT_FOUND",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export function isKnownApiErrorCode(code: string): code is ApiErrorCode {
  return (API_ERROR_CODES as readonly string[]).includes(code);
}

/**
 * Mirrors `AllExceptionsFilter`'s `fallbackCodeForStatus` in apps/api — used
 * when a response isn't the expected `{ statusCode, code, message, errors[] }`
 * shape at all (e.g. a proxy/framework error that never reached the filter).
 */
export function fallbackCodeForStatus(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    default:
      return status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST";
  }
}
