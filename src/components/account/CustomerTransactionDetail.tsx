"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, MessageSquareWarning, PartyPopper, Pencil, Store, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DesignSpecList } from "@/components/customization/DesignSpecList";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaymentForm, PaymentList, PaymentSummary } from "@/components/shared/Payments";
import { QuotationCard } from "@/components/shared/QuotationCard";
import { ErrorState, LoadingState } from "@/components/shared/States";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StatusTimeline } from "@/components/shared/StatusTimeline";
import { StoredImage } from "@/components/shared/StoredImage";
import { CodeChip, DateText, EstimateNotice, MoneyText } from "@/components/shared/Text";
import { repos } from "@/lib/data";
import { errorMessage, useQuery, useServiceNames, useSettings } from "@/lib/data/hooks";
import { diffLabels } from "@/lib/pricing/labels";
import { canCustomerCancel } from "@/lib/status/machines";
import { balance, canSubmitPayment, KIND_LABEL, txTitle } from "@/lib/transactions/helpers";
import { formatDate, formatWeight } from "@/lib/utils/format";
import type { CustomOrderRequest, ProductOrder, ServiceRequest, Transaction, TransactionKind } from "@/types";

/** Shared detail layout for /account/orders/[id], /account/custom/[id], /account/services/[id]. */
export function CustomerTransactionDetail({ kind, id }: { kind: TransactionKind; id: string }) {
  const q = useQuery(`tx:${kind}:${id}`, () => repos.transactions.get(kind, id));
  const serviceNames = useServiceNames();
  if (q.error) return <ErrorState message={q.error} onRetry={q.reload} />;
  if (q.loading) return <LoadingState rows={4} />;
  if (!q.data) return <ErrorState message="We couldn't find this record. It may belong to another account, or the link may be wrong." />;
  return <Detail tx={q.data} serviceNames={serviceNames} />;
}

function Detail({ tx, serviceNames }: { tx: Transaction; serviceNames: Record<string, string> }) {
  const settings = useSettings();
  const [payOpen, setPayOpen] = useState(false);
  const cancellable = canCustomerCancel(tx.kind, tx.status);
  const payable = canSubmitPayment(tx);
  const bal = balance(tx);
  const resubmitted = useSearchParams().get("resubmitted");

  const primary =
    tx.kind === "custom" && tx.status === "revision_requested" ? (
      <Button asChild>
        <Link href={`/customize?request=${tx.id}`}>
          <Pencil className="size-4" /> Edit design and resubmit
        </Link>
      </Button>
    ) : tx.status === "quoted" ? (
      <Button asChild>
        <a href="#quote-title">Review the quotation</a>
      </Button>
    ) : payable ? (
      <Button onClick={() => setPayOpen(true)}>
        <Wallet className="size-4" /> Submit payment
      </Button>
    ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: `/account?tab=${tx.kind === "order" ? "orders" : tx.kind === "custom" ? "custom" : "services"}`, label: "Back to my account" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {KIND_LABEL[tx.kind]} <StatusBadge status={tx.status} className="text-sm" />
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-2">
            <CodeChip code={tx.code} /> Submitted <DateText value={tx.createdAt} />
          </span>
        }
        actions={primary}
      />
      {resubmitted && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">Your updated design was sent to the owner.</p>}

      {tx.status === "ready_for_claiming" && (
        <div className="flex items-start gap-3 rounded-lg border border-success/40 bg-success/10 p-5">
          <PartyPopper className="mt-0.5 size-6 shrink-0 text-success" aria-hidden />
          <div>
            <p className="text-lg font-semibold">Your item is ready.</p>
            <p>
              Visit the store to claim it
              {bal > 0 ? (
                <>
                  {" "}
                  and settle any balance of <MoneyText value={bal} exact />.
                </>
              ) : (
                "."
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {settings.address} · {settings.openingHours}
            </p>
          </div>
        </div>
      )}

      {tx.kind === "custom" && tx.status === "revision_requested" && tx.revisionRemarks.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-5" role="note">
          <p className="flex items-center gap-2 font-semibold">
            <MessageSquareWarning className="size-5 text-warning" aria-hidden /> The owner asked for changes
          </p>
          <p className="mt-1">“{tx.revisionRemarks[tx.revisionRemarks.length - 1].text}”</p>
          <Button asChild className="mt-3">
            <Link href={`/customize?request=${tx.id}`}>
              <Pencil className="size-4" /> Edit design and resubmit
            </Link>
          </Button>
        </div>
      )}
      {(tx.kind === "custom" || tx.kind === "order") && tx.status === "rejected" && tx.rejectionReason && (
        <p className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm">
          <strong>Reason from the store:</strong> {tx.rejectionReason}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-lg border border-line bg-paper p-5">
            <h2 className="mb-4 text-2xl">{tx.kind === "service" ? "Your item" : tx.kind === "custom" ? "Your design" : "Your order"}</h2>
            {tx.kind === "order" && <OrderItem tx={tx} />}
            {tx.kind === "custom" && <CustomItem tx={tx} />}
            {tx.kind === "service" && <ServiceItem tx={tx} serviceNames={serviceNames} />}
          </section>

          <QuotationCard tx={tx} canRespond />

          {tx.quotation && (tx.payments.length > 0 || payable) && (
            <section aria-labelledby="payments-title" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="payments-title" className="text-2xl">
                  Payments
                </h2>
                {payable && (
                  <Dialog open={payOpen} onOpenChange={setPayOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Wallet className="size-4" /> Submit payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
                      <DialogHeader>
                        <DialogTitle className="font-heading text-2xl">Submit a payment for {tx.code}</DialogTitle>
                        <DialogDescription>The owner checks every payment before it counts toward your balance.</DialogDescription>
                      </DialogHeader>
                      <PaymentForm tx={tx} onDone={() => setPayOpen(false)} />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <PaymentSummary tx={tx} />
              <PaymentList payments={tx.payments} />
            </section>
          )}

          <div className="rounded-lg border border-line bg-paper p-5 text-sm">
            {cancellable ? (
              <ConfirmDialog
                trigger={
                  <Button variant="outline" className="border-danger/40 text-danger hover:bg-danger/5">
                    Cancel this {KIND_LABEL[tx.kind].toLowerCase()}
                  </Button>
                }
                title={`Cancel ${tx.code}?`}
                description="The owner will be notified. This can't be undone — you would need to submit a new request."
                confirmLabel="Yes, cancel it"
                cancelLabel="Keep it"
                destructive
                reason={{ label: "Reason for cancelling" }}
                onConfirm={async (reason) => {
                  try {
                    await repos.transactions.cancel(tx.kind, tx.id, "customer", reason);
                    toast.success(`${tx.code} was cancelled.`);
                  } catch (e) {
                    toast.error(errorMessage(e));
                    return false;
                  }
                }}
              />
            ) : !["cancelled", "declined", "rejected", "completed", "claimed"].includes(tx.status) ? (
              <p className="text-muted-foreground">To cancel at this stage, please contact the store at {settings.contactNumber}.</p>
            ) : (
              <p className="text-muted-foreground">This {KIND_LABEL[tx.kind].toLowerCase()} is closed.</p>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-line bg-paper p-5" aria-labelledby="timeline-title">
            <h2 id="timeline-title" className="mb-4 text-2xl">
              Progress
            </h2>
            <StatusTimeline kind={tx.kind} history={tx.history} current={tx.status} />
          </section>
          <p className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
            <Store className="mt-0.5 size-4 shrink-0" aria-hidden /> {settings.claimingNote}
          </p>
        </aside>
      </div>
    </div>
  );
}

export function OrderItem({ tx }: { tx: ProductOrder }) {
  return (
    <div className="flex gap-4">
      <StoredImage src={tx.productSnapshot.photo} alt={tx.productSnapshot.name} className="size-24 shrink-0 rounded-xl border border-line" />
      <div>
        <p className="font-medium">{tx.productSnapshot.name}</p>
        <p className="text-sm text-muted-foreground">
          Quantity {tx.quantity} · <MoneyText value={tx.productSnapshot.price} /> each
        </p>
        {tx.notes && <p className="mt-2 text-sm">Your notes: {tx.notes}</p>}
      </div>
    </div>
  );
}

export function CustomItem({ tx }: { tx: CustomOrderRequest }) {
  const [compareOpen, setCompareOpen] = useState(false);
  const v = tx.versions[tx.versions.length - 1];
  const prev = tx.versions.length > 1 ? tx.versions[tx.versions.length - 2] : null;
  return (
    <div className="space-y-4">
      <div className="grid gap-5 sm:grid-cols-[12rem_1fr]">
        <StoredImage
          src={v.snapshotDataUrl}
          alt={`Snapshot of version ${v.version} of your design`}
          className="aspect-square w-full rounded-xl border border-line"
        />
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Version {v.version} · submitted <DateText value={v.submittedAt} />
          </p>
          <DesignSpecList labels={v.labels} config={v.config} />
          <div className="rounded-lg bg-muted/60 p-3 text-sm">
            Estimated {formatWeight(v.estimate.weightG)} ·{" "}
            <strong>
              <MoneyText value={v.estimate.price} />
            </strong>
            <EstimateNotice />
          </div>
        </div>
      </div>
      {tx.versions.length > 1 && (
        <div id="versions" className="scroll-mt-24">
          <p className="mb-2 text-sm font-medium">Version history</p>
          <ul className="flex flex-wrap gap-3">
            {tx.versions.map((x) => (
              <li key={x.version} className="w-28 text-center text-xs">
                <StoredImage src={x.snapshotDataUrl} alt={`Version ${x.version}`} className="aspect-square w-28 rounded-lg border border-line" />
                <span className="mt-1 block">
                  Version {x.version} · {formatDate(x.submittedAt)}
                </span>
              </li>
            ))}
          </ul>
          {prev && (
            <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
              <DialogTrigger asChild>
                <Button variant="link" className="px-0">
                  Compare version {prev.version} and {v.version}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="font-heading text-2xl">Compare versions</DialogTitle>
                  <DialogDescription>Changed fields are highlighted.</DialogDescription>
                </DialogHeader>
                <VersionCompare a={prev} b={v} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
      {tx.revisionRemarks.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Remarks from the owner</p>
          <ul className="space-y-2">
            {tx.revisionRemarks.map((r) => (
              <li key={r.at} className="rounded-lg border border-line p-3 text-sm">
                <span className="block text-xs text-muted-foreground">
                  <DateText value={r.at} withTime />
                </span>
                {r.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function VersionCompare({ a, b }: { a: CustomOrderRequest["versions"][number]; b: CustomOrderRequest["versions"][number] }) {
  const changed = diffLabels(a.labels, b.labels);
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {[a, b].map((x) => (
        <div key={x.version} className="space-y-3">
          <p className="font-medium">Version {x.version}</p>
          <StoredImage src={x.snapshotDataUrl} alt={`Version ${x.version}`} className="aspect-square w-full rounded-xl border border-line" />
          <DesignSpecList labels={x.labels} config={x.config} highlight={x === b ? changed : []} />
          <p className="text-sm">
            Estimate <MoneyText value={x.estimate.price} />
          </p>
        </div>
      ))}
    </div>
  );
}

export function ServiceItem({ tx, serviceNames }: { tx: ServiceRequest; serviceNames: Record<string, string> }) {
  return (
    <div className="space-y-3 text-sm">
      <dl className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-4 gap-y-2">
        <dt className="text-muted-foreground">Item type</dt>
        <dd className="capitalize">{tx.itemType}</dd>
        <dt className="text-muted-foreground">Item</dt>
        <dd>{tx.itemDescription}</dd>
        {tx.brandModel && (
          <>
            <dt className="text-muted-foreground">Brand / model</dt>
            <dd>{tx.brandModel}</dd>
          </>
        )}
        {tx.material && (
          <>
            <dt className="text-muted-foreground">Material</dt>
            <dd>{tx.material}</dd>
          </>
        )}
        <dt className="text-muted-foreground">Services</dt>
        <dd>{tx.serviceIds.map((id) => serviceNames[id] ?? id).join(", ")}</dd>
        <dt className="text-muted-foreground">Details</dt>
        <dd className="whitespace-pre-line">{tx.details}</dd>
        {tx.preferredDropOffDate && (
          <>
            <dt className="text-muted-foreground">Preferred drop-off</dt>
            <dd className="flex items-center gap-1">
              <CalendarDays className="size-4" aria-hidden /> {formatDate(tx.preferredDropOffDate)}
            </dd>
          </>
        )}
        {tx.droppedOffAt && (
          <>
            <dt className="text-muted-foreground">Received in store</dt>
            <dd>{formatDate(tx.droppedOffAt)}</dd>
          </>
        )}
      </dl>
      {tx.photos.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {tx.photos.map((p, i) => (
            <li key={p}>
              <StoredImage src={p} alt={`Photo ${i + 1} of ${txTitle(tx)}`} className="size-24 rounded-lg border border-line" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
