// Shared rules for design options (style, setting, band shape, shank, texture) — decisions D-25.

import { ZODIAC_SIGNS } from "@/lib/data/seed/designs";
import { OPTION_GROUPS, type CustomizationOptions, type DesignConfig, type DesignOption, type OptionGroup, type ProductType, type StoneRule } from "@/types";

export const GROUP_LABEL: Record<OptionGroup, string> = {
  style: "Style",
  setting: "Setting",
  profile: "Band shape",
  shank: "Shank",
  texture: "Texture",
};

/** Options of a group that apply to a piece type (in the owner's order). */
export function optionsFor(options: CustomizationOptions, productType: ProductType, group: OptionGroup): DesignOption[] {
  return (options.designOptions ?? []).filter((o) => o.group === group && o.productTypes.includes(productType));
}

export function chosenOption(
  config: Pick<DesignConfig, "choices" | "productType">,
  options: CustomizationOptions,
  group: OptionGroup,
): DesignOption | undefined {
  const id = config.choices?.[group];
  if (!id) return undefined;
  return optionsFor(options, config.productType, group).find((o) => o.id === id);
}

export function styleOf(config: Pick<DesignConfig, "choices" | "productType">, options: CustomizationOptions) {
  return chosenOption(config, options, "style");
}

/** How many stones the design can take: the style's rule, else the piece type's maximum. */
export function stoneRule(config: Pick<DesignConfig, "choices" | "productType">, options: CustomizationOptions): StoneRule {
  const style = styleOf(config, options);
  if (style?.stones) return style.stones;
  const max = options.productTypes.find((p) => p.type === config.productType)?.maxStones ?? 0;
  return { min: 0, max, default: Math.min(1, max) };
}

/** Whether the chain style and clasp apply. Necklaces saved before styles existed always used a chain. */
export function usesChain(config: Pick<DesignConfig, "choices" | "productType">, options: CustomizationOptions): boolean {
  const style = styleOf(config, options);
  if (style) return Boolean(style.usesChain);
  return config.productType === "necklace" || config.productType === "anklet";
}

/** Styles whose text is required (the design is the text). */
export const TEXT_REQUIRED = new Set(["initial", "zodiac", "charm"]);

const TEXT_CHARS = /^[A-Za-zÑñÁÉÍÓÚáéíóú0-9 '&.\-/]+$/;

/** Plain-English problem with the style text, or null. */
export function styleTextProblem(style: DesignOption | undefined, text: string | undefined): string | null {
  if (!style?.textMax) return null;
  const t = (text ?? "").trim();
  if (style.key === "zodiac") return ZODIAC_SIGNS.includes(t) ? null : "Choose your zodiac sign.";
  if (!t) return TEXT_REQUIRED.has(style.key) ? `Type the ${style.key === "initial" ? "initial" : "letter"} for your ${style.label.toLowerCase()}.` : null;
  if (t.length > style.textMax) return `Use up to ${style.textMax} character${style.textMax === 1 ? "" : "s"}.`;
  if (!TEXT_CHARS.test(t)) return "Use letters and numbers only (Ñ and accents are fine), plus spaces, ' & - . /";
  return null;
}

export function groupsFor(options: CustomizationOptions, productType: ProductType): OptionGroup[] {
  return OPTION_GROUPS.filter((g) => optionsFor(options, productType, g).some((o) => o.active));
}

/**
 * Applies a customer's change before normalizing, so related choices follow sensibly:
 * a new piece type starts from its default style; a new style starts with its usual number of
 * stones; choosing a stone on a style without stones switches to a style that holds one.
 */
export function applyChange(config: DesignConfig, patch: Partial<DesignConfig>, options: CustomizationOptions): DesignConfig {
  if (patch.productType && patch.productType !== config.productType) {
    const next: DesignConfig = { ...config, ...patch, sizeId: "" };
    delete next.choices;
    delete next.styleText;
    return next;
  }
  const next: DesignConfig = { ...config, ...patch };
  const newStyle = patch.choices?.style;
  if (newStyle && newStyle !== config.choices?.style) {
    next.stoneQuantity = stoneRule(next, options).default;
    delete next.styleText;
  }
  const gem = options.gemstones.find((g) => g.id === patch.gemstoneId);
  if (gem && !gem.isNone) {
    if (stoneRule(next, options).max === 0) {
      const styles = optionsFor(options, next.productType, "style").filter((o) => o.active && (o.stones ? o.stones.max > 0 : true) && !o.requiresSurface);
      const pick = styles.find((o) => o.key === "solitaire") ?? styles[0];
      if (pick) next.choices = { ...next.choices, style: pick.id };
    }
    const wasNone = !options.gemstones.some((g) => g.id === config.gemstoneId && !g.isNone);
    if (wasNone) next.stoneQuantity = Math.max(1, stoneRule(next, options).default);
  }
  return next;
}
