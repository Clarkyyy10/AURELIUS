// Converts between the design_options table (one row per option, kind + attributes) and the
// CustomizationOptions shape the customizer, the estimate and the admin screens already use (FR-47).

import type { CustomizationOptions } from "@/types";

export const OPTION_LISTS = {
  productTypes: "product_type",
  materials: "material",
  finishes: "finish",
  gemstones: "gemstone",
  cuts: "cut",
  sizes: "size",
  fonts: "font",
  chainStyles: "chain_style",
  clasps: "clasp",
  designOptions: "design",
} as const satisfies Record<keyof CustomizationOptions, string>;

export type OptionKindName = (typeof OPTION_LISTS)[keyof typeof OPTION_LISTS];

export interface OptionRow {
  id: string;
  kind: OptionKindName;
  label: string;
  active: boolean;
  sortOrder: number;
  attributes: Record<string, unknown>;
}

const LIST_OF = Object.fromEntries(Object.entries(OPTION_LISTS).map(([list, kind]) => [kind, list])) as Record<OptionKindName, keyof CustomizationOptions>;

/** One row per option, keeping the owner's order within each list. */
export function optionsToRows(options: CustomizationOptions): OptionRow[] {
  return (Object.keys(OPTION_LISTS) as (keyof CustomizationOptions)[]).flatMap((list) =>
    ((options[list] ?? []) as unknown as { id: string; label: string; active: boolean }[]).map((item, sortOrder) => {
      const { id, label, active, ...attributes } = item;
      return { id, kind: OPTION_LISTS[list], label, active, sortOrder, attributes };
    }),
  );
}

/** Rebuilds CustomizationOptions from table rows (any order). */
export function rowsToOptions(rows: OptionRow[]): CustomizationOptions {
  const out = Object.fromEntries(Object.keys(OPTION_LISTS).map((list) => [list, [] as unknown[]])) as unknown as Record<keyof CustomizationOptions, unknown[]>;
  for (const row of [...rows].sort((a, b) => a.sortOrder - b.sortOrder)) {
    const list = LIST_OF[row.kind];
    if (!list) continue;
    out[list].push({ ...row.attributes, id: row.id, label: row.label, active: row.active });
  }
  return out as unknown as CustomizationOptions;
}
