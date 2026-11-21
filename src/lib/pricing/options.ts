// Helpers for owner-configured options (FR-47).

import { UserFacingError } from "@/lib/data/repositories";
import type { CustomizationOptions } from "@/types";

export function activeOptions(o: CustomizationOptions): CustomizationOptions {
  return {
    productTypes: o.productTypes.filter((x) => x.active),
    materials: o.materials.filter((x) => x.active).map((m) => ({ ...m, finishIds: m.finishIds.filter((id) => o.finishes.some((f) => f.id === id && f.active)) })),
    finishes: o.finishes.filter((x) => x.active),
    gemstones: o.gemstones.filter((x) => x.active),
    cuts: o.cuts.filter((x) => x.active),
    sizes: o.sizes.filter((x) => x.active && o.productTypes.some((p) => p.type === x.productType && p.active)),
  };
}

/** FR-47 validation: at least one active option per category and one default size per active piece type. */
export function validateOptions(o: CustomizationOptions): void {
  const need = (list: { active: boolean }[], name: string) => {
    if (!list.some((x) => x.active)) throw new UserFacingError(`Keep at least one active ${name}.`);
  };
  need(o.productTypes, "piece type");
  need(o.materials, "material");
  need(o.finishes, "finish");
  need(o.gemstones, "gemstone option");
  need(o.cuts, "cut");
  const nums: [number, string][] = [
    ...o.productTypes.flatMap((p): [number, string][] => [[p.baseWeightG, `${p.label} base weight`], [p.laborFee, `${p.label} labor fee`], [p.maxStones, `${p.label} max stones`]]),
    ...o.materials.flatMap((m): [number, string][] => [[m.ratePerGram, `${m.label} rate per gram`], [m.densityRatio, `${m.label} density ratio`]]),
    ...o.finishes.map((f): [number, string] => [f.fee, `${f.label} fee`]),
    ...o.gemstones.map((g): [number, string] => [g.basePrice, `${g.label} price`]),
  ];
  for (const [v, label] of nums) if (!(v >= 0) || !Number.isFinite(v)) throw new UserFacingError(`${label} must be 0 or more.`);
  for (const p of o.productTypes) if (!(p.baseWeightG > 0)) throw new UserFacingError(`${p.label} base weight must be greater than 0.`);
  for (const m of o.materials) if (!(m.densityRatio > 0)) throw new UserFacingError(`${m.label} density ratio must be greater than 0.`);
  for (const c of o.cuts) if (!(c.multiplier > 0)) throw new UserFacingError(`${c.label} multiplier must be greater than 0.`);
  for (const s of o.sizes) if (!(s.factor > 0)) throw new UserFacingError(`Size ${s.label} factor must be greater than 0.`);
  for (const m of o.materials.filter((x) => x.active)) {
    if (!m.finishIds.some((id) => o.finishes.some((f) => f.id === id && f.active))) {
      throw new UserFacingError(`${m.label} needs at least one active finish.`);
    }
  }
  for (const p of o.productTypes.filter((x) => x.active)) {
    const sizes = o.sizes.filter((s) => s.productType === p.type && s.active);
    if (sizes.length === 0) throw new UserFacingError(`${p.label} needs at least one active size.`);
    if (sizes.filter((s) => s.isDefault).length !== 1) throw new UserFacingError(`Choose exactly one default size for ${p.label}.`);
  }
}
