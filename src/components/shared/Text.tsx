"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime, formatPeso, formatPesoExact, formatRelative } from "@/lib/utils/format";

export function MoneyText({ value, exact, className }: { value: number; exact?: boolean; className?: string }) {
  return <span className={cn("tabular", className)}>{exact ? formatPesoExact(value) : formatPeso(value)}</span>;
}

export function DateText({ value, withTime, relative, className }: { value: string; withTime?: boolean; relative?: boolean; className?: string }) {
  const text = relative ? formatRelative(value) : withTime ? formatDateTime(value) : formatDate(value);
  return (
    <time dateTime={value} title={formatDateTime(value)} className={className} suppressHydrationWarning>
      {text}
    </time>
  );
}

/** FR-06 / FR-40 — always shown next to estimates. */
export function EstimateNotice({ className }: { className?: string }) {
  return <p className={cn("text-xs text-muted-foreground", className)}>Estimate only — final price is confirmed by the owner.</p>;
}

/** CO- / OR- / SR- code that can be copied. */
export function CodeChip({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-md border border-line bg-paper px-2 py-0.5 font-mono text-xs text-ink hover:bg-muted",
        className,
      )}
      aria-label={`Copy code ${code}`}
    >
      {code}
      {copied ? <Check className="size-3 text-success" aria-hidden /> : <Copy className="size-3 text-muted-foreground" aria-hidden />}
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}
