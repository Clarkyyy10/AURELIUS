"use client";

import { cloneElement, isValidElement, useId } from "react";
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
  className,
  children,
  id: idProp,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  optional?: boolean;
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
        {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </Label>
      {control}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** A form-level error box (e.g. wrong password, server error). */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" aria-live="assertive" className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
      {message}
    </div>
  );
}
