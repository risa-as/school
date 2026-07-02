import "server-only";

import { apiFetch } from "./client";
import type { Paginated } from "./types";

export type ApiGender = "MALE" | "FEMALE";

/**
 * Mirrors the scalar fields `StudentsService.list()` actually returns
 * (`apps/api/src/students/students.service.ts` — a bare `findMany`, no
 * `include`). NOTE: section/guardian-phone/enrollment-status are relations
 * (`Enrollment`, `StudentGuardian` -> `Guardian` -> `User`) the current list
 * endpoint does not expose — see docs/PROGRESS.md's "API changes needed".
 */
export interface ApiStudent {
  id: string;
  studentNumber: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: ApiGender | null;
  nationalId: string | null;
  address: string | null;
  photoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListStudentsParams {
  page?: number;
  pageSize?: number;
  /** Matches by student name or student number (`PaginationQueryDto.search`). */
  search?: string;
}

/** `GET /api/v1/students` — query params match `PaginationQueryDto` exactly (`page`, `pageSize`, `search`). */
export function listStudents(params: ListStudentsParams = {}): Promise<Paginated<ApiStudent>> {
  const query = new URLSearchParams();
  if (params.page && params.page > 1) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.search) query.set("search", params.search);

  const qs = query.toString();
  return apiFetch<Paginated<ApiStudent>>(`/students${qs ? `?${qs}` : ""}`);
}
