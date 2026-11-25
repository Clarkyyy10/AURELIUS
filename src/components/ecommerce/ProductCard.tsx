"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useWebGL } from "@/components/customization/webgl";
import { AvailabilityBadge } from "@/components/shared/StatusBadge";
import { StoredImage } from "@/components/shared/StoredImage";
import { MoneyText } from "@/components/shared/Text";
import { productDesign } from "@/lib/pricing/labels";
import type { CustomizationOptions, Product } from "@/types";

const ProductModelView = dynamic(() => import("@/components/customization/SharedViews").then((m) => m.ProductModelView), {
  ssr: false,
  loading: () => <div className="aspect-square animate-pulse bg-grey-100" />,
});

/** Render once on any page that shows product cards with 3D previews. */
export const SharedViewCanvas = dynamic(() => import("@/components/customization/SharedViews").then((m) => m.SharedViewCanvas), { ssr: false });

/**
 * FR-12 / FR-13 product card with a live 3D model (drag to rotate, zoom after a click/tap).
 * Falls back to the product photo when 3D isn't available or the options haven't loaded yet.
 */
export function ProductCard({ product, options }: { product: Product; options?: CustomizationOptions }) {
  const webgl = useWebGL();
  const href = `/shop/${product.slug}`;
  const show3d = Boolean(webgl && options && options.productTypes.some((p) => p.type === product.category));

  return (
    <article className="group overflow-hidden rounded-lg border border-line bg-paper transition-shadow hover:shadow-md">
      <div className="relative">
        {show3d ? (
          <ProductModelView
            config={productDesign(product, options!)}
            options={options!}
            className="aspect-square w-full"
            label={`3D model of ${product.name}`}
          />
        ) : (
          <Link href={href} tabIndex={-1} aria-hidden>
            <StoredImage src={product.photos[0]} alt="" className="aspect-square w-full" />
          </Link>
        )}
        <AvailabilityBadge value={product.availability} className="pointer-events-none absolute top-3 left-3 bg-paper/95" />
      </div>
      <Link href={href} className="block p-4">
        <h3 className="font-sans text-base font-semibold text-ink group-hover:underline">{product.name}</h3>
        <p className="text-sm text-muted-foreground">{product.material}</p>
        <p className="mt-1 flex items-baseline justify-between gap-2">
          <span className="font-heading text-xl font-semibold">
            <MoneyText value={product.price} />
          </span>
          <span className="text-sm text-gold-dark">View details →</span>
        </p>
      </Link>
    </article>
  );
}
