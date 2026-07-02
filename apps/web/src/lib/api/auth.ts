import "server-only";

import { apiFetch } from "./client";
import type { AuthTokensResponse } from "./types";

/** `POST /api/v1/auth/login` — identifier is phone OR email, per apps/api's `LoginDto`. */
export function apiLogin(identifier: string, password: string): Promise<AuthTokensResponse> {
  return apiFetch<AuthTokensResponse>("/auth/login", {
    method: "POST",
    body: { identifier, password },
    skipAuthHeader: true,
    // Login never has a stale token to refresh — makes explicit that a
    // failed login (INVALID_CREDENTIALS etc.) can never trigger a
    // refresh-and-retry, rather than relying on none of login's error
    // codes happening to match the refresh trigger.
    skipAuthRefresh: true,
  });
}

/** `POST /api/v1/auth/logout` — revokes the refresh token server-side (idempotent on the API side). */
export function apiLogout(refreshToken: string): Promise<void> {
  return apiFetch<void>("/auth/logout", {
    method: "POST",
    body: { refreshToken },
    skipAuthHeader: true,
    skipAuthRefresh: true,
  });
}
