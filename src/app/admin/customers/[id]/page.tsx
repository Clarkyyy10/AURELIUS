"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CreditCard, FileText, Gem, ShoppingBag, Wrench } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { PAYMENT_KIND_LABEL } from "@/components/shared/Payments";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/States";
import { PaymentStatusBadge, StatusBadge } from "@/components/shared/StatusBadge";
import { DateText, MoneyText } from "@/components/shared/Text";
import { repos } from "@/lib/data";
import { useQuery, useServiceNames } from "@/lib/data/hooks";
import { balance, detailHref, KIND_LABEL, txTitle } from "@/lib/transactions/helpers";

type Event = {
  at: string;
  type: "order" | "custom" | "service" | "quotation" | "payment";
  title: string;
  detail: React.ReactNode;
  href: string;
  badge: React.ReactNode;
};

const ICONS = { order: ShoppingBag, custom: Gem, service: Wrench, quotation: FileText, payment: CreditCard };

/** FR-48 — one customer's full transaction history in a single timeline. */
export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const cq = useQuery(`customer:${id}`, () => repos.customers.get(id));
  const tq = useQuery(`customer-tx:${id}`, () => repos.transactions.listAll({ customerId: id }));
  const serviceNames = useServiceNames();
  const [filter, setFilter] = useState<string>("all");

  const events = useMemo<Event[]>(() => {
    const list: Event[] = [];
    for (const t of tq.data ?? []) {
      const href = detailHref(t.kind, t.id, "owner");
      list.push({
        at: t.createdAt,
        type: t.kind,
        title: `${KIND_LABEL[t.kind]} ${t.code}`,
        detail: txTitle(t, serviceNames),
        href,
        badge: <StatusBadge status={t.status} />,
      });
      if (t.quotation)
        list.push({
          at: t.quotation.issuedAt,
          type: "quotation",
          title: `Quotation for ${t.code}`,
          detail: (
            <>
              <MoneyText value={t.quotation.finalPrice} exact /> · {t.quotation.response ? `${t.quotation.response.decision}` : "waiting for answer"}
            </>
          ),
          href,
          badge: null,
        });
      for (const p of t.payments)
        list.push({
          at: p.createdAt,
          type: "payment",
          title: `${PAYMENT_KIND_LABEL[p.kind]} for ${t.code}`,
          detail: (
            <>
              <MoneyText value={p.amount} exact /> · Ref. {p.referenceNumber}
            </>
          ),
          href,
          badge: <PaymentStatusBadge status={p.status} />,
        });
    }
    return list.sort((a, b) => b.at.localeCompare(a.at));
  }, [tq.data, serviceNames]);

  if (cq.error || tq.error) return <ErrorState message={(cq.error ?? tq.error)!} onRetry={() => (cq.reload(), tq.reload())} />;
  if (cq.loading || tq.loading) return <LoadingState rows={4} />;
  const c = cq.data;
  if (!c) return <ErrorState message="We couldn't find that customer." />;
  const txs = tq.data ?? [];
  const open = txs
    .filter((t) => t.quotation?.response?.decision === "accepted" && !["cancelled", "completed", "claimed"].includes(t.status))
    .reduce((s, t) => s + balance(t), 0);
  const shown = filter === "all" ? events : events.filter((e) => e.type === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title={c.fullName}
        back={{ href: "/admin/customers", label: "Back to customers" }}
        description={`Customer since ${new Date(c.createdAt).toLocaleDateString("en-PH", { month: "long", year: "numeric" })}`}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Email", c.email],
          ["Mobile", c.contactNumber],
          ["Email verified", c.emailVerified ? "Yes" : "Not yet"],
          ["Privacy consent", c.privacyConsentAt ? new Date(c.privacyConsentAt).toLocaleString("en-PH") : "—"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-line bg-paper p-4">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="font-medium break-all">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-paper p-4">
          <p className="text-xs text-muted-foreground">Transactions</p>
          <p className="font-heading text-3xl font-semibold">{txs.length}</p>
        </div>
        <div className="rounded-xl border border-line bg-paper p-4">
          <p className="text-xs text-muted-foreground">Payments</p>
          <p className="font-heading text-3xl font-semibold">{txs.reduce((n, t) => n + t.payments.length, 0)}</p>
        </div>
        <div className="rounded-xl border border-gold/40 bg-gold/5 p-4">
          <p className="text-xs text-muted-foreground">Open balance</p>
          <p className="font-heading text-3xl font-semibold">
            <MoneyText value={open} exact />
          </p>
        </div>
      </div>

      <section aria-labelledby="history" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="history" className="text-2xl">
            Transaction history
          </h2>
          <div className="flex items-center gap-2">
            <Label htmlFor="hist-filter" className="text-sm">
              Show
            </Label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger id="hist-filter" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everything</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
                <SelectItem value="custom">Custom requests</SelectItem>
                <SelectItem value="service">Service requests</SelectItem>
                <SelectItem value="quotation">Quotations</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {shown.length === 0 ? (
          <EmptyState title="Nothing to show" description="This customer has no records of this type yet." />
        ) : (
          <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-paper">
            {shown.map((e, i) => {
              const Icon = ICONS[e.type];
              return (
                <li key={i}>
                  <Link href={e.href} className="flex flex-wrap items-center gap-3 p-4 hover:bg-muted/40">
                    <span className="flex size-9 items-center justify-center rounded-full bg-gold/15">
                      <Icon className="size-4 text-gold-dark" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{e.title}</span>
                      <span className="block text-sm text-muted-foreground">{e.detail}</span>
                    </span>
                    {e.badge}
                    <DateText value={e.at} className="text-xs text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
