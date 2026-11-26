"use client";

import { LoadingState } from "@/components/shared/States";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import { CustomerTransactionDetail } from "@/components/account/CustomerTransactionDetail";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return (
    <Suspense fallback={<LoadingState className="mx-auto max-w-3xl p-6" />}>
      <CustomerTransactionDetail kind="service" id={id} />
    </Suspense>
  );
}
