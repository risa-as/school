"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  LayoutDashboard,
  Layers,
  Menu,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/types";

interface NavItem {
  key: keyof Dictionary["nav"];
  href: string;
  icon: LucideIcon;
}

/* Icons are all non-directional (no arrows/chevrons), so nothing needs
   an RTL flip here — see DESIGN_SYSTEM §7.1. */
const navItems: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "students", href: "/students", icon: Users },
  { key: "sections", href: "#", icon: Layers },
  { key: "attendance", href: "#", icon: CalendarCheck },
  { key: "grades", href: "#", icon: BarChart3 },
  { key: "installments", href: "#", icon: Wallet },
  { key: "settings", href: "#", icon: Settings },
];

interface SidebarNavListProps {
  labels: Dictionary["nav"];
  collapsed?: boolean;
  /** Called when a nav link is activated — the mobile drawer uses this to close itself. */
  onNavigate?: () => void;
}

/**
 * The nav-item list itself, shared by the desktop `<Sidebar>` (below) and
 * the mobile off-canvas drawer (`mobile-nav.tsx`) — one source of truth for
 * the item list, icons, and active-state logic, per DESIGN_SYSTEM §7.2/§7.6.
 */
export function SidebarNavList({ labels, collapsed = false, onNavigate }: SidebarNavListProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.href !== "#" && pathname.startsWith(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            title={collapsed ? labels[item.key] : undefined}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              collapsed && "justify-center px-0",
              active
                ? "bg-accent font-semibold text-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="size-[19px] shrink-0" />
            {!collapsed && <span className="truncate">{labels[item.key]}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

interface SidebarProps {
  labels: Dictionary["nav"];
  schoolName: string;
  schoolInitial: string;
  tagline: string;
}

/**
 * App-shell sidebar. Rendered as the FIRST child of a plain `flex` row, it
 * sits at the flex main-start = inline-start = the RIGHT edge under
 * `dir="rtl"` (ar/ckb) and the LEFT edge under `dir="ltr"` (en) — no
 * order hacks, per DESIGN_SYSTEM §7.2. Hidden below `md`; the mobile
 * off-canvas drawer (`mobile-nav.tsx`) takes over there.
 */
export function Sidebar({ labels, schoolName, schoolInitial, tagline }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  // DESIGN_SYSTEM §7.2: auto-collapse to the icon rail on first load below
  // 1280px (xl). This runs once on mount only — after that, the manual
  // toggle below is the sole source of truth, so a user's explicit choice
  // is never overridden by a later resize.
  useEffect(() => {
    if (window.matchMedia("(max-width: 1279.98px)").matches) {
      setCollapsed(true);
    }
  }, []);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
        collapsed ? "w-[4.25rem]" : "w-64"
      )}
    >
      {/* brand + collapse toggle */}
      <div
        className={cn(
          "flex items-center gap-3 border-b border-sidebar-border p-4",
          collapsed && "flex-col gap-2 px-2"
        )}
      >
        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-sidebar-primary text-lg font-bold text-sidebar-primary-foreground">
          {schoolInitial}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{schoolName}</p>
            <p className="truncate text-xs text-muted-foreground">{tagline}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={labels.toggleSidebar}
          title={labels.toggleSidebar}
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Menu className="size-4" />
        </button>
      </div>

      <SidebarNavList labels={labels} collapsed={collapsed} />
    </aside>
  );
}
