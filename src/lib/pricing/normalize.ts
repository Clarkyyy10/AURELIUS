// Keeps a design valid when the customer (or the owner's option changes) make a field invalid.
// FR-02: if the finish isn't allowed for the new material, pick that material's first finish.

import type { CustomizationOptions, DesignConfig, ProductType } from "@/types";
import { defaultConfig } from "./labels";
import { NAME_MAX } from "./name";

export interface NormalizeResult {
  config: DesignConfig;
  notices: string[];
}

export function normalizeConfig(input: Partial<DesignConfig> & { productType?: ProductType }, options: CustomizationOptions): NormalizeResult {
  const notices: string[] = [];
  const type = options.productTypes.find((p) => p.type === input.productType) ?? options.productTypes[0];
  const base = defaultConfig(type.type, options);
  const c: DesignConfig = { ...base, ...stripUndefined(input), productType: type.type };

  // Material
  const material = options.materials.find((m) => m.id === c.materialId) ?? options.materials.find((m) => m.id === base.materialId)!;
  if (material.id !== c.materialId && input.materialId) notices.push("That material is no longer available, so we picked the first one.");
  c.materialId = material.id;

  // Finish must be allowed for the material (FR-02)
  const allowed = material.finishIds.filter((id) => options.finishes.some((f) => f.id === id));
  if (!allowed.includes(c.finishId)) {
    const first = options.finishes.find((f) => f.id === allowed[0]);
    if (input.finishId) notices.push(`${material.label} isn't available in that finish, so we picked ${first?.label ?? "the first finish"}.`);
    c.finishId = allowed[0] ?? "";
  }

  // Size must belong to the piece type
  const sizes = options.sizes.filter((s) => s.productType === type.type);
  if (!sizes.some((s) => s.id === c.sizeId)) c.sizeId = base.sizeId;

  // Gemstones
  const gem = options.gemstones.find((g) => g.id === c.gemstoneId);
  const none = options.gemstones.find((g) => g.isNone);
  if (!gem) c.gemstoneId = none?.id ?? options.gemstones[0]?.id ?? "";
  const hasStone = Boolean(options.gemstones.find((g) => g.id === c.gemstoneId && !g.isNone));
  if (hasStone && type.maxStones === 0) {
    notices.push(`Gemstones are not available for a ${type.label.toLowerCase()}, so we removed the stone.`);
    c.gemstoneId = none?.id ?? c.gemstoneId;
  }
  const stoneNow = Boolean(options.gemstones.find((g) => g.id === c.gemstoneId && !g.isNone));
  if (stoneNow) {
    if (!c.cutId || !options.cuts.some((x) => x.id === c.cutId)) c.cutId = options.cuts[0]?.id ?? null;
    const qty = Math.round(c.stoneQuantity || 1);
    if (qty > type.maxStones) notices.push(`A ${type.label.toLowerCase()} can hold up to ${type.maxStones} stones, so we changed the quantity to ${type.maxStones}.`);
    c.stoneQuantity = Math.min(Math.max(qty, 1), type.maxStones);
  } else {
    c.cutId = null;
    c.stoneQuantity = 0;
  }

  // Name pendants: keep the name as typed (max 10) and make sure a font is chosen.
  if (type.type === "name_pendant") {
    const fonts = options.fonts ?? [];
    if (!fonts.some((x) => x.id === c.fontId)) c.fontId = fonts[0]?.id ?? null;
    c.nameText = (c.nameText ?? "").slice(0, NAME_MAX);
  } else {
    delete c.nameText;
    delete c.fontId;
  }

  if (c.engravingText) c.engravingText = c.engravingText.slice(0, 20);
  if (c.notes) c.notes = c.notes.slice(0, 500);
  return { config: c, notices };
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}
