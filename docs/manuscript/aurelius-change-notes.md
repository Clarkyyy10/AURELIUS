# AURELIUS Manuscript Change Notes

Source: grill-me session on `aurelius-final-manuscript.md`. The manuscript is a draft, so these notes list changes and unclear points. Note numbers (N1 to N115) match the session. Decisions are adopted unless marked **Open**. Figures (flowcharts, ERD, architecture) have not been checked against these notes yet.

## 1. Chapter I: objectives, scope, limitations, definitions

- N59: Objectives (1.2, 1.3) promise reduced owner workload. Reference the baseline and trial measure (N56).
- N96: Version 1 viewer covers rings only (plain band, solitaire, side stones). Title, 1.3.2, 1.4.1, 1.6 and Table 4 say "jewelry" and must say rings for v1. Pendants next if time allows. Bracelets and necklaces are future work.
- N101: Custom orders are limited to what the viewer supports. The e-commerce "custom-order request" entry starts the same viewer flow. Reword 1.3.2 and 1.4.1.
- N102: Section 1.1 says the store takes custom orders of any design. Add a limitation that pieces outside the viewer are not handled online. The "four gaps" argument (1.1) and Section 2.3 must not claim general custom-order handling.
- N106: Scope (1.4.1) adds owner-entered custom orders for any piece.
- N30: Scope and 1.1 mention walk-in and phone customers and owner-created profiles.
- N18: Section 1.6 "Quotation" says "binding quotation after inspection."
- N19, N25: Limitations name the payment channels (cash, manual transfer, no gateway) and say the system records refund outcomes only and never moves money.
- N32: Limitation: no tracking or email for customers without accounts.
- N44: Limitation clarifies that finished-piece quantity is tracked per product and only raw-material inventory is excluded.
- N41: Add that Filipino chatbot accuracy may be lower than English, if testing shows it.
- N57: Limitation: workload evidence comes from one owner and a short trial.
- N60: If the owner cannot log a baseline, say the baseline uses estimates and observation notes.
- N71: Limitation: single-operator dependency, no delegate role. State what customers see when the owner is unavailable.
- N75: SMS and push notifications are future work (needs a future-work section).
- N76: Owner response time is not guaranteed. Customers see the current status.
- N85: Claiming and balance settlement happen in the store.
- N92: Reliability and Security ratings reflect perceived quality only.
- N98: Viewer limitation names rings. The 20-configuration check covers rings only.
- N102, N114: Updates, new ring styles and third-party changes after handover are outside scope.
- N112: 3 months of bug-fix-only support, named contact, no service-level commitment.
- N115: Owner is responsible for live customer data under the Data Privacy Act.

## 2. Chapter II: literature and framework

- N3: Section 2.1 viewer text must describe procedural, in-browser generation.
- N51: "Knowledge base" and RAG wording (2.1, 2.4, 3.10) must say retrieval from the store's database, not full RAG with embeddings.
- N15: Section 2.1 status list (received to ready for claiming) is replaced by the new service sequence.
- N42: Check the "clear, plain English" wording and the chatbot privacy notice for the English-only assumption.
- N62: Section 2.4 lists modules in the old build order. Reword.
- N102: Section 2.3 research gap must not claim general custom-order handling.

## 3. Methodology (3.1 to 3.8)

- N56: Add baseline and trial measure (3.1, 3.3, 3.7, 3.8). Baseline: owner logs inquiries, follow-ups per day and time per quotation for 1 to 2 weeks. Trial: scripted scenarios in AURELIUS and the manual way, timed.
- N57: Report workload results as descriptive numbers only.
- N58: Add baseline log and trial timing sheet to instruments (3.6). Define scenarios (custom order, service request, payment, status inquiry). **Open**
- N62: 3.2 Phase 4 builds the transaction core first. The 3D viewer runs in parallel with 1 to 2 ring styles.
- N63: Re-grade the 44 Must requirements into a smaller core. Add a Could tier. FR-48 moves to Should. Redo the "100% of Must" NFR. **Open**
- N64: Add project timeline (deadline, number of two-week sprints, deliverables per sprint). **Open**
- N65, N66: Capstone 1 vs 2 scope and the evaluation timing in 4th year. **Open**
- N91: Reword Reliability and Security questionnaire items to observable behavior (3.6, Table 9).
- N92, N94: The overall score is the perceived score only. Do not average it with measured results.
- N40: Report chatbot accuracy separately for English and Filipino/Taglish.
- N61: Baseline and trial data record counts and times only, no customer names.

## 4. Functional requirements (Table 2)

**Module 1: 3D customization**

- N1, N96, N97: Name ring types. Reword FR-01 to FR-05. Materials, karats and metals come from the owner's price references. Gemstones come from an owner-approved list with stone slots per ring style. FR-04 drops necklace and bracelet length.
- N5: Weight and price formula. Metal weight = parametric volume x density. Gemstone weight from an owner-maintained lookup. Price = metal + stones + labor + finishing, itemized.
- N6, N11: FR-08, FR-11, FR-15 conflict on where the final price is set. Final price exists only in the quotation. FR-08 confirms or revises design and estimate only. Custom order statuses: Draft, Submitted, Under review, Design approved, Quotation issued, Quotation accepted, Down payment verified, In production, Ready for claiming, Claimed (and Unclaimed, owner's discretion). A declined quotation ends the order.
- N79: Itemized rate and estimate snapshot on each submitted design and each issued quotation (FR-06, FR-15, FR-27).
- N80: Drafts recompute with current rates on open. Show a notice if the estimate changed. Removed options prompt a replacement (FR-05, FR-06, FR-10).
- N101, N106: FR-07 entry from e-commerce starts the viewer flow. Owner-entered custom orders are marked "Owner-entered, outside the viewer" and excluded from viewer statistics.
- N107: Owner may attach in-store photos (JPG/PNG, 5 MB, owner-only, private storage). Customers cannot upload reference images.

**Module 2: E-commerce**

- N44, N45, N46, N47, N48: Products have stock quantity (usually 1). Stock 0 sets "unavailable" automatically. An owner-confirmed order reserves a unit. Ready-made orders use the listed price and skip the quotation. Reservation expires after an owner-set deadline and the owner can extend it. Made-to-order products have no limit. FR-13, FR-14, FR-15, FR-19, FR-24 change. The ready-made status sequence is undefined. **Open**
- N81: FR-24 and FR-47: "archive" replaces "remove." Options, products and services are never hard-deleted.
- N19, N20: FR-17 and FR-30 reworded. Online proof applies to transfers and in-store entry applies to cash. Payment account settings and the refund policy are shown on the quotation page.
- N21: Proof lifecycle: Pending verification, Verified, Rejected with reason.
- N22: Reference numbers cannot be reused. Add to FR-17 and the validation NFR.
- N25, N26, N28: Cancellation before verified down payment needs no settlement. After it, the request goes to the owner (FR-22, FR-33). Payment record gets a settlement outcome: Refunded in full, Refunded in part (amount, reason), Retained (reason).
- N82, N83: Quotations carry a validity period (owner default, e.g. 7 days). Keep it separate from reservation expiry.
- N85, N86, N87, N88, N90: Claim code on the order page and email. Owner checks code and ID. A representative needs code, written authorization and own ID. Owner records recipient, date and balance paid. Warn and require confirmation if balance is not zero. Unclaimed-item period (e.g. 30 days) with reminders, then "Unclaimed, owner's discretion." Owner-created profiles use the same release record without a code. The code must be unguessable and unique.

**Module 3: Services**

- N15, N16: Service sequence: Submitted, Received, Under assessment, Quotation issued, Quotation accepted, Down payment verified, In progress, Completed, Ready for claiming, Claimed. Declined branch: Quotation declined, "Declined, item to be returned," Claimed. Preliminary estimate range is optional and non-binding. Only the post-inspection quotation is binding.
- N14: FR-37 draft-then-submit pattern assumed but not confirmed. **Open**

**Module 4: Chatbot**

- N8, N9, N12: Chatbot fills the viewer's option fields (type, material, color, gemstone, size) from owner-configured options plus free-text notes. Confirmation in chat saves a Draft only. Submission needs a second explicit confirmation or a viewer submit. The bar on touching designs applies to geometry only. Draft is visible only to the customer. No owner notification until submission.
- N39, N43: Accepts English, Filipino and Taglish. Replies in the customer's language. The interface stays in English. Draft fields use English option names. Scope detection must work in all three. Remove "Filipino or Taglish out of scope" from the NFR.
- N100, N103: Chatbot recognizes unsupported pieces, says the platform covers rings only, and refers to the store.
- N51: Grounding by live database read each turn: products, services, options and rates, refund policy, owner-editable Store Information and FAQ.
- N53, N54, N55: Transcripts linked to the customer, kept 90 days, visible to owner and account holder. Per-customer hourly rate limit and maximum message length. Privacy notice says the owner can read transcripts.

**General / administration**

- N30, N31, N33: Owner can create customer profiles (name and contact number only, no login), and orders and requests for them. Linking to a later account is manual, never automatic. FR-41, FR-42 get an exception. Consent for these profiles is undefined. **Open**
- N67, N68, N69: Owner account created by proponents at handover. Public registration cannot produce an owner. Role field not client-writable. Owner requires TOTP two-factor. Recovery by recovery email and one-time backup codes on paper. Lost-device requirement missing. **Open**
- N47: FR-47 gains payment account settings, refund policy, quotation validity, reservation deadline, unclaimed-item period, Store Information and FAQ.
- N73, N74, N77: FR-50 adds email alerts (via Resend) for new order, submitted custom order, service request, payment proof and cancellation request. Add a daily digest and a pending-actions dashboard count. Alert emails show a short summary and a link, with no payment proof or full contact details.
- N21, N26, N48: FR-49 adds notifications for proof rejected, cancellation outcome, reservation expiring and expired, quotation expiry, claim code.

## 5. Non-functional requirements

- N2, N4: Model-file NFRs (load of base model, 5 MB per model) do not fit procedural generation. Reword to time to first render and a total viewer asset budget, with the limit applying to textures and environment maps.
- N36, N95: Uptime and backup targets conflict with free tiers during evaluation. Run evaluation on a paid Supabase plan or limit targets to production. Name an uptime monitor. **Open**
- N54: Add chatbot rate limits to the Performance NFR and security tests.
- N68: Add TOTP for the owner. Review the 30-minute session for owner use. **Open**
- N90: Claim code in the Security NFR.
- N107: Upload rules: payment proof JPG/PNG/PDF; owner photo JPG/PNG only.
- N22: Reference number uniqueness in the validation NFR.
- N39, N40: Usability NFR drops English-only text. Test set includes a defined Filipino/Taglish share (e.g. 30%).
- N105, N114: Maintainability NFR covers options and rates only. New ring styles need a developer and are outside the study.
- N98: Functional Suitability configurations cover rings.
- N63: Redo the "100% of Must" criterion after re-grading.

## 6. Architecture, tools, ERD, flowcharts (3.10 to 3.13)

- N34, N35: State two environments. Development and evaluation use free tiers. Production uses Vercel Pro, Supabase Pro and a paid Gemini plan. Reword Table 4 justifications. Verify provider terms before stating them.
- N52: Add a database-read step before each Gemini call in Figure 5 and Figure 10.
- N73: Section 3.10 Resend description covers owner alerts too.
- N68, N67: Supabase Auth justification mentions TOTP. Row Level Security must stop role changes.
- N2, N3: Table 4 gets the procedural-3D description.
- Figures to check against the notes: Figures 5, 6 (ERD), 7, 8, 9, 10. ERD needs: profile without auth account, role field, Draft state, snapshot fields, archive flags, settlement fields, "released to," claim code, source field on orders, chat transcripts and retention, stock and reservation fields. **Open**

## 7. Testing (3.14)

- N93: Add a separate table of measured test evidence (uptime, defect log, restore test, OWASP results, TC-10).
- N68: Security tests cover TOTP.
- N40, N43: TC-07 and TC-08 cover Filipino and Taglish.
- N54: Test rate limits.

## 8. Ethics, privacy, handover (3.15, Phase 7, Step 8)

- N31: Consent capture for owner-created profiles. **Open**
- N37, N55: Chatbot notice must be accurate per environment (free tier may use chat text to improve products) and say the owner can read transcripts.
- N53: Add 90-day chat retention.
- N61: Baseline and trial data contain no customer names.
- N72: "No other system role exists" is a deliberate design choice.
- N70, N111, N113: Handover checklist. Transfer Vercel, Supabase, Gemini and Resend accounts to the owner and remove proponents' access. Decide holders for Cloudflare Turnstile and GitHub. Transfer source code to a repository the owner controls. Add maintenance guide (renew accounts, Gemini model retirement, restore from backup). **Open:** license wording and school policy on ownership.
- N115: Separate study data handling from live-system data handling. Provide the owner a one-page guide on data requests and breach reporting. **Open:** National Privacy Commission registration.
- N38: No fallback if the owner refuses the hosting cost.
- N78: Estimate Resend volume and cost.

## 9. Open items

**Owner interview**

- N7: Real order of design approval, price agreement and down payment.
- N17: Does the owner quote without seeing the item? Inspection fee on a decline?
- N23: Which payment channels? Is GCash the main one?
- N27: Is part of the down payment non-refundable once casting starts?
- N29: Is the down payment sometimes zero?
- N38: Will the owner accept the monthly hosting cost?
- N50: One-of-a-kind pieces or multiples? How long are items held?
- N60: Can the owner log 1 to 2 weeks of baseline data?
- N66: Will the owner commit to the full Capstone 1 to 4th-year span?
- N87: Current practice for unclaimed items.
- N99: Which jewelry type sells most?
- N104: Share of custom orders that are plain, solitaire or side-stone rings.
- N5, N97: Owner's pricing method, plus materials, karats and stone lists.

**Ask Sir Jonas**

- N64, N65: Deadline and what Capstone 1 must deliver.
- N112: Confirm the 3-month support period.
- N111: School policy on ownership of capstone work.

**Team decisions**

- N13, N14: Draft retention and deletion for custom and service drafts.
- N24: Reuse of a reference number after a Rejected proof.
- N33: Manual-match rule details for profile linking.
- N45, N46, N47: Ready-made status sequence, price-adjustment acceptance, double-order handling (recommend blocking placement when an unconfirmed order exists on the last unit).
- N49, N82: Quotation validity (7 days proposed) and what a refreshed quotation does to status.
- N53: Confirm 90-day retention. Do drafts outlive transcripts?
- N54: Rate limit numbers.
- N58, N109: Baseline log format and trial scenarios, including owner-entered orders.
- N63: Do the re-grading.
- N68, N69: Owner session timeout, lost-device recovery.
- N70: Holder of Turnstile and GitHub.
- N84: Row Level Security for archived records.
- N89: Record of a representative's authorization.
- N90: Claim code format and expiry.
- N110: Owner-recorded cancellation for profiles without accounts.
- N36, N95: Free-tier evaluation conflict, uptime monitor.

**Verify externally**

- N35: Vercel Hobby, Supabase free tier and Gemini free tier terms.
- N115: National Privacy Commission registration.

## 10. Not yet covered

- Reading the flowchart, ERD and architecture images against these notes.
- Respondent recruitment (can 20 qualified customers be found without owner selection bias?).
- Chapter 2 wording that still describes the old design.
- Terms of use page.
