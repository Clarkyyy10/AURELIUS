// Seed transactions covering EVERY status of each status machine (frontend-spec §8), so every
// screen can be demonstrated right away.

import { estimate } from "@/lib/pricing/estimate";
import { designLabels } from "@/lib/pricing/labels";
import type {
  Actor,
  AnyStatus,
  AppNotification,
  CustomizationOptions,
  CustomOrderRequest,
  DesignConfig,
  HistoryEntry,
  Payment,
  Product,
  ProductOrder,
  Quotation,
  ServiceRequest,
} from "@/types";
import { JOSE_ID, MARIA_ID, OWNER_ID, placeholder } from "./catalog";

const DAY = 86_400_000;

function makeHistory(start: Date, steps: [AnyStatus, Actor, string?][]): HistoryEntry[] {
  return steps.map(([status, by, note], i) => ({ status, by, note, at: new Date(start.getTime() + i * DAY).toISOString() }));
}

const ownerSteps = (...s: AnyStatus[]): [AnyStatus, Actor][] => s.map((x) => [x, "owner"]);

function quotation(at: Date, finalPrice: number, downPaymentRequired: number, expectedInDays: number, extra: Partial<Quotation> = {}): Quotation {
  return {
    id: `q-${Math.round(at.getTime() / 1000)}-${finalPrice}`,
    issuedAt: at.toISOString(),
    finalPrice,
    downPaymentRequired,
    expectedDate: new Date(at.getTime() + expectedInDays * DAY).toISOString().slice(0, 10),
    ...extra,
  };
}

let paymentSeq = 0;
function payment(at: Date, p: Partial<Payment> & Pick<Payment, "kind" | "amount" | "status">): Payment {
  paymentSeq++;
  return {
    id: `pay-seed-${paymentSeq}`,
    paidOn: at.toISOString().slice(0, 10),
    referenceNumber: `GC${String(9_100_000_000 + paymentSeq * 7919).slice(0, 10)}`,
    method: "gcash",
    recordedBy: "customer",
    proofFile: { name: "gcash-receipt.png", type: "image/png", sizeBytes: 182_000, dataUrl: "/placeholders/receipt.svg" },
    createdAt: at.toISOString(),
    ...p,
    ...(p.status === "verified" ? { verifiedAt: new Date(at.getTime() + DAY / 2).toISOString() } : {}),
  };
}

const lastAt = (h: HistoryEntry[]) => new Date(h[h.length - 1].at);
const stepAt = (h: HistoryEntry[], status: AnyStatus) => new Date(h.find((x) => x.status === status)!.at);

// ---------------------------------------------------------------- Product orders
export function seedOrders(now: Date, products: Product[]): ProductOrder[] {
  const byName = (n: string) => products.find((p) => p.name === n)!;
  const year = now.getFullYear();
  let seq = 0;

  const make = (
    productName: string,
    customerId: string,
    daysAgo: number,
    steps: [AnyStatus, Actor, string?][],
    fill: (h: HistoryEntry[], price: number) => Partial<ProductOrder> = () => ({}),
    quantity = 1,
  ): ProductOrder => {
    seq++;
    const p = byName(productName);
    const start = new Date(now.getTime() - daysAgo * DAY);
    const history = makeHistory(start, steps);
    return {
      kind: "order",
      id: `ord-${seq}`,
      code: `OR-${year}-${String(seq).padStart(4, "0")}`,
      customerId,
      productId: p.id,
      productSnapshot: { name: p.name, price: p.price, photo: p.photos[0] },
      quantity,
      payments: [],
      history,
      status: history[history.length - 1].status as ProductOrder["status"],
      createdAt: start.toISOString(),
      updatedAt: lastAt(history).toISOString(),
      ...fill(history, p.price * quantity),
    };
  };

  const quotedAt = (h: HistoryEntry[]) => stepAt(h, "quoted");

  return [
    make("Box Chain Necklace", MARIA_ID, 1, [["pending", "customer"]], () => ({ notes: "Please check that the clasp is secure." })),
    make("Pearl Drop Earrings", MARIA_ID, 3, [["pending", "customer"], ...ownerSteps("quoted")], (h, price) => ({
      quotation: quotation(quotedAt(h), price, Math.round(price * 0.3), 3, { notes: "In stock. Pay the down payment to reserve." }),
    })),
    make("Classic Cuff Bracelet", MARIA_ID, 5, [["pending", "customer"], ["quoted", "owner"], ["awaiting_payment", "customer"]], (h, price) => {
      const q = quotation(quotedAt(h), price, 500, 4);
      q.response = { decision: "accepted", at: lastAt(h).toISOString() };
      return { quotation: q, payments: [payment(lastAt(h), { kind: "down_payment", amount: 500, status: "pending_verification" })] };
    }),
    make("Heirloom Signet Ring", JOSE_ID, 8, [["pending", "customer"], ["quoted", "owner"], ["awaiting_payment", "customer"], ["confirmed", "owner", "Down payment verified."]], (h, price) => {
      const q = quotation(quotedAt(h), price, 1000, 5);
      q.response = { decision: "accepted", at: stepAt(h, "awaiting_payment").toISOString() };
      return { quotation: q, payments: [payment(stepAt(h, "awaiting_payment"), { kind: "down_payment", amount: 1000, status: "verified" })] };
    }),
    make("Sampaguita Pendant", MARIA_ID, 12, [["pending", "customer"], ["quoted", "owner"], ["awaiting_payment", "customer"], ["confirmed", "owner"], ["in_production", "owner", "Adding a longer chain as requested."]], (h, price) => {
      const q = quotation(quotedAt(h), price + 800, 4000, 10, { notes: "Includes a 20-inch chain instead of 18-inch (+₱800)." });
      q.response = { decision: "accepted", at: stepAt(h, "awaiting_payment").toISOString() };
      return { quotation: q, payments: [payment(stepAt(h, "awaiting_payment"), { kind: "down_payment", amount: 4000, status: "verified" })] };
    }),
    make("Classic Solitaire Ring", MARIA_ID, 15, [["pending", "customer"], ["quoted", "owner"], ["awaiting_payment", "customer"], ["confirmed", "owner"], ["ready_for_claiming", "owner"]], (h, price) => {
      const q = quotation(quotedAt(h), price, 7500, 7);
      q.response = { decision: "accepted", at: stepAt(h, "awaiting_payment").toISOString() };
      return { quotation: q, payments: [payment(stepAt(h, "awaiting_payment"), { kind: "down_payment", amount: 7500, status: "verified" })] };
    }),
    make("Rope Chain Necklace", JOSE_ID, 30, [["pending", "customer"], ["quoted", "owner"], ["awaiting_payment", "customer"], ["confirmed", "owner"], ["ready_for_claiming", "owner"], ["completed", "owner", "Claimed and fully paid."]], (h, price) => {
      const q = quotation(quotedAt(h), price, 10000, 7);
      q.response = { decision: "accepted", at: stepAt(h, "awaiting_payment").toISOString() };
      return {
        quotation: q,
        payments: [
          payment(stepAt(h, "awaiting_payment"), { kind: "down_payment", amount: 10000, status: "verified" }),
          payment(lastAt(h), { kind: "balance", amount: price - 10000, status: "verified", method: "cash_in_store", referenceNumber: "CASH-IN-STORE", recordedBy: "owner", proofFile: undefined }),
        ],
      };
    }),
    make("Box Chain Necklace", MARIA_ID, 20, [["pending", "customer"], ["quoted", "owner"], ["declined", "customer", "I found a different design."]], (h, price) => {
      const q = quotation(quotedAt(h), price, 900, 3);
      q.response = { decision: "declined", at: lastAt(h).toISOString(), reason: "I found a different design." };
      return { quotation: q };
    }),
    make("Pearl Drop Earrings", JOSE_ID, 25, [["pending", "customer"], ["rejected", "owner", "This item sold out before your order was reviewed."]], () => ({
      rejectionReason: "This item sold out before your order was reviewed.",
    })),
    make("Heirloom Signet Ring", MARIA_ID, 18, [["pending", "customer"], ["cancelled", "customer", "Ordered by mistake."]]),
  ];
}

// ---------------------------------------------------------------- Custom order requests
export function seedCustomOrders(now: Date, options: CustomizationOptions): CustomOrderRequest[] {
  const year = now.getFullYear();
  let seq = 0;

  const cfg = (c: Partial<DesignConfig> & Pick<DesignConfig, "productType" | "sizeId">): DesignConfig => ({
    materialId: "mat-18k",
    finishId: "fin-yellow",
    gemstoneId: "gem-none",
    cutId: null,
    stoneQuantity: 0,
    ...c,
  });
  const tone = (c: DesignConfig) => (c.materialId === "mat-silver" || c.materialId === "mat-steel" ? "silver" : c.finishId === "fin-rose" ? "rose" : "gold");

  const version = (n: number, config: DesignConfig, at: Date) => {
    const e = estimate(config, options);
    return {
      version: n,
      config,
      estimate: { weightG: e.weightG, price: e.price },
      labels: designLabels(config, options),
      snapshotDataUrl: placeholder(config.productType, tone(config)),
      submittedAt: at.toISOString(),
    };
  };

  const make = (
    customerId: string,
    daysAgo: number,
    configs: DesignConfig[],
    steps: [AnyStatus, Actor, string?][],
    fill: (h: HistoryEntry[], est: number) => Partial<CustomOrderRequest> = () => ({}),
    source: CustomOrderRequest["source"] = "customizer",
  ): CustomOrderRequest => {
    seq++;
    const start = new Date(now.getTime() - daysAgo * DAY);
    const history = makeHistory(start, steps);
    // versions: v1 at start, later versions at each customer resubmission (revision_requested → under_review by customer)
    const resubmits = history.filter((h, i) => h.status === "under_review" && h.by === "customer" && i > 0);
    const versions = configs.map((c, i) => version(i + 1, c, i === 0 ? start : new Date(resubmits[i - 1]?.at ?? start)));
    const est = versions[versions.length - 1].estimate.price;
    return {
      kind: "custom",
      id: `co-${seq}`,
      code: `CO-${year}-${String(seq).padStart(4, "0")}`,
      customerId,
      source,
      versions,
      revisionRemarks: [],
      payments: [],
      history,
      status: history[history.length - 1].status as CustomOrderRequest["status"],
      createdAt: start.toISOString(),
      updatedAt: lastAt(history).toISOString(),
      ...fill(history, est),
    };
  };

  const ring = (c: Partial<DesignConfig> = {}) => cfg({ productType: "ring", sizeId: "size-ring-us7", ...c });
  const solitaire = ring({ gemstoneId: "gem-diamond", cutId: "cut-round", stoneQuantity: 1 });
  const remarks = (h: HistoryEntry[], text: string) => [{ at: stepAt(h, "revision_requested").toISOString(), text }];
  const quoted = (h: HistoryEntry[], price: number, dp: number, days: number, accepted?: "accepted" | "declined") => {
    const q = quotation(stepAt(h, "quoted"), price, dp, days, { notes: "Final price includes setting and polishing." });
    if (accepted) q.response = { decision: accepted, at: new Date(stepAt(h, "quoted").getTime() + DAY).toISOString(), ...(accepted === "declined" ? { reason: "The price is above my budget." } : {}) };
    return q;
  };
  const afterAccept: [AnyStatus, Actor][] = [["submitted", "customer"], ["under_review", "owner"], ["approved", "owner"], ["quoted", "owner"], ["awaiting_payment", "customer"]];
  const dpPaid = (h: HistoryEntry[], amount: number) => payment(stepAt(h, "awaiting_payment"), { kind: "down_payment", amount, status: "verified" });

  return [
    make(MARIA_ID, 0.2, [cfg({ productType: "pendant", sizeId: "size-pendant-medium", materialId: "mat-14k", finishId: "fin-rose", gemstoneId: "gem-ruby", cutId: "cut-pear", stoneQuantity: 1, engravingText: "Lola" })], [["submitted", "customer"]], () => ({}), "chatbot"),
    make(JOSE_ID, 2, [ring({ materialId: "mat-silver", finishId: "fin-oxidized", sizeId: "size-ring-us10" })], [["submitted", "customer"], ["under_review", "owner"]]),
    make(MARIA_ID, 4, [ring({ finishId: "fin-white", gemstoneId: "gem-sapphire", cutId: "cut-oval", stoneQuantity: 3, sizeId: "size-ring-us6" })], [["submitted", "customer"], ["under_review", "owner"], ["revision_requested", "owner"]], (h) => ({
      revisionRemarks: remarks(h, "Three oval sapphires won't fit well on a US 6 band. Please choose 1 stone, or change to round cut so they sit closer together."),
    })),
    make(MARIA_ID, 9, [ring({ gemstoneId: "gem-emerald", cutId: "cut-princess", stoneQuantity: 5 }), ring({ gemstoneId: "gem-emerald", cutId: "cut-round", stoneQuantity: 3 })], [["submitted", "customer"], ["under_review", "owner"], ["revision_requested", "owner"], ["under_review", "customer", "Version 2 submitted."], ["approved", "owner"]], (h) => ({
      revisionRemarks: remarks(h, "Five princess-cut emeralds make the band too crowded. Please try 3 round stones."),
    })),
    make(JOSE_ID, 10, [cfg({ productType: "bracelet", sizeId: "size-bracelet-7_5in", materialId: "mat-14k" })], [["submitted", "customer"], ["under_review", "owner"], ["approved", "owner"], ["quoted", "owner"]], (h, est) => ({ quotation: quoted(h, est + 1500, Math.round((est + 1500) * 0.5), 21) })),
    make(MARIA_ID, 12, [solitaire], afterAccept, (h, est) => ({ quotation: quoted(h, est, 12000, 14, "accepted") })),
    make(JOSE_ID, 16, [cfg({ productType: "earrings", sizeId: "size-earrings-medium", materialId: "mat-14k", gemstoneId: "gem-cz", cutId: "cut-round", stoneQuantity: 2 })], [...afterAccept, ["confirmed", "owner", "Down payment verified."]], (h, est) => ({
      quotation: quoted(h, est, 4000, 14, "accepted"),
      payments: [dpPaid(h, 4000)],
    })),
    make(MARIA_ID, 20, [cfg({ productType: "necklace", sizeId: "size-necklace-18in", finishId: "fin-rose" })], [...afterAccept, ["confirmed", "owner"], ["in_production", "owner"]], (h, est) => ({
      quotation: quoted(h, est, 15000, 21, "accepted"),
      payments: [dpPaid(h, 15000)],
    })),
    make(MARIA_ID, 28, [ring({ materialId: "mat-14k", gemstoneId: "gem-ruby", cutId: "cut-oval", stoneQuantity: 1, engravingText: "M & J" })], [...afterAccept, ["confirmed", "owner"], ["in_production", "owner"], ["ready_for_claiming", "owner"]], (h, est) => ({
      quotation: quoted(h, est, 6000, 14, "accepted"),
      payments: [dpPaid(h, 6000)],
    }), "catalog"),
    make(JOSE_ID, 45, [cfg({ productType: "pendant", sizeId: "size-pendant-large", materialId: "mat-silver", finishId: "fin-polished", gemstoneId: "gem-cz", cutId: "cut-round", stoneQuantity: 3 })], [...afterAccept, ["confirmed", "owner"], ["in_production", "owner"], ["ready_for_claiming", "owner"], ["completed", "owner", "Claimed and fully paid."]], (h, est) => ({
      quotation: quoted(h, est, 1500, 10, "accepted"),
      payments: [dpPaid(h, 1500), payment(lastAt(h), { kind: "balance", amount: est - 1500, status: "verified", method: "cash_in_store", referenceNumber: "CASH-IN-STORE", recordedBy: "owner", proofFile: undefined })],
    })),
    make(MARIA_ID, 35, [cfg({ productType: "bracelet", sizeId: "size-bracelet-7in" })], [["submitted", "customer"], ["under_review", "owner"], ["approved", "owner"], ["quoted", "owner"], ["declined", "customer", "The price is above my budget."]], (h, est) => ({ quotation: quoted(h, est, 20000, 21, "declined") })),
    make(JOSE_ID, 40, [ring({ materialId: "mat-steel", finishId: "fin-black", gemstoneId: "gem-diamond", cutId: "cut-round", stoneQuantity: 5 })], [["submitted", "customer"], ["under_review", "owner"], ["rejected", "owner", "We can't set lab diamonds on stainless steel bands safely."]], () => ({
      rejectionReason: "We can't set lab diamonds on stainless steel bands safely.",
    })),
    make(MARIA_ID, 22, [cfg({ productType: "earrings", sizeId: "size-earrings-small", materialId: "mat-silver", finishId: "fin-gold-plated" })], [["submitted", "customer"], ["cancelled", "customer", "I changed my mind."]]),
  ];
}

// ---------------------------------------------------------------- Service requests
export function seedServiceRequests(now: Date): ServiceRequest[] {
  const year = now.getFullYear();
  let seq = 0;
  const make = (
    customerId: string,
    daysAgo: number,
    item: Pick<ServiceRequest, "itemType" | "itemDescription" | "serviceIds" | "details"> & Partial<ServiceRequest>,
    steps: [AnyStatus, Actor, string?][],
    fill: (h: HistoryEntry[]) => Partial<ServiceRequest> = () => ({}),
  ): ServiceRequest => {
    seq++;
    const start = new Date(now.getTime() - daysAgo * DAY);
    const history = makeHistory(start, steps);
    return {
      kind: "service",
      id: `sr-${seq}`,
      code: `SR-${year}-${String(seq).padStart(4, "0")}`,
      customerId,
      photos: [],
      source: "form",
      payments: [],
      history,
      status: history[history.length - 1].status as ServiceRequest["status"],
      createdAt: start.toISOString(),
      updatedAt: lastAt(history).toISOString(),
      ...item,
      ...fill(history),
    };
  };
  const q = (h: HistoryEntry[], price: number, dp: number, days: number, procedure: string, decision?: "accepted" | "declined") => {
    const quote = quotation(stepAt(h, "quoted"), price, dp, days, { procedure });
    if (decision) quote.response = { decision, at: new Date(stepAt(h, "quoted").getTime() + DAY).toISOString() };
    return quote;
  };
  const dropOff = (h: HistoryEntry[], amount: number): Payment =>
    payment(stepAt(h, "received"), { kind: "down_payment", amount, status: "verified", method: "cash_in_store", referenceNumber: "CASH-IN-STORE", recordedBy: "owner", proofFile: undefined });

  const watch = { itemType: "watch" as const, itemDescription: "Seiko 5 automatic watch, stainless steel", brandModel: "Seiko 5 SNK809", serviceIds: ["svc-battery", "svc-cleaning"], details: "The watch stopped and the glass is cloudy inside." };
  const ringResize = { itemType: "jewelry" as const, itemDescription: "18K gold wedding band, plain", material: "18K Gold", serviceIds: ["svc-resizing"], details: "Please make it one size bigger, from US 7 to US 8." };
  const accepted: [AnyStatus, Actor][] = [["submitted", "customer"], ["under_assessment", "owner"], ["quoted", "owner"], ["awaiting_drop_off", "customer"], ["received", "owner"]];

  return [
    make(MARIA_ID, 0.3, { itemType: "jewelry", itemDescription: "Silver chain bracelet with broken clasp", material: "Sterling Silver 925", serviceIds: ["svc-repair"], details: "The lobster clasp broke off. I still have the clasp.", source: "chatbot" }, [["submitted", "customer"]]),
    make(JOSE_ID, 2, watch, [["submitted", "customer"], ["under_assessment", "owner"]]),
    make(MARIA_ID, 3, ringResize, [["submitted", "customer"], ["under_assessment", "owner"], ["quoted", "owner"]], (h) => ({ quotation: q(h, 1200, 500, 5, "Cut the band, add 18K gold, solder, and polish.") })),
    make(MARIA_ID, 5, { itemType: "jewelry", itemDescription: "Gold pendant with a loose stone", material: "14K Gold", serviceIds: ["svc-stone-setting", "svc-polishing"], details: "The center stone moves when I touch it.", preferredDropOffDate: new Date(now.getTime() + 2 * DAY).toISOString().slice(0, 10) }, [["submitted", "customer"], ["under_assessment", "owner"], ["quoted", "owner"], ["awaiting_drop_off", "customer"]], (h) => ({ quotation: q(h, 800, 300, 3, "Tighten all prongs, then polish.", "accepted") })),
    make(JOSE_ID, 7, { itemType: "watch", itemDescription: "Casio quartz watch with worn leather strap", brandModel: "Casio MTP-V002", serviceIds: ["svc-strap"], details: "Please replace with a brown leather strap." }, accepted, (h) => ({
      quotation: q(h, 650, 200, 2, "Replace the strap with brown leather, 20 mm.", "accepted"),
      droppedOffAt: stepAt(h, "received").toISOString(),
      payments: [dropOff(h, 200)],
    })),
    make(MARIA_ID, 9, { itemType: "jewelry", itemDescription: "Old family necklace, tarnished and dull", material: "Sterling Silver 925", serviceIds: ["svc-restoration", "svc-ultrasonic"], details: "This was my grandmother's. I want it to look new but keep the design." }, [...accepted, ["in_progress", "owner"]], (h) => ({
      quotation: q(h, 1800, 800, 7, "Ultrasonic clean, remove tarnish, repair two weak links, polish.", "accepted"),
      droppedOffAt: stepAt(h, "received").toISOString(),
      payments: [dropOff(h, 800)],
    })),
    make(JOSE_ID, 12, { itemType: "jewelry", itemDescription: "Silver ring to be gold plated", material: "Sterling Silver 925", serviceIds: ["svc-plating"], details: "Please plate it in yellow gold." }, [...accepted, ["in_progress", "owner"], ["completed", "owner"]], (h) => ({
      quotation: q(h, 950, 400, 5, "Clean, then yellow gold plating.", "accepted"),
      droppedOffAt: stepAt(h, "received").toISOString(),
      payments: [dropOff(h, 400)],
    })),
    make(MARIA_ID, 14, { ...watch, itemDescription: "Citizen quartz watch, gold tone", brandModel: "Citizen BI5000", serviceIds: ["svc-battery"], details: "Battery is dead." }, [...accepted, ["in_progress", "owner"], ["completed", "owner"], ["ready_for_claiming", "owner"]], (h) => ({
      quotation: q(h, 450, 150, 1, "Replace battery and check water seal.", "accepted"),
      droppedOffAt: stepAt(h, "received").toISOString(),
      payments: [dropOff(h, 150)],
    })),
    make(JOSE_ID, 30, { itemType: "jewelry", itemDescription: "Engrave initials on a men's ring", material: "Stainless Steel", serviceIds: ["svc-engraving"], details: "Engrave “J.R.” on the inside of the band." }, [...accepted, ["in_progress", "owner"], ["completed", "owner"], ["ready_for_claiming", "owner"], ["claimed", "owner", "Balance settled in store."]], (h) => ({
      quotation: q(h, 350, 100, 2, "Hand-engrave the initials on the inside of the band.", "accepted"),
      droppedOffAt: stepAt(h, "received").toISOString(),
      payments: [dropOff(h, 100), payment(lastAt(h), { kind: "balance", amount: 250, status: "verified", method: "cash_in_store", referenceNumber: "CASH-IN-STORE", recordedBy: "owner", proofFile: undefined })],
    })),
    make(MARIA_ID, 25, { itemType: "jewelry", itemDescription: "Gold bracelet to be cast in a new design", material: "18K Gold", serviceIds: ["svc-casting"], details: "Melt and recast into two smaller rings." }, [["submitted", "customer"], ["under_assessment", "owner"], ["quoted", "owner"], ["declined", "customer"]], (h) => ({ quotation: q(h, 6500, 3000, 14, "Melt, cast two rings in US 6 and US 8, polish.", "declined") })),
    make(MARIA_ID, 21, { itemType: "jewelry", itemDescription: "Pearl earrings for cleaning", serviceIds: ["svc-cleaning"], details: "They look a bit yellow." }, [["submitted", "customer"], ["cancelled", "customer", "I'll bring them next month instead."]]),
  ];
}

// ---------------------------------------------------------------- Notifications
export function seedNotifications(now: Date): AppNotification[] {
  const at = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3_600_000).toISOString();
  const y = now.getFullYear();
  return [
    { id: "n-1", userId: OWNER_ID, type: "new_custom_request", title: "New custom order request", body: `Maria Santos submitted a pendant design (CO-${y}-0001).`, link: "/admin/custom-requests/co-1", channels: ["in_app"], read: false, createdAt: at(4) },
    { id: "n-2", userId: OWNER_ID, type: "new_service_request", title: "New service request", body: `Maria Santos asked for a clasp repair (SR-${y}-0001).`, link: "/admin/service-requests/sr-1", channels: ["in_app"], read: false, createdAt: at(7) },
    { id: "n-3", userId: OWNER_ID, type: "payment_submitted", title: "Payment to verify", body: `Maria Santos submitted a ₱500 down payment for OR-${y}-0003.`, link: "/admin/payments", channels: ["in_app"], read: false, createdAt: at(30) },
    { id: "n-4", userId: OWNER_ID, type: "new_order", title: "New order", body: `Maria Santos ordered a Box Chain Necklace (OR-${y}-0001).`, link: "/admin/orders/ord-1", channels: ["in_app"], read: true, createdAt: at(24) },
    { id: "n-5", userId: MARIA_ID, type: "revision_requested", title: "The owner asked for changes to your design", body: `Open CO-${y}-0003 to see the remarks and update your design.`, link: "/account/custom/co-3", channels: ["in_app", "email"], read: false, createdAt: at(50) },
    { id: "n-6", userId: MARIA_ID, type: "quotation_issued", title: "Your quotation is ready", body: `The owner sent a quotation for your resizing request (SR-${y}-0003).`, link: "/account/services/sr-3", channels: ["in_app", "email"], read: false, createdAt: at(26) },
    { id: "n-7", userId: MARIA_ID, type: "ready_for_claiming", title: "Your item is ready for claiming", body: `Your Citizen watch (SR-${y}-0008) is ready. Visit the store to claim it.`, link: "/account/services/sr-8", channels: ["in_app", "email"], read: true, createdAt: at(80) },
  ];
}
