import "server-only";

/**
 * Origin of the NestJS API (apps/api). Defaults to apps/api's OWN dev
 * default — `PORT=3001` in `apps/api/.env.example` / `apps/api/src/main.ts`
 * — not the 4000 the work order assumed; verified against the actual
 * source, see docs/PROGRESS.md.
 */
const API_ORIGIN = process.env.API_URL ?? "http://localhost:3001";

const API_VERSION_PREFIX = "/api/v1";

export const API_BASE_URL = `${API_ORIGIN}${API_VERSION_PREFIX}`;
