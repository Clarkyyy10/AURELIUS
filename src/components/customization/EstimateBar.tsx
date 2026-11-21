"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { EstimateNotice } from "@/components/shared/Text";
import { cn } from "@/lib/utils";
import { formatPeso, formatPesoExact, formatWeight } from "@/lib/utils/format";
import type { Estimate } from "@/types";

/** FR-06 — estimated weight and price, labelled as an estimate, with an expandable breakdown. */
export function EstimateBar({ estimate, error, className, action }: { estimate: Estimate | null; error?: string | null; className?: string; action?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("rounded-2xl border border-line bg-paper p-4 shadow-[0_-6px_20px_-12px_rgba(28,27,25,0.25)]", className)}>
      <div className="flex flex-col gap-3">
        <div aria-live="polite" aria-atomic="true" className="min-w-0">
          {estimate ? (
            <p className="text-sm">
              <span className="text-muted-foreground">Estimated weight</span> <strong className="tabular">{formatWeight(estimate.weightG)}</strong>
              <span className="mx-2 text-line" aria-hidden>
                ·
              </span>
              <span className="text-muted-foreground">Estimated price</span>{" "}
              <strong className="tabular font-heading text-2xl leading-none text-ink">{formatPeso(estimate.price)}</strong>
            </p>
          ) : (
            <p className="text-sm text-danger">{error ?? "Finish choosing your options to see an estimate."}</p>
          )}
          <EstimateNotice className="mt-0.5" />
        </div>
        {action && <div className="[&>*]:w-full">{action}</div>}
      </div>
      {estimate && (
        <div className="mt-2">
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="inline-flex min-h-8 items-center gap-1 text-sm text-gold-dark hover:underline">
            How this estimate is computed <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
          </button>
          {open && (
            <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-lg bg-muted/60 p-3 text-sm">
              <dt>Metal ({formatWeight(estimate.weightG)} × rate per gram)</dt>
              <dd className="tabular text-right">{formatPesoExact(estimate.breakdown.metal)}</dd>
              <dt>Stones</dt>
              <dd className="tabular text-right">{formatPesoExact(estimate.breakdown.stones)}</dd>
              <dt>Labor</dt>
              <dd className="tabular text-right">{formatPesoExact(estimate.breakdown.labor)}</dd>
              <dt>Finish</dt>
              <dd className="tabular text-right">{formatPesoExact(estimate.breakdown.finish)}</dd>
              <dt className="border-t border-line pt-1 font-medium">Estimate (rounded to the nearest peso)</dt>
              <dd className="tabular border-t border-line pt-1 text-right font-medium">{formatPeso(estimate.price)}</dd>
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
