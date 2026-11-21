# AURELIUS — Data Model, Statuses, and Pricing

These types are used by the Phase 1 mock store and become Supabase tables in Phase 2 (one table per
entity, snake_case columns). Put the TypeScript versions in `src/types/`. IDs are strings (UUIDs);
dates are ISO strings; money is a number in pesos (stored as numeric(12,2) in Phase 2).

## 1. Users

```ts
type Role = "customer" | "owner";

interface UserProfile {
  id: string;
  role: Role;
  fullName: string;
  email: string;
  contactNumber: string;          // PH mobile, e.g. 09171234567 or +639171234567
  emailVerified: boolean;          // FR-41: must be true before ordering or requesting
  privacyConsentAt: string | null; // FR-45: timestamp of consent
  createdAt: string;
}
```

## 2. Store settings (owner)

```ts
interface StoreSettings {
  storeName: "Afable's Jewelry Store";
  address: string;                 // "Montalban Public Market, Rodriguez, Rizal"
  contactNumber: string;
  email: string;
  openingHours: string;            // free text
  paymentInstructions: string;     // e.g. GCash name/number and bank details shown on the payment form
  claimingNote: string;            // "Items are claimed and balances settled in the store."
}
```

## 3. Customization options and rates (FR-01 to FR-04, FR-47)

All values are owner-editable in `/admin/customization`. Sample values below are **seed data for the
demo only**; the owner replaces them with real rates.

```ts
type ProductType = "ring" | "pendant" | "necklace" | "bracelet" | "earrings";

interface ProductTypeOption {
  id: string; type: ProductType; label: string;
  baseWeightG: number;      // weight of the reference design in silver at size factor 1.00
  laborFee: number;         // pesos
  maxStones: number;        // max gemstone quantity allowed
  modelUrl?: string;        // optional .glb (Phase 2/3); procedural model used when absent
  active: boolean;
}
interface MaterialOption {
  id: string; label: string;
  ratePerGram: number;      // pesos per gram
  densityRatio: number;     // density relative to silver 925 (silver = 1.00)
  finishIds: string[];      // finishes allowed for this material (FR-02)
  active: boolean;
}
interface FinishOption {
  id: string; label: string;
  colorHex: string;         // used by the 3D material
  roughness: number;        // 0–1, used by the 3D material
  fee: number;              // pesos (e.g. rose plating)
  active: boolean;
}
interface GemstoneOption {
  id: string; label: string;
  basePrice: number;        // pesos per stone, round cut
  colorHex: string; ior: number;  // used by the 3D gem material
  active: boolean;
}
interface CutOption { id: string; label: string; multiplier: number; active: boolean; }
interface SizeOption {
  id: string; productType: ProductType; label: string; // "US 7", "18 in", "Medium"
  factor: number; sortOrder: number; isDefault: boolean; active: boolean;
}
```

### Seed values
| Product type | Base weight (g) | Labor fee (₱) | Max stones |
|---|---|---|---|
| Ring | 3.0 | 1,500 | 5 |
| Pendant | 2.0 | 1,000 | 3 |
| Necklace | 6.0 | 2,000 | 0 |
| Bracelet | 8.0 | 1,200 | 0 |
| Earrings (pair) | 2.4 | 800 | 2 |

| Material | Rate per gram (₱) | Density ratio | Allowed finishes |
|---|---|---|---|
| 18K Gold | 4,200 | 1.51 | Yellow, White, Rose |
| 14K Gold | 3,300 | 1.26 | Yellow, White, Rose |
| Sterling Silver 925 | 95 | 1.00 | Polished, Oxidized, Gold-plated |
| Stainless Steel | 40 | 0.77 | Silver tone, Black, Gold tone |

| Finish | Color | Roughness | Fee (₱) |
|---|---|---|---|
| Yellow | #E6C068 | 0.18 | 0 |
| White | #E9E9EC | 0.15 | 0 |
| Rose | #E7A98F | 0.18 | 500 |
| Polished | #D9D9DE | 0.12 | 0 |
| Oxidized | #6B6B70 | 0.45 | 200 |
| Gold-plated | #DDB55E | 0.2 | 350 |
| Silver tone | #C9CBD0 | 0.25 | 0 |
| Black | #2B2B2E | 0.35 | 300 |
| Gold tone | #CFA75A | 0.25 | 300 |

| Gemstone | Base price per stone (₱) | Color | IOR |
|---|---|---|---|
| None | 0 | — | — |
| Cubic Zirconia | 150 | #F4F6FA | 2.15 |
| Ruby (lab) | 800 | #B0102B | 1.77 |
| Sapphire (lab) | 900 | #1F3FA8 | 1.77 |
| Emerald (lab) | 1,000 | #1E8A57 | 1.58 |
| Diamond (lab-grown) | 3,500 | #FFFFFF | 2.42 |

| Cut | Multiplier |
|---|---|
| Round | 1.00 |
| Oval | 1.10 |
| Princess | 1.15 |
| Pear | 1.20 |

| Sizes | Labels and factors (default in bold) |
|---|---|
| Ring | US 5 = 0.90, US 6 = 0.95, **US 7 = 1.00**, US 8 = 1.05, US 9 = 1.10, US 10 = 1.15 |
| Necklace | 16 in = 0.89, **18 in = 1.00**, 20 in = 1.11 |
| Bracelet | 6.5 in = 0.93, **7 in = 1.00**, 7.5 in = 1.07 |
| Pendant | Small = 0.80, **Medium = 1.00**, Large = 1.25 |
| Earrings | Small = 0.80, **Medium = 1.00**, Large = 1.25 |

## 4. Catalog

```ts
type Availability = "available" | "made_to_order" | "unavailable"; // FR-13
interface Product {
  id: string; slug: string; name: string; description: string;
  category: ProductType; material: string; price: number;
  photos: string[];          // local placeholder paths in P1, Storage URLs in P2
  availability: Availability;
  hidden: boolean;           // FR-24: hidden products are not shown to customers
  createdAt: string; updatedAt: string;
}
interface ServiceCatalogItem {   // FR-25, FR-34
  id: string; name: string; description: string;
  appliesTo: ("jewelry" | "watch")[];
  hidden: boolean; sortOrder: number;
}
```

Seed services (FR-25): Cleaning, Polishing, Resizing, Repair, Stone Setting, Restoration, Engraving,
Casting, Plating, Ultrasonic Cleaning, plus Watch Battery Replacement and Watch Strap Replacement
(owner can hide these two). Write a two-sentence plain-English description for each.

## 5. Transactions

### 5.1 Custom order request (FR-07 to FR-11)
```ts
interface DesignConfig {
  productType: ProductType; materialId: string; finishId: string;
  gemstoneId: string; cutId: string | null; stoneQuantity: number;
  sizeId: string; engravingText?: string; notes?: string;
}
interface DesignVersion {
  version: number; config: DesignConfig;
  estimate: { weightG: number; price: number };     // computed at submission time
  snapshotDataUrl?: string;                          // PNG captured from the 3D canvas
  submittedAt: string;
}
interface CustomOrderRequest {
  id: string; code: string;            // human code, e.g. "CO-2026-0007"
  customerId: string;
  source: "customizer" | "catalog" | "chatbot";      // FR-07 entry point (same record type)
  basedOnProductId?: string;
  versions: DesignVersion[];           // latest = current design; history kept for FR-10
  revisionRemarks: { at: string; text: string }[];  // FR-09
  status: CustomOrderStatus;
  quotation?: Quotation; payments: Payment[];
  createdAt: string; updatedAt: string;
}
```

### 5.2 Product order (FR-14)
```ts
interface ProductOrder {
  id: string; code: string;            // "OR-2026-0012"
  customerId: string; productId: string; productSnapshot: { name: string; price: number; photo: string };
  quantity: number; notes?: string;
  status: OrderStatus; quotation?: Quotation; payments: Payment[];
  createdAt: string; updatedAt: string;
}
```

### 5.3 Service request (FR-26 to FR-33)
```ts
interface ServiceRequest {
  id: string; code: string;            // "SR-2026-0031"
  customerId: string;
  itemType: "jewelry" | "watch";
  itemDescription: string;             // e.g. "18K gold wedding ring, loose stone"
  brandModel?: string;                 // watches
  material?: string;
  serviceIds: string[];                // one or more catalog services
  details: string;                     // condition, what is wrong, what is wanted
  photos: string[];                    // optional, up to 3
  preferredDropOffDate?: string;
  source: "form" | "chatbot";
  status: ServiceStatus; quotation?: Quotation; payments: Payment[];
  createdAt: string; updatedAt: string;
}
```

### 5.4 Quotation (FR-15, FR-16, FR-27, FR-28)
```ts
interface Quotation {
  id: string; issuedAt: string;
  finalPrice: number;                  // orders/custom orders; estimated cost for services
  downPaymentRequired: number;         // 0 if none
  expectedDate: string;                // completion or retrieval date
  procedure?: string;                  // services: proposed procedure (FR-27)
  notes?: string;
  response?: { decision: "accepted" | "declined"; at: string; reason?: string };
}
```

### 5.5 Payment (FR-17, FR-18, FR-30)
```ts
type PaymentKind = "down_payment" | "full_payment" | "balance";
type PaymentStatus = "pending_verification" | "verified" | "rejected";
interface Payment {
  id: string; kind: PaymentKind; amount: number; paidOn: string;
  referenceNumber: string;             // GCash/bank reference, or "CASH-IN-STORE" when owner records cash
  method: "gcash" | "bank_transfer" | "cash_in_store";
  proofFile?: { name: string; type: "image/jpeg" | "image/png" | "application/pdf"; sizeBytes: number; dataUrl?: string };
  recordedBy: "customer" | "owner";    // owner records cash down payments at drop-off (FR-30)
  status: PaymentStatus; rejectionReason?: string; verifiedAt?: string;
}
// balance = quotation.finalPrice − sum(verified payments). Never negative.
```

### 5.6 Notification (FR-49, FR-50)
```ts
interface Notification {
  id: string; userId: string;
  type: "revision_requested" | "quotation_issued" | "status_changed" | "ready_for_claiming"
      | "new_order" | "new_custom_request" | "new_service_request" | "payment_submitted"
      | "payment_verified" | "payment_rejected" | "cancelled_by_customer";
  title: string; body: string; link: string;
  channels: ("in_app" | "email")[];    // email is simulated in P1 (shown in a "Sent emails" demo log)
  read: boolean; createdAt: string;
}
```

## 6. Pricing formula (FR-06, NFR accuracy) — implement exactly

```
size_factor   = SizeOption.factor
density_ratio = MaterialOption.densityRatio
est_weight_g  = round2( baseWeightG × size_factor × density_ratio )                 // 0.01 g, half-up
stone_price   = GemstoneOption.basePrice × CutOption.multiplier × stoneQuantity     // 0 when gemstone = None
est_price     = round0( est_weight_g × ratePerGram + stone_price + laborFee + finish.fee )  // nearest peso, half-up
```
- Use the **rounded** weight to compute the price (this matches the owner's manual computation).
- Avoid floating-point drift: do the arithmetic in integer units (centigrams, centavos) or use a
  decimal helper, and round half-up. Put the engine in `src/lib/pricing/estimate.ts` as a pure function
  `estimate(config, options) → { weightG, price, breakdown }`.
- The breakdown (metal, stones, labor, finish) is shown in an expandable "How this estimate is
  computed" section.

### Required test cases (Vitest, using the seed values)
| # | Configuration | Weight (g) | Price (₱) |
|---|---|---|---|
| 1 | Ring, 18K Gold, Yellow, US 7, Diamond Round × 1 | 4.53 | 24,026 |
| 2 | Ring, Silver 925, Polished, US 9, Cubic Zirconia Round × 3 | 3.30 | 2,264 |
| 3 | Necklace, 14K Gold, Rose, 20 in, no stone | 8.39 | 30,187 |
| 4 | Bracelet, Stainless Steel, Black, 7.5 in, no stone | 6.59 | 1,764 |
| 5 | Pendant, 14K Gold, White, Large, Sapphire Pear × 1 | 3.15 | 12,475 |
| 6 | Earrings, Silver 925, Polished, Small, Cubic Zirconia Princess × 2 | 1.92 | 1,327 |

Add at least 14 more generated cases so the suite covers every material, finish, gemstone, cut, and
size at least once (the NFR requires ≥ 20 configurations).

## 7. Status machines (implement in `src/lib/status/`, with tests)

### 7.1 Product order (`OrderStatus`) — FR-19, FR-20, FR-22
```
pending ──owner quotes──▶ quoted ──customer accepts──▶ awaiting_payment ──payment verified──▶ confirmed
   │                         │                              (skip to confirmed if downPaymentRequired = 0)
   │                         └─customer declines─▶ declined
   ├─owner rejects─▶ rejected
confirmed ─▶ in_production (made-to-order only) ─▶ ready_for_claiming ─▶ completed
confirmed ─▶ ready_for_claiming (ready-made items)
cancelled: customer may cancel while pending | quoted | awaiting_payment (FR-22); owner may cancel any non-final state
```

### 7.2 Custom order request (`CustomOrderStatus`) — FR-07 to FR-11, FR-15, FR-22
```
submitted ─owner opens─▶ under_review
under_review ─request revision (remarks)─▶ revision_requested ─customer resubmits─▶ under_review
under_review ─approve design─▶ approved ─owner quotes─▶ quoted
under_review ─reject─▶ rejected
quoted ─accept─▶ awaiting_payment ─payment verified─▶ confirmed ─▶ in_production ─▶ ready_for_claiming ─▶ completed
quoted ─decline─▶ declined
cancelled: customer may cancel in submitted | under_review | revision_requested | approved | quoted | awaiting_payment
```

### 7.3 Service request (`ServiceStatus`) — FR-27 to FR-33
```
submitted ─owner reviews─▶ under_assessment ─owner quotes─▶ quoted
quoted ─accept─▶ awaiting_drop_off ─item dropped off (owner records down payment)─▶ received
quoted ─decline─▶ declined
received ─▶ in_progress ─▶ completed ─▶ ready_for_claiming ─balance settled─▶ claimed
under_assessment may also follow received when the item needs physical inspection; the owner can
re-issue the quotation after inspection (the customer accepts again before in_progress).
cancelled: customer may cancel before in_progress (FR-33)
```

Customer-facing labels (plain English): Submitted, Under review, Revision requested, Approved,
Quotation ready, Waiting for payment, Confirmed, In production, Waiting for drop-off, Received,
Under assessment, In progress, Completed, Ready for claiming, Claimed, Declined, Rejected, Cancelled.

Every status change appends to a `history: { status, at, by: "customer" | "owner", note? }[]` on the
record and creates the notifications in §5.6.
