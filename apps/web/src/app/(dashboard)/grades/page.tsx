import { BarChart3 } from "lucide-react";

import { getLocaleAndDictionary } from "@/i18n";
import { EmptyState } from "@/components/ui/empty-state";

/** No backend module exists for grades yet — real route, no faked data. */
export default async function GradesPage() {
  const { dict } = await getLocaleAndDictionary();

  return (
    <>
      <h1 className="text-xl font-bold">{dict.grades.heading}</h1>
      <EmptyState
        icon={<BarChart3 aria-hidden />}
        title={dict.common.underDevelopmentTitle}
        description={dict.grades.emptyDescription}
      />
    </>
  );
}
