/**
 * Best-effort, UNVERIFIED JWT payload decoding — used only as a courtesy
 * "is it worth proactively refreshing?" check in `middleware.ts` (Edge
 * runtime). Never used for an authorization decision: the API always
 * re-verifies the signature server-side (`JwtAuthGuard`), so a forged/
 * tampered token decoded here as "not expired" simply fails later at the
 * API with a real 401 — this file cannot weaken security, only pick a
 * marginally better UX moment to refresh.
 */

export interface DecodedJwtPayload {
  exp?: number;
  [key: string]: unknown;
}

export function decodeJwtPayload(token: string): DecodedJwtPayload | undefined {
  const parts = token.split(".");
  if (parts.length !== 3) return undefined;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json) as DecodedJwtPayload;
  } catch {
    return undefined;
  }
}

/** True if the token is missing an `exp` claim, is unparsable, or expires within `skewSeconds`. */
export function isJwtExpired(token: string, skewSeconds = 10): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
}
