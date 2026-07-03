import { unstable_rethrow } from "next/navigation";
import { AlertCircle, LogOut, Mail, Phone, ShieldCheck, User as UserIcon } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { getLocaleAndDictionary } from "@/i18n";
import { ApiError } from "@/lib/api/errors";
import { getRoleKey } from "@/lib/api/tokens";
import { getApiErrorMessage } from "@/lib/api/translate-error";
import { getMe } from "@/lib/api/users";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const { locale, dict } = await getLocaleAndDictionary();

  let me;
  try {
    me = await getMe();
  } catch (error) {
    unstable_rethrow(error);
    const message = error instanceof ApiError ? getApiErrorMessage(dict, error) : dict.errors.generic;
    return (
      <>
        <h1 className="text-xl font-bold">{dict.settings.heading}</h1>
        <Card className="items-center gap-3 px-6 py-12 text-center">
          <AlertCircle className="size-10 text-destructive" aria-hidden />
          <h2 className="font-bold">{dict.common.errorHeading}</h2>
          <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
          <Button asChild variant="outline" size="sm" className="mt-1">
            <a href="/settings">{dict.common.retry}</a>
          </Button>
        </Card>
      </>
    );
  }

  const roleKey = await getRoleKey();
  const roleLabel = roleKey ? (dict.roles as Record<string, string>)[roleKey] : undefined;

  return (
    <>
      <h1 className="text-xl font-bold">{dict.settings.heading}</h1>

      <div className="flex max-w-xl flex-col gap-6">
        <Card className="gap-0 overflow-hidden p-0">
          <CardHeader className="border-b px-5 py-4">
            <CardTitle className="text-sm font-bold">{dict.settings.profileTitle}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-5">
            <SettingsRow icon={<UserIcon aria-hidden />} label={dict.settings.nameLabel} value={me.fullName} />
            <SettingsRow
              icon={<Mail aria-hidden />}
              label={dict.settings.emailLabel}
              value={me.email ?? dict.common.notProvided}
            />
            <SettingsRow
              icon={<Phone aria-hidden />}
              label={dict.settings.phoneLabel}
              value={me.phone ? <bdi dir="ltr">{me.phone}</bdi> : dict.common.notProvided}
            />
            <SettingsRow
              icon={<ShieldCheck aria-hidden />}
              label={dict.settings.roleLabel}
              value={roleLabel ?? dict.common.notProvided}
            />
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden p-0">
          <CardHeader className="border-b px-5 py-4">
            <CardTitle className="text-sm font-bold">{dict.settings.languageTitle}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <p className="text-sm text-muted-foreground">{dict.settings.languageDescription}</p>
            <LanguageSwitcher current={locale} label={dict.topbar.language} />
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden p-0">
          <CardHeader className="border-b px-5 py-4">
            <CardTitle className="text-sm font-bold">{dict.settings.accountTitle}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4 p-5">
            <p className="text-sm text-muted-foreground">{dict.settings.logoutDescription}</p>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" className="text-destructive hover:bg-destructive-soft">
                <LogOut aria-hidden />
                {dict.topbar.logout}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function SettingsRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground [&>svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
