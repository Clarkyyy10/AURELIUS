"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { repos } from "@/lib/data";
import { errorMessage, newRequestId, useSettings } from "@/lib/data/hooks";
import { balance, downPaymentDue, pendingTotal, verifiedTotal } from "@/lib/transactions/helpers";
import { formatDate, todayISODate } from "@/lib/utils/format";
import { customerPaymentSchema, PROOF_TYPES } from "@/lib/validation/schemas";
import type { z } from "zod";

type CustomerPaymentInput = z.input<typeof customerPaymentSchema>;
import type { Payment, Transaction } from "@/types";
import { Field, FormError } from "./Field";
import { FileDropzone, type StoredFile } from "./FileDropzone";
import { PaymentStatusBadge } from "./StatusBadge";
import { StoredImage, useFileUrl } from "./StoredImage";
import { MoneyText } from "./Text";
import { Spinner } from "./States";

export const PAYMENT_KIND_LABEL: Record<Payment["kind"], string> = {
  down_payment: "Down payment",
  full_payment: "Full payment",
  balance: "Balance",
};
export const PAYMENT_METHOD_LABEL: Record<Payment["method"], string> = {
  gcash: "GCash",
  bank_transfer: "Bank transfer",
  cash_in_store: "Cash in store",
};

/** Final price, verified paid, pending, balance (FR-18, FR-30). */
export function PaymentSummary({ tx }: { tx: Transaction }) {
  if (!tx.quotation) return null;
  const rows: [string, number, string?][] = [
    ["Final price", tx.quotation.finalPrice],
    ["Paid and verified", verifiedTotal(tx), "text-success"],
    ["Waiting for verification", pendingTotal(tx), "text-black"],
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {rows.map(([label, value, cls]) => (
        <div key={label} className="rounded-xl border border-line bg-paper p-3">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className={`tabular mt-0.5 font-semibold ${cls ?? ""}`}>
            <MoneyText value={value} exact />
          </dd>
        </div>
      ))}
      <div className="rounded-xl border border-gold/50 bg-gold/10 p-3">
        <dt className="text-xs text-muted-foreground">Balance</dt>
        <dd className="tabular mt-0.5 text-lg font-semibold">
          <MoneyText value={balance(tx)} exact />
        </dd>
      </div>
    </dl>
  );
}

/** List of payments with status chips and rejection reasons. */
export function PaymentList({ payments, renderActions }: { payments: Payment[]; renderActions?: (p: Payment) => React.ReactNode }) {
  if (payments.length === 0) return <p className="text-sm text-muted-foreground">No payments yet.</p>;
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
      {[...payments].reverse().map((p) => (
        <li key={p.id} className="flex flex-wrap items-start gap-3 p-4">
          {p.proofFile?.dataUrl ? (
            <span className="shrink-0">
              <ProofThumb src={p.proofFile.dataUrl} name={p.proofFile.name} />
            </span>
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Banknote className="size-6 text-muted-foreground" aria-hidden />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 font-medium">
              <MoneyText value={p.amount} exact /> · {PAYMENT_KIND_LABEL[p.kind]} <PaymentStatusBadge status={p.status} />
            </p>
            <p className="text-sm text-muted-foreground">
              {PAYMENT_METHOD_LABEL[p.method]} · Paid {formatDate(p.paidOn)} · Ref. {p.referenceNumber}
              {p.recordedBy === "owner" && " · Recorded by the store"}
            </p>
            {p.status === "rejected" && p.rejectionReason && (
              <p className="mt-1 rounded-md bg-danger/5 px-2 py-1 text-sm text-danger">Reason: {p.rejectionReason}</p>
            )}
          </div>
          {renderActions?.(p)}
        </li>
      ))}
    </ul>
  );
}

/** Thumbnail that opens the full proof (image lightbox / PDF). */
export function ProofThumb({ src, name }: { src: string; name: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="block overflow-hidden rounded-lg border border-line" aria-label={`View proof of payment ${name}`}>
          <StoredImage src={src} alt={`Proof of payment: ${name}`} className="size-14" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Proof of payment</DialogTitle>
          <DialogDescription>{name}</DialogDescription>
        </DialogHeader>
        <StoredImage src={src} alt={`Proof of payment: ${name}`} className="max-h-[70vh] w-full rounded-lg object-contain" />
        <OpenFileLink src={src} />
      </DialogContent>
    </Dialog>
  );
}

/** FR-17 — customer submits amount, date, method, reference number, and a proof file. */
export function PaymentForm({ tx, onDone }: { tx: Transaction; onDone?: () => void }) {
  const settings = useSettings();
  const due = balance(tx) - pendingTotal(tx);
  const dpDue = Math.max(0, downPaymentDue(tx) - pendingTotal(tx));
  const defaultKind: Payment["kind"] = dpDue > 0 ? "down_payment" : "balance";
  const [requestId] = useState(newRequestId);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const form = useForm<CustomerPaymentInput>({
    resolver: zodResolver(customerPaymentSchema),
    defaultValues: { kind: defaultKind, amount: dpDue > 0 ? dpDue : due, paidOn: todayISODate(), method: "gcash", referenceNumber: "", proofFile: undefined },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const v = customerPaymentSchema.parse({ ...values, proofFile: files[0] });
      await repos.payments.submit(tx.kind, tx.id, {
        kind: v.kind,
        amount: v.amount,
        paidOn: v.paidOn,
        method: v.method,
        referenceNumber: v.referenceNumber,
        proofFile: files[0],
        clientRequestId: requestId,
      });
      toast.success("Payment submitted. The owner will verify it soon.");
      onDone?.();
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="rounded-xl border border-line bg-ivory p-4 text-sm">
        <p className="flex items-center gap-2 font-medium">
          <Receipt className="size-4 text-gold-dark" aria-hidden /> How to pay
        </p>
        <p className="mt-1 whitespace-pre-line text-muted-foreground">{settings.paymentInstructions}</p>
      </div>
      <FormError message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Payment for" error={errors.kind?.message}>
          <Controller
            control={form.control}
            name="kind"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dpDue > 0 && <SelectItem value="down_payment">Down payment</SelectItem>}
                  <SelectItem value="balance">Balance</SelectItem>
                  <SelectItem value="full_payment">Full payment</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field label="Amount paid (₱)" error={errors.amount?.message} hint={`Still due: ₱${due.toLocaleString("en-PH")}`}>
          <Input type="number" inputMode="decimal" step="0.01" min="0" {...form.register("amount", { valueAsNumber: true })} />
        </Field>
        <Field label="Date paid" error={errors.paidOn?.message}>
          <Input type="date" max={todayISODate()} {...form.register("paidOn")} />
        </Field>
        <Field label="Paid through" error={errors.method?.message}>
          <Controller
            control={form.control}
            name="method"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>
      <Field label="Reference number" error={errors.referenceNumber?.message} hint="Copy it from your GCash or bank receipt.">
        <Input autoComplete="off" {...form.register("referenceNumber")} />
      </Field>
      <FileDropzone
        label="Proof of payment (receipt or screenshot)"
        accept={PROOF_TYPES}
        value={files}
        onChange={(f) => {
          setFiles(f);
          form.setValue("proofFile", f[0], { shouldValidate: form.formState.isSubmitted });
        }}
        error={errors.proofFile?.message}
      />
      <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Spinner />} Submit payment
      </Button>
    </form>
  );
}

/** Opens the full file (needed for PDF receipts, which can't be previewed as an image). */
function OpenFileLink({ src }: { src: string }) {
  const { url } = useFileUrl(src);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gold-dark underline">
      Open the file in a new tab
    </a>
  );
}
