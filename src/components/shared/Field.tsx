"use client";

import { cloneElement, isValidElement, useId } from "react";
import { CircleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Label + control + hint + error, wired up for screen readers (aria-invalid, aria-describedby).
 * Pass a single input-like element as the child.
 */
export function Field({
  label,
  hint,
  error,
  optional,
  required,
  className,
  children,
  id: idProp,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  optional?: boolean;
  required?: boolean;
  className?: string;
  children: React.ReactElement<Record<string, unknown>>;
  id?: string;
}) {
  const auto = useId();
  const id = idProp ?? auto;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children, { id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })
    : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-grey-600"> (optional)</span>}
        {required && <span className="font-normal text-grey-600"> (required)</span>}
      </Label>
      {control}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        // DESIGN.md §11: no red. The control gets a 2 px black border; the message starts with an icon
        // and "Error:" and says how to fix it.
        <p id={errorId} className="flex items-start gap-1.5 text-sm font-semibold text-black" role="alert">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>Error: {error}</span>
        </p>
      )}
    </div>
  );
}

/** A form-level error box (e.g. wrong password, server error). */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    // DESIGN.md §11: an error box is told apart by a 2 px black border, an icon and a heading — not colour.
    <div role="alert" aria-live="assertive" className="flex items-start gap-2 rounded-lg border-2 border-black bg-white px-3 py-2.5 text-sm text-black">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">There is a problem</p>
        <p>{message}</p>
      </div>
    </div>
  );
}
