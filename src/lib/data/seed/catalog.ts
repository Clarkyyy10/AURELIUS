// Seed catalog, services, FAQs, settings and demo accounts — docs/frontend-spec.md §8.

import type { FaqEntry, Product, ProductType, ServiceCatalogItem, StoreSettings, UserProfile } from "@/types";

export const OWNER_ID = "user-owner";
export const MARIA_ID = "user-maria";
export const JOSE_ID = "user-jose";
export const ANA_ID = "user-ana";

export function seedUsers(now: Date): UserProfile[] {
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();
  return [
    { id: OWNER_ID, role: "owner", fullName: "Store Owner", email: "owner@afables.ph", contactNumber: "09171234500", emailVerified: true, privacyConsentAt: daysAgo(120), createdAt: daysAgo(120) },
    { id: MARIA_ID, role: "customer", fullName: "Maria Santos", email: "maria@demo.ph", contactNumber: "09171234567", emailVerified: true, privacyConsentAt: daysAgo(60), createdAt: daysAgo(60) },
    { id: JOSE_ID, role: "customer", fullName: "Jose Reyes", email: "jose@demo.ph", contactNumber: "09181234567", emailVerified: true, privacyConsentAt: daysAgo(45), createdAt: daysAgo(45) },
    { id: ANA_ID, role: "customer", fullName: "Ana Cruz", email: "ana@demo.ph", contactNumber: "09191234567", emailVerified: false, privacyConsentAt: daysAgo(2), createdAt: daysAgo(2) },
  ];
}

export const seedSettings: StoreSettings = {
  storeName: "Afable's Jewelry Store",
  address: "Montalban Public Market, Rodriguez, Rizal",
  contactNumber: "09171234500",
  email: "hello@afables.ph",
  openingHours: "Monday to Saturday, 8:00 AM – 6:00 PM. Sunday, 9:00 AM – 3:00 PM.",
  paymentInstructions:
    "GCash: Afable's Jewelry Store · 0917 123 4500\nBank transfer (BDO): Afable's Jewelry Store · Account no. 0012 3456 7890\nAfter paying, upload a screenshot or photo of your receipt with the reference number.",
  claimingNote: "Items are claimed and balances settled in the store.",
};

export function placeholder(category: ProductType, tone: "gold" | "silver" | "rose" = "gold"): string {
  return `/placeholders/${category}-${tone}.svg`;
}

type P = [name: string, category: ProductType, material: string, price: number, availability: Product["availability"], tone: "gold" | "silver" | "rose", description: string, hidden?: boolean];

/** 3D appearance of each seed product (materials, finishes, stones from data-model.md §3). */
const designs: Record<string, Product["design"]> = {
  "Classic Solitaire Ring": { materialId: "mat-18k", finishId: "fin-yellow", gemstoneId: "gem-diamond", cutId: "cut-round", stoneQuantity: 1, choices: { style: "style-ring-solitaire", setting: "setting-all-prong", shank: "shank-ring-straight" } },
  "Sampaguita Pendant": { materialId: "mat-14k", finishId: "fin-yellow", gemstoneId: "gem-cz", cutId: "cut-round", stoneQuantity: 1, choices: { style: "style-pendant-solitaire" } },
  "Rope Chain Necklace": { materialId: "mat-18k", finishId: "fin-yellow", chainStyleId: "chain-rope", claspId: "clasp-lobster", choices: { style: "style-necklace-chain" } },
  "Eternity Band Ring": { materialId: "mat-14k", finishId: "fin-white", gemstoneId: "gem-cz", cutId: "cut-round", stoneQuantity: 16, choices: { style: "style-ring-eternity", setting: "setting-ring-channel", profile: "profile-ring-flat" } },
  "Pearl Drop Earrings": { materialId: "mat-silver", finishId: "fin-polished", gemstoneId: "gem-pearl", stoneQuantity: 2, choices: { style: "style-earrings-drop" } },
  "Tennis Bracelet": { materialId: "mat-silver", finishId: "fin-polished", gemstoneId: "gem-cz", cutId: "cut-round", stoneQuantity: 22, choices: { style: "style-bracelet-tennis" } },
  "Heirloom Signet Ring": { materialId: "mat-silver", finishId: "fin-oxidized", choices: { style: "style-ring-signet", profile: "profile-ring-d_shape" }, styleText: "JA", fontId: "font-cinzel" },
  "Rose Gold Heart Pendant": { materialId: "mat-18k", finishId: "fin-rose", choices: { style: "style-pendant-heart" } },
  "Box Chain Necklace": { materialId: "mat-silver", finishId: "fin-polished", chainStyleId: "chain-box", claspId: "clasp-lobster", choices: { style: "style-necklace-chain" } },
  "Classic Cuff Bracelet": { materialId: "mat-steel", finishId: "fin-silver-tone", choices: { style: "style-bracelet-cuff", texture: "texture-all-brushed" } },
  "Sapphire Stud Earrings": { materialId: "mat-14k", finishId: "fin-yellow", gemstoneId: "gem-sapphire", cutId: "cut-round", stoneQuantity: 2, choices: { style: "style-earrings-stud", setting: "setting-all-prong" } },
  "Filigree Bangle": { materialId: "mat-silver", finishId: "fin-oxidized", choices: { style: "style-bracelet-bangle", texture: "texture-all-florentine" } },
  "Personalized Name Pendant": { materialId: "mat-14k", finishId: "fin-yellow", nameText: "Maria", fontId: "font-great-vibes" },
};

const products: P[] = [
  ["Classic Solitaire Ring", "ring", "18K Gold", 24500, "available", "gold", "A single lab-grown diamond held in a four-prong setting on a slim 18K gold band. Simple, timeless, and made to be worn every day."],
  ["Sampaguita Pendant", "pendant", "14K Gold", 12800, "available", "gold", "A small pendant shaped like the sampaguita flower, with five soft petals and a cubic zirconia center. Comes with an 18-inch chain."],
  ["Rope Chain Necklace", "necklace", "18K Gold", 38000, "available", "gold", "A classic twisted rope chain in solid 18K gold. Strong, bright, and easy to wear alone or with a pendant."],
  ["Eternity Band Ring", "ring", "14K Gold", 18900, "made_to_order", "gold", "A band set with small stones all the way around. Made to your ring size, so please allow time for production."],
  ["Pearl Drop Earrings", "earrings", "Sterling Silver 925", 2450, "available", "silver", "Freshwater pearls hanging from polished sterling silver hooks. Light enough for all-day wear."],
  ["Tennis Bracelet", "bracelet", "Sterling Silver 925", 5800, "made_to_order", "silver", "A line of cubic zirconia stones in a flexible sterling silver setting, made to your wrist size."],
  ["Heirloom Signet Ring", "ring", "Sterling Silver 925", 3200, "available", "silver", "A flat-top signet ring in sterling silver. Ask us to engrave initials on the face."],
  ["Rose Gold Heart Pendant", "pendant", "18K Gold", 15600, "unavailable", "rose", "A puffed heart pendant in rose-finished 18K gold. Currently out of stock — you can design something similar."],
  ["Box Chain Necklace", "necklace", "Sterling Silver 925", 2900, "available", "silver", "A smooth box chain in sterling silver with a secure lobster clasp. 18 inches long."],
  ["Classic Cuff Bracelet", "bracelet", "Stainless Steel", 1650, "available", "silver", "An open cuff in brushed stainless steel. Does not tarnish and is easy to adjust."],
  ["Sapphire Stud Earrings", "earrings", "14K Gold", 9750, "made_to_order", "gold", "Lab sapphire studs in a four-prong 14K gold setting. Made to order in about two weeks."],
  ["Filigree Bangle", "bracelet", "Sterling Silver 925", 4300, "unavailable", "silver", "A hand-finished filigree bangle. Hidden from the shop until new stock arrives.", true],
  ["Personalized Name Pendant", "name_pendant", "14K Gold", 12500, "made_to_order", "gold", "Your name (or a loved one's) cut in solid gold or silver. Choose the font and size in the 3D customizer — the owner confirms the final price."],
];

export function seedProducts(now: Date): Product[] {
  return products.map(([name, category, material, price, availability, tone, description, hidden], i) => {
    const created = new Date(now.getTime() - (90 - i * 5) * 86_400_000).toISOString();
    return {
      id: `prod-${i + 1}`,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      name,
      description,
      category,
      material,
      price,
      photos: [placeholder(category, tone)],
      design: designs[name],
      availability,
      hidden: Boolean(hidden),
      createdAt: created,
      updatedAt: created,
    };
  });
}

type S = [id: string, name: string, icon: string, appliesTo: ServiceCatalogItem["appliesTo"], description: string];

const services: S[] = [
  ["svc-cleaning", "Cleaning", "sparkles", ["jewelry", "watch"], "We clean your jewelry or watch case by hand to remove dirt, oils, and dullness. Best for pieces you wear every day."],
  ["svc-polishing", "Polishing", "wand", ["jewelry", "watch"], "We polish away light scratches and bring back the shine of gold and silver. Deep scratches may need restoration instead."],
  ["svc-resizing", "Resizing", "ruler", ["jewelry"], "We make rings bigger or smaller to fit you comfortably. Some designs, like full eternity bands, can only change a little."],
  ["svc-repair", "Repair", "wrench", ["jewelry", "watch"], "We fix broken chains, clasps, prongs, and links. Bring the piece in so we can check what it needs."],
  ["svc-stone-setting", "Stone Setting", "gem", ["jewelry"], "We set new stones or tighten loose ones so they don't fall out. You can bring your own stone or choose one of ours."],
  ["svc-restoration", "Restoration", "history", ["jewelry"], "We restore old or damaged pieces close to their original look. Good for heirlooms and family pieces."],
  ["svc-engraving", "Engraving", "pen-tool", ["jewelry", "watch"], "We engrave names, dates, or short messages on rings, pendants, and watch backs. Up to 20 characters fit on most rings."],
  ["svc-casting", "Casting", "flame", ["jewelry"], "We cast new pieces from your design or from a model. The owner confirms the metal weight and price after review."],
  ["svc-plating", "Plating", "paint-bucket", ["jewelry", "watch"], "We plate silver or steel pieces with a thin layer of gold or rhodium. Plating wears over time and can be redone."],
  ["svc-ultrasonic", "Ultrasonic Cleaning", "waves", ["jewelry"], "We use an ultrasonic machine to clean hard-to-reach spots in detailed pieces. Not suitable for pearls, opals, or emeralds."],
  ["svc-battery", "Watch Battery Replacement", "battery", ["watch"], "We open your watch, replace the battery, and check that it is running. Most replacements are done while you wait."],
  ["svc-strap", "Watch Strap Replacement", "watch", ["watch"], "We replace leather, rubber, or metal straps and bracelets. Bring your watch so we can match the lug size."],
];

export function seedServices(): ServiceCatalogItem[] {
  return services.map(([id, name, icon, appliesTo, description], i) => ({ id, name, icon, appliesTo, description, hidden: false, sortOrder: i }));
}

type F = [question: string, answer: string, keywords: string[]];

const faqs: F[] = [
  ["What are your store hours?", "We are open Monday to Saturday, 8:00 AM to 6:00 PM, and Sunday, 9:00 AM to 3:00 PM.", ["hours", "open", "close", "time", "schedule"]],
  ["Where is the store?", "We are inside Montalban Public Market, Rodriguez, Rizal. Ask any vendor for Afable's Jewelry Store.", ["where", "location", "address", "located", "directions", "market"]],
  ["What payment methods do you accept?", "You can pay through GCash or bank transfer and upload your receipt in your account. Cash is accepted in the store.", ["payment", "pay", "gcash", "bank", "cash", "methods"]],
  ["Do I need to pay a down payment?", "For custom orders and some services, the owner asks for a down payment in the quotation. The amount is shown before you accept.", ["down payment", "deposit", "downpayment", "advance"]],
  ["How do I claim my item?", "When your item is ready, we will notify you. Visit the store to claim it and settle any remaining balance.", ["claim", "pick up", "pickup", "collect", "ready"]],
  ["How do custom orders work?", "Design your piece in the 3D customizer and submit it. The owner reviews it, may ask for changes, and then sends a quotation with the final price and date.", ["custom", "design", "customize", "made to order", "how"]],
  ["How long does a custom order take?", "It depends on the design. The owner gives the expected date in the quotation.", ["how long", "long", "days", "weeks", "when", "finish", "duration"]],
  ["What services do you offer?", "We offer cleaning, polishing, resizing, repair, stone setting, restoration, engraving, casting, plating, ultrasonic cleaning, and watch battery and strap replacement.", ["services", "offer", "repair", "fix"]],
  ["Do you replace watch batteries?", "Yes. Most watch battery replacements are done while you wait. Bring your watch to the store.", ["battery", "watch battery", "watch"]],
  ["How often should I clean my jewelry?", "For pieces you wear every day, a professional cleaning every 3 to 6 months keeps them bright.", ["clean", "cleaning", "often", "maintenance"]],
  ["What gemstones can I choose?", "In the customizer you can choose cubic zirconia, lab ruby, lab sapphire, lab emerald, and lab-grown diamond, in round, oval, princess, or pear cut.", ["gemstone", "gem", "stone", "diamond", "ruby", "sapphire", "emerald"]],
  ["Can I cancel my order?", "You can cancel in your account before the order is confirmed or work has started. After that, please contact the store.", ["cancel", "cancellation", "refund"]],
];

export function seedFaqs(): FaqEntry[] {
  return faqs.map(([question, answer, keywords], i) => ({ id: `faq-${i + 1}`, question, answer, keywords, active: true }));
}

export const seedPolicies =
  "Estimates in the customizer are not final prices. The owner confirms the final price, down payment, and completion date in a quotation. Items are claimed in the store, where remaining balances are settled. Down payments for custom orders are used to buy materials.";
