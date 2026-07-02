"use client";

import { LogOut, UserRound } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  userName: string;
  userRole: string;
  initials: string;
  labels: {
    userMenu: string;
    profile: string;
    logout: string;
  };
}

export function UserMenu({ userName, userRole, initials, labels }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={labels.userMenu}
        title={labels.userMenu}
        className="ms-1 grid size-9 cursor-pointer place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground outline-none transition-shadow focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <DropdownMenuLabel>
          <span className="block text-sm font-semibold text-foreground">{userName}</span>
          <span className="block text-xs font-normal">{userRole}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserRound />
          {labels.profile}
        </DropdownMenuItem>
        {/* Real logout: submits the `logoutAction` server action, which revokes
            the refresh token via the API, clears the auth cookies, and
            redirects to /login. `asChild` renders the
            item as the form's submit button so Radix keeps its keyboard/focus
            behavior while the click still triggers a genuine form submit.
            `onSelect` is prevented so Radix's default "close menu on select"
            doesn't unmount the form/Portal before the browser processes the
            submit — the page navigates away via `redirect()` regardless, so
            the still-open menu just unmounts with the page. */}
        <form action={logoutAction}>
          <DropdownMenuItem
            asChild
            onSelect={(event) => event.preventDefault()}
            className="text-destructive focus:text-destructive"
          >
            <button type="submit" className="w-full">
              <LogOut />
              {labels.logout}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
