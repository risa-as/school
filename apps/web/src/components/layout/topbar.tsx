import { Bell, Search } from "lucide-react";

import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/locales";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";

interface TopbarProps {
  labels: Dictionary["topbar"];
  navLabels: Dictionary["nav"];
  schoolName: string;
  schoolInitial: string;
  locale: Locale;
  userName: string;
  userRole: string;
  userInitials: string;
}

export function Topbar({
  labels,
  navLabels,
  schoolName,
  schoolInitial,
  locale,
  userName,
  userRole,
  userInitials,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-card px-4 py-3 md:px-6">
      {/* off-canvas drawer trigger — sidebar is `hidden` below `md` (§7.6) */}
      <MobileNav labels={navLabels} schoolName={schoolName} schoolInitial={schoolInitial} />

      <h2 className="whitespace-nowrap text-base font-bold">{schoolName}</h2>

      {/* search (visual placeholder — wiring comes with the API) */}
      <div className="relative ms-auto hidden w-full max-w-sm sm:block">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={labels.searchPlaceholder}
          className="border-transparent bg-muted ps-9 shadow-none focus-visible:border-ring"
        />
      </div>

      <div className="flex items-center gap-1 max-sm:ms-auto">
        <LanguageSwitcher current={locale} label={labels.language} />

        <Button
          variant="ghost"
          size="icon"
          aria-label={labels.notifications}
          title={labels.notifications}
          className="relative"
        >
          <Bell className="size-[19px]" />
          <span className="absolute end-2 top-2 size-2 rounded-full bg-destructive ring-2 ring-card" />
        </Button>

        <UserMenu
          userName={userName}
          userRole={userRole}
          initials={userInitials}
          labels={{
            userMenu: labels.userMenu,
            profile: labels.profile,
            logout: labels.logout,
          }}
        />
      </div>
    </header>
  );
}
