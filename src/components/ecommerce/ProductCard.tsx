import Link from "next/link";
import { AvailabilityBadge } from "@/components/shared/StatusBadge";
import { StoredImage } from "@/components/shared/StoredImage";
import { MoneyText } from "@/components/shared/Text";
import type { Product } from "@/types";

/** FR-12 / FR-13 product card. */
export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/shop/${product.slug}`} className="group block overflow-hidden rounded-2xl border border-line bg-paper transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <StoredImage src={product.photos[0]} alt={product.name} className="size-full transition-transform duration-200 group-hover:scale-[1.03]" />
        <AvailabilityBadge value={product.availability} className="absolute top-3 left-3 bg-paper/95" />
      </div>
      <div className="p-4">
        <h3 className="font-sans text-base font-semibold text-ink">{product.name}</h3>
        <p className="text-sm text-muted-foreground">{product.material}</p>
        <p className="mt-1 font-heading text-xl font-semibold">
          <MoneyText value={product.price} />
        </p>
      </div>
    </Link>
  );
}
