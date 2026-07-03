import "server-only";

import { apiFetch } from "./client";

/** Mirrors `UsersService.findById()`'s `select` (`apps/api/src/users/users.service.ts`) — verified live. */
export interface ApiMe {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  locale: string;
  isActive: boolean;
  createdAt: string;
}

/** `GET /api/v1/users/me` */
export function getMe(): Promise<ApiMe> {
  return apiFetch<ApiMe>("/users/me");
}
