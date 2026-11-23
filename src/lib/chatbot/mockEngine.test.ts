import { describe, expect, it } from "vitest";
import { PRICE_GUARDRAIL, respond } from "./mockEngine";
import type { ChatTurn, KnowledgeBase } from "./types";
import { seedOptions } from "@/lib/data/seed/options";
import { seedFaqs, seedPolicies, seedProducts, seedServices, seedSettings } from "@/lib/data/seed/catalog";
import { estimate } from "@/lib/pricing/estimate";
import type { DesignConfig } from "@/types";

const kb: KnowledgeBase = {
  options: seedOptions(),
  services: seedServices(),
  faqs: seedFaqs(),
  products: seedProducts(new Date()),
  settings: seedSettings,
  policies: seedPolicies,
};

const say = (...msgs: string[]): ChatTurn[] => msgs.flatMap((m) => [{ role: "user" as const, content: m }, { role: "assistant" as const, content: "…" }]);
const last = (...msgs: string[]) => respond(say(...msgs), kb);

describe("custom order flow (FR-36)", () => {
  it("collects every option and returns a complete, valid draft", () => {
    const r = last("Design a custom piece", "Ring", "Toi et moi", "18K Gold", "White", "Ruby (lab)", "Oval", "US 6", "Engrave M&J inside");
    expect(r.draft?.kind).toBe("custom_order");
    const cfg = (r.draft as { config: DesignConfig }).config;
    expect(cfg).toMatchObject({ productType: "ring", materialId: "mat-18k", finishId: "fin-white", gemstoneId: "gem-ruby", cutId: "cut-oval", stoneQuantity: 2, sizeId: "size-ring-us6", choices: { style: "style-ring-toi_et_moi" } });
    expect(cfg.notes).toBe("Engrave M&J inside");
    expect(() => estimate(cfg, kb.options)).not.toThrow();
    expect(r.reply).toContain("won't submit");
    expect(r.reply).toContain("Confirm and send");
  });

  it("detects the piece type from free text and skips gemstones for necklaces", () => {
    const r1 = last("I want a necklace");
    expect(r1.reply).toMatch(/Which style/i);
    expect(last("I want a necklace", "Chain").reply).toMatch(/material/i);
    const r2 = last("I want a necklace", "Chain", "Sterling Silver 925", "Polished");
    expect(r2.reply).toMatch(/chain style/i);
    expect(r2.quickReplies).toContain("Figaro");
  });

  it("only offers finishes allowed for the chosen material", () => {
    const r = last("Design a custom piece", "Bracelet", "Bangle", "Stainless Steel");
    expect(r.quickReplies).toEqual(["Silver tone", "Black", "Gold tone"]);
    const bad = last("Design a custom piece", "Bracelet", "Bangle", "Stainless Steel", "Rose");
    expect(bad.reply).toMatch(/isn't available for Stainless Steel/);
  });

  it("can start over", () => {
    expect(last("Design a custom piece", "Ring", "start over").reply).toMatch(/start over/i);
  });
});

describe("service request flow (FR-37)", () => {
  it("collects item, services and details and returns a draft", () => {
    const r = last("Request a repair or service", "Jewelry", "Gold chain bracelet, 14K", "Repair, Polishing", "The clasp is broken and it looks dull.");
    expect(r.draft).toEqual({
      kind: "service_request",
      fields: { itemType: "jewelry", itemDescription: "Gold chain bracelet, 14K", serviceIds: ["svc-polishing", "svc-repair"], details: "The clasp is broken and it looks dull." },
    });
  });

  it("goes straight to the watch description for battery questions", () => {
    expect(last("my watch battery is dead").reply).toMatch(/describe the watch/);
  });
});

describe("guardrails (FR-39, FR-40)", () => {
  it.each(["What's the weather today?", "Can you help me with my homework?", "Who will win the election?", "Recommend a restaurant"])("refers out-of-scope question to the owner: %s", (q) => {
    const r = last(q);
    expect(r.referToOwner).toBe(true);
    expect(r.reply).toMatch(/contact the owner/);
  });

  it.each(["How much is a gold ring?", "When will my ring be ready?", "What is the final price?"])("never states a final price or date: %s", (q) => {
    const r = last(q);
    expect(r.reply).toContain(PRICE_GUARDRAIL);
    expect(r.reply).not.toMatch(/₱\s?\d/);
  });

  it("adds the guardrail when price comes up during a flow, and keeps the flow going", () => {
    const r = last("Design a custom piece", "how much does it cost?");
    expect(r.reply).toContain(PRICE_GUARDRAIL);
    expect(r.quickReplies).toContain("Ring");
  });
});

describe("FAQ answers (FR-38)", () => {
  it("answers store hours and location", () => {
    expect(last("Store hours and location").reply).toMatch(/Montalban Public Market/);
    expect(last("what time do you open?").reply).toMatch(/Monday to Saturday/);
  });
  it("answers payment methods and products", () => {
    expect(last("Do you accept GCash?").reply).toMatch(/GCash/);
    expect(last("Ask about products").reply).toMatch(/pieces in the shop/);
  });
});

describe("necklace flow with chain style and clasp", () => {
  it("asks for chain, length and clasp and returns a complete draft", () => {
    const r = last("I want a necklace", "Chain", "18K Gold", "Yellow", "Rope", "20 in · Matinee", "Toggle", "No notes");
    const cfg = (r.draft as { config: DesignConfig }).config;
    expect(cfg).toMatchObject({ productType: "necklace", chainStyleId: "chain-rope", claspId: "clasp-toggle", sizeId: "size-necklace-20in", gemstoneId: "gem-none" });
    expect(() => estimate(cfg, kb.options)).not.toThrow();
    expect(r.reply).toContain("Rope chain with toggle clasp");
  });
  it("understands a style typed in lowercase", () => {
    expect(last("I want a necklace", "chain", "18K Gold", "Yellow", "cuban please").reply).toMatch(/Cuban \(Miami\) — a thick/);
  });
});

describe("design styles (D-25)", () => {
  it("asks for the style first and follows its stone rule", () => {
    const r = last("I want a ring", "Three-stone", "14K Gold", "Yellow", "Cubic Zirconia", "Round", "US 7", "No notes");
    const cfg = (r.draft as { config: DesignConfig }).config;
    expect(cfg).toMatchObject({ choices: { style: "style-ring-three_stone" }, stoneQuantity: 3 });
    expect(() => estimate(cfg, kb.options)).not.toThrow();
    expect(r.reply).toContain("(three-stone)");
  });
  it("won't accept no stone for a style that needs one", () => {
    expect(last("I want a ring", "Solitaire", "14K Gold", "Yellow", "None").reply).toMatch(/needs a stone/);
  });
  it("asks for the zodiac sign on a zodiac pendant", () => {
    const r = last("I want a pendant", "Zodiac", "leo", "18K Gold", "Yellow", "None", "Medium", "No notes");
    const cfg = (r.draft as { config: DesignConfig }).config;
    expect(cfg.styleText).toBe("Leo");
    expect(() => estimate(cfg, kb.options)).not.toThrow();
  });
  it("uses pearls for a pearl strand", () => {
    const r = last("I want a necklace", "Pearl strand", "14K Gold", "Yellow", "18 in · Princess", "No notes");
    const cfg = (r.draft as { config: DesignConfig }).config;
    expect(cfg.gemstoneId).toBe("gem-pearl");
    expect(() => estimate(cfg, kb.options)).not.toThrow();
  });
});

describe("name pendant flow", () => {
  it("asks for the name and font and returns a complete draft", () => {
    const r = last("I want a name pendant", "14K Gold", "Rose", "Medium (13 mm letters)", "Andrea", "Casual script", "No notes");
    expect(r.draft?.kind).toBe("custom_order");
    const cfg = (r.draft as { config: DesignConfig }).config;
    expect(cfg).toMatchObject({ productType: "name_pendant", materialId: "mat-14k", finishId: "fin-rose", nameText: "Andrea", fontId: "font-dancing-script" });
    expect(() => estimate(cfg, kb.options)).not.toThrow();
    expect(r.reply).toContain("“Andrea” in casual script");
  });
  it("rejects names that are too long", () => {
    expect(last("I want a name pendant", "14K Gold", "Rose", "Medium (13 mm letters)", "Maximiliano Jr").reply).toMatch(/up to 10 characters/);
  });
});
