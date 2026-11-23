"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "./States";

/**
 * Confirmation for destructive or important actions. Optionally asks for a reason
 * (required when `reason.required` is set).
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Go back",
  destructive,
  reason,
  onConfirm,
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  trigger?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  reason?: { label: string; required?: boolean; minLength?: number; placeholder?: string };
  onConfirm: (reason: string) => Promise<unknown> | unknown;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = (v: boolean) => {
    if (!v) {
      setText("");
      setError(null);
    }
    setInnerOpen(v);
    onOpenChange?.(v);
  };
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const min = reason?.minLength ?? (reason?.required ? 5 : 0);

  async function confirm() {
    if (reason?.required && text.trim().length < min) {
      setError(`Please write at least ${min} characters.`);
      return;
    }
    setBusy(true);
    try {
      const result = await onConfirm(text.trim());
      if (result !== false) setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-2xl">{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription asChild>
              <div>{description}</div>
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {children}
        {reason && (
          <div className="space-y-1.5">
            <Label htmlFor="confirm-reason">
              {reason.label}
              {!reason.required && <span className="font-normal text-muted-foreground"> (optional)</span>}
            </Label>
            <Textarea
              id="confirm-reason"
              value={text}
              placeholder={reason.placeholder}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "confirm-reason-error" : undefined}
            />
            {error && (
              <p id="confirm-reason-error" className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={confirm}
            disabled={busy}
            className={destructive ? "bg-danger text-white hover:bg-danger/90" : ""}
          >
            {busy && <Spinner />} {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
