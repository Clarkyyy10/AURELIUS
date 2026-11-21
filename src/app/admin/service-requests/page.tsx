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
  const q = useQuery("owner:service", async () => (await repos.transactions.listAll()).filter((t) => t.kind === "service"));
  const serviceNames = useServiceNames();
  const { map } = useCustomerMap();
  return (
    <>
      <PageHeader title="Service requests" description="Assess items, send quotations, record drop-offs, and update progress." />
      <QueryView query={q}>
        {(rows) => <TransactionTable key={status} rows={rows} kind="service" role="owner" serviceNames={serviceNames} customers={map} initialStatus={status} empty={{ title: "No Service requests yet" }} />}
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
