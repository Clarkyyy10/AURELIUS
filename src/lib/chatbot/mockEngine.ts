// Scripted mock chatbot (Phase 1) — frontend-spec §5.9, FR-35 to FR-40.
// Stateless: the conversation state is rebuilt by replaying the user's messages, so the same
// history always gives the same answer. Phase 2 replaces respond() with a call to POST /api/chat.

import { repos } from "@/lib/data";
import { optionsFor, stoneRule, styleOf, styleTextProblem, TEXT_REQUIRED, usesChain } from "@/lib/pricing/design";
import { ZODIAC_SIGNS } from "@/lib/data/seed/designs";
import type { DesignConfig, ProductType } from "@/types";
import { nameProblem } from "@/lib/pricing/name";
import type { ChatContext, ChatDraft, ChatResult, ChatTurn, KnowledgeBase } from "./types";

export const QUICK_START = ["Design a custom piece", "Request a repair or service", "Ask about products", "Store hours and location"];
export const WELCOME =
  "Hi! I'm the AURELIUS Assistant. I can help you design a custom piece, request a repair or service, or answer questions about our products and services. What would you like to do?";

const PRICE_WORDS = /\b(how much|price|prices|cost|costs|magkano|rate|budget|cheap|expensive|discount|final price|quote)\b/i;
const DATE_WORDS = /\b(when|how long|how many days|ready by|deadline|finish|completion|date|rush|urgent)\b/i;
const RESET_WORDS = /^(start over|restart|reset|cancel|stop|never ?mind)\b/i;

export const PRICE_GUARDRAIL =
  "Just so you know: I can't give final prices or completion dates. The estimate in the customizer is not final — the owner confirms the final price and completion date in a quotation.";

type State =
  | { flow: "idle" }
  | { flow: "custom"; step: "type" | "style" | "styleText" | "material" | "finish" | "chain" | "gem" | "cut" | "qty" | "size" | "clasp" | "name" | "font" | "notes"; config: Partial<DesignConfig> }
  | { flow: "service"; step: "itemType" | "item" | "services" | "details"; fields: NonNullable<Extract<ChatDraft, { kind: "service_request" }>["fields"]> };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

function matchOne<T extends { label: string }>(text: string, list: T[]): T | undefined {
  const t = norm(text);
  // exact label first, then label contained in the text, then the first word of the label
  return (
    list.find((x) => norm(x.label) === t) ??
    [...list].sort((a, b) => b.label.length - a.label.length).find((x) => t.includes(norm(x.label))) ??
    list.find((x) => {
      const first = norm(x.label).split(" ")[0];
      return first.length > 2 && t.split(" ").includes(first);
    })
  );
}

function ownerContact(kb: KnowledgeBase) {
  return `please contact the owner at ${kb.settings.contactNumber} or visit the store at ${kb.settings.address}`;
}

function referToOwner(kb: KnowledgeBase): ChatResult {
  return {
    reply: `I can only help with our products, custom orders, and services. For this, ${ownerContact(kb)}.`,
    quickReplies: QUICK_START,
    referToOwner: true,
  };
}

function findFaq(text: string, kb: KnowledgeBase) {
  const t = ` ${norm(text)} `;
  let best: { score: number; answer: string } | null = null;
  for (const f of kb.faqs.filter((x) => x.active)) {
    const score = f.keywords.reduce((s, k) => (t.includes(` ${norm(k)} `) || (norm(k).includes(" ") && t.includes(norm(k))) ? s + (norm(k).includes(" ") ? 2 : 1) : s), 0);
    if (score > 0 && (!best || score > best.score)) best = { score, answer: f.answer };
  }
  return best?.answer ?? null;
}

const TYPE_WORDS: Record<ProductType, string[]> = {
  ring: ["ring", "rings", "band", "singsing"],
  pendant: ["pendant", "locket"],
  name_pendant: ["nameplate", "name-pendant"],
  anklet: ["anklet", "ankle"],
  toe_ring: ["toe"],
  necklace: ["necklace", "chain", "kwintas"],
  bracelet: ["bracelet", "bangle", "pulseras"],
  earrings: ["earring", "earrings", "studs", "hikaw"],
};

function detectType(text: string, kb: KnowledgeBase): ProductType | undefined {
  if (/name ?(pendant|necklace|plate)|pangalan/.test(norm(text))) return kb.options.productTypes.find((p) => p.type === "name_pendant")?.type;
  const words = norm(text).split(" ");
  return kb.options.productTypes.find((p) => TYPE_WORDS[p.type].some((w) => words.includes(w)))?.type;
}

// ---------------------------------------------------------------- custom order flow (FR-36)

const stylesOf = (kb: KnowledgeBase, type?: ProductType) => (type ? optionsFor(kb.options, type, "style") : []);
const asConfig = (c: Partial<DesignConfig>) => c as Pick<DesignConfig, "choices" | "productType">;
const firstStep = (kb: KnowledgeBase, type?: ProductType) => (stylesOf(kb, type).length ? "style" : "material") as "style" | "material";

function askCustom(state: Extract<State, { flow: "custom" }>, kb: KnowledgeBase, prefix = ""): ChatResult {
  const o = kb.options;
  const c = state.config;
  const pt = o.productTypes.find((p) => p.type === c.productType);
  const p = prefix ? `${prefix} ` : "";
  switch (state.step) {
    case "type":
      return { reply: `${p}What kind of piece would you like?`, quickReplies: o.productTypes.map((x) => x.label) };
    case "style": {
      const styles = stylesOf(kb, c.productType);
      return { reply: `${p}Which style would you like? For example: ${styles.slice(0, 3).map((x) => `${x.label} (${x.description.charAt(0).toLowerCase()}${x.description.slice(1).replace(/\.$/, "")})`).join("; ")}.`, quickReplies: styles.map((x) => x.label) };
    }
    case "styleText": {
      const style = styleOf(asConfig(c), o);
      if (style?.key === "zodiac") return { reply: `${p}Which zodiac sign?`, quickReplies: ZODIAC_SIGNS };
      return { reply: `${p}What letters or text should it have? Up to ${style?.textMax} characters.${TEXT_REQUIRED.has(style?.key ?? "") ? "" : " Or type “None”."}` };
    }
    case "material":
      return { reply: `${p}Which material would you like for your ${pt?.label.toLowerCase()}?`, quickReplies: o.materials.map((m) => m.label) };
    case "finish": {
      const m = o.materials.find((x) => x.id === c.materialId);
      const fins = o.finishes.filter((f) => m?.finishIds.includes(f.id));
      return { reply: `${p}Which color or finish? For ${m?.label} we have ${fins.map((f) => f.label).join(", ")}.`, quickReplies: fins.map((f) => f.label) };
    }
    case "gem": {
      const rule = stoneRule(asConfig(c), o);
      const gems = o.gemstones.filter((g) => !(g.isNone && rule.min > 0) && g.surface !== "pearl");
      return { reply: rule.min > 0 ? `${p}Which stone would you like?` : `${p}Would you like a gemstone? You can choose up to ${rule.max}.`, quickReplies: gems.map((g) => g.label) };
    }
    case "cut":
      return { reply: `${p}Which cut for the stone?`, quickReplies: o.cuts.map((x) => x.label) };
    case "qty": {
      const rule = stoneRule(asConfig(c), o);
      const lo = Math.max(1, rule.min);
      return { reply: `${p}How many stones? (${lo} to ${rule.max})`, quickReplies: rule.max - lo < 8 ? Array.from({ length: rule.max - lo + 1 }, (_, i) => String(lo + i)) : [String(lo), String(rule.default), String(rule.max)] };
    }
    case "size": {
      const sizes = o.sizes.filter((s) => s.productType === c.productType).sort((a, b) => a.sortOrder - b.sortOrder);
      return { reply: `${p}What size? If you're not sure, choose the middle size — you can change it later.`, quickReplies: sizes.map((s) => s.label) };
    }
    case "chain":
      return { reply: `${p}Which chain style? Popular choices are Cable, Rope, Box, Figaro and Cuban — tap one to see it, or type another style.`, quickReplies: (o.chainStyles ?? []).map((c) => c.label) };
    case "clasp":
      return { reply: `${p}Which clasp? A lobster claw is the most secure and popular.`, quickReplies: (o.clasps ?? []).map((c) => c.label) };
    case "name":
      return { reply: `${p}What name should the pendant say? Up to 10 letters (Ñ and accents are fine).` };
    case "font":
      return { reply: `${p}Which font do you like?`, quickReplies: (o.fonts ?? []).map((f) => f.label) };
    case "notes":
      return { reply: `${p}Any notes for the owner? For example engraving text or design ideas. Type them, or choose “No notes”.`, quickReplies: ["No notes"] };
  }
}

function customStep(state: Extract<State, { flow: "custom" }>, text: string, kb: KnowledgeBase): { state: State; result: ChatResult } {
  const o = kb.options;
  const c = { ...state.config };
  const pt = () => o.productTypes.find((p) => p.type === c.productType)!;
  const again = (msg: string) => ({ state, result: askCustom(state, kb, msg) });
  const next = (step: Extract<State, { flow: "custom" }>["step"], ack = ""): { state: State; result: ChatResult } => {
    const s = { flow: "custom" as const, step, config: c };
    return { state: s, result: askCustom(s, kb, ack) };
  };

  switch (state.step) {
    case "type": {
      const t = matchOne(text, o.productTypes)?.type ?? detectType(text, kb);
      if (!t) return again("Sorry, I didn't catch that.");
      c.productType = t;
      delete c.choices;
      return next(firstStep(kb, t), `A ${pt().label.toLowerCase()} — lovely.`);
    }
    case "style": {
      const style = matchOne(text, stylesOf(kb, c.productType));
      if (!style) return again("Please choose one of these styles.");
      c.choices = { style: style.id };
      return next(style.textMax ? "styleText" : "material", `${style.label} — good choice.`);
    }
    case "styleText": {
      const style = styleOf(asConfig(c), o);
      const value = /^(none|no|wala)$/i.test(text.trim()) && !TEXT_REQUIRED.has(style?.key ?? "") ? "" : style?.key === "zodiac" ? (ZODIAC_SIGNS.find((z) => z.toLowerCase() === text.trim().toLowerCase()) ?? text.trim()) : text.trim();
      const problem = styleTextProblem(style, value);
      if (problem) return again(problem);
      c.styleText = value || undefined;
      return next("material");
    }
    case "material": {
      const m = matchOne(text, o.materials);
      if (!m) return again("Please choose one of these materials.");
      c.materialId = m.id;
      return next("finish");
    }
    case "finish": {
      const m = o.materials.find((x) => x.id === c.materialId)!;
      const f = matchOne(text, o.finishes.filter((x) => m.finishIds.includes(x.id)));
      if (!f) return again(`That finish isn't available for ${m.label}.`);
      c.finishId = f.id;
      const rule = stoneRule(asConfig(c), o);
      const style = styleOf(asConfig(c), o);
      if (rule.max === 0) {
        c.gemstoneId = o.gemstones.find((g) => g.isNone)?.id;
        c.cutId = null;
        c.stoneQuantity = 0;
      }
      if (style?.requiresSurface === "pearl") {
        c.gemstoneId = o.gemstones.find((g) => g.surface === "pearl")?.id;
        c.cutId = o.cuts[0]?.id ?? null;
        c.stoneQuantity = rule.default;
        return next("size", `A ${style.label.toLowerCase()} uses about ${rule.default} pearls — the owner will confirm.`);
      }
      if (usesChain(asConfig(c), o)) return next("chain");
      if (rule.max > 0) return next("gem");
      return pt().type === "name_pendant" ? next("size") : next("size", style ? `The ${style.label} style has no stones, so we'll skip that.` : `Gemstones aren't available for a ${pt().label.toLowerCase()}, so we'll skip that.`);
    }
    case "gem": {
      const rule = stoneRule(asConfig(c), o);
      const g = /^(no|none|wala|no stone|no gemstone)\b/i.test(text.trim()) ? o.gemstones.find((x) => x.isNone) : matchOne(text, o.gemstones);
      if (!g) return again("Please choose a gemstone, or “None”.");
      if (g.isNone && rule.min > 0) return again("This style needs a stone. Please choose one.");
      c.gemstoneId = g.id;
      if (g.isNone) {
        c.cutId = null;
        c.stoneQuantity = 0;
        return next("size");
      }
      return next("cut");
    }
    case "cut": {
      const cut = matchOne(text, o.cuts);
      if (!cut) return again("Please choose a cut.");
      c.cutId = cut.id;
      const rule = stoneRule(asConfig(c), o);
      if (Math.max(1, rule.min) === rule.max) {
        c.stoneQuantity = rule.max;
        return next("size");
      }
      return next("qty");
    }
    case "qty": {
      const n = Number.parseInt(text.match(/\d+/)?.[0] ?? (/\b(one|isa)\b/i.test(text) ? "1" : /\b(two|dalawa)\b/i.test(text) ? "2" : /\b(three|tatlo)\b/i.test(text) ? "3" : ""), 10);
      const rule = stoneRule(asConfig(c), o);
      const lo = Math.max(1, rule.min);
      if (!(n >= lo && n <= rule.max)) return again(`Please choose a number from ${lo} to ${rule.max}.`);
      c.stoneQuantity = n;
      return next("size");
    }
    case "size": {
      const s = matchOne(text, o.sizes.filter((x) => x.productType === c.productType));
      if (!s) return again("Please choose one of these sizes.");
      c.sizeId = s.id;
      return c.productType === "name_pendant" ? next("name") : usesChain(asConfig(c), o) ? next("clasp") : next("notes");
    }
    case "chain": {
      const chain = matchOne(text, o.chainStyles ?? []);
      if (!chain) return again("Please choose one of these chain styles.");
      c.chainStyleId = chain.id;
      const ack = `${chain.label} — ${chain.description.charAt(0).toLowerCase()}${chain.description.slice(1)}`;
      return next(stoneRule(asConfig(c), o).max > 0 ? "gem" : "size", ack);
    }
    case "clasp": {
      const clasp = matchOne(text, o.clasps ?? []);
      if (!clasp) return again("Please choose a clasp.");
      c.claspId = clasp.id;
      return next("notes");
    }
    case "name": {
      const problem = nameProblem(text);
      if (problem) return again(problem);
      c.nameText = text.trim();
      return next("font", `“${c.nameText}” — nice.`);
    }
    case "font": {
      const font = matchOne(text, kb.options.fonts ?? []);
      if (!font) return again("Please choose one of these fonts.");
      c.fontId = font.id;
      return next("notes");
    }
    case "notes": {
      const notes = /^no( notes)?$|^none$|^wala$/i.test(text.trim()) ? undefined : text.trim().slice(0, 500);
      const m = o.materials.find((x) => x.id === c.materialId);
      const f = o.finishes.find((x) => x.id === c.finishId);
      const g = o.gemstones.find((x) => x.id === c.gemstoneId);
      const cut = o.cuts.find((x) => x.id === c.cutId);
      const s = o.sizes.find((x) => x.id === c.sizeId);
      const chained = usesChain(asConfig(c), o) ? ` · ${(o.chainStyles ?? []).find((x) => x.id === c.chainStyleId)?.label} chain with ${(o.clasps ?? []).find((x) => x.id === c.claspId)?.label.toLowerCase()} clasp` : "";
      const named = c.productType === "name_pendant" ? ` “${c.nameText}” in ${(o.fonts ?? []).find((x) => x.id === c.fontId)?.label.toLowerCase()}` : "";
      const style = styleOf(asConfig(c), o);
      const styled = style ? ` (${style.label.toLowerCase()}${c.styleText ? ` “${c.styleText}”` : ""})` : "";
      const summary = [`${f?.label} ${m?.label} ${pt().label.toLowerCase()}${styled}${named}`, g && !g.isNone ? `${g.label}, ${cut?.label} cut × ${c.stoneQuantity}` : "no gemstone", `size ${s?.label}`].join(" · ") + chained;
      return {
        state: { flow: "idle" },
        result: {
          reply: `Your draft is ready: ${summary}. Open it in the 3D customizer to review and change anything — I won't submit it for you. ${PRICE_GUARDRAIL}`,
          draft: { kind: "custom_order", config: { ...c, notes }, notes },
          quickReplies: ["Start over"],
        },
      };
    }
  }
}

// ---------------------------------------------------------------- service request flow (FR-37)

function serviceStep(state: Extract<State, { flow: "service" }>, text: string, kb: KnowledgeBase): { state: State; result: ChatResult } {
  const f = { ...state.fields };
  const relevant = () => kb.services.filter((s) => !s.hidden && s.appliesTo.includes(f.itemType ?? "jewelry"));
  switch (state.step) {
    case "itemType": {
      const t = /watch|relo/i.test(text) ? "watch" : /jewel|ring|necklace|bracelet|earring|pendant|alahas/i.test(text) ? "jewelry" : null;
      if (!t) return { state, result: { reply: "Is it a piece of jewelry or a watch?", quickReplies: ["Jewelry", "Watch"] } };
      f.itemType = t;
      return { state: { flow: "service", step: "item", fields: f }, result: { reply: t === "watch" ? "Please describe the watch, including the brand and model if you know it. For example: “Seiko 5 automatic, stainless steel”." : "Please describe the item. For example: “18K gold wedding ring, plain band”." } };
    }
    case "item": {
      if (text.trim().length < 10) return { state, result: { reply: "Could you describe it in a bit more detail (at least 10 characters)?" } };
      f.itemDescription = text.trim().slice(0, 300);
      if (f.itemType === "watch") f.brandModel = text.trim().slice(0, 80);
      return { state: { flow: "service", step: "services", fields: f }, result: { reply: "Which service do you need? You can pick more than one — type them separated by commas.", quickReplies: relevant().map((s) => s.name) } };
    }
    case "services": {
      const t = norm(text);
      const picked = relevant().filter((s) => t.includes(norm(s.name)) || norm(s.name).split(" ").some((w) => w.length > 4 && t.split(" ").includes(w)));
      if (picked.length === 0) return { state, result: { reply: "Please choose one of these services.", quickReplies: relevant().map((s) => s.name) } };
      f.serviceIds = picked.map((s) => s.id);
      return { state: { flow: "service", step: "details", fields: f }, result: { reply: `Got it: ${picked.map((s) => s.name).join(", ")}. What's wrong with the item, or what would you like done?` } };
    }
    case "details": {
      if (text.trim().length < 10) return { state, result: { reply: "Please tell me a little more (at least 10 characters), so the owner understands what you need." } };
      f.details = text.trim().slice(0, 1000);
      return {
        state: { flow: "idle" },
        result: {
          reply:
            "Your service request draft is ready. Open it to review and send it — I won't submit it for you. I can't give prices or completion dates: the owner inspects your item and confirms the cost and date in a quotation.",
          draft: { kind: "service_request", fields: f },
          quickReplies: ["Start over"],
        },
      };
    }
  }
}

// ---------------------------------------------------------------- idle: intents, FAQ, products

function productsAnswer(kb: KnowledgeBase): ChatResult {
  const visible = kb.products.filter((p) => !p.hidden);
  const avail = visible.filter((p) => p.availability === "available");
  const mto = visible.filter((p) => p.availability === "made_to_order");
  const examples = avail.slice(0, 4).map((p) => p.name).join(", ");
  return {
    reply: `We have ${visible.length} pieces in the shop: ${avail.length} ready to order (for example ${examples}) and ${mto.length} made to order. Shop prices are listed on each product; the owner confirms the final price in a quotation. [Browse the shop](/shop) or [design your own](/customize).`,
    quickReplies: ["Design a custom piece", "Request a repair or service"],
  };
}

function idleStep(text: string, kb: KnowledgeBase): { state: State; result: ChatResult } {
  const t = norm(text);
  const idle: State = { flow: "idle" };

  if (/design a custom piece|custom|design|customi[sz]e|make me|made to order|personali[sz]e/.test(t) || (/\b(want|like|need|gusto)\b/.test(t) && detectType(text, kb))) {
    const config: Partial<DesignConfig> = {};
    const type = detectType(text, kb);
    if (type) config.productType = type;
    const s: Extract<State, { flow: "custom" }> = { flow: "custom", step: type ? firstStep(kb, type) : "type", config };
    const ack = type ? `Let's design your ${kb.options.productTypes.find((p) => p.type === type)!.label.toLowerCase()}.` : "Let's design your piece together.";
    const r = askCustom(s, kb, ack);
    if (PRICE_WORDS.test(text) || DATE_WORDS.test(text)) r.reply = `${PRICE_GUARDRAIL} ${r.reply}`;
    return { state: s, result: r };
  }
  if (/request a repair or service|repair|service|fix|broken|resiz|clean|polish|battery|strap|engrav|plating|restor|sira/.test(t)) {
    const s: Extract<State, { flow: "service" }> = { flow: "service", step: "itemType", fields: {} };
    if (/watch|relo|battery|strap/.test(t)) {
      s.fields.itemType = "watch";
      s.step = "item";
      return { state: s, result: { reply: "I can help you prepare a watch service request. Please describe the watch, including the brand and model if you know it." } };
    }
    return { state: s, result: { reply: "I can help you prepare a service request. Is it a piece of jewelry or a watch?", quickReplies: ["Jewelry", "Watch"] } };
  }
  if (/ask about products|products|shop|catalog|collection|available|stock|items|sell/.test(t)) return { state: idle, result: productsAnswer(kb) };
  if (/store hours and location/.test(t)) {
    return { state: idle, result: { reply: `We're at ${kb.settings.address}. Opening hours: ${kb.settings.openingHours}`, quickReplies: QUICK_START } };
  }

  const faq = findFaq(text, kb);
  const priceOrDate = PRICE_WORDS.test(text) || DATE_WORDS.test(text);
  if (faq) return { state: idle, result: { reply: priceOrDate ? `${faq} ${PRICE_GUARDRAIL}` : faq, quickReplies: QUICK_START } };
  if (priceOrDate) {
    return { state: idle, result: { reply: `${PRICE_GUARDRAIL} You can see an estimate in the [3D customizer](/customize), or [request a service](/services/request) to get a quotation.`, quickReplies: QUICK_START } };
  }
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|kumusta|hello po|hi po)\b/.test(t)) return { state: idle, result: { reply: WELCOME, quickReplies: QUICK_START } };
  if (/^(thanks|thank you|salamat|ok|okay)\b/.test(t)) return { state: idle, result: { reply: "You're welcome! Is there anything else I can help with?", quickReplies: QUICK_START } };
  return { state: idle, result: referToOwner(kb) }; // FR-39
}

// ---------------------------------------------------------------- public API

/** Pure: compute the reply for a conversation. */
export function respond(history: ChatTurn[], kb: KnowledgeBase): ChatResult {
  let state: State = { flow: "idle" };
  let result: ChatResult = { reply: WELCOME, quickReplies: QUICK_START };
  for (const turn of history) {
    if (turn.role !== "user") continue;
    const text = turn.content.trim();
    if (RESET_WORDS.test(text)) {
      state = { flow: "idle" };
      result = { reply: "Okay, let's start over. What would you like to do?", quickReplies: QUICK_START };
      continue;
    }
    const step: { state: State; result: ChatResult } = state.flow === "custom" ? customStep(state, text, kb) : state.flow === "service" ? serviceStep(state, text, kb) : idleStep(text, kb);
    state = step.state;
    result = step.result;
    // Mid-flow price/date questions get the guardrail, and the flow continues (FR-40).
    if (state.flow !== "idle" && (PRICE_WORDS.test(text) || DATE_WORDS.test(text)) && !result.reply.includes(PRICE_GUARDRAIL)) {
      result = { ...result, reply: `${PRICE_GUARDRAIL} ${result.reply}` };
    }
  }
  return result;
}

/** Loads the store knowledge through the repositories. Never includes customer data. */
export async function loadKnowledge(): Promise<KnowledgeBase> {
  const [options, services, faqs, products, settings, policies] = await Promise.all([
    repos.customization.getOptions(),
    repos.catalog.listServices(),
    repos.knowledge.list(),
    repos.catalog.listProducts(),
    repos.settings.get(),
    repos.knowledge.getPolicies(),
  ]);
  return { options, services, faqs, products, settings, policies };
}

/** Same signature the Phase 2 API client will have. */
export async function sendMessage(history: ChatTurn[], context: ChatContext): Promise<ChatResult> {
  void context; // the mock doesn't need it; the real API uses it to adjust wording for guests
  const kb = await loadKnowledge();
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 500));
  return respond(history, kb);
}
