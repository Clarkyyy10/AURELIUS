# UI Screens

Screen inventory for the public visitor, the customer and the owner. Each screen lists the functional requirements it serves (FR-01 to FR-50, see [01-requirements.md](01-requirements.md)), its loading, empty, error and permission-denied states, and the status vocabulary it shows. The visual rules are in [DESIGN.md](../DESIGN.md). The components used here are in [12-ui-components.md](12-ui-components.md).

Status here means the lifecycles in [04-flowcharts.md](04-flowcharts.md) and the decisions N6, N11, N15, N85 and N87 in the [change notes](manuscript/aurelius-change-notes.md). Status badges have no color; every status has a label, icon, border and weight treatment ([DESIGN.md section 11](../DESIGN.md#11-status-and-validation-without-color)).

## 1. Conventions

- **Name.** Every page title, header, email heading and error page shows "Afable's Jewelry Store" only. Page title pattern: `<Page name> | Afable's Jewelry Store`.
- **Language.** The interface is English. The chatbot accepts English, Filipino and Taglish and replies in the customer's language (FR-35, N39).
- **Routes are proposals.** The paths below are working names for the fixture-data build. They are not decided (see [open points](#7-open-points)).
- **Fixture data.** The first build uses fixture data. Loading and error states are still built, so the real data layer can replace the fixtures without UI changes.
- **Walk-in profiles.** Customers created by the owner without an account have no sign-in, no tracking page and no email (N30, N32). They appear only on owner screens.
- **IDs.** `PUB` is public, `SHR` is shared by visitor and customer, `CUS` is customer, `OWN` is owner.

## 2. Shared state patterns

Each screen below names its own states. These patterns are what the names refer to, so the screens stay short.

| State                                   | Pattern                                                                                                                                                                                                                     |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading                                 | Skeleton blocks in the layout of the loaded content, plus a visually hidden "Loading" status. Pages do not shift when content arrives. Buttons that submit show a text label ("Saving...") and are disabled.                |
| Empty                                   | A heading that says what is missing, one sentence on why, and one action that fixes it. No decorative illustration.                                                                                                         |
| Error (load)                            | An inline alert in place of the content: what failed in plain English, what to do, and a "Try again" button. The page frame stays usable.                                                                                   |
| Error (submit)                          | Error summary at the top of the form with links to each field, and an inline message on each field. Nothing the user typed is cleared. An interrupted submission is saved completely or not at all (Reliability NFR).       |
| Permission denied, signed out           | Redirect to sign-in with the page to return to. The message says "Sign in to continue." (Security NFR: protected pages redirect to login.)                                                                                  |
| Permission denied, wrong role or record | Page "You do not have access to this page" with a link to the user's home. A customer who opens another customer's record sees the same page as for a missing record, so the system does not reveal that the record exists. |
| Session expired                         | After 30 minutes idle the next action opens sign-in with a message "Your session ended. Sign in to continue." and returns to the page. Open point for the owner (N68).                                                      |

## 3. Status vocabularies

Screens refer to these by code. Labels are the words shown to the user.

| Code | Used for                     | Labels (in order)                                                                                                                                                                                                                  | Source                            |
| ---- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| V-CO | Custom order (viewer design) | Draft, Submitted, Under review, Design approved, Quotation issued, Quotation accepted, Down payment verified, In production, Ready for claiming, Claimed. Branches: Rejected (with reason), Declined, Unclaimed.                   | 04-flowcharts; N6, N11, N85, N87  |
| V-SR | Service request              | Submitted, Received, Under assessment, Quotation issued, Quotation accepted, Down payment verified, In progress, Completed, Ready for claiming, Claimed. Branches: Quotation declined, "Declined, item to be returned", Unclaimed. | 04-flowcharts; N15, N16, N85, N87 |
| V-RM | Ready-made order             | Placed, Confirmed, Payment submitted, Payment verified, Ready for claiming, Claimed. Branches: Cancelled, Expired. Provisional until N45 is settled.                                                                               | 04-flowcharts; N45 (open)         |
| V-PP | Payment proof                | Pending verification, Verified, Rejected (with reason)                                                                                                                                                                             | N21                               |
| V-QT | Quotation                    | Issued (awaiting reply), Accepted, Declined, Expired (with date)                                                                                                                                                                   | N82; 04-flowcharts                |
| V-AV | Product availability         | Available, Made to order, Unavailable                                                                                                                                                                                              | FR-13                             |
| V-CX | Cancellation outcome         | Requested, Cancelled, Refunded in full, Refunded in part (with reason), Retained (with reason)                                                                                                                                     | N25, N26; 04-flowcharts           |
| V-RS | Reservation                  | Reserved until `<date>`, Expiring soon, Expired                                                                                                                                                                                    | N45, N47                          |

Rules that apply to every screen showing a status:

- A status change is announced once in a polite live region and is not announced on first render.
- Rejected and Declined states show the reason or the next step next to the label.
- The final price appears only on the quotation. Orders and drafts show "Estimate" with the estimate label (N6, FR-06, FR-40).
- Preliminary service estimate ranges, if the owner gives one, are labeled "Estimate, not a quotation" (N16).
- Claimed releases need a recorded release (recipient, date, balance paid), see OWN-08 (N86).

## 4. Public and shared screens

### PUB-01 Home

- **Route:** `/`. **FRs:** FR-12, FR-25 (entry points), FR-35 (chatbot launcher).
- **Purpose:** Introduce the store, link to the catalog, the ring viewer, services and the chatbot.
- **Loading:** Skeleton for featured products. The static text renders at once.
- **Empty:** If no products are published, the featured area is hidden and the page shows the viewer and services links only.
- **Error:** Featured products fail to load: inline alert in that block only. The rest of the page works.
- **Permission denied:** None. Public.
- **Status vocabulary:** V-AV on featured product cards.

### PUB-02 Product catalog

- **Route:** `/shop`. **FRs:** FR-12, FR-13.
- **Purpose:** Browse products with photo, description, material and price. Filter by material and availability.
- **Loading:** Grid of product-card skeletons (same card size).
- **Empty:** "No products yet" when the store has none. "No products match these filters" with a "Clear filters" action when filters exclude all.
- **Error:** Inline alert with "Try again". Filters stay set.
- **Permission denied:** None. Public. Archived and hidden products never appear (N81).
- **Status vocabulary:** V-AV on each card. Unavailable cards cannot start an order (FR-13).

### PUB-03 Product detail

- **Route:** `/shop/[slug]`. **FRs:** FR-12, FR-13, FR-14 (entry), FR-38 (ask the chatbot).
- **Purpose:** Photos, description, material, price, availability, and the action to order.
- **Loading:** Skeleton for the gallery and details.
- **Empty:** Product has no photo: grey plate with the text "Photo coming soon". Never an empty box.
- **Error:** Unknown or archived product: "This product is not available" with a link to the catalog. Load failure: inline alert with "Try again".
- **Permission denied:** Visitors can view. The "Order" action opens sign-in with return to this page. Unavailable products show the action disabled with the reason "This product is unavailable."
- **Status vocabulary:** V-AV.

### PUB-04 Ring viewer

- **Route:** `/design`. **FRs:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07 (entry), FR-36 (opens a chatbot draft).
- **Purpose:** Pick ring style (plain band, solitaire, side stones), metal, color or finish, stones and ring size. The 3D scene updates with each change. An itemized estimate of weight and price shows beside it, labeled as an estimate. Rings only in version 1 (N96).
- **Loading:** Skeleton for the scene frame and the option panel. Options appear first, so they work before the scene finishes rendering. Target: first render within 5 seconds (Performance NFR, N2).
- **Empty:** The owner has configured no options for a group (for example no gemstones): the group shows "No options available right now" and the estimate leaves it out. If no ring options exist at all, the screen shows "The ring designer is not available yet" and links to the catalog and the chatbot.
- **Error:** WebGL not available or scene fails: a message replaces the scene ("Your browser cannot show the 3D view. You can still choose options and see the estimate."). Option pickers and the estimate keep working (Compatibility NFR). Estimate fails to compute: inline alert, and Save and Submit are disabled with the reason.
- **Permission denied:** Visitors can explore (open point, see section 7). Save draft and Submit open sign-in and keep the chosen options. An unverified email address blocks Submit with "Verify your email address to submit" and a "Resend email" action (FR-41).
- **Status vocabulary:** V-CO shows Draft only. A reopened draft whose estimate changed shows a notice "The estimate changed since you saved this design" (N80).

### PUB-05 Service catalog

- **Route:** `/services`. **FRs:** FR-25, FR-26 (entry), FR-37 (chatbot help).
- **Purpose:** List services (cleaning, polishing, resizing, repair, stone setting, restoration, engraving, casting, plating, ultrasonic cleaning) with descriptions and the "Request this service" action.
- **Loading:** List-row skeletons.
- **Empty:** "No services are listed yet. Ask the store directly." with a link to Store Information.
- **Error:** Inline alert with "Try again".
- **Permission denied:** Public. "Request this service" opens sign-in with return.
- **Status vocabulary:** None.

### PUB-06 Store information and FAQ

- **Route:** `/store`. **FRs:** FR-47 (content set by the owner), FR-38 (same content grounds the chatbot).
- **Purpose:** Address, hours, payment account details, refund policy, unclaimed-item policy, quotation validity, and the FAQ.
- **Loading:** Text skeletons by section.
- **Empty:** A section the owner has not filled in shows "The store has not published this yet. Ask the store directly."
- **Error:** Inline alert with "Try again".
- **Permission denied:** None. Public. Payment account details are shown to signed-in customers on the quotation (CUS-07); showing them here as well is an open point.
- **Status vocabulary:** None.

### PUB-07 Register

- **Route:** `/register`. **FRs:** FR-41, FR-45.
- **Purpose:** Create an account with name, email, contact number and password (minimum 8 characters). The privacy notice is shown here, and a consent control is required before data is collected.
- **Loading:** Submit button shows "Creating account..." and is disabled.
- **Empty:** Not applicable (a form).
- **Error:** Field errors with fix instructions ("Error: Enter a mobile number with 11 digits, like 09171234567."). Email already registered: "An account with this email address already exists. Sign in or reset your password." The consent control unchecked: "Error: Agree to the privacy notice to create an account."
- **Permission denied:** Signed-in users who open this page go to their account. Registration never creates an owner (N67).
- **Status vocabulary:** None. After submit the page says the email is not verified yet.

### PUB-08 Email verification

- **Route:** `/verify-email`. **FRs:** FR-41.
- **Purpose:** Confirm the email address through the link, or ask for a new link.
- **Loading:** "Checking your link..." status.
- **Empty:** Not applicable.
- **Error:** Link expired or already used: "This link no longer works." with a "Send a new link" action. Link malformed: same message.
- **Permission denied:** None. A signed-out user who verifies is sent to sign-in.
- **Status vocabulary:** Email "Verified" or "Not verified" shown as text with icon, not as an order status.

### PUB-09 Sign in

- **Route:** `/sign-in`. **FRs:** FR-42.
- **Purpose:** Customer sign-in. Pasting and password managers are allowed. No cognitive test (WCAG 3.3.8).
- **Loading:** Submit button shows "Signing in...".
- **Empty:** Not applicable.
- **Error:** Wrong email or password: "Error: The email or password is not correct. Check both and try again." Locked after 5 failed attempts for 15 minutes: "Too many attempts. Try again in 15 minutes or reset your password." Email not verified: "Verify your email address first." with "Resend email".
- **Permission denied:** Signed-in users go to their account. An owner who signs in here is sent to the owner sign-in (OWN-01).
- **Status vocabulary:** None.

### PUB-10 Forgot and reset password

- **Routes:** `/forgot-password`, `/reset-password`. **FRs:** FR-43.
- **Purpose:** Ask for a reset link by email, then set a new password through the time-limited link.
- **Loading:** Submit buttons show a text label and are disabled.
- **Empty:** Not applicable.
- **Error:** The request page always says "If an account exists for this email, we sent a link", so it does not reveal accounts. Expired link: "This link has expired." with "Send a new link". Weak password: "Error: Use at least 8 characters."
- **Permission denied:** None. Public. The owner's lost two-factor device recovery is open (N69) and has no screen yet.
- **Status vocabulary:** None.

### PUB-11 Privacy notice

- **Route:** `/privacy`. **FRs:** FR-45.
- **Purpose:** Full data privacy notice (Data Privacy Act of 2012). Linked from registration and from the footer.
- **Loading:** Static text. No loading state.
- **Empty:** Not applicable.
- **Error:** Standard error page (PUB-12).
- **Permission denied:** None. Public.
- **Status vocabulary:** None.

### PUB-12 Error and access pages

- **Routes:** not found, access denied, session ended, server error. **FRs:** supports FR-42 and the Security NFR (role-based access).
- **Purpose:** Plain pages that say what happened and give one next step. They show "Afable's Jewelry Store" only.
- **Loading:** None.
- **Empty:** Not applicable.
- **Error:** The server error page says "Something went wrong on our side. Try again in a moment." and shows no technical detail.
- **Permission denied:** This is the permission-denied page (see section 2).
- **Status vocabulary:** None.

### SHR-01 Chatbot panel

- **Route:** a panel on every public and customer page. **FRs:** FR-35, FR-36, FR-37, FR-38, FR-39, FR-40. The panel is also where FR-40 is visible (see section 6).
- **Purpose:** Answer questions about products, services and the store. Help the customer prepare a custom order request or a service request. The bot fills the viewer's option fields and shows a text draft summary. The customer reviews, edits and confirms. Confirming saves a Draft only. Submitting needs a second explicit confirmation in chat or a submit in the viewer (N8, N12). Never shows a final price or completion date (FR-40).
- **Loading:** A "typing" row with the text "Afable's assistant is replying". Response target 5 seconds. If slower, the text changes to "Still working on it".
- **Empty:** First open shows a greeting from "Afable's Jewelry Store" and three suggested starts: ask about a product, start a ring design, ask about a service. It says replies come in the language the customer writes in.
- **Error:** Rate limit hit (N54): "You have sent many messages. Wait a few minutes and try again." Message too long: "Shorten your message to N characters" (limit open). Service down: "The assistant is not available. You can still browse the store or contact the owner." Out of scope: refers to the owner (FR-39). Unsupported piece: "The online designer covers rings only. Ask the store about other pieces."
- **Permission denied:** Visitors can ask questions. Saving a draft needs sign-in (the draft is stored per customer). The panel asks the visitor to sign in before it saves, and keeps the conversation.
- **Status vocabulary:** V-CO (Draft, Submitted) on the draft card inside the chat. For service drafts the flow is assumed to match (FR-37, N14 open), so V-SR (Submitted).

## 5. Customer screens

All customer screens need a signed-in, email-verified account (FR-41, FR-42). A signed-out visitor is redirected to sign-in. A customer can see only their own records.

### CUS-01 Account

- **Route:** `/account`. **FRs:** FR-44, FR-45 (consent shown).
- **Purpose:** View and edit name and contact details. Change password.
- **Loading:** Form skeleton.
- **Empty:** Not applicable. Optional fields show "(optional)".
- **Error:** Field errors with fix instructions. Wrong current password: "Error: The current password is not correct."
- **Permission denied:** Signed-out redirect. Customer sees own account only.
- **Status vocabulary:** Email "Verified" or "Not verified" (text and icon).

### CUS-02 My designs

- **Route:** `/designs`. **FRs:** FR-05, FR-07, FR-36, FR-10.
- **Purpose:** List the customer's drafts (from the viewer or from the chatbot) with the date saved and the estimate. Open, delete or submit.
- **Loading:** List-row skeletons.
- **Empty:** "You have no saved designs" with "Open the ring designer" and "Ask the chatbot".
- **Error:** Inline alert with "Try again". Delete failure: inline message on the row.
- **Permission denied:** Signed-out redirect. Other customers' drafts are never listed. Drafts are invisible to the owner (N11).
- **Status vocabulary:** V-CO, Draft only. A "Estimate changed" notice on drafts whose estimate differs (N80).

### CUS-03 Place ready-made order

- **Route:** `/shop/[slug]/order`. **FRs:** FR-13, FR-14.
- **Purpose:** Review the product, listed price, availability and the order terms, then place the order. A review step comes before the confirm step (WCAG 3.3.4). No cart and no online payment.
- **Loading:** Skeleton summary. Confirm button disabled while placing.
- **Empty:** Not applicable. Unknown product shows "This product is not available".
- **Error:** The product became unavailable while the page was open: "This product is no longer available" and the confirm is disabled. Placement failed: error summary, nothing is created twice. Last unit reserved by another order: message with the catalog link (N47, open rule).
- **Permission denied:** Signed-out redirect with return. Unverified email: "Verify your email address to place an order."
- **Status vocabulary:** V-AV; after placing, V-RM Placed.

### CUS-04 Review and submit custom order

- **Route:** `/design/review`. **FRs:** FR-07, FR-06.
- **Purpose:** Review the itemized estimate (weight and price lines, rate snapshot date) and all chosen options, then confirm submission. The estimate is labeled "Estimate, subject to the owner's final confirmation". The same screen serves resubmission after revision (FR-10).
- **Loading:** Skeleton summary. Submit shows "Submitting..." and is disabled.
- **Empty:** No design in progress: "You have not chosen a design yet" with a link to the ring designer.
- **Error:** Rates changed since the draft was saved: notice with the new estimate and a required "Review the change" check before submit (N80). Submission failure: error summary, draft is kept.
- **Permission denied:** Signed-out redirect. Unverified email blocks submit with a resend action.
- **Status vocabulary:** V-CO: Draft becomes Submitted.

### CUS-05 Custom order detail

- **Route:** `/orders/[id]` (custom). **FRs:** FR-09 (customer receives remarks), FR-10, FR-11 (sees approval), FR-19, FR-22, FR-49 (in-app events).
- **Purpose:** Order timeline, the design and estimate snapshot, owner revision remarks with "Adjust in the designer" and "Resubmit", links to the quotation (CUS-07) and payment (CUS-08), claim code section (CUS-14), cancel action (CUS-12).
- **Loading:** Skeleton for timeline and summary.
- **Empty:** Revision remarks section says "No remarks from the store" when none. Timeline steps that have not happened show "Not yet".
- **Error:** Inline alert with "Try again". Resubmit failure: error summary, design kept.
- **Permission denied:** Signed-out redirect. Another customer's order shows the not-available page.
- **Status vocabulary:** V-CO, with V-QT and V-PP summaries and V-CX when a cancellation is open.

### CUS-06 Ready-made order detail

- **Route:** `/orders/[id]` (ready-made). **FRs:** FR-14, FR-19, FR-22, FR-49.
- **Purpose:** Order timeline, product, listed price, reservation deadline, payment instructions, proof upload (CUS-08), cash option, claim code (CUS-14), cancel (CUS-12).
- **Loading:** Skeleton.
- **Empty:** Payment section before the owner confirms: "Payment instructions arrive after the store confirms your order."
- **Error:** Inline alert with "Try again". Reservation expired: the order shows Expired with the date and the next step "Place a new order".
- **Permission denied:** As CUS-05.
- **Status vocabulary:** V-RM, V-RS, V-PP, V-CX. V-RM is provisional (N45).

### CUS-07 Quotation

- **Route:** `/quotations/[id]`. **FRs:** FR-16, FR-28, FR-15 (customer side), FR-22.
- **Purpose:** Itemized estimate with the rate snapshot, final price, required down payment, expected completion date and validity date, payment account details, refund policy and unclaimed-item policy (N20, N27, N87). The customer accepts or declines. Accepting has a review step and a confirm step.
- **Loading:** Skeleton for the quotation sheet. Accept and Decline are disabled while loading.
- **Empty:** Not applicable (a quotation always has content). Before issue the order page says "The store has not issued a quotation yet".
- **Error:** Expired quotation: Accept is disabled, the date it ended is shown, and "Request a refreshed quotation" is offered. Accept failure: error summary, nothing changes.
- **Permission denied:** Signed-out redirect. A quotation for another customer shows the not-available page.
- **Status vocabulary:** V-QT. After acceptance the parent order shows V-CO or V-SR "Quotation accepted". A declined service quotation shows "Declined, item to be returned".

### CUS-08 Payment proof upload

- **Route:** `/orders/[id]/payment`. **FRs:** FR-17.
- **Purpose:** Submit amount, date and reference number and upload an image of the proof (JPG, PNG or PDF, up to 5 MB) for a down payment or full payment. Cash payment in the store is explained here, with no upload needed. Shows the payment account details and the history of earlier proofs.
- **Loading:** Upload progress with a text percentage. Submit disabled until the upload finishes.
- **Empty:** No earlier proofs: "No payments submitted yet".
- **Error:** Wrong file type or over 5 MB: "Error: Upload a JPG, PNG or PDF file up to 5 MB." Reference number already used: "Error: This reference number was already submitted. Check the number on your receipt." (N22). Rejected proof: the reason shown with a "Submit a new proof" action.
- **Permission denied:** Signed-out redirect. Only the order's customer. Not available when the quotation is not accepted or the reservation expired; the page says why.
- **Status vocabulary:** V-PP.

### CUS-09 Service request form

- **Route:** `/services/request`. **FRs:** FR-26, FR-37 (chatbot-prefilled draft).
- **Purpose:** Item to be serviced, type of service, item details. Review step, then confirm. The page explains that the customer brings the item to the store and that any estimate is not a quotation (N16).
- **Loading:** Form skeleton. Submit disabled with a text label.
- **Empty:** No service types configured: "Service requests are not open yet. Ask the store directly."
- **Error:** Field errors with fix instructions. Submit failure keeps the form.
- **Permission denied:** Signed-out redirect with return. Unverified email blocks submit.
- **Status vocabulary:** V-SR: Submitted after confirm.

### CUS-10 Service request detail

- **Route:** `/services/requests/[id]`. **FRs:** FR-28, FR-29 (customer view), FR-31, FR-33, FR-49.
- **Purpose:** Timeline from drop-off to claiming, optional non-binding estimate range, binding quotation link (CUS-07), payment (CUS-08), claim code (CUS-14), cancel before work starts (CUS-12).
- **Loading:** Skeleton.
- **Empty:** Before the item arrives: "Bring your item to the store. The status changes to Received when the store has it."
- **Error:** Inline alert with "Try again".
- **Permission denied:** Signed-out redirect. Other customers' requests show the not-available page. Profiles without accounts have no access (N32).
- **Status vocabulary:** V-SR, V-QT, V-PP, V-CX.

### CUS-11 Orders and requests history

- **Route:** `/orders`. **FRs:** FR-23, FR-19, FR-31, FR-22 and FR-33 (entry).
- **Purpose:** One list of the customer's orders, custom-order requests, service requests, quotations and payments, with status and date. Filter by type and status.
- **Loading:** List-row skeletons. Target: within 3 seconds (Performance NFR).
- **Empty:** "You have no orders or requests yet" with links to the catalog, the ring designer and services.
- **Error:** Inline alert with "Try again".
- **Permission denied:** Signed-out redirect. Own records only.
- **Status vocabulary:** V-CO, V-SR, V-RM, V-QT, V-PP, each as the badge for that record.

### CUS-12 Cancel request

- **Route:** a confirm dialog on CUS-05, CUS-06 and CUS-10, with the page `/orders/[id]/cancel` for small screens. **FRs:** FR-22, FR-33.
- **Purpose:** Cancel an order or request not yet confirmed or started, or, after a verified down payment, ask the owner to decide (N25, N28, N110). The text states the refund policy and that the owner decides after a verified down payment.
- **Loading:** Confirm button shows "Sending...".
- **Empty:** Not applicable.
- **Error:** Work already started: "Production has started. Send a cancellation request and the store will decide." Failure keeps the dialog open with an error message.
- **Permission denied:** Signed-out redirect. Own records only.
- **Status vocabulary:** V-CX (Requested, Cancelled and the outcome), V-RM Cancelled.

### CUS-13 Notifications

- **Route:** `/notifications`, plus a bell with an unread count in the header. **FRs:** FR-49.
- **Purpose:** In-app list of key events: revision requested, quotation issued, status changed, ready for claiming, proof rejected, cancellation outcome, reservation expiring or expired, quotation expiry, claim code. Each item links to the record. The same events also go by email.
- **Loading:** List skeleton. The bell shows no count until loaded.
- **Empty:** "No notifications yet".
- **Error:** Inline alert with "Try again". The bell hides the count on failure.
- **Permission denied:** Signed-out redirect. Own notifications only. Profiles without accounts get none (N32).
- **Status vocabulary:** The new status of the event, named in text.

### CUS-14 Claim code section

- **Route:** a section on CUS-05, CUS-06 and CUS-10 when the status is Ready for claiming. **FRs:** FR-19, FR-29, FR-49, FR-30 (balance to pay at claiming).
- **Purpose:** Show the claim code in large type, the balance due at claiming, what to bring (the code and a valid ID; a representative also brings written authorization and their own ID), and the unclaimed-item period with the date (N85, N87, N88, N90).
- **Loading:** Skeleton for the code block. The code is never shown in a loading placeholder.
- **Empty:** Before Ready for claiming the section is absent. The timeline shows "Not yet".
- **Error:** Code fails to load: "We could not show your code. Try again, or ask the store." The code is also in the email.
- **Permission denied:** Only the order's customer sees the code. After Claimed the code is shown as used, with the release date.
- **Status vocabulary:** V-CO, V-SR, V-RM at Ready for claiming, Claimed and Unclaimed. Unclaimed shows "Unclaimed, owner's discretion".

## 6. Owner screens

Owner screens sit under `/owner`. The owner signs in with a password and a time-based one-time code (N67, N68). A customer account cannot open any of them. A signed-out user is redirected to OWN-01. A signed-in customer sees the access-denied page (PUB-12). Owner screens must work at 360 px (Compatibility NFR).

### OWN-01 Owner sign-in

- **Route:** `/owner/sign-in`. **FRs:** FR-42, FR-46.
- **Purpose:** Password step, then one-time code step.
- **Loading:** Submit buttons show a text label.
- **Empty:** Not applicable.
- **Error:** Same wording rules as PUB-09. Wrong code: "Error: The code is not correct or has expired. Enter the current code from your authenticator app." Lost device recovery is open (N69).
- **Permission denied:** A customer who signs in here is told "This account is not an owner account."
- **Status vocabulary:** None.

### OWN-02 Dashboard and action queue

- **Route:** `/owner`. **FRs:** FR-50, FR-20 (entry), FR-46.
- **Purpose:** A pending-actions count and a queue of what needs the owner: new custom orders, new service requests, payment proofs awaiting verification, cancellation requests, ready-made orders awaiting confirmation, reservations expiring soon, items nearing the unclaimed limit. Each row opens the record.
- **Loading:** Count and queue skeletons. The count is not shown as zero while loading.
- **Empty:** "Nothing is waiting for you" with the time of the last check.
- **Error:** Inline alert with "Try again". If the count fails, the nav shows "Count unavailable" and not zero.
- **Permission denied:** Redirect to OWN-01 when signed out; access denied for customers.
- **Status vocabulary:** V-CO (Submitted, Under review), V-SR (Submitted, Received), V-RM (Placed), V-PP (Pending verification), V-CX (Requested), V-RS (Expiring soon), Unclaimed warning.

### OWN-03 Orders list

- **Route:** `/owner/orders`. **FRs:** FR-21, FR-20 (entry), FR-48.
- **Purpose:** All orders and custom-order requests with search, and filters by type, status and date. Open a record.
- **Loading:** Table-row skeletons. On small screens, rows become stacked cards.
- **Empty:** "No orders yet". With filters: "No orders match these filters" and "Clear filters".
- **Error:** Inline alert with "Try again".
- **Permission denied:** As OWN-02.
- **Status vocabulary:** V-CO, V-RM, V-QT, V-PP.

### OWN-04 Custom order review

- **Route:** `/owner/orders/[id]/review`. **FRs:** FR-08, FR-09, FR-11.
- **Purpose:** See the submitted design in the 3D view, the options, and the itemized estimate with the rate snapshot. Confirm or revise the design and estimate, reject with a reason, request revisions with written remarks, or approve. Approval moves the order to the quotation (OWN-06). The final price is not set here (N6).
- **Loading:** Skeleton for the viewer frame and summary. Action buttons disabled while loading.
- **Empty:** Revision history empty: "No revisions requested".
- **Error:** WebGL failure: same message and fallback as PUB-04, with the option list as text. Action failure: error summary, nothing changes. Remarks left empty on a revision request: "Error: Write what the customer should change."
- **Permission denied:** As OWN-02.
- **Status vocabulary:** V-CO (Submitted, Under review, Design approved, Rejected with reason).

### OWN-05 Order detail and status update

- **Route:** `/owner/orders/[id]`. **FRs:** FR-20, FR-21, FR-18 (payment summary), FR-30, FR-19 (what the customer sees).
- **Purpose:** One record for an order: customer, items, timeline, quotation, payments and balance, in-store photos (JPG or PNG, owner only, N107), notes. Status changes happen here (for example Down payment verified to In production, then Ready for claiming). The page shows what the customer currently sees.
- **Loading:** Skeleton.
- **Empty:** Sections without data say so: "No payments recorded", "No photos attached".
- **Error:** Inline alert with "Try again". Status change failure: message, status unchanged. A status that is not allowed next is disabled with the reason.
- **Permission denied:** As OWN-02.
- **Status vocabulary:** V-CO, V-RM, V-QT, V-PP, V-CX, V-RS.

### OWN-06 Quotation editor

- **Route:** `/owner/quotations/new?order=[id]` and `/owner/quotations/[id]`. **FRs:** FR-15, FR-27.
- **Purpose:** Issue a quotation for a custom order, an owner-entered order or a service request. Set the final price, down payment (zero allowed, N29), expected completion or retrieval date, the procedure for a service, and the validity period. The rate snapshot is saved on issue (N79). Ready-made orders do not use this screen (N45). A review step precedes issue.
- **Loading:** Skeleton. Rate lines load first.
- **Empty:** Not applicable. A new quotation starts from the estimate.
- **Error:** Field errors with fix instructions. Expired quotation: "Issue a refreshed quotation" (N82) copies the content to a new one.
- **Permission denied:** As OWN-02.
- **Status vocabulary:** V-QT, V-CO, V-SR.

### OWN-07 Payment verification

- **Route:** `/owner/payments`. **FRs:** FR-18, FR-30.
- **Purpose:** Review submitted proofs (image or PDF with amount, date and reference number). Verify or reject with a reason. Record cash and balances. Record the down payment collected at drop-off for services, after acceptance only.
- **Loading:** List skeletons. Proof image shows a grey plate until loaded.
- **Empty:** "No payments are waiting for verification".
- **Error:** Proof file fails to load: "We could not show this file. Try again." The reference number is still shown. Verify failure: message, status unchanged. Reject without a reason: "Error: Write the reason the customer will see."
- **Permission denied:** As OWN-02. Proof files are visible only to the owner and the submitting customer.
- **Status vocabulary:** V-PP.

### OWN-08 Release at claiming

- **Route:** `/owner/orders/[id]/release`. **FRs:** FR-19, FR-20, FR-29, FR-30.
- **Purpose:** Check the claim code and the ID. For a representative, also check the written authorization and their ID. Record recipient, date and balance paid. Warn and require a second confirmation if the balance is not zero (N86, N88). Record the status Claimed.
- **Loading:** Skeleton. Release is disabled while loading.
- **Empty:** Not applicable.
- **Error:** Code does not match: "Error: This code does not match this order." Release failure: message, status unchanged. Not Ready for claiming: "This order is not ready for claiming" and the form is disabled.
- **Permission denied:** As OWN-02. Owner-created profiles use the same record without a code (N88).
- **Status vocabulary:** V-CO, V-SR, V-RM: Ready for claiming to Claimed. Unclaimed items show "Unclaimed, owner's discretion".

### OWN-09 Service requests list

- **Route:** `/owner/services/requests`. **FRs:** FR-32, FR-29 (entry), FR-48.
- **Purpose:** All service requests with search and filters by status and date.
- **Loading:** Row skeletons.
- **Empty:** "No service requests yet". With filters: "No requests match these filters".
- **Error:** Inline alert with "Try again".
- **Permission denied:** As OWN-02.
- **Status vocabulary:** V-SR, V-QT, V-PP.

### OWN-10 Service request detail and assessment

- **Route:** `/owner/services/requests/[id]`. **FRs:** FR-27, FR-29, FR-30, FR-32.
- **Purpose:** Request details, optional non-binding estimate range (N16), mark Received, record the assessment (Under assessment), issue the binding quotation (OWN-06), record the down payment after acceptance, move to In progress, Completed and Ready for claiming, and open the release (OWN-08). The declined branch shows "Declined, item to be returned".
- **Loading:** Skeleton.
- **Empty:** "No notes yet", "No payments recorded".
- **Error:** Inline alert with "Try again". An invalid status jump is disabled with the reason.
- **Permission denied:** As OWN-02.
- **Status vocabulary:** V-SR, V-QT, V-PP, V-CX.

### OWN-11 Cancellation requests

- **Route:** `/owner/cancellations`. **FRs:** FR-22, FR-33.
- **Purpose:** Queue of cancellation requests. For a request after a verified down payment, the owner decides and records the outcome: refunded in full, refunded in part with a reason, or retained with a reason (N25, N26). Refunds are handed back as cash or transfer outside the system.
- **Loading:** List skeletons.
- **Empty:** "No cancellation requests".
- **Error:** Decision without a reason where one is required: "Error: Write the reason the customer will see." Failure keeps the form.
- **Permission denied:** As OWN-02.
- **Status vocabulary:** V-CX, V-CO, V-SR, V-RM.

### OWN-12 Products

- **Route:** `/owner/products`, `/owner/products/new`, `/owner/products/[id]`. **FRs:** FR-24, FR-13.
- **Purpose:** Add, edit, hide and archive products: photos, description, material, price, availability and stock quantity. Stock 0 sets Unavailable automatically (N44). Archive replaces delete (N81). Photo upload shows the stand-in marker while real photos are not yet added.
- **Loading:** Table and form skeletons.
- **Empty:** "No products yet" with "Add a product".
- **Error:** Field errors with fix instructions. Photo upload errors state type and size limits. Archive failure: message, product unchanged.
- **Permission denied:** As OWN-02.
- **Status vocabulary:** V-AV, plus "Hidden" and "Archived" shown as text with icon (not order statuses).

### OWN-13 Service catalog management

- **Route:** `/owner/services`. **FRs:** FR-34.
- **Purpose:** Add, edit and hide service entries (name and description).
- **Loading:** List skeletons.
- **Empty:** "No services yet" with "Add a service".
- **Error:** Field errors. Save failure keeps the form.
- **Permission denied:** As OWN-02.
- **Status vocabulary:** "Shown" and "Hidden" as text with icon.

### OWN-14 Customization options and rates

- **Route:** `/owner/options`. **FRs:** FR-47, FR-01, FR-02, FR-03, FR-04.
- **Purpose:** Manage the metals (with karat grades), colors and finishes, gemstone types, cuts, quantities and ring sizes the viewer offers, with their rates (N97). Archive, never delete. A change to a rate shows how it affects open drafts (N80). New ring styles need a developer and are outside the study (N105).
- **Loading:** Table skeletons.
- **Empty:** "No options yet. The ring designer needs at least one metal and one ring size." The viewer is unavailable until then (see PUB-04).
- **Error:** Invalid rate: "Error: Enter a rate in pesos, like 1250.50." Save failure: message, values kept.
- **Permission denied:** As OWN-02.
- **Status vocabulary:** "Active" and "Archived" as text with icon.

### OWN-15 Store settings

- **Route:** `/owner/settings`. **FRs:** FR-47, FR-46.
- **Purpose:** Payment account details, refund policy, quotation validity, reservation deadline, unclaimed-item period, Store Information and FAQ. The same text feeds PUB-06, CUS-07 and the chatbot.
- **Loading:** Form skeleton.
- **Empty:** Unfilled policy fields show "(required before you issue quotations)". The quotation editor warns if payment account details or the refund policy are blank.
- **Error:** Field errors with fix instructions. Save failure keeps the values.
- **Permission denied:** As OWN-02.
- **Status vocabulary:** None.

### OWN-16 Customers and transaction history

- **Route:** `/owner/customers`, `/owner/customers/[id]`. **FRs:** FR-48, FR-21, FR-32.
- **Purpose:** Find a customer. See their orders, service requests, quotations and payments in one history. Personal data is visible only to the account holder and the owner (Security NFR).
- **Loading:** List and detail skeletons.
- **Empty:** "No customers yet". A customer with no activity: "No orders or requests yet".
- **Error:** Inline alert with "Try again".
- **Permission denied:** As OWN-02.
- **Status vocabulary:** V-CO, V-SR, V-RM, V-QT, V-PP on each history row. Profiles without an account show "No account" in text.

### OWN-17 Create profile and enter an order

- **Route:** `/owner/customers/new`, `/owner/orders/new`, `/owner/services/requests/new`. **FRs:** FR-41 (exception), FR-45 (consent, N31 open), FR-07 (owner-entered custom orders for other pieces, N106), FR-26 (walk-in service requests).
- **Purpose:** Create a profile for a walk-in or phone customer without an account, then create their order or service request. Walk-ins get no online tracking and are contacted by text or call (N30, N32).
- **Loading:** Form skeleton.
- **Empty:** Not applicable.
- **Error:** Field errors with fix instructions. Possible duplicate (same name and contact number): a warning "Check before you continue: a customer with this contact number exists" with a link.
- **Permission denied:** As OWN-02.
- **Status vocabulary:** V-CO or V-SR starting at Submitted (or Received for a service item handed over at the counter). Consent wording for owner-created profiles is open (N31).

### OWN-18 Owner notifications

- **Route:** `/owner/notifications`, plus a header count. **FRs:** FR-50.
- **Purpose:** In-app list of new orders, custom-order requests, service requests, payment submissions and cancellation requests. Email alerts and the daily digest are sent outside the interface (N73, N74). Drafts never notify (N11).
- **Loading:** List skeleton. Header count not shown until loaded.
- **Empty:** "No notifications yet".
- **Error:** Inline alert with "Try again".
- **Permission denied:** As OWN-02.
- **Status vocabulary:** The status that caused the alert, named in text.

### OWN-19 Owner account security

- **Route:** `/owner/account`. **FRs:** FR-43, FR-46.
- **Purpose:** Change password, set up or replace the authenticator, and view sign-in details. The recovery flow for a lost device is open (N69).
- **Loading:** Form skeleton.
- **Empty:** Not applicable.
- **Error:** Field errors with fix instructions. Wrong current password: "Error: The current password is not correct."
- **Permission denied:** As OWN-02.
- **Status vocabulary:** None.

## 7. Open points

- **Routes.** All paths are proposals for the fixture build.
- **Viewer for visitors.** PUB-04 lets signed-out visitors explore and asks for sign-in at Save and Submit. The requirements only require login for transactional features (FR-42). The user should confirm.
- **Ready-made statuses.** V-RM is a proposal until N45 is settled.
- **Service draft flow.** SHR-01 and CUS-09 assume the same draft-then-submit pattern as custom orders (FR-37, N14 open).
- **Payment account on the public page.** PUB-06 may or may not show payment account details to visitors. This is open.
- **Chatbot limits.** Rate limit numbers and maximum message length are open (N54). The panel text carries placeholders until then.
- **Owner session and recovery.** The 30-minute session length for the owner and lost-device recovery are open (N68, N69).
- **Walk-in consent.** The consent wording for owner-created profiles is open (N31).
- **Owner interview.** Logo, owner brand colors and fonts, and which jewelry sells most are open. They may change PUB-01 and the catalog filters.
- **Last-unit rule.** Blocking placement on the last unit is recommended but not decided (N47). CUS-03 shows the message as a placeholder.
- **Not verified.** Route names and the screen split are not tested with the owner or customers. Nothing here has been checked against a running build.

## 8. FR coverage

"UI" says whether the requirement has a user interface. **Yes** means at least one screen above serves it. **Partly** means some of the requirement is visible and the rest has no UI. **No** means the requirement has no screen of its own.

| FR    | UI     | Screens                                                                                                                   |
| ----- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| FR-01 | Yes    | PUB-04, OWN-14                                                                                                            |
| FR-02 | Yes    | PUB-04, OWN-14                                                                                                            |
| FR-03 | Yes    | PUB-04, OWN-14                                                                                                            |
| FR-04 | Yes    | PUB-04, OWN-14                                                                                                            |
| FR-05 | Yes    | PUB-04, CUS-02, OWN-04                                                                                                    |
| FR-06 | Yes    | PUB-04, CUS-04, OWN-04                                                                                                    |
| FR-07 | Yes    | PUB-04, CUS-04, OWN-17                                                                                                    |
| FR-08 | Yes    | OWN-04                                                                                                                    |
| FR-09 | Yes    | OWN-04, CUS-05                                                                                                            |
| FR-10 | Yes    | CUS-05, CUS-04, CUS-02                                                                                                    |
| FR-11 | Yes    | OWN-04, CUS-05                                                                                                            |
| FR-12 | Yes    | PUB-01, PUB-02, PUB-03                                                                                                    |
| FR-13 | Yes    | PUB-02, PUB-03, CUS-03, OWN-12                                                                                            |
| FR-14 | Yes    | PUB-03, CUS-03, CUS-06                                                                                                    |
| FR-15 | Yes    | OWN-06, CUS-07                                                                                                            |
| FR-16 | Yes    | CUS-07                                                                                                                    |
| FR-17 | Yes    | CUS-08                                                                                                                    |
| FR-18 | Yes    | OWN-07, OWN-05                                                                                                            |
| FR-19 | Yes    | CUS-05, CUS-06, CUS-11, CUS-14, OWN-08                                                                                    |
| FR-20 | Yes    | OWN-05, OWN-08                                                                                                            |
| FR-21 | Yes    | OWN-03, OWN-05, OWN-16                                                                                                    |
| FR-22 | Yes    | CUS-12, CUS-05, CUS-06, OWN-11                                                                                            |
| FR-23 | Yes    | CUS-11                                                                                                                    |
| FR-24 | Yes    | OWN-12                                                                                                                    |
| FR-25 | Yes    | PUB-05                                                                                                                    |
| FR-26 | Yes    | CUS-09, OWN-17                                                                                                            |
| FR-27 | Yes    | OWN-06, OWN-10                                                                                                            |
| FR-28 | Yes    | CUS-07, CUS-10                                                                                                            |
| FR-29 | Yes    | OWN-10, OWN-08, CUS-10                                                                                                    |
| FR-30 | Yes    | OWN-07, OWN-10, OWN-08                                                                                                    |
| FR-31 | Yes    | CUS-10, CUS-11                                                                                                            |
| FR-32 | Yes    | OWN-09, OWN-10, OWN-16                                                                                                    |
| FR-33 | Yes    | CUS-12, CUS-10, OWN-11                                                                                                    |
| FR-34 | Yes    | OWN-13                                                                                                                    |
| FR-35 | Yes    | SHR-01                                                                                                                    |
| FR-36 | Yes    | SHR-01, PUB-04, CUS-02                                                                                                    |
| FR-37 | Yes    | SHR-01, CUS-09                                                                                                            |
| FR-38 | Yes    | SHR-01, PUB-06                                                                                                            |
| FR-39 | Yes    | SHR-01                                                                                                                    |
| FR-40 | No     | Constraint on chatbot content. The panel and the estimate labels carry it (SHR-01, CUS-04, CUS-07). No screen of its own. |
| FR-41 | Yes    | PUB-07, PUB-08, OWN-17                                                                                                    |
| FR-42 | Yes    | PUB-09, OWN-01                                                                                                            |
| FR-43 | Yes    | PUB-10, OWN-19                                                                                                            |
| FR-44 | Yes    | CUS-01                                                                                                                    |
| FR-45 | Yes    | PUB-07, PUB-11, OWN-17                                                                                                    |
| FR-46 | Partly | OWN-01, OWN-02, OWN-15, OWN-19. Creating the owner account at handover is not a screen (N67).                             |
| FR-47 | Yes    | OWN-14, OWN-15, PUB-06                                                                                                    |
| FR-48 | Yes    | OWN-16, OWN-03, OWN-09                                                                                                    |
| FR-49 | Partly | CUS-13, CUS-05, CUS-06, CUS-10, CUS-14. The email channel has no screen.                                                  |
| FR-50 | Partly | OWN-02, OWN-18. The email alerts and the daily digest have no screen.                                                     |

Every requirement with UI "Yes" or "Partly" (49 of 50) has at least one screen. FR-40 is the only one marked "No".

### Requirements, or parts of them, with no UI

- **FR-40** (the chatbot gives no binding quotation, final price or production commitment). A behavior rule. Tested through chatbot responses ([06-testing.md](06-testing.md)). The interface supports it with estimate labels and the chatbot's refusal wording.
- **FR-46, owner account creation.** Done at handover by the developer (N67). The account has no registration screen.
- **FR-49, email delivery.** Email content and delivery are not screens. They follow the voice rules in DESIGN.md.
- **FR-50, email alerts and daily digest.** Sent through Resend (N73, N74). The in-app count and list are OWN-02 and OWN-18.
- **FR-13, server rule.** The block on ordering unavailable products is enforced on the server. The UI only shows the disabled state.
- **FR-14, reservation timing.** Reservation expiry and stock release are scheduled jobs. The UI shows the result (V-RS).
- **Quotation and reservation expiry, unclaimed reminders.** Scheduled jobs with no screen. They produce notifications (CUS-13) and statuses.

## 9. Related documents

- [DESIGN.md](../DESIGN.md): visual system and the status treatments.
- [12-ui-components.md](12-ui-components.md): components used on these screens.
- [04-flowcharts.md](04-flowcharts.md): status lifecycles and flows.
- [01-requirements.md](01-requirements.md): FR and NFR text.
