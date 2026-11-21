// Status machines — docs/data-model.md §7. Every status change in the app goes through here.
// FR-19/FR-20/FR-22 (orders), FR-07 to FR-11/FR-15/FR-22 (custom orders), FR-27 to FR-33 (services).

import type { Actor, AnyStatus, CustomOrderStatus, OrderStatus, ServiceStatus, TransactionKind } from "@/types";

type Rule<S extends string> = { to: S; by: Actor[] };
type Machine<S extends string> = {
  initial: S;
  final: readonly S[];
  /** Statuses in which the customer may cancel. */
  customerCancellable: readonly S[];
  transitions: Record<S, Rule<S>[]>;
};

const C: Actor[] = ["customer"];
const O: Actor[] = ["owner"];
const BOTH: Actor[] = ["customer", "owner"];

/** Adds "→ cancelled" to every non-final status: customer where allowed, owner always. */
function withCancel<S extends string>(m: Omit<Machine<S>, "transitions"> & { transitions: Record<S, Rule<S>[]> }, cancelled: S): Machine<S> {
  const transitions = { ...m.transitions };
  for (const from of Object.keys(transitions) as S[]) {
    if (m.final.includes(from)) continue;
    const by: Actor[] = m.customerCancellable.includes(from) ? BOTH : O;
    transitions[from] = [...transitions[from], { to: cancelled, by }];
  }
  return { ...m, transitions };
}

export const orderMachine: Machine<OrderStatus> = withCancel<OrderStatus>(
  {
    initial: "pending",
    final: ["completed", "declined", "rejected", "cancelled"],
    customerCancellable: ["pending", "quoted", "awaiting_payment"],
    transitions: {
      pending: [
        { to: "quoted", by: O },
        { to: "rejected", by: O },
      ],
      quoted: [
        { to: "awaiting_payment", by: C }, // accept with a down payment
        { to: "confirmed", by: C }, // accept when no down payment is required
        { to: "declined", by: C },
      ],
      awaiting_payment: [{ to: "confirmed", by: O }], // payment verified
      confirmed: [
        { to: "in_production", by: O }, // made-to-order only
        { to: "ready_for_claiming", by: O }, // ready-made items
      ],
      in_production: [{ to: "ready_for_claiming", by: O }],
      ready_for_claiming: [{ to: "completed", by: O }],
      completed: [],
      declined: [],
      rejected: [],
      cancelled: [],
    },
  },
  "cancelled",
);

export const customOrderMachine: Machine<CustomOrderStatus> = withCancel<CustomOrderStatus>(
  {
    initial: "submitted",
    final: ["completed", "declined", "rejected", "cancelled"],
    customerCancellable: ["submitted", "under_review", "revision_requested", "approved", "quoted", "awaiting_payment"],
    transitions: {
      submitted: [{ to: "under_review", by: O }], // owner opens it
      under_review: [
        { to: "revision_requested", by: O }, // FR-09
        { to: "approved", by: O }, // FR-11
        { to: "rejected", by: O }, // FR-08
      ],
      revision_requested: [{ to: "under_review", by: C }], // FR-10 resubmit
      approved: [{ to: "quoted", by: O }], // FR-15
      quoted: [
        { to: "awaiting_payment", by: C },
        { to: "confirmed", by: C }, // no down payment required
        { to: "declined", by: C },
      ],
      awaiting_payment: [{ to: "confirmed", by: O }],
      confirmed: [{ to: "in_production", by: O }],
      in_production: [{ to: "ready_for_claiming", by: O }],
      ready_for_claiming: [{ to: "completed", by: O }],
      completed: [],
      declined: [],
      rejected: [],
      cancelled: [],
    },
  },
  "cancelled",
);

export const serviceMachine: Machine<ServiceStatus> = withCancel<ServiceStatus>(
  {
    initial: "submitted",
    final: ["claimed", "declined", "cancelled"],
    // FR-33: before the owner begins work (in_progress)
    customerCancellable: ["submitted", "under_assessment", "quoted", "awaiting_drop_off", "received"],
    transitions: {
      submitted: [{ to: "under_assessment", by: O }],
      under_assessment: [{ to: "quoted", by: O }],
      quoted: [
        { to: "awaiting_drop_off", by: C }, // accept, item not yet in the store
        { to: "received", by: C }, // accept a re-issued quotation for an item already in the store
        { to: "declined", by: C },
      ],
      awaiting_drop_off: [{ to: "received", by: O }], // FR-30 drop-off + down payment
      received: [
        { to: "under_assessment", by: O }, // physical inspection, may re-quote
        { to: "in_progress", by: O },
      ],
      in_progress: [{ to: "completed", by: O }],
      completed: [{ to: "ready_for_claiming", by: O }],
      ready_for_claiming: [{ to: "claimed", by: O }],
      claimed: [],
      declined: [],
      cancelled: [],
    },
  },
  "cancelled",
);

const machines = {
  order: orderMachine,
  custom: customOrderMachine,
  service: serviceMachine,
} as const;

export type MachineKind = TransactionKind;

export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: string,
    public readonly to: string,
    public readonly actor: Actor,
  ) {
    super(
      `This request can't move from "${statusLabel(from)}" to "${statusLabel(to)}"` +
        (actor === "customer" ? ". Please contact the store if you need help." : "."),
    );
    this.name = "InvalidTransitionError";
  }
}

function getMachine(kind: MachineKind): Machine<string> {
  return machines[kind] as unknown as Machine<string>;
}

export function canTransition(kind: MachineKind, from: AnyStatus, to: AnyStatus, actor: Actor): boolean {
  const rules = getMachine(kind).transitions[from];
  if (!rules) return false;
  return rules.some((r) => r.to === to && r.by.includes(actor));
}

/** Throws InvalidTransitionError when the move is not allowed. */
export function assertTransition(kind: MachineKind, from: AnyStatus, to: AnyStatus, actor: Actor): void {
  if (!canTransition(kind, from, to, actor)) throw new InvalidTransitionError(from, to, actor);
}

/** Statuses the actor may move to from `from`. Excludes "cancelled" unless includeCancel is true. */
export function nextStatuses(kind: MachineKind, from: AnyStatus, actor: Actor, includeCancel = false): AnyStatus[] {
  const rules = getMachine(kind).transitions[from] ?? [];
  return rules
    .filter((r) => r.by.includes(actor) && (includeCancel || r.to !== "cancelled"))
    .map((r) => r.to as AnyStatus);
}

export function isFinal(kind: MachineKind, status: AnyStatus): boolean {
  return getMachine(kind).final.includes(status);
}

/** FR-22 / FR-33 */
export function canCustomerCancel(kind: MachineKind, status: AnyStatus): boolean {
  return canTransition(kind, status, "cancelled", "customer");
}

export function allStatuses(kind: MachineKind): AnyStatus[] {
  return Object.keys(getMachine(kind).transitions) as AnyStatus[];
}

export function initialStatus(kind: MachineKind): AnyStatus {
  return getMachine(kind).initial as AnyStatus;
}

/** Plain-English labels — docs/data-model.md §7 and frontend-spec §6. */
const LABELS: Record<string, string> = {
  pending: "Submitted",
  submitted: "Submitted",
  under_review: "Under review",
  under_assessment: "Under assessment",
  revision_requested: "Revision requested",
  approved: "Design approved",
  quoted: "Quotation ready",
  awaiting_payment: "Waiting for payment",
  awaiting_drop_off: "Waiting for drop-off",
  confirmed: "Confirmed",
  received: "Item received",
  in_production: "In production",
  in_progress: "In progress",
  completed: "Completed",
  ready_for_claiming: "Ready for claiming",
  claimed: "Claimed",
  declined: "Declined",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function statusLabel(status: string): string {
  return LABELS[status] ?? status;
}

export type StatusTone = "info" | "warning" | "success" | "danger" | "muted" | "highlight";

const TONES: Record<string, StatusTone> = {
  pending: "info",
  submitted: "info",
  under_review: "info",
  under_assessment: "info",
  revision_requested: "warning",
  approved: "success",
  quoted: "warning",
  awaiting_payment: "warning",
  awaiting_drop_off: "warning",
  confirmed: "success",
  received: "info",
  in_production: "info",
  in_progress: "info",
  completed: "success",
  ready_for_claiming: "highlight",
  claimed: "muted",
  declined: "danger",
  rejected: "danger",
  cancelled: "muted",
};

export function statusTone(status: string): StatusTone {
  return TONES[status] ?? "muted";
}

/**
 * The "happy path" for a timeline: the steps a record normally goes through, used to show
 * future steps greyed out in StatusTimeline.
 */
export function happyPath(kind: MachineKind): AnyStatus[] {
  switch (kind) {
    case "order":
      return ["pending", "quoted", "awaiting_payment", "confirmed", "ready_for_claiming", "completed"];
    case "custom":
      return ["submitted", "under_review", "approved", "quoted", "awaiting_payment", "confirmed", "in_production", "ready_for_claiming", "completed"];
    case "service":
      return ["submitted", "under_assessment", "quoted", "awaiting_drop_off", "received", "in_progress", "completed", "ready_for_claiming", "claimed"];
  }
}
