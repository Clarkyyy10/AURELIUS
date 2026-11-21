// Zod schemas for every form. Phase 2 re-uses these on the server (NFR: inputs validated on the server).
// Messages say what went wrong and how to fix it, in plain English.

import { z } from "zod";
import { todayISODate } from "@/lib/utils/format";

// ---------- Shared pieces ----------
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const PROOF_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
export const PHOTO_TYPES = ["image/jpeg", "image/png"] as const;

/** Normalise a PH mobile number: strip spaces/dashes/brackets. */
export function normalizePhone(value: string): string {
  return value.replace(/[\s\-()]/g, "");
}

export const phPhone = z
  .string()
  .trim()
  .min(1, "Enter your mobile number.")
  .transform(normalizePhone)
  .refine((v) => /^(09\d{9}|\+639\d{9})$/.test(v), {
    message: "Enter a Philippine mobile number like 09171234567 or +639171234567.",
  });

export const email = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .toLowerCase()
  .pipe(z.email("Enter a valid email address, like name@example.com."));

export const password = z
  .string()
  .min(8, "Use at least 8 characters for your password.")
  .max(72, "Use 72 characters or fewer for your password.");

const fullName = z
  .string()
  .trim()
  .min(2, "Enter your full name.")
  .max(80, "Use 80 characters or fewer for your name.");

export const fileMeta = (allowed: readonly string[], label: string) =>
  z.object({
    name: z.string(),
    type: z.string().refine((t) => allowed.includes(t), {
      message: `${label} must be ${allowed.includes("application/pdf") ? "a JPG, PNG, or PDF file" : "a JPG or PNG image"}.`,
    }),
    sizeBytes: z.number().max(MAX_UPLOAD_BYTES, `${label} must be 5 MB or smaller.`),
    dataUrl: z.string().optional(),
  });

/** Validate a browser File before reading it. Returns an error message or null. */
export function checkFile(file: { type: string; size: number }, allowed: readonly string[], label = "The file"): string | null {
  if (!allowed.includes(file.type)) {
    return `${label} must be ${allowed.includes("application/pdf") ? "a JPG, PNG, or PDF file" : "a JPG or PNG image"}.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) return `${label} is larger than 5 MB. Choose a smaller file.`;
  return null;
}

// Local calendar date (not UTC) — the store is in the Philippines (UTC+8), so UTC would be a day behind each morning.
const todayISO = () => todayISODate();

const peso = (label: string) =>
  z
    .number({ error: `Enter the ${label} in pesos.` })
    .finite(`Enter the ${label} in pesos.`)
    .min(0, `The ${label} can't be negative.`)
    .max(10_000_000, `The ${label} looks too large. Check the amount.`);

// ---------- Auth (FR-41 to FR-45) ----------
export const registerSchema = z
  .object({
    fullName,
    email,
    contactNumber: phPhone,
    password,
    confirmPassword: z.string().min(1, "Type your password again."),
    privacyConsent: z.boolean().refine((v) => v, {
      message: "Please read and agree to the Privacy Notice to create an account.",
    }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords don't match. Type the same password in both fields.",
  });
export type RegisterInput = z.input<typeof registerSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});
export type LoginInput = z.input<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string().min(1, "Type your new password again.") })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords don't match. Type the same password in both fields.",
  });

// ---------- Profile (FR-44) ----------
export const profileSchema = z.object({ fullName, contactNumber: phPhone });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: password,
    confirmPassword: z.string().min(1, "Type your new password again."),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords don't match. Type the same password in both fields.",
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "Choose a new password that is different from your current one.",
  });

// ---------- Customizer (FR-01 to FR-07) ----------
export const designExtrasSchema = z.object({
  engravingText: z.string().trim().max(20, "Engraving can be up to 20 characters.").optional(),
  notes: z.string().trim().max(500, "Notes can be up to 500 characters.").optional(),
});

// ---------- Product order (FR-14) ----------
export const productOrderSchema = z.object({
  quantity: z
    .number({ error: "Choose a quantity." })
    .int("Choose a whole number.")
    .min(1, "Order at least 1.")
    .max(5, "You can order up to 5 at a time. Contact the store for larger orders."),
  notes: z.string().trim().max(500, "Notes can be up to 500 characters.").optional(),
});

// ---------- Service request (FR-26) ----------
export const serviceRequestSchema = z
  .object({
    itemType: z.enum(["jewelry", "watch"], { error: "Choose whether this is jewelry or a watch." }),
    itemDescription: z
      .string()
      .trim()
      .min(10, "Describe your item in at least 10 characters, for example “18K gold wedding ring”.")
      .max(300, "Keep the item description to 300 characters or fewer."),
    brandModel: z.string().trim().max(80, "Keep the brand and model to 80 characters or fewer.").optional(),
    material: z.string().trim().max(80, "Keep the material to 80 characters or fewer.").optional(),
    serviceIds: z.array(z.string()).min(1, "Choose at least one service."),
    details: z
      .string()
      .trim()
      .min(10, "Tell us what's wrong or what you need, in at least 10 characters.")
      .max(1000, "Keep the details to 1,000 characters or fewer."),
    photos: z.array(fileMeta(PHOTO_TYPES, "Each photo")).max(3, "You can add up to 3 photos."),
    preferredDropOffDate: z
      .string()
      .optional()
      .refine((d) => !d || d >= todayISO(), { message: "Choose today or a later date." }),
  });
export type ServiceRequestInput = z.input<typeof serviceRequestSchema>;

// ---------- Payments (FR-17, FR-18, FR-30) ----------
export const paymentSchema = z.object({
  kind: z.enum(["down_payment", "full_payment", "balance"], { error: "Choose what this payment is for." }),
  amount: peso("amount").refine((v) => v > 0, { message: "Enter an amount greater than ₱0." }),
  paidOn: z
    .string()
    .min(1, "Enter the date you paid.")
    .refine((d) => d <= todayISO(), { message: "The payment date can't be in the future." }),
  method: z.enum(["gcash", "bank_transfer", "cash_in_store"], { error: "Choose how you paid." }),
  referenceNumber: z
    .string()
    .trim()
    .min(4, "Enter the reference number from your GCash or bank receipt (at least 4 characters).")
    .max(40, "The reference number is too long. Check it and try again."),
  proofFile: fileMeta(PROOF_TYPES, "Proof of payment").optional(),
});
export type PaymentInput = z.input<typeof paymentSchema>;

/** Customers must attach proof (FR-17); owner-recorded cash payments don't need it. */
export const customerPaymentSchema = paymentSchema
  .extend({ method: z.enum(["gcash", "bank_transfer"], { error: "Choose GCash or bank transfer." }) })
  .refine((v) => Boolean(v.proofFile), {
    path: ["proofFile"],
    message: "Upload a photo or PDF of your receipt or transfer screenshot.",
  });

export const rejectPaymentSchema = z.object({
  reason: z.string().trim().min(5, "Tell the customer why the payment was rejected (at least 5 characters)."),
});

// ---------- Owner: quotations and reviews (FR-08, FR-09, FR-15, FR-27) ----------
export const quotationSchema = z
  .object({
    finalPrice: peso("final price").refine((v) => v > 0, { message: "Enter a price greater than ₱0." }),
    downPaymentRequired: peso("down payment"),
    expectedDate: z
      .string()
      .min(1, "Choose the expected completion date.")
      .refine((d) => d >= todayISO(), { message: "Choose today or a later date." }),
    procedure: z.string().trim().max(1000, "Keep the procedure to 1,000 characters or fewer.").optional(),
    notes: z.string().trim().max(1000, "Keep the notes to 1,000 characters or fewer.").optional(),
  })
  .refine((v) => v.downPaymentRequired <= v.finalPrice, {
    path: ["downPaymentRequired"],
    message: "The down payment can't be more than the final price.",
  });
export type QuotationInput = z.input<typeof quotationSchema>;

export const serviceQuotationSchema = quotationSchema.refine((v) => (v.procedure ?? "").length >= 10, {
  path: ["procedure"],
  message: "Describe the proposed procedure in at least 10 characters.",
});

export const revisionRemarksSchema = z.object({
  text: z
    .string()
    .trim()
    .min(10, "Explain what the customer should change, in at least 10 characters.")
    .max(1000, "Keep remarks to 1,000 characters or fewer."),
});

export const reasonSchema = z.object({
  reason: z.string().trim().min(5, "Give a short reason (at least 5 characters)."),
});

export const dropOffSchema = z.object({
  receivedOn: z
    .string()
    .min(1, "Enter the date the item was received.")
    .refine((d) => d <= todayISO(), { message: "The received date can't be in the future." }),
  downPayment: peso("down payment"),
  method: z.enum(["cash_in_store", "gcash", "bank_transfer"]),
  referenceNumber: z.string().trim().max(40).optional(),
}).refine((v) => v.method === "cash_in_store" || v.downPayment === 0 || (v.referenceNumber ?? "").length >= 4, {
  path: ["referenceNumber"],
  message: "Enter the GCash or bank reference number.",
});

// ---------- Owner: catalog and settings (FR-24, FR-34, FR-46, FR-47) ----------
export const productSchema = z.object({
  name: z.string().trim().min(3, "Enter a product name (at least 3 characters).").max(80, "Keep the name to 80 characters or fewer."),
  slug: z
    .string()
    .trim()
    .min(3, "Enter a web address name (at least 3 characters).")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only, like classic-solitaire-ring."),
  category: z.enum(["ring", "pendant", "necklace", "bracelet", "earrings"], { error: "Choose a category." }),
  material: z.string().trim().min(2, "Enter the material, like 18K Gold."),
  price: peso("price").refine((v) => v > 0, { message: "Enter a price greater than ₱0." }),
  description: z.string().trim().min(10, "Write a description of at least 10 characters.").max(1000, "Keep the description to 1,000 characters or fewer."),
  availability: z.enum(["available", "made_to_order", "unavailable"]),
  hidden: z.boolean(),
  photos: z.array(z.string()).max(5, "You can add up to 5 photos."),
});
export type ProductInput = z.input<typeof productSchema>;

export const serviceCatalogSchema = z.object({
  name: z.string().trim().min(3, "Enter a service name (at least 3 characters).").max(60, "Keep the name to 60 characters or fewer."),
  description: z.string().trim().min(10, "Write a description of at least 10 characters.").max(400, "Keep the description to 400 characters or fewer."),
  appliesTo: z.array(z.enum(["jewelry", "watch"])).min(1, "Choose jewelry, watches, or both."),
  hidden: z.boolean(),
});

export const settingsSchema = z.object({
  storeName: z.string().trim().min(2, "Enter the store name."),
  address: z.string().trim().min(5, "Enter the store address."),
  contactNumber: phPhone,
  email,
  openingHours: z.string().trim().min(3, "Enter the opening hours."),
  paymentInstructions: z.string().trim().min(10, "Enter the payment instructions customers will see."),
  claimingNote: z.string().trim().min(5, "Enter the claiming note."),
});

export const faqSchema = z.object({
  question: z.string().trim().min(5, "Enter the question (at least 5 characters)."),
  answer: z.string().trim().min(10, "Enter the answer (at least 10 characters).").max(1000, "Keep answers to 1,000 characters or fewer."),
  keywords: z.array(z.string().trim().min(2)).min(1, "Add at least one keyword so the assistant can find this answer."),
  active: z.boolean(),
});

/** Option tables (FR-47): rates and fees ≥ 0, factors > 0. */
export const rateSchema = z.number({ error: "Enter a number." }).finite("Enter a number.").min(0, "This can't be negative.");
export const factorSchema = z.number({ error: "Enter a number." }).finite("Enter a number.").gt(0, "This must be greater than 0.").max(10, "This looks too large.");
export const optionLabelSchema = z.string().trim().min(1, "Enter a name.").max(40, "Keep names to 40 characters or fewer.");
