import { describe, expect, it } from "vitest";
import { normalizeConfig } from "./normalize";
import { estimate } from "./estimate";
import { seedOptions } from "@/lib/data/seed/options";

const options = seedOptions();

describe("normalizeConfig", () => {
  it("fills a full default design for a piece type", () => {
    const { config, notices } = normalizeConfig({ productType: "ring" }, options);
    expect(config).toMatchObject({ materialId: "mat-18k", finishId: "fin-yellow", gemstoneId: "gem-none", cutId: null, stoneQuantity: 0, sizeId: "size-ring-us7" });
    expect(notices).toEqual([]);
    expect(() => estimate(config, options)).not.toThrow();
  });

  it("picks the material's first finish when the finish isn't allowed (FR-02)", () => {
    const { config, notices } = normalizeConfig({ productType: "ring", materialId: "mat-silver", finishId: "fin-rose" }, options);
    expect(config.finishId).toBe("fin-polished");
    expect(notices[0]).toMatch(/picked Polished/);
  });

  it("removes stones from styles that can't hold them (D-25)", () => {
    const { config, notices } = normalizeConfig({ productType: "necklace", gemstoneId: "gem-ruby", cutId: "cut-round", stoneQuantity: 1, choices: { style: "style-necklace-chain" } }, options);
    expect(config.gemstoneId).toBe("gem-none");
    expect(config.stoneQuantity).toBe(0);
    expect(notices[0]).toMatch(/The Chain style has no stones/);
    const ring = normalizeConfig({ productType: "ring", gemstoneId: "gem-ruby", choices: { style: "style-ring-band" } }, options);
    expect(ring.config.gemstoneId).toBe("gem-none");
  });

  it("keeps a stone by starting from a style that holds one when no style was chosen", () => {
    const { config } = normalizeConfig({ productType: "necklace", gemstoneId: "gem-ruby", cutId: "cut-round", stoneQuantity: 1 }, options);
    expect(config.choices?.style).toBe("style-necklace-lariat");
    expect(config.gemstoneId).toBe("gem-ruby");
    expect(normalizeConfig({ productType: "ring", gemstoneId: "gem-ruby" }, options).config.choices?.style).toBe("style-ring-solitaire");
    expect(normalizeConfig({ productType: "ring" }, options).config.choices?.style).toBe("style-ring-band");
  });

  it("clamps the stone quantity to the piece's maximum", () => {
    const { config } = normalizeConfig({ productType: "pendant", gemstoneId: "gem-ruby", cutId: "cut-oval", stoneQuantity: 5 }, options);
    expect(config.stoneQuantity).toBe(3);
  });

  it("gives a cut and quantity 1 when a stone is chosen", () => {
    const { config } = normalizeConfig({ productType: "ring", gemstoneId: "gem-ruby" }, options);
    expect(config.cutId).toBe("cut-round");
    expect(config.stoneQuantity).toBe(1);
  });

  it("gives necklaces a chain style and clasp, and removes them from other pieces", () => {
    const n = normalizeConfig({ productType: "necklace" }, options).config;
    expect(n).toMatchObject({ chainStyleId: "chain-cable", claspId: "clasp-lobster", sizeId: "size-necklace-18in" });
    const r = normalizeConfig({ productType: "ring", chainStyleId: "chain-rope", claspId: "clasp-box" }, options).config;
    expect(r.chainStyleId).toBeUndefined();
    expect(r.claspId).toBeUndefined();
  });

  it("resets the size when switching piece type", () => {
    const { config } = normalizeConfig({ productType: "bracelet", sizeId: "size-ring-us9" }, options);
    expect(config.sizeId).toBe("size-bracelet-7in");
  });
});

describe("productDesign (3D models in the shop)", () => {
  it("uses the product's saved design", async () => {
    const { productDesign } = await import("./labels");
    const { seedProducts } = await import("@/lib/data/seed/catalog");
    const solitaire = seedProducts(new Date()).find((p) => p.name === "Classic Solitaire Ring")!;
    expect(productDesign(solitaire, options)).toMatchObject({ productType: "ring", materialId: "mat-18k", gemstoneId: "gem-diamond", stoneQuantity: 1 });
  });
  it("derives a valid design from category and material when none is saved", async () => {
    const { productDesign } = await import("./labels");
    const p = { ...seedProductsStub(), category: "bracelet" as const, material: "Stainless Steel", design: undefined };
    const cfg = productDesign(p, options);
    expect(cfg).toMatchObject({ productType: "bracelet", materialId: "mat-steel", finishId: "fin-silver-tone", gemstoneId: "gem-none" });
    expect(() => estimate(cfg, options)).not.toThrow();
  });
});

function seedProductsStub() {
  return { id: "x", slug: "x", name: "X", description: "", category: "ring" as const, material: "", price: 1, photos: [], availability: "available" as const, hidden: false, createdAt: "", updatedAt: "" };
}
