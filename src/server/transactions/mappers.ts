// Database rows → the Transaction shapes the pages already use (src/types).

import type { Prisma } from "@prisma/client";
import type {
  AnyStatus,
  CustomOrderRequest,
  DesignConfig,
  DesignLabels,
  HistoryEntry,
  Payment,
  ProductOrder,
  ProofFile,
  Quotation,
  ServiceRequest,
} from "@/types";
import { num } from "../db";
import { fileRef } from "../files";

export const ORDER_INCLUDE = {
  items: true,
  designs: { orderBy: { version: "asc" } },
  revisionRemarks: { orderBy: { createdAt: "asc" } },
  quotations: { where: { isCurrent: true } },
  payments: { orderBy: { createdAt: "asc" } },
  history: { orderBy: { at: "asc" } },
} satisfies Prisma.OrderInclude;

export const SERVICE_INCLUDE = {
  services: true,
  quotations: { where: { isCurrent: true } },
  payments: { orderBy: { createdAt: "asc" } },
  history: { orderBy: { at: "asc" } },
} satisfies Prisma.ServiceRequestInclude;

export type OrderRow = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;
export type ServiceRow = Prisma.ServiceRequestGetPayload<{ include: typeof SERVICE_INCLUDE }>;
type QuotationRow = OrderRow["quotations"][number];
type PaymentRow = OrderRow["payments"][number];
type HistoryRow = OrderRow["history"][number];

/** A database date (no time) as YYYY-MM-DD. */
export const dateOnly = (d: Date) => d.toISOString().slice(0, 10);
/** YYYY-MM-DD from a form → a date for a @db.Date column. */
export const toDate = (s: string) => new Date(`${s.slice(0, 10)}T00:00:00Z`);

function quotation(rows: QuotationRow[]): Quotation | undefined {
  const q = rows[0];
  if (!q) return undefined;
  return {
    id: q.id,
    issuedAt: q.issuedAt.toISOString(),
    finalPrice: num(q.finalPrice),
    downPaymentRequired: num(q.downPaymentRequired),
    expectedDate: dateOnly(q.expectedDate),
    procedure: q.procedure ?? undefined,
    notes: q.notes ?? undefined,
    response: q.responseDecision
      ? { decision: q.responseDecision as "accepted" | "declined", at: q.respondedAt!.toISOString(), reason: q.responseReason ?? undefined }
      : undefined,
  };
}

export function payment(p: PaymentRow): Payment {
  const proof: ProofFile | undefined = p.proofPath
    ? {
        name: p.proofName ?? "proof",
        type: p.proofType as ProofFile["type"],
        sizeBytes: p.proofSizeBytes ?? 0,
        dataUrl: fileRef("payment-proofs", p.proofPath),
      }
    : undefined;
  return {
    id: p.id,
    kind: p.kind,
    amount: num(p.amount),
    paidOn: dateOnly(p.paidOn),
    method: p.method,
    referenceNumber: p.referenceNumber ?? "",
    proofFile: proof,
    recordedBy: p.recordedBy,
    status: p.status,
    rejectionReason: p.rejectionReason ?? undefined,
    verifiedAt: p.verifiedAt?.toISOString(),
    createdAt: p.createdAt.toISOString(),
  };
}

const history = (rows: HistoryRow[]): HistoryEntry[] =>
  rows.map((h) => ({ status: h.status as AnyStatus, at: h.at.toISOString(), by: h.actor, note: h.note ?? undefined }));

export function toProductOrder(o: OrderRow): ProductOrder {
  const item = o.items[0];
  return {
    kind: "order",
    id: o.id,
    code: o.code,
    customerId: o.customerId,
    productId: item?.productId ?? "",
    productSnapshot: { name: item?.productName ?? "", price: num(item?.unitPrice), photo: item?.photo ?? "" },
    quantity: item?.quantity ?? 1,
    notes: o.notes ?? undefined,
    rejectionReason: o.rejectionReason ?? undefined,
    status: o.status as ProductOrder["status"],
    quotation: quotation(o.quotations),
    payments: o.payments.map(payment),
    history: history(o.history),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

export function toCustomOrder(o: OrderRow): CustomOrderRequest {
  return {
    kind: "custom",
    id: o.id,
    code: o.code,
    customerId: o.customerId,
    source: o.source as CustomOrderRequest["source"],
    basedOnProductId: o.basedOnProductId ?? undefined,
    versions: o.designs.map((v) => ({
      version: v.version,
      config: v.config as unknown as DesignConfig,
      estimate: { weightG: num(v.estimateWeightG), price: num(v.estimatePrice) },
      labels: v.labels as unknown as DesignLabels,
      snapshotDataUrl: v.snapshotPath ? fileRef("design-snapshots", v.snapshotPath) : undefined,
      submittedAt: v.submittedAt.toISOString(),
    })),
    revisionRemarks: o.revisionRemarks.map((r) => ({ at: r.createdAt.toISOString(), text: r.text })),
    rejectionReason: o.rejectionReason ?? undefined,
    status: o.status as CustomOrderRequest["status"],
    quotation: quotation(o.quotations),
    payments: o.payments.map(payment),
    history: history(o.history),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

export function toServiceRequest(s: ServiceRow): ServiceRequest {
  return {
    kind: "service",
    id: s.id,
    code: s.code,
    customerId: s.customerId,
    itemType: s.itemType,
    itemDescription: s.itemDescription,
    brandModel: s.brandModel ?? undefined,
    material: s.material ?? undefined,
    serviceIds: s.services.map((x) => x.serviceId),
    details: s.details,
    photos: s.photos,
    preferredDropOffDate: s.preferredDropOffDate ? dateOnly(s.preferredDropOffDate) : undefined,
    droppedOffAt: s.droppedOffAt ? s.droppedOffAt.toISOString() : undefined,
    source: s.source as ServiceRequest["source"],
    status: s.status as ServiceRequest["status"],
    quotation: quotation(s.quotations),
    payments: s.payments.map(payment),
    history: history(s.history),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}
