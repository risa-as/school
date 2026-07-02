"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/types";
import { SidebarNavList } from "./sidebar";

interface MobileNavProps {
  labels: Dictionary["nav"];
  schoolName: string;
  schoolInitial: string;
}

/**
 * Topbar hamburger trigger + off-canvas drawer, visible only below `md`
 * (DESIGN_SYSTEM §7.6). Reuses `SidebarNavList` — the same nav items/icons/
 * active-state logic as the desktop sidebar, not a second copy of the list.
 *
 * The drawer slides in purely via the logical `inset-inline-start` offset
 * (no `transform`/translate-x), so it reverses direction automatically under
 * `dir="rtl"` vs `dir="ltr"` with zero direction-specific code, per
 * CLAUDE.md's "logical properties only" rule.
 */
export function MobileNav({ labels, schoolName, schoolInitial }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change (also covers a nav-link click, belt-and-suspenders
  // with the onNavigate callback below).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.openMenu}
        title={labels.openMenu}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
      >
        <Menu className="size-[19px]" />
      </button>

      {/* Always mounted (not conditionally rendered) so the slide/fade can
          transition; inert while closed via opacity + pointer-events. */}
      <div
        className={cn("fixed inset-0 z-50 md:hidden", !open && "pointer-events-none")}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          aria-label={labels.closeMenu}
          className={cn(
            "absolute inset-0 cursor-default bg-foreground/40 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={labels.openMenu}
          // `inert` (not just aria-hidden) drops the closed drawer's nav
          // links out of the tab order entirely, not just out of the a11y
          // tree — otherwise Tab could still reach off-canvas links.
          inert={!open}
          className={cn(
            "absolute inset-y-0 flex w-72 max-w-[85vw] flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg transition-[inset-inline-start] duration-200 ease-out",
            open ? "start-0" : "start-[-100%]"
          )}
        >
          <div className="flex items-center gap-3 border-b border-sidebar-border p-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-sidebar-primary text-lg font-bold text-sidebar-primary-foreground">
              {schoolInitial}
            </div>
            <p className="min-w-0 flex-1 truncate text-sm font-bold">{schoolName}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={labels.closeMenu}
              title={labels.closeMenu}
              className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <SidebarNavList labels={labels} onNavigate={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}
