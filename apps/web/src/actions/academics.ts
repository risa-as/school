"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { getLocaleAndDictionary } from "@/i18n";
import {
  createAcademicYear,
  createGradeLevel,
  createSection,
  createSubject,
  deleteAcademicYear,
  deleteGradeLevel,
  deleteSection,
  deleteSubject,
  type ApiStageType,
} from "@/lib/api/academics";
import { ApiError } from "@/lib/api/errors";
import { getApiErrorMessage, mapValidationFieldErrors } from "@/lib/api/translate-error";

const ACADEMICS_PATH = "/academics";

export interface AcademicFormState {
  generalError?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

export interface DeleteActionResult {
  error?: string;
}

const STAGE_VALUES: readonly ApiStageType[] = ["KINDERGARTEN", "PRIMARY", "INTERMEDIATE", "SECONDARY"];

function isApiStage(value: string): value is ApiStageType {
  return (STAGE_VALUES as readonly string[]).includes(value);
}

// ---- Academic years ----------------------------------------------------

export async function createAcademicYearAction(
  _prevState: AcademicFormState,
  formData: FormData
): Promise<AcademicFormState> {
  const { dict } = await getLocaleAndDictionary();
  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  const fieldErrors: Record<string, string> = {};
  if (name.length < 4) fieldErrors.name = dict.common.requiredMark;
  if (!startDate) fieldErrors.startDate = dict.common.requiredMark;
  if (!endDate) fieldErrors.endDate = dict.common.requiredMark;
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  try {
    await createAcademicYear({ name, startDate, endDate, isActive });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      if (error.code === "VALIDATION_ERROR") {
        return {
          fieldErrors: mapValidationFieldErrors(error.errors, {
            name: { pattern: "name", message: dict.common.requiredMark },
            startDate: { pattern: "startdate", message: dict.common.requiredMark },
            endDate: { pattern: "enddate", message: dict.common.requiredMark },
          }),
        };
      }
      return { generalError: getApiErrorMessage(dict, error) };
    }
    return { generalError: dict.errors.generic };
  }

  revalidatePath(ACADEMICS_PATH);
  return { success: true };
}

export async function deleteAcademicYearAction(id: string): Promise<DeleteActionResult | void> {
  const { dict } = await getLocaleAndDictionary();
  try {
    await deleteAcademicYear(id);
  } catch (error) {
    unstable_rethrow(error);
    return { error: error instanceof ApiError ? getApiErrorMessage(dict, error) : dict.errors.generic };
  }
  revalidatePath(ACADEMICS_PATH);
}

// ---- Grade levels --------------------------------------------------------

export async function createGradeLevelAction(
  _prevState: AcademicFormState,
  formData: FormData
): Promise<AcademicFormState> {
  const { dict } = await getLocaleAndDictionary();
  const name = String(formData.get("name") ?? "").trim();
  const stage = String(formData.get("stage") ?? "").trim();
  const orderRaw = String(formData.get("order") ?? "").trim();
  const order = Number(orderRaw);

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = dict.common.requiredMark;
  if (!isApiStage(stage)) fieldErrors.stage = dict.common.requiredMark;
  if (!orderRaw || !Number.isInteger(order) || order < 1) fieldErrors.order = dict.common.requiredMark;
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  try {
    await createGradeLevel({ name, stage: stage as ApiStageType, order });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      if (error.code === "VALIDATION_ERROR") {
        return {
          fieldErrors: mapValidationFieldErrors(error.errors, {
            name: { pattern: "name", message: dict.common.requiredMark },
            stage: { pattern: "stage", message: dict.common.requiredMark },
            order: { pattern: "order", message: dict.common.requiredMark },
          }),
        };
      }
      return { generalError: getApiErrorMessage(dict, error) };
    }
    return { generalError: dict.errors.generic };
  }

  revalidatePath(ACADEMICS_PATH);
  return { success: true };
}

export async function deleteGradeLevelAction(id: string): Promise<DeleteActionResult | void> {
  const { dict } = await getLocaleAndDictionary();
  try {
    await deleteGradeLevel(id);
  } catch (error) {
    unstable_rethrow(error);
    return { error: error instanceof ApiError ? getApiErrorMessage(dict, error) : dict.errors.generic };
  }
  revalidatePath(ACADEMICS_PATH);
}

// ---- Sections --------------------------------------------------------------

export async function createSectionAction(
  _prevState: AcademicFormState,
  formData: FormData
): Promise<AcademicFormState> {
  const { dict } = await getLocaleAndDictionary();
  const academicYearId = String(formData.get("academicYearId") ?? "").trim();
  const gradeLevelId = String(formData.get("gradeLevelId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const capacityRaw = String(formData.get("capacity") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!academicYearId) fieldErrors.academicYearId = dict.common.requiredMark;
  if (!gradeLevelId) fieldErrors.gradeLevelId = dict.common.requiredMark;
  if (!name) fieldErrors.name = dict.common.requiredMark;
  let capacity: number | undefined;
  if (capacityRaw) {
    capacity = Number(capacityRaw);
    if (!Number.isInteger(capacity) || capacity < 1) fieldErrors.capacity = dict.common.requiredMark;
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  try {
    await createSection({ academicYearId, gradeLevelId, name, capacity });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      if (error.code === "VALIDATION_ERROR") {
        return {
          fieldErrors: mapValidationFieldErrors(error.errors, {
            academicYearId: { pattern: "academicyearid", message: dict.common.requiredMark },
            gradeLevelId: { pattern: "gradelevelid", message: dict.common.requiredMark },
            name: { pattern: "name", message: dict.common.requiredMark },
            capacity: { pattern: "capacity", message: dict.common.requiredMark },
          }),
        };
      }
      return { generalError: getApiErrorMessage(dict, error) };
    }
    return { generalError: dict.errors.generic };
  }

  revalidatePath(ACADEMICS_PATH);
  return { success: true };
}

export async function deleteSectionAction(id: string): Promise<DeleteActionResult | void> {
  const { dict } = await getLocaleAndDictionary();
  try {
    await deleteSection(id);
  } catch (error) {
    unstable_rethrow(error);
    return { error: error instanceof ApiError ? getApiErrorMessage(dict, error) : dict.errors.generic };
  }
  revalidatePath(ACADEMICS_PATH);
}

// ---- Subjects --------------------------------------------------------------

export async function createSubjectAction(
  _prevState: AcademicFormState,
  formData: FormData
): Promise<AcademicFormState> {
  const { dict } = await getLocaleAndDictionary();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const gradeLevelId = String(formData.get("gradeLevelId") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = dict.common.requiredMark;
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  try {
    await createSubject({ name, code: code || undefined, gradeLevelId: gradeLevelId || undefined });
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      if (error.code === "VALIDATION_ERROR") {
        return {
          fieldErrors: mapValidationFieldErrors(error.errors, {
            name: { pattern: "name", message: dict.common.requiredMark },
          }),
        };
      }
      return { generalError: getApiErrorMessage(dict, error) };
    }
    return { generalError: dict.errors.generic };
  }

  revalidatePath(ACADEMICS_PATH);
  return { success: true };
}

export async function deleteSubjectAction(id: string): Promise<DeleteActionResult | void> {
  const { dict } = await getLocaleAndDictionary();
  try {
    await deleteSubject(id);
  } catch (error) {
    unstable_rethrow(error);
    return { error: error instanceof ApiError ? getApiErrorMessage(dict, error) : dict.errors.generic };
  }
  revalidatePath(ACADEMICS_PATH);
}
