import { CalendarCheck } from "lucide-react";

import { getLocaleAndDictionary } from "@/i18n";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * No backend module exists for attendance yet (`docs/ARCHITECTURE.md` lists
 * it as Phase-1 scope, not yet built) — real route, no faked data, per the
 * task's explicit "do NOT fake data" instruction.
 */
export default async function AttendancePage() {
  const { dict } = await getLocaleAndDictionary();

  return (
    <>
      <h1 className="text-xl font-bold">{dict.attendance.heading}</h1>
      <EmptyState
        icon={<CalendarCheck aria-hidden />}
        title={dict.common.underDevelopmentTitle}
        description={dict.attendance.emptyDescription}
      />
    </>
  );
}
