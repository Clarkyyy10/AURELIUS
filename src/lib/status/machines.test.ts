import { describe, expect, it } from "vitest";
import {
  allStatuses,
  assertTransition,
  canCustomerCancel,
  canTransition,
  InvalidTransitionError,
  nextStatuses,
  statusLabel,
  type MachineKind,
} from "./machines";
import type { Actor, AnyStatus } from "@/types";

type T = [from: AnyStatus, to: AnyStatus, actor: Actor];

// The complete list of allowed moves, written out by hand from docs/data-model.md §7.
// The test checks that EVERY listed move is allowed and EVERY other combination is refused.
const expected: Record<MachineKind, T[]> = {
  order: [
    ["pending", "quoted", "owner"],
    ["pending", "rejected", "owner"],
    ["pending", "cancelled", "customer"],
    ["pending", "cancelled", "owner"],
    ["quoted", "awaiting_payment", "customer"],
    ["quoted", "confirmed", "customer"],
    ["quoted", "declined", "customer"],
    ["quoted", "cancelled", "customer"],
    ["quoted", "cancelled", "owner"],
    ["awaiting_payment", "confirmed", "owner"],
    ["awaiting_payment", "cancelled", "customer"],
    ["awaiting_payment", "cancelled", "owner"],
    ["confirmed", "in_production", "owner"],
    ["confirmed", "ready_for_claiming", "owner"],
    ["confirmed", "cancelled", "owner"],
    ["in_production", "ready_for_claiming", "owner"],
    ["in_production", "cancelled", "owner"],
    ["ready_for_claiming", "completed", "owner"],
    ["ready_for_claiming", "cancelled", "owner"],
  ],
  custom: [
    ["submitted", "under_review", "owner"],
    ["submitted", "cancelled", "customer"],
    ["submitted", "cancelled", "owner"],
    ["under_review", "revision_requested", "owner"],
    ["under_review", "approved", "owner"],
    ["under_review", "rejected", "owner"],
    ["under_review", "cancelled", "customer"],
    ["under_review", "cancelled", "owner"],
    ["revision_requested", "under_review", "customer"],
    ["revision_requested", "cancelled", "customer"],
    ["revision_requested", "cancelled", "owner"],
    ["approved", "quoted", "owner"],
    ["approved", "cancelled", "customer"],
    ["approved", "cancelled", "owner"],
    ["quoted", "awaiting_payment", "customer"],
    ["quoted", "confirmed", "customer"],
    ["quoted", "declined", "customer"],
    ["quoted", "cancelled", "customer"],
    ["quoted", "cancelled", "owner"],
    ["awaiting_payment", "confirmed", "owner"],
    ["awaiting_payment", "cancelled", "customer"],
    ["awaiting_payment", "cancelled", "owner"],
    ["confirmed", "in_production", "owner"],
    ["confirmed", "cancelled", "owner"],
    ["in_production", "ready_for_claiming", "owner"],
    ["in_production", "cancelled", "owner"],
    ["ready_for_claiming", "completed", "owner"],
    ["ready_for_claiming", "cancelled", "owner"],
  ],
  service: [
    ["submitted", "under_assessment", "owner"],
    ["submitted", "cancelled", "customer"],
    ["submitted", "cancelled", "owner"],
    ["under_assessment", "quoted", "owner"],
    ["under_assessment", "cancelled", "customer"],
    ["under_assessment", "cancelled", "owner"],
    ["quoted", "awaiting_drop_off", "customer"],
    ["quoted", "received", "customer"],
    ["quoted", "declined", "customer"],
    ["quoted", "cancelled", "customer"],
    ["quoted", "cancelled", "owner"],
    ["awaiting_drop_off", "received", "owner"],
    ["awaiting_drop_off", "cancelled", "customer"],
    ["awaiting_drop_off", "cancelled", "owner"],
    ["received", "under_assessment", "owner"],
    ["received", "in_progress", "owner"],
    ["received", "cancelled", "customer"],
    ["received", "cancelled", "owner"],
    ["in_progress", "completed", "owner"],
    ["in_progress", "cancelled", "owner"],
    ["completed", "ready_for_claiming", "owner"],
    ["completed", "cancelled", "owner"],
    ["ready_for_claiming", "claimed", "owner"],
    ["ready_for_claiming", "cancelled", "owner"],
  ],
};

const actors: Actor[] = ["customer", "owner"];

describe.each(Object.keys(expected) as MachineKind[])("%s status machine", (kind) => {
  const allowed = expected[kind];
  const key = (t: T) => t.join("|");
  const allowedKeys = new Set(allowed.map(key));

  it.each(allowed)("allows %s → %s by %s", (from, to, actor) => {
    expect(canTransition(kind, from, to, actor)).toBe(true);
    expect(() => assertTransition(kind, from, to, actor)).not.toThrow();
  });

  it("refuses every move that is not listed", () => {
    const statuses = allStatuses(kind);
    let refused = 0;
    for (const from of statuses)
      for (const to of statuses)
        for (const actor of actors) {
          if (allowedKeys.has(key([from, to, actor]))) continue;
          expect(canTransition(kind, from, to, actor), `${from} → ${to} by ${actor}`).toBe(false);
          expect(() => assertTransition(kind, from, to, actor)).toThrow(InvalidTransitionError);
          refused++;
        }
    expect(refused).toBeGreaterThan(0);
  });
});

describe("customer cancellation (FR-22, FR-33)", () => {
  it("orders: only before confirmation", () => {
    expect(["pending", "quoted", "awaiting_payment"].every((s) => canCustomerCancel("order", s as AnyStatus))).toBe(true);
    expect(["confirmed", "in_production", "ready_for_claiming", "completed"].some((s) => canCustomerCancel("order", s as AnyStatus))).toBe(false);
  });

  it("custom orders: before payment is confirmed", () => {
    expect(canCustomerCancel("custom", "revision_requested")).toBe(true);
    expect(canCustomerCancel("custom", "awaiting_payment")).toBe(true);
    expect(canCustomerCancel("custom", "confirmed")).toBe(false);
    expect(canCustomerCancel("custom", "in_production")).toBe(false);
  });

  it("services: before work begins", () => {
    expect(canCustomerCancel("service", "received")).toBe(true);
    expect(canCustomerCancel("service", "in_progress")).toBe(false);
    expect(canCustomerCancel("service", "ready_for_claiming")).toBe(false);
  });
});

describe("helpers", () => {
  it("nextStatuses lists the owner's options without cancel by default", () => {
    expect(nextStatuses("service", "received", "owner")).toEqual(["under_assessment", "in_progress"]);
    expect(nextStatuses("service", "received", "owner", true)).toContain("cancelled");
  });

  it("final statuses have no next steps", () => {
    expect(nextStatuses("order", "completed", "owner", true)).toEqual([]);
    expect(nextStatuses("service", "claimed", "owner", true)).toEqual([]);
  });

  it("error messages are plain English", () => {
    try {
      assertTransition("order", "completed", "pending", "customer");
    } catch (e) {
      expect((e as Error).message).toBe(
        'This request can\'t move from "Completed" to "Submitted". Please contact the store if you need help.',
      );
    }
    expect(statusLabel("awaiting_drop_off")).toBe("Waiting for drop-off");
  });
});
