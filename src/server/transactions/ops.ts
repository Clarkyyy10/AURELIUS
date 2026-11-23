// Orders, custom orders, service requests, quotations, cancellations and payments (FR-07 to FR-34).
// The same rules as the Phase 1 mock (src/lib/data/mock/repos.ts), now on the database: every
// operation is one transaction run as the signed-in user, so Row Level Security also applies, and the
// record, its status history and its notifications are saved together or not at all.

import type { Prisma } from "@prisma/client";
import { assertTransition, canTransition, statusLabel } from "@/lib/status/machines";
import { estimate } from "@/lib/pricing/estimate";
import { designLabels } from "@/lib/pricing/labels";
import { activeOptions } from "@/lib/pricing/options";
import { balance, detailHref, downPaymentDue, requiresZeroBalance, verifiedTotal } from "@/lib/transactions/helpers";
import { formatPeso, formatPesoExact } from "@/lib/utils/format";
import { UserFacingError } from "@/lib/data/repositories";
import type {
  Actor,
  AnyStatus,
  CustomOrderRequest,
  CustomizationOptions,
  DesignConfig,
  ItemKind,
  Payment,
  PaymentKind,
  PaymentMethod,
  ProductOrder,
  ProofFile,
  Quotation,
  ServiceRequest,
  Transaction,
  TransactionKind,
  UserProfile,
} from "@/types";
import { asUser, num, type Tx } from "../db";
import { notFound } from "../http";
import { notify, notifyOwner } from "../notify";
import { ownedPath, storeSnapshot } from "../files";
import { rowsToOptions, type OptionRow } from "../options";
import { ORDER_INCLUDE, SERVICE_INCLUDE, payment, toCustomOrder, toDate, toProductOrder, toServiceRequest } from "./mappers";

// ---------------------------------------------------------------- loading

const NOT_FOUND = "We couldn't find that record. It may have been removed, or it belongs to another account.";

/** Loads a record the caller may see (RLS: customers only their own). */
export async function loadTx(tx: Tx, kind: TransactionKind, id: string): Promise<Transaction> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw notFound("This record");
  if (kind === "service") {
    const row = await tx.serviceRequest.findUnique({ where: { id }, include: SERVICE_INCLUDE });
    if (!row) throw new UserFacingError(NOT_FOUND);
    return toServiceRequest(row);
  }
  const row = await tx.order.findUnique({ where: { id }, include: ORDER_INCLUDE });
  if (!row || (kind === "order") !== (row.kind === "product")) throw new UserFacingError(NOT_FOUND);
  return kind === "order" ? toProductOrder(row) : toCustomOrder(row);
}

export async function listTx(tx: Tx, kind: TransactionKind, customerId?: string): Promise<Transaction[]> {
  const where = customerId ? { customerId } : {};
  if (kind === "service") {
    const rows = await tx.serviceRequest.findMany({ where, include: SERVICE_INCLUDE, orderBy: { createdAt: "desc" } });
    return rows.map(toServiceRequest);
  }
  const rows = await tx.order.findMany({
    where: { ...where, kind: kind === "order" ? "product" : "custom" },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r): Transaction => (kind === "order" ? toProductOrder(r) : toCustomOrder(r)));
}

export async function loadOptions(tx: Tx): Promise<CustomizationOptions> {
  const rows = await tx.designOption.findMany();
  return rowsToOptions(rows.map((r) => ({ ...r, attributes: r.attributes as Record<string, unknown> }) as OptionRow));
}

async function nextCode(tx: Tx, prefix: "OR" | "CO" | "SR"): Promise<string> {
  const rows = await tx.$queryRaw<{ code: string }[]>`SELECT public.next_code(${prefix}) AS code`;
  return rows[0].code;
}

const parent = (t: Transaction) => (t.kind === "service" ? { serviceRequestId: t.id } : { orderId: t.id });

// ---------------------------------------------------------------- status

async function setStatus(tx: Tx, t: Transaction, to: AnyStatus, actor: Actor, note?: string) {
  assertTransition(t.kind, t.status, to, actor);
  if (requiresZeroBalance(t.kind, to) && balance(t) > 0) {
    throw new UserFacingError(`The customer still has a balance of ${formatPesoExact(balance(t))}. Record the payment settled in the store first.`);
  }
  const data = { status: to };
  if (t.kind === "service") await tx.serviceRequest.update({ where: { id: t.id }, data });
  else await tx.order.update({ where: { id: t.id }, data });
  await tx.statusHistory.create({ data: { ...parent(t), status: to, actor, note: note || null } });
  t.status = to as never;
  t.history.push({ status: to, at: new Date().toISOString(), by: actor, note: note || undefined });
}

async function notifyCustomerStatus(tx: Tx, t: Transaction, note?: string) {
  const link = detailHref(t.kind, t.id, "customer");
  if (t.status === "ready_for_claiming") {
    const bal = balance(t);
    await notify(
      tx,
      t.customerId,
      "ready_for_claiming",
      `${t.code} is ready for claiming`,
      `Your item is ready. Visit the store to claim it${bal > 0 ? ` and settle the balance of ${formatPesoExact(bal)}` : ""}.`,
      link,
    );
  } else {
    await notify(
      tx,
      t.customerId,
      "status_changed",
      `${t.code}: ${statusLabel(t.status)}`,
      note ? `Note from the store: ${note}` : `The status of ${t.code} is now “${statusLabel(t.status)}”.`,
      link,
    );
  }
}

// ---------------------------------------------------------------- custom orders (FR-07 to FR-11)

async function makeVersion(tx: Tx, me: UserProfile, config: DesignConfig, snapshotDataUrl?: string) {
  const options = activeOptions(await loadOptions(tx));
  const e = estimate(config, options); // the server recomputes the estimate; plain-English EstimateError if invalid
  const snapshotPath = await storeSnapshot(me.id, snapshotDataUrl);
  return {
    config: config as unknown as Prisma.InputJsonValue,
    labels: designLabels(config, options) as unknown as Prisma.InputJsonValue,
    estimateWeightG: e.weightG,
    estimatePrice: e.price,
    snapshotPath: snapshotPath ?? null,
    productType: designLabels(config, options).productType,
  };
}

export function submitCustomOrder(
  me: UserProfile,
  input: { config: DesignConfig; snapshotDataUrl?: string; source: CustomOrderRequest["source"]; basedOnProductId?: string; clientRequestId: string },
) {
  return asUser(me.id, async (tx) => {
    const existing = await tx.order.findUnique({ where: { clientRequestId: input.clientRequestId }, include: ORDER_INCLUDE });
    if (existing) return toCustomOrder(existing);
    const v = await makeVersion(tx, me, input.config, input.snapshotDataUrl);
    const code = await nextCode(tx, "CO");
    const order = await tx.order.create({
      data: {
        code,
        kind: "custom",
        customerId: me.id,
        status: "submitted",
        source: input.source,
        basedOnProductId: input.basedOnProductId && /^[0-9a-f-]{36}$/i.test(input.basedOnProductId) ? input.basedOnProductId : null,
        clientRequestId: input.clientRequestId,
        designs: {
          create: {
            customerId: me.id,
            version: 1,
            config: v.config,
            labels: v.labels,
            estimateWeightG: v.estimateWeightG,
            estimatePrice: v.estimatePrice,
            snapshotPath: v.snapshotPath,
          },
        },
        history: { create: { status: "submitted", actor: "customer" } },
      },
    });
    await notifyOwner(
      tx,
      "new_custom_request",
      "New custom order request",
      `${me.fullName} submitted a ${v.productType.toLowerCase()} design (${code}).`,
      detailHref("custom", order.id, "owner"),
    );
    return loadTx(tx, "custom", order.id) as Promise<CustomOrderRequest>;
  });
}

export function resubmitCustomOrder(me: UserProfile, id: string, input: { config: DesignConfig; snapshotDataUrl?: string; clientRequestId: string }) {
  return asUser(me.id, async (tx) => {
    const t = (await loadTx(tx, "custom", id)) as CustomOrderRequest;
    const repeat = await tx.customDesign.findUnique({ where: { clientRequestId: input.clientRequestId } });
    if (repeat) return t;
    const v = await makeVersion(tx, me, input.config, input.snapshotDataUrl);
    const version = t.versions.length + 1;
    await setStatus(tx, t, "under_review", "customer", `Version ${version} submitted.`);
    await tx.customDesign.create({
      data: {
        orderId: t.id,
        customerId: me.id,
        version,
        config: v.config,
        labels: v.labels,
        estimateWeightG: v.estimateWeightG,
        estimatePrice: v.estimatePrice,
        snapshotPath: v.snapshotPath,
        clientRequestId: input.clientRequestId,
      },
    });
    await notifyOwner(
      tx,
      "new_custom_request",
      `Updated design for ${t.code}`,
      `${me.fullName} submitted version ${version} after your remarks.`,
      detailHref("custom", t.id, "owner"),
    );
    return loadTx(tx, "custom", t.id) as Promise<CustomOrderRequest>;
  });
}

export function openForReview(me: UserProfile, id: string) {
  return asUser(me.id, async (tx) => {
    const t = await loadTx(tx, "custom", id);
    if (t.status === "submitted") {
      await setStatus(tx, t, "under_review", "owner");
      await notifyCustomerStatus(tx, t);
    }
    return loadTx(tx, "custom", id) as Promise<CustomOrderRequest>;
  });
}

export function requestRevision(me: UserProfile, id: string, remarks: string) {
  return asUser(me.id, async (tx) => {
    const t = await loadTx(tx, "custom", id);
    await setStatus(tx, t, "revision_requested", "owner", remarks);
    await tx.revisionRemark.create({ data: { orderId: t.id, text: remarks } });
    await notify(
      tx,
      t.customerId,
      "revision_requested",
      `The owner asked for changes to ${t.code}`,
      `Remarks: “${remarks}” Open your request to edit the design and resubmit.`,
      detailHref("custom", t.id, "customer"),
    );
    return loadTx(tx, "custom", id) as Promise<CustomOrderRequest>;
  });
}

export function approveCustomOrder(me: UserProfile, id: string) {
  return asUser(me.id, async (tx) => {
    const t = await loadTx(tx, "custom", id);
    await setStatus(tx, t, "approved", "owner");
    await notify(
      tx,
      t.customerId,
      "status_changed",
      `Your design ${t.code} was approved`,
      "The owner approved your design. A quotation with the final price and date will follow.",
      detailHref("custom", t.id, "customer"),
    );
    return loadTx(tx, "custom", id) as Promise<CustomOrderRequest>;
  });
}

export function rejectRecord(me: UserProfile, kind: "custom" | "order", id: string, reason: string) {
  return asUser(me.id, async (tx) => {
    const t = await loadTx(tx, kind, id);
    await setStatus(tx, t, "rejected", "owner", reason);
    await tx.order.update({ where: { id: t.id }, data: { rejectionReason: reason } });
    await notifyCustomerStatus(tx, t, reason);
    return loadTx(tx, kind, id);
  });
}

// ---------------------------------------------------------------- product orders (FR-14)

export function placeOrder(me: UserProfile, input: { productId: string; quantity: number; notes?: string; clientRequestId: string }) {
  return asUser(me.id, async (tx) => {
    const existing = await tx.order.findUnique({ where: { clientRequestId: input.clientRequestId }, include: ORDER_INCLUDE });
    if (existing) return toProductOrder(existing);
    const p = /^[0-9a-f-]{36}$/i.test(input.productId) ? await tx.product.findUnique({ where: { id: input.productId } }) : null;
    if (!p || p.hidden) throw new UserFacingError("This product is no longer in the shop.");
    if (p.availability !== "available") {
      throw new UserFacingError(
        p.availability === "unavailable" ? "This item is currently unavailable." : "This item is made to order. Use “Request this piece” instead.",
      );
    }
    if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 5) throw new UserFacingError("You can order between 1 and 5 at a time.");
    const code = await nextCode(tx, "OR");
    const order = await tx.order.create({
      data: {
        code,
        kind: "product",
        customerId: me.id,
        status: "pending",
        source: "catalog",
        notes: input.notes || null,
        clientRequestId: input.clientRequestId,
        items: { create: { productId: p.id, productName: p.name, unitPrice: p.price, photo: p.photos[0] ?? "", quantity: input.quantity } },
        history: { create: { status: "pending", actor: "customer" } },
      },
    });
    await notifyOwner(tx, "new_order", "New order", `${me.fullName} ordered ${input.quantity} × ${p.name} (${code}).`, detailHref("order", order.id, "owner"));
    return loadTx(tx, "order", order.id) as Promise<ProductOrder>;
  });
}

// ---------------------------------------------------------------- service requests (FR-26 to FR-33)

export function submitServiceRequest(
  me: UserProfile,
  input: {
    itemType: ItemKind;
    itemDescription: string;
    brandModel?: string;
    material?: string;
    serviceIds: string[];
    details: string;
    photos: string[];
    preferredDropOffDate?: string;
    source: ServiceRequest["source"];
    clientRequestId: string;
  },
) {
  return asUser(me.id, async (tx) => {
    const existing = await tx.serviceRequest.findUnique({ where: { clientRequestId: input.clientRequestId }, include: SERVICE_INCLUDE });
    if (existing) return toServiceRequest(existing);
    const services = await tx.service.findMany({ where: { id: { in: input.serviceIds }, hidden: false } });
    if (services.length !== new Set(input.serviceIds).size) throw new UserFacingError("One of the chosen services is no longer offered. Choose again.");
    const wrong = services.find((s) => !s.appliesTo.includes(input.itemType));
    if (wrong) throw new UserFacingError(`${wrong.name} isn't available for ${input.itemType === "watch" ? "watches" : "jewelry"}. Remove it and try again.`);
    const photos = input.photos.map((ref) => `file:service-photos/${ownedPath(ref, "service-photos", me.id)}`);
    const code = await nextCode(tx, "SR");
    const row = await tx.serviceRequest.create({
      data: {
        code,
        customerId: me.id,
        itemType: input.itemType,
        itemDescription: input.itemDescription,
        brandModel: input.brandModel || null,
        material: input.material || null,
        details: input.details,
        photos,
        preferredDropOffDate: input.preferredDropOffDate ? toDate(input.preferredDropOffDate) : null,
        source: input.source,
        status: "submitted",
        clientRequestId: input.clientRequestId,
        history: { create: { status: "submitted", actor: "customer" } },
      },
    });
    await tx.serviceRequestService.createMany({ data: services.map((s) => ({ serviceRequestId: row.id, serviceId: s.id })) });
    await notifyOwner(
      tx,
      "new_service_request",
      "New service request",
      `${me.fullName} asked for ${services.map((s) => s.name.toLowerCase()).join(", ")} (${code}).`,
      detailHref("service", row.id, "owner"),
    );
    return loadTx(tx, "service", row.id) as Promise<ServiceRequest>;
  });
}

export function recordDropOff(
  me: UserProfile,
  id: string,
  input: { receivedOn: string; downPayment: number; method: PaymentMethod; referenceNumber?: string },
) {
  return asUser(me.id, async (tx) => {
    const t = (await loadTx(tx, "service", id)) as ServiceRequest;
    await setStatus(
      tx,
      t,
      "received",
      "owner",
      input.downPayment > 0 ? `Item received. Down payment of ${formatPesoExact(input.downPayment)} collected.` : "Item received.",
    );
    await tx.serviceRequest.update({ where: { id: t.id }, data: { droppedOffAt: toDate(input.receivedOn) } });
    if (input.downPayment > 0) {
      await tx.payment.create({
        data: {
          serviceRequestId: t.id,
          kind: "down_payment",
          amount: input.downPayment,
          paidOn: toDate(input.receivedOn),
          method: input.method,
          referenceNumber: input.method === "cash_in_store" ? "CASH-IN-STORE" : (input.referenceNumber ?? ""),
          recordedBy: "owner",
          status: "verified",
          verifiedAt: new Date(),
        },
      });
    }
    const fresh = await loadTx(tx, "service", id);
    const bal = balance(fresh);
    await notify(
      tx,
      t.customerId,
      "status_changed",
      `${t.code}: Item received`,
      `We received your item${bal > 0 ? `. Remaining balance to settle on claiming: ${formatPesoExact(bal)}` : ""}.`,
      detailHref("service", t.id, "customer"),
    );
    return fresh as ServiceRequest;
  });
}

// ---------------------------------------------------------------- shared (status, quotations, cancel)

export function changeStatus(me: UserProfile, kind: TransactionKind, id: string, to: AnyStatus, note?: string) {
  return asUser(me.id, async (tx) => {
    const t = await loadTx(tx, kind, id);
    if (to === "cancelled") throw new UserFacingError("Use Cancel to cancel a request.");
    if (kind === "service" && to === "received" && t.status === "awaiting_drop_off") {
      throw new UserFacingError("Use “Record drop-off” so the date and down payment are saved.");
    }
    await setStatus(tx, t, to, me.role, note);
    await notifyCustomerStatus(tx, t, note);
    return loadTx(tx, kind, id);
  });
}

export function issueQuotation(me: UserProfile, kind: TransactionKind, id: string, input: Omit<Quotation, "id" | "issuedAt" | "response">) {
  return asUser(me.id, async (tx) => {
    const t = await loadTx(tx, kind, id);
    if (input.downPaymentRequired > input.finalPrice) throw new UserFacingError("The down payment can't be more than the final price.");
    const reissue = Boolean(t.quotation);
    await setStatus(tx, t, "quoted", "owner", reissue ? "Quotation re-issued." : undefined);
    await tx.quotation.updateMany({ where: { ...parent(t), isCurrent: true }, data: { isCurrent: false } });
    await tx.quotation.create({
      data: {
        ...parent(t),
        finalPrice: input.finalPrice,
        downPaymentRequired: input.downPaymentRequired,
        expectedDate: toDate(input.expectedDate),
        procedure: input.procedure || null,
        notes: input.notes || null,
      },
    });
    await notify(
      tx,
      t.customerId,
      "quotation_issued",
      `Your quotation for ${t.code} is ready`,
      `Final price ${formatPeso(input.finalPrice)}${input.downPaymentRequired > 0 ? `, down payment ${formatPeso(input.downPaymentRequired)}` : ""}. Open your request to accept or decline.`,
      detailHref(kind, t.id, "customer"),
    );
    return loadTx(tx, kind, id);
  });
}

export function respondToQuotation(me: UserProfile, kind: TransactionKind, id: string, decision: "accepted" | "declined", reason?: string) {
  return asUser(me.id, async (tx) => {
    const t = await loadTx(tx, kind, id);
    if (t.status !== "quoted" || !t.quotation) throw new UserFacingError("There is no quotation waiting for your answer.");
    let to: AnyStatus;
    if (decision === "declined") to = "declined";
    else if (kind === "service") to = (t as ServiceRequest).droppedOffAt ? "received" : "awaiting_drop_off";
    else to = downPaymentDue(t) > 0 ? "awaiting_payment" : "confirmed";
    await setStatus(tx, t, to, "customer", decision === "declined" ? reason : "Quotation accepted.");
    await tx.quotation.update({ where: { id: t.quotation.id }, data: { responseDecision: decision, respondedAt: new Date(), responseReason: reason || null } });
    await notifyOwner(
      tx,
      "status_changed",
      `${t.code}: quotation ${decision}`,
      `${me.fullName} ${decision} the quotation${reason ? `: “${reason}”` : "."}`,
      detailHref(kind, t.id, "owner"),
    );
    return loadTx(tx, kind, id);
  });
}

export function cancelRecord(me: UserProfile, kind: TransactionKind, id: string, reason?: string) {
  return asUser(me.id, async (tx) => {
    const t = await loadTx(tx, kind, id);
    if (!canTransition(kind, t.status, "cancelled", me.role)) throw new UserFacingError("This can no longer be cancelled online. Please contact the store.");
    await setStatus(tx, t, "cancelled", me.role, reason);
    if (me.role === "customer") {
      await notifyOwner(
        tx,
        "cancelled_by_customer",
        `${t.code} was cancelled by the customer`,
        `${me.fullName} cancelled ${t.code}${reason ? `: “${reason}”` : "."}`,
        detailHref(kind, t.id, "owner"),
      );
    } else {
      await notifyCustomerStatus(tx, t, reason);
    }
    return loadTx(tx, kind, id);
  });
}

// ---------------------------------------------------------------- payments (FR-17, FR-18, FR-30)

const pendingSum = (t: Transaction) => t.payments.filter((p) => p.status === "pending_verification").reduce((s, p) => s + p.amount, 0);
const TYPE_BY_EXT: Record<string, ProofFile["type"]> = { jpg: "image/jpeg", png: "image/png", pdf: "application/pdf" };

export function submitPayment(
  me: UserProfile,
  kind: TransactionKind,
  id: string,
  input: {
    kind: PaymentKind;
    amount: number;
    paidOn: string;
    method: PaymentMethod;
    referenceNumber: string;
    proofFile?: { name: string; type: string; sizeBytes: number; dataUrl?: string };
    clientRequestId: string;
  },
) {
  return asUser(me.id, async (tx) => {
    if (me.role !== "customer") throw new UserFacingError("Owners record payments with “Record payment”.");
    const t = await loadTx(tx, kind, id);
    const repeat = await tx.payment.findUnique({ where: { clientRequestId: input.clientRequestId } });
    if (repeat) return payment(repeat);
    if (!t.quotation) throw new UserFacingError("You can pay once the owner has sent a quotation.");
    if (!(input.amount > 0)) throw new UserFacingError("Enter an amount greater than ₱0.");
    const outstanding = balance(t) - pendingSum(t);
    if (input.amount > outstanding + 0.001)
      throw new UserFacingError(`The amount is more than what is still due (${formatPesoExact(Math.max(0, outstanding))}).`);
    let proof: { proofPath: string; proofName: string; proofType: ProofFile["type"]; proofSizeBytes: number } | null = null;
    if (input.proofFile?.dataUrl) {
      const path = ownedPath(input.proofFile.dataUrl, "payment-proofs", me.id);
      const type = TYPE_BY_EXT[path.split(".").pop() ?? ""];
      if (!type) throw new UserFacingError("The proof of payment must be a JPG, PNG, or PDF file.");
      proof = {
        proofPath: path,
        proofName: input.proofFile.name.slice(0, 200),
        proofType: type,
        proofSizeBytes: Math.min(Math.max(1, input.proofFile.sizeBytes), 5 * 1024 * 1024),
      };
    }
    const row = await tx.payment.create({
      data: {
        ...parent(t),
        kind: input.kind,
        amount: input.amount,
        paidOn: toDate(input.paidOn),
        method: input.method,
        referenceNumber: input.referenceNumber,
        ...(proof ?? {}),
        recordedBy: "customer",
        status: "pending_verification",
        clientRequestId: input.clientRequestId,
      },
    });
    await touch(tx, t);
    await notifyOwner(
      tx,
      "payment_submitted",
      "Payment to verify",
      `${me.fullName} submitted ${formatPesoExact(input.amount)} for ${t.code} (ref. ${input.referenceNumber}).`,
      "/admin/payments",
    );
    return payment(row);
  });
}

export function recordPayment(
  me: UserProfile,
  kind: TransactionKind,
  id: string,
  input: { kind: PaymentKind; amount: number; paidOn: string; method: PaymentMethod; referenceNumber?: string },
) {
  return asUser(me.id, async (tx) => {
    const t = await loadTx(tx, kind, id);
    if (!(input.amount > 0)) throw new UserFacingError("Enter an amount greater than ₱0.");
    const row = await tx.payment.create({
      data: {
        ...parent(t),
        kind: input.kind,
        amount: input.amount,
        paidOn: toDate(input.paidOn),
        method: input.method,
        referenceNumber: input.method === "cash_in_store" ? "CASH-IN-STORE" : (input.referenceNumber ?? ""),
        recordedBy: "owner",
        status: "verified",
        verifiedAt: new Date(),
      },
    });
    await touch(tx, t);
    await afterVerified(tx, await loadTx(tx, kind, id));
    return payment(row);
  });
}

export function reviewPayment(me: UserProfile, kind: TransactionKind, id: string, paymentId: string, decision: "verify" | "reject", reason?: string) {
  return asUser(me.id, async (tx) => {
    const t = await loadTx(tx, kind, id);
    const p = t.payments.find((x) => x.id === paymentId);
    if (!p) throw new UserFacingError("We couldn't find that payment.");
    if (p.status !== "pending_verification") throw new UserFacingError("This payment was already reviewed.");
    // Only change it if it is still pending (two owner tabs can't both review it).
    const changed = await tx.payment.updateMany({
      where: { id: p.id, status: "pending_verification" },
      data: decision === "verify" ? { status: "verified", verifiedAt: new Date() } : { status: "rejected", rejectionReason: reason ?? null },
    });
    if (changed.count === 0) throw new UserFacingError("This payment was already reviewed.");
    await touch(tx, t);
    const fresh = await loadTx(tx, kind, id);
    if (decision === "verify") {
      await notify(
        tx,
        t.customerId,
        "payment_verified",
        `Payment verified for ${t.code}`,
        `Your payment of ${formatPesoExact(p.amount)} was verified. Remaining balance: ${formatPesoExact(balance(fresh))}.`,
        detailHref(kind, t.id, "customer"),
      );
      await afterVerified(tx, fresh);
    } else {
      await notify(
        tx,
        t.customerId,
        "payment_rejected",
        `Payment not accepted for ${t.code}`,
        `Your payment of ${formatPesoExact(p.amount)} was not accepted: “${reason}” Please submit it again with the correct details.`,
        detailHref(kind, t.id, "customer"),
      );
    }
    return fresh.payments.find((x) => x.id === paymentId) as Payment;
  });
}

/** After a verified payment: "awaiting payment" becomes "confirmed" once the down payment is covered. */
async function afterVerified(tx: Tx, t: Transaction) {
  if (t.status === "awaiting_payment" && t.quotation && verifiedTotal(t) >= t.quotation.downPaymentRequired) {
    await setStatus(tx, t, "confirmed", "owner", "Down payment verified.");
    await notifyCustomerStatus(tx, t, "Down payment verified. Your order is confirmed.");
  }
}

async function touch(tx: Tx, t: Transaction) {
  if (t.kind === "service") await tx.serviceRequest.update({ where: { id: t.id }, data: { updatedAt: new Date() } });
  else await tx.order.update({ where: { id: t.id }, data: { updatedAt: new Date() } });
}

/** Total still owed across a customer's accepted, open records (owner's customer list, FR-48). */
export function openBalance(list: Transaction[]): number {
  return list
    .filter((t) => !["cancelled", "declined", "rejected"].includes(t.status) && t.quotation?.response?.decision === "accepted")
    .reduce((s, t) => s + balance(t), 0);
}

export { num };
