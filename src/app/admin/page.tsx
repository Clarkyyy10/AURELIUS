"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, Gem, PackageCheck, Palette, Plus, ShoppingBag, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { useNotifications } from "@/components/shared/Notifications";
import { ErrorState, LoadingState } from "@/components/shared/States";
import { DateText, MoneyText } from "@/components/shared/Text";
import { repos } from "@/lib/data";
import { useCurrentUser, useQuery } from "@/lib/data/hooks";
import { balance } from "@/lib/transactions/helpers";
import { ownerCounts } from "@/lib/transactions/ownerCounts";
import { cn } from "@/lib/utils";

/** FR-46, FR-50 — owner dashboard. */
export default function AdminDashboard() {
  const { user } = useCurrentUser();
  const router = useRouter();
  const q = useQuery("owner:all", () => repos.transactions.listAll());
  const notes = useNotifications(user);

  if (q.error) return <ErrorState message={q.error} onRetry={q.reload} />;
  if (q.loading || !q.data) return <LoadingState rows={4} />;
  const all = q.data;
  const c = ownerCounts(all);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const thisMonth = all.filter((t) => t.createdAt >= monthStart);
  const openBalances = all
    .filter((t) => t.quotation?.response?.decision === "accepted" && !["cancelled", "completed", "claimed"].includes(t.status))
    .reduce((s, t) => s + balance(t), 0);

  const readyKind = (["custom", "order", "service"] as const).find((k) => all.some((t) => t.kind === k && t.status === "ready_for_claiming")) ?? "custom";
  const readyHref = `${{ custom: "/admin/custom-requests", order: "/admin/orders", service: "/admin/service-requests" }[readyKind]}?status=ready_for_claiming`;
  const cards = [
    { label: "Custom requests to review", n: c.customToReview, href: "/admin/custom-requests?status=__open", icon: Gem },
    { label: "Orders to quote", n: c.ordersToQuote, href: "/admin/orders?status=pending", icon: ShoppingBag },
    { label: "Service requests to assess", n: c.servicesToAssess, href: "/admin/service-requests?status=__open", icon: Wrench },
    { label: "Payments to verify", n: c.paymentsToVerify, href: "/admin/payments", icon: CreditCard },
    { label: "Ready for claiming", n: c.readyForClaiming, href: readyHref, icon: PackageCheck },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Good day"
        description="Here's what needs your attention."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/products/new">
                <Plus className="size-4" /> Add product
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/customization">
                <Palette className="size-4" /> Edit rates
              </Link>
            </Button>
          </>
        }
      />

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(({ label, n, href, icon: Icon }) => (
          <li key={label}>
            <Link
              href={href}
              className={cn("flex h-full flex-col gap-2 rounded-lg border p-4 hover:shadow-sm", n > 0 ? "border-gold/50 bg-gold/5" : "border-line bg-paper")}
            >
              <Icon className="size-5 text-gold-dark" aria-hidden />
              <span className="font-heading text-4xl font-semibold">{n}</span>
              <span className="text-sm text-muted-foreground">{label}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-lg border border-line bg-paper p-5" aria-labelledby="activity">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="activity" className="text-2xl">
              Recent activity
            </h2>
            <Link href="/admin/notifications" className="text-sm text-gold-dark hover:underline">
              View all
            </Link>
          </div>
          {(notes.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(notes.data ?? []).slice(0, 8).map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => router.push(n.link)} className="flex w-full items-start gap-3 py-2.5 text-left hover:bg-muted/40">
                    <span className={cn("mt-2 size-2 shrink-0 rounded-full", n.read ? "bg-line" : "bg-gold-dark")} aria-label={n.read ? "Read" : "Unread"} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{n.title}</span>
                      <span className="block text-sm text-muted-foreground">{n.body}</span>
                    </span>
                    <DateText value={n.createdAt} relative className="shrink-0 text-xs text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-lg border border-line bg-paper p-5" aria-labelledby="stats">
          <h2 id="stats" className="text-2xl">
            This month
          </h2>
          <dl className="grid grid-cols-3 gap-3 text-center">
            {(
              [
                ["Custom", thisMonth.filter((t) => t.kind === "custom").length],
                ["Orders", thisMonth.filter((t) => t.kind === "order").length],
                ["Services", thisMonth.filter((t) => t.kind === "service").length],
              ] as const
            ).map(([l, n]) => (
              <div key={l} className="rounded-xl bg-muted/60 p-3">
                <dt className="text-xs text-muted-foreground">{l} requests</dt>
                <dd className="font-heading text-3xl font-semibold">{n}</dd>
              </div>
            ))}
          </dl>
          <div className="rounded-xl border border-gold/40 bg-gold/5 p-4">
            <p className="text-sm text-muted-foreground">Open balances to collect</p>
            <p className="font-heading text-3xl font-semibold">
              <MoneyText value={openBalances} exact />
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
