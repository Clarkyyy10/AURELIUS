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

  it("removes stones from pieces that can't hold them", () => {
    const { config, notices } = normalizeConfig({ productType: "necklace", gemstoneId: "gem-ruby", cutId: "cut-round", stoneQuantity: 1 }, options);
    expect(config.gemstoneId).toBe("gem-none");
    expect(config.stoneQuantity).toBe(0);
    expect(notices[0]).toMatch(/not available for a necklace/);
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

  it("resets the size when switching piece type", () => {
    const { config } = normalizeConfig({ productType: "bracelet", sizeId: "size-ring-us9" }, options);
    expect(config.sizeId).toBe("size-bracelet-7in");
  });
});
