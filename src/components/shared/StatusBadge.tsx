// Status badges without colour (docs/design/DESIGN.md §11, D-30). Every status has a text label plus
// an icon, a border style, a weight and a fill, so states can be told apart without colour and in
// high-contrast mode. Six classes; "stopped" has three looks (rejected, cancelled, expired).

import {
  BadgeCheckIcon,
  BanIcon,
  CircleCheckIcon,
  CircleDotIcon,
  CircleIcon,
  ClockIcon,
  EyeIcon,
  HammerIcon,
  InboxIcon,
  LoaderIcon,
  OctagonXIcon,
  PackageCheckIcon,
  PackageIcon,
  SearchIcon,
  SendIcon,
  TriangleAlertIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { statusLabel } from "@/lib/status/machines";

export type StatusClass = "neutral" | "progress" | "pending" | "complete" | "attention" | "rejected" | "cancelled" | "expired";

export const STATUS_CLASS: Record<StatusClass, string> = {
  neutral: "border border-grey-500 bg-white font-medium text-black",
  progress: "border border-black bg-grey-100 font-medium text-black",
  pending: "border border-dashed border-black bg-white font-medium text-black",
  complete: "border border-black bg-black font-semibold text-white",
  attention: "border-2 border-black bg-white font-semibold text-black",
  rejected: "status-hatch border-[3px] border-double border-black font-semibold text-black",
  cancelled: "status-hatch border-2 border-black font-semibold text-black",
  expired: "border border-dotted border-grey-600 bg-grey-100 font-medium text-grey-600",
};

/** Each status the app uses → its class and icon. The same status looks the same everywhere. */
const TREATMENT: Record<string, [StatusClass, LucideIcon]> = {
  // order, custom order and service lifecycles (src/lib/status/machines.ts)
  submitted: ["neutral", SendIcon],
  pending: ["neutral", CircleIcon],
  under_review: ["neutral", EyeIcon],
  revision_requested: ["attention", TriangleAlertIcon],
  approved: ["complete", BadgeCheckIcon],
  quoted: ["pending", ClockIcon],
  awaiting_payment: ["pending", ClockIcon],
  awaiting_drop_off: ["pending", ClockIcon],
  confirmed: ["progress", CircleDotIcon],
  received: ["progress", InboxIcon],
  under_assessment: ["progress", SearchIcon],
  in_production: ["progress", HammerIcon],
  in_progress: ["progress", WrenchIcon],
  completed: ["complete", CircleCheckIcon],
  ready_for_claiming: ["complete", PackageIcon],
  claimed: ["complete", PackageCheckIcon],
  declined: ["attention", TriangleAlertIcon],
  rejected: ["rejected", OctagonXIcon],
  cancelled: ["cancelled", BanIcon],
  // payment proofs
  pending_verification: ["pending", ClockIcon],
  verified: ["complete", CircleCheckIcon],
};

export function statusTreatment(status: string): [StatusClass, LucideIcon] {
  return TREATMENT[status] ?? ["neutral", LoaderIcon];
}

const BASE = "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-0.5 text-xs leading-snug [&>svg]:size-3.5 [&>svg]:shrink-0";

function Pill({ cls, Icon, children, className }: { cls: StatusClass; Icon: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(BASE, STATUS_CLASS[cls], className)}>
      <Icon aria-hidden="true" />
      {children}
    </span>
  );
}

/** One badge for every status — frontend-spec §6, DESIGN.md §11. */
export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  const [cls, Icon] = statusTreatment(status);
  return (
    <Pill cls={cls} Icon={Icon} className={className}>
      {label ?? statusLabel(status)}
    </Pill>
  );
}

const AVAILABILITY: Record<string, [string, StatusClass, LucideIcon]> = {
  available: ["Available", "neutral", CircleCheckIcon],
  made_to_order: ["Made to order", "pending", HammerIcon],
  unavailable: ["Unavailable", "expired", BanIcon],
};

/** FR-13 availability badge. */
export function AvailabilityBadge({ value, className }: { value: string; className?: string }) {
  const [label, cls, Icon] = AVAILABILITY[value] ?? [value, "neutral" as StatusClass, CircleIcon];
  return (
    <Pill cls={cls} Icon={Icon} className={className}>
      {label}
    </Pill>
  );
}

const PAYMENT_LABEL: Record<string, string> = {
  pending_verification: "Waiting: verification",
  verified: "Verified",
  rejected: "Rejected",
};

export function PaymentStatusBadge({ status }: { status: string }) {
  const [cls, Icon] = statusTreatment(status);
  return (
    <Pill cls={cls} Icon={Icon}>
      {PAYMENT_LABEL[status] ?? status}
    </Pill>
  );
}
