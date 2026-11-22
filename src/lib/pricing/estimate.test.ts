import { describe, expect, it } from "vitest";
import { estimate, estimateWeightG, EstimateError } from "./estimate";
import { seedOptions } from "@/lib/data/seed/options";
import type { DesignConfig, ProductType } from "@/types";

const options = seedOptions();

const byLabel = <T extends { id: string; label: string }>(list: T[], label: string): string => {
  const found = list.find((x) => x.label === label);
  if (!found) throw new Error(`No option labelled ${label}`);
  return found.id;
};

function config(
  productType: ProductType,
  material: string,
  finish: string,
  size: string,
  gem: string = "None",
  cut: string | null = null,
  qty = 0,
): DesignConfig {
  const sizeOpt = options.sizes.find((s) => s.productType === productType && s.label === size);
  if (!sizeOpt) throw new Error(`No size ${size} for ${productType}`);
  return {
    productType,
    materialId: byLabel(options.materials, material),
    finishId: byLabel(options.finishes, finish),
    gemstoneId: byLabel(options.gemstones, gem),
    cutId: cut ? byLabel(options.cuts, cut) : null,
    stoneQuantity: qty,
    sizeId: sizeOpt.id,
  };
}

// [#, config, expected weight (g), expected price (₱)]
// Cases 1–6 are the required cases from docs/data-model.md §6.
// Cases 7–20 were computed by hand with the same formula and seed rates; together they cover every
// material, finish, gemstone, cut and size at least once (NFR: ≥ 20 configurations).
const cases: [number, DesignConfig, number, number][] = [
  [1, config("ring", "18K Gold", "Yellow", "US 7", "Diamond (lab-grown)", "Round", 1), 4.53, 24026],
  [2, config("ring", "Sterling Silver 925", "Polished", "US 9", "Cubic Zirconia", "Round", 3), 3.3, 2264],
  [3, config("necklace", "14K Gold", "Rose", "20 in"), 8.39, 30187],
  [4, config("bracelet", "Stainless Steel", "Black", "7.5 in"), 6.59, 1764],
  [5, config("pendant", "14K Gold", "White", "Large", "Sapphire (lab)", "Pear", 1), 3.15, 12475],
  [6, config("earrings", "Sterling Silver 925", "Polished", "Small", "Cubic Zirconia", "Princess", 2), 1.92, 1327],
  [7, config("ring", "18K Gold", "White", "US 5", "Ruby (lab)", "Oval", 2), 4.08, 20396],
  [8, config("ring", "14K Gold", "Rose", "US 6", "Emerald (lab)", "Round", 1), 3.59, 14847],
  [9, config("ring", "Sterling Silver 925", "Oxidized", "US 8"), 3.15, 1999],
  [10, config("ring", "Stainless Steel", "Gold tone", "US 10", "Cubic Zirconia", "Oval", 5), 2.66, 2731],
  [11, config("necklace", "18K Gold", "Yellow", "16 in"), 8.06, 35852],
  [12, config("necklace", "Sterling Silver 925", "Gold-plated", "18 in"), 6.0, 2920],
  [13, config("bracelet", "Stainless Steel", "Silver tone", "6.5 in"), 5.73, 1429],
  [14, config("bracelet", "18K Gold", "Rose", "7 in"), 12.08, 52436],
  [15, config("pendant", "18K Gold", "Yellow", "Small", "Diamond (lab-grown)", "Oval", 1), 2.42, 15014],
  [16, config("pendant", "Sterling Silver 925", "Polished", "Medium", "Ruby (lab)", "Princess", 3), 2.0, 3950],
  [17, config("earrings", "14K Gold", "Yellow", "Medium", "Emerald (lab)", "Pear", 2), 3.02, 13166],
  [18, config("earrings", "Stainless Steel", "Black", "Large"), 2.31, 1192],
  [19, config("ring", "18K Gold", "Rose", "US 7", "Sapphire (lab)", "Princess", 5), 4.53, 26201],
  [20, config("earrings", "Sterling Silver 925", "Oxidized", "Large", "Diamond (lab-grown)", "Round", 2), 3.0, 8285],
  // Name pendants (base 2.5 g, labor ₱1,800): 2.5 × 0.8 × 1.51 = 3.02 g → 3.02 × 4200 + 1800 = 14,484
  [21, { ...config("name_pendant", "18K Gold", "Yellow", "Small (10 mm letters)"), nameText: "Ana", fontId: "font-great-vibes" }, 3.02, 14484],
  // 2.5 × 1.0 × 1.00 = 2.50 g → 2.50 × 95 + 1800 = 2037.50 → 2,038 (half-up)
  [22, { ...config("name_pendant", "Sterling Silver 925", "Polished", "Medium (13 mm letters)"), nameText: "Niño", fontId: "font-playfair" }, 2.5, 2038],
  // 2.5 × 1.3 × 0.77 = 2.5025 → 2.50 g → 2.50 × 40 + 1800 + 300 = 2,200
  [23, { ...config("name_pendant", "Stainless Steel", "Gold tone", "Large (16 mm letters)"), nameText: "J & R", fontId: "font-montserrat" }, 2.5, 2200],
];

describe("estimate() — required and coverage cases", () => {
  it.each(cases)("case %i", (_n, cfg, weight, price) => {
    const result = estimate(cfg, options);
    expect(result.weightG).toBe(weight);
    expect(result.price).toBe(price);
  });

  it("covers every material, finish, gemstone, cut and size at least once", () => {
    const used = {
      materials: new Set(cases.map(([, c]) => c.materialId)),
      finishes: new Set(cases.map(([, c]) => c.finishId)),
      gemstones: new Set(cases.map(([, c]) => c.gemstoneId)),
      cuts: new Set(cases.map(([, c]) => c.cutId).filter(Boolean)),
      sizes: new Set(cases.map(([, c]) => c.sizeId)),
    };
    expect(used.materials.size).toBe(options.materials.length);
    expect(used.finishes.size).toBe(options.finishes.length);
    expect(used.gemstones.size).toBe(options.gemstones.length);
    expect(used.cuts.size).toBe(options.cuts.length);
    expect(used.sizes.size).toBe(options.sizes.length);
    expect(cases.length).toBeGreaterThanOrEqual(20);
  });
});

describe("estimate() — rounding and breakdown", () => {
  it("rounds weight half-up to 0.01 g", () => {
    expect(estimateWeightG(3, 1.15, 0.77)).toBe(2.66); // 2.6565
    expect(estimateWeightG(3, 0.9, 1.51)).toBe(4.08); // 4.077
    expect(estimateWeightG(6, 1.11, 1.26)).toBe(8.39); // 8.3916
    expect(estimateWeightG(0.5, 1, 1.01)).toBe(0.51); // 0.505 → half-up
  });

  it("rounds price half-up to the nearest peso using the rounded weight", () => {
    // 3.30 g × ₱95 = 313.50 → 313.5 + 450 + 1500 = 2263.5 → 2264
    expect(estimate(cases[1][1], options).price).toBe(2264);
  });

  it("returns a breakdown that adds up to the unrounded total", () => {
    const r = estimate(cases[0][1], options);
    expect(r.breakdown).toEqual({ metal: 19026, stones: 3500, labor: 1500, finish: 0 });
    const r2 = estimate(cases[1][1], options);
    expect(r2.breakdown.metal + r2.breakdown.stones + r2.breakdown.labor + r2.breakdown.finish).toBeCloseTo(2263.5, 6);
  });

  it("ignores cut and quantity when the gemstone is None", () => {
    const cfg = { ...config("ring", "18K Gold", "Yellow", "US 7"), cutId: "cut-pear", stoneQuantity: 4 };
    expect(estimate(cfg, options).breakdown.stones).toBe(0);
  });

  it("uses the owner's current rates (FR-47)", () => {
    const changed = seedOptions();
    changed.materials.find((m) => m.id === "mat-18k")!.ratePerGram = 4500;
    // 4.53 × 4500 = 20385 + 3500 + 1500 = 25385
    expect(estimate(cases[0][1], changed).price).toBe(25385);
  });
});

describe("estimate() — invalid selections", () => {
  it("rejects too many stones", () => {
    const cfg = config("pendant", "14K Gold", "White", "Large", "Ruby (lab)", "Round", 4);
    expect(() => estimate(cfg, options)).toThrow(EstimateError);
    expect(() => estimate(cfg, options)).toThrow("Choose between 1 and 3 stones.");
  });

  it("rejects stones on pieces that don't allow them", () => {
    const cfg = { ...config("necklace", "14K Gold", "Rose", "20 in"), gemstoneId: "gem-ruby", cutId: "cut-round", stoneQuantity: 1 };
    expect(() => estimate(cfg, options)).toThrow("Gemstones are not available for this piece.");
  });

  it("rejects a gemstone without a cut", () => {
    const cfg = { ...config("ring", "18K Gold", "Yellow", "US 7"), gemstoneId: "gem-ruby", stoneQuantity: 1 };
    expect(() => estimate(cfg, options)).toThrow("Choose a gemstone cut");
  });

  it("rejects a size from another piece type", () => {
    const cfg = { ...config("ring", "18K Gold", "Yellow", "US 7"), sizeId: "size-necklace-18in" };
    expect(() => estimate(cfg, options)).toThrow("doesn't match");
  });
});

describe("name pendants", () => {
  const named = (nameText: string, fontId: string | null = "font-great-vibes"): DesignConfig => ({
    productType: "name_pendant",
    materialId: "mat-14k",
    finishId: "fin-yellow",
    gemstoneId: "gem-none",
    cutId: null,
    stoneQuantity: 0,
    sizeId: "size-name_pendant-medium13mmletters",
    nameText,
    fontId,
  });

  it("uses the same formula: 2.5 g × 1.00 × 1.26 = 3.15 g; 3.15 × ₱3,300 + ₱1,800 labor = ₱12,195", () => {
    expect(estimate(named("Maria"), options)).toMatchObject({ weightG: 3.15, price: 12195 });
  });

  it("Large size raises the weight: 2.5 × 1.3 × 1.26 = 4.095 → 4.10 g", () => {
    expect(estimate({ ...named("Maria"), sizeId: "size-name_pendant-large16mmletters" }, options).weightG).toBe(4.1);
  });

  it("needs a valid name and font", () => {
    expect(() => estimate(named(""), options)).toThrow("Type the name for your pendant.");
    expect(() => estimate(named("Maximiliano Jr"), options)).toThrow("up to 10 characters");
    expect(() => estimate(named("Ana💖"), options)).toThrow("Use letters only");
    expect(() => estimate(named("Ana", "font-missing"), options)).toThrow("Choose a font");
    expect(estimate(named("Niño & Ía"), options).price).toBe(12195);
  });
});
