import { beforeEach, describe, expect, it } from "vitest";
import { mockRepositories as repos } from "./repos";
import { createSeedState, useDemoStore } from "./store";
import type { DesignConfig } from "@/types";

const loginAs = (email: string) => repos.auth.login(email, "password123");
const state = () => useDemoStore.getState();
let n = 0;
const rid = () => `req-${++n}`;

beforeEach(() => {
  useDemoStore.setState({ ...createSeedState(), simulateErrors: false, version: 0, hydrated: true });
});

const ring: DesignConfig = {
  productType: "ring",
  materialId: "mat-18k",
  finishId: "fin-yellow",
  gemstoneId: "gem-diamond",
  cutId: "cut-round",
  stoneQuantity: 1,
  sizeId: "size-ring-us7",
};

describe("seed data", () => {
  it("covers every status of every machine", async () => {
    const s = state();
    const statuses = (list: { status: string }[]) => new Set(list.map((x) => x.status));
    expect(statuses(s.orders).size).toBe(10);
    expect(statuses(s.customOrders).size).toBe(13);
    expect(statuses(s.serviceRequests).size).toBe(11);
  });
});

describe("auth (FR-41 to FR-45)", () => {
  it("registers with consent, sends a verification email, and verifies", async () => {
    const user = await repos.auth.register({ fullName: "Liza Ramos", email: "Liza@Example.com", contactNumber: "09170000000", password: "password123", privacyConsent: true });
    expect(user.emailVerified).toBe(false);
    expect(user.privacyConsentAt).toBeTruthy();
    const mail = state().emails[0];
    expect(mail.to).toBe("liza@example.com");
    const token = new URL(mail.link!, "http://x").searchParams.get("token")!;
    const verified = await repos.auth.verifyEmail(token);
    expect(verified.emailVerified).toBe(true);
    await expect(repos.auth.verifyEmail(token)).rejects.toThrow(/invalid or was already used/);
  });

  it("refuses registration without consent and duplicate emails", async () => {
    await expect(repos.auth.register({ fullName: "X Y", email: "x@y.ph", contactNumber: "09170000000", password: "password123", privacyConsent: false })).rejects.toThrow(/Privacy Notice/);
    await expect(repos.auth.register({ fullName: "X Y", email: "maria@demo.ph", contactNumber: "09170000000", password: "password123", privacyConsent: true })).rejects.toThrow(/already exists/);
  });

  it("locks login for 15 minutes after 5 failures", async () => {
    for (let i = 0; i < 4; i++) await expect(repos.auth.login("maria@demo.ph", "short")).rejects.toThrow(/incorrect/);
    await expect(repos.auth.login("maria@demo.ph", "short")).rejects.toThrow(/wait 15 minutes/);
    await expect(repos.auth.login("maria@demo.ph", "password123")).rejects.toThrow(/wait 15 minutes/);
  });

  it("blocks unverified customers from submitting (FR-41)", async () => {
    await loginAs("ana@demo.ph");
    await expect(repos.customOrders.submit({ config: ring, source: "customizer", clientRequestId: rid() })).rejects.toThrow(/verify your email/);
  });
});

describe("custom order full flow (acceptance checklist)", () => {
  it("submit → revision → resubmit v2 → approve → quote → accept → pay → verify → produce → claim", async () => {
    await loginAs("maria@demo.ph");
    const id1 = rid();
    const co = await repos.customOrders.submit({ config: ring, source: "customizer", clientRequestId: id1 });
    expect(co.status).toBe("submitted");
    expect(co.versions[0].estimate).toEqual({ weightG: 4.53, price: 24026 });
    // idempotent: repeat submit returns the same record
    const again = await repos.customOrders.submit({ config: ring, source: "customizer", clientRequestId: id1 });
    expect(again.id).toBe(co.id);
    expect(state().customOrders.filter((c) => c.id === co.id)).toHaveLength(1);
    expect(state().notifications[0].type).toBe("new_custom_request");

    await loginAs("owner@afables.ph");
    await repos.customOrders.openForReview(co.id);
    await repos.customOrders.requestRevision(co.id, "Please choose a smaller stone for this band.");

    await loginAs("maria@demo.ph");
    let mine = (await repos.customOrders.get(co.id))!;
    expect(mine.status).toBe("revision_requested");
    expect(mine.revisionRemarks[0].text).toMatch(/smaller stone/);
    await repos.customOrders.resubmit(co.id, { config: { ...ring, gemstoneId: "gem-cz" }, clientRequestId: rid() });
    mine = (await repos.customOrders.get(co.id))!;
    expect(mine.versions).toHaveLength(2);
    expect(mine.status).toBe("under_review");

    await loginAs("owner@afables.ph");
    await repos.customOrders.approve(co.id);
    await repos.transactions.issueQuotation("custom", co.id, { finalPrice: 21000, downPaymentRequired: 6000, expectedDate: "2099-01-01" });

    await loginAs("maria@demo.ph");
    const accepted = await repos.transactions.respondToQuotation("custom", co.id, "accepted");
    expect(accepted.status).toBe("awaiting_payment");
    await expect(
      repos.payments.submit("custom", co.id, { kind: "down_payment", amount: 50000, paidOn: "2026-01-01", method: "gcash", referenceNumber: "1234", clientRequestId: rid() }),
    ).rejects.toThrow(/more than what is still due/);
    const pay = await repos.payments.submit("custom", co.id, { kind: "down_payment", amount: 6000, paidOn: "2026-01-01", method: "gcash", referenceNumber: "GC12345", clientRequestId: rid() });

    await loginAs("owner@afables.ph");
    await repos.payments.verify("custom", co.id, pay.id);
    let tx = (await repos.transactions.get("custom", co.id))!;
    expect(tx.status).toBe("confirmed"); // auto-confirmed when the down payment is covered
    await repos.transactions.changeStatus("custom", co.id, "in_production", "owner");
    await repos.transactions.changeStatus("custom", co.id, "ready_for_claiming", "owner");
    await expect(repos.transactions.changeStatus("custom", co.id, "completed", "owner")).rejects.toThrow(/balance of ₱15,000/);
    await repos.payments.record("custom", co.id, { kind: "balance", amount: 15000, paidOn: "2026-01-02", method: "cash_in_store" });
    tx = await repos.transactions.changeStatus("custom", co.id, "completed", "owner");
    expect(tx.status).toBe("completed");
    // customer got notified + emailed along the way
    expect(state().emails.some((e) => e.subject.includes("ready for claiming"))).toBe(true);
  });
});

describe("product orders (FR-13, FR-14, FR-22)", () => {
  it("orders available items, refuses unavailable and made-to-order ones", async () => {
    await loginAs("maria@demo.ph");
    const order = await repos.orders.place({ productId: "prod-1", quantity: 1, clientRequestId: rid() });
    expect(order.status).toBe("pending");
    await expect(repos.orders.place({ productId: "prod-8", quantity: 1, clientRequestId: rid() })).rejects.toThrow(/currently unavailable/);
    await expect(repos.orders.place({ productId: "prod-4", quantity: 1, clientRequestId: rid() })).rejects.toThrow(/made to order/);
  });

  it("lets the customer cancel only before confirmation and notifies the owner", async () => {
    await loginAs("maria@demo.ph");
    const order = await repos.orders.place({ productId: "prod-1", quantity: 1, clientRequestId: rid() });
    const c = await repos.transactions.cancel("order", order.id, "customer", "Changed my mind");
    expect(c.status).toBe("cancelled");
    expect(state().notifications[0].type).toBe("cancelled_by_customer");
    // seed ord-6 is ready_for_claiming → not cancellable by the customer
    await expect(repos.transactions.cancel("order", "ord-6", "customer")).rejects.toThrow(/contact the store/);
  });

  it("accepting a quotation with no down payment confirms immediately", async () => {
    await loginAs("maria@demo.ph");
    const order = await repos.orders.place({ productId: "prod-1", quantity: 1, clientRequestId: rid() });
    await loginAs("owner@afables.ph");
    await repos.transactions.issueQuotation("order", order.id, { finalPrice: 24500, downPaymentRequired: 0, expectedDate: "2099-01-01" });
    await loginAs("maria@demo.ph");
    expect((await repos.transactions.respondToQuotation("order", order.id, "accepted")).status).toBe("confirmed");
  });
});

describe("service request flow (FR-26 to FR-33)", () => {
  it("submit → assess → quote → accept → drop-off with down payment → progress → ready → claimed", async () => {
    await loginAs("maria@demo.ph");
    const sr = await repos.services.submit({ itemType: "watch", itemDescription: "Seiko automatic watch", serviceIds: ["svc-battery"], details: "Stopped running.", photos: [], source: "form", clientRequestId: rid() });
    await loginAs("owner@afables.ph");
    await repos.transactions.changeStatus("service", sr.id, "under_assessment", "owner");
    await repos.transactions.issueQuotation("service", sr.id, { finalPrice: 500, downPaymentRequired: 200, expectedDate: "2099-01-01", procedure: "Replace the battery." });
    await loginAs("maria@demo.ph");
    expect((await repos.transactions.respondToQuotation("service", sr.id, "accepted")).status).toBe("awaiting_drop_off");
    await loginAs("owner@afables.ph");
    await expect(repos.transactions.changeStatus("service", sr.id, "received", "owner")).rejects.toThrow(/Record drop-off/);
    const received = await repos.services.recordDropOff(sr.id, { receivedOn: "2026-01-01", downPayment: 200, method: "cash_in_store" });
    expect(received.status).toBe("received");
    expect(received.payments[0]).toMatchObject({ amount: 200, status: "verified", recordedBy: "owner" });
    await repos.transactions.changeStatus("service", sr.id, "in_progress", "owner");
    await repos.transactions.changeStatus("service", sr.id, "completed", "owner");
    await repos.transactions.changeStatus("service", sr.id, "ready_for_claiming", "owner");
    await expect(repos.transactions.changeStatus("service", sr.id, "claimed", "owner")).rejects.toThrow(/balance/);
    await repos.payments.record("service", sr.id, { kind: "balance", amount: 300, paidOn: "2026-01-03", method: "cash_in_store" });
    expect((await repos.transactions.changeStatus("service", sr.id, "claimed", "owner")).status).toBe("claimed");
  });

  it("customer cannot cancel once work is in progress (FR-33)", async () => {
    await loginAs("maria@demo.ph");
    await expect(repos.transactions.cancel("service", "sr-6", "customer")).rejects.toThrow(/contact the store/);
  });
});

describe("access control (NFR security, Phase 1)", () => {
  it("customers only see their own records", async () => {
    await loginAs("maria@demo.ph");
    const all = await repos.transactions.listAll();
    expect(all.every((t) => t.customerId === "user-maria")).toBe(true);
    // co-2 belongs to Jose
    expect(await repos.customOrders.get("co-2")).toBeNull();
    await expect(repos.transactions.changeStatus("custom", "co-2", "under_review", "owner")).rejects.toThrow(/Only the store owner/);
  });

  it("customers can't use owner operations", async () => {
    await loginAs("maria@demo.ph");
    await expect(repos.customOrders.approve("co-3")).rejects.toThrow(/Only the store owner/);
    await expect(repos.customers.list()).rejects.toThrow(/Only the store owner/);
  });

  it("guests can't load private data", async () => {
    expect(await repos.transactions.listAll()).toEqual([]);
  });
});

describe("rates (FR-47)", () => {
  it("new estimates use updated rates; submitted requests keep theirs", async () => {
    await loginAs("owner@afables.ph");
    const opts = await repos.customization.getOptions({ includeInactive: true });
    opts.materials.find((m) => m.id === "mat-18k")!.ratePerGram = 4500;
    await repos.customization.saveOptions(opts);
    await loginAs("maria@demo.ph");
    const co = await repos.customOrders.submit({ config: ring, source: "customizer", clientRequestId: rid() });
    expect(co.versions[0].estimate.price).toBe(25385);
    expect(state().customOrders.find((c) => c.id === "co-6")!.versions[0].estimate.price).toBe(24026);
  });

  it("refuses invalid option sets", async () => {
    await loginAs("owner@afables.ph");
    const opts = await repos.customization.getOptions({ includeInactive: true });
    opts.sizes.forEach((s) => s.productType === "ring" && (s.isDefault = false));
    await expect(repos.customization.saveOptions(opts)).rejects.toThrow(/default size for Ring/);
  });
});

describe("simulated errors", () => {
  it("every call fails while the demo error switch is on", async () => {
    useDemoStore.getState().setSimulateErrors(true);
    await expect(repos.catalog.listProducts()).rejects.toThrow(/Simulated error/);
  });
});

describe("notifications for every event (frontend-spec §7, FR-49, FR-50)", () => {
  it("sends each event to the right person, and emails customer events", async () => {
    useDemoStore.setState({ notifications: [], emails: [] });
    await loginAs("maria@demo.ph");
    const order = await repos.orders.place({ productId: "prod-1", quantity: 1, clientRequestId: rid() });
    const co = await repos.customOrders.submit({ config: ring, source: "customizer", clientRequestId: rid() });
    const sr = await repos.services.submit({ itemType: "watch", itemDescription: "Seiko automatic watch", serviceIds: ["svc-battery"], details: "Stopped running.", photos: [], source: "form", clientRequestId: rid() });
    await loginAs("owner@afables.ph");
    await repos.customOrders.openForReview(co.id);
    await repos.customOrders.requestRevision(co.id, "Please pick a smaller stone.");
    await repos.transactions.issueQuotation("order", order.id, { finalPrice: 24500, downPaymentRequired: 5000, expectedDate: "2099-01-01" });
    await loginAs("maria@demo.ph");
    await repos.transactions.respondToQuotation("order", order.id, "accepted");
    const p1 = await repos.payments.submit("order", order.id, { kind: "down_payment", amount: 5000, paidOn: "2026-01-01", method: "gcash", referenceNumber: "1111", clientRequestId: rid() });
    await loginAs("owner@afables.ph");
    await repos.payments.reject("order", order.id, p1.id, "Reference not found");
    await loginAs("maria@demo.ph");
    const p2 = await repos.payments.submit("order", order.id, { kind: "down_payment", amount: 5000, paidOn: "2026-01-01", method: "gcash", referenceNumber: "2222", clientRequestId: rid() });
    await loginAs("owner@afables.ph");
    await repos.payments.verify("order", order.id, p2.id);
    await repos.transactions.changeStatus("order", order.id, "ready_for_claiming", "owner");
    await loginAs("maria@demo.ph");
    await repos.transactions.cancel("service", sr.id, "customer", "Changed my mind");

    const n = useDemoStore.getState().notifications;
    const forOwner = new Set(n.filter((x) => x.userId === "user-owner").map((x) => x.type));
    const forMaria = new Set(n.filter((x) => x.userId === "user-maria").map((x) => x.type));
    for (const t of ["new_order", "new_custom_request", "new_service_request", "payment_submitted", "cancelled_by_customer"]) expect(forOwner).toContain(t);
    for (const t of ["revision_requested", "quotation_issued", "status_changed", "payment_verified", "payment_rejected", "ready_for_claiming"]) expect(forMaria).toContain(t);
    const mariaCount = n.filter((x) => x.userId === "user-maria").length;
    expect(useDemoStore.getState().emails.filter((e) => e.to === "maria@demo.ph")).toHaveLength(mariaCount);
  });
});
