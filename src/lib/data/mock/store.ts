"use client";

// Phase 1 mock database: one zustand store persisted to localStorage (key "aurelius-demo-v1").
// Only the mock repositories in ./repos.ts write to it. Phase 2 replaces it with Supabase.

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  AppNotification,
  CustomizationOptions,
  CustomOrderRequest,
  DesignConfig,
  Draft,
  FaqEntry,
  ID,
  Product,
  ProductOrder,
  ServiceCatalogItem,
  ServiceRequest,
  SimulatedEmail,
  StoreSettings,
  UserProfile,
} from "@/types";
import { seedFaqs, seedPolicies, seedProducts, seedServices, seedSettings, seedUsers } from "../seed/catalog";
import { seedOptions } from "../seed/options";
import { seedCustomOrders, seedNotifications, seedOrders, seedServiceRequests } from "../seed/transactions";

export const STORAGE_KEY = "aurelius-demo-v1";

export interface DbState {
  users: UserProfile[];
  sessionUserId: ID | null;
  failedLogins: Record<string, { count: number; lockedUntil?: string }>;
  verifyTokens: Record<string, ID>;
  resetTokens: Record<string, { userId: ID; expiresAt: string }>;
  options: CustomizationOptions;
  products: Product[];
  services: ServiceCatalogItem[];
  faqs: FaqEntry[];
  policies: string;
  settings: StoreSettings;
  customOrders: CustomOrderRequest[];
  orders: ProductOrder[];
  serviceRequests: ServiceRequest[];
  notifications: AppNotification[];
  emails: SimulatedEmail[];
  drafts: Draft[];
  /** clientRequestId → created record id (idempotent submits) */
  processed: Record<string, ID>;
  counters: Record<"CO" | "OR" | "SR", number>;
  /** A design a guest started before logging in, so it isn't lost (frontend-spec §5.4). */
  pendingDesign: (DesignConfig & { fromProductId?: ID }) | null;
}

export interface DemoState extends DbState {
  /** Demo bar: make every repository call fail, to show error states. */
  simulateErrors: boolean;
  /** Bumped on every write so queries refetch. */
  version: number;
  hydrated: boolean;
  write: (recipe: (draft: DbState) => void) => void;
  setSimulateErrors: (on: boolean) => void;
  reset: () => void;
}

export function createSeedState(now = new Date()): DbState {
  const options = seedOptions();
  const products = seedProducts(now);
  const customOrders = seedCustomOrders(now, options);
  const orders = seedOrders(now, products);
  const serviceRequests = seedServiceRequests(now);
  return {
    users: seedUsers(now),
    sessionUserId: null,
    failedLogins: {},
    verifyTokens: {},
    resetTokens: {},
    options,
    products,
    services: seedServices(),
    faqs: seedFaqs(),
    policies: seedPolicies,
    settings: { ...seedSettings },
    customOrders,
    orders,
    serviceRequests,
    notifications: seedNotifications(now),
    emails: [],
    drafts: [],
    processed: {},
    counters: { CO: customOrders.length, OR: orders.length, SR: serviceRequests.length },
    pendingDesign: null,
  };
}

const DB_KEYS: (keyof DbState)[] = [
  "users",
  "sessionUserId",
  "failedLogins",
  "verifyTokens",
  "resetTokens",
  "options",
  "products",
  "services",
  "faqs",
  "policies",
  "settings",
  "customOrders",
  "orders",
  "serviceRequests",
  "notifications",
  "emails",
  "drafts",
  "processed",
  "counters",
  "pendingDesign",
];

function pickDb(s: DemoState | DbState): DbState {
  const out = {} as Record<string, unknown>;
  for (const k of DB_KEYS) out[k] = (s as unknown as Record<string, unknown>)[k];
  return out as unknown as DbState;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      ...createSeedState(),
      simulateErrors: false,
      version: 0,
      hydrated: false,
      write: (recipe) => {
        const draft = structuredClone(pickDb(get()));
        recipe(draft);
        set({ ...draft, version: get().version + 1 });
      },
      setSimulateErrors: (on) => set({ simulateErrors: on, version: get().version + 1 }),
      reset: () => set({ ...createSeedState(), simulateErrors: false, version: get().version + 1 }),
    }),
    {
      name: STORAGE_KEY,
      version: 7,
      // v2: products gained a 3D "design". Copy it from the seed for products saved before that.
      migrate: (persisted, from) => {
        const state = persisted as DemoState;
        if (from < 2 && state?.products) {
          const seed = seedProducts(new Date());
          state.products = state.products.map((p) => (p.design ? p : { ...p, design: seed.find((x) => x.id === p.id)?.design }));
        }
        // v3: name pendants — fonts, the piece type, its sizes, and the sample product.
        if (from < 3 && state?.options) {
          const seed = seedOptions();
          state.options.fonts ??= seed.fonts;
          for (const pt of seed.productTypes) if (!state.options.productTypes.some((x) => x.type === pt.type)) state.options.productTypes.push(pt);
          for (const sz of seed.sizes) if (!state.options.sizes.some((x) => x.id === sz.id)) state.options.sizes.push(sz);
          const product = seedProducts(new Date()).find((p) => p.category === "name_pendant");
          if (product && state.products && !state.products.some((p) => p.id === product.id)) state.products.push(product);
        }
        // v4: more fonts for name pendants (keeps any the owner renamed or turned off).
        if (from < 4 && state?.options) {
          const fonts = (state.options.fonts ??= []);
          for (const font of seedOptions().fonts) if (!fonts.some((x) => x.id === font.id)) fonts.push(font);
        }
        // v5: necklace chain styles, clasps, and named lengths (14–30 in).
        if (from < 5 && state?.options) {
          const seed = seedOptions();
          state.options.chainStyles ??= seed.chainStyles;
          state.options.clasps ??= seed.clasps;
          for (const sz of seed.sizes.filter((x) => x.productType === "necklace")) {
            const existing = state.options.sizes.find((x) => x.id === sz.id);
            if (existing) {
              if (existing.label === sz.label.split(" · ")[0]) existing.label = sz.label;
              existing.sortOrder = sz.sortOrder;
            } else state.options.sizes.push(sz);
          }
          const seedProductsNow = seedProducts(new Date());
          for (const p of state.products ?? []) {
            const sp = seedProductsNow.find((x) => x.id === p.id);
            if (p.category === "necklace" && sp?.design?.chainStyleId && !p.design?.chainStyleId)
              p.design = { ...p.design, chainStyleId: sp.design.chainStyleId, claspId: sp.design.claspId };
          }
        }
        // v6: design options (styles, settings, band shapes, shanks, textures), more cuts and
        // birthstones, anklets and toe rings, and the matching styles on the sample products (D-25).
        if (from < 6 && state?.options) {
          const seed = seedOptions();
          const o = state.options;
          const addMissing = <T extends { id: string }>(list: T[], extra: T[]) => {
            for (const x of extra) if (!list.some((y) => y.id === x.id)) list.push(x);
          };
          addMissing((o.designOptions ??= []), seed.designOptions);
          addMissing(o.cuts, seed.cuts);
          addMissing(o.gemstones, seed.gemstones);
          addMissing(o.productTypes, seed.productTypes);
          addMissing(o.sizes, seed.sizes);
          for (const g of o.gemstones) g.surface ??= seed.gemstones.find((x) => x.id === g.id)?.surface;
          const seedProductsNow = seedProducts(new Date());
          for (const p of state.products ?? []) {
            const sp = seedProductsNow.find((x) => x.id === p.id && x.name === p.name);
            if (sp?.design?.choices && !p.design?.choices) p.design = { ...p.design, ...sp.design };
          }
        }
        // v7 (and later): keep the structural rules of each design option in step with the app
        // (stone rules, chain use, text length, piece types). Names, factors, fees and on/off stay the owner's.
        if (from < 7 && state?.options?.designOptions) {
          const seeds = seedOptions().designOptions;
          for (const d of state.options.designOptions) {
            const seed = seeds.find((x) => x.id === d.id);
            if (!seed) continue;
            d.productTypes = seed.productTypes;
            d.stones = seed.stones;
            d.usesChain = seed.usesChain;
            d.textMax = seed.textMax;
            d.requiresSurface = seed.requiresSurface;
          }
        }
        return state;
      },
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ ...pickDb(s), simulateErrors: s.simulateErrors }),
      onRehydrateStorage: () => () => {
        useDemoStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Read the current database snapshot (for repositories). */
export const db = () => useDemoStore.getState();
