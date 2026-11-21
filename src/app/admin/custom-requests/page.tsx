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
  const q = useQuery("owner:custom", async () => (await repos.transactions.listAll()).filter((t) => t.kind === "custom"));
  const serviceNames = useServiceNames();
  const { map } = useCustomerMap();
  return (
    <>
      <PageHeader title="Custom order requests" description="Review designs, ask for changes, approve, and send quotations." />
      <QueryView query={q}>
        {(rows) => <TransactionTable key={status} rows={rows} kind="custom" role="owner" serviceNames={serviceNames} customers={map} initialStatus={status} empty={{ title: "No Custom requests to review yet" }} />}
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
