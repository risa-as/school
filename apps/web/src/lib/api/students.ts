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

/**
 * Mirrors `CreateStudentDto` (`apps/api/src/students/dto/create-student.dto.ts`)
 * field-for-field. Optional fields MUST be omitted (not sent as `""`) when
 * blank — `@IsOptional()` only skips `null`/`undefined`, an empty string still
 * fails `@IsDateString`/`@IsEnum` (verified live against the running API).
 */
export interface CreateStudentInput {
  studentNumber: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: ApiGender;
  nationalId?: string;
  address?: string;
}

/** `POST /api/v1/students` */
export function createStudent(input: CreateStudentInput): Promise<ApiStudent> {
  return apiFetch<ApiStudent>("/students", { method: "POST", body: input });
}
