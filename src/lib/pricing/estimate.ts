// FR-06 / FR-47 — Estimated weight and price. Implements docs/data-model.md §6 exactly.
//
//   est_weight_g = round2( baseWeightG × size_factor × density_ratio × chain_factor )  (0.01 g, half-up)
//   stone_price  = gemstone.basePrice × cut.multiplier × stoneQuantity                 (0 when "None")
//   est_price    = round0( est_weight_g × ratePerGram + stone_price + laborFee + finish.fee + clasp.fee )  (nearest peso, half-up)
//
// chain_factor and clasp.fee apply to necklaces only (chain_factor = 1, clasp fee = 0 for other pieces).
// They were added after Phase 1 review (decisions D-23); cable chain = 1.00 and lobster clasp = ₱0,
// so the original test cases in data-model.md §6 are unchanged.
//
// The ROUNDED weight is used for the price, matching the owner's manual computation.
// All arithmetic is done on exact integers (scaled values) so there is no floating-point drift.

import type {
  CustomizationOptions,
  CutOption,
  DesignConfig,
  Estimate,
  FinishOption,
  GemstoneOption,
  MaterialOption,
  ProductTypeOption,
  SizeOption,
} from "@/types";
import { nameProblem } from "./name";

/** Factors and ratios are stored with up to 4 decimals. */
const FACTOR_SCALE = 10_000;
/** Money is stored with up to 2 decimals (centavos). */
const MONEY_SCALE = 100;

export class EstimateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EstimateError";
  }
}

/** Convert a decimal number to an exact integer with the given scale (e.g. 1.51 × 10 000 = 15 100). */
function toScaled(value: number, scale: number): number {
  return Math.round(value * scale);
}

/** Integer division with half-up rounding, for non-negative numerators. */
function divRoundHalfUp(numerator: number, denominator: number): number {
  if (numerator < 0) throw new EstimateError("Estimate values cannot be negative.");
  return Math.floor((numerator + denominator / 2) / denominator);
}

export interface ResolvedSelection {
  productType: ProductTypeOption;
  material: MaterialOption;
  finish: FinishOption;
  gemstone: GemstoneOption;
  cut: CutOption | null;
  size: SizeOption;
  stoneQuantity: number;
  chainFactor: number;
  claspFee: number;
}

/** Look up every option the config refers to. Throws a plain-English error if one is missing. */
export function resolveSelection(config: DesignConfig, options: CustomizationOptions): ResolvedSelection {
  const productType = options.productTypes.find((p) => p.type === config.productType);
  const material = options.materials.find((m) => m.id === config.materialId);
  const finish = options.finishes.find((f) => f.id === config.finishId);
  const gemstone = options.gemstones.find((g) => g.id === config.gemstoneId);
  const size = options.sizes.find((s) => s.id === config.sizeId);
  const cut = config.cutId ? (options.cuts.find((c) => c.id === config.cutId) ?? null) : null;

  if (!productType) throw new EstimateError("Choose a piece type to see an estimate.");
  if (!material) throw new EstimateError("Choose a material to see an estimate.");
  if (!finish) throw new EstimateError("Choose a color or finish to see an estimate.");
  if (!gemstone) throw new EstimateError("Choose a gemstone (or None) to see an estimate.");
  if (!size) throw new EstimateError("Choose a size to see an estimate.");
  if (size.productType !== productType.type) throw new EstimateError("The chosen size doesn't match the piece type.");

  if (productType.type === "name_pendant") {
    const problem = nameProblem(config.nameText);
    if (problem) throw new EstimateError(problem);
    if (!(options.fonts ?? []).some((x) => x.id === config.fontId)) throw new EstimateError("Choose a font for the name.");
  }

  // Necklaces: chain style and clasp. Designs submitted before chain styles existed have neither,
  // and keep the plain-chain estimate they were submitted with (factor 1, no clasp fee).
  let chainFactor = 1;
  let claspFee = 0;
  if (productType.type === "necklace") {
    if (config.chainStyleId) {
      const chain = (options.chainStyles ?? []).find((c) => c.id === config.chainStyleId);
      if (!chain) throw new EstimateError("Choose a chain style to see an estimate.");
      chainFactor = chain.weightFactor;
    }
    if (config.claspId) {
      const clasp = (options.clasps ?? []).find((c) => c.id === config.claspId);
      if (!clasp) throw new EstimateError("Choose a clasp to see an estimate.");
      claspFee = clasp.fee;
    }
  }

  const hasStone = !gemstone.isNone && gemstone.basePrice > 0;
  if (hasStone && !cut) throw new EstimateError("Choose a gemstone cut to see an estimate.");

  const stoneQuantity = hasStone ? config.stoneQuantity : 0;
  if (hasStone && (stoneQuantity < 1 || stoneQuantity > productType.maxStones)) {
    throw new EstimateError(
      productType.maxStones === 0
        ? "Gemstones are not available for this piece."
        : `Choose between 1 and ${productType.maxStones} stones.`,
    );
  }

  return { productType, material, finish, gemstone, cut: hasStone ? cut : null, size, stoneQuantity, chainFactor, claspFee };
}

/** Estimated weight in grams, rounded half-up to 0.01 g. */
export function estimateWeightG(baseWeightG: number, sizeFactor: number, densityRatio: number, chainFactor = 1): number {
  // Four scaled factors can exceed 2^53, so this product uses exact BigInt arithmetic.
  const s = (v: number) => BigInt(toScaled(v, FACTOR_SCALE));
  const product = s(baseWeightG) * s(sizeFactor) * s(densityRatio) * s(chainFactor);
  // product is grams × 10^16; we want centigrams (grams × 10^2), rounded half-up.
  const denominator = BigInt(FACTOR_SCALE) ** BigInt(4) / BigInt(100);
  const centigrams = (product + denominator / BigInt(2)) / denominator;
  return Number(centigrams) / 100;
}

/** Pure estimate from resolved options. */
export function estimateFromSelection(sel: ResolvedSelection): Estimate {
  const weightG = estimateWeightG(sel.productType.baseWeightG, sel.size.factor, sel.material.densityRatio, sel.chainFactor);
  const centigrams = Math.round(weightG * 100);

  // Everything below is in micro-pesos (peso × 10^6) so we can sum exactly.
  const metalMicro = centigrams * toScaled(sel.material.ratePerGram, MONEY_SCALE) * 100; // cg × centavos/g × 100
  const stonesMicro =
    sel.cut && sel.stoneQuantity > 0
      ? toScaled(sel.gemstone.basePrice, MONEY_SCALE) * toScaled(sel.cut.multiplier, FACTOR_SCALE) * sel.stoneQuantity
      : 0;
  const laborMicro = toScaled(sel.productType.laborFee, MONEY_SCALE) * FACTOR_SCALE;
  const finishMicro = toScaled(sel.finish.fee, MONEY_SCALE) * FACTOR_SCALE;
  const claspMicro = toScaled(sel.claspFee, MONEY_SCALE) * FACTOR_SCALE;

  const totalMicro = metalMicro + stonesMicro + laborMicro + finishMicro + claspMicro;
  const price = divRoundHalfUp(totalMicro, 1_000_000);

  const toPesos = (micro: number) => divRoundHalfUp(micro, 10_000) / 100; // centavo precision for display

  return {
    weightG,
    price,
    breakdown: {
      metal: toPesos(metalMicro),
      stones: toPesos(stonesMicro),
      labor: toPesos(laborMicro),
      finish: toPesos(finishMicro),
      clasp: toPesos(claspMicro),
    },
  };
}

/** estimate(config, options) → { weightG, price, breakdown } */
export function estimate(config: DesignConfig, options: CustomizationOptions): Estimate {
  return estimateFromSelection(resolveSelection(config, options));
}

/** Like estimate(), but returns null instead of throwing (for live UI previews). */
export function tryEstimate(config: DesignConfig, options: CustomizationOptions): Estimate | null {
  try {
    return estimate(config, options);
  } catch {
    return null;
  }
}
