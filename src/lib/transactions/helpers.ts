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
