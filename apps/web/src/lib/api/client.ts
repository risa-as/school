import "server-only";
import { redirect } from "next/navigation";

import { API_BASE_URL } from "./config";
import { fallbackCodeForStatus } from "./error-codes";
import { ApiError, type ApiErrorBody } from "./errors";
import { clearAuthCookies, getAccessToken, getRefreshToken, getTenantId, setAuthCookies } from "./tokens";
import type { AuthTokensResponse } from "./types";

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /** Plain object body — JSON.stringify'd automatically. Pass a string to send as-is. */
  body?: unknown;
  /** Skip attaching `Authorization` (used by `/auth/login`, which has no token yet). */
  skipAuthHeader?: boolean;
  /**
   * Skip the automatic refresh-and-retry-on-401. Used internally by the
   * refresh call itself (and by `/auth/logout`) so a failing refresh can
   * never trigger another refresh attempt.
   */
  skipAuthRefresh?: boolean;
}

/**
 * Server-side-only typed fetch wrapper around `apps/api` (`/api/v1/*`).
 * Always sends `X-Tenant-Id` (tenant cookie, dev fallback `DEV_TENANT_ID`)
 * and, unless `skipAuthHeader`, `Authorization: Bearer <access token>`.
 *
 * On a 401 caused by a missing/expired access token, attempts ONE refresh
 * (`POST /auth/refresh`) and retries the original request once; if the
 * refresh fails, clears cookies and redirects to `/login`. Note: the
 * *proactive*, cookie-persisting refresh happens in `middleware.ts` (the
 * only place Next.js allows writing cookies ahead of a page render) — this
 * reactive path is the fallback for the rare case a token expires between
 * middleware and the actual data fetch; see docs/PROGRESS.md.
 *
 * Every request is `cache: "no-store"` — tenant-scoped responses must never
 * be cached across tenants/sessions by the Next.js fetch cache.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  return performRequest<T>(path, options, false);
}

async function performRequest<T>(
  path: string,
  options: ApiFetchOptions,
  isRetry: boolean,
  overrideAccessToken?: string
): Promise<T> {
  const { skipAuthHeader, skipAuthRefresh, body, headers, ...rest } = options;

  const [tenantId, accessToken] = await Promise.all([
    getTenantId(),
    overrideAccessToken ? Promise.resolve(overrideAccessToken) : skipAuthHeader ? Promise.resolve(undefined) : getAccessToken(),
  ]);

  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  const hasBody = body !== undefined;
  if (hasBody && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (tenantId) requestHeaders.set("X-Tenant-Id", tenantId);
  if (accessToken) requestHeaders.set("Authorization", `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: requestHeaders,
      body: hasBody ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
      // Tenant-scoped data must never be served from Next.js's fetch cache
      // across different tenants/sessions.
      cache: "no-store",
    });
  } catch {
    throw new ApiError({
      statusCode: 0,
      code: "NETWORK_ERROR",
      message: "Unable to reach the API server.",
      errors: [],
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const rawBody = await response.text();
  const parsed = rawBody ? safeJsonParse(rawBody) : undefined;

  if (response.ok) {
    return parsed as T;
  }

  const errorBody = normalizeErrorBody(response.status, parsed);

  const shouldAttemptRefresh =
    response.status === 401 &&
    !skipAuthRefresh &&
    !isRetry &&
    (errorBody.code === "SESSION_EXPIRED" || errorBody.code === "AUTH_REQUIRED");

  if (shouldAttemptRefresh) {
    const refreshedAccessToken = await attemptRefresh();
    if (refreshedAccessToken) {
      return performRequest<T>(path, options, true, refreshedAccessToken);
    }
    await safelyClearAuthCookies();
    redirect("/login");
  }

  throw new ApiError(errorBody);
}

/** Returns the fresh access token on success (even if cookie persistence failed), or `undefined`. */
async function attemptRefresh(): Promise<string | undefined> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return undefined;

  let tokens: AuthTokensResponse;
  try {
    tokens = await performRequest<AuthTokensResponse>(
      "/auth/refresh",
      { method: "POST", body: { refreshToken }, skipAuthHeader: true, skipAuthRefresh: true },
      true
    );
  } catch {
    return undefined;
  }

  try {
    await setAuthCookies(tokens);
  } catch {
    // Called from a Server Component render, where Next.js forbids cookie
    // mutation — the fresh access token below still lets THIS request's
    // retry succeed; the browser's cookies stay stale until the next
    // navigation's proactive middleware refresh picks them back up.
  }

  return tokens.accessToken;
}

async function safelyClearAuthCookies(): Promise<void> {
  try {
    await clearAuthCookies();
  } catch {
    // Same render-context restriction as above — middleware cleans up
    // stale cookies on the next navigation to /login regardless.
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function normalizeErrorBody(status: number, parsed: unknown): ApiErrorBody {
  if (parsed && typeof parsed === "object") {
    const record = parsed as Partial<ApiErrorBody>;
    if (typeof record.code === "string" && typeof record.message === "string") {
      return {
        statusCode: typeof record.statusCode === "number" ? record.statusCode : status,
        code: record.code,
        message: record.message,
        errors: Array.isArray(record.errors) ? record.errors.map(String) : [],
      };
    }
  }
  return { statusCode: status, code: fallbackCodeForStatus(status), message: "Request failed", errors: [] };
}
