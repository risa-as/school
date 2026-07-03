import { BookOpen } from "lucide-react";

import type { Dictionary } from "@/i18n/types";
import type { ApiGradeLevel, ApiSubject } from "@/lib/api/academics";
import { deleteSubjectAction } from "@/actions/academics";
import { AddSubjectDialog } from "@/components/academics/add-subject-dialog";
import { DeleteRowButton } from "@/components/academics/delete-row-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function SubjectsSection({ subjects, grades, dict }: { subjects: ApiSubject[]; grades: ApiGradeLevel[]; dict: Dictionary }) {
  const labels = dict.academics;
  const gradeById = new Map(grades.map((grade) => [grade.id, grade.name]));

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <CardHeader className="flex-row items-center justify-between border-b bg-card px-5 py-4">
        <CardTitle className="text-sm font-bold">{labels.subjectsTitle}</CardTitle>
        <AddSubjectDialog labels={labels} common={dict.common} grades={grades} />
      </CardHeader>
      <CardContent className="p-0">
        {subjects.length === 0 ? (
          <EmptyState
            bare
            icon={<BookOpen aria-hidden />}
            title={labels.subjectsEmptyTitle}
            description={labels.subjectsEmptyHint}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{labels.columnSubjectName}</TableHead>
                <TableHead>{labels.columnSubjectCode}</TableHead>
                <TableHead>{labels.columnSubjectGrade}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-semibold">{subject.name}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {subject.code ? <bdi dir="ltr">{subject.code}</bdi> : dict.common.notProvided}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {subject.gradeLevelId ? gradeById.get(subject.gradeLevelId) ?? dict.common.notProvided : labels.allGradeLevelsOption}
                  </TableCell>
                  <TableCell>
                    <DeleteRowButton
                      action={deleteSubjectAction.bind(null, subject.id)}
                      itemLabel={subject.name}
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
