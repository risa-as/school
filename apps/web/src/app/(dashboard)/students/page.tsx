import { Suspense } from "react";
import { unstable_rethrow } from "next/navigation";
import {
  AlertCircle,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Search,
  UserRoundSearch,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { getLocaleAndDictionary } from "@/i18n";
import type { Dictionary } from "@/i18n/types";
import { ApiError } from "@/lib/api/errors";
import { listStudents, type ApiStudent } from "@/lib/api/students";
import { getApiErrorMessage } from "@/lib/api/translate-error";
import { formatDate } from "@/lib/format";
import { AddStudentDialog } from "@/components/students/add-student-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;

interface StudentsPageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const { dict } = await getLocaleAndDictionary();
  const params = await searchParams;
  const page = normalizePage(params.page);
  const search = params.search?.trim() || undefined;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">{dict.students.heading}</h1>

        <div className="ms-auto flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {/* Plain GET form — no client JS needed for search, matches the 3G/minimal-JS budget. */}
          <form action="/students" method="get" className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="search"
              defaultValue={search}
              placeholder={dict.students.searchPlaceholder}
              className="ps-9"
            />
            <button type="submit" className="sr-only">
              {dict.students.searchButton}
            </button>
          </form>

          <AddStudentDialog labels={dict.students} common={dict.common} />
        </div>
      </div>

      <Suspense key={`${page}:${search ?? ""}`} fallback={<StudentsTableSkeleton dict={dict} />}>
        <StudentsResults page={page} search={search} dict={dict} />
      </Suspense>
    </>
  );
}

async function StudentsResults({
  page,
  search,
  dict,
}: {
  page: number;
  search: string | undefined;
  dict: Dictionary;
}) {
  let result;
  try {
    result = await listStudents({ page, pageSize: PAGE_SIZE, search });
  } catch (error) {
    // `apiFetch` calls `redirect("/login")` when a refresh attempt fails —
    // that works by THROWING a special `NEXT_REDIRECT` error the framework
    // expects to propagate. Without re-throwing it here, this catch would
    // swallow it and render the generic error card instead of redirecting.
    unstable_rethrow(error);
    const message = error instanceof ApiError ? getApiErrorMessage(dict, error) : dict.errors.generic;
    return <StudentsErrorState message={message} dict={dict} search={search} />;
  }

  if (result.items.length === 0) {
    return <StudentsEmptyState dict={dict} />;
  }

  return (
    <>
      <Card className="gap-0 overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{dict.students.columnName}</TableHead>
              <TableHead>{dict.students.columnGender}</TableHead>
              {/* date column → end-aligned numerals in both directions (§7.3) */}
              <TableHead className="text-end">{dict.students.columnDateOfBirth}</TableHead>
              <TableHead>{dict.students.columnStatus}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((student) => (
              <StudentRow key={student.id} student={student} dict={dict} />
            ))}
          </TableBody>
        </Table>
      </Card>

      <StudentsPagination page={result.page} totalPages={result.totalPages} search={search} dict={dict} />
    </>
  );
}

function StudentRow({ student, dict }: { student: ApiStudent; dict: Dictionary }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-bold text-secondary-foreground"
          >
            {student.fullName.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{student.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {dict.students.registryNo}: <bdi dir="ltr">{student.studentNumber}</bdi>
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {student.gender === "MALE"
          ? dict.students.genderMale
          : student.gender === "FEMALE"
            ? dict.students.genderFemale
            : dict.students.notProvided}
      </TableCell>
      <TableCell className="whitespace-nowrap text-end tabular-nums">
        {student.dateOfBirth ? (
          <bdi dir="ltr">{formatDate(student.dateOfBirth, { year: "numeric", month: "2-digit", day: "2-digit" })}</bdi>
        ) : (
          dict.students.notProvided
        )}
      </TableCell>
      <TableCell>
        {student.isActive ? (
          <Badge variant="success">
            <BadgeCheck aria-hidden />
            {dict.students.statusActive}
          </Badge>
        ) : (
          <Badge variant="warning">
            <CircleOff aria-hidden />
            {dict.students.statusInactive}
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );
}

function StudentsPagination({
  page,
  totalPages,
  search,
  dict,
}: {
  page: number;
  totalPages: number;
  search: string | undefined;
  dict: Dictionary;
}) {
  const indicator = dict.students.pageIndicator
    .replace("{page}", String(page))
    .replace("{total}", String(totalPages));
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        asChild
        variant="outline"
        size="sm"
        className={cn(prevDisabled && "pointer-events-none opacity-50")}
      >
        <a
          href={prevDisabled ? undefined : buildStudentsHref(page - 1, search)}
          aria-disabled={prevDisabled}
          tabIndex={prevDisabled ? -1 : undefined}
        >
          {/* Base orientation is correct for RTL (default locale); flipped only under ltr — DESIGN_SYSTEM §7.1. */}
          <ChevronRight aria-hidden className="ltr:-scale-x-100" />
          {dict.students.prevPage}
        </a>
      </Button>

      {/* No `bdi dir="ltr"` wrapper here (unlike pure-numeric values elsewhere,
          e.g. KpiCard/guardian phone) — `indicator` mixes Arabic/Kurdish WORDS
          with digits, and forcing an LTR base direction on a mixed sentence
          would lay the words out left-to-right instead of the digits simply
          rendering left-to-right within their natural RTL context, which the
          Unicode bidi algorithm already handles correctly on its own. */}
      <span className="text-sm text-muted-foreground">{indicator}</span>

      <Button
        asChild
        variant="outline"
        size="sm"
        className={cn(nextDisabled && "pointer-events-none opacity-50")}
      >
        <a
          href={nextDisabled ? undefined : buildStudentsHref(page + 1, search)}
          aria-disabled={nextDisabled}
          tabIndex={nextDisabled ? -1 : undefined}
        >
          {dict.students.nextPage}
          <ChevronLeft aria-hidden className="ltr:-scale-x-100" />
        </a>
      </Button>
    </div>
  );
}

function StudentsErrorState({
  message,
  search,
  dict,
}: {
  message: string;
  search: string | undefined;
  dict: Dictionary;
}) {
  return (
    <Card className="items-center gap-3 px-6 py-12 text-center">
      <AlertCircle className="size-10 text-destructive" aria-hidden />
      <h2 className="font-bold">{dict.common.errorHeading}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button asChild variant="outline" size="sm" className="mt-1">
        <a href={buildStudentsHref(1, search)}>{dict.common.retry}</a>
      </Button>
    </Card>
  );
}

function StudentsEmptyState({ dict }: { dict: Dictionary }) {
  return (
    <Card className="items-center gap-3 px-6 py-12 text-center">
      <UserRoundSearch className="size-10 text-muted-foreground" aria-hidden />
      <h2 className="font-bold">{dict.students.noResults}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{dict.students.noResultsHint}</p>
    </Card>
  );
}

function StudentsTableSkeleton({ dict }: { dict: Dictionary }) {
  return (
    <Card className="gap-0 overflow-hidden p-0" aria-busy aria-label={dict.common.loading}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{dict.students.columnName}</TableHead>
            <TableHead>{dict.students.columnGender}</TableHead>
            <TableHead className="text-end">{dict.students.columnDateOfBirth}</TableHead>
            <TableHead>{dict.students.columnStatus}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <span className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="h-3.5 w-32 animate-pulse rounded bg-muted" />
                    <span className="h-3 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="block h-3.5 w-12 animate-pulse rounded bg-muted" />
              </TableCell>
              <TableCell className="text-end">
                <span className="ms-auto block h-3.5 w-20 animate-pulse rounded bg-muted" />
              </TableCell>
              <TableCell>
                <span className="block h-5 w-16 animate-pulse rounded-full bg-muted" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function normalizePage(raw: string | undefined): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function buildStudentsHref(page: number, search: string | undefined): string {
  const query = new URLSearchParams();
  if (page > 1) query.set("page", String(page));
  if (search) query.set("search", search);
  const qs = query.toString();
  return qs ? `/students?${qs}` : "/students";
}
