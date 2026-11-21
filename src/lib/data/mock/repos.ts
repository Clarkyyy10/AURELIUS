"use client";

// Mock implementation of the repository interfaces, backed by the persisted zustand store.
// Business rules live here (and in src/lib/status, src/lib/pricing) so Phase 2 can move them to
// server actions / Postgres functions with the same behaviour.

import { assertTransition, canTransition, statusLabel } from "@/lib/status/machines";
import { estimate } from "@/lib/pricing/estimate";
import { designLabels } from "@/lib/pricing/labels";
import { balance, detailHref, downPaymentDue, requiresZeroBalance, verifiedTotal } from "@/lib/transactions/helpers";
import { formatPeso, formatPesoExact } from "@/lib/utils/format";
import type {
  Actor,
  AnyStatus,
  AppNotification,
  CustomizationOptions,
  CustomOrderRequest,
  DesignConfig,
  ID,
  NotificationType,
  Payment,
  ProductOrder,
  ServiceRequest,
  Transaction,
  TransactionKind,
  UserProfile,
} from "@/types";
import { UserFacingError, type Repositories } from "../repositories";
import { db, useDemoStore, type DbState } from "./store";

// ---------------------------------------------------------------- infrastructure

const isTest = typeof process !== "undefined" && process.env.NODE_ENV === "test";

/** Simulated network latency (200–400 ms) and optional simulated errors. */
async function io(): Promise<void> {
  if (!isTest) await new Promise((r) => setTimeout(r, 200 + Math.random() * 200));
  if (db().simulateErrors) {
    throw new UserFacingError("We couldn't reach the store's system. Check your connection and try again. (Simulated error — turn it off in the Demo bar.)");
  }
}

const now = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

function write<T>(recipe: (d: DbState) => T): T {
  let result!: T;
  useDemoStore.getState().write((d) => {
    result = recipe(d);
  });
  return structuredClone(result);
}

function sessionUser(d: DbState = db()): UserProfile | null {
  return d.users.find((u) => u.id === d.sessionUserId) ?? null;
}

function requireUser(d: DbState = db()): UserProfile {
  const u = sessionUser(d);
  if (!u) throw new UserFacingError("Please log in to continue.");
  return u;
}

function requireOwner(d: DbState = db()): UserProfile {
  const u = requireUser(d);
  if (u.role !== "owner") throw new UserFacingError("Only the store owner can do this.");
  return u;
}

function requireVerifiedCustomer(d: DbState = db()): UserProfile {
  const u = requireUser(d);
  if (u.role !== "customer") throw new UserFacingError("Owner accounts can't place orders. Switch to a customer account in the Demo bar.");
  if (!u.emailVerified) throw new UserFacingError("Please verify your email address before submitting. Check your inbox for the confirmation link.");
  return u;
}

const ownerId = (d: DbState) => d.users.find((u) => u.role === "owner")?.id ?? "";

function notify(d: DbState, userId: ID, type: NotificationType, title: string, body: string, link: string) {
  const user = d.users.find((u) => u.id === userId);
  const isCustomer = user?.role === "customer";
  const n: AppNotification = {
    id: uid("n"),
    userId,
    type,
    title,
    body,
    link,
    channels: isCustomer ? ["in_app", "email"] : ["in_app"],
    read: false,
    createdAt: now(),
  };
  d.notifications.unshift(n);
  // FR-49: customer events are also emailed (simulated in Phase 1).
  if (isCustomer && user) {
    d.emails.unshift({ id: uid("mail"), to: user.email, subject: title, body, link, linkLabel: "Open in AURELIUS", createdAt: n.createdAt });
  }
}

function nextCode(d: DbState, prefix: "CO" | "OR" | "SR"): string {
  d.counters[prefix] += 1;
  return `${prefix}-${new Date().getFullYear()}-${String(d.counters[prefix]).padStart(4, "0")}`;
}

function collection(d: DbState, kind: TransactionKind): Transaction[] {
  return kind === "order" ? d.orders : kind === "custom" ? d.customOrders : d.serviceRequests;
}

/** Finds a record the current user is allowed to see (customers: own records only — mirrors RLS). */
function findTx(d: DbState, kind: TransactionKind, id: ID): Transaction {
  const user = requireUser(d);
  const tx = collection(d, kind).find((t) => t.id === id);
  if (!tx || (user.role === "customer" && tx.customerId !== user.id)) {
    throw new UserFacingError("We couldn't find that record. It may have been removed, or it belongs to another account.");
  }
  return tx;
}

function visible<T extends Transaction>(list: T[], customerId?: ID): T[] {
  const user = sessionUser();
  if (!user) return [];
  const filterId = user.role === "customer" ? user.id : customerId;
  return [...list]
    .filter((t) => !filterId || t.customerId === filterId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Idempotent submit: a repeated clientRequestId returns the record created the first time. */
function alreadyProcessed<T extends Transaction>(d: DbState, kind: TransactionKind, clientRequestId: string): T | null {
  const id = d.processed[clientRequestId];
  if (!id) return null;
  return (collection(d, kind).find((t) => t.id === id) as T) ?? null;
}

function customerName(d: DbState, id: ID) {
  return d.users.find((u) => u.id === id)?.fullName ?? "A customer";
}

function setStatus(d: DbState, tx: Transaction, to: AnyStatus, actor: Actor, note?: string) {
  assertTransition(tx.kind, tx.status, to, actor);
  if (requiresZeroBalance(tx.kind, to) && balance(tx) > 0) {
    throw new UserFacingError(
      `The customer still has a balance of ${formatPesoExact(balance(tx))}. Record the payment settled in the store first.`,
    );
  }
  tx.status = to as never;
  tx.history.push({ status: to, at: now(), by: actor, note: note || undefined });
  tx.updatedAt = now();
}

function notifyCustomerStatus(d: DbState, tx: Transaction, note?: string) {
  const link = detailHref(tx.kind, tx.id, "customer");
  if (tx.status === "ready_for_claiming") {
    const bal = balance(tx);
    notify(
      d,
      tx.customerId,
      "ready_for_claiming",
      `${tx.code} is ready for claiming`,
      `Your item is ready. Visit the store to claim it${bal > 0 ? ` and settle the balance of ${formatPesoExact(bal)}` : ""}.`,
      link,
    );
  } else {
    notify(d, tx.customerId, "status_changed", `${tx.code}: ${statusLabel(tx.status)}`, note ? `Note from the store: ${note}` : `The status of ${tx.code} is now “${statusLabel(tx.status)}”.`, link);
  }
}

// ---------------------------------------------------------------- repositories

export const mockRepositories: Repositories = {
  // ------------------------------------------------ auth (FR-41 to FR-45)
  auth: {
    async getSession() {
      await io();
      return { user: sessionUser() };
    },

    async register(input) {
      await io();
      if (!input.privacyConsent) throw new UserFacingError("Please read and agree to the Privacy Notice to create an account.");
      return write((d) => {
        const email = input.email.trim().toLowerCase();
        if (d.users.some((u) => u.email === email)) {
          throw new UserFacingError("An account with this email already exists. Log in instead, or use a different email.");
        }
        const user: UserProfile = {
          id: uid("user"),
          role: "customer",
          fullName: input.fullName.trim(),
          email,
          contactNumber: input.contactNumber,
          emailVerified: false,
          privacyConsentAt: now(), // FR-45: consent recorded at registration
          createdAt: now(),
        };
        d.users.push(user);
        d.sessionUserId = user.id;
        const token = crypto.randomUUID();
        d.verifyTokens[token] = user.id;
        d.emails.unshift({
          id: uid("mail"),
          to: email,
          subject: "Confirm your email for AURELIUS",
          body: `Hi ${user.fullName}, please confirm your email address so you can place orders and submit requests.`,
          link: `/verify-email?token=${token}`,
          linkLabel: "Verify my email",
          createdAt: now(),
        });
        return user;
      });
    },

    async login(email, password) {
      await io();
      // The failed-attempt counter must be saved even when login fails, so the outcome is
      // returned from write() and the error is thrown afterwards (throwing inside would roll back).
      const result = write((d): { user: UserProfile } | { error: string } => {
        const key = email.trim().toLowerCase();
        const attempt = d.failedLogins[key];
        if (attempt?.lockedUntil && attempt.lockedUntil > now()) {
          return { error: "Too many failed attempts. Please wait 15 minutes and try again." };
        }
        const user = d.users.find((u) => u.email === key);
        // Phase 1: any password of 8+ characters works for existing accounts. Phase 2 checks the real hash.
        if (!user || password.length < 8) {
          const count = (attempt?.count ?? 0) + 1;
          d.failedLogins[key] = count >= 5 ? { count, lockedUntil: new Date(Date.now() + 15 * 60_000).toISOString() } : { count };
          return {
            error: count >= 5 ? "Too many failed attempts. Please wait 15 minutes and try again." : "The email or password is incorrect. Check them and try again.",
          };
        }
        delete d.failedLogins[key];
        d.sessionUserId = user.id;
        return { user };
      });
      if ("error" in result) throw new UserFacingError(result.error);
      return result.user;
    },

    async logout() {
      await io();
      write((d) => {
        d.sessionUserId = null;
      });
    },

    async resendVerification() {
      await io();
      write((d) => {
        const user = requireUser(d);
        if (user.emailVerified) return;
        const token = crypto.randomUUID();
        d.verifyTokens[token] = user.id;
        d.emails.unshift({
          id: uid("mail"),
          to: user.email,
          subject: "Confirm your email for AURELIUS",
          body: `Hi ${user.fullName}, here is a new link to confirm your email address.`,
          link: `/verify-email?token=${token}`,
          linkLabel: "Verify my email",
          createdAt: now(),
        });
      });
    },

    async verifyEmail(token) {
      await io();
      return write((d) => {
        const userId = d.verifyTokens[token];
        const user = d.users.find((u) => u.id === userId);
        if (!user) throw new UserFacingError("This verification link is invalid or was already used. Log in and request a new link.");
        user.emailVerified = true;
        delete d.verifyTokens[token];
        d.sessionUserId = user.id;
        return user;
      });
    },

    async requestPasswordReset(email) {
      await io();
      write((d) => {
        const user = d.users.find((u) => u.email === email.trim().toLowerCase());
        if (!user) return; // don't reveal whether the email exists
        const token = crypto.randomUUID();
        d.resetTokens[token] = { userId: user.id, expiresAt: new Date(Date.now() + 3_600_000).toISOString() };
        d.emails.unshift({
          id: uid("mail"),
          to: user.email,
          subject: "Reset your AURELIUS password",
          body: "We received a request to reset your password. This link expires in 1 hour. If you didn't ask for this, you can ignore this email.",
          link: `/reset-password?token=${token}`,
          linkLabel: "Choose a new password",
          createdAt: now(),
        });
      });
    },

    async resetPassword(token) {
      await io();
      write((d) => {
        const entry = d.resetTokens[token];
        if (!entry) throw new UserFacingError("This reset link is invalid or was already used. Request a new link.");
        if (entry.expiresAt < now()) {
          delete d.resetTokens[token];
          throw new UserFacingError("This reset link has expired. Links work for 1 hour — request a new one.");
        }
        delete d.resetTokens[token];
        delete d.failedLogins[d.users.find((u) => u.id === entry.userId)?.email ?? ""];
      });
    },

    async updateProfile(input) {
      await io();
      return write((d) => {
        const user = d.users.find((u) => u.id === requireUser(d).id)!;
        user.fullName = input.fullName.trim();
        user.contactNumber = input.contactNumber;
        return user;
      });
    },

    async changePassword(currentPassword) {
      await io();
      requireUser();
      if (currentPassword.length < 8) throw new UserFacingError("Your current password is incorrect. Check it and try again.");
    },
  },

  // ------------------------------------------------ catalog (FR-12, FR-13, FR-24, FR-25, FR-34)
  catalog: {
    async listProducts(filter = {}) {
      await io();
      const showHidden = filter.includeHidden && sessionUser()?.role === "owner";
      let list = db().products.filter((p) => showHidden || !p.hidden);
      if (filter.category) list = list.filter((p) => p.category === filter.category);
      if (filter.material) list = list.filter((p) => p.material === filter.material);
      if (filter.availability) list = list.filter((p) => p.availability === filter.availability);
      if (filter.minPrice != null) list = list.filter((p) => p.price >= filter.minPrice!);
      if (filter.maxPrice != null) list = list.filter((p) => p.price <= filter.maxPrice!);
      if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter((p) => p.name.toLowerCase().includes(q) || p.material.toLowerCase().includes(q));
      }
      const sort = filter.sort ?? "newest";
      list = [...list].sort((a, b) =>
        sort === "price_asc" ? a.price - b.price : sort === "price_desc" ? b.price - a.price : b.createdAt.localeCompare(a.createdAt),
      );
      return structuredClone(list);
    },

    async getProductBySlug(slug) {
      await io();
      const p = db().products.find((x) => x.slug === slug);
      if (!p || (p.hidden && sessionUser()?.role !== "owner")) return null;
      return structuredClone(p);
    },

    async getProduct(id) {
      await io();
      const p = db().products.find((x) => x.id === id);
      if (!p || (p.hidden && sessionUser()?.role !== "owner")) return null;
      return structuredClone(p);
    },

    async saveProduct(input) {
      await io();
      return write((d) => {
        requireOwner(d);
        if (d.products.some((p) => p.slug === input.slug && p.id !== input.id)) {
          throw new UserFacingError("Another product already uses this web address name. Change the slug.");
        }
        if (input.id) {
          const p = d.products.find((x) => x.id === input.id);
          if (!p) throw new UserFacingError("We couldn't find that product. It may have been removed.");
          Object.assign(p, input, { updatedAt: now() });
          return p;
        }
        const p = { ...input, id: uid("prod"), createdAt: now(), updatedAt: now() };
        d.products.push(p);
        return p;
      });
    },

    async removeProduct(id) {
      await io();
      return write((d) => {
        requireOwner(d);
        const used = d.orders.some((o) => o.productId === id) || d.customOrders.some((c) => c.basedOnProductId === id);
        if (used) return { removed: false, reason: "This product has orders, so it can't be removed. You can hide it instead." };
        d.products = d.products.filter((p) => p.id !== id);
        return { removed: true };
      });
    },

    async listServices(opts = {}) {
      await io();
      const showHidden = opts.includeHidden && sessionUser()?.role === "owner";
      return structuredClone(db().services.filter((s) => showHidden || !s.hidden).sort((a, b) => a.sortOrder - b.sortOrder));
    },

    async saveService(input) {
      await io();
      return write((d) => {
        requireOwner(d);
        if (input.id) {
          const s = d.services.find((x) => x.id === input.id);
          if (!s) throw new UserFacingError("We couldn't find that service.");
          Object.assign(s, input);
          return s;
        }
        const s = { ...input, id: uid("svc"), icon: input.icon ?? "sparkles", sortOrder: Math.max(-1, ...d.services.map((x) => x.sortOrder)) + 1 };
        d.services.push(s);
        return s;
      });
    },

    async moveService(id, direction) {
      await io();
      write((d) => {
        requireOwner(d);
        const sorted = [...d.services].sort((a, b) => a.sortOrder - b.sortOrder);
        const i = sorted.findIndex((s) => s.id === id);
        const j = direction === "up" ? i - 1 : i + 1;
        if (i < 0 || j < 0 || j >= sorted.length) return;
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
        sorted.forEach((s, k) => (d.services.find((x) => x.id === s.id)!.sortOrder = k));
      });
    },
  },

  // ------------------------------------------------ customization (FR-01 to FR-04, FR-47)
  customization: {
    async getOptions(opts = {}) {
      await io();
      const o = db().options;
      if (opts.includeInactive && sessionUser()?.role === "owner") return structuredClone(o);
      return structuredClone(activeOptions(o));
    },

    async saveOptions(options) {
      await io();
      validateOptions(options);
      return write((d) => {
        requireOwner(d);
        d.options = options;
        return options;
      });
    },

    async usedOptionIds() {
      await io();
      const ids = new Set<ID>();
      for (const c of db().customOrders)
        for (const v of c.versions) {
          const cfg = v.config;
          [cfg.materialId, cfg.finishId, cfg.gemstoneId, cfg.cutId ?? "", cfg.sizeId].forEach((x) => x && ids.add(x));
          ids.add(`pt-${cfg.productType}`);
        }
      return ids;
    },
  },

  // ------------------------------------------------ custom orders (FR-07 to FR-11)
  customOrders: {
    async list(opts = {}) {
      await io();
      return structuredClone(visible(db().customOrders, opts.customerId));
    },

    async get(id) {
      await io();
      try {
        return structuredClone(findTx(db(), "custom", id) as CustomOrderRequest);
      } catch {
        return null;
      }
    },

    async submit(input) {
      await io();
      return write((d) => {
        const user = requireVerifiedCustomer(d);
        const existing = alreadyProcessed<CustomOrderRequest>(d, "custom", input.clientRequestId);
        if (existing) return existing;
        const version = makeVersion(d.options, input.config, 1, input.snapshotDataUrl);
        const tx: CustomOrderRequest = {
          kind: "custom",
          id: uid("co"),
          code: nextCode(d, "CO"),
          customerId: user.id,
          source: input.source,
          basedOnProductId: input.basedOnProductId,
          versions: [version],
          revisionRemarks: [],
          payments: [],
          history: [{ status: "submitted", at: now(), by: "customer" }],
          status: "submitted",
          createdAt: now(),
          updatedAt: now(),
        };
        d.customOrders.push(tx);
        d.processed[input.clientRequestId] = tx.id;
        d.pendingDesign = null;
        notify(d, ownerId(d), "new_custom_request", "New custom order request", `${user.fullName} submitted a ${version.labels.productType.toLowerCase()} design (${tx.code}).`, detailHref("custom", tx.id, "owner"));
        return tx;
      });
    },

    async resubmit(id, input) {
      await io();
      return write((d) => {
        const tx = findTx(d, "custom", id) as CustomOrderRequest;
        const existing = alreadyProcessed<CustomOrderRequest>(d, "custom", input.clientRequestId);
        if (existing) return existing;
        const version = makeVersion(d.options, input.config, tx.versions.length + 1, input.snapshotDataUrl);
        setStatus(d, tx, "under_review", "customer", `Version ${version.version} submitted.`);
        tx.versions.push(version);
        d.processed[input.clientRequestId] = tx.id;
        notify(d, ownerId(d), "new_custom_request", `Updated design for ${tx.code}`, `${customerName(d, tx.customerId)} submitted version ${version.version} after your remarks.`, detailHref("custom", tx.id, "owner"));
        return tx;
      });
    },

    async openForReview(id) {
      await io();
      return write((d) => {
        requireOwner(d);
        const tx = findTx(d, "custom", id);
        if (tx.status === "submitted") {
          setStatus(d, tx, "under_review", "owner");
          notifyCustomerStatus(d, tx);
        }
        return tx as CustomOrderRequest;
      });
    },

    async requestRevision(id, remarks) {
      await io();
      return write((d) => {
        requireOwner(d);
        const tx = findTx(d, "custom", id) as CustomOrderRequest;
        setStatus(d, tx, "revision_requested", "owner", remarks);
        tx.revisionRemarks.push({ at: now(), text: remarks });
        notify(d, tx.customerId, "revision_requested", `The owner asked for changes to ${tx.code}`, `Remarks: “${remarks}” Open your request to edit the design and resubmit.`, detailHref("custom", tx.id, "customer"));
        return tx;
      });
    },

    async approve(id) {
      await io();
      return write((d) => {
        requireOwner(d);
        const tx = findTx(d, "custom", id) as CustomOrderRequest;
        setStatus(d, tx, "approved", "owner");
        notify(d, tx.customerId, "status_changed", `Your design ${tx.code} was approved`, "The owner approved your design. A quotation with the final price and date will follow.", detailHref("custom", tx.id, "customer"));
        return tx;
      });
    },

    async reject(id, reason) {
      await io();
      return write((d) => {
        requireOwner(d);
        const tx = findTx(d, "custom", id) as CustomOrderRequest;
        setStatus(d, tx, "rejected", "owner", reason);
        tx.rejectionReason = reason;
        notifyCustomerStatus(d, tx, reason);
        return tx;
      });
    },
  },

  // ------------------------------------------------ product orders (FR-14)
  orders: {
    async list(opts = {}) {
      await io();
      return structuredClone(visible(db().orders, opts.customerId));
    },

    async get(id) {
      await io();
      try {
        return structuredClone(findTx(db(), "order", id) as ProductOrder);
      } catch {
        return null;
      }
    },

    async place(input) {
      await io();
      return write((d) => {
        const user = requireVerifiedCustomer(d);
        const existing = alreadyProcessed<ProductOrder>(d, "order", input.clientRequestId);
        if (existing) return existing;
        const p = d.products.find((x) => x.id === input.productId && !x.hidden);
        if (!p) throw new UserFacingError("This product is no longer in the shop.");
        if (p.availability !== "available") {
          throw new UserFacingError(p.availability === "unavailable" ? "This item is currently unavailable." : "This item is made to order. Use “Request this piece” instead.");
        }
        if (input.quantity < 1 || input.quantity > 5) throw new UserFacingError("You can order between 1 and 5 at a time.");
        const tx: ProductOrder = {
          kind: "order",
          id: uid("ord"),
          code: nextCode(d, "OR"),
          customerId: user.id,
          productId: p.id,
          productSnapshot: { name: p.name, price: p.price, photo: p.photos[0] ?? "" },
          quantity: input.quantity,
          notes: input.notes || undefined,
          payments: [],
          history: [{ status: "pending", at: now(), by: "customer" }],
          status: "pending",
          createdAt: now(),
          updatedAt: now(),
        };
        d.orders.push(tx);
        d.processed[input.clientRequestId] = tx.id;
        notify(d, ownerId(d), "new_order", "New order", `${user.fullName} ordered ${input.quantity} × ${p.name} (${tx.code}).`, detailHref("order", tx.id, "owner"));
        return tx;
      });
    },

    async reject(id, reason) {
      await io();
      return write((d) => {
        requireOwner(d);
        const tx = findTx(d, "order", id) as ProductOrder;
        setStatus(d, tx, "rejected", "owner", reason);
        tx.rejectionReason = reason;
        notifyCustomerStatus(d, tx, reason);
        return tx;
      });
    },
  },

  // ------------------------------------------------ service requests (FR-26 to FR-33)
  services: {
    async list(opts = {}) {
      await io();
      return structuredClone(visible(db().serviceRequests, opts.customerId));
    },

    async get(id) {
      await io();
      try {
        return structuredClone(findTx(db(), "service", id) as ServiceRequest);
      } catch {
        return null;
      }
    },

    async submit(input) {
      await io();
      return write((d) => {
        const user = requireVerifiedCustomer(d);
        const existing = alreadyProcessed<ServiceRequest>(d, "service", input.clientRequestId);
        if (existing) return existing;
        const { clientRequestId, ...fields } = input;
        const tx: ServiceRequest = {
          kind: "service",
          id: uid("sr"),
          code: nextCode(d, "SR"),
          customerId: user.id,
          ...fields,
          payments: [],
          history: [{ status: "submitted", at: now(), by: "customer" }],
          status: "submitted",
          createdAt: now(),
          updatedAt: now(),
        };
        d.serviceRequests.push(tx);
        d.processed[clientRequestId] = tx.id;
        const names = d.services.filter((s) => input.serviceIds.includes(s.id)).map((s) => s.name.toLowerCase()).join(", ");
        notify(d, ownerId(d), "new_service_request", "New service request", `${user.fullName} asked for ${names} (${tx.code}).`, detailHref("service", tx.id, "owner"));
        return tx;
      });
    },

    async recordDropOff(id, input) {
      await io();
      return write((d) => {
        requireOwner(d);
        const tx = findTx(d, "service", id) as ServiceRequest;
        setStatus(d, tx, "received", "owner", input.downPayment > 0 ? `Item received. Down payment of ${formatPesoExact(input.downPayment)} collected.` : "Item received.");
        tx.droppedOffAt = new Date(input.receivedOn).toISOString();
        if (input.downPayment > 0) {
          tx.payments.push({
            id: uid("pay"),
            kind: "down_payment",
            amount: input.downPayment,
            paidOn: input.receivedOn,
            method: input.method,
            referenceNumber: input.method === "cash_in_store" ? "CASH-IN-STORE" : (input.referenceNumber ?? ""),
            recordedBy: "owner",
            status: "verified",
            verifiedAt: now(),
            createdAt: now(),
          });
        }
        const bal = balance(tx);
        notify(d, tx.customerId, "status_changed", `${tx.code}: Item received`, `We received your item${bal > 0 ? `. Remaining balance to settle on claiming: ${formatPesoExact(bal)}` : ""}.`, detailHref("service", tx.id, "customer"));
        return tx;
      });
    },
  },

  // ------------------------------------------------ shared transaction operations
  transactions: {
    async get(kind, id) {
      await io();
      try {
        return structuredClone(findTx(db(), kind, id));
      } catch {
        return null;
      }
    },

    async listAll(opts = {}) {
      await io();
      const d = db();
      return structuredClone([...visible(d.orders, opts.customerId), ...visible(d.customOrders, opts.customerId), ...visible(d.serviceRequests, opts.customerId)].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    },

    async changeStatus(kind, id, to, actor, note) {
      await io();
      return write((d) => {
        const user = actor === "owner" ? requireOwner(d) : requireUser(d);
        const tx = findTx(d, kind, id);
        if (to === "cancelled") throw new UserFacingError("Use Cancel to cancel a request.");
        if (kind === "service" && to === "received" && tx.status === "awaiting_drop_off") {
          throw new UserFacingError("Use “Record drop-off” so the date and down payment are saved.");
        }
        setStatus(d, tx, to, user.role, note);
        notifyCustomerStatus(d, tx, note);
        return tx;
      });
    },

    async issueQuotation(kind, id, input) {
      await io();
      return write((d) => {
        requireOwner(d);
        const tx = findTx(d, kind, id);
        if (input.downPaymentRequired > input.finalPrice) throw new UserFacingError("The down payment can't be more than the final price.");
        const reissue = Boolean(tx.quotation);
        setStatus(d, tx, "quoted", "owner", reissue ? "Quotation re-issued." : undefined);
        tx.quotation = { id: uid("q"), issuedAt: now(), ...input };
        notify(
          d,
          tx.customerId,
          "quotation_issued",
          `Your quotation for ${tx.code} is ready`,
          `Final price ${formatPeso(input.finalPrice)}${input.downPaymentRequired > 0 ? `, down payment ${formatPeso(input.downPaymentRequired)}` : ""}. Open your request to accept or decline.`,
          detailHref(kind, tx.id, "customer"),
        );
        return tx;
      });
    },

    async respondToQuotation(kind, id, decision, reason) {
      await io();
      return write((d) => {
        const user = requireUser(d);
        if (user.role !== "customer") throw new UserFacingError("Only the customer can accept or decline a quotation.");
        const tx = findTx(d, kind, id);
        if (tx.status !== "quoted" || !tx.quotation) throw new UserFacingError("There is no quotation waiting for your answer.");
        let to: AnyStatus;
        if (decision === "declined") to = "declined";
        else if (kind === "service") to = (tx as ServiceRequest).droppedOffAt ? "received" : "awaiting_drop_off";
        else to = downPaymentDue(tx) > 0 ? "awaiting_payment" : "confirmed";
        setStatus(d, tx, to, "customer", decision === "declined" ? reason : "Quotation accepted.");
        tx.quotation.response = { decision, at: now(), reason: reason || undefined };
        notify(d, ownerId(d), "status_changed", `${tx.code}: quotation ${decision}`, `${user.fullName} ${decision} the quotation${reason ? `: “${reason}”` : "."}`, detailHref(kind, tx.id, "owner"));
        return tx;
      });
    },

    async cancel(kind, id, actor, reason) {
      await io();
      return write((d) => {
        const user = actor === "owner" ? requireOwner(d) : requireUser(d);
        const tx = findTx(d, kind, id);
        if (!canTransition(kind, tx.status, "cancelled", user.role)) {
          throw new UserFacingError("This can no longer be cancelled online. Please contact the store.");
        }
        setStatus(d, tx, "cancelled", user.role, reason);
        if (user.role === "customer") {
          notify(d, ownerId(d), "cancelled_by_customer", `${tx.code} was cancelled by the customer`, `${user.fullName} cancelled ${tx.code}${reason ? `: “${reason}”` : "."}`, detailHref(kind, tx.id, "owner"));
        } else {
          notifyCustomerStatus(d, tx, reason);
        }
        return tx;
      });
    },
  },

  // ------------------------------------------------ payments (FR-17, FR-18, FR-30)
  payments: {
    async submit(kind, recordId, input) {
      await io();
      return write((d) => {
        const user = requireUser(d);
        const tx = findTx(d, kind, recordId);
        const dupe = d.processed[input.clientRequestId];
        if (dupe) {
          const p = tx.payments.find((x) => x.id === dupe);
          if (p) return p;
        }
        if (!tx.quotation) throw new UserFacingError("You can pay once the owner has sent a quotation.");
        if (input.amount <= 0) throw new UserFacingError("Enter an amount greater than ₱0.");
        const outstanding = balance(tx) - tx.payments.filter((p) => p.status === "pending_verification").reduce((s, p) => s + p.amount, 0);
        if (input.amount > outstanding + 0.001) {
          throw new UserFacingError(`The amount is more than what is still due (${formatPesoExact(Math.max(0, outstanding))}).`);
        }
        const { clientRequestId, ...fields } = input;
        const p: Payment = { id: uid("pay"), ...fields, recordedBy: "customer", status: "pending_verification", createdAt: now() };
        tx.payments.push(p);
        tx.updatedAt = now();
        d.processed[clientRequestId] = p.id;
        notify(d, ownerId(d), "payment_submitted", "Payment to verify", `${user.fullName} submitted ${formatPesoExact(input.amount)} for ${tx.code} (ref. ${input.referenceNumber}).`, "/admin/payments");
        return p;
      });
    },

    async record(kind, recordId, input) {
      await io();
      return write((d) => {
        requireOwner(d);
        const tx = findTx(d, kind, recordId);
        if (input.amount <= 0) throw new UserFacingError("Enter an amount greater than ₱0.");
        const p: Payment = {
          id: uid("pay"),
          ...input,
          referenceNumber: input.method === "cash_in_store" ? "CASH-IN-STORE" : (input.referenceNumber ?? ""),
          recordedBy: "owner",
          status: "verified",
          verifiedAt: now(),
          createdAt: now(),
        };
        tx.payments.push(p);
        tx.updatedAt = now();
        afterVerified(d, tx);
        return p;
      });
    },

    async verify(kind, recordId, paymentId) {
      await io();
      return write((d) => {
        requireOwner(d);
        const tx = findTx(d, kind, recordId);
        const p = tx.payments.find((x) => x.id === paymentId);
        if (!p) throw new UserFacingError("We couldn't find that payment.");
        if (p.status !== "pending_verification") throw new UserFacingError("This payment was already reviewed.");
        p.status = "verified";
        p.verifiedAt = now();
        tx.updatedAt = now();
        notify(d, tx.customerId, "payment_verified", `Payment verified for ${tx.code}`, `Your payment of ${formatPesoExact(p.amount)} was verified. Remaining balance: ${formatPesoExact(balance(tx))}.`, detailHref(kind, tx.id, "customer"));
        afterVerified(d, tx);
        return p;
      });
    },

    async reject(kind, recordId, paymentId, reason) {
      await io();
      return write((d) => {
        requireOwner(d);
        const tx = findTx(d, kind, recordId);
        const p = tx.payments.find((x) => x.id === paymentId);
        if (!p) throw new UserFacingError("We couldn't find that payment.");
        if (p.status !== "pending_verification") throw new UserFacingError("This payment was already reviewed.");
        p.status = "rejected";
        p.rejectionReason = reason;
        tx.updatedAt = now();
        notify(d, tx.customerId, "payment_rejected", `Payment not accepted for ${tx.code}`, `Your payment of ${formatPesoExact(p.amount)} was not accepted: “${reason}” Please submit it again with the correct details.`, detailHref(kind, tx.id, "customer"));
        return p;
      });
    },
  },

  // ------------------------------------------------ notifications (FR-49, FR-50)
  notifications: {
    async list(userId) {
      await io();
      return structuredClone(db().notifications.filter((n) => n.userId === userId));
    },
    async markRead(id) {
      write((d) => {
        const n = d.notifications.find((x) => x.id === id);
        if (n) n.read = true;
      });
    },
    async markAllRead(userId) {
      write((d) => d.notifications.forEach((n) => n.userId === userId && (n.read = true)));
    },
  },

  settings: {
    async get() {
      await io();
      return structuredClone(db().settings);
    },
    async save(settings) {
      await io();
      return write((d) => {
        requireOwner(d);
        d.settings = settings;
        return settings;
      });
    },
  },

  knowledge: {
    async list(opts = {}) {
      await io();
      return structuredClone(db().faqs.filter((f) => opts.includeInactive || f.active));
    },
    async save(entry) {
      await io();
      return write((d) => {
        requireOwner(d);
        if (entry.id) {
          const f = d.faqs.find((x) => x.id === entry.id);
          if (!f) throw new UserFacingError("We couldn't find that entry.");
          Object.assign(f, entry);
          return f;
        }
        const f = { ...entry, id: uid("faq") };
        d.faqs.push(f);
        return f;
      });
    },
    async remove(id) {
      await io();
      write((d) => {
        requireOwner(d);
        d.faqs = d.faqs.filter((f) => f.id !== id);
      });
    },
    async getPolicies() {
      await io();
      return db().policies;
    },
    async savePolicies(text) {
      await io();
      write((d) => {
        requireOwner(d);
        d.policies = text;
      });
    },
  },

  // ------------------------------------------------ customers (FR-48)
  customers: {
    async list() {
      await io();
      const d = db();
      requireOwner(d);
      return d.users
        .filter((u) => u.role === "customer")
        .map((u) => {
          const txs = [...d.orders, ...d.customOrders, ...d.serviceRequests].filter((t) => t.customerId === u.id);
          const openBalance = txs
            .filter((t) => !["cancelled", "declined", "rejected"].includes(t.status) && t.quotation?.response?.decision === "accepted")
            .reduce((s, t) => s + balance(t), 0);
          return { ...structuredClone(u), transactionCount: txs.length, openBalance };
        });
    },
    async get(id) {
      await io();
      const d = db();
      requireOwner(d);
      return structuredClone(d.users.find((u) => u.id === id && u.role === "customer") ?? null);
    },
  },

  drafts: {
    async save(draft) {
      await io();
      return write((d) => {
        const full = { ...draft, id: uid("draft"), createdAt: now() } as typeof d.drafts[number];
        d.drafts.push(full);
        return full;
      });
    },
    async get(id) {
      await io();
      return structuredClone(db().drafts.find((x) => x.id === id) ?? null);
    },
  },

  emails: {
    async list() {
      return structuredClone(db().emails);
    },
  },
};

// ---------------------------------------------------------------- internals

function makeVersion(options: CustomizationOptions, config: DesignConfig, version: number, snapshotDataUrl?: string) {
  const active = activeOptions(options);
  const e = estimate(config, active); // throws a plain-English EstimateError on an invalid design
  return {
    version,
    config,
    estimate: { weightG: e.weightG, price: e.price },
    labels: designLabels(config, active),
    snapshotDataUrl,
    submittedAt: now(),
  };
}

/** After a verified payment: move "awaiting payment" records to "confirmed" when the down payment is covered. */
function afterVerified(d: DbState, tx: Transaction) {
  if (tx.status === "awaiting_payment" && tx.quotation && verifiedTotal(tx) >= tx.quotation.downPaymentRequired) {
    setStatus(d, tx, "confirmed", "owner", "Down payment verified.");
    notifyCustomerStatus(d, tx, "Down payment verified. Your order is confirmed.");
  }
}

export function activeOptions(o: CustomizationOptions): CustomizationOptions {
  return {
    productTypes: o.productTypes.filter((x) => x.active),
    materials: o.materials.filter((x) => x.active).map((m) => ({ ...m, finishIds: m.finishIds.filter((id) => o.finishes.some((f) => f.id === id && f.active)) })),
    finishes: o.finishes.filter((x) => x.active),
    gemstones: o.gemstones.filter((x) => x.active),
    cuts: o.cuts.filter((x) => x.active),
    sizes: o.sizes.filter((x) => x.active && o.productTypes.some((p) => p.type === x.productType && p.active)),
  };
}

/** FR-47 validation: at least one active option per category and one default size per active piece type. */
export function validateOptions(o: CustomizationOptions): void {
  const need = (list: { active: boolean }[], name: string) => {
    if (!list.some((x) => x.active)) throw new UserFacingError(`Keep at least one active ${name}.`);
  };
  need(o.productTypes, "piece type");
  need(o.materials, "material");
  need(o.finishes, "finish");
  need(o.gemstones, "gemstone option");
  need(o.cuts, "cut");
  const nums: [number, string][] = [
    ...o.productTypes.flatMap((p): [number, string][] => [[p.baseWeightG, `${p.label} base weight`], [p.laborFee, `${p.label} labor fee`], [p.maxStones, `${p.label} max stones`]]),
    ...o.materials.flatMap((m): [number, string][] => [[m.ratePerGram, `${m.label} rate per gram`], [m.densityRatio, `${m.label} density ratio`]]),
    ...o.finishes.map((f): [number, string] => [f.fee, `${f.label} fee`]),
    ...o.gemstones.map((g): [number, string] => [g.basePrice, `${g.label} price`]),
  ];
  for (const [v, label] of nums) if (!(v >= 0) || !Number.isFinite(v)) throw new UserFacingError(`${label} must be 0 or more.`);
  for (const p of o.productTypes) if (!(p.baseWeightG > 0)) throw new UserFacingError(`${p.label} base weight must be greater than 0.`);
  for (const m of o.materials) if (!(m.densityRatio > 0)) throw new UserFacingError(`${m.label} density ratio must be greater than 0.`);
  for (const c of o.cuts) if (!(c.multiplier > 0)) throw new UserFacingError(`${c.label} multiplier must be greater than 0.`);
  for (const s of o.sizes) if (!(s.factor > 0)) throw new UserFacingError(`Size ${s.label} factor must be greater than 0.`);
  for (const m of o.materials.filter((x) => x.active)) {
    if (!m.finishIds.some((id) => o.finishes.some((f) => f.id === id && f.active))) {
      throw new UserFacingError(`${m.label} needs at least one active finish.`);
    }
  }
  for (const p of o.productTypes.filter((x) => x.active)) {
    const sizes = o.sizes.filter((s) => s.productType === p.type && s.active);
    if (sizes.length === 0) throw new UserFacingError(`${p.label} needs at least one active size.`);
    if (sizes.filter((s) => s.isDefault).length !== 1) throw new UserFacingError(`Choose exactly one default size for ${p.label}.`);
  }
}
