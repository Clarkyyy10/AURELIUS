"use client";

import Link from "next/link";
import { ArrowRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, StoreContainer } from "@/components/shared/PageIntro";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/States";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DateText } from "@/components/shared/Text";
import { repos } from "@/lib/data";
import { useCurrentUser, useQuery, useServiceNames } from "@/lib/data/hooks";
import { customerActionNeeded, detailHref, KIND_LABEL, txTitle } from "@/lib/transactions/helpers";

/** FR-19, FR-23, FR-31 — one place to follow every order, custom design and service request. */
export default function TrackPage() {
  const { user, ready } = useCurrentUser();
  return (
    <StoreContainer className="lg:pt-24">
      <PageIntro
        title="Track your orders"
        lead="Every order, custom design and service request in your account, with its current step and what you need to do next."
      />
      {!ready ? <LoadingState rows={2} /> : !user ? <SignInPrompt /> : user.role === "owner" ? <OwnerNote /> : <TrackList userId={user.id} />}
    </StoreContainer>
  );
}

function SignInPrompt() {
  return (
    <section aria-labelledby="track-signin" className="max-w-[576px] border border-black p-6">
      <h2 id="track-signin" className="flex items-center gap-3 type-heading">
        <LogIn className="size-5" aria-hidden /> Sign in to continue
      </h2>
      <p className="mt-4 text-[17px] leading-7 text-grey-700">
        Sign in to see your orders, designs and service requests. If you ordered at the counter, ask the owner about your order.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button asChild className="rounded-none px-4">
          <Link href="/login?next=%2Ftrack">Sign in</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-none px-4">
          <Link href="/register?next=%2Ftrack">Create an account</Link>
        </Button>
      </div>
    </section>
  );
}

function OwnerNote() {
  return (
    <p className="max-w-[576px] border border-black p-6 text-[17px]">
      You are signed in as the owner. Every order is in the{" "}
      <Link href="/admin" className="underline underline-offset-4">
        owner dashboard
      </Link>
      .
    </p>
  );
}

function TrackList({ userId }: { userId: string }) {
  const q = useQuery(`my-transactions:${userId}`, () => repos.transactions.listAll());
  const serviceNames = useServiceNames();
  if (q.error) return <ErrorState message={q.error} onRetry={q.reload} />;
  if (q.loading || !q.data) return <LoadingState rows={3} />;
  const list = [...q.data].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (list.length === 0)
    return (
      <EmptyState
        title="You have no orders or requests yet"
        description="Order from the shop, design your own piece, or request a service."
        action={{ label: "Shop jewelry", href: "/shop" }}
      />
    );
  return (
    <ul className="max-w-3xl divide-y divide-grey-200 border-y border-grey-200">
      {list.map((tx) => {
        const next = customerActionNeeded(tx);
        return (
          <li key={tx.id}>
            <Link href={detailHref(tx.kind, tx.id, "customer")} className="group flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:gap-6">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-grey-700">
                  {KIND_LABEL[tx.kind]} · {tx.code} · Updated <DateText value={tx.updatedAt} relative />
                </p>
                <p className="mt-1 text-lg font-semibold group-hover:underline">{txTitle(tx, serviceNames)}</p>
                {next && <p className="mt-1 text-[15px] font-semibold">Next step: {next}</p>}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={tx.status} />
                <ArrowRight className="size-4" aria-hidden />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
