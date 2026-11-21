// Shared types — mirror docs/data-model.md. Phase 2 maps each entity to a Supabase table.

export type ID = string;
export type ISODate = string;

// ---------- Users (FR-41 to FR-46) ----------
export type Role = "customer" | "owner";

export interface UserProfile {
  id: ID;
  role: Role;
  fullName: string;
  email: string;
  contactNumber: string;
  emailVerified: boolean; // FR-41
  privacyConsentAt: ISODate | null; // FR-45
  createdAt: ISODate;
}

// ---------- Store settings (FR-46) ----------
export interface StoreSettings {
  storeName: string;
  address: string;
  contactNumber: string;
  email: string;
  openingHours: string;
  paymentInstructions: string;
  claimingNote: string;
}

// ---------- Customization options and rates (FR-01 to FR-04, FR-47) ----------
export const PRODUCT_TYPES = ["ring", "pendant", "necklace", "bracelet", "earrings"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export interface ProductTypeOption {
  id: ID;
  type: ProductType;
  label: string;
  baseWeightG: number;
  laborFee: number;
  maxStones: number;
  modelUrl?: string;
  active: boolean;
}

export interface MaterialOption {
  id: ID;
  label: string;
  ratePerGram: number;
  densityRatio: number;
  finishIds: ID[];
  active: boolean;
}

export interface FinishOption {
  id: ID;
  label: string;
  colorHex: string;
  roughness: number;
  fee: number;
  active: boolean;
}

export interface GemstoneOption {
  id: ID;
  label: string;
  basePrice: number;
  colorHex: string;
  ior: number;
  active: boolean;
  /** true for the "None" option */
  isNone?: boolean;
}

export interface CutOption {
  id: ID;
  label: string;
  multiplier: number;
  active: boolean;
}

export interface SizeOption {
  id: ID;
  productType: ProductType;
  label: string;
  factor: number;
  sortOrder: number;
  isDefault: boolean;
  active: boolean;
}

export interface CustomizationOptions {
  productTypes: ProductTypeOption[];
  materials: MaterialOption[];
  finishes: FinishOption[];
  gemstones: GemstoneOption[];
  cuts: CutOption[];
  sizes: SizeOption[];
}

// ---------- Catalog (FR-12, FR-13, FR-24, FR-25, FR-34) ----------
export type Availability = "available" | "made_to_order" | "unavailable";

export interface Product {
  id: ID;
  slug: string;
  name: string;
  description: string;
  category: ProductType;
  material: string;
  price: number;
  photos: string[];
  availability: Availability;
  hidden: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type ItemKind = "jewelry" | "watch";

export interface ServiceCatalogItem {
  id: ID;
  name: string;
  description: string;
  appliesTo: ItemKind[];
  icon: string; // lucide icon name
  hidden: boolean;
  sortOrder: number;
}

// ---------- Status ----------
export type OrderStatus =
  | "pending"
  | "quoted"
  | "awaiting_payment"
  | "confirmed"
  | "in_production"
  | "ready_for_claiming"
  | "completed"
  | "declined"
  | "rejected"
  | "cancelled";

export type CustomOrderStatus =
  | "submitted"
  | "under_review"
  | "revision_requested"
  | "approved"
  | "quoted"
  | "awaiting_payment"
  | "confirmed"
  | "in_production"
  | "ready_for_claiming"
  | "completed"
  | "declined"
  | "rejected"
  | "cancelled";

export type ServiceStatus =
  | "submitted"
  | "under_assessment"
  | "quoted"
  | "awaiting_drop_off"
  | "received"
  | "in_progress"
  | "completed"
  | "ready_for_claiming"
  | "claimed"
  | "declined"
  | "cancelled";

export type AnyStatus = OrderStatus | CustomOrderStatus | ServiceStatus;
export type Actor = "customer" | "owner";

export interface HistoryEntry {
  status: AnyStatus;
  at: ISODate;
  by: Actor;
  note?: string;
}

// ---------- Transactions ----------
export interface DesignConfig {
  productType: ProductType;
  materialId: ID;
  finishId: ID;
  gemstoneId: ID;
  cutId: ID | null;
  stoneQuantity: number;
  sizeId: ID;
  engravingText?: string;
  notes?: string;
}

export interface EstimateBreakdown {
  metal: number;
  stones: number;
  labor: number;
  finish: number;
}

export interface Estimate {
  weightG: number;
  price: number;
  breakdown: EstimateBreakdown;
}

export interface DesignVersion {
  version: number;
  config: DesignConfig;
  estimate: { weightG: number; price: number };
  /** Human-readable labels captured at submit time, so later option edits don't change history. */
  labels: DesignLabels;
  snapshotDataUrl?: string;
  submittedAt: ISODate;
}

export interface DesignLabels {
  productType: string;
  material: string;
  finish: string;
  gemstone: string;
  cut: string | null;
  size: string;
}

export interface Quotation {
  id: ID;
  issuedAt: ISODate;
  finalPrice: number;
  downPaymentRequired: number;
  expectedDate: ISODate;
  procedure?: string;
  notes?: string;
  response?: { decision: "accepted" | "declined"; at: ISODate; reason?: string };
}

export type PaymentKind = "down_payment" | "full_payment" | "balance";
export type PaymentStatus = "pending_verification" | "verified" | "rejected";
export type PaymentMethod = "gcash" | "bank_transfer" | "cash_in_store";

export interface ProofFile {
  name: string;
  type: "image/jpeg" | "image/png" | "application/pdf";
  sizeBytes: number;
  dataUrl?: string;
}

export interface Payment {
  id: ID;
  kind: PaymentKind;
  amount: number;
  paidOn: ISODate;
  referenceNumber: string;
  method: PaymentMethod;
  proofFile?: ProofFile;
  recordedBy: Actor;
  status: PaymentStatus;
  rejectionReason?: string;
  verifiedAt?: ISODate;
  createdAt: ISODate;
}

interface TransactionBase {
  id: ID;
  code: string;
  customerId: ID;
  quotation?: Quotation;
  payments: Payment[];
  history: HistoryEntry[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface CustomOrderRequest extends TransactionBase {
  kind: "custom";
  source: "customizer" | "catalog" | "chatbot";
  basedOnProductId?: ID;
  versions: DesignVersion[];
  revisionRemarks: { at: ISODate; text: string }[];
  rejectionReason?: string;
  status: CustomOrderStatus;
}

export interface ProductOrder extends TransactionBase {
  kind: "order";
  productId: ID;
  productSnapshot: { name: string; price: number; photo: string };
  quantity: number;
  notes?: string;
  rejectionReason?: string;
  status: OrderStatus;
}

export interface ServiceRequest extends TransactionBase {
  kind: "service";
  itemType: ItemKind;
  itemDescription: string;
  brandModel?: string;
  material?: string;
  serviceIds: ID[];
  details: string;
  photos: string[];
  preferredDropOffDate?: ISODate;
  droppedOffAt?: ISODate;
  source: "form" | "chatbot";
  status: ServiceStatus;
}

export type Transaction = CustomOrderRequest | ProductOrder | ServiceRequest;
export type TransactionKind = Transaction["kind"];

// ---------- Notifications (FR-49, FR-50) ----------
export type NotificationType =
  | "revision_requested"
  | "quotation_issued"
  | "status_changed"
  | "ready_for_claiming"
  | "new_order"
  | "new_custom_request"
  | "new_service_request"
  | "payment_submitted"
  | "payment_verified"
  | "payment_rejected"
  | "cancelled_by_customer";

export interface AppNotification {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  channels: ("in_app" | "email")[];
  read: boolean;
  createdAt: ISODate;
}

export interface SimulatedEmail {
  id: ID;
  to: string;
  subject: string;
  body: string;
  link?: string;
  linkLabel?: string;
  createdAt: ISODate;
}

// ---------- Chatbot knowledge (FR-38) ----------
export interface FaqEntry {
  id: ID;
  question: string;
  answer: string;
  keywords: string[];
  active: boolean;
}

// ---------- Drafts from the chatbot (FR-36, FR-37) ----------
export interface CustomOrderDraft {
  id: ID;
  kind: "custom_order";
  config: Partial<DesignConfig>;
  notes?: string;
  createdAt: ISODate;
}

export interface ServiceRequestDraft {
  id: ID;
  kind: "service_request";
  fields: Partial<
    Pick<ServiceRequest, "itemType" | "itemDescription" | "brandModel" | "material" | "serviceIds" | "details">
  >;
  createdAt: ISODate;
}

export type Draft = CustomOrderDraft | ServiceRequestDraft;
