"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TransactionTable } from "@/components/account/TransactionTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState, QueryView } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { useCustomerMap, useQuery, useServiceNames } from "@/lib/data/hooks";

function List() {
  const status = useSearchParams().get("status") ?? undefined;
  const q = useQuery("owner:order", async () => (await repos.transactions.listAll()).filter((t) => t.kind === "order"));
  const serviceNames = useServiceNames();
  const { map } = useCustomerMap();
  return (
    <>
      <PageHeader title="Orders" description="Quote orders, verify payments, and update status." />
      <QueryView query={q}>
        {(rows) => <TransactionTable key={status} rows={rows} kind="order" role="owner" serviceNames={serviceNames} customers={map} initialStatus={status} empty={{ title: "No Orders yet" }} />}
      </QueryView>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <List />
    </Suspense>
  );
}
