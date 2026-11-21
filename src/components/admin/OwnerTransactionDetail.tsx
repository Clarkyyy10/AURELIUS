"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Mail, MessageSquareWarning, Phone, ThumbsDown, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CustomItem, OrderItem, ServiceItem } from "@/components/account/CustomerTransactionDetail";
import { LazyJewelryViewer } from "@/components/customization/LazyViewer";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { QuotationCard } from "@/components/shared/QuotationCard";
import { ErrorState, LoadingState } from "@/components/shared/States";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StatusTimeline } from "@/components/shared/StatusTimeline";
import { CodeChip, DateText, MoneyText } from "@/components/shared/Text";
import { repos } from "@/lib/data";
import { errorMessage, useCustomerMap, useQuery, useServiceNames } from "@/lib/data/hooks";
import { tryEstimate } from "@/lib/pricing/estimate";
import { KIND_LABEL } from "@/lib/transactions/helpers";
import { formatPesoExact, formatWeight } from "@/lib/utils/format";
import type { CustomOrderRequest, Transaction, TransactionKind } from "@/types";
import { DropOffDialog, OwnerCancel, OwnerPaymentsPanel, QuotationForm, StatusControl } from "./OwnerActions";

const LIST: Record<TransactionKind, [string, string]> = {
  order: ["/admin/orders", "Orders"],
  custom: ["/admin/custom-requests", "Custom requests"],
  service: ["/admin/service-requests", "Service requests"],
};

/** Owner detail page for orders (FR-15, FR-18, FR-20), custom requests (FR-08, FR-09, FR-11, FR-15) and services (FR-27, FR-29, FR-30). */
export function OwnerTransactionDetail({ kind, id }: { kind: TransactionKind; id: string }) {
  const q = useQuery(`tx:${kind}:${id}`, () => repos.transactions.get(kind, id));
  const serviceNames = useServiceNames();
  const { map: customers } = useCustomerMap();
  const opened = useRef(false);

  // Opening a submitted custom request moves it to "under review" automatically (frontend-spec §5.11).
  useEffect(() => {
    if (kind === "custom" && q.data?.status === "submitted" && !opened.current) {
      opened.current = true;
      repos.customOrders.openForReview(id).catch((e) => toast.error(errorMessage(e)));
    }
  }, [kind, id, q.data?.status]);

  if (q.error) return <ErrorState message={q.error} onRetry={q.reload} />;
  if (q.loading) return <LoadingState rows={4} />;
  if (!q.data) return <ErrorState message="We couldn't find this record." />;
  const tx = q.data;
  const customer = customers[tx.customerId];
  const [listHref, listLabel] = LIST[kind];

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: listHref, label: `Back to ${listLabel.toLowerCase()}` }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {KIND_LABEL[kind]} <StatusBadge status={tx.status} className="text-sm" />
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-2">
            <CodeChip code={tx.code} /> Submitted <DateText value={tx.createdAt} withTime />
            {tx.kind !== "order" && tx.source === "chatbot" && <span className="rounded-full bg-info/10 px-2 py-0.5 text-xs text-info">Prepared with the assistant</span>}
            {tx.kind === "custom" && tx.source === "catalog" && <span className="rounded-full bg-muted px-2 py-0.5 text-xs">From the shop</span>}
          </span>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          <NextActions tx={tx} />

          <section className="rounded-2xl border border-line bg-paper p-5">
            <h2 className="mb-4 text-2xl">{kind === "service" ? "Item and services" : kind === "custom" ? "Design" : "Order"}</h2>
            {tx.kind === "order" && <OrderItem tx={tx} />}
            {tx.kind === "custom" && <OwnerDesign tx={tx} />}
            {tx.kind === "service" && <ServiceItem tx={tx} serviceNames={serviceNames} />}
          </section>

          <QuotationCard tx={tx} canRespond={false} />
          <OwnerPaymentsPanel tx={tx} />
          <StatusControl tx={tx} />
          <div className="flex justify-end">
            <OwnerCancel tx={tx} />
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-line bg-paper p-5" aria-labelledby="customer-title">
            <h2 id="customer-title" className="mb-3 text-xl">
              Customer
            </h2>
            {customer ? (
              <div className="space-y-1.5 text-sm">
                <p className="flex items-center gap-2 font-medium">
                  <UserRound className="size-4 text-gold-dark" aria-hidden /> {customer.fullName}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-gold-dark" aria-hidden />
                  <a href={`tel:${customer.contactNumber}`} className="hover:underline">
                    {customer.contactNumber}
                  </a>
                </p>
                <p className="flex items-center gap-2 break-all">
                  <Mail className="size-4 shrink-0 text-gold-dark" aria-hidden /> {customer.email}
                </p>
                <Link href={`/admin/customers/${customer.id}`} className="inline-block pt-1 text-gold-dark hover:underline">
                  View transaction history
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </section>
          <section className="rounded-2xl border border-line bg-paper p-5" aria-labelledby="history-title">
            <h2 id="history-title" className="mb-4 text-xl">
              History
            </h2>
            <StatusTimeline kind={tx.kind} history={tx.history} current={tx.status} />
          </section>
        </aside>
      </div>
    </div>
  );
}

/** The main buttons for the current status. */
function NextActions({ tx }: { tx: Transaction }) {
  let content: React.ReactNode = null;

  if (tx.kind === "custom" && (tx.status === "under_review" || tx.status === "submitted")) {
    content = (
      <>
        <p className="w-full text-sm text-muted-foreground">Review the design, then approve it, ask for changes, or reject it.</p>
        <ConfirmDialog
          trigger={
            <Button>
              <CheckCircle2 className="size-4" /> Approve design
            </Button>
          }
          title="Approve this design?"
          description="The customer will be notified. Next, issue a quotation with the final price and date."
          confirmLabel="Approve design"
          onConfirm={async () => {
            try {
              await repos.customOrders.approve(tx.id);
              toast.success("Design approved.");
            } catch (e) {
              toast.error(errorMessage(e));
              return false;
            }
          }}
        />
        <ConfirmDialog
          trigger={
            <Button variant="outline">
              <MessageSquareWarning className="size-4" /> Request revision
            </Button>
          }
          title="Ask the customer for changes"
          description="Write what the customer should change. They'll see your remarks and can edit the design in 3D."
          confirmLabel="Send remarks"
          reason={{ label: "Remarks", required: true, minLength: 10, placeholder: "For example: please choose a smaller stone for this band width." }}
          onConfirm={async (text) => {
            try {
              await repos.customOrders.requestRevision(tx.id, text);
              toast.success("Remarks sent to the customer.");
            } catch (e) {
              toast.error(errorMessage(e));
              return false;
            }
          }}
        />
        <ConfirmDialog
          trigger={
            <Button variant="ghost" className="text-danger hover:bg-danger/5 hover:text-danger">
              <ThumbsDown className="size-4" /> Reject
            </Button>
          }
          title="Reject this design?"
          description="The request will be closed and the customer will see your reason."
          confirmLabel="Reject design"
          destructive
          reason={{ label: "Reason", required: true }}
          onConfirm={async (reason) => {
            try {
              await repos.customOrders.reject(tx.id, reason);
              toast.success("Design rejected.");
            } catch (e) {
              toast.error(errorMessage(e));
              return false;
            }
          }}
        />
      </>
    );
  } else if (tx.kind === "custom" && tx.status === "approved") {
    content = <QuotationForm tx={tx} suggestedPrice={tx.versions[tx.versions.length - 1].estimate.price} trigger={<Button>Issue quotation</Button>} />;
  } else if (tx.kind === "order" && tx.status === "pending") {
    content = (
      <>
        <QuotationForm tx={tx} suggestedPrice={tx.productSnapshot.price * tx.quantity} trigger={<Button>Issue quotation</Button>} />
        <ConfirmDialog
          trigger={
            <Button variant="ghost" className="text-danger hover:bg-danger/5 hover:text-danger">
              Reject order
            </Button>
          }
          title="Reject this order?"
          description="The customer will see your reason."
          confirmLabel="Reject order"
          destructive
          reason={{ label: "Reason", required: true, placeholder: "For example: this item just sold out." }}
          onConfirm={async (reason) => {
            try {
              await repos.orders.reject(tx.id, reason);
              toast.success("Order rejected.");
            } catch (e) {
              toast.error(errorMessage(e));
              return false;
            }
          }}
        />
      </>
    );
  } else if (tx.kind === "service" && tx.status === "under_assessment") {
    content = (
      <QuotationForm tx={tx} suggestedPrice={tx.quotation?.finalPrice ?? 0} trigger={<Button>{tx.quotation ? "Re-issue quotation after inspection" : "Issue service quotation"}</Button>} />
    );
  } else if (tx.kind === "service" && tx.status === "awaiting_drop_off") {
    content = (
      <>
        <p className="w-full text-sm text-muted-foreground">The customer accepted. Record the drop-off when they bring the item.</p>
        <DropOffDialog tx={tx} />
      </>
    );
  } else if (tx.status === "quoted") {
    content = <p className="text-sm text-muted-foreground">Waiting for the customer to accept or decline the quotation.</p>;
  } else if (tx.status === "awaiting_payment") {
    content = <p className="text-sm text-muted-foreground">Waiting for the down payment. Verify it below when the customer submits it — the order is confirmed automatically.</p>;
  } else if (tx.kind === "custom" && tx.status === "revision_requested") {
    content = <p className="text-sm text-muted-foreground">Waiting for the customer to update the design.</p>;
  }

  if (!content) return null;
  return <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gold/40 bg-gold/5 p-4">{content}</div>;
}

function OwnerDesign({ tx }: { tx: CustomOrderRequest }) {
  const v = tx.versions[tx.versions.length - 1];
  const optionsQ = useQuery("options:all", () => repos.customization.getOptions({ includeInactive: true }));
  const current = useMemo(() => (optionsQ.data ? tryEstimate(v.config, optionsQ.data) : null), [optionsQ.data, v.config]);
  const [show3d, setShow3d] = useState(false);

  return (
    <div className="space-y-5">
      <CustomItem tx={tx} />
      <div className="rounded-xl border border-line p-4 text-sm">
        <p className="font-medium">Estimate breakdown (with today&apos;s rates)</p>
        {current ? (
          <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
            <dt>Metal ({formatWeight(current.weightG)})</dt>
            <dd className="tabular text-right">{formatPesoExact(current.breakdown.metal)}</dd>
            <dt>Stones</dt>
            <dd className="tabular text-right">{formatPesoExact(current.breakdown.stones)}</dd>
            <dt>Labor</dt>
            <dd className="tabular text-right">{formatPesoExact(current.breakdown.labor)}</dd>
            <dt>Finish</dt>
            <dd className="tabular text-right">{formatPesoExact(current.breakdown.finish)}</dd>
            <dt className="font-medium">Total today</dt>
            <dd className="tabular text-right font-medium">
              <MoneyText value={current.price} />
            </dd>
          </dl>
        ) : (
          <p className="text-muted-foreground">Some options in this design are no longer configured.</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Submitted estimate: <MoneyText value={v.estimate.price} /> ({formatWeight(v.estimate.weightG)}). Customers keep the estimate they submitted with.
        </p>
      </div>
      {optionsQ.data &&
        (show3d ? (
          <LazyJewelryViewer config={v.config} options={optionsQ.data} className="h-80 w-full" label={`3D view of version ${v.version}`} />
        ) : (
          <Button variant="outline" onClick={() => setShow3d(true)}>
            Open 3D view of version {v.version}
          </Button>
        ))}
    </div>
  );
}
