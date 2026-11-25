import { Badge } from "@/components/ui/badge";
import {
  getStatusTreatment,
  requiresReason,
  type StatusKey,
} from "@/components/store/status-treatment";

type StatusBadgeProps = {
  status: StatusKey;
  /** Required when the status is a rejection. Shown as text beside the badge. */
  reason?: string;
  /** Shown as text beside the badge, for example the date a claim happened. */
  date?: Date | string;
  size?: "sm" | "md";
};

function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "long",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

// docs/12-ui-components.md section 2. The label is always visible text. The
// icon is decoration. Reason and date are sibling text so a screen reader
// reads them with the label. Not built yet: the `announce` live region.
export function StatusBadge({
  status,
  reason,
  date,
  size = "md",
}: StatusBadgeProps) {
  const { label, variant, icon: Icon, known } = getStatusTreatment(status);
  if (!known && process.env.NODE_ENV !== "production") {
    console.warn(`StatusBadge: unknown status "${status}"`);
  }

  const detail = requiresReason(status)
    ? `Reason: ${reason?.trim() ? reason : "Reason not recorded"}`
    : reason
      ? `Reason: ${reason}`
      : null;

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <Badge variant={variant} size={size}>
        <Icon aria-hidden="true" />
        {label}
      </Badge>
      {detail ? (
        <span className="type-small text-muted-foreground">{detail}</span>
      ) : null}
      {date ? (
        <span className="type-small text-muted-foreground">
          {formatDate(date)}
        </span>
      ) : null}
    </span>
  );
}
