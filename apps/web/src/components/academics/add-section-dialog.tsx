"use client";

import { useEffect, useState, useActionState } from "react";
import { AlertCircle, Plus } from "lucide-react";

import { createSectionAction, type AcademicFormState } from "@/actions/academics";
import type { Dictionary } from "@/i18n/types";
import type { ApiAcademicYear, ApiGradeLevel } from "@/lib/api/academics";
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

interface AddSectionDialogProps {
  labels: Dictionary["academics"];
  common: Dictionary["common"];
  years: ApiAcademicYear[];
  grades: ApiGradeLevel[];
}

/** Only rendered when both `years` and `grades` are non-empty (see `sections-section.tsx`). */
export function AddSectionDialog({ labels, common, years, grades }: AddSectionDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus aria-hidden />
          {labels.sectionsAddButton}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={common.close}>
        <Form labels={labels} common={common} years={years} grades={grades} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function Form({
  labels,
  common,
  years,
  grades,
  onSuccess,
}: AddSectionDialogProps & { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(createSectionAction, INITIAL_STATE);

  useEffect(() => {
    if (state.success) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{labels.sectionsAddButton}</DialogTitle>
        <DialogDescription>{labels.sectionsAddDescription}</DialogDescription>
      </DialogHeader>

      {state.generalError && (
        <div role="alert" className="flex items-start gap-2 rounded-md bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.generalError}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="academicYearId" className="text-sm font-medium">
            {labels.academicYearLabel} <span className="text-destructive">*</span>
          </label>
          <Select id="academicYearId" name="academicYearId" defaultValue="" aria-invalid={Boolean(state.fieldErrors?.academicYearId)} required>
            <option value="" disabled>
              {labels.selectPlaceholder}
            </option>
            {years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </Select>
          {state.fieldErrors?.academicYearId && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" aria-hidden />
              {state.fieldErrors.academicYearId}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="gradeLevelId" className="text-sm font-medium">
            {labels.gradeLevelLabel} <span className="text-destructive">*</span>
          </label>
          <Select id="gradeLevelId" name="gradeLevelId" defaultValue="" aria-invalid={Boolean(state.fieldErrors?.gradeLevelId)} required>
            <option value="" disabled>
              {labels.selectPlaceholder}
            </option>
            {grades.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </Select>
          {state.fieldErrors?.gradeLevelId && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" aria-hidden />
              {state.fieldErrors.gradeLevelId}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="section-name" className="text-sm font-medium">
            {labels.sectionNameLabel} <span className="text-destructive">*</span>
          </label>
          <Input id="section-name" name="name" type="text" placeholder={labels.sectionNamePlaceholder} aria-invalid={Boolean(state.fieldErrors?.name)} required />
          {state.fieldErrors?.name && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" aria-hidden />
              {state.fieldErrors.name}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="capacity" className="text-sm font-medium">
            {labels.capacityLabel}
          </label>
          <Input id="capacity" name="capacity" type="number" min={1} step={1} placeholder={labels.capacityPlaceholder} aria-invalid={Boolean(state.fieldErrors?.capacity)} />
          {state.fieldErrors?.capacity && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" aria-hidden />
              {state.fieldErrors.capacity}
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
