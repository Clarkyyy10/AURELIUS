# AURELIUS — System Requirements

Taken from Chapter 3 (3.9) of the AURELIUS manuscript. Users: **Customer** and **Owner** (the owner is
also the system administrator). Phase column: **P1** = built in the front-end phase with mock data;
**P2** = needs the backend (Supabase / Claude API / email) to be fully real. P1 items marked "UI" are
built as working screens in Phase 1 and wired to real services in Phase 2.

## 1. Functional Requirements

### Module 1 – 3D Design Customization
| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-01 | The system shall allow customers to select the jewelry material (e.g., gold, silver, stainless steel) from a predefined list set by the owner. | Must | P1 |
| FR-02 | The system shall allow customers to select the jewelry color or finish (e.g., yellow gold, white gold, rose gold) from the available options. | Must | P1 |
| FR-03 | The system shall allow customers to select the gemstone type, cut, and quantity from a predefined list set by the owner. | Must | P1 |
| FR-04 | The system shall allow customers to select the jewelry size (e.g., ring size, bracelet length, necklace length) from the available options. | Must | P1 |
| FR-05 | The system shall display the customized jewelry design in a 3D viewer that updates whenever the customer changes an option. | Must | P1 |
| FR-06 | The system shall compute and display an estimated weight and price from the customer's selected options and the rates configured by the owner and shall label them as estimates subject to the owner's final confirmation. | Must | P1 |
| FR-07 | The system shall allow customers to submit a custom order request with their design specifications for the owner's review, either directly from the 3D viewer or through the e-commerce module. Both entry points shall create the same single request record. | Must | P1 |
| FR-08 | The system shall allow the owner to review a submitted custom order request and to confirm, revise, or reject the final price and design before production. | Must | P1 |
| FR-09 | The system shall allow the owner to request design revisions with written remarks and shall notify the customer of the requested changes. | Must | P1 |
| FR-10 | The system shall allow the customer to view the owner's revision remarks, adjust the design in the 3D viewer, and resubmit it for review. | Must | P1 |
| FR-11 | The system shall allow the owner to approve a custom order design, after which the order proceeds to quotation and production. | Must | P1 |

### Module 2 – E-Commerce
| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-12 | The system shall allow customers to browse a catalog of jewelry products showing photos, descriptions, materials, and prices. | Must | P1 |
| FR-13 | The system shall display an availability status for each product (available, made to order, or unavailable) and shall prevent orders for products marked unavailable. | Must | P1 |
| FR-14 | The system shall allow customers to place an order for an available ready-made jewelry product. | Must | P1 |
| FR-15 | The system shall allow the owner to issue a quotation for a customer's order or custom-order request, specifying the final price, the down payment required (if any), and the expected completion date. | Must | P1 |
| FR-16 | The system shall allow customers to view a quotation issued by the owner and to accept or decline it. | Must | P1 |
| FR-17 | The system shall allow customers to submit payment details (amount, date, reference number) and upload an image of the proof of payment (e.g., receipt or transfer screenshot) for a down payment or full payment. | Must | P1 (upload stored locally in P1, Supabase Storage in P2) |
| FR-18 | The system shall allow the owner to verify and record payments and outstanding balances for each order. | Must | P1 |
| FR-19 | The system shall allow customers to track the status of their orders (e.g., pending, confirmed, in production, ready for claiming). | Must | P1 |
| FR-20 | The system shall allow the owner to update the status of each order. | Must | P1 |
| FR-21 | The system shall allow the owner to view, manage, and maintain records of all orders, quotations, and payments. | Must | P1 |
| FR-22 | The system shall allow customers to cancel an order or custom-order request that has not yet been confirmed or started in production and shall notify the owner. Later cancellations are referred to the owner. | Should | P1 |
| FR-23 | The system shall allow customers to view the history of their own orders, custom-order requests, quotations, and payments. | Should | P1 |
| FR-24 | The system shall allow the owner to add, edit, hide, and remove products (photos, description, material, price, and availability status) through the administrator interface. | Must | P1 |

### Module 3 – Service Management Platform
| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-25 | The system shall display a service catalog listing the available jewelry and watch services (e.g., cleaning, polishing, resizing, repair, stone setting, restoration, engraving, casting, plating, ultrasonic cleaning) with descriptions. | Must | P1 |
| FR-26 | The system shall allow customers to submit a service request specifying the item to be serviced, the type of service needed, and relevant item details. | Must | P1 |
| FR-27 | The system shall allow the owner to review a submitted service request and issue a service quotation with the estimated cost, proposed procedure, and expected completion or retrieval date. | Must | P1 |
| FR-28 | The system shall allow customers to view the service quotation and to accept or decline it before work begins. | Must | P1 |
| FR-29 | The system shall allow the owner to record and update the progress status of each service request from drop-off to claiming (e.g., received, under assessment, in progress, completed, ready for claiming). | Must | P1 |
| FR-30 | The system shall allow the owner to record the down payment collected at drop-off and the remaining balance to be settled upon claiming. | Must | P1 |
| FR-31 | The system shall allow customers to track the status of their service requests. | Must | P1 |
| FR-32 | The system shall allow the owner to view and manage records of all service requests, quotations, and payments. | Must | P1 |
| FR-33 | The system shall allow customers to cancel a service request before the owner begins work on it and shall notify the owner. | Should | P1 |
| FR-34 | The system shall allow the owner to add, edit, and hide service catalog entries (name and description) through the administrator interface. | Must | P1 |

### Module 4 – AI-Powered Chatbot
| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-35 | The system shall provide an AI-powered chatbot accessible to customers within the platform. | Must | P1 UI + mock, P2 Claude API |
| FR-36 | The chatbot shall guide customers in preparing a custom order request by asking about design preferences, materials, gemstones, and size, and shall pre-fill a draft request that the customer reviews, edits, and confirms. The chatbot shall not submit a request without the customer's confirmation. | Must | P1 mock, P2 |
| FR-37 | The chatbot shall guide customers in preparing a service request by asking about the item, the type of service needed, and relevant details, and shall pre-fill a draft request that the customer reviews, edits, and confirms. The chatbot shall not submit a request without the customer's confirmation. | Must | P1 mock, P2 |
| FR-38 | The chatbot shall answer customer inquiries about the store's available products, services, and service catalog. | Should | P1 mock, P2 |
| FR-39 | The chatbot shall recognize when an inquiry falls outside its defined scope and shall refer the customer to the store owner. | Must | P1 mock, P2 |
| FR-40 | The chatbot shall not provide binding quotations, final prices, or production commitments on behalf of the owner. | Must | P1 mock, P2 |

### General / Administration
| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-41 | The system shall require customers to register with a valid email address and contact number and to verify their email address through a confirmation link before placing orders or submitting requests. | Must | P1 UI (simulated verify), P2 |
| FR-42 | The system shall require customers to log in with their credentials before using transactional features. | Must | P1 UI (mock login), P2 |
| FR-43 | The system shall allow users to reset a forgotten password through a time-limited link sent to their registered email address. | Must | P1 UI, P2 |
| FR-44 | The system shall allow customers to view and update their name and contact details and to change their password. | Should | P1 UI, P2 |
| FR-45 | The system shall present a data privacy notice at registration and require the customer's consent before personal data is collected. | Must | P1 |
| FR-46 | The system shall provide the owner with a secure administrator account to manage products, services, orders, quotations, payments, and system settings. | Must | P1 UI, P2 security |
| FR-47 | The system shall allow the owner to configure the material, color, gemstone, and size options available in the 3D customization module, together with their associated rates. | Must | P1 |
| FR-48 | The system shall maintain a transaction history for each customer, accessible to the owner, covering all orders, service requests, quotations, and payments. | Should | P1 |
| FR-49 | The system shall notify customers through in-app notifications and email of key events: design revision requested, quotation issued, order or service status changed, and item ready for claiming. | Must | P1 in-app (email simulated), P2 email |
| FR-50 | The system shall notify the owner through in-app notifications of new orders, custom-order requests, service requests, and payment submissions. | Must | P1 |

## 2. Non-Functional Requirements

| Category | Requirement | Target / Criterion | Phase |
|---|---|---|---|
| Functional suitability | All Must-priority FRs implemented and verifiable through test cases. | 100% of Must-priority test cases pass before evaluation; unmet Should items go to the backlog. | P1–P2 |
| Functional suitability | The 3D viewer accurately reflects the selected material, color, gemstone, and size. | No discrepancy across every option value tested at least once. | P1 |
| Functional suitability | Estimated weight and price are computed from the formula and owner-set rates. | Equal to the owner's manual computation (nearest peso; 0.01 g) across ≥ 20 configurations covering all materials, gemstones, and sizes. | P1 |
| Functional suitability | Chatbot gives correct, relevant responses within scope. | ≥ 80% of a ≥ 50-query test set correct and relevant; 100% of out-of-scope queries referred to the owner; no estimate presented as a final price or date. | P2 |
| Performance | Standard pages (catalogs, order history) load quickly on broadband. | ≤ 3 s average of 3 runs. | P1–P2 |
| Performance | Standard pages usable on mobile data. | ≤ 5 s on 4G, average of 3 runs. | P1–P2 |
| Performance | 3D viewer load and response. | Base model ≤ 5 s initial load; ≤ 3 s per option change. | P1 |
| Performance | 3D model assets optimized. | Each model file ≤ 5 MB. | P1 |
| Performance | Chatbot response time. | ≤ 5 s per message. | P2 |
| Performance | Concurrent users. | Functional within targets with up to 30 simultaneous users. | P2 |
| Usability | First-time customers complete a custom order and a service request unaided (chatbot allowed). | ≥ 80% of customer respondents. | P1–P2 |
| Usability | Owner processes orders, quotations, and service requests after orientation without developer help. | ≥ 80% of owner-group respondents. | P1–P2 |
| Usability | Rated acceptable by respondents. | Usability mean (WAM) ≥ 3.51; items below 3.51 flagged. | Eval |
| Usability | Clear, plain English; errors say what went wrong and how to fix it. | All text passes a review checklist. Filipino/Taglish input is out of scope. | P1 |
| Reliability | Availability during evaluation. | Uptime ≥ 95%, excluding announced maintenance. | P2 |
| Reliability | No critical failure during testing and evaluation. | No core function inoperable or data lost in the defect log. | P1–P2 |
| Reliability | Transaction integrity when a session ends unexpectedly. | Submissions saved completely or not at all; no partial or duplicate records (orders, quotations, service requests, payments). | P1 (idempotent submit), P2 |
| Reliability | Form validation. | 100% of validation rules enforced with descriptive messages. | P1 |
| Reliability | Recoverable after data loss. | Daily backups kept ≥ 7 days; one restore test before deployment. | P2 |
| Security | Only authenticated users access transactional features. | Unauthenticated access to protected pages redirects to login. | P1 (mock), P2 |
| Security | Admin functions not accessible to customers; customers cannot access others' records. | Role-based access in all modules, including direct URL and request manipulation. | P1 (routes), P2 (RLS) |
| Security | Passwords hashed, never stored or sent in plaintext. | Industry-standard hashing (e.g., bcrypt); minimum 8 characters. | P2 |
| Security | Inputs validated and sanitized on the server. | No injection or XSS when tested against OWASP Top 10 and sample attack inputs. | P2 |
| Security | Encrypted transport. | HTTPS on all pages; HTTP redirects to HTTPS. | P2 |
| Security | Sessions and login attempts controlled. | Session expires after 30 min idle and on logout; login blocked 15 min after 5 failed attempts. | P2 (P1 shows the UI messages) |
| Security | Proof-of-payment uploads restricted. | JPG, PNG, or PDF only, max 5 MB; checked on the server; files cannot be executed. | P1 (client check), P2 (server) |
| Security | Data Privacy Act of 2012 (RA 10173). | Only transaction data collected; consent recorded at registration; personal data visible only to the account holder and the owner. | P1–P2 |
| Compatibility | Browsers. | Core flows pass on current and previous major versions of Chrome, Firefox, Edge, Safari. | P1 |
| Compatibility | Mobile. | All customer and owner workflows completable on a 360 px wide screen. | P1 |
| Compatibility | No WebGL. | Clear message instead of a blank viewer; design options remain usable. | P1 |
| Maintainability | Code organized by module. | Each module in its own directory or component group. | P1 |
| Maintainability | Owner updates content without a developer. | Products, services, 3D options, and rates all managed in the admin interface. | P1 |
