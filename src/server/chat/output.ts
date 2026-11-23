// Turns the model's JSON into a safe ChatResult: drafts are matched to real option and service IDs and
// normalized with the same rules as the customizer; replies get the price/date guardrail (FR-40).

import { PRICE_GUARDRAIL } from "@/lib/chatbot/engine";
import type { ChatDraft, ChatResult, KnowledgeBase } from "@/lib/chatbot/types";
import { optionsFor } from "@/lib/pricing/design";
import { normalizeConfig } from "@/lib/pricing/normalize";
import type { DesignConfig, ItemKind } from "@/types";

export interface ModelOutput {
  reply?: string;
  quickReplies?: string[];
  referToOwner?: boolean;
  draftKind?: "none" | "custom_order" | "service_request";
  custom?: Partial<
    Record<
      "productType" | "style" | "material" | "finish" | "gemstone" | "cut" | "size" | "chainStyle" | "clasp" | "nameText" | "font" | "styleText" | "notes",
      string
    >
  > & {
    stoneQuantity?: number;
  };
  service?: { itemType?: ItemKind; itemDescription?: string; brandModel?: string; material?: string; services?: string[]; details?: string };
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Finds an option by its exact name first, then by a name that starts with or contains the text. */
export function match<T extends { label: string }>(text: string | undefined, items: T[]): T | undefined {
  if (!text) return undefined;
  const t = norm(text);
  if (!t) return undefined;
  return (
    items.find((i) => norm(i.label) === t) ??
    items.find((i) => norm(i.label).startsWith(t) || t.startsWith(norm(i.label))) ??
    items.find((i) => norm(i.label).includes(t))
  );
}

export function customDraft(raw: NonNullable<ModelOutput["custom"]>, kb: KnowledgeBase): ChatDraft | undefined {
  const o = kb.options;
  const type = o.productTypes.find((p) => norm(p.type) === norm(raw.productType ?? "")) ?? match(raw.productType, o.productTypes);
  if (!type) return undefined;
  const style = match(raw.style, optionsFor(o, type.type, "style"));
  const gem = match(raw.gemstone, o.gemstones);
  const config: Partial<DesignConfig> = {
    productType: type.type,
    materialId: match(raw.material, o.materials)?.id,
    finishId: match(raw.finish, o.finishes)?.id,
    gemstoneId: gem?.id,
    cutId: match(raw.cut, o.cuts)?.id ?? null,
    stoneQuantity: Number.isInteger(raw.stoneQuantity) ? Math.max(0, Math.min(100, raw.stoneQuantity!)) : gem && !gem.isNone ? 1 : 0,
    sizeId: match(
      raw.size,
      o.sizes.filter((s) => s.productType === type.type),
    )?.id,
    chainStyleId: match(raw.chainStyle, o.chainStyles ?? [])?.id,
    claspId: match(raw.clasp, o.clasps ?? [])?.id,
    fontId: match(raw.font, o.fonts ?? [])?.id,
    nameText: raw.nameText?.slice(0, 20),
    styleText: raw.styleText?.slice(0, 20),
    ...(style ? { choices: { style: style.id } } : {}),
  };
  for (const k of Object.keys(config) as (keyof DesignConfig)[]) if (config[k] === undefined) delete config[k];
  // Same rules as the customizer: fills in missing choices and fixes impossible combinations.
  const normalized = normalizeConfig(config, o).config;
  return { kind: "custom_order", config: normalized, notes: raw.notes?.trim().slice(0, 500) || undefined };
}

export function serviceDraft(raw: NonNullable<ModelOutput["service"]>, kb: KnowledgeBase): ChatDraft | undefined {
  const itemType: ItemKind = raw.itemType === "watch" ? "watch" : "jewelry";
  const offered = kb.services.filter((s) => s.appliesTo.includes(itemType));
  const serviceIds = [
    ...new Set(
      (raw.services ?? [])
        .map(
          (name) =>
            match(
              name,
              offered.map((s) => ({ ...s, label: s.name })),
            )?.id,
        )
        .filter((x): x is string => Boolean(x)),
    ),
  ];
  return {
    kind: "service_request",
    fields: {
      itemType,
      itemDescription: raw.itemDescription?.trim().slice(0, 300) || undefined,
      brandModel: raw.brandModel?.trim().slice(0, 80) || undefined,
      material: raw.material?.trim().slice(0, 80) || undefined,
      serviceIds,
      details: raw.details?.trim().slice(0, 1000) || undefined,
    },
  };
}

/** Money or timing that could read as a promise (FR-40). Listed catalog prices get the reminder too. */
const PRICE_OR_DATE =
  /(₱|\bphp\b|\bpesos?\b)\s*[\d,]+|[\d,]+\s*(₱|pesos?)|\b(ready|done|finished|complete[d]?)\s+(by|on|in|within)\b|\b\d+\s*(working\s+)?(days?|weeks?)\b/i;

const LINK_PATHS = ["/customize", "/shop", "/services", "/services/request", "/account", "/contact"];

export function toChatResult(out: ModelOutput, kb: KnowledgeBase): ChatResult {
  let reply = (out.reply ?? "")
    .replace(/[*_#`]/g, "")
    .trim()
    .slice(0, 1200);
  if (!reply) reply = "Sorry, I didn't catch that. Could you say it another way?";
  // Only allow links to the store's own pages.
  reply = reply.replace(/\[([^\]]{1,60})\]\(([^)]*)\)/g, (m, label: string, path: string) =>
    LINK_PATHS.includes(path) || /^\/shop\/[a-z0-9-]+$/.test(path) ? m : label,
  );
  if (PRICE_OR_DATE.test(reply) && !reply.includes(PRICE_GUARDRAIL)) reply = `${reply} ${PRICE_GUARDRAIL}`;
  let draft: ChatDraft | undefined;
  if (out.draftKind === "custom_order" && out.custom) draft = customDraft(out.custom, kb);
  if (out.draftKind === "service_request" && out.service) draft = serviceDraft(out.service, kb);
  const quickReplies = (out.quickReplies ?? [])
    .map((q) => q.trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 5);
  return { reply, quickReplies: quickReplies.length ? quickReplies : undefined, draft, referToOwner: Boolean(out.referToOwner) };
}
