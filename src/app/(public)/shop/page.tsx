"use client";

import { LoadingState } from "@/components/shared/States";
import { Suspense, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { ProductCard, SharedViewCanvas } from "@/components/ecommerce/ProductCard";
import { PageIntro, StoreContainer } from "@/components/shared/PageIntro";
import { cn } from "@/lib/utils";
import { EmptyState, QueryView } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { useQuery } from "@/lib/data/hooks";
import type { ProductFilter } from "@/lib/data/repositories";
import { PRODUCT_TYPES } from "@/types";

const CATEGORY_LABEL: Record<string, string> = {
  ring: "Rings",
  pendant: "Pendants",
  name_pendant: "Name pendants",
  necklace: "Necklaces",
  bracelet: "Bracelets",
  earrings: "Earrings",
};
const ALL = "all";

/** FR-12 / FR-13 — catalog with filters synced to the URL. */
function Shop() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filter: ProductFilter = {
    category: params.get("category") ?? undefined,
    material: params.get("material") ?? undefined,
    availability: params.get("availability") ?? undefined,
    minPrice: params.get("min") ? Number(params.get("min")) : undefined,
    maxPrice: params.get("max") ? Number(params.get("max")) : undefined,
    search: params.get("q") ?? undefined,
    sort: (params.get("sort") as ProductFilter["sort"]) ?? "newest",
  };

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (!value || value === ALL) next.delete(key);
    else next.set(key, value);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const q = useQuery(`products:${params.toString()}`, () => repos.catalog.listProducts(filter));
  const allQ = useQuery("products:all", () => repos.catalog.listProducts());
  const optionsQ = useQuery("options:active", () => repos.customization.getOptions());
  const materials = useMemo(() => [...new Set((allQ.data ?? []).map((p) => p.material))].sort(), [allQ.data]);
  const active = ["category", "material", "availability", "min", "max", "q"].some((k) => params.get(k));

  const toggle = (key: string, value: string) => set(key, params.get(key) === value ? null : value);
  const count = q.data?.length;

  return (
    <StoreContainer>
      <SharedViewCanvas />
      <PageIntro title="Shop jewelry" lead="Every piece shows its price and whether it is in stock. Pieces made to order are made in your size." />

      <section aria-label="Filters" className="mt-14 flex flex-wrap gap-x-12 gap-y-6 border-y border-grey-200 py-8">
        <ChipGroup
          label="Type"
          value={filter.category}
          onToggle={(v) => toggle("category", v)}
          options={PRODUCT_TYPES.filter((t) => (allQ.data ?? []).some((p) => p.category === t)).map((t) => [t, CATEGORY_LABEL[t] ?? t])}
        />
        <ChipGroup
          label="Availability"
          value={filter.availability}
          onToggle={(v) => toggle("availability", v)}
          options={[
            ["available", "Available"],
            ["made_to_order", "Made to order"],
            ["unavailable", "Unavailable"],
          ]}
        />
        <ChipGroup label="Material" value={filter.material} onToggle={(v) => toggle("material", v)} options={materials.map((m) => [m, m])} />
      </section>

      <div className="mt-12 mb-14 flex min-h-6 items-center gap-4 text-[15px] text-grey-700" aria-live="polite">
        {count !== undefined && <span>{count === 1 ? "1 piece" : `${count} pieces`}</span>}
        {active && (
          <button type="button" className="text-black underline underline-offset-4" onClick={() => router.replace(pathname, { scroll: false })}>
            Clear filters
          </button>
        )}
      </div>

      <QueryView
        query={q}
        loadingRows={4}
        empty={(list) =>
          list.length === 0 ? (
            <EmptyState
              title={active ? "No products match these filters" : "No products yet"}
              description={active ? "Remove a filter to see more pieces, or design your own." : "Design your own piece while the store adds products."}
              action={
                active
                  ? { label: "Clear filters", onClick: () => router.replace(pathname, { scroll: false }) }
                  : { label: "Design your own", href: "/customize" }
              }
            />
          ) : null
        }
      >
        {(list) => (
          <ul className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} options={optionsQ.data} />
              </li>
            ))}
          </ul>
        )}
      </QueryView>
    </StoreContainer>
  );
}

/** A row of toggle buttons; the pressed one has a 2 px black border and a check (DESIGN.md §11). */
function ChipGroup({ label, value, onToggle, options }: { label: string; value?: string; onToggle: (v: string) => void; options: [string, string][] }) {
  if (options.length === 0) return null;
  return (
    <div role="group" aria-labelledby={`chips-${label}`}>
      <p id={`chips-${label}`} className="mb-3 text-[15px] font-semibold">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, l]) => {
          const on = value === v;
          return (
            <button
              key={v}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(v)}
              className={cn(
                "flex min-h-11 items-center gap-1.5 rounded-none border bg-white px-4 text-[15px] font-medium transition-colors hover:bg-grey-50",
                on ? "border-2 border-black px-[15px]" : "border-grey-500",
              )}
            >
              {l}
              {on && <Check className="size-4" aria-hidden />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
export default function ShopPage() {
  return (
    <Suspense fallback={<LoadingState className="mx-auto max-w-3xl p-6" />}>
      <Shop />
    </Suspense>
  );
}
