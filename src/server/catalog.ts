// Catalog, services, 3D options and rates, settings, chatbot knowledge and customers
// (FR-12, FR-13, FR-24, FR-25, FR-34, FR-38, FR-46, FR-47, FR-48). Owner-only changes are also
// limited by Row Level Security.

import type { Prisma } from "@prisma/client";
import { UserFacingError, type ProductFilter } from "@/lib/data/repositories";
import { activeOptions, validateOptions } from "@/lib/pricing/options";
import type { CustomizationOptions, FaqEntry, Product, ServiceCatalogItem, StoreSettings, UserProfile } from "@/types";
import { asUser, num, type Tx } from "./db";
import { optionsToRows } from "./options";
import { loadOptions, listTx, openBalance } from "./transactions/ops";
import { toProfile } from "./auth/session";

type ProductRow = Prisma.ProductGetPayload<object>;

const toProduct = (p: ProductRow): Product => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  description: p.description,
  category: p.category as Product["category"],
  material: p.material,
  price: num(p.price),
  photos: p.photos,
  design: (p.design as Product["design"]) ?? undefined,
  availability: p.availability,
  hidden: p.hidden,
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

const isUuid = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

// ---------------------------------------------------------------- products

export function listProducts(me: UserProfile | null, f: ProductFilter = {}) {
  return asUser(me?.id ?? null, async (tx) => {
    const showHidden = f.includeHidden && me?.role === "owner";
    const where: Prisma.ProductWhereInput = {
      ...(showHidden ? {} : { hidden: false }),
      ...(f.category ? { category: f.category } : {}),
      ...(f.material ? { material: f.material } : {}),
      ...(f.availability ? { availability: f.availability as Product["availability"] } : {}),
      ...(f.minPrice != null || f.maxPrice != null
        ? { price: { ...(f.minPrice != null ? { gte: f.minPrice } : {}), ...(f.maxPrice != null ? { lte: f.maxPrice } : {}) } }
        : {}),
      ...(f.search
        ? { OR: [{ name: { contains: f.search, mode: "insensitive" as const } }, { material: { contains: f.search, mode: "insensitive" as const } }] }
        : {}),
    };
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      f.sort === "price_asc" ? { price: "asc" } : f.sort === "price_desc" ? { price: "desc" } : { createdAt: "desc" };
    return (await tx.product.findMany({ where, orderBy })).map(toProduct);
  });
}

export function getProduct(me: UserProfile | null, by: { id?: string; slug?: string }) {
  return asUser(me?.id ?? null, async (tx) => {
    if (by.id && !isUuid(by.id)) return null;
    const p = await tx.product.findFirst({ where: by.id ? { id: by.id } : { slug: by.slug } });
    return p ? toProduct(p) : null; // RLS hides hidden products from everyone but the owner
  });
}

export function saveProduct(me: UserProfile, input: Omit<Product, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  return asUser(me.id, async (tx) => {
    const clash = await tx.product.findFirst({ where: { slug: input.slug, ...(input.id ? { NOT: { id: input.id } } : {}) } });
    if (clash) throw new UserFacingError("Another product already uses this web address name. Change the slug.");
    const data = {
      slug: input.slug,
      name: input.name,
      description: input.description,
      category: input.category,
      material: input.material,
      price: input.price,
      photos: input.photos,
      design: (input.design ?? undefined) as Prisma.InputJsonValue | undefined,
      availability: input.availability,
      hidden: input.hidden,
    };
    if (input.id) {
      if (!isUuid(input.id) || !(await tx.product.findUnique({ where: { id: input.id } })))
        throw new UserFacingError("We couldn't find that product. It may have been removed.");
      return toProduct(await tx.product.update({ where: { id: input.id }, data }));
    }
    return toProduct(await tx.product.create({ data }));
  });
}

export function removeProduct(me: UserProfile, id: string) {
  return asUser(me.id, async (tx) => {
    if (!isUuid(id)) throw new UserFacingError("We couldn't find that product.");
    const used = (await tx.orderItem.count({ where: { productId: id } })) + (await tx.order.count({ where: { basedOnProductId: id } }));
    if (used > 0) return { removed: false, reason: "This product has orders, so it can't be removed. You can hide it instead." };
    await tx.product.delete({ where: { id } });
    return { removed: true };
  });
}

// ---------------------------------------------------------------- services

const toService = (s: Prisma.ServiceGetPayload<object>): ServiceCatalogItem => ({
  id: s.id,
  name: s.name,
  description: s.description,
  appliesTo: s.appliesTo as ServiceCatalogItem["appliesTo"],
  icon: s.icon,
  hidden: s.hidden,
  sortOrder: s.sortOrder,
});

export function listServices(me: UserProfile | null, includeHidden = false) {
  return asUser(me?.id ?? null, async (tx) =>
    (await tx.service.findMany({ where: includeHidden && me?.role === "owner" ? {} : { hidden: false }, orderBy: { sortOrder: "asc" } })).map(toService),
  );
}

export function saveService(me: UserProfile, input: Omit<ServiceCatalogItem, "id" | "sortOrder" | "icon"> & { id?: string; icon?: string }) {
  return asUser(me.id, async (tx) => {
    const data = {
      name: input.name,
      description: input.description,
      appliesTo: input.appliesTo,
      hidden: input.hidden,
      ...(input.icon ? { icon: input.icon } : {}),
    };
    if (input.id) {
      if (!(await tx.service.findUnique({ where: { id: input.id } }))) throw new UserFacingError("We couldn't find that service.");
      return toService(await tx.service.update({ where: { id: input.id }, data }));
    }
    const last = await tx.service.aggregate({ _max: { sortOrder: true } });
    const id = `svc-${crypto.randomUUID().slice(0, 8)}`;
    return toService(await tx.service.create({ data: { ...data, id, icon: input.icon ?? "sparkles", sortOrder: (last._max.sortOrder ?? -1) + 1 } }));
  });
}

export function moveService(me: UserProfile, id: string, direction: "up" | "down") {
  return asUser(me.id, async (tx) => {
    const sorted = await tx.service.findMany({ orderBy: { sortOrder: "asc" } });
    const i = sorted.findIndex((s) => s.id === id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
    for (const [k, s] of sorted.entries()) if (s.sortOrder !== k) await tx.service.update({ where: { id: s.id }, data: { sortOrder: k } });
  });
}

// ---------------------------------------------------------------- 3D options and rates (FR-47)

export function getOptions(me: UserProfile | null, includeInactive = false) {
  return asUser(me?.id ?? null, async (tx) => {
    const o = await loadOptions(tx);
    return includeInactive && me?.role === "owner" ? o : activeOptions(o);
  });
}

/** Saves the owner's options and rates. Options in use by requests can't be deleted (only turned off). */
export function saveOptions(me: UserProfile, options: CustomizationOptions) {
  validateOptions(options); // same checks as the admin screen (positive rates, at least one active per list…)
  return asUser(me.id, async (tx) => {
    const rows = optionsToRows(options);
    const keep = new Set(rows.map((r) => r.id));
    const existing = await tx.designOption.findMany({ select: { id: true } });
    const removed = existing.map((r) => r.id).filter((id) => !keep.has(id));
    if (removed.length) {
      const used = await usedOptionIdsTx(tx);
      const blocked = removed.filter((id) => used.has(id));
      if (blocked.length) throw new UserFacingError("Some options are used in submitted requests and can't be deleted. Turn them off instead.");
      await tx.designOption.deleteMany({ where: { id: { in: removed } } });
    }
    for (const r of rows) {
      const data = { kind: r.kind, label: r.label, active: r.active, sortOrder: r.sortOrder, attributes: r.attributes as Prisma.InputJsonValue };
      await tx.designOption.upsert({ where: { id: r.id }, create: { id: r.id, ...data }, update: data });
    }
    return loadOptions(tx);
  });
}

async function usedOptionIdsTx(tx: Tx): Promise<Set<string>> {
  const ids = new Set<string>();
  const designs = await tx.customDesign.findMany({ select: { config: true } });
  for (const d of designs) {
    const c = d.config as Record<string, unknown>;
    for (const k of ["materialId", "finishId", "gemstoneId", "cutId", "sizeId", "fontId", "chainStyleId", "claspId"])
      if (typeof c[k] === "string") ids.add(c[k] as string);
    if (typeof c.productType === "string") ids.add(`pt-${c.productType}`);
    for (const v of Object.values((c.choices as Record<string, string>) ?? {})) ids.add(v);
  }
  return ids;
}

export function usedOptionIds(me: UserProfile) {
  return asUser(me.id, usedOptionIdsTx);
}

// ---------------------------------------------------------------- settings and knowledge

export function getSettings() {
  return asUser(null, async (tx) => {
    const s = await tx.storeSettings.findUnique({ where: { id: 1 } });
    if (!s) throw new UserFacingError("The store settings haven't been set up yet.");
    const { storeName, address, contactNumber, email, openingHours, paymentInstructions, claimingNote } = s;
    return { storeName, address, contactNumber, email, openingHours, paymentInstructions, claimingNote } satisfies StoreSettings;
  });
}

export function saveSettings(me: UserProfile, s: StoreSettings) {
  return asUser(me.id, async (tx) => {
    await tx.storeSettings.update({ where: { id: 1 }, data: s });
    return s;
  });
}

export const getPolicies = () =>
  asUser(null, async (tx) => (await tx.storeSettings.findUnique({ where: { id: 1 }, select: { policies: true } }))?.policies ?? "");
export const savePolicies = (me: UserProfile, text: string) =>
  asUser(me.id, async (tx) => void (await tx.storeSettings.update({ where: { id: 1 }, data: { policies: text } })));

const toFaq = (f: Prisma.FaqGetPayload<object>): FaqEntry => ({ id: f.id, question: f.question, answer: f.answer, keywords: f.keywords, active: f.active });

export const listFaqs = (me: UserProfile | null, includeInactive = false) =>
  asUser(me?.id ?? null, async (tx) =>
    (await tx.faq.findMany({ where: includeInactive && me?.role === "owner" ? {} : { active: true }, orderBy: { question: "asc" } })).map(toFaq),
  );

export function saveFaq(me: UserProfile, entry: Omit<FaqEntry, "id"> & { id?: string }) {
  return asUser(me.id, async (tx) => {
    const data = { question: entry.question, answer: entry.answer, keywords: entry.keywords, active: entry.active };
    if (entry.id) {
      if (!isUuid(entry.id) || !(await tx.faq.findUnique({ where: { id: entry.id } }))) throw new UserFacingError("We couldn't find that entry.");
      return toFaq(await tx.faq.update({ where: { id: entry.id }, data }));
    }
    return toFaq(await tx.faq.create({ data }));
  });
}

export const removeFaq = (me: UserProfile, id: string) => asUser(me.id, async (tx) => void (isUuid(id) && (await tx.faq.deleteMany({ where: { id } }))));

// ---------------------------------------------------------------- customers (FR-48)

export function listCustomers(me: UserProfile) {
  return asUser(me.id, async (tx) => {
    const users = await tx.user.findMany({ where: { role: "customer" }, orderBy: { createdAt: "desc" } });
    const all = [...(await listTx(tx, "order")), ...(await listTx(tx, "custom")), ...(await listTx(tx, "service"))];
    return users.map((u) => {
      const mine = all.filter((t) => t.customerId === u.id);
      return { ...toProfile(u, Boolean(u.emailConfirmedAt)), transactionCount: mine.length, openBalance: openBalance(mine) };
    });
  });
}

export function getCustomer(me: UserProfile, id: string) {
  return asUser(me.id, async (tx) => {
    if (!isUuid(id)) return null;
    const u = await tx.user.findFirst({ where: { id, role: "customer" } });
    return u ? toProfile(u, Boolean(u.emailConfirmedAt)) : null;
  });
}
