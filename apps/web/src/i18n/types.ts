import type { ApiErrorCode } from "@/lib/api/error-codes";

/**
 * Single source of truth for the i18n dictionary shape.
 * Every locale file (`ar.ts`, `ckb.ts`, `en.ts`) must implement this
 * interface in full — TypeScript will error on any missing or misspelled key.
 */
export interface Dictionary {
  common: {
    platformName: string;
    platformTagline: string;
    loading: string;
    currency: string;
    viewAll: string;
    retry: string;
    errorHeading: string;
  };
  nav: {
    dashboard: string;
    students: string;
    sections: string;
    attendance: string;
    grades: string;
    installments: string;
    settings: string;
    toggleSidebar: string;
    openMenu: string;
    closeMenu: string;
  };
  topbar: {
    searchPlaceholder: string;
    notifications: string;
    userMenu: string;
    profile: string;
    logout: string;
    language: string;
  };
  auth: {
    title: string;
    subtitle: string;
    identifierLabel: string;
    identifierPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submit: string;
    submitting: string;
    forgotPassword: string;
    schoolLogoAlt: string;
    /** Shown under the identifier field when the API rejects it as too short/invalid (class-validator). */
    identifierFieldError: string;
    /** Shown under the password field when the API rejects it as too short/invalid (class-validator). */
    passwordFieldError: string;
  };
  dashboard: {
    heading: string;
    kpiStudents: string;
    kpiAttendanceToday: string;
    kpiFeesCollected: string;
    kpiUnreadMessages: string;
    deltaThisMonth: string;
    deltaVsAverage: string;
    deltaVsLastMonth: string;
    fromGuardians: string;
    recentActivityTitle: string;
    recentActivityEmpty: string;
  };
  students: {
    heading: string;
    searchPlaceholder: string;
    searchButton: string;
    addButton: string;
    registryNo: string;
    columnName: string;
    columnGender: string;
    columnDateOfBirth: string;
    columnStatus: string;
    genderMale: string;
    genderFemale: string;
    notProvided: string;
    statusActive: string;
    statusInactive: string;
    prevPage: string;
    nextPage: string;
    /** Placeholders `{page}`/`{total}` are substituted at the call site — position-independent, so word order can differ per locale. */
    pageIndicator: string;
    noResults: string;
    noResultsHint: string;
  };
  /**
   * One entry per `apps/api` error `code` (see `src/lib/api/error-codes.ts`,
   * hand-kept in sync with `apps/api/src/common/errors/error-codes.ts`) plus
   * a `generic` fallback for unknown/network errors.
   */
  errors: Record<ApiErrorCode, string> & { generic: string };
}

/** Recursive dot-path union of every leaf key in `Dictionary`, e.g. "nav.dashboard". */
export type DictionaryPath<T = Dictionary, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : DictionaryPath<T[K], `${Prefix}${K}.`>;
}[keyof T & string];
