import type { Transaction } from "@/types";

/** Items needing the owner's action — dashboard cards and sidebar badges (FR-46, FR-50). */
export function ownerCounts(all: Transaction[]) {
  const by = (kind: Transaction["kind"], statuses: string[]) => all.filter((t) => t.kind === kind && statuses.includes(t.status)).length;
  return {
    customToReview: by("custom", ["submitted", "under_review"]),
    ordersToQuote: by("order", ["pending"]),
    servicesToAssess: by("service", ["submitted", "under_assessment"]),
    paymentsToVerify: all.reduce((n, t) => n + t.payments.filter((p) => p.status === "pending_verification").length, 0),
    readyForClaiming: all.filter((t) => t.status === "ready_for_claiming").length,
  };
}
export type OwnerCounts = ReturnType<typeof ownerCounts>;
