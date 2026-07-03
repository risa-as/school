import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  /** Single primary action, e.g. "add the first X" — per DESIGN_SYSTEM §7.5. Omit for a module with no action to offer (e.g. "under development"). */
  action?: ReactNode;
  /** Renders without the `Card` chrome (border/shadow) — for when the empty state already sits inside another `Card`'s `CardContent` (e.g. an academics list section), avoiding a double-bordered box-in-box. */
  bare?: boolean;
}

/** Shared empty-state: muted icon + one-line explanation (+ optional single action), per DESIGN_SYSTEM §7.5. */
export function EmptyState({ icon, title, description, action, bare = false }: EmptyStateProps) {
  const content = (
    <>
      <span className="grid size-12 place-items-center text-muted-foreground [&>svg]:size-12">{icon}</span>
      <h3 className="font-bold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action}
    </>
  );

  if (bare) {
    return <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">{content}</div>;
  }
  return <Card className="items-center gap-3 px-6 py-12 text-center">{content}</Card>;
}
