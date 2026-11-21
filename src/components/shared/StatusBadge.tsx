import { cn } from "@/lib/utils";
import { statusLabel, statusTone, type StatusTone } from "@/lib/status/machines";

const toneClass: Record<StatusTone, string> = {
  info: "bg-info/10 text-info border-info/25",
  warning: "bg-warning/10 text-[#8a5a10] border-warning/30",
  success: "bg-success/10 text-success border-success/25",
  danger: "bg-danger/10 text-danger border-danger/25",
  muted: "bg-muted text-muted-foreground border-line",
  highlight: "bg-success text-white border-success",
};

/** One badge for every status — frontend-spec §6. */
export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClass[statusTone(status)],
        className,
      )}
    >
      {label ?? statusLabel(status)}
    </span>
  );
}

const availability: Record<string, [string, string]> = {
  available: ["Available", "bg-success/10 text-success border-success/25"],
  made_to_order: ["Made to order", "bg-info/10 text-info border-info/25"],
  unavailable: ["Unavailable", "bg-muted text-muted-foreground border-line"],
};

/** FR-13 availability badge. */
export function AvailabilityBadge({ value, className }: { value: string; className?: string }) {
  const [label, cls] = availability[value] ?? [value, ""];
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", cls, className)}>{label}</span>;
}

const paymentTone: Record<string, [string, string]> = {
  pending_verification: ["Waiting for verification", "bg-warning/10 text-[#8a5a10] border-warning/30"],
  verified: ["Verified", "bg-success/10 text-success border-success/25"],
  rejected: ["Rejected", "bg-danger/10 text-danger border-danger/25"],
};

export function PaymentStatusBadge({ status }: { status: string }) {
  const [label, cls] = paymentTone[status] ?? [status, ""];
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium", cls)}>{label}</span>;
}
