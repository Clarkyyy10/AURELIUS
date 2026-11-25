"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/shared/States";
import { CodeChip } from "@/components/shared/Text";
import { repos } from "@/lib/data";
import { useQuery } from "@/lib/data/hooks";
import { formatPeso } from "@/lib/utils/format";

const steps = [
  ["The owner reviews your design", "You'll get a notification if the owner asks for changes."],
  ["The owner confirms the price", "You'll receive a quotation with the final price, down payment, and completion date."],
  ["Pay the down payment", "Pay by GCash or bank transfer and upload your receipt in your account."],
  ["Claim in store", "We'll tell you when it's ready. Settle any balance when you pick it up."],
];

/** FR-07 success page after submitting a custom design. */
function Submitted() {
  const id = useSearchParams().get("id") ?? "";
  const q = useQuery(`co:${id}`, () => repos.customOrders.get(id));
  if (q.error) return <ErrorState message={q.error} onRetry={q.reload} />;
  if (q.loading) return <LoadingState />;
  const tx = q.data;
  if (!tx) return <ErrorState message="We couldn't find that request." />;
  const v = tx.versions[tx.versions.length - 1];

  return (
    <div className="rounded-lg border border-line bg-paper p-6 sm:p-10">
      <CheckCircle2 className="size-12 text-success" aria-hidden />
      <h1 className="mt-3 text-4xl">Your design was sent to the owner</h1>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
        Your request code is <CodeChip code={tx.code} />. Estimated price {formatPeso(v.estimate.price)} (estimate only).
      </p>
      <h2 className="mt-8 text-2xl">What happens next</h2>
      <ol className="mt-3 space-y-4">
        {steps.map(([t, d], i) => (
          <li key={t} className="flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/15 font-semibold text-gold-dark">{i + 1}</span>
            <span>
              <span className="block font-medium">{t}</span>
              <span className="block text-sm text-muted-foreground">{d}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-wrap gap-2">
        <Button asChild>
          <Link href={`/account/custom/${tx.id}`}>View my request</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/customize">Design another piece</Link>
        </Button>
      </div>
    </div>
  );
}

export default function SubmittedPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Suspense fallback={<LoadingState />}>
        <Submitted />
      </Suspense>
    </div>
  );
}
