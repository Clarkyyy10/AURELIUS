// Repository interfaces — docs/frontend-spec.md §8.
// Pages and components only talk to these interfaces. Phase 1 uses the mock implementation in
// ./mock; Phase 2 swaps in Supabase implementations with the same signatures.

import type {
  Actor,
  AnyStatus,
  AppNotification,
  CustomizationOptions,
  CustomOrderRequest,
  CustomOrderDraft,
  ServiceRequestDraft,
  DesignConfig,
  Draft,
  FaqEntry,
  ID,
  Payment,
  PaymentKind,
  PaymentMethod,
  Product,
  ProductOrder,
  ProofFile,
  Quotation,
  ServiceCatalogItem,
  ServiceRequest,
  SimulatedEmail,
  StoreSettings,
  Transaction,
  TransactionKind,
  UserProfile,
} from "@/types";

export interface Session {
  user: UserProfile | null;
}

export interface AuthRepo {
  getSession(): Promise<Session>;
  register(input: { fullName: string; email: string; contactNumber: string; password: string; privacyConsent: boolean }): Promise<UserProfile>;
  login(email: string, password: string): Promise<UserProfile>;
  logout(): Promise<void>;
  resendVerification(): Promise<void>;
  verifyEmail(token: string): Promise<UserProfile>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  updateProfile(input: { fullName: string; contactNumber: string }): Promise<UserProfile>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
}

export interface ProductFilter {
  category?: string;
  material?: string;
  availability?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  includeHidden?: boolean;
}

export interface CatalogRepo {
  listProducts(filter?: ProductFilter): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProduct(id: ID): Promise<Product | null>;
  saveProduct(input: Omit<Product, "id" | "createdAt" | "updatedAt"> & { id?: ID }): Promise<Product>;
  removeProduct(id: ID): Promise<{ removed: boolean; reason?: string }>;
  listServices(opts?: { includeHidden?: boolean }): Promise<ServiceCatalogItem[]>;
  saveService(input: Omit<ServiceCatalogItem, "id" | "sortOrder" | "icon"> & { id?: ID; icon?: string }): Promise<ServiceCatalogItem>;
  moveService(id: ID, direction: "up" | "down"): Promise<void>;
}

export interface CustomizationRepo {
  getOptions(opts?: { includeInactive?: boolean }): Promise<CustomizationOptions>;
  saveOptions(options: CustomizationOptions): Promise<CustomizationOptions>;
  /** IDs of options referenced by submitted requests (cannot be hard-deleted). */
  usedOptionIds(): Promise<Set<ID>>;
}

export interface SubmitMeta {
  /** Client-generated ID so repeated submits are ignored (NFR transaction integrity). */
  clientRequestId: string;
}

export interface CustomOrderRepo {
  list(opts?: { customerId?: ID }): Promise<CustomOrderRequest[]>;
  get(id: ID): Promise<CustomOrderRequest | null>;
  submit(
    input: { config: DesignConfig; snapshotDataUrl?: string; source: CustomOrderRequest["source"]; basedOnProductId?: ID } & SubmitMeta,
  ): Promise<CustomOrderRequest>;
  resubmit(id: ID, input: { config: DesignConfig; snapshotDataUrl?: string } & SubmitMeta): Promise<CustomOrderRequest>;
  openForReview(id: ID): Promise<CustomOrderRequest>;
  requestRevision(id: ID, remarks: string): Promise<CustomOrderRequest>;
  approve(id: ID): Promise<CustomOrderRequest>;
  reject(id: ID, reason: string): Promise<CustomOrderRequest>;
}

export interface OrderRepo {
  list(opts?: { customerId?: ID }): Promise<ProductOrder[]>;
  get(id: ID): Promise<ProductOrder | null>;
  place(input: { productId: ID; quantity: number; notes?: string } & SubmitMeta): Promise<ProductOrder>;
  reject(id: ID, reason: string): Promise<ProductOrder>;
}

export interface ServiceRepo {
  list(opts?: { customerId?: ID }): Promise<ServiceRequest[]>;
  get(id: ID): Promise<ServiceRequest | null>;
  submit(
    input: Pick<ServiceRequest, "itemType" | "itemDescription" | "brandModel" | "material" | "serviceIds" | "details" | "photos" | "preferredDropOffDate" | "source"> &
      SubmitMeta,
  ): Promise<ServiceRequest>;
  /** FR-30: owner records drop-off and the down payment collected. */
  recordDropOff(id: ID, input: { receivedOn: string; downPayment: number; method: PaymentMethod; referenceNumber?: string }): Promise<ServiceRequest>;
}

/** Operations shared by all three transaction kinds. */
export interface TransactionRepo {
  get(kind: TransactionKind, id: ID): Promise<Transaction | null>;
  listAll(opts?: { customerId?: ID }): Promise<Transaction[]>;
  changeStatus(kind: TransactionKind, id: ID, to: AnyStatus, actor: Actor, note?: string): Promise<Transaction>;
  issueQuotation(kind: TransactionKind, id: ID, input: Omit<Quotation, "id" | "issuedAt" | "response">): Promise<Transaction>;
  respondToQuotation(kind: TransactionKind, id: ID, decision: "accepted" | "declined", reason?: string): Promise<Transaction>;
  cancel(kind: TransactionKind, id: ID, actor: Actor, reason?: string): Promise<Transaction>;
}

export interface PaymentRepo {
  submit(
    kind: TransactionKind,
    recordId: ID,
    input: { kind: PaymentKind; amount: number; paidOn: string; method: PaymentMethod; referenceNumber: string; proofFile?: ProofFile } & SubmitMeta,
  ): Promise<Payment>;
  /** Owner records a cash or e-wallet payment received in the store (verified immediately). */
  record(
    kind: TransactionKind,
    recordId: ID,
    input: { kind: PaymentKind; amount: number; paidOn: string; method: PaymentMethod; referenceNumber?: string },
  ): Promise<Payment>;
  verify(kind: TransactionKind, recordId: ID, paymentId: ID): Promise<Payment>;
  reject(kind: TransactionKind, recordId: ID, paymentId: ID, reason: string): Promise<Payment>;
}

export interface NotificationRepo {
  list(userId: ID): Promise<AppNotification[]>;
  markRead(id: ID): Promise<void>;
  markAllRead(userId: ID): Promise<void>;
}

export interface SettingsRepo {
  get(): Promise<StoreSettings>;
  save(settings: StoreSettings): Promise<StoreSettings>;
}

export interface KnowledgeRepo {
  list(opts?: { includeInactive?: boolean }): Promise<FaqEntry[]>;
  save(entry: Omit<FaqEntry, "id"> & { id?: ID }): Promise<FaqEntry>;
  remove(id: ID): Promise<void>;
  getPolicies(): Promise<string>;
  savePolicies(text: string): Promise<void>;
}

export interface CustomerRepo {
  list(): Promise<(UserProfile & { transactionCount: number; openBalance: number })[]>;
  get(id: ID): Promise<UserProfile | null>;
}

export interface DraftRepo {
  save(draft: Omit<CustomOrderDraft, "id" | "createdAt"> | Omit<ServiceRequestDraft, "id" | "createdAt">): Promise<Draft>;
  get(id: ID): Promise<Draft | null>;
}

/** Phase 1 only: simulated email outbox shown in the Demo bar. */
export interface EmailRepo {
  list(): Promise<SimulatedEmail[]>;
}

export interface Repositories {
  auth: AuthRepo;
  catalog: CatalogRepo;
  customization: CustomizationRepo;
  customOrders: CustomOrderRepo;
  orders: OrderRepo;
  services: ServiceRepo;
  transactions: TransactionRepo;
  payments: PaymentRepo;
  notifications: NotificationRepo;
  settings: SettingsRepo;
  knowledge: KnowledgeRepo;
  customers: CustomerRepo;
  drafts: DraftRepo;
  emails: EmailRepo;
}

/** Error with a message that is safe and helpful to show the user. */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}
