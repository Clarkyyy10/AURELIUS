"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Bell } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionTable } from "@/components/account/TransactionTable";
import { VerifyEmailBanner } from "@/components/layout/Guards";
import { NotificationList } from "@/components/shared/Notifications";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaymentList } from "@/components/shared/Payments";
import { ErrorState, LoadingState } from "@/components/shared/States";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { repos } from "@/lib/data";
import { useCurrentUser, useQuery, useServiceNames } from "@/lib/data/hooks";
import { customerActionNeeded, detailHref, KIND_LABEL, txTitle } from "@/lib/transactions/helpers";
import type { Transaction } from "@/types";

const TABS = [
  ["orders", "Orders"],
  ["custom", "Custom designs"],
  ["services", "Service requests"],
  ["payments", "Payments"],
  ["notifications", "Notifications"],
] as const;

/** FR-19, FR-23, FR-31, FR-49 — customer dashboard. */
function AccountDashboard() {
  const { user } = useCurrentUser();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = TABS.some(([k]) => k === params.get("tab")) ? params.get("tab")! : "orders";
  const q = useQuery(`my-transactions:${user?.id}`, () => repos.transactions.listAll());
  const serviceNames = useServiceNames();

  if (!user) return null;
  if (user.role === "owner")
    return (
      <div className="rounded-xl border border-line bg-paper p-6">
        <p>You&apos;re signed in as the owner. Customer accounts are managed in the owner dashboard.</p>
        <Link href="/admin" className="mt-2 inline-block text-gold-dark underline">
          Go to the owner dashboard
        </Link>
      </div>
    );

  const all = q.data ?? [];
  const actions = all.map((t) => ({ t, action: customerActionNeeded(t) })).filter((x): x is { t: Transaction; action: string } => Boolean(x.action));
  const byKind = (k: Transaction["kind"]) => all.filter((t) => t.kind === k);
  const payments = all.flatMap((t) => t.payments.map((p) => ({ ...p, code: t.code, tx: t })));

  return (
    <div className="space-y-6">
      <PageHeader title={`Hello, ${user.fullName.split(" ")[0]}`} description="Your orders, custom designs, service requests, and payments in one place." />
      <VerifyEmailBanner user={user} />

      {q.error && <ErrorState message={q.error} onRetry={q.reload} />}
      {q.loading && <LoadingState rows={2} />}
      {actions.length > 0 && (
        <section aria-labelledby="needs-action">
          <h2 id="needs-action" className="mb-3 text-2xl">
            Needs your attention
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map(({ t, action }) => (
              <li key={t.id}>
                <Link href={detailHref(t.kind, t.id, "customer")} className={`flex h-full flex-col gap-2 rounded-xl border p-4 hover:shadow-sm ${t.status === "ready_for_claiming" ? "border-success/40 bg-success/5" : "border-warning/40 bg-warning/5"}`}>
                  <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    {KIND_LABEL[t.kind]} · {t.code} <StatusBadge status={t.status} />
                  </span>
                  <span className="line-clamp-1 text-sm">{txTitle(t, serviceNames)}</span>
                  <span className="mt-auto flex items-center gap-1 font-medium text-gold-dark">
                    {action} <ArrowRight className="size-4" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Tabs value={tab} onValueChange={(v) => router.replace(`${pathname}?tab=${v}`, { scroll: false })}>
        <div className="-mx-4 overflow-x-auto px-4">
          <TabsList className="w-max">
            {TABS.map(([k, label]) => (
              <TabsTrigger key={k} value={k} className="min-h-9 px-3">
                {label === "Notifications" && <Bell className="size-4" aria-hidden />} {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {q.data && (
          <>
            <TabsContent value="orders" className="mt-4">
              <TransactionTable rows={byKind("order")} kind="order" role="customer" serviceNames={serviceNames} empty={{ title: "No orders yet", description: "Browse the shop to find a ready-made piece." }} extraToolbar={<Link href="/shop" className="text-sm text-gold-dark underline">Go to the shop</Link>} />
            </TabsContent>
            <TabsContent value="custom" className="mt-4">
              <TransactionTable rows={byKind("custom")} kind="custom" role="customer" serviceNames={serviceNames} empty={{ title: "No custom designs yet", description: "Design your own piece in 3D." }} extraToolbar={<Link href="/customize" className="text-sm text-gold-dark underline">Design a piece</Link>} />
            </TabsContent>
            <TabsContent value="services" className="mt-4">
              <TransactionTable rows={byKind("service")} kind="service" role="customer" serviceNames={serviceNames} empty={{ title: "No service requests yet", description: "Book a cleaning, repair, or resizing." }} extraToolbar={<Link href="/services" className="text-sm text-gold-dark underline">Book a service</Link>} />
            </TabsContent>
            <TabsContent value="payments" className="mt-4 space-y-3">
              {payments.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line p-6 text-center text-muted-foreground">No payments yet. Payments appear here after you submit them.</p>
              ) : (
                Object.values(Object.groupBy(payments, (p) => p.tx.id)).map((group) => {
                  const tx = group![0].tx;
                  return (
                    <div key={tx.id} className="space-y-2">
                      <Link href={detailHref(tx.kind, tx.id, "customer")} className="text-sm font-medium text-gold-dark hover:underline">
                        {tx.code} · {txTitle(tx, serviceNames)}
                      </Link>
                      <PaymentList payments={tx.payments} />
                    </div>
                  );
                })
              )}
            </TabsContent>
          </>
        )}
        <TabsContent value="notifications" className="mt-4">
          <NotificationList user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AccountDashboard />
    </Suspense>
  );
}
