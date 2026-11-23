"use client";

import { LazyJewelryViewer } from "@/components/customization/LazyViewer";
import { useQuery } from "@/lib/data/hooks";
import { repos } from "@/lib/data";
import type { DesignConfig } from "@/types";

const HERO: DesignConfig = {
  productType: "ring",
  materialId: "mat-18k",
  finishId: "fin-yellow",
  gemstoneId: "gem-diamond",
  cutId: "cut-round",
  stoneQuantity: 1,
  sizeId: "size-ring-us7",
};

/** Slowly rotating ring for the home page (falls back to an illustration without WebGL). */
export function HomeHero() {
  const q = useQuery("options:active", () => repos.customization.getOptions());
  if (!q.data) return <div className="aspect-square w-full rounded-3xl bg-gradient-to-b from-[#FFFDF9] to-[#EFE7DA]" />;
  return (
    <LazyJewelryViewer
      config={HERO}
      options={q.data}
      showControls={false}
      className="aspect-square w-full rounded-3xl"
      label="A rotating 18K gold solitaire ring"
    />
  );
}
