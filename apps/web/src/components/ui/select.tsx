import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Plain native `<select>`, styled to match `Input`. Deliberately NOT a Radix
 * primitive: a native select needs zero extra client JS/dependency, is
 * accessible by default, and drops straight into a `<form>`'s `FormData` —
 * the right call for the 3G/minimal-JS budget (DESIGN_SYSTEM performance
 * budget) since these selects are plain enum/FK pickers, not searchable
 * comboboxes.
 *
 * The chevron icon is non-directional (DESIGN_SYSTEM §7.1) — it never flips.
 */
function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "flex h-9 w-full min-w-0 appearance-none rounded-md border border-input bg-card px-3 py-1 pe-8 text-sm shadow-sm transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export { Select };
