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
    <article className="group">
      <div className="bg-grey-100">
        {show3d ? (
          <ProductModelView
            config={productDesign(product, options!)}
            options={options!}
            className="aspect-[4/5] w-full"
            label={`3D model of ${product.name}`}
          />
        ) : (
          <Link href={href} tabIndex={-1} aria-hidden>
            <StoredImage src={product.photos[0]} alt="" className="aspect-[4/5] w-full" />
          </Link>
        )}
      </div>
      <h3 className="mt-6 text-lg leading-6 font-semibold text-black">
        <Link href={href} className="underline-offset-4 hover:underline">
          {product.name}
        </Link>
      </h3>
      <p className="mt-0.5 text-[15px] text-grey-700">{product.material}</p>
      <p className="mt-2 flex flex-wrap items-center gap-3">
        <span className="text-lg">
          <MoneyText value={product.price} />
        </span>
        <AvailabilityBadge value={product.availability} />
      </p>
    </article>
  );
}
