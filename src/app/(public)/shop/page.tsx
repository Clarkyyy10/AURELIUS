"use client";

import { LoadingState } from "@/components/shared/States";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductCard, SharedViewCanvas } from "@/components/ecommerce/ProductCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, QueryView } from "@/components/shared/States";
import { repos } from "@/lib/data";
import { useQuery } from "@/lib/data/hooks";
import type { ProductFilter } from "@/lib/data/repositories";
import { PRODUCT_TYPES } from "@/types";

const CATEGORY_LABEL: Record<string, string> = { ring: "Rings", pendant: "Pendants", name_pendant: "Name pendants", necklace: "Necklaces", bracelet: "Bracelets", earrings: "Earrings" };
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <SharedViewCanvas />
      <PageHeader title="Shop the collection" description="Ready-made pieces and made-to-order designs from Afable's Jewelry Store." />

      <div className="mb-6 grid gap-3 rounded-2xl border border-line bg-paper p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1.2fr]">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="shop-search">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="shop-search" defaultValue={filter.search} placeholder="Search by name" className="pl-9" onChange={(e) => set("q", e.target.value || null)} />
          </div>
        </div>
        <FilterSelect label="Category" value={filter.category} onChange={(v) => set("category", v)} options={PRODUCT_TYPES.map((t) => [t, CATEGORY_LABEL[t]])} />
        <FilterSelect label="Material" value={filter.material} onChange={(v) => set("material", v)} options={materials.map((m) => [m, m])} />
        <FilterSelect
          label="Availability"
          value={filter.availability}
          onChange={(v) => set("availability", v)}
          options={[
            ["available", "Available"],
            ["made_to_order", "Made to order"],
            ["unavailable", "Unavailable"],
          ]}
        />
        <div className="space-y-1.5">
          <Label htmlFor="min-price">Min ₱</Label>
          <Input id="min-price" type="number" min={0} inputMode="numeric" defaultValue={params.get("min") ?? ""} onChange={(e) => set("min", e.target.value || null)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="max-price">Max ₱</Label>
          <Input id="max-price" type="number" min={0} inputMode="numeric" defaultValue={params.get("max") ?? ""} onChange={(e) => set("max", e.target.value || null)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sort">Sort by</Label>
          <Select value={filter.sort} onValueChange={(v) => set("sort", v === "newest" ? null : v)}>
            <SelectTrigger id="sort" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price_asc">Price: low to high</SelectItem>
              <SelectItem value="price_desc">Price: high to low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {active && (
          <div className="sm:col-span-2 lg:col-span-7">
            <Button variant="link" className="px-0" onClick={() => router.replace(pathname, { scroll: false })}>
              <X className="size-4" /> Clear all filters
            </Button>
          </div>
        )}
      </div>

      <QueryView
        query={q}
        loadingRows={4}
        empty={(list) =>
          list.length === 0 ? (
            <EmptyState title="No products match your filters" description="Try removing a filter, or design your own piece." action={{ label: "Design your own", href: "/customize" }} />
          ) : null
        }
      >
        {(list) => (
          <ul className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.slice(0, 5).map((p) => (
              <li key={p.id}>
                <ProductCard product={p} options={optionsQ.data} />
              </li>
            ))}
            <li>
              <DesignYourOwnCard />
            </li>
            {list.slice(5).map((p) => (
              <li key={p.id}>
                <ProductCard product={p} options={optionsQ.data} />
              </li>
            ))}
          </ul>
        )}
      </QueryView>
    </div>
  );
}

function DesignYourOwnCard() {
  return (
    <Link href="/customize" className="flex h-full min-h-56 flex-col justify-between gap-4 rounded-2xl bg-emerald p-6 text-ivory hover:opacity-95">
      <Sparkles className="size-7 text-gold" aria-hidden />
      <div>
        <p className="font-heading text-2xl">Can&apos;t find it?</p>
        <p className="mt-1 text-ivory/80">Design your own in 3D and the owner will confirm the price.</p>
      </div>
      <span className="font-medium text-gold underline underline-offset-4">Design your own →</span>
    </Link>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value?: string; onChange: (v: string) => void; options: [string, string][] }) {
  const id = `filter-${label.toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value ?? ALL} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
