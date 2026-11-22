// Seed customization options and rates — docs/data-model.md §3.
// DEMO VALUES ONLY. The owner replaces them in Admin → Customization & Rates (FR-47).

import { seedDesignOptions } from "./designs";
import type {
  CustomizationOptions,
  ChainStyleOption,
  ClaspOption,
  CutOption,
  FinishOption,
  FontOption,
  GemstoneOption,
  MaterialOption,
  ProductType,
  ProductTypeOption,
  SizeOption,
} from "@/types";

export const seedProductTypes: ProductTypeOption[] = [
  { id: "pt-ring", type: "ring", label: "Ring", baseWeightG: 3.0, laborFee: 1500, maxStones: 5, active: true },
  { id: "pt-pendant", type: "pendant", label: "Pendant", baseWeightG: 2.0, laborFee: 1000, maxStones: 3, active: true },
  // Base weight assumes a typical name of about 6 letters at Medium size; the owner confirms the final weight and price.
  { id: "pt-name-pendant", type: "name_pendant", label: "Name pendant", baseWeightG: 2.5, laborFee: 1800, maxStones: 0, active: true },
  { id: "pt-necklace", type: "necklace", label: "Necklace", baseWeightG: 6.0, laborFee: 2000, maxStones: 0, active: true },
  { id: "pt-bracelet", type: "bracelet", label: "Bracelet", baseWeightG: 8.0, laborFee: 1200, maxStones: 0, active: true },
  { id: "pt-earrings", type: "earrings", label: "Earrings (pair)", baseWeightG: 2.4, laborFee: 800, maxStones: 2, active: true },
  { id: "pt-anklet", type: "anklet", label: "Anklet", baseWeightG: 3.0, laborFee: 900, maxStones: 0, active: true },
  { id: "pt-toe-ring", type: "toe_ring", label: "Toe ring", baseWeightG: 1.2, laborFee: 600, maxStones: 1, active: true },
];

export const seedFinishes: FinishOption[] = [
  { id: "fin-yellow", label: "Yellow", colorHex: "#E6C068", roughness: 0.18, fee: 0, active: true },
  { id: "fin-white", label: "White", colorHex: "#E9E9EC", roughness: 0.15, fee: 0, active: true },
  { id: "fin-rose", label: "Rose", colorHex: "#E7A98F", roughness: 0.18, fee: 500, active: true },
  { id: "fin-polished", label: "Polished", colorHex: "#D9D9DE", roughness: 0.12, fee: 0, active: true },
  { id: "fin-oxidized", label: "Oxidized", colorHex: "#6B6B70", roughness: 0.45, fee: 200, active: true },
  { id: "fin-gold-plated", label: "Gold-plated", colorHex: "#DDB55E", roughness: 0.2, fee: 350, active: true },
  { id: "fin-silver-tone", label: "Silver tone", colorHex: "#C9CBD0", roughness: 0.25, fee: 0, active: true },
  { id: "fin-black", label: "Black", colorHex: "#2B2B2E", roughness: 0.35, fee: 300, active: true },
  { id: "fin-gold-tone", label: "Gold tone", colorHex: "#CFA75A", roughness: 0.25, fee: 300, active: true },
];

export const seedMaterials: MaterialOption[] = [
  { id: "mat-18k", label: "18K Gold", ratePerGram: 4200, densityRatio: 1.51, finishIds: ["fin-yellow", "fin-white", "fin-rose"], active: true },
  { id: "mat-14k", label: "14K Gold", ratePerGram: 3300, densityRatio: 1.26, finishIds: ["fin-yellow", "fin-white", "fin-rose"], active: true },
  { id: "mat-silver", label: "Sterling Silver 925", ratePerGram: 95, densityRatio: 1.0, finishIds: ["fin-polished", "fin-oxidized", "fin-gold-plated"], active: true },
  { id: "mat-steel", label: "Stainless Steel", ratePerGram: 40, densityRatio: 0.77, finishIds: ["fin-silver-tone", "fin-black", "fin-gold-tone"], active: true },
];

export const seedGemstones: GemstoneOption[] = [
  { id: "gem-none", label: "None", basePrice: 0, colorHex: "#FFFFFF", ior: 1, active: true, isNone: true },
  { id: "gem-cz", label: "Cubic Zirconia", basePrice: 150, colorHex: "#F4F6FA", ior: 2.15, active: true },
  { id: "gem-ruby", label: "Ruby (lab)", basePrice: 800, colorHex: "#B0102B", ior: 1.77, active: true },
  { id: "gem-sapphire", label: "Sapphire (lab)", basePrice: 900, colorHex: "#1F3FA8", ior: 1.77, active: true },
  { id: "gem-emerald", label: "Emerald (lab)", basePrice: 1000, colorHex: "#1E8A57", ior: 1.58, active: true },
  { id: "gem-diamond", label: "Diamond (lab-grown)", basePrice: 3500, colorHex: "#FFFFFF", ior: 2.42, active: true },
  // Birthstones (with their months) — demo prices
  { id: "gem-garnet", label: "Garnet (January)", basePrice: 400, colorHex: "#7B1020", ior: 1.79, active: true },
  { id: "gem-amethyst", label: "Amethyst (February)", basePrice: 350, colorHex: "#8E5BC4", ior: 1.54, active: true },
  { id: "gem-aquamarine", label: "Aquamarine (March)", basePrice: 600, colorHex: "#7FD3E8", ior: 1.57, active: true },
  { id: "gem-pearl", label: "Pearl (June)", basePrice: 450, colorHex: "#F5EFE6", ior: 1.53, active: true, surface: "pearl" },
  { id: "gem-peridot", label: "Peridot (August)", basePrice: 450, colorHex: "#8BBF2A", ior: 1.65, active: true },
  { id: "gem-opal", label: "Opal (October)", basePrice: 900, colorHex: "#E8EEF2", ior: 1.45, active: true, surface: "opal" },
  { id: "gem-citrine", label: "Citrine (November)", basePrice: 350, colorHex: "#E8A320", ior: 1.55, active: true },
  { id: "gem-blue-topaz", label: "Blue Topaz (December)", basePrice: 400, colorHex: "#4FA8D8", ior: 1.62, active: true },
];

export const seedCuts: CutOption[] = [
  { id: "cut-round", label: "Round", multiplier: 1.0, active: true },
  { id: "cut-oval", label: "Oval", multiplier: 1.1, active: true },
  { id: "cut-princess", label: "Princess", multiplier: 1.15, active: true },
  { id: "cut-pear", label: "Pear", multiplier: 1.2, active: true },
  { id: "cut-cushion", label: "Cushion", multiplier: 1.1, active: true },
  { id: "cut-emerald", label: "Emerald", multiplier: 1.15, active: true },
  { id: "cut-asscher", label: "Asscher", multiplier: 1.2, active: true },
  { id: "cut-radiant", label: "Radiant", multiplier: 1.2, active: true },
  { id: "cut-marquise", label: "Marquise", multiplier: 1.25, active: true },
  { id: "cut-heart", label: "Heart", multiplier: 1.3, active: true },
  { id: "cut-baguette", label: "Baguette", multiplier: 0.9, active: true },
];

function sizes(type: ProductType, list: [label: string, factor: number, isDefault?: boolean][]): SizeOption[] {
  return list.map(([label, factor, isDefault], i) => ({
    id: `size-${type}-${label.split(" · ")[0].toLowerCase().replace(/[^a-z0-9.]+/g, "").replace(/\./g, "_")}`,
    productType: type,
    label,
    factor,
    sortOrder: i,
    isDefault: Boolean(isDefault),
    active: true,
  }));
}

export const seedSizes: SizeOption[] = [
  ...sizes("ring", [["US 5", 0.9], ["US 6", 0.95], ["US 7", 1.0, true], ["US 8", 1.05], ["US 9", 1.1], ["US 10", 1.15]]),
  // Necklace lengths with their common names; factor = length ÷ 18 in.
  ...sizes("necklace", [
    ["14 in · Choker", 0.78],
    ["16 in · Collar", 0.89],
    ["18 in · Princess", 1.0, true],
    ["20 in · Matinee", 1.11],
    ["22 in · Matinee", 1.22],
    ["24 in · Matinee", 1.33],
    ["30 in · Opera", 1.67],
  ]),
  ...sizes("bracelet", [["6.5 in", 0.93], ["7 in", 1.0, true], ["7.5 in", 1.07]]),
  ...sizes("pendant", [["Small", 0.8], ["Medium", 1.0, true], ["Large", 1.25]]),
  ...sizes("name_pendant", [["Small (10 mm letters)", 0.8], ["Medium (13 mm letters)", 1.0, true], ["Large (16 mm letters)", 1.3]]),
  ...sizes("earrings", [["Small", 0.8], ["Medium", 1.0, true], ["Large", 1.25]]),
  ...sizes("anklet", [["9 in", 0.9], ["10 in", 1.0, true], ["11 in", 1.1]]),
  ...sizes("toe_ring", [["Small", 0.9], ["Medium", 1.0, true], ["Large", 1.1]]),
];

type C = [pattern: ChainStyleOption["pattern"], family: ChainStyleOption["family"], label: string, weightFactor: number, description: string];

/**
 * Necklace chain styles (research: jeweler and retailer chain guides). Weight factors are DEMO values
 * relative to a plain cable chain; the owner replaces them in Customization & Rates.
 */
const chains: C[] = [
  ["cable", "rings", "Cable", 1.0, "Identical oval links, each turned 90° to the next. The classic, strong pendant chain."],
  ["rolo", "rings", "Rolo (Belcher)", 1.1, "Round, slightly domed links joined like a cable chain. Bold but simple."],
  ["paperclip", "rings", "Paperclip", 0.85, "Long, flat, elongated links with an open, modern look."],
  ["mariner", "rings", "Mariner (Anchor)", 1.25, "Oval links with a bar across the middle, like a ship's anchor chain. Sturdy."],
  ["figaro", "rings", "Figaro", 1.15, "Italian pattern: three short flat links, then one long link, repeated."],
  ["satellite", "rings", "Satellite", 1.05, "A fine cable chain with small metal beads spaced evenly along it."],
  ["bead", "rings", "Bead (Ball)", 0.9, "Small metal balls joined by short connectors."],
  ["curb", "flat", "Curb", 1.3, "Uniform links twisted so they lie flat against the skin."],
  ["cuban", "flat", "Cuban (Miami)", 1.8, "A thick, tightly packed curb chain. Bold and very strong."],
  ["herringbone", "flat", "Herringbone", 1.4, "Flat V-shaped links in alternating rows for a smooth, liquid-metal look."],
  ["omega", "flat", "Omega", 1.6, "Smooth metal plates over a flexible core. Holds a neat collar shape."],
  ["rope", "woven", "Rope", 1.7, "Strands of links twisted together like a cord. Shiny and rounded."],
  ["singapore", "woven", "Singapore", 1.1, "A single fine curb chain twisted along its length, so it sparkles as it moves."],
  ["wheat", "woven", "Wheat (Spiga)", 1.45, "Four strands of twisted oval links braided to look like an ear of wheat."],
  ["franco", "woven", "Franco", 1.75, "Tightly woven V-shaped links forming a dense, square-sided chain."],
  ["byzantine", "woven", "Byzantine", 1.9, "An intricate weave of small paired rings (2-2-2 pattern) with a knotted, rope-like texture."],
  ["bismarck", "woven", "Bismarck", 1.85, "Two curb chains joined side by side into a wide, flat, woven band."],
  ["box", "tube", "Box", 1.2, "Square links that form a smooth, boxy chain. Strong and resists tangling."],
  ["venetian", "tube", "Venetian box", 1.25, "A tighter, slightly heavier box chain with perfectly square links."],
  ["snake", "tube", "Snake", 1.5, "Tightly fitted segments forming a smooth, round, flexible tube."],
  ["popcorn", "tube", "Popcorn", 1.3, "A light, hollow tube with a bumpy, beaded texture."],
];

export const seedChainStyles: ChainStyleOption[] = chains.map(([pattern, family, label, weightFactor, description]) => ({
  id: `chain-${pattern}`,
  pattern,
  family,
  label,
  description,
  weightFactor,
  active: true,
}));

export const seedClasps: ClaspOption[] = [
  { id: "clasp-lobster", kind: "lobster", label: "Lobster claw", description: "Spring-loaded hook. Secure and the most popular choice.", fee: 0, active: true },
  { id: "clasp-spring-ring", kind: "spring_ring", label: "Spring ring", description: "Small round clasp with a tiny lever. Best for light chains.", fee: 0, active: true },
  { id: "clasp-toggle", kind: "toggle", label: "Toggle", description: "A bar slips through a ring. Easy to put on by yourself; decorative.", fee: 450, active: true },
  { id: "clasp-box", kind: "box", label: "Box clasp", description: "A tab clicks into a small box. Very secure for heavier chains.", fee: 650, active: true },
];

// Script fonts first (their letters join), then classic fonts (joined by a bar under the letters).
export const seedFonts: FontOption[] = [
  { id: "font-great-vibes", label: "Elegant script", file: "/fonts/great-vibes.typeface.json", cssFamily: "'Great Vibes', cursive", active: true },
  { id: "font-dancing-script", label: "Casual script", file: "/fonts/dancing-script.typeface.json", cssFamily: "'Dancing Script', cursive", active: true },
  { id: "font-pacifico", label: "Bold script", file: "/fonts/pacifico.typeface.json", cssFamily: "'Pacifico', cursive", active: true },
  { id: "font-allura", label: "Graceful script", file: "/fonts/allura.typeface.json", cssFamily: "'Allura', cursive", active: true },
  { id: "font-alex-brush", label: "Brush script", file: "/fonts/alex-brush.typeface.json", cssFamily: "'Alex Brush', cursive", active: true },
  { id: "font-parisienne", label: "Parisian script", file: "/fonts/parisienne.typeface.json", cssFamily: "'Parisienne', cursive", active: true },
  { id: "font-lobster", label: "Retro script", file: "/fonts/lobster.typeface.json", cssFamily: "'Lobster', cursive", active: true },
  { id: "font-satisfy", label: "Handwritten", file: "/fonts/satisfy.typeface.json", cssFamily: "'Satisfy', cursive", active: true },
  { id: "font-playfair", label: "Classic serif", file: "/fonts/playfair-display.typeface.json", cssFamily: "'Playfair Display', serif", active: true },
  { id: "font-cormorant", label: "Fine serif", file: "/fonts/cormorant-garamond.typeface.json", cssFamily: "'Cormorant Garamond', serif", active: true },
  { id: "font-cinzel", label: "Roman capitals", file: "/fonts/cinzel.typeface.json", cssFamily: "'Cinzel', serif", active: true },
  { id: "font-montserrat", label: "Modern block", file: "/fonts/montserrat.typeface.json", cssFamily: "'Montserrat', sans-serif", active: true },
];

export function seedOptions(): CustomizationOptions {
  return structuredClone({
    productTypes: seedProductTypes,
    materials: seedMaterials,
    finishes: seedFinishes,
    gemstones: seedGemstones,
    cuts: seedCuts,
    sizes: seedSizes,
    fonts: seedFonts,
    chainStyles: seedChainStyles,
    clasps: seedClasps,
    designOptions: seedDesignOptions,
  });
}
