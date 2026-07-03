"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { getLocaleAndDictionary } from "@/i18n";
import type { Dictionary } from "@/i18n/types";
import { ApiError } from "@/lib/api/errors";
import { createStudent, type ApiGender } from "@/lib/api/students";
import { getApiErrorMessage, mapValidationFieldErrors } from "@/lib/api/translate-error";

export interface CreateStudentFormState {
  generalError?: string;
  fieldErrors?: {
    studentNumber?: string;
    fullName?: string;
  };
  success?: boolean;
}

const GENDER_VALUES: readonly ApiGender[] = ["MALE", "FEMALE"];

/**
 * `POST /api/v1/students` via a server action. Blank optional fields are
 * stripped to `undefined` before the request — the API's `ValidationPipe`
 * validates an empty string against `@IsDateString`/`@IsEnum` even under
 * `@IsOptional()` (only `null`/`undefined` are skipped), verified live
 * against the running API before this was written.
 */
export async function createStudentAction(
  _prevState: CreateStudentFormState,
  formData: FormData
): Promise<CreateStudentFormState> {
  const { dict } = await getLocaleAndDictionary();

  const studentNumber = String(formData.get("studentNumber") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const nationalId = String(formData.get("nationalId") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  const fieldErrors: CreateStudentFormState["fieldErrors"] = {};
  if (!studentNumber) fieldErrors.studentNumber = dict.students.studentNumberFieldError;
  if (fullName.length < 2) fieldErrors.fullName = dict.students.fullNameFieldError;
  if (fieldErrors.studentNumber || fieldErrors.fullName) {
    return { fieldErrors };
  }

  try {
    await createStudent({
      studentNumber,
      fullName,
      dateOfBirth: dateOfBirth || undefined,
      gender: isApiGender(gender) ? gender : undefined,
      nationalId: nationalId || undefined,
      address: address || undefined,
    });
  } catch (error) {
    // `apiFetch` may throw Next's special NEXT_REDIRECT (e.g. a failed
    // silent-refresh redirecting to /login) — must propagate, not be
    // swallowed as a form error. Same pattern as `students/page.tsx`.
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      if (error.code === "VALIDATION_ERROR") {
        return { fieldErrors: mapValidationErrors(error.errors, dict) };
      }
      return { generalError: getApiErrorMessage(dict, error) };
    }
    return { generalError: dict.errors.generic };
  }

  revalidatePath("/students");
  return { success: true };
}

function isApiGender(value: string): value is ApiGender {
  return (GENDER_VALUES as readonly string[]).includes(value);
}

function mapValidationErrors(
  rawMessages: string[],
  dict: Dictionary
): CreateStudentFormState["fieldErrors"] {
  const fieldErrors = mapValidationFieldErrors(rawMessages, {
    studentNumber: { pattern: "studentnumber", message: dict.students.studentNumberFieldError },
    fullName: { pattern: "fullname", message: dict.students.fullNameFieldError },
  });
  return fieldErrors.studentNumber || fieldErrors.fullName ? fieldErrors : undefined;
}
