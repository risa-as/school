import type { Dictionary } from "@/i18n/types";

import { isKnownApiErrorCode } from "./error-codes";
import type { ApiError } from "./errors";

/** Maps an `ApiError`'s machine-readable `code` through the active locale's dictionary, with a generic fallback. */
export function getApiErrorMessage(dict: Dictionary, error: ApiError): string {
  return isKnownApiErrorCode(error.code) ? dict.errors[error.code] : dict.errors.generic;
}
