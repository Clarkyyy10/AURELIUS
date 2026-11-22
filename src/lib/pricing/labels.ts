import type { CustomizationOptions, DesignConfig, DesignLabels, Product } from "@/types";
import { normalizeConfig } from "./normalize";

/** Human-readable labels for a design, captured when it is submitted. */
export function designLabels(config: DesignConfig, options: CustomizationOptions): DesignLabels {
  const gem = options.gemstones.find((g) => g.id === config.gemstoneId);
  const hasStone = Boolean(gem && !gem.isNone);
  return {
    productType: options.productTypes.find((p) => p.type === config.productType)?.label ?? config.productType,
    material: options.materials.find((m) => m.id === config.materialId)?.label ?? "—",
    finish: options.finishes.find((f) => f.id === config.finishId)?.label ?? "—",
    gemstone: hasStone ? `${gem!.label} × ${config.stoneQuantity}` : "None",
    cut: hasStone ? (options.cuts.find((c) => c.id === config.cutId)?.label ?? null) : null,
    size: options.sizes.find((s) => s.id === config.sizeId)?.label ?? "—",
  };
}

/** Default config for a piece type, using the first active options and the default size. */
export function defaultConfig(productType: DesignConfig["productType"], options: CustomizationOptions): DesignConfig {
  const material = options.materials.find((m) => m.active);
  const finishId = material?.finishIds.find((id) => options.finishes.find((f) => f.id === id && f.active)) ?? "";
  const none = options.gemstones.find((g) => g.isNone && g.active) ?? options.gemstones.find((g) => g.active);
  const sizes = options.sizes.filter((s) => s.productType === productType && s.active).sort((a, b) => a.sortOrder - b.sortOrder);
  const size = sizes.find((s) => s.isDefault) ?? sizes[0];
  return {
    productType,
    materialId: material?.id ?? "",
    finishId,
    gemstoneId: none?.id ?? "",
    cutId: null,
    stoneQuantity: 0,
    sizeId: size?.id ?? "",
  };
}

/** Field-by-field differences between two design versions (for the compare view). */
export function diffLabels(a: DesignLabels, b: DesignLabels): (keyof DesignLabels)[] {
  return (Object.keys(a) as (keyof DesignLabels)[]).filter((k) => a[k] !== b[k]);
}

/** Placeholder image for a design when no 3D snapshot could be taken (e.g. no WebGL). */
export function placeholderFor(config: DesignConfig): string {
  const tone = config.materialId === "mat-silver" || config.materialId === "mat-steel" ? "silver" : config.finishId === "fin-rose" ? "rose" : "gold";
  return `/placeholders/${config.productType}-${tone}.svg`;
}

/**
 * The 3D design for a catalog product: its saved design, else one derived from the category and the
 * material name (e.g. "18K Gold" → 18K gold, first allowed finish). Always valid for the options.
 */
export function productDesign(product: Product, options: CustomizationOptions): DesignConfig {
  const material = options.materials.find((m) => m.label.toLowerCase() === product.material.toLowerCase());
  return normalizeConfig({ productType: product.category, materialId: material?.id, ...product.design }, options).config;
}
