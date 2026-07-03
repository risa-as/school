/**
 * Cookie names + lifetimes shared between `middleware.ts` (Edge runtime,
 * reads/writes via `NextRequest`/`NextResponse` cookie APIs) and
 * `src/lib/api/tokens.ts` (Node/Server Actions/Server Components, reads/
 * writes via `next/headers`'s `cookies()`). Deliberately framework-agnostic
 * (no `next/headers` import here) so both runtimes can import it safely.
 */

/** Short-lived JWT access token (apps/api default: 15 minutes — see apps/api/.env.example JWT_ACCESS_EXPIRES_IN). */
export const ACCESS_TOKEN_COOKIE = "access_token";

/** Opaque, rotating, long-lived refresh token (apps/api default: 30 days — JWT_REFRESH_EXPIRES_IN_DAYS). */
export const REFRESH_TOKEN_COOKIE = "refresh_token";

/** School (tenant) id sent as `X-Tenant-Id` on every API request. Dev fallback: `DEV_TENANT_ID` env var. */
export const TENANT_COOKIE = "tenant";

/**
 * The current membership's role key (e.g. "owner"), for DISPLAY ONLY (never
 * an authorization decision — permissions are always re-verified server-side
 * via the JWT). `GET /users/me` doesn't return it (a `User` is
 * platform-level, shared across schools; role is per-`Membership`) — only
 * `POST /auth/login`'s response body includes it, so it's persisted here at
 * login time. Deliberately NOT refreshed by `POST /auth/refresh` (its
 * response omits `user` entirely, see `middleware.ts`'s `RefreshedTokens`
 * type) — a role changing mid-session and this label going briefly stale
 * until the next login is an acceptable simplification for a display-only
 * value.
 */
export const ROLE_KEY_COOKIE = "role_key";

/**
 * The API never echoes the refresh token's own TTL back in the
 * `/auth/refresh` response body (only the access token's `expiresIn`), so
 * this mirrors apps/api's `JWT_REFRESH_EXPIRES_IN_DAYS` default. Keep in
 * sync with apps/api/.env.example.
 */
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** Fallback when `expiresIn` can't be parsed — apps/api's own default (`JWT_ACCESS_EXPIRES_IN`). */
const DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;

/** Parses a JWT-style duration string ("15m", "1h", "30d", "45s") into seconds. */
export function parseExpiresInSeconds(
  expiresIn: string,
  fallbackSeconds: number = DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS
): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(expiresIn.trim());
  if (!match) return fallbackSeconds;

  const amount = Number(match[1]);
  const unitSeconds: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return amount * unitSeconds[match[2]];
}
