import { cn } from "@/lib/utils";
import type { DesignConfig, DesignLabels } from "@/types";

const ROWS: [keyof DesignLabels, string][] = [
  ["productType", "Piece"],
  ["style", "Style"],
  ["name", "Name"],
  ["styleText", "Letters / text"],
  ["font", "Font"],
  ["material", "Material"],
  ["finish", "Color / finish"],
  ["gemstone", "Gemstone"],
  ["cut", "Cut"],
  ["size", "Size"],
  ["chain", "Chain style"],
  ["clasp", "Clasp"],
  ["setting", "Setting"],
  ["profile", "Band shape"],
  ["shank", "Shank"],
  ["texture", "Texture"],
];

/** Read-only list of a design's specifications. `highlight` marks changed fields (version compare). */
export function DesignSpecList({
  labels,
  config,
  highlight = [],
  className,
}: {
  labels: DesignLabels;
  config?: Pick<DesignConfig, "engravingText" | "notes">;
  highlight?: (keyof DesignLabels)[];
  className?: string;
}) {
  return (
    <dl className={cn("grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-2 text-sm", className)}>
      {ROWS.filter(([k]) => labels[k] != null).map(([k, name]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{name}</dt>
          <dd className={cn("font-medium", highlight.includes(k) && "rounded-sm border border-dashed border-black px-1")}>
            {labels[k]}
            {highlight.includes(k) && <span className="sr-only"> (changed)</span>}
          </dd>
        </div>
      ))}
      {config?.engravingText && (
        <div className="contents">
          <dt className="text-muted-foreground">Engraving</dt>
          <dd className="font-medium">“{config.engravingText}”</dd>
        </div>
      )}
      {config?.notes && (
        <div className="contents">
          <dt className="text-muted-foreground">Notes</dt>
          <dd className="whitespace-pre-line">{config.notes}</dd>
        </div>
      )}
    </dl>
  );
}
