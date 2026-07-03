"use client";

import { useEffect, useState, useActionState } from "react";
import { AlertCircle, Plus } from "lucide-react";

import { createSubjectAction, type AcademicFormState } from "@/actions/academics";
import type { Dictionary } from "@/i18n/types";
import type { ApiGradeLevel } from "@/lib/api/academics";
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

interface AddSubjectDialogProps {
  labels: Dictionary["academics"];
  common: Dictionary["common"];
  grades: ApiGradeLevel[];
}

export function AddSubjectDialog({ labels, common, grades }: AddSubjectDialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus aria-hidden />
          {labels.subjectsAddButton}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={common.close}>
        <Form labels={labels} common={common} grades={grades} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function Form({
  labels,
  common,
  grades,
  onSuccess,
}: AddSubjectDialogProps & { onSuccess: () => void }) {
  const [state, formAction, isPending] = useActionState(createSubjectAction, INITIAL_STATE);

  useEffect(() => {
    if (state.success) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{labels.subjectsAddButton}</DialogTitle>
        <DialogDescription>{labels.subjectsAddDescription}</DialogDescription>
      </DialogHeader>

      {state.generalError && (
        <div role="alert" className="flex items-start gap-2 rounded-md bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.generalError}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="subject-name" className="text-sm font-medium">
          {labels.subjectNameLabel} <span className="text-destructive">*</span>
        </label>
        <Input id="subject-name" name="name" type="text" placeholder={labels.subjectNamePlaceholder} aria-invalid={Boolean(state.fieldErrors?.name)} required />
        {state.fieldErrors?.name && (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden />
            {state.fieldErrors.name}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="code" className="text-sm font-medium">
            {labels.subjectCodeLabel}
          </label>
          <Input id="code" name="code" type="text" placeholder={labels.subjectCodePlaceholder} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="subject-gradeLevelId" className="text-sm font-medium">
            {labels.subjectGradeLevelLabel}
          </label>
          <Select id="subject-gradeLevelId" name="gradeLevelId" defaultValue="">
            <option value="">{labels.allGradeLevelsOption}</option>
            {grades.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </Select>
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
