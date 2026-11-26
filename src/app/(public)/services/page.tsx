"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/services/ServiceCard";
import { PageIntro, StoreContainer } from "@/components/shared/PageIntro";
import { EmptyState, QueryView } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { useQuery } from "@/lib/data/hooks";

/** FR-25 — service catalog. */
export default function ServicesPage() {
  const q = useQuery("services:visible", () => repos.catalog.listServices());
  return (
    <StoreContainer className="lg:pt-10">
      <PageIntro title="Jewelry and watch services" lead="Prices depend on the item. The owner inspects your item at the counter and then sends the quotation.">
        <Button asChild size="lg" className="mt-10 rounded-none px-6">
          <Link href="/services/request">Request a service</Link>
        </Button>
      </PageIntro>
      <QueryView
        query={q}
        loadingRows={3}
        empty={(l) => (l.length === 0 ? <EmptyState title="No services are listed yet" description="Ask the store directly about your item." /> : null)}
      >
        {(list) => (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((s) => (
              <li key={s.id}>
                <ServiceCard service={s} />
              </li>
            ))}
          </ul>
        )}
      </QueryView>
    </StoreContainer>
  );
}
