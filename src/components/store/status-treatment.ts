import {
  BadgeCheckIcon,
  BanknoteIcon,
  CircleCheckIcon,
  CircleIcon,
  ClockIcon,
  EyeIcon,
  FilePenIcon,
  HammerIcon,
  InboxIcon,
  OctagonXIcon,
  PackageCheckIcon,
  PackageIcon,
  SearchIcon,
  SendIcon,
  TriangleAlertIcon,
  Undo2Icon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";
import {
  customOrderStatuses,
  serviceStatuses,
  type CustomOrderStatus,
  type ServiceStatus,
} from "@/shared/status";

// Treatment for each status, from docs/12-ui-components.md section 2.4 and
// DESIGN.md section 11. Only the settled lifecycles are listed: custom order
// and service request (src/shared/status.ts) and the three payment proof
// states. Not listed on purpose, because they are open: the ready-made order
// sequence (N45), `proof-expired` and the extra vocabularies (D-43).

export type StatusVariant =
  | "neutral"
  | "progress"
  | "pending"
  | "complete"
  | "attention"
  | "rejected"
  | "cancelled"
  | "expired";

export const proofStatuses = {
  "proof-pending": "Pending verification",
  "proof-verified": "Verified",
  "proof-rejected": "Rejected",
} as const;

export type ProofStatus = keyof typeof proofStatuses;
export type StatusKey = CustomOrderStatus | ServiceStatus | ProofStatus;

export type StatusTreatment = {
  variant: StatusVariant;
  icon: LucideIcon;
};

// Where the same key exists in two lifecycles it has one treatment, so a
// customer sees the same look for the same status.
const treatments: Record<StatusKey, StatusTreatment> = {
  // Custom order
  draft: { variant: "neutral", icon: FilePenIcon },
  submitted: { variant: "neutral", icon: SendIcon },
  "under-review": { variant: "neutral", icon: EyeIcon },
  rejected: { variant: "rejected", icon: OctagonXIcon },
  "design-approved": { variant: "complete", icon: BadgeCheckIcon },
  "quotation-issued": { variant: "pending", icon: ClockIcon },
  "quotation-accepted": { variant: "complete", icon: CircleCheckIcon },
  declined: { variant: "attention", icon: TriangleAlertIcon },
  "down-payment-verified": { variant: "complete", icon: BanknoteIcon },
  "in-production": { variant: "progress", icon: HammerIcon },
  "ready-for-claiming": { variant: "complete", icon: PackageIcon },
  claimed: { variant: "complete", icon: PackageCheckIcon },
  unclaimed: { variant: "attention", icon: TriangleAlertIcon },
  // Service request (extra keys only)
  received: { variant: "progress", icon: InboxIcon },
  "under-assessment": { variant: "progress", icon: SearchIcon },
  "quotation-declined": { variant: "attention", icon: TriangleAlertIcon },
  "return-pending": { variant: "pending", icon: Undo2Icon },
  "in-progress": { variant: "progress", icon: WrenchIcon },
  completed: { variant: "complete", icon: CircleCheckIcon },
  // Payment proof
  "proof-pending": { variant: "pending", icon: ClockIcon },
  "proof-verified": { variant: "complete", icon: BadgeCheckIcon },
  "proof-rejected": { variant: "rejected", icon: OctagonXIcon },
};

const labels: Record<StatusKey, string> = {
  ...customOrderStatuses,
  ...serviceStatuses,
  ...proofStatuses,
};

// Statuses that must show a reason beside the label (docs/12 section 2.2).
const reasonRequired: ReadonlySet<string> = new Set([
  "rejected",
  "proof-rejected",
]);

export const statusKeys = Object.keys(treatments) as StatusKey[];

export function isStatusKey(value: string): value is StatusKey {
  return Object.hasOwn(treatments, value);
}

export function requiresReason(status: string): boolean {
  return reasonRequired.has(status);
}

// An unknown key still shows its own text with the neutral treatment, so a
// status is never hidden (docs/12 section 2.5).
export function getStatusTreatment(status: string): {
  label: string;
  variant: StatusVariant;
  icon: LucideIcon;
  known: boolean;
} {
  if (isStatusKey(status)) {
    return { label: labels[status], known: true, ...treatments[status] };
  }
  return { label: status, known: false, variant: "neutral", icon: CircleIcon };
}
