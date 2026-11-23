// What each API route accepts (NFR: all inputs validated on the server). Re-uses the form schemas in
// src/lib/validation so the browser and the server apply the same rules and messages.

import { z } from "zod";
import {
  PROOF_TYPES,
  dropOffSchema,
  faqSchema,
  fileMeta,
  optionLabelSchema,
  paymentSchema,
  productOrderSchema,
  productSchema,
  quotationSchema,
  reasonSchema,
  revisionRemarksSchema,
  serviceCatalogSchema,
  serviceRequestSchema,
  settingsSchema,
} from "@/lib/validation/schemas";
import { OPTION_GROUPS, PRODUCT_TYPES } from "@/types";

const id = z.string().trim().min(1).max(60);
const clientRequestId = z.string().min(8, "Refresh the page and try again.").max(64);
const shortText = (max: number) => z.string().trim().max(max).optional();

export const designConfigSchema = z.object({
  productType: z.enum(PRODUCT_TYPES, { error: "Choose a piece type." }),
  materialId: id,
  finishId: id,
  gemstoneId: id,
  cutId: id.nullable(),
  stoneQuantity: z.number().int().min(0).max(100),
  sizeId: id,
  engravingText: shortText(20),
  notes: shortText(500),
  nameText: shortText(20),
  fontId: id.nullable().optional(),
  chainStyleId: id.nullable().optional(),
  claspId: id.nullable().optional(),
  choices: z.partialRecord(z.enum(OPTION_GROUPS), id).optional(),
  styleText: shortText(20),
});

/** Snapshot JPEG/PNG from the 3D viewer, as a data URL (the server checks it again before storing). */
const snapshot = z.string().max(1_500_000).optional();

export const submitCustomOrderSchema = z.object({
  config: designConfigSchema,
  snapshotDataUrl: snapshot,
  source: z.enum(["customizer", "catalog", "chatbot"]),
  basedOnProductId: id.optional(),
  clientRequestId,
});
export const resubmitCustomOrderSchema = z.object({ config: designConfigSchema, snapshotDataUrl: snapshot, clientRequestId });
export const remarksSchema = revisionRemarksSchema;
export { reasonSchema, dropOffSchema, settingsSchema, faqSchema };

export const placeOrderSchema = z.object({
  productId: id,
  quantity: productOrderSchema.shape.quantity,
  notes: productOrderSchema.shape.notes,
  clientRequestId,
});

const fileRef = z.string().max(300);
export const submitServiceRequestSchema = serviceRequestSchema.extend({
  photos: z.array(fileRef).max(3, "You can add up to 3 photos."),
  source: z.enum(["form", "chatbot"]),
  clientRequestId,
});

export const statusChangeSchema = z.object({ to: z.string().min(1).max(30), note: shortText(500) });
export const quotationRequestSchema = quotationSchema;
export const quotationResponseSchema = z.object({ decision: z.enum(["accepted", "declined"]), reason: shortText(500) });
export const cancelSchema = z.object({ reason: shortText(500) });

export const customerPaymentRequestSchema = paymentSchema.extend({
  method: z.enum(["gcash", "bank_transfer"], { error: "Choose GCash or bank transfer." }),
  proofFile: fileMeta(PROOF_TYPES, "Proof of payment").extend({ dataUrl: fileRef }),
  clientRequestId,
});
export const recordPaymentRequestSchema = paymentSchema.extend({ referenceNumber: z.string().trim().max(40).optional(), proofFile: z.undefined().optional() });

export const productRequestSchema = productSchema.extend({
  photos: z.array(z.string().max(600)).max(5, "You can add up to 5 photos."),
  design: z.record(z.string(), z.unknown()).optional(),
});
export const serviceRequestCatalogSchema = serviceCatalogSchema.extend({ icon: z.string().max(40).optional() });
export const moveSchema = z.object({ direction: z.enum(["up", "down"]) });
export const policiesSchema = z.object({ text: z.string().max(4000, "Keep the policies to 4,000 characters or fewer.") });

const optionItem = z.looseObject({ id, label: optionLabelSchema, active: z.boolean() });
export const optionsSchema = z.object({
  productTypes: z.array(optionItem),
  materials: z.array(optionItem),
  finishes: z.array(optionItem),
  gemstones: z.array(optionItem),
  cuts: z.array(optionItem),
  sizes: z.array(optionItem),
  fonts: z.array(optionItem),
  chainStyles: z.array(optionItem),
  clasps: z.array(optionItem),
  designOptions: z.array(optionItem),
});

export const KINDS = ["order", "custom", "service"] as const;
export const kindSchema = z.enum(KINDS);
