"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Trash2 } from "lucide-react";

import type { Dictionary } from "@/i18n/types";
import type { DeleteActionResult } from "@/actions/academics";
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

interface DeleteRowButtonProps {
  /** A server action already bound to the row's id (`action.bind(null, id)`). */
  action: () => Promise<DeleteActionResult | void>;
  /** Row's display name, substituted into `common.deleteConfirmTitle`'s `{item}` placeholder. */
  itemLabel: string;
  common: Dictionary["common"];
}

/**
 * Generic per-row delete button: trash icon trigger + a confirm dialog
 * (same accessible Radix `Dialog` primitive as `AddStudentDialog` — focus
 * trap/Escape/backdrop for free) shared by every academics list
 * (academic years, grade levels, sections, subjects).
 */
export function DeleteRowButton({ action, itemLabel, common }: DeleteRowButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await action();
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(undefined);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={common.delete}
          title={common.delete}
          className="text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={common.close}>
        <DialogHeader>
          <DialogTitle>{common.deleteConfirmTitle.replace("{item}", itemLabel)}</DialogTitle>
          <DialogDescription>{common.deleteConfirmBody}</DialogDescription>
        </DialogHeader>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md bg-destructive-soft px-3 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {common.cancel}
            </Button>
          </DialogClose>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? common.deleting : common.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
