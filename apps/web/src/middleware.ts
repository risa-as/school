import { NextResponse, type NextRequest } from "next/server";

import { API_BASE_URL } from "@/lib/api/config";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  TENANT_COOKIE,
  parseExpiresInSeconds,
} from "@/lib/api/cookie-config";
import { isJwtExpired } from "@/lib/api/edge-jwt";

/**
 * Auth route guard + PROACTIVE token refresh.
 *
 * Why the refresh lives here rather than reactively in `apiFetch` alone:
 * Next.js only allows cookie mutation from a Server Action, Route Handler,
 * or Middleware — NOT during a plain Server Component render. Since the
 * refresh token is single-use/rotating, a refresh call whose result can't be
 * persisted would strand the browser with an already-consumed token. So the
 * cookie-writable place (here, before the page ever renders) does the real
 * work; `apiFetch`'s reactive 401 handler is only a fallback for the rare
 * case a token expires in the few minutes between this check and the actual
 * data fetch (see its doc comment in `src/lib/api/client.ts`).
 *
 * Only `access_token`'s presence/validity is checked for route gating —
 * NOT a stubbed `session` cookie — `refresh_token`'s presence is the actual
 * "is there a session at all" signal (access tokens naturally expire every
 * ~15 minutes and are refreshed transparently here).
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === "/login";

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const hasValidAccessToken = Boolean(accessToken && !isJwtExpired(accessToken));

  if (hasValidAccessToken) {
    return isLoginRoute ? NextResponse.redirect(new URL("/dashboard", request.url)) : NextResponse.next();
  }

  if (!refreshToken) {
    return isLoginRoute ? NextResponse.next() : redirectToLogin(request);
  }

  const tenantId = request.cookies.get(TENANT_COOKIE)?.value || process.env.DEV_TENANT_ID;
  const refreshed = await refreshTokens(refreshToken, tenantId);

  if (!refreshed) {
    if (isLoginRoute) {
      const response = NextResponse.next();
      response.cookies.delete(ACCESS_TOKEN_COOKIE);
      response.cookies.delete(REFRESH_TOKEN_COOKIE);
      return response;
    }
    return redirectToLogin(request);
  }

  // Make the refreshed access token visible both to THIS request's Server
  // Components (which read cookies via `next/headers`) and to the browser.
  request.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.accessToken);
  request.cookies.set(REFRESH_TOKEN_COOKIE, refreshed.refreshToken);

  const response = isLoginRoute
    ? NextResponse.redirect(new URL("/dashboard", request.url))
    : NextResponse.next({ request });

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = { httpOnly: true, sameSite: "lax" as const, path: "/", secure: isProduction };
  response.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.accessToken, {
    ...cookieOptions,
    maxAge: parseExpiresInSeconds(refreshed.expiresIn),
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshed.refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });

  return response;
}

function redirectToLogin(request: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  return response;
}

interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/** Edge-safe (plain `fetch`, no `next/headers`) call to `POST /auth/refresh`. */
async function refreshTokens(refreshToken: string, tenantId: string | undefined): Promise<RefreshedTokens | null> {
  try {
    const headers = new Headers({ "Content-Type": "application/json", Accept: "application/json" });
    if (tenantId) headers.set("X-Tenant-Id", tenantId);

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers,
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    if (!response.ok) return null;
    return (await response.json()) as RefreshedTokens;
  } catch {
    return null;
  }
}

export const config = {
  // Every route except Next internals, the favicon, and static files served
  // from /public (anything with a file extension) — so a logged-out request
  // for a public asset 404s/serves normally instead of 307-ing to /login.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)"],
};
