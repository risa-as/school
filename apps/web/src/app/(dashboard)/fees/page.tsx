import { Wallet } from "lucide-react";

import { getLocaleAndDictionary } from "@/i18n";
import { EmptyState } from "@/components/ui/empty-state";

/** No backend module exists for fees yet — real route, no faked data. */
export default async function FeesPage() {
  const { dict } = await getLocaleAndDictionary();

  return (
    <>
      <h1 className="text-xl font-bold">{dict.fees.heading}</h1>
      <EmptyState
        icon={<Wallet aria-hidden />}
        title={dict.common.underDevelopmentTitle}
        description={dict.fees.emptyDescription}
      />
    </>
  );
}
