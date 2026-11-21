"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerifyButtons } from "@/components/admin/OwnerActions";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { PAYMENT_KIND_LABEL, PAYMENT_METHOD_LABEL, ProofThumb } from "@/components/shared/Payments";
import { EmptyState, QueryView } from "@/components/shared/States";
import { PaymentStatusBadge } from "@/components/shared/StatusBadge";
import { DateText, MoneyText } from "@/components/shared/Text";
import { repos } from "@/lib/data";
import { useCustomerMap, useQuery } from "@/lib/data/hooks";
import { detailHref } from "@/lib/transactions/helpers";
import type { Payment, Transaction } from "@/types";

type Row = Payment & { tx: Transaction };

/** FR-18, FR-21 — verification queue and all payments. */
export default function PaymentsPage() {
  const q = useQuery("owner:all", () => repos.transactions.listAll());
  const { map: customers } = useCustomerMap();
  const [status, setStatus] = useState("all");

  const rows = useMemo<Row[]>(() => (q.data ?? []).flatMap((tx) => tx.payments.map((p) => ({ ...p, tx }))).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [q.data]);
  const pending = rows.filter((r) => r.status === "pending_verification");
  const filtered = status === "all" ? rows : rows.filter((r) => r.status === status);
  const totals = {
    verified: rows.filter((r) => r.status === "verified").reduce((s, r) => s + r.amount, 0),
    pending: pending.reduce((s, r) => s + r.amount, 0),
  };

  const columns: Column<Row>[] = [
    {
      key: "code",
      header: "Code",
      primary: true,
      cell: (r) => (
        <Link href={detailHref(r.tx.kind, r.tx.id, "owner")} className="font-mono text-sm text-gold-dark hover:underline" onClick={(e) => e.stopPropagation()}>
          {r.tx.code}
        </Link>
      ),
      sortValue: (r) => r.tx.code,
    },
    { key: "customer", header: "Customer", cell: (r) => customers[r.tx.customerId]?.fullName ?? "—", sortValue: (r) => customers[r.tx.customerId]?.fullName ?? "" },
    { key: "kind", header: "For", cell: (r) => PAYMENT_KIND_LABEL[r.kind] },
    { key: "amount", header: "Amount", cell: (r) => <MoneyText value={r.amount} exact />, sortValue: (r) => r.amount },
    { key: "ref", header: "Reference", cell: (r) => `${PAYMENT_METHOD_LABEL[r.method]} · ${r.referenceNumber}` },
    { key: "date", header: "Paid on", cell: (r) => <DateText value={r.paidOn} />, sortValue: (r) => r.paidOn },
    { key: "proof", header: "Proof", cell: (r) => (r.proofFile?.dataUrl ? <ProofThumb src={r.proofFile.dataUrl} name={r.proofFile.name} /> : <span className="text-muted-foreground">—</span>) },
    { key: "status", header: "Status", primary: true, cell: (r) => <PaymentStatusBadge status={r.status} /> },
  ];

  return (
    <>
      <PageHeader title="Payments" description="Check each payment against your GCash or bank records, then verify or reject it." />
      <QueryView query={q}>
        {() => (
          <Tabs defaultValue="queue">
            <TabsList>
              <TabsTrigger value="queue" className="min-h-9 px-3">
                To verify ({pending.length})
              </TabsTrigger>
              <TabsTrigger value="all" className="min-h-9 px-3">
                All payments
              </TabsTrigger>
            </TabsList>
            <TabsContent value="queue" className="mt-4">
              {pending.length === 0 ? (
                <EmptyState title="No payments to verify" description="New payment submissions will appear here." />
              ) : (
                <DataTable rows={pending} rowKey={(r) => r.id} columns={[...columns.filter((c) => c.key !== "status"), { key: "actions", header: "Action", cell: (r) => <VerifyButtons tx={r.tx} payment={r} /> }]} />
              )}
            </TabsContent>
            <TabsContent value="all" className="mt-4 space-y-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-paper p-4">
                  <dt className="text-sm text-muted-foreground">Total verified</dt>
                  <dd className="font-heading text-3xl font-semibold">
                    <MoneyText value={totals.verified} exact />
                  </dd>
                </div>
                <div className="rounded-xl border border-line bg-paper p-4">
                  <dt className="text-sm text-muted-foreground">Waiting for verification</dt>
                  <dd className="font-heading text-3xl font-semibold">
                    <MoneyText value={totals.pending} exact />
                  </dd>
                </div>
              </dl>
              <DataTable
                rows={filtered}
                rowKey={(r) => r.id}
                columns={columns}
                searchText={(r) => `${r.tx.code} ${r.referenceNumber} ${customers[r.tx.customerId]?.fullName ?? ""}`}
                searchPlaceholder="Search by code, reference, or customer"
                empty={{ title: "No payments yet" }}
                toolbar={
                  <div className="flex items-center gap-2">
                    <Label htmlFor="pay-status" className="text-sm">
                      Status
                    </Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="pay-status" className="w-52">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending_verification">Waiting for verification</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                }
              />
            </TabsContent>
          </Tabs>
        )}
      </QueryView>
    </>
  );
}
