"use client";

import { useEffect, useState, useActionState } from "react";
import { AlertCircle, Plus } from "lucide-react";

import { createGradeLevelAction, type AcademicFormState } from "@/actions/academics";
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
import { Select } from "@/components/ui/select";

const INITIAL_STATE: AcademicFormState = {};

export function AddGradeLevelDialog({ labels, common }: { labels: Dictionary["academics"]; common: Dictionary["common"] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus aria-hidden />
          {labels.gradeLevelsAddButton}
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
  const [state, formAction, isPending] = useActionState(createGradeLevelAction, INITIAL_STATE);

  useEffect(() => {
    if (state.success) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{labels.gradeLevelsAddButton}</DialogTitle>
        <DialogDescription>{labels.gradeLevelsAddDescription}</DialogDescription>
      </DialogHeader>

      {state.generalError && (
        <div role="alert" className="flex items-start gap-2 rounded-md bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.generalError}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="gl-name" className="text-sm font-medium">
          {labels.gradeLevelNameLabel} <span className="text-destructive">*</span>
        </label>
        <Input id="gl-name" name="name" type="text" placeholder={labels.gradeLevelNamePlaceholder} aria-invalid={Boolean(state.fieldErrors?.name)} required />
        {state.fieldErrors?.name && (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden />
            {state.fieldErrors.name}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="stage" className="text-sm font-medium">
            {labels.stageLabel} <span className="text-destructive">*</span>
          </label>
          <Select id="stage" name="stage" defaultValue="" aria-invalid={Boolean(state.fieldErrors?.stage)} required>
            <option value="" disabled>
              {labels.selectPlaceholder}
            </option>
            <option value="KINDERGARTEN">{labels.stageKindergarten}</option>
            <option value="PRIMARY">{labels.stagePrimary}</option>
            <option value="INTERMEDIATE">{labels.stageIntermediate}</option>
            <option value="SECONDARY">{labels.stageSecondary}</option>
          </Select>
          {state.fieldErrors?.stage && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" aria-hidden />
              {state.fieldErrors.stage}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="order" className="text-sm font-medium">
            {labels.orderLabel} <span className="text-destructive">*</span>
          </label>
          <Input id="order" name="order" type="number" min={1} step={1} placeholder={labels.orderPlaceholder} aria-invalid={Boolean(state.fieldErrors?.order)} required />
          {state.fieldErrors?.order && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" aria-hidden />
              {state.fieldErrors.order}
            </p>
          )}
        </div>
      </div>

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
