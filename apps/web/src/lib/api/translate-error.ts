import type { Dictionary } from "@/i18n/types";

import { isKnownApiErrorCode } from "./error-codes";
import type { ApiError } from "./errors";

/** Maps an `ApiError`'s machine-readable `code` through the active locale's dictionary, with a generic fallback. */
export function getApiErrorMessage(dict: Dictionary, error: ApiError): string {
  return isKnownApiErrorCode(error.code) ? dict.errors[error.code] : dict.errors.generic;
}

/**
 * Re-expresses a `VALIDATION_ERROR`'s raw class-validator messages (which
 * name the DTO property, e.g. "name must be longer than...") as OUR OWN
 * translated per-field copy — never displaying the API's raw English
 * validation prose in an Arabic/Kurdish UI. `fieldMessages` maps a form
 * field key to the (lowercase) DTO property-name substring to match against
 * each raw message, plus the translated message to show when it matches.
 */
export function mapValidationFieldErrors<T extends string>(
  rawMessages: string[],
  fieldMessages: Record<T, { pattern: string; message: string }>
): Partial<Record<T, string>> {
  const result: Partial<Record<T, string>> = {};
  for (const raw of rawMessages) {
    const lower = raw.toLowerCase();
    for (const key in fieldMessages) {
      const { pattern, message } = fieldMessages[key];
      if (lower.includes(pattern)) result[key] = message;
    }
  }
  return result;
}
