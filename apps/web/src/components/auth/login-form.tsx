"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";

import { loginAction, type LoginFormState } from "@/actions/auth";
import type { Dictionary } from "@/i18n/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const INITIAL_LOGIN_STATE: LoginFormState = {};

interface LoginFormProps {
  labels: Dictionary["auth"];
}

/**
 * Client component wrapping the login `<form>` so the API's translated
 * errors (general + field-level, see `src/actions/auth.ts`) can be shown
 * without a full page reload. `useActionState` keeps the rest of the page a
 * server component — this is the only client JS this route ships.
 */
export function LoginForm({ labels }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, INITIAL_LOGIN_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.generalError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md bg-destructive-soft px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.generalError}</span>
        </div>
      )}

      {/* labels above fields, never floating — DESIGN_SYSTEM §7.4 */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="identifier" className="text-sm font-medium">
          {labels.identifierLabel}
        </label>
        <Input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder={labels.identifierPlaceholder}
          aria-invalid={Boolean(state.fieldErrors?.identifier)}
          required
        />
        {state.fieldErrors?.identifier && (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden />
            {state.fieldErrors.identifier}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          {labels.passwordLabel}
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder={labels.passwordPlaceholder}
          aria-invalid={Boolean(state.fieldErrors?.password)}
          required
        />
        {state.fieldErrors?.password && (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden />
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      <Button type="submit" className="mt-1 w-full" disabled={isPending}>
        {isPending ? labels.submitting : labels.submit}
      </Button>

      <a href="#" className="text-center text-sm text-primary underline-offset-4 hover:underline">
        {labels.forgotPassword}
      </a>
    </form>
  );
}
