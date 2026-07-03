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
    notProvided: string;
    save: string;
    saving: string;
    cancel: string;
    add: string;
    delete: string;
    deleting: string;
    close: string;
    /** Placeholder `{item}` substituted at the call site, e.g. "Delete {item}?". */
    deleteConfirmTitle: string;
    deleteConfirmBody: string;
    requiredMark: string;
    underDevelopmentTitle: string;
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
    addDialogTitle: string;
    addDialogDescription: string;
    studentNumberLabel: string;
    studentNumberPlaceholder: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    dateOfBirthLabel: string;
    genderLabel: string;
    genderUnspecified: string;
    nationalIdLabel: string;
    nationalIdPlaceholder: string;
    addressLabel: string;
    addressPlaceholder: string;
    studentNumberFieldError: string;
    fullNameFieldError: string;
  };
  academics: {
    heading: string;

    yearsTitle: string;
    yearsAddButton: string;
    yearsAddDescription: string;
    yearsEmptyTitle: string;
    yearsEmptyHint: string;
    yearNameLabel: string;
    yearNamePlaceholder: string;
    yearStartDateLabel: string;
    yearEndDateLabel: string;
    yearIsActiveLabel: string;
    columnYearName: string;
    columnStartDate: string;
    columnEndDate: string;
    columnActive: string;
    activeBadge: string;
    inactiveBadge: string;

    gradeLevelsTitle: string;
    gradeLevelsAddButton: string;
    gradeLevelsAddDescription: string;
    gradeLevelsEmptyTitle: string;
    gradeLevelsEmptyHint: string;
    gradeLevelNameLabel: string;
    gradeLevelNamePlaceholder: string;
    stageLabel: string;
    stageKindergarten: string;
    stagePrimary: string;
    stageIntermediate: string;
    stageSecondary: string;
    orderLabel: string;
    orderPlaceholder: string;
    columnGradeName: string;
    columnStage: string;
    columnOrder: string;

    sectionsTitle: string;
    sectionsAddButton: string;
    sectionsAddDescription: string;
    sectionsEmptyTitle: string;
    sectionsEmptyHint: string;
    sectionsPrereqHint: string;
    sectionNameLabel: string;
    sectionNamePlaceholder: string;
    academicYearLabel: string;
    gradeLevelLabel: string;
    capacityLabel: string;
    capacityPlaceholder: string;
    columnSectionName: string;
    columnSectionYear: string;
    columnSectionGrade: string;
    columnCapacity: string;

    subjectsTitle: string;
    subjectsAddButton: string;
    subjectsAddDescription: string;
    subjectsEmptyTitle: string;
    subjectsEmptyHint: string;
    subjectNameLabel: string;
    subjectNamePlaceholder: string;
    subjectCodeLabel: string;
    subjectCodePlaceholder: string;
    subjectGradeLevelLabel: string;
    allGradeLevelsOption: string;
    columnSubjectName: string;
    columnSubjectCode: string;
    columnSubjectGrade: string;

    selectPlaceholder: string;
  };
  attendance: {
    heading: string;
    emptyDescription: string;
  };
  grades: {
    heading: string;
    emptyDescription: string;
  };
  fees: {
    heading: string;
    emptyDescription: string;
  };
  settings: {
    heading: string;
    profileTitle: string;
    nameLabel: string;
    emailLabel: string;
    phoneLabel: string;
    roleLabel: string;
    languageTitle: string;
    languageDescription: string;
    accountTitle: string;
    logoutDescription: string;
  };
  roles: {
    owner: string;
    principal: string;
    registrar: string;
    accountant: string;
    teacher: string;
    parent: string;
    student: string;
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
