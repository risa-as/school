import "server-only";

import { apiFetch } from "./client";

/** Mirrors `StageType` (`apps/api/prisma/schema.prisma`). */
export type ApiStageType = "KINDERGARTEN" | "PRIMARY" | "INTERMEDIATE" | "SECONDARY";

/** `AcademicYear` scalars — `academic-years.service.ts`'s `findAll()`/`create()` return the bare model, no `include`. */
export interface ApiAcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAcademicYearInput {
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

/** `GET /api/v1/academic-years` — returns a plain array, not paginated. */
export function listAcademicYears(): Promise<ApiAcademicYear[]> {
  return apiFetch<ApiAcademicYear[]>("/academic-years");
}

export function createAcademicYear(input: CreateAcademicYearInput): Promise<ApiAcademicYear> {
  return apiFetch<ApiAcademicYear>("/academic-years", { method: "POST", body: input });
}

export function deleteAcademicYear(id: string): Promise<void> {
  return apiFetch<void>(`/academic-years/${id}`, { method: "DELETE" });
}

/** `GradeLevel` scalars. */
export interface ApiGradeLevel {
  id: string;
  name: string;
  stage: ApiStageType;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGradeLevelInput {
  name: string;
  stage: ApiStageType;
  order: number;
}

export function listGradeLevels(): Promise<ApiGradeLevel[]> {
  return apiFetch<ApiGradeLevel[]>("/grade-levels");
}

export function createGradeLevel(input: CreateGradeLevelInput): Promise<ApiGradeLevel> {
  return apiFetch<ApiGradeLevel>("/grade-levels", { method: "POST", body: input });
}

export function deleteGradeLevel(id: string): Promise<void> {
  return apiFetch<void>(`/grade-levels/${id}`, { method: "DELETE" });
}

/**
 * `Section` scalars. `sections.service.ts`'s `findAll()` does a bare
 * `findMany` — `academicYearId`/`gradeLevelId` come back as raw FK strings,
 * no joined name (resolved client-side via the other two lists' lookup maps).
 */
export interface ApiSection {
  id: string;
  academicYearId: string;
  gradeLevelId: string;
  name: string;
  capacity: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSectionInput {
  academicYearId: string;
  gradeLevelId: string;
  name: string;
  capacity?: number;
}

export function listSections(): Promise<ApiSection[]> {
  return apiFetch<ApiSection[]>("/sections");
}

export function createSection(input: CreateSectionInput): Promise<ApiSection> {
  return apiFetch<ApiSection>("/sections", { method: "POST", body: input });
}

export function deleteSection(id: string): Promise<void> {
  return apiFetch<void>(`/sections/${id}`, { method: "DELETE" });
}

/** `Subject` scalars — `gradeLevelId` is optional (a subject can apply to every grade level). */
export interface ApiSubject {
  id: string;
  name: string;
  code: string | null;
  gradeLevelId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectInput {
  name: string;
  code?: string;
  gradeLevelId?: string;
}

export function listSubjects(): Promise<ApiSubject[]> {
  return apiFetch<ApiSubject[]>("/subjects");
}

export function createSubject(input: CreateSubjectInput): Promise<ApiSubject> {
  return apiFetch<ApiSubject>("/subjects", { method: "POST", body: input });
}

export function deleteSubject(id: string): Promise<void> {
  return apiFetch<void>(`/subjects/${id}`, { method: "DELETE" });
}
