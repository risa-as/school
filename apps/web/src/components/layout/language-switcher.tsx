"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";

import { setLocaleAction } from "@/actions/locale";
import { localeConfig, locales, type Locale } from "@/i18n/locales";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageSwitcherProps {
  current: Locale;
  label: string;
}

export function LanguageSwitcher({ current, label }: LanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function selectLocale(locale: Locale) {
    if (locale === current) return;
    startTransition(async () => {
      await setLocaleAction(locale);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          title={label}
          disabled={isPending}
        >
          <Globe className="size-[19px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onSelect={() => selectLocale(locale)}
            className={locale === current ? "font-semibold text-primary" : undefined}
            /* Each entry renders in its own language/direction, never translated. */
            dir={localeConfig[locale].dir}
            lang={localeConfig[locale].lang}
          >
            <span className="flex-1">{localeConfig[locale].nativeName}</span>
            {locale === current && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
