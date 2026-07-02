import "server-only";
import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  TENANT_COOKIE,
  parseExpiresInSeconds,
} from "./cookie-config";
import type { AuthTokensResponse } from "./types";

const isProduction = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: isProduction,
};

export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_TOKEN_COOKIE)?.value;
}

/** Reads the `tenant` cookie (dev: falls back to `DEV_TENANT_ID` env — see docs/RUN_LOCAL.md). */
export async function getTenantId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(TENANT_COOKIE)?.value || process.env.DEV_TENANT_ID || undefined;
}

/**
 * Persists tokens after a successful login/refresh. Next.js only allows
 * cookie mutation from a Server Action or Route Handler, NOT during a plain
 * Server Component render — callers invoked from a render context (e.g. a
 * reactive refresh inside `apiFetch` triggered by a page's data fetch) MUST
 * catch the error this throws in that case. The primary, always-safe path
 * for a proactive refresh is `middleware.ts` (Edge, response-cookie-writable
 * by design) — see docs/PROGRESS.md for the full rationale.
 */
export async function setAuthCookies(tokens: AuthTokensResponse): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: parseExpiresInSeconds(tokens.expiresIn),
  });
  store.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

export async function clearAuthCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}
