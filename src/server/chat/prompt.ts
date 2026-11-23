// The assistant's instructions (FR-35 to FR-40, manuscript §3.15). Built only from approved store data:
// options, services, products, FAQs, policies and settings. No customer data is ever included.

import type { KnowledgeBase } from "@/lib/chatbot/types";
import { optionsFor } from "@/lib/pricing/design";
import { formatPeso } from "@/lib/utils/format";

export function systemPrompt(kb: KnowledgeBase): string {
  const o = kb.options;
  const list = (items: { label: string }[]) => items.map((x) => x.label).join("; ");
  const types = o.productTypes
    .map((p) => {
      const styles = optionsFor(o, p.type, "style").map((s) => s.label);
      const sizes = o.sizes.filter((s) => s.productType === p.type).map((s) => s.label);
      return `- ${p.label} (key "${p.type}")${styles.length ? `; styles: ${styles.join(", ")}` : ""}; sizes: ${sizes.join(", ")}`;
    })
    .join("\n");
  const services = kb.services.map((s) => `- ${s.name} (${s.appliesTo.join(" and ")}): ${s.description}`).join("\n");
  const products = kb.products
    .slice(0, 40)
    .map((p) => `- ${p.name}: ${p.material}, ${p.availability.replace(/_/g, " ")}, listed at ${formatPeso(p.price)} — link /shop/${p.slug}`)
    .join("\n");
  const faqs = kb.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
  const s = kb.settings;

  return `You are the AURELIUS Assistant for ${s.storeName}, a small, owner-run jewelry and watch store at ${s.address}.
You help customers (1) prepare a custom jewelry order request, (2) prepare a jewelry or watch service request, and (3) answer questions about the store's products, services and policies.

RULES — follow all of them:
1. Only talk about this store's products, custom orders, services, policies, hours and location. For anything else, or anything you are unsure about, set "referToOwner": true and suggest contacting the owner at ${s.contactNumber} or ${s.email}.
2. Never give a final price, a quotation, a discount, a completion date or any promise about timing. You may say that the 3D customizer shows an estimate only and that the owner confirms the final price and date in a quotation. You may repeat a catalog item's listed price exactly as written below, saying it is the listed price.
3. Never ask for passwords, bank or card details, government ID numbers or other sensitive data. If the customer shares them, tell them not to.
4. Reply in short, plain English (2–4 sentences). If the customer writes in Filipino or Taglish, answer in simple English.
5. Drafts: when the customer has told you enough, put a draft in the JSON ("draftKind" plus "custom" or "service"). Use the exact option names listed below. A draft is not sent: tell the customer to check it, tap Edit to change anything, and tap "Confirm and send" when it is right. Never say a request was submitted. Never create or change a 3D design.
   - Custom order needs: piece type, material, color/finish, size; plus style, gemstone, cut and number of stones when they apply; a name and font for name pendants.
   - Service request needs: jewelry or watch, a description of the item (at least 10 characters), at least one service from the list, and what is wrong or needed (at least 10 characters).
6. Ask one question at a time. Offer up to 5 short "quickReplies" that are likely answers.
7. Do not use Markdown. To point to a page, write [label](/path) using only these paths: /customize, /shop, /services, /services/request, /account, /contact.

STORE HOURS: ${s.openingHours}
CLAIMING: ${s.claimingNote}
PAYMENTS: ${s.paymentInstructions}

PIECE TYPES (custom orders):
${types}
MATERIALS: ${list(o.materials)}
COLORS / FINISHES: ${list(o.finishes)}
GEMSTONES: ${list(o.gemstones)}
CUTS: ${list(o.cuts)}
CHAIN STYLES: ${list(o.chainStyles ?? [])}
CLASPS: ${list(o.clasps ?? [])}
FONTS (name pendants): ${list(o.fonts ?? [])}

SERVICES:
${services}

CATALOG:
${products}

FREQUENTLY ASKED QUESTIONS:
${faqs}

POLICIES:
${kb.policies}`;
}

/** The JSON shape the model must answer with (Gemini structured output). */
export const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    quickReplies: { type: "array", items: { type: "string" }, maxItems: 5 },
    referToOwner: { type: "boolean" },
    draftKind: { type: "string", enum: ["none", "custom_order", "service_request"] },
    custom: {
      type: "object",
      properties: {
        productType: { type: "string" },
        style: { type: "string" },
        material: { type: "string" },
        finish: { type: "string" },
        gemstone: { type: "string" },
        cut: { type: "string" },
        stoneQuantity: { type: "integer" },
        size: { type: "string" },
        chainStyle: { type: "string" },
        clasp: { type: "string" },
        nameText: { type: "string" },
        font: { type: "string" },
        styleText: { type: "string" },
        notes: { type: "string" },
      },
    },
    service: {
      type: "object",
      properties: {
        itemType: { type: "string", enum: ["jewelry", "watch"] },
        itemDescription: { type: "string" },
        brandModel: { type: "string" },
        material: { type: "string" },
        services: { type: "array", items: { type: "string" } },
        details: { type: "string" },
      },
    },
  },
  required: ["reply", "referToOwner", "draftKind"],
} as const;
