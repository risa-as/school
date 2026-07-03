import { CalendarRange } from "lucide-react";

import type { Dictionary } from "@/i18n/types";
import type { ApiAcademicYear } from "@/lib/api/academics";
import { deleteAcademicYearAction } from "@/actions/academics";
import { formatDate } from "@/lib/format";
import { AddAcademicYearDialog } from "@/components/academics/add-academic-year-dialog";
import { DeleteRowButton } from "@/components/academics/delete-row-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AcademicYearsSection({ years, dict }: { years: ApiAcademicYear[]; dict: Dictionary }) {
  const labels = dict.academics;

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <CardHeader className="flex-row items-center justify-between border-b bg-card px-5 py-4">
        <CardTitle className="text-sm font-bold">{labels.yearsTitle}</CardTitle>
        <AddAcademicYearDialog labels={labels} common={dict.common} />
      </CardHeader>
      <CardContent className="p-0">
        {years.length === 0 ? (
          <EmptyState
            bare
            icon={<CalendarRange aria-hidden />}
            title={labels.yearsEmptyTitle}
            description={labels.yearsEmptyHint}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{labels.columnYearName}</TableHead>
                <TableHead className="text-end">{labels.columnStartDate}</TableHead>
                <TableHead className="text-end">{labels.columnEndDate}</TableHead>
                <TableHead>{labels.columnActive}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.map((year) => (
                <TableRow key={year.id}>
                  <TableCell className="font-semibold">{year.name}</TableCell>
                  <TableCell className="whitespace-nowrap text-end tabular-nums">
                    <bdi dir="ltr">{formatDate(year.startDate, { year: "numeric", month: "2-digit", day: "2-digit" })}</bdi>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-end tabular-nums">
                    <bdi dir="ltr">{formatDate(year.endDate, { year: "numeric", month: "2-digit", day: "2-digit" })}</bdi>
                  </TableCell>
                  <TableCell>
                    {year.isActive ? (
                      <Badge variant="success">{labels.activeBadge}</Badge>
                    ) : (
                      <Badge variant="secondary">{labels.inactiveBadge}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DeleteRowButton
                      action={deleteAcademicYearAction.bind(null, year.id)}
                      itemLabel={year.name}
                      common={dict.common}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
