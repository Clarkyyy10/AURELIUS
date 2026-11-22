// Design options for every piece type (research: jeweler, retailer and GIA guides — decisions D-25).
// Weight factors and fees are DEMO values; the owner replaces them in Customization & Rates → Designs.

import type { DesignOption, OptionGroup, ProductType, StoneRule } from "@/types";

type Row = [key: string, label: string, family: string, weightFactor: number, fee: number, description: string, extra?: Partial<DesignOption>];

const S = (min: number, max: number, def: number): { stones: StoneRule } => ({ stones: { min, max, default: def } });

function rows(group: OptionGroup, productTypes: ProductType[], list: Row[], idPrefix: string = productTypes[0]): DesignOption[] {
  return list.map(([key, label, family, weightFactor, fee, description, extra]) => ({
    id: `${group}-${idPrefix}-${key}`,
    group,
    productTypes,
    key,
    label,
    family,
    weightFactor,
    fee,
    description,
    active: true,
    ...extra,
  }));
}

const ringStyles = rows("style", ["ring"], [
  ["band", "Plain band", "Classic", 1, 0, "A simple metal band. Wear it alone or stack it with others.", S(0, 0, 0)],
  ["solitaire", "Solitaire", "Classic", 1, 0, "One center stone, no side stones. Timeless and clean.", S(1, 1, 1)],
  ["three_stone", "Three-stone", "Classic", 1.1, 600, "A center stone with a smaller stone on each side (past, present, future).", S(3, 3, 3)],
  ["halo", "Halo", "Classic", 1.15, 1800, "Small stones circle the center stone so it looks bigger and brighter.", S(1, 1, 1)],
  ["eternity", "Eternity", "Classic", 1, 1200, "A row of stones all the way around the band.", S(8, 24, 16)],
  ["cluster", "Cluster", "Statement", 1.1, 1500, "A center stone surrounded by small stones, like a flower.", S(1, 1, 1)],
  ["toi_et_moi", "Toi et moi", "Statement", 1.05, 500, "Two stones side by side — “you and me”.", S(2, 2, 2)],
  ["east_west", "East–west", "Statement", 1, 300, "An oval, pear or emerald-cut stone set sideways across the finger.", S(1, 1, 1)],
  ["cocktail", "Cocktail", "Statement", 1.4, 1500, "A big, bold statement ring with a large stone.", S(1, 1, 1)],
  ["signet", "Signet", "Statement", 1.6, 800, "A flat top for engraved initials or a symbol, with an optional small stone.", { ...S(0, 1, 0), textMax: 3 }],
]);

const settings: DesignOption[] = [
  ...rows("setting", ["ring", "pendant", "earrings", "toe_ring"], [
    ["prong", "Prong", "Settings", 1, 0, "Thin metal claws hold the stone. Lets in the most light."],
    ["bezel", "Bezel", "Settings", 1.05, 300, "A metal rim wraps around the stone. Very protective."],
  ], "all"),
  ...rows("setting", ["ring"], [
    ["basket", "Basket", "Settings", 1, 200, "Prongs joined by a metal ring underneath the stone."],
    ["cathedral", "Cathedral", "Settings", 1.08, 500, "Metal arches rise from the band to lift the stone higher."],
    ["tension", "Tension", "Settings", 1.1, 900, "The band itself grips the stone — no prongs. Modern look."],
    ["channel", "Channel", "Settings", 1.05, 600, "Side stones sit between two metal walls along the band."],
    ["pave", "Pavé", "Settings", 1, 1500, "Tiny stones set closely along the band so little metal shows."],
  ]),
];

const profiles = rows("profile", ["ring", "toe_ring"], [
  ["court", "Comfort (court)", "Band shape", 1, 0, "Rounded inside and out. The most comfortable to wear."],
  ["d_shape", "D-shape", "Band shape", 0.95, 0, "Domed outside, flat inside — a classic wedding band."],
  ["flat", "Flat", "Band shape", 1.05, 0, "Flat top and straight sides. Modern and crisp."],
  ["flat_court", "Flat court", "Band shape", 1.05, 0, "Flat on top with a rounded, comfortable inside."],
  ["knife_edge", "Knife edge", "Band shape", 0.9, 200, "Two sloping sides meet in a sharp ridge on top."],
], "ring");

const shanks = rows("shank", ["ring"], [
  ["straight", "Straight", "Shank", 1, 0, "One smooth band all the way around."],
  ["split", "Split", "Shank", 1.15, 700, "The band divides into two strands near the stone."],
  ["bypass", "Bypass", "Shank", 1.05, 500, "The band ends pass each other, like two hands holding the stone."],
  ["twisted", "Twisted", "Shank", 1.1, 600, "Two strands twist around each other like a rope."],
]);

const earringStyles = rows("style", ["earrings"], [
  ["stud", "Studs", "Close to the ear", 1, 0, "Sit right on the earlobe. Easy to wear every day.", S(0, 2, 0)],
  ["huggie", "Huggies", "Close to the ear", 0.9, 300, "Small hoops that hug the earlobe snugly.", S(0, 2, 0)],
  ["hoop", "Hoops", "Close to the ear", 1.6, 400, "Classic round hoops that loop through the ear."],
  ["drop", "Drops", "Drops and dangles", 1.2, 400, "A stone or shape that hangs just below the lobe.", S(0, 2, 2)],
  ["dangle", "Dangles", "Drops and dangles", 1.4, 600, "Longer earrings that swing as you move.", S(0, 2, 2)],
  ["chandelier", "Chandelier", "Drops and dangles", 2.2, 1500, "Ornate, branching dangles — made for special occasions.", S(0, 2, 2)],
  ["threader", "Threaders", "Drops and dangles", 1.1, 500, "A fine chain pulled through the piercing so it hangs on both sides.", S(0, 2, 0)],
  ["climber", "Climbers", "Ear styling", 1.3, 900, "A line of stones that climbs up the ear from the lobe.", S(0, 10, 6)],
  ["ear_cuff", "Ear cuff", "Ear styling", 1.2, 500, "Clips around the outer ear — no piercing needed."],
  ["jacket", "Jackets", "Ear styling", 1.5, 900, "A stud in front with a second piece that frames the lobe from behind.", S(0, 2, 2)],
]);

const pendantStyles = rows("style", ["pendant"], [
  ["solitaire", "Solitaire drop", "Classic", 1, 0, "A smooth drop with one to three stones.", S(0, 3, 1)],
  ["halo", "Halo", "Classic", 1.1, 1500, "A center stone circled by small stones.", S(1, 1, 1)],
  ["birthstone", "Birthstone", "Classic", 0.8, 0, "A small bezel-set stone for your birth month.", S(1, 1, 1)],
  ["heart", "Heart", "Symbols", 1.1, 300, "A puffed heart, with an optional stone.", S(0, 1, 0)],
  ["cross", "Cross", "Symbols", 1.1, 300, "A classic cross, plain or set with stones.", S(0, 5, 0)],
  ["infinity", "Infinity", "Symbols", 0.9, 200, "The infinity sign — a symbol of forever."],
  ["initial", "Initial", "Personal", 1, 500, "One or two letters in the font you choose.", { textMax: 2 }],
  ["bar", "Bar", "Personal", 1.1, 300, "A slim horizontal bar engraved with a name or date.", { textMax: 12 }],
  ["medallion", "Medallion", "Personal", 1.5, 400, "A round coin pendant, engraved if you like.", { textMax: 12 }],
  ["zodiac", "Zodiac", "Personal", 1.4, 600, "A medallion with your zodiac sign.", { textMax: 11 }],
  ["locket", "Locket", "Personal", 1.8, 1200, "Opens to hold a small photo."],
  ["charm", "Charm disc", "Personal", 0.6, 200, "A small disc charm with one initial.", { textMax: 1 }],
]);

const braceletStyles = rows("style", ["bracelet"], [
  ["bangle", "Bangle", "Rigid", 1, 0, "A solid round band with no clasp — slips over the hand."],
  ["cuff", "Cuff", "Rigid", 1.2, 300, "A rigid band with an opening at the back."],
  ["chain_bracelet", "Chain", "Chain", 0.8, 0, "A flexible chain in any chain style, with a clasp.", { usesChain: true }],
  ["tennis", "Tennis", "Stones", 0.9, 2500, "A continuous line of set stones.", S(15, 30, 22)],
  ["station", "Station", "Stones", 0.9, 600, "A fine chain with stones spaced along it.", { ...S(3, 7, 5), usesChain: true }],
  ["charm", "Charm", "Chain", 1.2, 900, "A chain with small hanging charms.", { usesChain: true }],
  ["id_bar", "ID bracelet", "Chain", 1.1, 500, "A chain with a flat plate for a name or date.", { textMax: 12, usesChain: true }],
]);

const necklaceStyles = rows("style", ["necklace"], [
  ["chain", "Chain", "Chains", 1, 0, "A single chain in the style you choose.", { usesChain: true }],
  ["layered", "Layered", "Chains", 2, 800, "Two chains of different lengths worn together.", { usesChain: true }],
  ["lariat", "Lariat (Y)", "Chains", 1.15, 600, "No center clasp — the chain drops into a Y, with an optional stone at the end.", { ...S(0, 1, 0), usesChain: true }],
  ["station", "Station", "Stones", 1, 600, "Stones spaced evenly along the chain.", { ...S(3, 9, 5), usesChain: true }],
  ["tennis", "Tennis", "Stones", 1.1, 4000, "A continuous line of set stones.", S(20, 45, 32)],
  ["pearl_strand", "Pearl strand", "Stones", 0.25, 1500, "Strung pearls with a metal clasp.", { ...S(30, 60, 45), requiresSurface: "pearl" }],
  ["collar", "Collar (torc)", "Statement", 2.2, 1500, "A rigid, polished collar that sits around the neck."],
  ["bib", "Bib", "Statement", 2.6, 2500, "Several drapes of chain that fan out over the chest.", { usesChain: true }],
]);

const ankletStyles = rows("style", ["anklet"], [
  ["chain", "Chain anklet", "Anklets", 1, 0, "A fine chain around the ankle, in any chain style.", { usesChain: true }],
  ["station", "Station anklet", "Anklets", 1, 500, "A chain with small stones spaced along it.", { ...S(3, 7, 5), usesChain: true }],
  ["charm", "Charm anklet", "Anklets", 1.2, 600, "A chain with small dangling charms.", { usesChain: true }],
]);

const toeRingStyles = rows("style", ["toe_ring"], [
  ["band", "Plain toe ring", "Toe rings", 1, 0, "A slim band for the second toe.", S(0, 1, 0)],
  ["open", "Open toe ring", "Toe rings", 0.9, 0, "Open at the back so it adjusts to fit.", S(0, 1, 0)],
]);

const textures = rows("texture", ["ring", "pendant", "name_pendant", "necklace", "bracelet", "earrings", "anklet", "toe_ring"], [
  ["polished", "High polish", "Texture", 1, 0, "Mirror-bright and shiny — the classic finish."],
  ["satin", "Satin", "Texture", 1, 250, "A soft, low shine that hides small scratches."],
  ["brushed", "Brushed", "Texture", 1, 250, "Fine lines brushed in one direction."],
  ["hammered", "Hammered", "Texture", 1, 400, "Small hammer dents that catch the light."],
  ["sandblasted", "Sandblasted", "Texture", 1, 300, "A frosted, even matte surface."],
  ["florentine", "Florentine", "Texture", 1, 500, "A fine cross-hatched pattern cut into the metal."],
], "all");

export const seedDesignOptions: DesignOption[] = [
  ...ringStyles,
  ...settings,
  ...profiles,
  ...shanks,
  ...earringStyles,
  ...pendantStyles,
  ...braceletStyles,
  ...necklaceStyles,
  ...ankletStyles,
  ...toeRingStyles,
  ...textures,
];

export const ZODIAC_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
