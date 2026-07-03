import { Layers } from "lucide-react";

import type { Dictionary } from "@/i18n/types";
import type { ApiGradeLevel, ApiStageType } from "@/lib/api/academics";
import { deleteGradeLevelAction } from "@/actions/academics";
import { formatNumber } from "@/lib/format";
import { AddGradeLevelDialog } from "@/components/academics/add-grade-level-dialog";
import { DeleteRowButton } from "@/components/academics/delete-row-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function GradeLevelsSection({ grades, dict }: { grades: ApiGradeLevel[]; dict: Dictionary }) {
  const labels = dict.academics;
  const stageLabel: Record<ApiStageType, string> = {
    KINDERGARTEN: labels.stageKindergarten,
    PRIMARY: labels.stagePrimary,
    INTERMEDIATE: labels.stageIntermediate,
    SECONDARY: labels.stageSecondary,
  };

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <CardHeader className="flex-row items-center justify-between border-b bg-card px-5 py-4">
        <CardTitle className="text-sm font-bold">{labels.gradeLevelsTitle}</CardTitle>
        <AddGradeLevelDialog labels={labels} common={dict.common} />
      </CardHeader>
      <CardContent className="p-0">
        {grades.length === 0 ? (
          <EmptyState
            bare
            icon={<Layers aria-hidden />}
            title={labels.gradeLevelsEmptyTitle}
            description={labels.gradeLevelsEmptyHint}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{labels.columnGradeName}</TableHead>
                <TableHead>{labels.columnStage}</TableHead>
                <TableHead className="text-end">{labels.columnOrder}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell className="font-semibold">{grade.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{stageLabel[grade.stage]}</TableCell>
                  <TableCell className="whitespace-nowrap text-end tabular-nums">
                    <bdi dir="ltr">{formatNumber(grade.order)}</bdi>
                  </TableCell>
                  <TableCell>
                    <DeleteRowButton
                      action={deleteGradeLevelAction.bind(null, grade.id)}
                      itemLabel={grade.name}
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
