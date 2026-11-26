import { describe, expect, it } from "vitest";
import {
  checkCustomDraft,
  checkServiceDraft,
  editCustomDraft,
  summarizeCustomDraft,
  summarizeServiceDraft,
  type CustomDraft,
  type ServiceDraft,
} from "./drafts";
import { seedOptions } from "@/lib/data/seed/options";
import { seedServices } from "@/lib/data/seed/catalog";

const options = seedOptions();
const services = seedServices();

const ring: CustomDraft = {
  kind: "custom_order",
  config: {
    productType: "ring",
    materialId: "mat-18k",
    finishId: "fin-white",
    gemstoneId: "gem-ruby",
    cutId: "cut-oval",
    stoneQuantity: 3,
    sizeId: "size-ring-us6",
    choices: { style: "style-ring-three_stone" },
  },
  notes: "Engrave M&J inside",
};

describe("custom order drafts in the chat (FR-36, manuscript V2)", () => {
  it("a complete draft has no problem and keeps the customer's choices", () => {
    const r = checkCustomDraft(ring, options);
    expect(r.problem).toBeNull();
    expect(r.config).toMatchObject({ productType: "ring", materialId: "mat-18k", gemstoneId: "gem-ruby", stoneQuantity: 3, notes: "Engrave M&J inside" });
  });

  it("summarizes the draft as text rows, including the notes", () => {
    const rows = Object.fromEntries(summarizeCustomDraft(ring, options));
    expect(rows).toMatchObject({
      Piece: "Ring",
      Style: "Three-stone",
      Material: "18K Gold",
      Gemstone: "Ruby (lab) × 3",
      Cut: "Oval",
      Size: "US 6",
      Notes: "Engrave M&J inside",
    });
  });

  it("edits follow the same rules as the customizer", () => {
    const { draft, notices } = editCustomDraft(ring, { choices: { ...ring.config.choices, style: "style-ring-band" } }, options);
    expect(draft.config.gemstoneId).toBe("gem-none");
    expect(notices.join(" ")).toMatch(/no stones/);
    const back = editCustomDraft(draft, { gemstoneId: "gem-sapphire" }, options).draft;
    expect(back.config.choices?.style).toBe("style-ring-solitaire");
    expect(editCustomDraft(ring, { notes: "No engraving" }, options).draft.notes).toBe("No engraving");
  });

  it("reports what must be fixed before sending", () => {
    const named: CustomDraft = {
      kind: "custom_order",
      config: { productType: "name_pendant", materialId: "mat-14k", finishId: "fin-yellow", fontId: "font-allura" },
    };
    expect(checkCustomDraft(named, options).problem).toMatch(/name/i);
    // over-long notes are trimmed to the 500-character limit, as in the customizer
    const long = checkCustomDraft({ ...ring, notes: "x".repeat(600) }, options);
    expect(long.problem).toBeNull();
    expect(long.config.notes?.length).toBeLessThanOrEqual(500);
  });
});

describe("service request drafts in the chat (FR-37)", () => {
  const draft: ServiceDraft = {
    kind: "service_request",
    fields: {
      itemType: "jewelry",
      itemDescription: "Gold chain bracelet, 14K",
      serviceIds: ["svc-repair", "svc-polishing"],
      details: "The clasp is broken and it looks dull.",
    },
  };

  it("a complete draft has no problem and is summarized with service names", () => {
    expect(checkServiceDraft(draft)).toBeNull();
    const rows = Object.fromEntries(summarizeServiceDraft(draft, services));
    expect(rows).toMatchObject({ "Item type": "Jewelry", Item: "Gold chain bracelet, 14K", Services: "Polishing, Repair" });
  });

  it("uses the service form's rules", () => {
    expect(checkServiceDraft({ ...draft, fields: { ...draft.fields, serviceIds: [] } })).toMatch(/at least one service/);
    expect(checkServiceDraft({ ...draft, fields: { ...draft.fields, details: "broken" } })).toMatch(/at least 10 characters/);
  });
});
