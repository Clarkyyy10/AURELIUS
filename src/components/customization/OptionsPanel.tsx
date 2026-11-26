"use client";

import { Check, Info, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ChainFamily, CustomizationOptions, DesignConfig, DesignOption, OptionGroup, ProductType } from "@/types";
import { GROUP_LABEL, optionsFor, stoneRule, styleOf, styleTextProblem, usesChain } from "@/lib/pricing/design";
import { ZODIAC_SIGNS } from "@/lib/data/seed/designs";
import { NAME_MAX, nameProblem } from "@/lib/pricing/name";

const CHAIN_GROUPS: [ChainFamily, string][] = [
  ["rings", "Linked rings"],
  ["flat", "Flat links"],
  ["woven", "Woven and twisted"],
  ["tube", "Smooth and tube chains"],
];

export function PieceIcon({ type, className }: { type: ProductType; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6", className)} aria-hidden>
      {type === "ring" && (
        <g {...common}>
          <ellipse cx="12" cy="14" rx="6.5" ry="7" />
          <path d="M10 5.5 12 3l2 2.5" />
        </g>
      )}
      {type === "pendant" && (
        <g {...common}>
          <path d="M4 3c3 4 13 4 16 0" />
          <circle cx="12" cy="7.5" r="1.3" />
          <path d="M12 9.5c3 0 4 4 0 8-4-4-3-8 0-8Z" />
        </g>
      )}
      {type === "necklace" && (
        <g {...common}>
          <path d="M4 3c0 9 3 15 8 15s8-6 8-15" strokeDasharray="1.6 1.6" />
          <circle cx="12" cy="19" r="1.5" />
        </g>
      )}
      {type === "bracelet" && (
        <g {...common}>
          <ellipse cx="12" cy="12" rx="8.5" ry="5" />
          <ellipse cx="12" cy="12" rx="6" ry="3" />
        </g>
      )}
      {type === "name_pendant" && (
        <g {...common}>
          <path d="M3 5c3 3 15 3 18 0" />
          <path d="M5 16c1-4 2-6 3-6s1 5 2 5 1.5-5 3-5 1 5 2.5 5 1.5-3 3.5-3" />
          <path d="M4 18h16" />
        </g>
      )}
      {type === "anklet" && (
        <g {...common}>
          <path d="M9 3v8c0 2 1 3 3 4l5 2c2 1 2 3 1 4H8" />
          <path d="M6.5 12.5c2 2 6 3 9 2" strokeDasharray="1.4 1.4" />
        </g>
      )}
      {type === "toe_ring" && (
        <g {...common}>
          <path d="M8 21v-8a4 4 0 0 1 8 0v8" />
          <ellipse cx="12" cy="15" rx="5" ry="1.8" />
        </g>
      )}
      {type === "earrings" && (
        <g {...common}>
          <circle cx="7" cy="7" r="1.2" />
          <path d="M7 8.5v2M7 10.5c2 1 2 5 0 7-2-2-2-6 0-7Z" />
          <circle cx="17" cy="7" r="1.2" />
          <path d="M17 8.5v2M17 10.5c2 1 2 5 0 7-2-2-2-6 0-7Z" />
        </g>
      )}
    </svg>
  );
}

const MEASURE: Partial<Record<ProductType, string>> = {
  ring: "Wrap a thin strip of paper around the base of your finger, mark where it meets, and measure the length (inner circumference). US 7 ≈ 54.4 mm. You can also bring a ring that fits to the store.",
  necklace:
    "Measure a necklace you like from clasp end to clasp end. Choker (14 in) sits around the neck, Princess (18 in) just below the collarbone, Matinee (20–24 in) on the upper chest, Opera (30 in) mid-chest.",
  bracelet: "Measure around your wrist bone with a soft tape and add about 0.5 in (1.3 cm) for comfort.",
  pendant: "Small is about 1.5 cm tall, Medium about 2 cm, Large about 2.5 cm.",
  earrings: "Small is about 6 mm across, Medium about 8 mm, Large about 10 mm.",
  anklet: "Measure around your ankle just above the ankle bone and add about 0.5 in (1.3 cm) so it hangs loosely.",
  toe_ring: "Small fits most second toes; choose Large for a looser fit. An open toe ring can be adjusted.",
  name_pendant: "The size is the height of the capital letters. Longer names make a wider pendant; the owner confirms the final size and price.",
};

function Choice({
  selected,
  onClick,
  children,
  className,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={onClick}
      className={cn(
        // DESIGN.md §11: selected = 2 px black border + check icon + aria-checked (never colour alone).
        "relative rounded-none border bg-white text-sm transition-colors duration-150 hover:bg-grey-50",
        selected ? "border-black shadow-[inset_0_0_0_1px_#000]" : "border-grey-500",
        className,
        // Room for the check mark; applied after className so a caller padding (px-4) cannot remove it.
        selected && "pr-7",
      )}
    >
      {children}
      {selected && <Check className="absolute top-2 right-2 size-4" strokeWidth={2} aria-hidden />}
    </button>
  );
}

/** Cards for one design-option group, grouped by family when there is more than one. */
function GroupPicker({ group, list, value, onPick }: { group: OptionGroup; list: DesignOption[]; value?: string; onPick: (id: string) => void }) {
  const families = [...new Set(list.map((o) => o.family ?? ""))];
  const grouped = families.length > 1;
  return (
    <div role="radiogroup" aria-label={GROUP_LABEL[group]} className="space-y-3">
      {families.map((fam) => (
        <div key={fam}>
          {grouped && fam && <p className="mb-1.5 text-xs font-medium text-muted-foreground">{fam}</p>}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-2">
            {list
              .filter((o) => (o.family ?? "") === fam)
              .map((o) => (
                <Choice
                  key={o.id}
                  selected={o.id === value}
                  onClick={() => onPick(o.id)}
                  className="min-w-0 px-3 py-2 text-left break-words hyphens-auto"
                  label={o.label}
                >
                  <span className="block font-medium">{o.label}</span>
                  <span className="block text-xs leading-snug text-muted-foreground">{o.description}</span>
                </Choice>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Where the 3D preview shows the engraving (matches the models in this folder). */
function engravingSpot(type: ProductType, style?: string): string {
  if (type === "ring" || type === "toe_ring") return "It is shown inside the band.";
  if (type === "pendant") return "It is shown on the back. Drag the piece to turn it.";
  if (type === "earrings") return "Earrings are too small to show it in 3D; the owner engraves it as you wrote it.";
  if (type === "bracelet" && style === "id_bar") return "It is shown inside the ID plate.";
  if (type === "bracelet" && !["chain_bracelet", "station", "charm"].includes(style ?? "")) return "It is shown inside the band.";
  return "It is shown on a small tag by the clasp.";
}

// Flat sections with a plain heading (the storefront design has no accordions or step numbers).
function Accordion({ children, className }: { children: React.ReactNode; className?: string; type?: string; defaultValue?: string[] }) {
  return <div className={cn("space-y-10", className)}>{children}</div>;
}
function AccordionItem({ children }: { children: React.ReactNode; value?: string }) {
  return <section>{children}</section>;
}
function AccordionTrigger({ children }: { children: React.ReactNode; className?: string }) {
  return <h2 className="mb-4 font-sans text-[17px] leading-6 font-semibold">{children}</h2>;
}
function AccordionContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

/** Options panel for FR-01 to FR-04 (only active, owner-set options are shown — FR-47). */
export function OptionsPanel({
  config,
  options,
  onChange,
  disabledTypes = false,
}: {
  config: DesignConfig;
  options: CustomizationOptions;
  onChange: (patch: Partial<DesignConfig>) => void;
  disabledTypes?: boolean;
}) {
  const type = options.productTypes.find((p) => p.type === config.productType)!;
  const material = options.materials.find((m) => m.id === config.materialId);
  const finishes = options.finishes.filter((f) => material?.finishIds.includes(f.id));
  const gem = options.gemstones.find((g) => g.id === config.gemstoneId);
  const hasStone = Boolean(gem && !gem.isNone);
  const sizes = options.sizes.filter((s) => s.productType === config.productType).sort((a, b) => a.sortOrder - b.sortOrder);
  const sections = ["type", "style", "material", "finish", "name", "text", "chain", "gem", "details", "size", "extras"];
  const chain = usesChain(config, options);
  const style = styleOf(config, options);
  const rule = stoneRule(config, options);
  const styles = optionsFor(options, config.productType, "style");
  const pick = (group: OptionGroup) => (id: string) => onChange({ choices: { ...config.choices, [group]: id } });
  const detailGroups = (["setting", "profile", "shank", "texture"] as const).filter(
    (g) => optionsFor(options, config.productType, g).length > 0 && (g !== "setting" || hasStone),
  );
  const textProblem = config.styleText ? styleTextProblem(style, config.styleText) : null;
  const textFonts = style?.textMax && style.key !== "zodiac";
  const pearlOnly = style?.requiresSurface === "pearl";
  const gemList = [...options.gemstones]
    .filter((g) => (pearlOnly ? g.surface === "pearl" : !(g.isNone && rule.min > 0)))
    .sort((a, b) => Number(Boolean(b.isNone)) - Number(Boolean(a.isNone)));
  const qtyMin = Math.max(1, rule.min);
  const isName = config.productType === "name_pendant";
  const fonts = options.fonts ?? [];
  const problem = config.nameText ? nameProblem(config.nameText) : null;

  return (
    <Accordion type="multiple" defaultValue={sections} className="w-full">
      <AccordionItem value="type">
        <AccordionTrigger className="text-base font-semibold">Piece type</AccordionTrigger>
        <AccordionContent>
          <div role="radiogroup" aria-label="Piece type" className="grid grid-cols-[repeat(auto-fill,minmax(5.75rem,1fr))] gap-2">
            {options.productTypes.map((p) => (
              <Choice
                key={p.id}
                selected={p.type === config.productType}
                onClick={() => onChange({ productType: p.type })}
                className={cn("flex flex-col items-center gap-1 px-2 py-3", disabledTypes && p.type !== config.productType && "pointer-events-none opacity-40")}
              >
                <PieceIcon type={p.type} className="text-black" />
                <span className="text-center text-xs leading-tight font-medium">{p.label}</span>
              </Choice>
            ))}
          </div>
          {disabledTypes && <p className="mt-2 text-xs text-muted-foreground">The piece type can&apos;t change while you revise a submitted design.</p>}
        </AccordionContent>
      </AccordionItem>

      {styles.length > 0 && (
        <AccordionItem value="style">
          <AccordionTrigger className="text-base font-semibold">Style</AccordionTrigger>
          <AccordionContent>
            <GroupPicker group="style" list={styles} value={config.choices?.style} onPick={pick("style")} />
          </AccordionContent>
        </AccordionItem>
      )}

      <AccordionItem value="material">
        <AccordionTrigger className="text-base font-semibold">Material</AccordionTrigger>
        <AccordionContent>
          <div role="radiogroup" aria-label="Material" className="grid grid-cols-2 gap-2">
            {options.materials.map((m) => (
              <Choice
                key={m.id}
                selected={m.id === config.materialId}
                onClick={() => onChange({ materialId: m.id })}
                className="px-3 py-3 text-left font-medium"
              >
                {m.label}
              </Choice>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="finish">
        <AccordionTrigger className="text-base font-semibold">Color or finish</AccordionTrigger>
        <AccordionContent>
          <div role="radiogroup" aria-label="Color or finish" className="flex flex-wrap gap-3">
            {finishes.map((f) => (
              <Choice
                key={f.id}
                selected={f.id === config.finishId}
                onClick={() => onChange({ finishId: f.id })}
                className="flex items-center gap-2 py-1.5 pr-3 pl-1.5"
              >
                <span
                  className="size-8 rounded-full border border-black/10 shadow-inner"
                  style={{ background: `radial-gradient(circle at 35% 30%, #fff 0%, ${f.colorHex} 45%, ${f.colorHex} 100%)` }}
                  aria-hidden
                />
                {f.label}
              </Choice>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Only the finishes available for {material?.label ?? "this material"} are shown.</p>
        </AccordionContent>
      </AccordionItem>

      {isName && (
        <AccordionItem value="name">
          <AccordionTrigger className="text-base font-semibold">Name and font</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pendant-name">Name on the pendant</Label>
              <Input
                id="pendant-name"
                maxLength={NAME_MAX}
                value={config.nameText ?? ""}
                onChange={(e) => onChange({ nameText: e.target.value })}
                placeholder="For example: Maria"
                autoComplete="off"
                aria-describedby="pendant-name-hint"
                aria-invalid={Boolean(problem)}
              />
              <p id="pendant-name-hint" className={cn("text-xs", problem ? "text-danger" : "text-muted-foreground")}>
                {problem ?? `Up to ${NAME_MAX} characters (${NAME_MAX - (config.nameText?.length ?? 0)} left). Letters, Ñ and accents are fine.`}
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium" id="font-label">
                Font
              </p>
              <div role="radiogroup" aria-labelledby="font-label" className="space-y-3">
                {(
                  [
                    ["Script — letters join", fonts.filter((f) => f.cssFamily.includes("cursive"))],
                    ["Classic — joined by a bar", fonts.filter((f) => !f.cssFamily.includes("cursive"))],
                  ] as const
                )
                  .filter(([, list]) => list.length > 0)
                  .map(([group, list]) => (
                    <div key={group}>
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{group}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {list.map((f) => (
                          <Choice
                            key={f.id}
                            selected={f.id === config.fontId}
                            onClick={() => onChange({ fontId: f.id })}
                            className="flex flex-col items-start gap-0.5 px-3 py-2 text-left"
                            label={f.label}
                          >
                            <span className="block w-full truncate text-2xl leading-tight text-ink" style={{ fontFamily: f.cssFamily }} aria-hidden>
                              {(config.nameText ?? "").trim() || "Maria"}
                            </span>
                            <span className="text-xs text-muted-foreground">{f.label}</span>
                          </Choice>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {style?.textMax ? (
        <AccordionItem value="text">
          <AccordionTrigger className="text-base font-semibold">{style.key === "zodiac" ? "Zodiac sign" : "Letters or text"}</AccordionTrigger>
          <AccordionContent className="space-y-4">
            {style.key === "zodiac" ? (
              <div role="radiogroup" aria-label="Zodiac sign" className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
                {ZODIAC_SIGNS.map((z) => (
                  <Choice key={z} selected={config.styleText === z} onClick={() => onChange({ styleText: z })} className="px-2 py-2">
                    {z}
                  </Choice>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="style-text">
                  {style.textMax <= 3 ? "Initials" : "Text"} for the {style.label.toLowerCase()}
                </Label>
                <Input
                  id="style-text"
                  maxLength={style.textMax}
                  value={config.styleText ?? ""}
                  onChange={(e) => onChange({ styleText: e.target.value })}
                  placeholder={style.textMax <= 3 ? "For example: JA" : "For example: Maria 2026"}
                  autoComplete="off"
                  aria-describedby="style-text-hint"
                  aria-invalid={Boolean(textProblem)}
                />
                <p id="style-text-hint" className={cn("text-xs", textProblem ? "text-danger" : "text-muted-foreground")}>
                  {textProblem ?? `Up to ${style.textMax} characters (${style.textMax - (config.styleText?.length ?? 0)} left).`}
                </p>
              </div>
            )}
            {textFonts && fonts.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium" id="text-font-label">
                  Font
                </p>
                <div role="radiogroup" aria-labelledby="text-font-label" className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2">
                  {fonts.map((f) => (
                    <Choice
                      key={f.id}
                      selected={f.id === (config.fontId ?? fonts[0].id)}
                      onClick={() => onChange({ fontId: f.id })}
                      className="flex flex-col items-start gap-0.5 px-3 py-2 text-left"
                      label={f.label}
                    >
                      <span className="block w-full truncate text-xl leading-tight text-ink" style={{ fontFamily: f.cssFamily }} aria-hidden>
                        {(config.styleText ?? "").trim() || "AB"}
                      </span>
                      <span className="text-xs text-muted-foreground">{f.label}</span>
                    </Choice>
                  ))}
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ) : null}

      {chain && (
        <AccordionItem value="chain">
          <AccordionTrigger className="text-base font-semibold">Chain style and clasp</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div role="radiogroup" aria-label="Chain style" className="space-y-3">
              {CHAIN_GROUPS.map(([family, title]) => {
                const list = (options.chainStyles ?? []).filter((c) => c.family === family);
                if (list.length === 0) return null;
                return (
                  <div key={family}>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">{title}</p>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-2">
                      {list.map((c) => (
                        <Choice
                          key={c.id}
                          selected={c.id === config.chainStyleId}
                          onClick={() => onChange({ chainStyleId: c.id })}
                          className="min-w-0 px-3 py-2 text-left break-words hyphens-auto"
                          label={c.label}
                        >
                          <span className="block font-medium">{c.label}</span>
                          <span className="block text-xs leading-snug text-muted-foreground">{c.description}</span>
                        </Choice>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium" id="clasp-label">
                Clasp
              </p>
              <div role="radiogroup" aria-labelledby="clasp-label" className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-2">
                {(options.clasps ?? []).map((c) => (
                  <Choice
                    key={c.id}
                    selected={c.id === config.claspId}
                    onClick={() => onChange({ claspId: c.id })}
                    className="min-w-0 px-3 py-2 text-left break-words hyphens-auto"
                    label={c.label}
                  >
                    <span className="block font-medium">{c.label}</span>
                    <span className="block text-xs leading-snug text-muted-foreground">{c.description}</span>
                  </Choice>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {!isName && (rule.max > 0 || styles.length === 0 || type.maxStones > 0) && (
        <AccordionItem value="gem">
          <AccordionTrigger className="text-base font-semibold">{pearlOnly ? "Pearls" : "Gemstone"}</AccordionTrigger>
          <AccordionContent>
            {rule.max === 0 ? (
              <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                {style
                  ? `The ${style.label} style has no stones. Choosing a stone switches to a style that holds one.`
                  : "Gemstones are not available for this piece."}
              </p>
            ) : null}
            {rule.max === 0 && styles.length === 0 ? null : (
              <div className="space-y-4">
                <div role="radiogroup" aria-label="Gemstone type" className="flex flex-wrap gap-2">
                  {gemList.map((g) => (
                    <Choice
                      key={g.id}
                      selected={g.id === config.gemstoneId}
                      onClick={() => onChange({ gemstoneId: g.id })}
                      className="flex items-center gap-2 py-1.5 pr-3 pl-1.5"
                    >
                      <span
                        className={cn(
                          "size-7 rotate-45 rounded-[4px] border border-black/10",
                          g.isNone && "rotate-0 rounded-full border-dashed border-muted-foreground bg-transparent",
                        )}
                        style={g.isNone ? undefined : { background: `linear-gradient(135deg, #fff, ${g.colorHex})` }}
                        aria-hidden
                      />
                      {g.label}
                    </Choice>
                  ))}
                </div>
                {style?.key === "birthstone" && (
                  <p className="text-xs text-muted-foreground">Each birthstone shows its month in brackets, for example Garnet (January).</p>
                )}
                {hasStone && (
                  <>
                    {!pearlOnly && (
                      <div>
                        <p className="mb-2 text-sm font-medium" id="cut-label">
                          Cut
                        </p>
                        <div role="radiogroup" aria-labelledby="cut-label" className="flex flex-wrap gap-2">
                          {options.cuts.map((c) => (
                            <Choice key={c.id} selected={c.id === config.cutId} onClick={() => onChange({ cutId: c.id })} className="px-4 py-2">
                              {c.label}
                            </Choice>
                          ))}
                        </div>
                      </div>
                    )}
                    {rule.max > 1 && (
                      <div>
                        <p className="mb-2 text-sm font-medium" id="qty-label">
                          Number of stones {config.productType === "earrings" && <span className="font-normal text-muted-foreground">(for the pair)</span>}
                        </p>
                        <div className="inline-flex items-center gap-2" role="group" aria-labelledby="qty-label">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => onChange({ stoneQuantity: config.stoneQuantity - 1 })}
                            disabled={config.stoneQuantity <= qtyMin}
                            aria-label="Fewer stones"
                          >
                            <Minus className="size-4" />
                          </Button>
                          <span className="tabular w-8 text-center text-lg font-semibold" aria-live="polite">
                            {config.stoneQuantity}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => onChange({ stoneQuantity: config.stoneQuantity + 1 })}
                            disabled={config.stoneQuantity >= rule.max}
                            aria-label="More stones"
                          >
                            <Plus className="size-4" />
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {qtyMin === rule.max ? `exactly ${rule.max}` : qtyMin > 1 ? `${qtyMin} to ${rule.max}` : `up to ${rule.max}`}
                          </span>
                        </div>
                        {config.productType === "earrings" && rule.max === 2 && (
                          <p className="mt-1 text-xs text-muted-foreground">Choose 2 for a matching pair (one stone in each earring).</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      )}

      {detailGroups.length > 0 && (
        <AccordionItem value="details">
          <AccordionTrigger className="text-base font-semibold">{detailGroups.length === 1 ? GROUP_LABEL[detailGroups[0]] : "Design details"}</AccordionTrigger>
          <AccordionContent className="space-y-4">
            {detailGroups.map((g) => (
              <div key={g}>
                {detailGroups.length > 1 && <p className="mb-2 text-sm font-medium">{GROUP_LABEL[g]}</p>}
                <GroupPicker group={g} list={optionsFor(options, config.productType, g)} value={config.choices?.[g]} onPick={pick(g)} />
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      )}

      <AccordionItem value="size">
        <AccordionTrigger className="text-base font-semibold">Size</AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-wrap items-center gap-2">
            <div role="radiogroup" aria-label="Size" className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <Choice key={s.id} selected={s.id === config.sizeId} onClick={() => onChange({ sizeId: s.id })} className="min-h-10 px-4 py-2">
                  {s.label}
                </Choice>
              ))}
            </div>
            {MEASURE[config.productType] && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="link" size="sm" className="px-1">
                    <Info className="size-4" /> How to measure
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="max-w-xs text-sm">{MEASURE[config.productType]}</PopoverContent>
              </Popover>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="extras">
        <AccordionTrigger className="text-base font-semibold">Engraving and notes (optional)</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="engraving">Engraving text</Label>
            <Input
              id="engraving"
              maxLength={20}
              value={config.engravingText ?? ""}
              onChange={(e) => onChange({ engravingText: e.target.value })}
              aria-describedby="engraving-hint"
            />
            <p id="engraving-hint" className="text-xs text-muted-foreground">
              Up to 20 characters ({20 - (config.engravingText?.length ?? 0)} left). {engravingSpot(config.productType, style?.key)}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes for the owner</Label>
            <Textarea
              id="notes"
              maxLength={500}
              rows={3}
              value={config.notes ?? ""}
              onChange={(e) => onChange({ notes: e.target.value })}
              aria-describedby="notes-hint"
              placeholder="Anything the owner should know about your design."
            />
            <p id="notes-hint" className="text-xs text-muted-foreground">
              Up to 500 characters ({500 - (config.notes?.length ?? 0)} left).
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
