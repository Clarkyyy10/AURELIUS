// @vitest-environment node
import { describe, expect, it } from "vitest";
import { seedOptions } from "@/lib/data/seed/options";
import { seedFaqs, seedPolicies, seedProducts, seedServices, seedSettings } from "@/lib/data/seed/catalog";
import { activeOptions } from "@/lib/pricing/options";
import { estimate } from "@/lib/pricing/estimate";
import { PRICE_GUARDRAIL } from "@/lib/chatbot/engine";
import type { KnowledgeBase } from "@/lib/chatbot/types";
import type { DesignConfig } from "@/types";
import { match, toChatResult } from "./output";
import { systemPrompt } from "./prompt";
import { windowStart } from "./service";

const kb: KnowledgeBase = {
  options: activeOptions(seedOptions()),
  services: seedServices(),
  faqs: seedFaqs(),
  products: seedProducts(new Date()),
  settings: seedSettings,
  policies: seedPolicies,
};

describe("chat drafts from the model (FR-36, FR-37)", () => {
  it("turns option names into a valid custom-order design", () => {
    const r = toChatResult(
      {
        reply: "Here is your draft.",
        draftKind: "custom_order",
        custom: {
          productType: "ring",
          style: "three-stone",
          material: "14k gold",
          finish: "Yellow",
          gemstone: "ruby",
          cut: "Oval",
          stoneQuantity: 3,
          size: "US 6",
          notes: "For our anniversary",
        },
      },
      kb,
    );
    expect(r.draft?.kind).toBe("custom_order");
    const cfg = (r.draft as { config: DesignConfig }).config;
    expect(cfg).toMatchObject({
      productType: "ring",
      materialId: "mat-14k",
      gemstoneId: "gem-ruby",
      cutId: "cut-oval",
      stoneQuantity: 3,
      sizeId: "size-ring-us6",
    });
    expect(cfg.choices?.style).toBe("style-ring-three_stone");
    expect(() => estimate(cfg, kb.options)).not.toThrow(); // the customer can confirm it as is
  });

  it("fixes impossible combinations with the customizer's rules", () => {
    const r = toChatResult({ reply: "x", draftKind: "custom_order", custom: { productType: "ring", style: "Plain band", gemstone: "Ruby" } }, kb);
    const cfg = (r.draft as { config: DesignConfig }).config;
    expect(cfg.gemstoneId).toBe("gem-none"); // a plain band has no stones
    expect(() => estimate(cfg, kb.options)).not.toThrow();
  });

  it("matches service names and drops services that don't apply to the item", () => {
    const r = toChatResult(
      {
        reply: "x",
        draftKind: "service_request",
        service: {
          itemType: "jewelry",
          itemDescription: "Gold chain bracelet",
          services: ["repair", "Polishing", "Watch Battery Replacement", "made up"],
          details: "The clasp is broken.",
        },
      },
      kb,
    );
    expect(r.draft).toMatchObject({ kind: "service_request", fields: { itemType: "jewelry", serviceIds: ["svc-repair", "svc-polishing"] } });
  });

  it("ignores an unknown piece type", () => {
    expect(toChatResult({ reply: "x", draftKind: "custom_order", custom: { productType: "spaceship" } }, kb).draft).toBeUndefined();
  });
});

describe("reply guardrails (FR-39, FR-40)", () => {
  it("adds the reminder to anything that looks like a price or a date promise", () => {
    expect(toChatResult({ reply: "It costs ₱5,000." }, kb).reply).toContain(PRICE_GUARDRAIL);
    expect(toChatResult({ reply: "It will be ready by Friday." }, kb).reply).toContain(PRICE_GUARDRAIL);
    expect(toChatResult({ reply: "Usually 7 days." }, kb).reply).toContain(PRICE_GUARDRAIL);
    expect(toChatResult({ reply: "We are open Monday to Saturday." }, kb).reply).not.toContain(PRICE_GUARDRAIL);
  });

  it("keeps links to the store's own pages only and removes Markdown", () => {
    const r = toChatResult({ reply: "**See** [our shop](/shop) or [this](https://evil.example) or [a ring](/shop/classic-solitaire-ring)." }, kb);
    expect(r.reply).toBe("See [our shop](/shop) or this or [a ring](/shop/classic-solitaire-ring).");
  });

  it("passes the owner referral through and limits quick replies", () => {
    const r = toChatResult({ reply: "Please ask the owner.", referToOwner: true, quickReplies: ["a", "b", "c", "d", "e", "f", ""] }, kb);
    expect(r.referToOwner).toBe(true);
    expect(r.quickReplies).toEqual(["a", "b", "c", "d", "e"]);
  });
});

describe("prompt and helpers", () => {
  it("grounds the model in store data and states the rules", () => {
    const p = systemPrompt(kb);
    expect(p).toContain("Never give a final price");
    expect(p).toContain("Confirm and send");
    expect(p).toContain(kb.services[0].name);
    expect(p).not.toMatch(/@demo\.ph/); // no customer data
  });

  it("matches names loosely but safely", () => {
    const items = [{ label: "18K Gold" }, { label: "14K Gold" }, { label: "Sterling Silver 925" }];
    expect(match("14k gold", items)?.label).toBe("14K Gold");
    expect(match("sterling", items)?.label).toBe("Sterling Silver 925");
    expect(match("", items)).toBeUndefined();
  });

  it("groups messages into 5-minute rate-limit windows", () => {
    expect(windowStart(new Date("2026-11-24T10:04:59Z"), 5).toISOString()).toBe("2026-11-24T10:00:00.000Z");
    expect(windowStart(new Date("2026-11-24T10:05:00Z"), 5).toISOString()).toBe("2026-11-24T10:05:00.000Z");
  });
});
