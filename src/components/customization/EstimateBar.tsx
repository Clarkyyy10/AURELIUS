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
    <div className={cn("@container rounded-2xl border border-line bg-paper p-3 shadow-[0_-6px_20px_-12px_rgba(28,27,25,0.25)] sm:p-4", className)}>
      <div className="flex flex-col gap-2.5 @sm:flex-row @sm:items-center @sm:gap-4">
        <div aria-live="polite" aria-atomic="true" className="min-w-0 flex-1">
          {estimate ? (
            <dl className="flex flex-wrap items-end gap-x-5 gap-y-1">
              <div>
                <dt className="text-xs text-muted-foreground">Estimated weight</dt>
                <dd className="tabular font-semibold whitespace-nowrap">{formatWeight(estimate.weightG)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Estimated price</dt>
                <dd className="tabular font-heading text-2xl leading-none font-semibold whitespace-nowrap text-ink">{formatPeso(estimate.price)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-danger">{error ?? "Finish choosing your options to see an estimate."}</p>
          )}
          <EstimateNotice className="mt-1 text-[11px] leading-tight" />
        </div>
        {action && <div className="shrink-0 [&>*]:w-full @sm:[&>*]:w-auto">{action}</div>}
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
              {(estimate.breakdown.design ?? 0) > 0 && (
                <>
                  <dt>Design options</dt>
                  <dd className="tabular text-right">{formatPesoExact(estimate.breakdown.design ?? 0)}</dd>
                </>
              )}
              {estimate.breakdown.clasp > 0 && (
                <>
                  <dt>Clasp</dt>
                  <dd className="tabular text-right">{formatPesoExact(estimate.breakdown.clasp)}</dd>
                </>
              )}
              <dt className="border-t border-line pt-1 font-medium">Estimate (rounded to the nearest peso)</dt>
              <dd className="tabular border-t border-line pt-1 text-right font-medium">{formatPeso(estimate.price)}</dd>
            </dl>
          )}
        </div>
      )}
    </div>
  );
}
