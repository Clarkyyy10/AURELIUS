"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { CustomerTransactionDetail } from "@/components/account/CustomerTransactionDetail";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return (
    <Suspense>
      <CustomerTransactionDetail kind="service" id={id} />
    </Suspense>
  );
}
