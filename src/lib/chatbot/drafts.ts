// In-chat drafts (FR-36, FR-37 — manuscript V2): the assistant shows a text summary of the draft in the
// chat; the customer edits it there and explicitly confirms before anything is sent. These helpers
// check and summarize a draft without touching the database. They never create a 3D design.

import { applyChange } from "@/lib/pricing/design";
import { estimate, EstimateError } from "@/lib/pricing/estimate";
import { designLabels } from "@/lib/pricing/labels";
import { normalizeConfig } from "@/lib/pricing/normalize";
import { designExtrasSchema, serviceRequestSchema } from "@/lib/validation/schemas";
import type { CustomizationOptions, DesignConfig, DesignLabels, ServiceCatalogItem } from "@/types";
import type { ChatDraft } from "./types";

export type CustomDraft = Extract<ChatDraft, { kind: "custom_order" }>;
export type ServiceDraft = Extract<ChatDraft, { kind: "service_request" }>;

const ROWS: [keyof DesignLabels, string][] = [
  ["productType", "Piece"],
  ["style", "Style"],
  ["name", "Name"],
  ["styleText", "Letters / text"],
  ["font", "Font"],
  ["material", "Material"],
  ["finish", "Color / finish"],
  ["gemstone", "Gemstone"],
  ["cut", "Cut"],
  ["setting", "Setting"],
  ["size", "Size"],
  ["chain", "Chain style"],
  ["clasp", "Clasp"],
  ["profile", "Band shape"],
  ["shank", "Shank"],
  ["texture", "Texture"],
];

/** The draft's design, completed with the store's defaults, plus any notices about changes made. */
export function checkCustomDraft(draft: CustomDraft, options: CustomizationOptions): { config: DesignConfig; notices: string[]; problem: string | null } {
  const { config, notices } = normalizeConfig({ ...draft.config, notes: draft.notes ?? draft.config.notes }, options);
  let problem: string | null = null;
  try {
    estimate(config, options);
  } catch (e) {
    problem = e instanceof EstimateError ? e.message : "This design can't be checked right now. Please try again.";
  }
  if (!problem) {
    const extras = designExtrasSchema.safeParse({ engravingText: config.engravingText, notes: config.notes });
    if (!extras.success) problem = extras.error.issues[0]?.message ?? "Check the notes.";
  }
  return { config, notices, problem };
}

/** Applies an edit the customer made in the chat (related choices follow, as in the customizer). */
export function editCustomDraft(draft: CustomDraft, patch: Partial<DesignConfig>, options: CustomizationOptions): { draft: CustomDraft; notices: string[] } {
  const current = normalizeConfig(draft.config, options).config;
  const { config, notices } = normalizeConfig(applyChange(current, patch, options), options);
  return { draft: { ...draft, config, notes: patch.notes !== undefined ? patch.notes : draft.notes }, notices };
}

/** Label/value rows for the summary shown in the chat. */
export function summarizeCustomDraft(draft: CustomDraft, options: CustomizationOptions): [string, string][] {
  const { config } = checkCustomDraft(draft, options);
  const labels = designLabels(config, options);
  const rows = ROWS.filter(([k]) => labels[k] != null && labels[k] !== "").map(([k, name]) => [name, String(labels[k])] as [string, string]);
  const notes = (draft.notes ?? config.notes)?.trim();
  if (notes) rows.push(["Notes", notes]);
  return rows;
}

/** The first problem with a service draft (same rules as the service request form), or null. */
export function checkServiceDraft(draft: ServiceDraft): string | null {
  const r = serviceRequestSchema.safeParse({ ...draft.fields, photos: [], serviceIds: draft.fields.serviceIds ?? [] });
  return r.success ? null : (r.error.issues[0]?.message ?? "Check the draft.");
}

export function summarizeServiceDraft(draft: ServiceDraft, services: ServiceCatalogItem[]): [string, string][] {
  const f = draft.fields;
  const names = services.filter((s) => f.serviceIds?.includes(s.id)).map((s) => s.name);
  const rows: [string, string][] = [
    ["Item type", f.itemType === "watch" ? "Watch" : f.itemType === "jewelry" ? "Jewelry" : "—"],
    ["Item", f.itemDescription?.trim() || "—"],
  ];
  if (f.brandModel?.trim()) rows.push(["Brand / model", f.brandModel.trim()]);
  if (f.material?.trim()) rows.push(["Material", f.material.trim()]);
  rows.push(["Services", names.length ? names.join(", ") : "—"], ["Details", f.details?.trim() || "—"]);
  return rows;
}
