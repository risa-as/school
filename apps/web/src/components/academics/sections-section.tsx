import { Rows3 } from "lucide-react";

import type { Dictionary } from "@/i18n/types";
import type { ApiAcademicYear, ApiGradeLevel, ApiSection } from "@/lib/api/academics";
import { deleteSectionAction } from "@/actions/academics";
import { formatNumber } from "@/lib/format";
import { AddSectionDialog } from "@/components/academics/add-section-dialog";
import { DeleteRowButton } from "@/components/academics/delete-row-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SectionsSectionProps {
  sections: ApiSection[];
  years: ApiAcademicYear[];
  grades: ApiGradeLevel[];
  dict: Dictionary;
}

export function SectionsSection({ sections, years, grades, dict }: SectionsSectionProps) {
  const labels = dict.academics;
  const yearById = new Map(years.map((year) => [year.id, year.name]));
  const gradeById = new Map(grades.map((grade) => [grade.id, grade.name]));
  const canAdd = years.length > 0 && grades.length > 0;

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <CardHeader className="flex-row items-center justify-between border-b bg-card px-5 py-4">
        <CardTitle className="text-sm font-bold">{labels.sectionsTitle}</CardTitle>
        {canAdd && <AddSectionDialog labels={labels} common={dict.common} years={years} grades={grades} />}
      </CardHeader>
      <CardContent className="p-0">
        {sections.length === 0 ? (
          <EmptyState
            bare
            icon={<Rows3 aria-hidden />}
            title={labels.sectionsEmptyTitle}
            description={canAdd ? labels.sectionsEmptyHint : labels.sectionsPrereqHint}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{labels.columnSectionName}</TableHead>
                <TableHead>{labels.columnSectionYear}</TableHead>
                <TableHead>{labels.columnSectionGrade}</TableHead>
                <TableHead className="text-end">{labels.columnCapacity}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell className="font-semibold">{section.name}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {yearById.get(section.academicYearId) ?? dict.common.notProvided}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {gradeById.get(section.gradeLevelId) ?? dict.common.notProvided}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-end tabular-nums">
                    {section.capacity != null ? (
                      <bdi dir="ltr">{formatNumber(section.capacity)}</bdi>
                    ) : (
                      dict.common.notProvided
                    )}
                  </TableCell>
                  <TableCell>
                    <DeleteRowButton
                      action={deleteSectionAction.bind(null, section.id)}
                      itemLabel={section.name}
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
