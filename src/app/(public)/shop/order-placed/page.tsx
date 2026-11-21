"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/shared/States";
import { CodeChip, MoneyText } from "@/components/shared/Text";
import { repos } from "@/lib/data";
import { useQuery } from "@/lib/data/hooks";

/** FR-14 success page with the order code and next steps. */
function OrderPlaced() {
  const id = useSearchParams().get("id") ?? "";
  const q = useQuery(`order:${id}`, () => repos.orders.get(id));
  if (q.error) return <ErrorState message={q.error} onRetry={q.reload} />;
  if (q.loading) return <LoadingState />;
  if (!q.data) return <ErrorState message="We couldn't find that order." />;
  const o = q.data;
  return (
    <div className="rounded-2xl border border-line bg-paper p-6 sm:p-10">
      <CheckCircle2 className="size-12 text-success" aria-hidden />
      <h1 className="mt-3 text-4xl">Thank you — your order was placed</h1>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
        Order code <CodeChip code={o.code} /> · {o.quantity} × {o.productSnapshot.name} (<MoneyText value={o.productSnapshot.price * o.quantity} />)
      </p>
      <h2 className="mt-8 text-2xl">What happens next</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        <li>The owner checks stock and sends you a quotation with the final price and any down payment.</li>
        <li>Accept the quotation and pay through GCash or bank transfer, then upload your receipt.</li>
        <li>When your item is ready, we&apos;ll notify you. Claim it at the store and settle any balance.</li>
      </ol>
      <div className="mt-8 flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/account/orders/${o.id}`}>View my order</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/shop">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}

export default function OrderPlacedPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Suspense fallback={<LoadingState />}>
        <OrderPlaced />
      </Suspense>
    </div>
  );
}
