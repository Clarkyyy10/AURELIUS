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
    const r = last("Design a custom piece", "Ring", "18K Gold", "White", "Ruby (lab)", "Oval", "2", "US 6", "Engrave M&J inside");
    expect(r.draft?.kind).toBe("custom_order");
    const cfg = (r.draft as { config: DesignConfig }).config;
    expect(cfg).toMatchObject({ productType: "ring", materialId: "mat-18k", finishId: "fin-white", gemstoneId: "gem-ruby", cutId: "cut-oval", stoneQuantity: 2, sizeId: "size-ring-us6" });
    expect(cfg.notes).toBe("Engrave M&J inside");
    expect(() => estimate(cfg, kb.options)).not.toThrow();
    expect(r.reply).toContain("won't submit");
  });

  it("detects the piece type from free text and skips gemstones for necklaces", () => {
    const r1 = last("I want a necklace");
    expect(r1.reply).toMatch(/material/i);
    const r2 = last("I want a necklace", "Sterling Silver 925", "Polished");
    expect(r2.reply).toMatch(/Gemstones aren't available/);
    expect(r2.reply).toMatch(/size/i);
  });

  it("only offers finishes allowed for the chosen material", () => {
    const r = last("Design a custom piece", "Bracelet", "Stainless Steel");
    expect(r.quickReplies).toEqual(["Silver tone", "Black", "Gold tone"]);
    const bad = last("Design a custom piece", "Bracelet", "Stainless Steel", "Rose");
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
