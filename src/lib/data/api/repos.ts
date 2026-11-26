// Phase 2 repositories (everything except auth): the same interfaces as the mock, backed by the API.

import type {
  CatalogRepo,
  CustomerRepo,
  CustomizationRepo,
  CustomOrderRepo,
  DraftRepo,
  EmailRepo,
  KnowledgeRepo,
  NotificationRepo,
  OrderRepo,
  PaymentRepo,
  ServiceRepo,
  SettingsRepo,
  TransactionRepo,
} from "../repositories";
import type {
  AppNotification,
  CustomizationOptions,
  CustomOrderRequest,
  Draft,
  FaqEntry,
  Payment,
  Product,
  ProductOrder,
  ServiceCatalogItem,
  ServiceRequest,
  StoreSettings,
  Transaction,
  UserProfile,
} from "@/types";
import { api, qs } from "./http";

const enc = encodeURIComponent;

export const apiCatalog: CatalogRepo = {
  listProducts: (f = {}) =>
    api<Product[]>(
      "GET",
      `/api/products${qs({ category: f.category, material: f.material, availability: f.availability, minPrice: f.minPrice, maxPrice: f.maxPrice, search: f.search, sort: f.sort, includeHidden: f.includeHidden ? 1 : undefined })}`,
    ),
  getProductBySlug: (slug) => api<Product>("GET", `/api/products/${enc(slug)}?by=slug`).catch(() => null),
  getProduct: (id) => api<Product>("GET", `/api/products/${enc(id)}`).catch(() => null),
  saveProduct: ({ id, ...input }) => (id ? api<Product>("PUT", `/api/products/${enc(id)}`, input) : api<Product>("POST", "/api/products", input)),
  removeProduct: (id) => api<{ removed: boolean; reason?: string }>("DELETE", `/api/products/${enc(id)}`),
  listServices: (opts = {}) => api<ServiceCatalogItem[]>("GET", `/api/services${qs({ includeHidden: opts.includeHidden ? 1 : undefined })}`),
  saveService: ({ id, ...input }) =>
    id ? api<ServiceCatalogItem>("PUT", `/api/services/${enc(id)}`, input) : api<ServiceCatalogItem>("POST", "/api/services", input),
  moveService: (id, direction) => api<void>("POST", `/api/services/${enc(id)}/move`, { direction }),
};

export const apiCustomization: CustomizationRepo = {
  getOptions: (opts = {}) => api<CustomizationOptions>("GET", `/api/options${qs({ includeInactive: opts.includeInactive ? 1 : undefined })}`),
  saveOptions: (options) => api<CustomizationOptions>("PUT", "/api/options", options),
  usedOptionIds: async () => new Set(await api<string[]>("GET", "/api/options/used")),
};

export const apiCustomOrders: CustomOrderRepo = {
  list: (opts = {}) => api<CustomOrderRequest[]>("GET", `/api/custom-orders${qs({ customerId: opts.customerId })}`),
  get: (id) => api<CustomOrderRequest | null>("GET", `/api/custom-orders/${enc(id)}`),
  submit: (input) => api<CustomOrderRequest>("POST", "/api/custom-orders", input),
  resubmit: (id, input) => api<CustomOrderRequest>("POST", `/api/custom-orders/${enc(id)}/resubmit`, input),
  openForReview: (id) => api<CustomOrderRequest>("POST", `/api/custom-orders/${enc(id)}/review`, {}),
  requestRevision: (id, text) => api<CustomOrderRequest>("POST", `/api/custom-orders/${enc(id)}/revision`, { text }),
  approve: (id) => api<CustomOrderRequest>("POST", `/api/custom-orders/${enc(id)}/approve`, {}),
  reject: (id, reason) => api<CustomOrderRequest>("POST", `/api/custom-orders/${enc(id)}/reject`, { reason }),
};

export const apiOrders: OrderRepo = {
  list: (opts = {}) => api<ProductOrder[]>("GET", `/api/orders${qs({ customerId: opts.customerId })}`),
  get: (id) => api<ProductOrder | null>("GET", `/api/transactions/order/${enc(id)}`),
  place: (input) => api<ProductOrder>("POST", "/api/orders", input),
  reject: (id, reason) => api<ProductOrder>("POST", `/api/orders/${enc(id)}/reject`, { reason }),
};

export const apiServices: ServiceRepo = {
  list: (opts = {}) => api<ServiceRequest[]>("GET", `/api/service-requests${qs({ customerId: opts.customerId })}`),
  get: (id) => api<ServiceRequest | null>("GET", `/api/transactions/service/${enc(id)}`),
  submit: (input) => api<ServiceRequest>("POST", "/api/service-requests", input),
  recordDropOff: (id, input) => api<ServiceRequest>("POST", `/api/service-requests/${enc(id)}/drop-off`, input),
};

const tx = (kind: string, id: string, action: string) => `/api/transactions/${enc(kind)}/${enc(id)}/${action}`;

export const apiTransactions: TransactionRepo = {
  get: (kind, id) => api<Transaction | null>("GET", `/api/transactions/${enc(kind)}/${enc(id)}`),
  listAll: (opts = {}) => api<Transaction[]>("GET", `/api/transactions${qs({ customerId: opts.customerId })}`),
  changeStatus: (kind, id, to, _actor, note) => api<Transaction>("POST", tx(kind, id, "status"), { to, note }),
  issueQuotation: (kind, id, input) => api<Transaction>("POST", tx(kind, id, "quotation"), input),
  respondToQuotation: (kind, id, decision, reason) => api<Transaction>("POST", tx(kind, id, "quotation-response"), { decision, reason }),
  cancel: (kind, id, _actor, reason) => api<Transaction>("POST", tx(kind, id, "cancel"), { reason }),
};

export const apiPayments: PaymentRepo = {
  submit: (kind, id, input) => api<Payment>("POST", tx(kind, id, "payments"), input),
  record: (kind, id, input) => api<Payment>("POST", tx(kind, id, "payments/record"), input),
  verify: (kind, id, paymentId) => api<Payment>("POST", tx(kind, id, `payments/${enc(paymentId)}/verify`), {}),
  reject: (kind, id, paymentId, reason) => api<Payment>("POST", tx(kind, id, `payments/${enc(paymentId)}/reject`), { reason }),
};

export const apiNotifications: NotificationRepo = {
  list: () => api<AppNotification[]>("GET", "/api/notifications"),
  markRead: (id) => api<void>("POST", `/api/notifications/${enc(id)}/read`, {}),
  markAllRead: () => api<void>("POST", "/api/notifications/read-all", {}),
};

export const apiSettings: SettingsRepo = {
  get: () => api<StoreSettings>("GET", "/api/settings"),
  save: (s) => api<StoreSettings>("PUT", "/api/settings", s),
};

export const apiKnowledge: KnowledgeRepo = {
  list: (opts = {}) => api<FaqEntry[]>("GET", `/api/faqs${qs({ includeInactive: opts.includeInactive ? 1 : undefined })}`),
  save: ({ id, ...entry }) => (id ? api<FaqEntry>("PUT", `/api/faqs/${enc(id)}`, entry) : api<FaqEntry>("POST", "/api/faqs", entry)),
  remove: (id) => api<void>("DELETE", `/api/faqs/${enc(id)}`),
  getPolicies: async () => (await api<{ text: string }>("GET", "/api/policies")).text,
  savePolicies: (text) => api<void>("PUT", "/api/policies", { text }),
};

export const apiCustomers: CustomerRepo = {
  list: () => api<(UserProfile & { transactionCount: number; openBalance: number })[]>("GET", "/api/customers"),
  get: (id) => api<UserProfile | null>("GET", `/api/customers/${enc(id)}`),
};

/** Drafts live only in this browser tab (since D-27 the chatbot no longer saves them). */
const DRAFT_KEY = "aurelius-drafts";
export const apiDrafts: DraftRepo = {
  async save(draft) {
    const full = { ...draft, id: crypto.randomUUID(), createdAt: new Date().toISOString() } as Draft;
    const all = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "[]") as Draft[];
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify([...all.slice(-9), full]));
    return full;
  },
  async get(id) {
    const all = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "[]") as Draft[];
    return all.find((d) => d.id === id) ?? null;
  },
};

/** Real emails are sent through Resend in Phase 2; there is no simulated outbox. */
export const apiEmails: EmailRepo = { list: async () => [] };
