import { unstable_rethrow } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { getLocaleAndDictionary } from "@/i18n";
import { ApiError } from "@/lib/api/errors";
import { listAcademicYears, listGradeLevels, listSections, listSubjects } from "@/lib/api/academics";
import { getApiErrorMessage } from "@/lib/api/translate-error";
import { AcademicYearsSection } from "@/components/academics/academic-years-section";
import { GradeLevelsSection } from "@/components/academics/grade-levels-section";
import { SectionsSection } from "@/components/academics/sections-section";
import { SubjectsSection } from "@/components/academics/subjects-section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function AcademicsPage() {
  const { dict } = await getLocaleAndDictionary();

  let years, grades, sections, subjects;
  try {
    [years, grades, sections, subjects] = await Promise.all([
      listAcademicYears(),
      listGradeLevels(),
      listSections(),
      listSubjects(),
    ]);
  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof ApiError ? getApiErrorMessage(dict, error) : dict.errors.generic;
    return (
      <>
        <h1 className="text-xl font-bold">{dict.academics.heading}</h1>
        <Card className="items-center gap-3 px-6 py-12 text-center">
          <AlertCircle className="size-10 text-destructive" aria-hidden />
          <h2 className="font-bold">{dict.common.errorHeading}</h2>
          <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
          <Button asChild variant="outline" size="sm" className="mt-1">
            <a href="/academics">{dict.common.retry}</a>
          </Button>
        </Card>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold">{dict.academics.heading}</h1>

      <div className="flex flex-col gap-6">
        <AcademicYearsSection years={years} dict={dict} />
        <GradeLevelsSection grades={grades} dict={dict} />
        <SectionsSection sections={sections} years={years} grades={grades} dict={dict} />
        <SubjectsSection subjects={subjects} grades={grades} dict={dict} />
      </div>
    </>
  );
}
