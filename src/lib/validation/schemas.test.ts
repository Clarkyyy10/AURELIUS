import { describe, expect, it } from "vitest";
import {
  checkFile,
  customerPaymentSchema,
  phPhone,
  quotationSchema,
  registerSchema,
  serviceRequestSchema,
} from "./schemas";

const firstError = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.success ? null : r.error!.issues[0].message;

const validRegister = {
  fullName: "Maria Santos",
  email: "Maria@Demo.ph ",
  contactNumber: "0917 123 4567",
  password: "secret123",
  confirmPassword: "secret123",
  privacyConsent: true,
};

describe("registerSchema (FR-41, FR-45)", () => {
  it("accepts a valid registration and normalises email and phone", () => {
    const r = registerSchema.parse(validRegister);
    expect(r.email).toBe("maria@demo.ph");
    expect(r.contactNumber).toBe("09171234567");
  });

  it("requires privacy consent", () => {
    expect(firstError(registerSchema.safeParse({ ...validRegister, privacyConsent: false }))).toMatch(/Privacy Notice/);
  });

  it("requires matching passwords of at least 8 characters", () => {
    expect(firstError(registerSchema.safeParse({ ...validRegister, password: "short", confirmPassword: "short" }))).toMatch(
      /at least 8/,
    );
    expect(firstError(registerSchema.safeParse({ ...validRegister, confirmPassword: "different1" }))).toMatch(/don't match/);
  });
});

describe("phPhone", () => {
  it.each(["09171234567", "+639171234567", "0917-123-4567"])("accepts %s", (v) => {
    expect(phPhone.safeParse(v).success).toBe(true);
  });
  it.each(["12345", "0817123456", "+63917123456", ""])("rejects %s", (v) => {
    expect(phPhone.safeParse(v).success).toBe(false);
  });
});

describe("serviceRequestSchema (FR-26)", () => {
  const base = {
    itemType: "watch",
    itemDescription: "Seiko automatic watch",
    serviceIds: ["svc-battery"],
    details: "The watch stopped running last week.",
    photos: [],
  };
  it("accepts a valid request", () => {
    expect(serviceRequestSchema.safeParse(base).success).toBe(true);
  });
  it("needs at least one service", () => {
    expect(firstError(serviceRequestSchema.safeParse({ ...base, serviceIds: [] }))).toBe("Choose at least one service.");
  });
  it("rejects past drop-off dates", () => {
    expect(firstError(serviceRequestSchema.safeParse({ ...base, preferredDropOffDate: "2000-01-01" }))).toBe(
      "Choose today or a later date.",
    );
  });
});

describe("payments (FR-17)", () => {
  const proof = { name: "receipt.png", type: "image/png", sizeBytes: 1000 };
  const base = {
    kind: "down_payment",
    amount: 5000,
    paidOn: "2026-01-05",
    method: "gcash",
    referenceNumber: "1234567890",
    proofFile: proof,
  };
  it("accepts a valid customer payment", () => {
    expect(customerPaymentSchema.safeParse(base).success).toBe(true);
  });
  it("requires proof for customer payments", () => {
    expect(firstError(customerPaymentSchema.safeParse({ ...base, proofFile: undefined }))).toMatch(/Upload a photo or PDF/);
  });
  it("rejects files over 5 MB and wrong types", () => {
    expect(checkFile({ type: "image/png", size: 6 * 1024 * 1024 }, ["image/png"])).toMatch(/larger than 5 MB/);
    expect(checkFile({ type: "image/gif", size: 10 }, ["image/png", "image/jpeg", "application/pdf"])).toMatch(
      /JPG, PNG, or PDF/,
    );
    expect(checkFile({ type: "application/pdf", size: 10 }, ["image/png", "image/jpeg", "application/pdf"])).toBeNull();
  });
  it("rejects zero amounts", () => {
    expect(firstError(customerPaymentSchema.safeParse({ ...base, amount: 0 }))).toMatch(/greater than ₱0/);
  });
});

describe("quotationSchema (FR-15)", () => {
  it("keeps the down payment at or below the final price", () => {
    const r = quotationSchema.safeParse({ finalPrice: 1000, downPaymentRequired: 2000, expectedDate: "2999-01-01" });
    expect(firstError(r)).toMatch(/can't be more than the final price/);
  });
});

describe("dates use the local calendar day", () => {
  it("accepts today's local date as a payment date, even when UTC is still yesterday", async () => {
    const { todayISODate } = await import("@/lib/utils/format");
    const r = customerPaymentSchema.safeParse({ kind: "down_payment", amount: 100, paidOn: todayISODate(), method: "gcash", referenceNumber: "1234", proofFile: { name: "a.png", type: "image/png", sizeBytes: 10 } });
    expect(r.success).toBe(true);
  });
});
