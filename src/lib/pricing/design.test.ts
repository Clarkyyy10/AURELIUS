import { describe, expect, it } from "vitest";
import { estimate } from "./estimate";
import { normalizeConfig } from "./normalize";
import { applyChange, optionsFor, stoneRule, styleTextProblem, usesChain } from "./design";
import { seedOptions } from "@/lib/data/seed/options";
import type { DesignConfig, DesignOption, ProductType } from "@/types";

const options = seedOptions();
const round = (x: number, d: number) => Math.round((x + Number.EPSILON) * 10 ** d) / 10 ** d;

/** Independent reference: plain decimal arithmetic with half-up rounding (how the owner computes by hand). */
function reference(base: number, factors: number[], rate: number, extras: number) {
  const raw = factors.reduce((a, f) => a * f, base);
  const weight = round(Number(raw.toFixed(8)), 2);
  return { weight, price: round(Number((weight * rate + extras).toFixed(6)), 0) };
}

const faceted = options.gemstones.filter((g) => !g.isNone && g.surface !== "pearl");
const pearl = options.gemstones.find((g) => g.surface === "pearl")!;

/** A valid design that uses one design option, cycling materials, gems, cuts and sizes. */
function caseFor(opt: DesignOption, type: ProductType, i: number) {
  const material = options.materials[i % options.materials.length];
  const finish = options.finishes.find((f) => f.id === material.finishIds[i % material.finishIds.length])!;
  const sizes = options.sizes.filter((s) => s.productType === type);
  const size = sizes[i % sizes.length];
  const pt = options.productTypes.find((p) => p.type === type)!;
  const cfg: DesignConfig = { productType: type, materialId: material.id, finishId: finish.id, sizeId: size.id, gemstoneId: "gem-none", cutId: null, stoneQuantity: 0, choices: { [opt.group]: opt.id } };
  const rule = stoneRule(cfg, options);
  // settings only count with stones, so give those a stone
  const wantStone = rule.max > 0 && (rule.min > 0 || opt.group === "setting" || i % 2 === 0);
  let stones = 0;
  if (wantStone) {
    const gem = opt.requiresSurface === "pearl" ? pearl : faceted[i % faceted.length];
    const cut = options.cuts[i % options.cuts.length];
    cfg.gemstoneId = gem.id;
    cfg.cutId = cut.id;
    cfg.stoneQuantity = Math.max(1, rule.default, rule.min);
    stones = gem.basePrice * cut.multiplier * cfg.stoneQuantity;
  }
  if (opt.textMax) cfg.styleText = opt.key === "zodiac" ? "Leo" : "AB".slice(0, opt.textMax);
  if (type === "name_pendant") {
    cfg.nameText = "Ana";
    cfg.fontId = options.fonts[0].id;
  }
  const factors = [size.factor, material.densityRatio];
  let extras = pt.laborFee + finish.fee + stones;
  if (usesChain(cfg, options) && opt.group === "style") {
    const chain = options.chainStyles[i % options.chainStyles.length];
    const clasp = options.clasps[i % options.clasps.length];
    cfg.chainStyleId = chain.id;
    cfg.claspId = clasp.id;
    factors.push(chain.weightFactor);
    extras += clasp.fee;
  }
  const counts = opt.group !== "setting" || cfg.stoneQuantity > 0;
  if (counts) {
    factors.push(opt.weightFactor);
    extras += opt.fee;
  }
  return { cfg, expected: reference(pt.baseWeightG, factors, material.ratePerGram, extras) };
}

// Every stone (birthstones included) on a birthstone pendant, medium size, 14K gold, round cut.
const birthstoneCases = options.gemstones
  .filter((g) => !g.isNone)
  .map((g) => [g.label, { productType: "pendant", materialId: "mat-14k", finishId: "fin-yellow", sizeId: "size-pendant-medium", gemstoneId: g.id, cutId: "cut-round", stoneQuantity: 1, choices: { style: "style-pendant-birthstone" } } as DesignConfig, g.basePrice] as const);

const designCases = options.designOptions.flatMap((opt, i) => opt.productTypes.map((type, j) => [`${opt.label} (${type})`, opt, type, i + j] as const));

describe("design options (D-25) — every style, setting, band shape, shank and texture", () => {
  it.each(designCases)("%s matches the hand formula", (_label, opt, type, i) => {
    const { cfg, expected } = caseFor(opt, type, i);
    const r = estimate(cfg, options);
    expect(r.weightG).toBe(expected.weight);
    expect(r.price).toBe(expected.price);
    expect(r.breakdown.design).toBe(opt.group !== "setting" || cfg.stoneQuantity > 0 ? opt.fee : 0);
    // a normalized copy keeps the same choice
    expect(normalizeConfig(cfg, options).config.choices?.[opt.group]).toBe(opt.id);
  });

  it("covers every gemstone, cut and size together with the other estimate tests", () => {
    const cfgs = designCases.map(([, opt, type, i]) => caseFor(opt, type, i).cfg);
    const gems = new Set([...cfgs, ...birthstoneCases.map(([, c]) => c)].map((c) => c.gemstoneId).filter((g) => g !== "gem-none"));
    expect(gems.size).toBe(options.gemstones.filter((g) => !g.isNone).length);
    expect(new Set(cfgs.map((c) => c.cutId).filter(Boolean)).size).toBe(options.cuts.length);
    const anklet = new Set(cfgs.filter((c) => c.productType === "anklet" || c.productType === "toe_ring").map((c) => c.sizeId));
    expect(anklet.size).toBe(options.sizes.filter((s) => s.productType === "anklet" || s.productType === "toe_ring").length);
  });

  it.each(birthstoneCases)("%s birthstone pendant matches the hand formula", (_label, cfg, gemPrice) => {
    // 2 g × 1.0 (Medium) × 1.26 (14K) × 0.8 (birthstone) → ₱3,300/g + stone + ₱1,000 labor
    const expected = reference(2, [1, 1.26, 0.8], 3300, gemPrice + 1000);
    const r = estimate(cfg, options);
    expect(r.weightG).toBe(expected.weight);
    expect(r.price).toBe(expected.price);
  });

  it("multiplies several design factors and adds their fees", () => {
    // 3 × 1.0 (US 7) × 1.51 (18K) × 1.15 (halo) × 1.15 (split) × 0.9 (knife edge) = 5.3891… → 5.39 g
    const cfg: DesignConfig = {
      productType: "ring", materialId: "mat-18k", finishId: "fin-yellow", sizeId: options.sizes.find((s) => s.productType === "ring" && s.label === "US 7")!.id,
      gemstoneId: "gem-diamond", cutId: "cut-round", stoneQuantity: 1,
      choices: { style: "style-ring-halo", setting: "setting-all-prong", profile: "profile-ring-knife_edge", shank: "shank-ring-split", texture: "texture-all-hammered" },
    };
    const r = estimate(cfg, options);
    expect(r.weightG).toBe(5.39);
    // 5.39 × 4200 + 3500 (diamond) + 1500 labor + 1800 halo + 200 knife edge + 700 split + 400 hammered
    expect(r.price).toBe(Math.round(5.39 * 4200) + 3500 + 1500 + 1800 + 200 + 700 + 400);
    expect(r.breakdown.design).toBe(3100);
  });
});

describe("stone rules per style", () => {
  const ring = (style: string, extra: Partial<DesignConfig> = {}): DesignConfig => ({
    productType: "ring", materialId: "mat-14k", finishId: "fin-yellow", sizeId: options.sizes.find((s) => s.productType === "ring")!.id, gemstoneId: "gem-cz", cutId: "cut-round", stoneQuantity: 1, choices: { style }, ...extra,
  });

  it("three-stone always has exactly 3 stones", () => {
    const n = normalizeConfig(ring("style-ring-three_stone", { stoneQuantity: 5 }), options).config;
    expect(n.stoneQuantity).toBe(3);
    expect(() => estimate({ ...n, stoneQuantity: 2 }, options)).toThrow("exactly 3 stones");
  });

  it("an eternity band takes 8 to 24 stones", () => {
    expect(normalizeConfig(ring("style-ring-eternity", { stoneQuantity: 2 }), options).config.stoneQuantity).toBe(8);
    expect(normalizeConfig(ring("style-ring-eternity", { stoneQuantity: 40 }), options).config.stoneQuantity).toBe(24);
  });

  it("styles that need a stone pick one with a notice", () => {
    const r = normalizeConfig(ring("style-ring-solitaire", { gemstoneId: "gem-none" }), options);
    expect(r.config.gemstoneId).not.toBe("gem-none");
    expect(r.notices.join(" ")).toMatch(/needs a stone/);
    expect(() => estimate(ring("style-ring-solitaire", { gemstoneId: "gem-none", stoneQuantity: 0, cutId: null }), options)).toThrow("needs a gemstone");
  });

  it("a pearl strand always uses pearls", () => {
    const r = normalizeConfig({ productType: "necklace", gemstoneId: "gem-ruby", choices: { style: "style-necklace-pearl_strand" } }, options);
    expect(r.config.gemstoneId).toBe("gem-pearl");
    expect(r.config.stoneQuantity).toBe(45);
    expect(() => estimate({ ...r.config, gemstoneId: "gem-ruby" }, options)).toThrow("needs pearls");
  });

  it("a setting adds nothing when there are no stones", () => {
    const base = normalizeConfig(ring("style-ring-signet", { gemstoneId: "gem-none", styleText: "JA" }), options).config;
    const a = estimate({ ...base, choices: { ...base.choices, setting: "setting-ring-tension" } }, options);
    const b = estimate({ ...base, choices: { ...base.choices, setting: "setting-all-prong" } }, options);
    expect(a.price).toBe(b.price);
  });

  it("refuses an option that does not belong to the piece type", () => {
    expect(() => estimate(ring("style-earrings-hoop"), options)).toThrow("Choose a style");
  });
});

describe("style text", () => {
  const style = (key: string) => options.designOptions.find((o) => o.group === "style" && o.key === key)!;
  it("checks zodiac signs, required initials and length", () => {
    expect(styleTextProblem(style("zodiac"), "Leo")).toBeNull();
    expect(styleTextProblem(style("zodiac"), "Dragon")).toMatch(/zodiac/);
    expect(styleTextProblem(style("initial"), "")).toMatch(/initial/);
    expect(styleTextProblem(style("initial"), "ABC")).toMatch(/up to 2/);
    expect(styleTextProblem(style("signet"), "")).toBeNull();
    expect(styleTextProblem(style("bar"), "Niño 2026")).toBeNull();
    expect(styleTextProblem(style("bar"), "<b>")).toMatch(/letters and numbers/);
  });

  it("defaults the zodiac sign and trims text to the limit", () => {
    const z = normalizeConfig({ productType: "pendant", choices: { style: "style-pendant-zodiac" } }, options).config;
    expect(z.styleText).toBe("Aries");
    const s = normalizeConfig({ productType: "ring", choices: { style: "style-ring-signet" }, styleText: "ABCDEF" }, options).config;
    expect(s.styleText).toBe("ABC");
  });
});

describe("applyChange", () => {
  const base = normalizeConfig({ productType: "ring" }, options).config;

  it("choosing a stone on a plain band switches to a style that holds one", () => {
    const next = normalizeConfig(applyChange(base, { gemstoneId: "gem-ruby" }, options), options).config;
    expect(next.choices?.style).toBe("style-ring-solitaire");
    expect(next.gemstoneId).toBe("gem-ruby");
    expect(next.stoneQuantity).toBe(1);
  });

  it("a new style starts with its usual number of stones", () => {
    const sol = normalizeConfig(applyChange(base, { gemstoneId: "gem-ruby" }, options), options).config;
    const eternity = normalizeConfig(applyChange(sol, { choices: { ...sol.choices, style: "style-ring-eternity" } }, options), options).config;
    expect(eternity.stoneQuantity).toBe(16);
  });

  it("a new piece type starts from its own default choices", () => {
    const next = normalizeConfig(applyChange(base, { productType: "earrings" }, options), options).config;
    expect(next.choices?.style).toBe("style-earrings-stud");
    expect(next.choices?.profile).toBeUndefined();
  });

  it("every piece type has a style list", () => {
    for (const pt of options.productTypes.filter((p) => p.type !== "name_pendant")) expect(optionsFor(options, pt.type, "style").length).toBeGreaterThan(0);
  });
});
