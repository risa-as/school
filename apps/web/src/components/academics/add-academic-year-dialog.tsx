"use client";

import { useEffect, useState, useActionState } from "react";
import { AlertCircle, Plus } from "lucide-react";

import { createAcademicYearAction, type AcademicFormState } from "@/actions/academics";
import type { Dictionary } from "@/i18n/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const INITIAL_STATE: AcademicFormState = {};

export function AddAcademicYearDialog({ labels, common }: { labels: Dictionary["academics"]; common: Dictionary["common"] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus aria-hidden />
          {labels.yearsAddButton}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={common.close}>
        <Form labels={labels} common={common} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function Form({
  labels,
  common,
  onSuccess,
}: {
  labels: Dictionary["academics"];
  common: Dictionary["common"];
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createAcademicYearAction, INITIAL_STATE);

  useEffect(() => {
    if (state.success) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{labels.yearsAddButton}</DialogTitle>
        <DialogDescription>{labels.yearsAddDescription}</DialogDescription>
      </DialogHeader>

      {state.generalError && (
        <div role="alert" className="flex items-start gap-2 rounded-md bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.generalError}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          {labels.yearNameLabel} <span className="text-destructive">*</span>
        </label>
        <Input id="name" name="name" type="text" placeholder={labels.yearNamePlaceholder} aria-invalid={Boolean(state.fieldErrors?.name)} required />
        {state.fieldErrors?.name && (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden />
            {state.fieldErrors.name}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="startDate" className="text-sm font-medium">
            {labels.yearStartDateLabel} <span className="text-destructive">*</span>
          </label>
          <Input id="startDate" name="startDate" type="date" aria-invalid={Boolean(state.fieldErrors?.startDate)} required />
          {state.fieldErrors?.startDate && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" aria-hidden />
              {state.fieldErrors.startDate}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="endDate" className="text-sm font-medium">
            {labels.yearEndDateLabel} <span className="text-destructive">*</span>
          </label>
          <Input id="endDate" name="endDate" type="date" aria-invalid={Boolean(state.fieldErrors?.endDate)} required />
          {state.fieldErrors?.endDate && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" aria-hidden />
              {state.fieldErrors.endDate}
            </p>
          )}
        </div>
      </div>

      <label htmlFor="isActive" className="flex items-center gap-2 text-sm font-medium">
        <input id="isActive" name="isActive" type="checkbox" className="size-4 rounded border-input" />
        {labels.yearIsActiveLabel}
      </label>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {common.cancel}
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending ? common.saving : common.save}
        </Button>
      </DialogFooter>
    </form>
  );
}
