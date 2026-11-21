// Pure helpers shared by customer and owner screens.

import type { Role, Transaction, TransactionKind } from "@/types";
import { isFinal } from "@/lib/status/machines";

/** Sum of verified payments. */
export function verifiedTotal(tx: Pick<Transaction, "payments">): number {
  return tx.payments.filter((p) => p.status === "verified").reduce((s, p) => s + p.amount, 0);
}

/** Sum of payments waiting for the owner to verify. */
export function pendingTotal(tx: Pick<Transaction, "payments">): number {
  return tx.payments.filter((p) => p.status === "pending_verification").reduce((s, p) => s + p.amount, 0);
}

/** balance = quotation.finalPrice − sum(verified payments). Never negative. 0 when there is no quotation. */
export function balance(tx: Pick<Transaction, "payments" | "quotation">): number {
  if (!tx.quotation) return 0;
  return Math.max(0, Math.round((tx.quotation.finalPrice - verifiedTotal(tx)) * 100) / 100);
}

/** Down payment still to be paid (0 once the verified total covers it). */
export function downPaymentDue(tx: Pick<Transaction, "payments" | "quotation">): number {
  if (!tx.quotation) return 0;
  return Math.max(0, tx.quotation.downPaymentRequired - verifiedTotal(tx));
}

const PAYABLE: Record<TransactionKind, string[]> = {
  order: ["awaiting_payment", "confirmed", "in_production", "ready_for_claiming"],
  custom: ["awaiting_payment", "confirmed", "in_production", "ready_for_claiming"],
  service: ["awaiting_drop_off", "received", "in_progress", "completed", "ready_for_claiming"],
};

/** Whether the customer can submit a payment now (FR-17). */
export function canSubmitPayment(tx: Transaction): boolean {
  return PAYABLE[tx.kind].includes(tx.status) && balance(tx) - pendingTotal(tx) > 0;
}

/** Statuses that mean "the item is finished and handed over" — require a zero balance. */
export function requiresZeroBalance(kind: TransactionKind, to: string): boolean {
  return (kind === "service" && to === "claimed") || (kind !== "service" && to === "completed");
}

export function isOpen(tx: Transaction): boolean {
  return !isFinal(tx.kind, tx.status);
}

const CUSTOMER_PATH: Record<TransactionKind, string> = { order: "orders", custom: "custom", service: "services" };
const OWNER_PATH: Record<TransactionKind, string> = { order: "orders", custom: "custom-requests", service: "service-requests" };

export function detailHref(kind: TransactionKind, id: string, role: Role): string {
  return role === "owner" ? `/admin/${OWNER_PATH[kind]}/${id}` : `/account/${CUSTOMER_PATH[kind]}/${id}`;
}

export const KIND_LABEL: Record<TransactionKind, string> = {
  order: "Order",
  custom: "Custom order",
  service: "Service request",
};

/** Items that need the customer's action. */
export function customerActionNeeded(tx: Transaction): string | null {
  if (tx.status === "quoted") return "Review the quotation";
  if (tx.kind === "custom" && tx.status === "revision_requested") return "Update your design";
  if (tx.payments.some((p) => p.status === "rejected") && canSubmitPayment(tx)) return "Payment was rejected — submit again";
  if (tx.status === "awaiting_payment" && canSubmitPayment(tx)) return "Pay the down payment";
  if (tx.status === "ready_for_claiming") return "Ready for claiming";
  return null;
}

/** Short description of what a record is about (lists and headers). */
export function txTitle(tx: Transaction, serviceNames: Record<string, string> = {}): string {
  if (tx.kind === "order") return `${tx.quantity} × ${tx.productSnapshot.name}`;
  if (tx.kind === "custom") {
    const l = tx.versions[tx.versions.length - 1].labels;
    return `${l.finish} ${l.material} ${l.productType.toLowerCase()}${l.gemstone !== "None" ? `, ${l.gemstone}` : ""}`;
  }
  const names = tx.serviceIds.map((id) => serviceNames[id]).filter(Boolean);
  return names.length ? `${names.join(", ")} — ${tx.itemDescription}` : tx.itemDescription;
}

/** Amount shown in lists: balance when quoted, otherwise the estimate/price. */
export function txAmount(tx: Transaction): { label: string; value: number } | null {
  if (tx.quotation && tx.quotation.response?.decision === "accepted") return { label: "Balance", value: balance(tx) };
  if (tx.quotation) return { label: "Quoted", value: tx.quotation.finalPrice };
  if (tx.kind === "custom") return { label: "Estimate", value: tx.versions[tx.versions.length - 1].estimate.price };
  if (tx.kind === "order") return { label: "Price", value: tx.productSnapshot.price * tx.quantity };
  return null;
}
