"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/services/ServiceCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, QueryView } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { useQuery } from "@/lib/data/hooks";

/** FR-25 — service catalog. */
export default function ServicesPage() {
  const q = useQuery("services:visible", () => repos.catalog.listServices());
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <PageHeader
        title="Jewelry and watch services"
        description="Cleaning, repairs, resizing, and more — done by hand at our store in Montalban Public Market."
        actions={
          <Button asChild size="lg">
            <Link href="/services/request">Request a service</Link>
          </Button>
        }
      />
      <p className="mb-6 flex items-start gap-2 rounded-xl border border-info/30 bg-info/10 p-4 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden /> Prices depend on the item. The owner inspects your item and sends a quotation.
      </p>
      <QueryView
        query={q}
        loadingRows={3}
        empty={(l) => (l.length === 0 ? <EmptyState title="No services are listed right now" description="Please contact the store." /> : null)}
      >
        {(list) => (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((s) => (
              <li key={s.id}>
                <ServiceCard service={s} />
              </li>
            ))}
          </ul>
        )}
      </QueryView>
    </div>
  );
}
