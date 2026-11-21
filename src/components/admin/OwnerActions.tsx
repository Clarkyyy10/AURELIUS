"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Field, FormError } from "@/components/shared/Field";
import { PaymentList, PaymentSummary } from "@/components/shared/Payments";
import { Spinner } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { errorMessage } from "@/lib/data/hooks";
import { isFinal, nextStatuses, statusLabel } from "@/lib/status/machines";
import { balance } from "@/lib/transactions/helpers";
import { formatPesoExact, todayISODate } from "@/lib/utils/format";
import { dropOffSchema, quotationSchema, serviceQuotationSchema } from "@/lib/validation/schemas";
import type { AnyStatus, Payment, PaymentKind, PaymentMethod, Transaction } from "@/types";
import type { z } from "zod";

/** FR-15 / FR-27 — issue (or re-issue) a quotation. */
export function QuotationForm({ tx, suggestedPrice, trigger }: { tx: Transaction; suggestedPrice: number; trigger: React.ReactNode }) {
  const isService = tx.kind === "service";
  const schema = isService ? serviceQuotationSchema : quotationSchema;
  const [open, setOpen] = useState(false);
  const [dpMode, setDpMode] = useState<"peso" | "percent">("peso");
  const [pct, setPct] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.input<typeof quotationSchema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      finalPrice: tx.quotation?.finalPrice ?? suggestedPrice,
      downPaymentRequired: tx.quotation?.downPaymentRequired ?? (tx.kind === "order" ? 0 : Math.round(suggestedPrice * 0.3)),
      expectedDate: tx.quotation?.expectedDate ?? "",
      procedure: tx.quotation?.procedure ?? "",
      notes: tx.quotation?.notes ?? "",
    },
  });
  const finalPrice = useWatch({ control: form.control, name: "finalPrice" });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      const parsed = schema.parse(dpMode === "percent" ? { ...v, downPaymentRequired: Math.round(((Number(v.finalPrice) || 0) * pct) / 100) } : v);
      await repos.transactions.issueQuotation(tx.kind, tx.id, {
        finalPrice: parsed.finalPrice,
        downPaymentRequired: parsed.downPaymentRequired,
        expectedDate: parsed.expectedDate,
        procedure: parsed.procedure || undefined,
        notes: parsed.notes || undefined,
      });
      toast.success("Quotation sent to the customer.");
      setOpen(false);
    } catch (e) {
      setError(errorMessage(e));
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{tx.quotation ? "Re-issue quotation" : isService ? "Issue service quotation" : "Issue quotation"}</DialogTitle>
          <DialogDescription>The customer will be notified and can accept or decline.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormError message={error} />
          <Field label={isService ? "Estimated cost (₱)" : "Final price (₱)"} error={errors.finalPrice?.message} hint={suggestedPrice ? `Suggested: ${formatPesoExact(suggestedPrice)}` : undefined}>
            <Input type="number" inputMode="decimal" min={0} step="1" {...form.register("finalPrice", { valueAsNumber: true })} />
          </Field>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="dp">Down payment required</Label>
              <div className="flex rounded-lg border border-line p-0.5 text-xs" role="radiogroup" aria-label="Down payment as">
                {(["peso", "percent"] as const).map((m) => (
                  <button key={m} type="button" role="radio" aria-checked={dpMode === m} onClick={() => setDpMode(m)} className={`rounded-md px-2 py-1 ${dpMode === m ? "bg-emerald text-ivory" : ""}`}>
                    {m === "peso" ? "₱" : "%"}
                  </button>
                ))}
              </div>
            </div>
            {dpMode === "peso" ? (
              <Input id="dp" type="number" inputMode="decimal" min={0} step="1" {...form.register("downPaymentRequired", { valueAsNumber: true })} aria-invalid={Boolean(errors.downPaymentRequired)} />
            ) : (
              <div className="flex items-center gap-2">
                <Input id="dp" type="number" min={0} max={100} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-24" />
                <span className="text-sm text-muted-foreground">% = {formatPesoExact(Math.round(((Number(finalPrice) || 0) * pct) / 100))}</span>
              </div>
            )}
            {errors.downPaymentRequired && <p className="text-sm text-danger">{errors.downPaymentRequired.message}</p>}
            <p className="text-xs text-muted-foreground">Enter 0 if no down payment is needed.</p>
          </div>
          <Field label={isService ? "Expected completion or retrieval date" : "Expected completion date"} error={errors.expectedDate?.message}>
            <Input type="date" min={todayISODate()} {...form.register("expectedDate")} />
          </Field>
          {isService && (
            <Field label="Proposed procedure" error={errors.procedure?.message}>
              <Textarea rows={3} {...form.register("procedure")} placeholder="What you will do to the item." />
            </Field>
          )}
          <Field label="Notes for the customer" optional error={errors.notes?.message}>
            <Textarea rows={2} {...form.register("notes")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Spinner />} Send quotation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Statuses handled by their own buttons instead of the generic status control. */
const SPECIAL: AnyStatus[] = ["quoted", "received", "revision_requested", "approved", "rejected", "under_review", "awaiting_payment", "awaiting_drop_off", "declined"];

/** FR-20 / FR-29 — move to the next allowed status, with an optional note. */
export function StatusControl({ tx }: { tx: Transaction }) {
  const options = nextStatuses(tx.kind, tx.status, "owner").filter((s) => !SPECIAL.includes(s));
  const [to, setTo] = useState<string>("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const bal = balance(tx);
  const value = options.includes(to as AnyStatus) ? to : (options[0] ?? "");
  if (options.length === 0) return null;
  const needsBalance = (value === "claimed" || value === "completed") && bal > 0;

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-paper p-5">
      <h3 className="font-sans text-base font-semibold">Update status</h3>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Select value={value} onValueChange={setTo}>
          <SelectTrigger className="w-full" aria-label="Next status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((s) => (
              <SelectItem key={s} value={s}>
                Move to: {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          disabled={busy || needsBalance}
          onClick={async () => {
            setBusy(true);
            try {
              await repos.transactions.changeStatus(tx.kind, tx.id, value as AnyStatus, "owner", note.trim() || undefined);
              toast.success(`Status updated to “${statusLabel(value)}”. The customer was notified.`);
              setNote("");
            } catch (e) {
              toast.error(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy && <Spinner />} Update status
        </Button>
      </div>
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the customer (optional)" rows={2} aria-label="Note for the customer" />
      {needsBalance && <p className="text-sm text-danger">The customer still owes {formatPesoExact(bal)}. Record the payment settled in the store first.</p>}
      {value === "ready_for_claiming" && <p className="text-xs text-muted-foreground">The customer will be told the item is ready and how much balance to bring.</p>}
    </div>
  );
}

/** Owner cancellation (any non-final status). */
export function OwnerCancel({ tx }: { tx: Transaction }) {
  if (isFinal(tx.kind, tx.status)) return null;
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" className="text-danger hover:bg-danger/5 hover:text-danger">
          Cancel this request
        </Button>
      }
      title={`Cancel ${tx.code}?`}
      description="The customer will be notified with your reason. This can't be undone."
      confirmLabel="Cancel request"
      cancelLabel="Keep it"
      destructive
      reason={{ label: "Reason for the customer", required: true }}
      onConfirm={async (reason) => {
        try {
          await repos.transactions.cancel(tx.kind, tx.id, "owner", reason);
          toast.success(`${tx.code} was cancelled.`);
        } catch (e) {
          toast.error(errorMessage(e));
          return false;
        }
      }}
    />
  );
}

/** FR-18 / FR-30 — verify or reject payments, record cash, see balances. */
export function OwnerPaymentsPanel({ tx }: { tx: Transaction }) {
  return (
    <section className="space-y-3" aria-labelledby="owner-payments">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="owner-payments" className="text-2xl">
          Payments
        </h2>
        {tx.quotation && !isFinal(tx.kind, tx.status) && <RecordPaymentDialog tx={tx} />}
      </div>
      {tx.quotation ? <PaymentSummary tx={tx} /> : <p className="text-sm text-muted-foreground">Payments can be recorded after a quotation is issued.</p>}
      <PaymentList payments={tx.payments} renderActions={(p) => (p.status === "pending_verification" ? <VerifyButtons tx={tx} payment={p} /> : null)} />
    </section>
  );
}

export function VerifyButtons({ tx, payment }: { tx: Transaction; payment: Payment }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await repos.payments.verify(tx.kind, tx.id, payment.id);
            toast.success(`Payment of ${formatPesoExact(payment.amount)} verified.`);
          } catch (e) {
            toast.error(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Check className="size-4" /> Verify
      </Button>
      <ConfirmDialog
        trigger={
          <Button size="sm" variant="outline" disabled={busy}>
            <X className="size-4" /> Reject
          </Button>
        }
        title="Reject this payment?"
        description={`${formatPesoExact(payment.amount)} · Ref. ${payment.referenceNumber}. The customer will see your reason and can submit again.`}
        confirmLabel="Reject payment"
        destructive
        reason={{ label: "Reason", required: true, placeholder: "For example: the reference number doesn't match our GCash records." }}
        onConfirm={async (reason) => {
          try {
            await repos.payments.reject(tx.kind, tx.id, payment.id, reason);
            toast.success("Payment rejected. The customer was notified.");
          } catch (e) {
            toast.error(errorMessage(e));
            return false;
          }
        }}
      />
    </div>
  );
}

function RecordPaymentDialog({ tx }: { tx: Transaction }) {
  const [open, setOpen] = useState(false);
  const bal = balance(tx);
  const [amount, setAmount] = useState<number>(bal);
  const [kind, setKind] = useState<PaymentKind>(bal === tx.quotation?.finalPrice ? "full_payment" : "balance");
  const [method, setMethod] = useState<PaymentMethod>("cash_in_store");
  const [ref, setRef] = useState("");
  const [paidOn, setPaidOn] = useState(todayISODate());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setAmount(balance(tx));
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Record cash payment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Record a payment received</DialogTitle>
          <DialogDescription>Use this for payments made in the store. It is saved as verified. Balance: {formatPesoExact(bal)}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <FormError message={error} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rec-kind">Payment for</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as PaymentKind)}>
                <SelectTrigger id="rec-kind" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="down_payment">Down payment</SelectItem>
                  <SelectItem value="balance">Balance</SelectItem>
                  <SelectItem value="full_payment">Full payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rec-amount">Amount (₱)</Label>
              <Input id="rec-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rec-method">Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger id="rec-method" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash_in_store">Cash in store</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rec-date">Date received</Label>
              <Input id="rec-date" type="date" max={todayISODate()} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
            </div>
          </div>
          {method !== "cash_in_store" && (
            <div className="space-y-1.5">
              <Label htmlFor="rec-ref">Reference number</Label>
              <Input id="rec-ref" value={ref} onChange={(e) => setRef(e.target.value)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              setError(null);
              if (!(amount > 0)) return setError("Enter an amount greater than ₱0.");
              if (amount > bal + 0.001) return setError(`The amount is more than the balance (${formatPesoExact(bal)}).`);
              if (method !== "cash_in_store" && ref.trim().length < 4) return setError("Enter the GCash or bank reference number.");
              if (paidOn > todayISODate()) return setError("The date can't be in the future.");
              setBusy(true);
              try {
                await repos.payments.record(tx.kind, tx.id, { kind, amount, paidOn, method, referenceNumber: ref.trim() || undefined });
                toast.success(`${formatPesoExact(amount)} recorded.`);
                setOpen(false);
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <Spinner />} Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** FR-30 — record the item drop-off and the down payment collected. */
export function DropOffDialog({ tx }: { tx: Transaction }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.input<typeof dropOffSchema>>({
    resolver: zodResolver(dropOffSchema),
    defaultValues: { receivedOn: todayISODate(), downPayment: tx.quotation?.downPaymentRequired ?? 0, method: "cash_in_store", referenceNumber: "" },
  });
  const method = useWatch({ control: form.control, name: "method" });
  const { errors } = form.formState;
  const onSubmit = form.handleSubmit(async (v) => {
    setError(null);
    try {
      const p = dropOffSchema.parse(v);
      await repos.services.recordDropOff(tx.id, { receivedOn: p.receivedOn, downPayment: p.downPayment, method: p.method, referenceNumber: p.referenceNumber });
      toast.success("Drop-off recorded.");
      setOpen(false);
    } catch (e) {
      setError(errorMessage(e));
    }
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Record drop-off</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Record drop-off</DialogTitle>
          <DialogDescription>Save the date the item was received and the down payment collected. The rest is settled on claiming.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="space-y-3">
          <FormError message={error} />
          <Field label="Date received" error={errors.receivedOn?.message}>
            <Input type="date" max={todayISODate()} {...form.register("receivedOn")} />
          </Field>
          <Field label="Down payment collected (₱)" error={errors.downPayment?.message} hint={tx.quotation ? `Quotation asked for ${formatPesoExact(tx.quotation.downPaymentRequired)}.` : undefined}>
            <Input type="number" min={0} {...form.register("downPayment", { valueAsNumber: true })} />
          </Field>
          <div className="space-y-1.5">
            <Label htmlFor="do-method">Paid by</Label>
            <Select value={method} onValueChange={(v) => form.setValue("method", v as PaymentMethod)}>
              <SelectTrigger id="do-method" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash_in_store">Cash in store</SelectItem>
                <SelectItem value="gcash">GCash</SelectItem>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {method !== "cash_in_store" && (
            <Field label="Reference number" error={errors.referenceNumber?.message}>
              <Input {...form.register("referenceNumber")} />
            </Field>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Spinner />} Save drop-off
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
