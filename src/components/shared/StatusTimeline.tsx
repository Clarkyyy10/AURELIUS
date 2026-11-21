import { Check } from "lucide-react";
import { happyPath, isFinal, statusLabel, type MachineKind } from "@/lib/status/machines";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/format";
import type { AnyStatus, HistoryEntry } from "@/types";

/**
 * Vertical timeline (FR-19, FR-31): past steps with dates and notes, the current step highlighted,
 * and the usual future steps greyed out.
 */
export function StatusTimeline({ kind, history, current }: { kind: MachineKind; history: HistoryEntry[]; current: AnyStatus }) {
  const path = happyPath(kind);
  const visited = new Set(history.map((h) => h.status));
  const lastIndex = Math.max(...history.map((h) => path.indexOf(h.status)), -1);
  const future = isFinal(kind, current) ? [] : path.slice(lastIndex + 1).filter((s) => !visited.has(s) || s === current);

  return (
    <ol className="relative space-y-0" aria-label="Status history">
      {history.map((h, i) => {
        const isCurrent = i === history.length - 1;
        return (
          <li key={`${h.status}-${h.at}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
            <Rail done={!isCurrent || isFinal(kind, current)} current={isCurrent} last={isCurrent && future.length === 0} />
            <div className={cn("min-w-0 pt-0.5", isCurrent && "font-medium")}>
              <p className={cn(isCurrent ? "text-ink" : "text-ink/80")}>
                {statusLabel(h.status)}
                {isCurrent && <span className="sr-only"> (current status)</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(h.at)} · {h.by === "owner" ? "Store" : "You / customer"}
              </p>
              {h.note && <p className="mt-1 rounded-md bg-muted px-2 py-1 text-sm font-normal text-ink/80">{h.note}</p>}
            </div>
          </li>
        );
      })}
      {future.map((s, i) => (
        <li key={`future-${s}`} className="relative flex gap-3 pb-5 last:pb-0 text-muted-foreground/70">
          <Rail future last={i === future.length - 1} />
          <p className="pt-0.5 text-sm">{statusLabel(s)}</p>
        </li>
      ))}
    </ol>
  );
}

function Rail({ done, current, future, last }: { done?: boolean; current?: boolean; future?: boolean; last?: boolean }) {
  return (
    <div className="relative flex w-6 shrink-0 justify-center" aria-hidden>
      {!last && <span className={cn("absolute top-6 bottom-0 w-px", future ? "bg-line" : "bg-gold/50")} />}
      <span
        className={cn(
          "relative z-10 mt-0.5 flex size-5 items-center justify-center rounded-full border-2",
          future && "border-line bg-paper",
          done && !current && "border-gold bg-gold text-white",
          current && "border-gold-dark bg-paper ring-4 ring-gold/20",
        )}
      >
        {done && !current && <Check className="size-3" />}
        {current && <span className="size-2 rounded-full bg-gold-dark" />}
      </span>
    </div>
  );
}
