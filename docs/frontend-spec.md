# AURELIUS — Front-End Specification (Phase 1)

Build every screen below so the whole system can be demonstrated end to end on mock data. Read
`requirements.md` and `data-model.md` first. FR numbers show which requirement each screen satisfies.

---

## 1. Design system

**Feel:** a trusted neighborhood jeweler — warm, clean, quietly premium. Not flashy, not "luxury
brand" cold. Photos and the 3D piece are the heroes; the interface stays calm.

| Token | Value | Use |
|---|---|---|
| `ivory` | `#FAF7F2` | page background |
| `paper` | `#FFFFFF` | cards, panels |
| `ink` | `#1C1B19` | main text |
| `muted` | `#6B665E` | secondary text |
| `line` | `#E7E1D7` | borders, dividers |
| `gold` | `#B08D57` | brand accent, highlights, active states (not for body text on ivory) |
| `gold-dark` | `#8A6A3B` | links, accent text (meets contrast) |
| `emerald` | `#1F3B33` | primary buttons, owner sidebar |
| `success` | `#2E7D4F` · `warning` `#B7791F` · `danger` `#B42318` · `info` `#2B5C8A` | statuses |

- **Type:** headings in Cormorant Garamond (600), body and UI in Inter, via `next/font`. Base 16 px,
  line-height 1.6. Prices in tabular numbers.
- **Shape:** radius 12 px on cards, 10 px on inputs/buttons; soft shadow only on raised panels.
- **Buttons:** primary = emerald fill/ivory text; secondary = outline ink; tertiary = text link gold-dark.
- **Status badges:** one `StatusBadge` component maps every status to a label + color (see §6).
- **Motion:** subtle (150–200 ms). Respect `prefers-reduced-motion` (also stop auto-rotate in 3D).
- **Accessibility:** WCAG AA contrast, visible focus rings (gold-dark 2 px), labels on all inputs,
  `aria-live` for estimate changes and form errors, all actions keyboard reachable.
- **Logo:** text wordmark "AURELIUS" in Cormorant with letter-spacing 0.2em + a small ring glyph (SVG).
  Subline "by Afable's Jewelry Store".

---

## 2. Global layout

### Public / customer shell
- **Header:** logo · Shop · Customize · Services · (signed in) My Account · notification bell with
  unread count · user menu (Profile, My Account, Log out) · (guest) Log in / Register.
  Collapses to a menu sheet under 768 px.
- **Footer:** store address (Montalban Public Market, Rodriguez, Rizal), contact number, opening
  hours, "Items are claimed and balances settled in the store.", Privacy Notice link.
- **Chatbot launcher:** floating button bottom-right on every customer page (§5.9).
- **Demo Mode bar** (Phase 1 only, thin bar at the very top, can be collapsed): "Demo mode — viewing
  as: [Guest | Customer: Maria Santos | Owner]" · "Simulated emails (n)" · "Reset demo data".
  Switching role swaps the mock session instantly.

### Owner shell (`/admin`)
- Left sidebar (emerald): Dashboard · Custom Requests · Orders · Service Requests · Payments ·
  Products · Service Catalog · Customization & Rates · Customers · Chatbot Knowledge · Settings.
  Badge counts on items needing action. Collapses to a top bar + drawer on mobile.
- Top bar: page title, notification bell (FR-50), "View store" link, owner menu.

### Route guards (Phase 1 mock, Phase 2 real)
- `/account/*`, checkout and submit actions → must be signed in (redirect to `/login?next=…`).
- Submitting orders/requests → must have `emailVerified` (FR-41); otherwise show a banner with
  "Resend verification email" (simulated).
- `/admin/*` → owner role only; customers see a 403 page "This page is for the store owner."

---

## 3. Routes

| Route | Page | FR |
|---|---|---|
| `/` | Home | — |
| `/shop` | Product catalog | FR-12, FR-13 |
| `/shop/[slug]` | Product detail + order | FR-12–FR-14, FR-07 |
| `/customize` | 3D design customizer (`?type=ring`, `?draft=<id>`, `?request=<id>` for revisions) | FR-01–FR-07, FR-10 |
| `/services` | Service catalog | FR-25 |
| `/services/request` | Service request form (`?service=<id>`, `?draft=<id>`) | FR-26 |
| `/account` | Customer dashboard (tabs) | FR-19, FR-23, FR-31 |
| `/account/orders/[id]` | Product order detail | FR-16, FR-17, FR-19, FR-22 |
| `/account/custom/[id]` | Custom order detail | FR-10, FR-16, FR-17, FR-22 |
| `/account/services/[id]` | Service request detail | FR-28, FR-31, FR-33 |
| `/account/notifications` | All notifications | FR-49 |
| `/account/profile` | Profile and password | FR-44 |
| `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` | Auth screens | FR-41–FR-43, FR-45 |
| `/privacy` | Data privacy notice | FR-45 |
| `/admin` | Owner dashboard | FR-46, FR-50 |
| `/admin/custom-requests` + `/[id]` | Review, revise, approve, reject, quote | FR-08, FR-09, FR-11, FR-15 |
| `/admin/orders` + `/[id]` | Quote, verify payments, update status | FR-15, FR-18, FR-20, FR-21 |
| `/admin/service-requests` + `/[id]` | Assess, quote, drop-off, progress | FR-27, FR-29, FR-30, FR-32 |
| `/admin/payments` | All payments; verify/reject queue | FR-18, FR-21 |
| `/admin/products` + `/new` + `/[id]` | Product CRUD | FR-24 |
| `/admin/service-catalog` | Service catalog CRUD | FR-34 |
| `/admin/customization` | Options and rates + live formula preview | FR-47 |
| `/admin/customers` + `/[id]` | Customer list + transaction history | FR-48 |
| `/admin/chatbot` | Chatbot knowledge base (FAQs, store policies) | FR-38 (content) |
| `/admin/settings` | Store info, payment instructions | FR-46 |
| `not-found`, `error`, `403` | Friendly error pages | — |

---

## 4. Shared components (build once, reuse everywhere)
`StatusBadge` · `StatusTimeline` (vertical steps with dates and notes, current step highlighted,
future steps greyed) · `MoneyText` · `DateText` · `EstimateNotice` ("Estimate only — final price is
confirmed by the owner.") · `QuotationCard` (shows final price, down payment, expected date,
procedure, notes; Accept / Decline with a confirm dialog and optional decline reason) ·
`PaymentSummary` (final price, verified paid, pending, balance) · `PaymentForm` (amount, date paid,
method, reference number, proof upload JPG/PNG/PDF ≤ 5 MB with preview; errors in plain English) ·
`PaymentList` (status chips; rejection reason visible) · `FileDropzone` · `EmptyState` ·
`ConfirmDialog` · `PageHeader` · `DataTable` (sortable, searchable, paginated, responsive cards on
mobile) · `FilterBar` · `NotificationBell` + `NotificationList` · `CodeChip` (CO-/OR-/SR- codes,
copyable) · `ProductCard` · `ServiceCard` · `JewelryViewer` (§5.3) · `DesignSpecList`.

---

## 5. Pages

### 5.1 Home `/`
1. Hero: headline "Jewelry made the way you imagine it." Sub: "Design your piece in 3D, order from
   our collection, or book a repair — all from Afable's Jewelry Store in Montalban." Buttons:
   **Design your piece** (`/customize`) · Shop the collection · Book a service.
   Right side: a live, slowly rotating `JewelryViewer` ring (falls back to an illustration without WebGL).
2. Three cards: Design in 3D · Shop ready-made · Repairs & services.
3. "How custom orders work": 4 steps — Design → Owner reviews and confirms the price → Pay the down
   payment → Claim in store.
4. Featured products (4) and popular services (4).
5. Store info block with hours, address, and "Ask our assistant" button that opens the chatbot.

### 5.2 Catalog `/shop` (FR-12, FR-13)
- Filters: category (product type), material, availability, price range; search by name; sort
  (newest, price low–high, high–low). Filters sync to the URL query.
- Grid of `ProductCard`: photo, name, material, price, availability badge
  (Available = success, Made to order = info, Unavailable = muted). Hidden products never appear.
- Banner card in the grid: "Can't find it? Design your own" → `/customize`.

### 5.3 Product detail `/shop/[slug]` (FR-12–FR-14, FR-07)
- Gallery (photos), name, price, material, category, description, availability badge.
- **Available:** quantity (1–5), notes, **Place order** → confirm dialog summarizing item, price,
  "Claim in store at Montalban Public Market", → creates a `ProductOrder` (status `pending`), shows a
  success page with the order code and next steps, notifies the owner (FR-50).
- **Made to order:** same order button labeled **Request this piece** plus **Customize this design**
  which opens `/customize?type=<category>&from=<productId>`. Either path creates a
  `CustomOrderRequest` with `source: "catalog"` and `basedOnProductId` (FR-07: same record type as
  the customizer).
- **Unavailable:** order buttons disabled with text "This item is currently unavailable." and a
  "Design something similar" link (FR-13).

### 5.4 3D Customizer `/customize` (FR-01–FR-07, FR-10) — the showcase screen
Layout: desktop = viewer left (60%), options panel right (40%, scrollable), sticky estimate bar at
the bottom of the panel. Mobile = viewer on top (45vh), options in an accordion below, estimate bar
fixed to the bottom of the screen.

**Options panel** (only active options from the store's settings; FR-47):
1. Piece type: Ring · Pendant · Necklace · Bracelet · Earrings (segmented control with icons).
2. Material (FR-01): radio cards showing name (no internal rates shown).
3. Color / finish (FR-02): swatches limited to the selected material's allowed finishes; if the
   current finish becomes invalid after a material change, pick that material's first finish and
   show a small notice.
4. Gemstone (FR-03): type swatches (None first) → cut (Round, Oval, Princess, Pear; hidden when None)
   → quantity stepper 1…maxStones for the piece type (hidden when None or maxStones = 0; for necklace
   and bracelet show "Gemstones are not available for this piece").
5. Size (FR-04): chips for the type's sizes, with a "How to measure" popover (ring: inner
   circumference; necklace/bracelet: length).
6. Optional engraving text (max 20 characters) and notes for the owner (max 500 characters).

**Viewer** (`components/customization/JewelryViewer.tsx`, FR-05):
- React Three Fiber canvas, `OrbitControls` (rotate + zoom, limited), gentle auto-rotate that stops
  on interaction, "Reset view" button, fullscreen toggle.
- **Procedural models** (no external files needed in Phase 1), one component per type:
  ring = torus band (tube thickness scales with size factor) + a prong head holding the stone(s) on
  top, multiple stones placed along the band front; pendant = stone in a bezel + a small bail loop;
  necklace = a chain made of instanced small torus links along a U-shaped curve with a clasp;
  bracelet = a wider flat torus band (or link chain); earrings = two stud settings side by side.
- Stone geometry per cut: round = brilliant-like (cone pavilion + faceted crown via low-poly
  cylinder/cone), oval = scaled round, princess = square pyramid shape, pear = round + tapered side.
- Metal: `MeshPhysicalMaterial` metalness 1, color + roughness from the finish. Gem:
  `MeshPhysicalMaterial` with transmission 1, ior from the gemstone, color from the gemstone,
  thickness ~0.5, slight dispersion-like sparkle via environment reflections.
- Lighting: drei `<Environment>` built from `<Lightformer>`s (no network download), soft contact
  shadow under the piece, neutral warm background.
- Every option change updates the model immediately (target < 300 ms; NFR ≤ 3 s).
- Architecture for later GLB models: `ProductTypeOption.modelUrl` → if present, load with `useGLTF`
  and apply materials to meshes named `metal` and `stone*`; else use the procedural component.
- **No WebGL** (detect before mounting the canvas): show a card "3D preview isn't supported on this
  device or browser. You can still choose your options and submit your design." with a static
  illustration; options and estimate keep working (NFR compatibility).
- `captureSnapshot()` returns a PNG data URL of the current view (canvas `preserveDrawingBuffer`),
  saved with each submitted design version.

**Estimate bar** (FR-06): "Estimated weight 4.53 g · Estimated price ₱24,026" + `EstimateNotice` +
expandable breakdown (metal, stones, labor, finish). Announce changes with `aria-live="polite"`.

**Submit** (FR-07): **Submit for owner review** → if guest, prompt login/register and keep the design
(persist the in-progress config in the store); if not verified, show the verification banner. Then a
review dialog: snapshot, spec list, estimate, notes, checkbox "I understand the final price and
completion date will be confirmed by the owner." → creates `CustomOrderRequest` (status `submitted`,
version 1) → success page with code CO-…, timeline of next steps, link to the request.

**Revision mode** (`?request=<id>`, FR-10): load the latest version's config, show the owner's
remarks in a highlighted panel at the top, button **Resubmit for review** creates version n+1 and
moves status back to `under_review`. Show "Version 2 of your design" and a link to compare with the
previous version (side-by-side snapshots + changed fields).

**Draft mode** (`?draft=<id>`): config pre-filled from a chatbot draft with a notice "Your assistant
filled this in. Review and change anything before submitting." (FR-36)

### 5.5 Services `/services` and `/services/request` (FR-25, FR-26)
- Catalog: cards for each non-hidden service with icon, name, description, "For jewelry / watches"
  tags, and **Request this service**. Note: "Prices depend on the item. The owner inspects your item
  and sends a quotation."
- Request form (react-hook-form + zod): item type (Jewelry / Watch) → item description (required,
  10–300 chars) → brand/model (watch only) → material (optional) → services needed (multi-select of
  catalog items, at least one, preselected from `?service=`) → details of the problem or request
  (required, 10–1000 chars) → up to 3 photos (JPG/PNG ≤ 5 MB each, optional) → preferred drop-off date
  (today or later, optional) → review step → submit → creates `ServiceRequest` (status `submitted`),
  success page with SR-code, what happens next ("The owner reviews your request and sends a
  quotation. Bring your item to the store when you accept it."). Draft mode via `?draft=`.

### 5.6 Customer account `/account` (FR-19, FR-23, FR-31, FR-49)
- Summary row: active items needing action (quotations to answer, payments rejected, ready for
  claiming) as action cards.
- Tabs: **Orders** · **Custom designs** · **Service requests** · **Payments** · **Notifications**.
  Each tab = list with code, item, date, status badge, amount/balance, link to detail; filter by
  status; empty states with a call to action.
- Detail pages (`/account/orders/[id]`, `/account/custom/[id]`, `/account/services/[id]`) share a
  layout:
  - Header: code, created date, `StatusBadge`, primary next action button.
  - `StatusTimeline` from the record's history (FR-19, FR-31).
  - Item section: product snapshot / design snapshot + `DesignSpecList` + version history /
    service item details and photos.
  - Custom only: owner remarks panel with **Edit design and resubmit** when `revision_requested` (FR-10).
  - `QuotationCard` with Accept / Decline when status is `quoted` (FR-16, FR-28).
  - Payments: `PaymentSummary` + `PaymentList` + **Submit payment** (`PaymentForm`) when payment is
    due; show the store's payment instructions above the form (FR-17).
  - **Cancel** button only in the cancellable statuses from `data-model.md` §7, with confirm dialog;
    otherwise text "To cancel at this stage, please contact the store." (FR-22, FR-33).
  - Ready for claiming: highlighted card "Your item is ready. Visit the store to claim it and settle
    any balance of ₱X."

### 5.7 Profile `/account/profile` (FR-44)
Edit full name and contact number (email shown read-only with "Change email" disabled note in P1);
change password form (current, new ≥ 8 chars with strength hint, confirm). Success toasts.

### 5.8 Auth screens (FR-41–FR-43, FR-45)
- **Register:** full name, email, contact number (PH format validation), password (≥ 8) + confirm,
  privacy notice summary in a scroll box with a link to `/privacy`, required checkbox "I have read the
  Privacy Notice and agree to the collection and use of my personal data for my orders and requests."
  Submit disabled until checked. → `/verify-email` ("We sent a confirmation link to …"). In Phase 1 the
  email appears in the Demo bar's "Simulated emails" panel with a **Verify** link.
- **Login:** email, password, "Forgot password?" link, error text for wrong credentials and the
  lockout message "Too many failed attempts. Please wait 15 minutes and try again." (simulated after
  5 failures in P1). Demo accounts listed in demo mode: customer `maria@demo.ph`, owner
  `owner@afables.ph`, any password ≥ 8 chars.
- **Forgot / reset password:** email form → simulated link → new password form; message that links
  expire in 1 hour.
- **Privacy page:** plain-English notice: what data (name, email, contact number, order and request
  details, payment proofs), why, who sees it (you and the store owner only), how long it is kept, your
  rights under RA 10173, and contact details.

### 5.9 Chatbot widget (FR-35–FR-40) — `components/chatbot/`
- Floating button → panel (380 × 560 desktop; full-screen sheet on mobile). Header "AURELIUS
  Assistant" + subtitle "Answers about our products and services. The owner confirms all prices and
  dates." Close and "Start over" buttons.
- Welcome message + quick-reply chips: **Design a custom piece** · **Request a repair or service** ·
  **Ask about products** · **Store hours and location**.
- Messages: bubbles, typing indicator, timestamps, links rendered as buttons, quick replies.
- **Draft card** (FR-36/37): when a draft is ready, show a card summarizing the collected details with
  **Review and edit draft** (opens `/customize?draft=` or `/services/request?draft=`) and **Start over**.
  The bot never submits; the customer submits on the page.
- **Mock engine** (`lib/chatbot/mockEngine.ts`) implementing the same interface Phase 2 uses:
  ```ts
  interface ChatTurn { role: "user" | "assistant"; content: string }
  interface ChatResult {
    reply: string; quickReplies?: string[];
    draft?: { kind: "custom_order"; config: Partial<DesignConfig>; notes?: string }
         | { kind: "service_request"; fields: Partial<ServiceRequest> };
    referToOwner?: boolean;
  }
  sendMessage(history: ChatTurn[], context: { isSignedIn: boolean }): Promise<ChatResult>
  ```
  Scripted flows: custom order (piece type → material → finish → gemstone/cut/quantity → size →
  notes → draft), service request (jewelry or watch → item description → service needed → problem
  details → draft), FAQ answers from the Chatbot Knowledge entries (keyword match), and a fallback for
  anything else: "I can only help with our products, custom orders, and services. For this, please
  contact the owner at <number> or visit the store." (`referToOwner: true`, FR-39).
- Guardrail copy (FR-40): whenever price or dates come up, the bot says the estimate in the
  customizer is not final and the owner confirms the final price and completion date in a quotation.
- Simulated delay 400–900 ms. Persist the conversation per session.

### 5.10 Owner dashboard `/admin` (FR-46, FR-50)
- Action cards with counts linking to filtered lists: Custom requests to review · Orders to quote ·
  Service requests to assess · Payments to verify · Items ready for claiming.
- Recent activity feed (latest notifications). Quick links: Add product, Edit rates.
- Small stats: requests this month by type, open balances total.

### 5.11 Owner — Custom requests `/admin/custom-requests` (FR-08, FR-09, FR-11, FR-15)
- List: code, customer, piece type, submitted date, version, estimate, status; filters by status.
- Detail: customer card (name, contact, email) · design snapshot + read-only 3D viewer of the current
  version · `DesignSpecList` · estimate with breakdown · version history with diffs · remarks history.
- Actions by status:
  - `submitted`/`under_review`: **Approve design** (FR-11) · **Request revision** (dialog with
    required remarks, min 10 chars; FR-09) · **Reject** (dialog with required reason).
  - `approved`: **Issue quotation** form — final price (prefilled with the estimate, editable),
    down payment required (₱ or %), expected completion date, notes (FR-15).
  - Later states: payment verification panel and status update control (next allowed statuses only).
- Opening a `submitted` request moves it to `under_review` automatically.

### 5.12 Owner — Orders `/admin/orders` (FR-15, FR-18, FR-20, FR-21)
- List + filters (status, date range, search by code or customer). Detail: product snapshot,
  customer, quantity, notes; **Issue quotation** (for ready-made items prefill catalog price, down
  payment may be 0, expected ready date); payments panel with **Verify** / **Reject** (reason
  required) per pending payment and **Record cash payment**; balance; status control limited to
  allowed transitions with optional note; history timeline.

### 5.13 Owner — Service requests `/admin/service-requests` (FR-27, FR-29, FR-30, FR-32)
- List + filters. Detail: item details and photos, services requested, customer.
- **Issue service quotation**: estimated cost, proposed procedure (required), expected completion or
  retrieval date, down payment required, notes (FR-27). Can re-issue after physical inspection.
- **Record drop-off**: date received + down payment collected (cash or e-wallet with reference) →
  creates a verified owner-recorded payment; shows remaining balance to settle on claiming (FR-30).
- Status control: received → under assessment → in progress → completed → ready for claiming →
  claimed (FR-29). Marking **Ready for claiming** notifies the customer (FR-49). **Mark as claimed**
  requires the balance to be zero or a "balance settled in store" cash payment recorded.

### 5.14 Owner — Payments `/admin/payments` (FR-18, FR-21)
Queue of `pending_verification` payments across all record types: code, customer, kind, amount,
reference, proof preview (image lightbox / PDF icon) → Verify / Reject. Tab for all payments with
filters and totals.

### 5.15 Owner — Products `/admin/products` (FR-24)
Table: photo, name, category, material, price, availability, visibility; search/filter. Form: name,
slug (auto), category, material, price, description, photos (upload ≤ 5, reorder, remove; stored as
data URLs in P1), availability select, hidden toggle. Actions: Edit, Hide/Show, Remove (confirm;
if the product has orders, offer Hide instead).

### 5.16 Owner — Service catalog `/admin/service-catalog` (FR-34)
List with drag or up/down ordering, add/edit (name, description, applies to jewelry/watch), hide/show.

### 5.17 Owner — Customization & rates `/admin/customization` (FR-47)
Tabs: Piece types · Materials · Finishes · Gemstones · Cuts · Sizes. Each = editable table (add,
edit inline, activate/deactivate; no hard delete of options used in existing requests). Materials
tab also picks allowed finishes. Validation: rates and fees ≥ 0, factors > 0, at least one active
option per category and one default size per piece type.
**Formula preview panel:** pick a sample configuration → shows each step of the formula with the
current rates and the resulting estimate, so the owner can check it against their manual computation.
Changes apply to new estimates only; submitted requests keep the estimate they were submitted with.

### 5.18 Owner — Customers `/admin/customers` (FR-48)
List: name, email, contact, verified, registered date, number of transactions, open balance.
Detail: profile + combined transaction history (orders, custom requests, service requests,
quotations, payments) in one timeline with filters.

### 5.19 Owner — Chatbot knowledge `/admin/chatbot`
CRUD of FAQ entries (question, answer, keywords, active) + store policies text. Used by the mock bot
now and as the grounding knowledge for the Gemini API in Phase 2. Seed 12 FAQs: store hours,
location, payment methods, down payment policy, claiming policy, how custom orders work, how long
custom orders take (answer: "the owner gives the expected date in the quotation"), services offered,
watch battery replacement, cleaning frequency, gemstone options, cancellation policy.

### 5.20 Owner — Settings `/admin/settings` (FR-46)
Store info (name, address, contact, email, hours), payment instructions (GCash name/number, bank
details), claiming note. Phase 2 adds password change and session settings.

---

## 6. Status badge map
| Status | Customer label | Color |
|---|---|---|
| pending / submitted | Submitted | info |
| under_review / under_assessment | Under review / Under assessment | info |
| revision_requested | Revision requested | warning |
| approved | Design approved | success |
| quoted | Quotation ready | warning (action needed) |
| awaiting_payment | Waiting for payment | warning |
| awaiting_drop_off | Waiting for drop-off | warning |
| confirmed | Confirmed | success |
| received | Item received | info |
| in_production / in_progress | In production / In progress | info |
| completed | Completed | success |
| ready_for_claiming | Ready for claiming | success (highlighted) |
| claimed | Claimed | muted |
| declined / rejected / cancelled | Declined / Rejected / Cancelled | danger / muted |

---

## 7. Notifications (FR-49, FR-50)
Create in-app notifications on: new order, custom request, service request, payment submitted →
owner; revision requested, quotation issued, status changed, payment verified/rejected, ready for
claiming → customer; customer cancellation → owner. Customer events also add an entry to the demo
"Simulated emails" log (subject + body) to show the email channel. Bell shows unread count; dropdown
shows the latest 8 with "Mark all as read" and "View all".

---

## 8. Mock data layer (`src/lib/data/`)
- `repositories.ts`: interfaces — `AuthRepo`, `CatalogRepo`, `CustomizationRepo`, `OrderRepo`,
  `CustomOrderRepo`, `ServiceRepo`, `PaymentRepo`, `NotificationRepo`, `SettingsRepo`,
  `KnowledgeRepo`, `CustomerRepo`. All methods async (return Promises) so Phase 2 can swap in Supabase.
- `mock/`: implementations on a zustand store persisted to localStorage (key `aurelius-demo-v1`),
  with a simulated 200–400 ms latency and the ability to simulate an error (for error-state testing).
- `seed.ts`: store settings; options and rates from `data-model.md` §3; 12 products across all
  categories and availabilities (use names like "Classic Solitaire Ring", "Sampaguita Pendant",
  "Rope Chain Necklace"); 12 services; 12 FAQs; owner account; 3 customers; and sample transactions
  covering **every status** of each status machine so all screens can be demonstrated immediately
  (e.g., one custom request in `revision_requested` with remarks, one order `quoted`, one service
  `ready_for_claiming` with a balance, one payment `pending_verification` with a proof image).
- Codes: `CO-`, `OR-`, `SR-` + year + 4-digit sequence.
- Submissions are idempotent: the submit handler disables the button, uses a client-generated
  request ID, and ignores repeats (NFR transaction integrity).
- Placeholder images: generate simple, elegant SVG placeholders per category in
  `public/placeholders/` (no external URLs).

---

## 9. Acceptance checklist (Phase 1 is done when all pass)
- [ ] `npm run build`, `npm run lint`, `npm test` pass with no errors.
- [ ] Pricing tests: the 6 required cases + ≥ 14 more pass (data-model.md §6).
- [ ] Status machine tests: every allowed transition passes; disallowed transitions throw.
- [ ] Customer can: register (consent required) → verify (simulated) → customize a ring in 3D →
      submit → see it in My Account.
- [ ] Owner can: request a revision with remarks → customer sees remarks, edits in 3D, resubmits
      version 2 → owner approves → issues quotation → customer accepts → submits down payment with
      proof → owner verifies → owner moves to In production → Ready for claiming → Completed.
- [ ] Customer can order an available product; cannot order an unavailable one; made-to-order creates
      a custom request.
- [ ] Customer can submit a service request (form and chatbot draft) → owner assesses, quotes →
      customer accepts → owner records drop-off with down payment → progress → ready for claiming →
      claimed after balance settled.
- [ ] Cancellation buttons appear only in allowed statuses (FR-22, FR-33).
- [ ] Owner can add/edit/hide/remove products and services, and edit options/rates; the customizer
      and estimates reflect changes immediately.
- [ ] Notifications appear for every event in §7, for the right user.
- [ ] Chatbot: both guided flows produce drafts that open pre-filled pages; out-of-scope questions are
      referred to the owner; it never states a final price or date.
- [ ] Customer cannot open `/admin/*`; guests are redirected to login on protected pages.
- [ ] Every page works at 360 px wide; no horizontal scrolling.
- [ ] With WebGL disabled, the customizer shows the fallback message and still submits.
- [ ] All lists have loading, empty, and error states; all forms show plain-English errors.
- [ ] Lighthouse (desktop) performance ≥ 85 on `/`, `/shop`, `/services`; 3D viewer first render ≤ 5 s.
