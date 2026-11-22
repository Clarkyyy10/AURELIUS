// Keeps a design valid when the customer (or the owner's option changes) make a field invalid.
// FR-02: if the finish isn't allowed for the new material, pick that material's first finish.

import type { CustomizationOptions, DesignConfig, ProductType } from "@/types";
import { defaultConfig } from "./labels";
import { NAME_MAX } from "./name";
import { optionsFor, stoneRule, styleOf, usesChain } from "./design";
import { ZODIAC_SIGNS } from "@/lib/data/seed/designs";
import { OPTION_GROUPS, type OptionGroup } from "@/types";

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

  // Design options (D-25): one choice per group that applies to this piece; the first active one by default.
  const choices: Partial<Record<OptionGroup, string>> = {};
  for (const group of OPTION_GROUPS) {
    const list = optionsFor(options, type.type, group);
    if (list.length === 0) continue;
    if (list.some((o) => o.id === c.choices?.[group])) {
      choices[group] = c.choices![group];
      continue;
    }
    // No style yet but a stone was chosen (e.g. an older design or a chatbot draft): start from the
    // first style that holds a stone, so the stone is kept.
    const wantsStone = options.gemstones.some((g) => g.id === c.gemstoneId && !g.isNone);
    const holdsStone = (o: (typeof list)[number]) => (o.stones ? o.stones.max > 0 : type.maxStones > 0) && !o.requiresSurface;
    choices[group] = (group === "style" && wantsStone ? list.find(holdsStone) : undefined)?.id ?? list[0].id;
  }
  if (Object.keys(choices).length) c.choices = choices;
  else delete c.choices;
  const style = styleOf(c, options);

  // Gemstones follow the style's stone rule (e.g. three-stone = exactly 3, plain band = none).
  const rule = stoneRule(c, options);
  const none = options.gemstones.find((g) => g.isNone);
  if (!options.gemstones.some((g) => g.id === c.gemstoneId)) c.gemstoneId = none?.id ?? options.gemstones[0]?.id ?? "";
  let gem = options.gemstones.find((g) => g.id === c.gemstoneId);
  if (gem && !gem.isNone && rule.max === 0) {
    notices.push(style ? `The ${style.label} style has no stones, so we removed the stone.` : `Gemstones are not available for a ${type.label.toLowerCase()}, so we removed the stone.`);
    c.gemstoneId = none?.id ?? c.gemstoneId;
  }
  gem = options.gemstones.find((g) => g.id === c.gemstoneId);
  const needsPearl = style?.requiresSurface === "pearl";
  if (needsPearl && gem?.surface !== "pearl") {
    const pearl = options.gemstones.find((g) => g.surface === "pearl");
    if (pearl) {
      if (gem && !gem.isNone) notices.push(`The ${style!.label} style uses pearls, so we changed the stone to ${pearl.label}.`);
      c.gemstoneId = pearl.id;
    }
  } else if ((!gem || gem.isNone) && rule.min > 0) {
    const first = options.gemstones.find((g) => !g.isNone && g.surface !== "pearl");
    if (first) {
      notices.push(`The ${style?.label ?? "chosen"} style needs a stone, so we picked ${first.label}. Choose any stone you like.`);
      c.gemstoneId = first.id;
    }
  }
  const stoneNow = Boolean(options.gemstones.find((g) => g.id === c.gemstoneId && !g.isNone));
  if (stoneNow) {
    if (!c.cutId || !options.cuts.some((x) => x.id === c.cutId)) c.cutId = options.cuts[0]?.id ?? null;
    const lo = Math.max(1, rule.min);
    const wanted = Math.round(c.stoneQuantity || rule.default || 1);
    if (wanted > rule.max && rule.min !== rule.max) notices.push(`${style ? `The ${style.label} style` : `A ${type.label.toLowerCase()}`} can hold up to ${rule.max} stones, so we changed the quantity to ${rule.max}.`);
    c.stoneQuantity = Math.min(Math.max(wanted, lo), rule.max);
  } else {
    c.cutId = null;
    c.stoneQuantity = 0;
  }

  // Short text for styles that need it (initial, zodiac sign, ID plate).
  if (style?.textMax) {
    c.styleText = (c.styleText ?? (style.key === "zodiac" ? ZODIAC_SIGNS[0] : "")).slice(0, style.textMax);
  } else delete c.styleText;

  // Name pendants: keep the name as typed (max 10) and make sure a font is chosen.
  if (type.type === "name_pendant") {
    const fonts = options.fonts ?? [];
    if (!fonts.some((x) => x.id === c.fontId)) c.fontId = fonts[0]?.id ?? null;
    c.nameText = (c.nameText ?? "").slice(0, NAME_MAX);
  } else {
    delete c.nameText;
    delete c.fontId;
  }

  // Chain style and clasp whenever the design uses a chain (necklaces, chain bracelets, anklets…).
  if (usesChain(c, options)) {
    const chains = options.chainStyles ?? [];
    const clasps = options.clasps ?? [];
    if (!chains.some((x) => x.id === c.chainStyleId)) c.chainStyleId = chains[0]?.id ?? null;
    if (!clasps.some((x) => x.id === c.claspId)) c.claspId = clasps[0]?.id ?? null;
  } else {
    delete c.chainStyleId;
    delete c.claspId;
  }

  if (c.engravingText) c.engravingText = c.engravingText.slice(0, 20);
  if (c.notes) c.notes = c.notes.slice(0, 500);
  return { config: c, notices };
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}
