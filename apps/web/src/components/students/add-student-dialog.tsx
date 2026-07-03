"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { AlertCircle, Plus } from "lucide-react";

import { createStudentAction, type CreateStudentFormState } from "@/actions/students";
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

const INITIAL_STATE: CreateStudentFormState = {};

interface AddStudentDialogProps {
  labels: Dictionary["students"];
  common: Dictionary["common"];
}

/**
 * Accessible dialog (Radix `Dialog` — focus trap, Escape, backdrop-click all
 * come from the primitive) wrapping the "add student" form. `DialogContent`
 * unmounts on close (no `forceMount`), so `AddStudentForm`'s
 * `useActionState` naturally resets to a clean slate the next time it opens.
 */
export function AddStudentDialog({ labels, common }: AddStudentDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden />
          {labels.addButton}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={common.close}>
        <AddStudentForm labels={labels} common={common} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AddStudentForm({
  labels,
  common,
  onSuccess,
}: {
  labels: Dictionary["students"];
  common: Dictionary["common"];
  onSuccess: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createStudentAction, INITIAL_STATE);

  useEffect(() => {
    if (state.success) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the action's result changes
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <DialogHeader>
        <DialogTitle>{labels.addDialogTitle}</DialogTitle>
        <DialogDescription>{labels.addDialogDescription}</DialogDescription>
      </DialogHeader>

      {state.generalError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md bg-destructive-soft px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.generalError}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="studentNumber" className="text-sm font-medium">
            {labels.studentNumberLabel} <span className="text-destructive">*</span>
          </label>
          <Input
            id="studentNumber"
            name="studentNumber"
            type="text"
            placeholder={labels.studentNumberPlaceholder}
            aria-invalid={Boolean(state.fieldErrors?.studentNumber)}
            required
          />
          {state.fieldErrors?.studentNumber && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" aria-hidden />
              {state.fieldErrors.studentNumber}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-sm font-medium">
            {labels.fullNameLabel} <span className="text-destructive">*</span>
          </label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder={labels.fullNamePlaceholder}
            aria-invalid={Boolean(state.fieldErrors?.fullName)}
            required
          />
          {state.fieldErrors?.fullName && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" aria-hidden />
              {state.fieldErrors.fullName}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="dateOfBirth" className="text-sm font-medium">
            {labels.dateOfBirthLabel}
          </label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="gender" className="text-sm font-medium">
            {labels.genderLabel}
          </label>
          <Select id="gender" name="gender" defaultValue="">
            <option value="">{labels.genderUnspecified}</option>
            <option value="MALE">{labels.genderMale}</option>
            <option value="FEMALE">{labels.genderFemale}</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nationalId" className="text-sm font-medium">
            {labels.nationalIdLabel}
          </label>
          <Input id="nationalId" name="nationalId" type="text" placeholder={labels.nationalIdPlaceholder} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="address" className="text-sm font-medium">
            {labels.addressLabel}
          </label>
          <Input id="address" name="address" type="text" placeholder={labels.addressPlaceholder} />
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
