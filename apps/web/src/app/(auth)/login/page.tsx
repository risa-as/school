import { GraduationCap } from "lucide-react";

import { getLocaleAndDictionary } from "@/i18n";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default async function LoginPage() {
  const { dict } = await getLocaleAndDictionary();

  return (
    <Card className="w-full max-w-sm shadow-md">
      <CardHeader className="items-center gap-3 text-center">
        {/* school logo placeholder (white-label: real tenant logo comes from the API) */}
        <div
          role="img"
          aria-label={dict.auth.schoolLogoAlt}
          className="mx-auto grid size-14 place-items-center rounded-xl bg-primary text-primary-foreground"
        >
          <GraduationCap className="size-7" aria-hidden />
        </div>
        <div>
          <h1 className="text-xl font-bold">{dict.auth.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{dict.auth.subtitle}</p>
        </div>
      </CardHeader>

      <CardContent>
        <LoginForm labels={dict.auth} />
      </CardContent>

      <p className="border-t px-5 py-3 text-center text-xs text-muted-foreground">
        {dict.common.platformName} — {dict.common.platformTagline}
      </p>
    </Card>
  );
}
