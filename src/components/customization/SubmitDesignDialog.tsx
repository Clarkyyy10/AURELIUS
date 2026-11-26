"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormError } from "@/components/shared/Field";
import { EstimateNotice } from "@/components/shared/Text";
import { Spinner } from "@/components/shared/States";
import { formatPeso, formatWeight } from "@/lib/utils/format";
import type { DesignConfig, DesignLabels, Estimate } from "@/types";
import { DesignSpecList } from "./DesignSpecList";

/** FR-07 review step: snapshot, specs, estimate, and the "owner confirms the final price" checkbox. */
export function SubmitDesignDialog({
  open,
  onOpenChange,
  snapshot,
  labels,
  config,
  estimate,
  title,
  submitLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  snapshot: string | null;
  labels: DesignLabels;
  config: DesignConfig;
  estimate: Estimate;
  title: string;
  submitLabel: string;
  onSubmit: () => Promise<string | null>;
}) {
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (busy) return;
        if (!v) {
          setAgree(false);
          setError(null);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{title}</DialogTitle>
          <DialogDescription>Check your design before sending it. The owner will review it and may ask for changes.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 sm:grid-cols-[14rem_1fr]">
          {snapshot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={snapshot} alt="Snapshot of your design" className="aspect-square w-full rounded-xl border border-line object-cover" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-line bg-muted p-4 text-center text-xs text-muted-foreground">
              No 3D snapshot on this device
            </div>
          )}
          <div className="space-y-4">
            <DesignSpecList labels={labels} config={config} />
            <div className="rounded-lg bg-muted/60 p-3">
              <p className="text-sm">
                Estimated weight <strong className="tabular">{formatWeight(estimate.weightG)}</strong> · Estimated price{" "}
                <strong className="tabular text-lg">{formatPeso(estimate.price)}</strong>
              </p>
              <EstimateNotice />
            </div>
          </div>
        </div>
        <label className="flex items-start gap-3 rounded-lg border border-line p-3 text-sm">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5 size-5" />I understand the final price and completion date
          will be confirmed by the owner.
        </label>
        <FormError message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Keep editing
          </Button>
          <Button
            disabled={!agree || busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              const err = await onSubmit();
              setBusy(false);
              if (err) setError(err);
            }}
          >
            {busy && <Spinner />} {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
