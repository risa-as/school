"use server";

import { redirect } from "next/navigation";

import { getLocaleAndDictionary } from "@/i18n";
import { apiLogin, apiLogout } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { getApiErrorMessage } from "@/lib/api/translate-error";
import { clearAuthCookies, getRefreshToken, setAuthCookies } from "@/lib/api/tokens";

export interface LoginFormState {
  generalError?: string;
  fieldErrors?: {
    identifier?: string;
    password?: string;
  };
}

/**
 * Real auth: `POST /api/v1/auth/login`. Field-level errors are derived from
 * `VALIDATION_ERROR`'s raw class-validator messages (which name the DTO
 * property, e.g. "identifier must be longer than..."), re-expressed as our
 * OWN translated copy rather than displaying the API's raw English string —
 * everything user-facing still comes from the 3-locale dictionary.
 */
export async function loginAction(_prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const { dict } = await getLocaleAndDictionary();

  if (!identifier || !password) {
    return {
      fieldErrors: {
        identifier: identifier ? undefined : dict.auth.identifierFieldError,
        password: password ? undefined : dict.auth.passwordFieldError,
      },
    };
  }

  let tokens;
  try {
    tokens = await apiLogin(identifier, password);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === "VALIDATION_ERROR") {
        return { fieldErrors: mapValidationErrors(error.errors, dict) };
      }
      return { generalError: getApiErrorMessage(dict, error) };
    }
    return { generalError: dict.errors.generic };
  }

  await setAuthCookies(tokens);
  redirect("/dashboard");
}

/** Revokes the refresh token server-side (best-effort — a failure here should never block logout), then clears cookies. */
export async function logoutAction(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    await apiLogout(refreshToken).catch(() => undefined);
  }
  await clearAuthCookies();
  redirect("/login");
}

function mapValidationErrors(
  rawMessages: string[],
  dict: Awaited<ReturnType<typeof getLocaleAndDictionary>>["dict"]
): LoginFormState["fieldErrors"] {
  const fieldErrors: LoginFormState["fieldErrors"] = {};
  for (const raw of rawMessages) {
    const lower = raw.toLowerCase();
    if (lower.includes("identifier")) fieldErrors.identifier = dict.auth.identifierFieldError;
    if (lower.includes("password")) fieldErrors.password = dict.auth.passwordFieldError;
  }
  // Fall back to a general error if the messages didn't name either field.
  return fieldErrors.identifier || fieldErrors.password ? fieldErrors : undefined;
}
