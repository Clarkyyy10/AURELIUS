# Decision Log

Each entry records a decision, the reason, and where it came from. "Manuscript" means the draft manuscript. "Grill" means the grill-me session (note numbers in `manuscript/aurelius-change-notes.md`). Status is **Decided** or **Provisional** (waiting on the owner interview or the adviser).

## Stack and platform

| ID | Decision | Reason | Source | Status |
| --- | --- | --- | --- | --- |
| D-01 | Use **Supabase** (PostgreSQL, Auth, Storage). | One service covers the database, email verification, password reset, sessions, roles and private file storage. Transactions keep balances correct. Suits a team of five with no ops staff. | Manuscript 3.10, 3.13 | Decided |
| D-02 | Use **Gemini 2.5 Flash** for the chatbot. | Low cost, handles Filipino and Taglish, called only from the server so the key stays private. The model will be retired on Google's schedule, so the maintenance guide covers replacement. | Manuscript 3.13, N113 | Decided |
| D-03 | Use **pnpm** (12.22.0). | Fast, saves disk space, works with Vercel builds. | Manuscript 3.13, scaffold request | Decided |
| D-04 | Use **Cloudflare Turnstile** on login, registration and password reset. | Blocks bots without a puzzle for most users. | Manuscript 3.10 | Decided |
| D-05 | **No payment gateway.** Payments are cash or manual transfer, recorded and verified by the owner. | Matches the stated limitation and the store's current practice. The system never moves money. | Manuscript 1.4.2, N19, N25 | Decided. Channels **Open** (owner interview). |
| D-06 | **No delivery or courier tracking.** Items are claimed in the store. | The store has no staff and finished items are claimed in person. | Manuscript 1.4.2 | Decided |
| D-07 | Scaffold versions: Next.js 16.4.6, React 19.3.1, Tailwind 4.3.5, pnpm 12.22.0, Prisma 7.10.1, Node 22 LTS. | Chosen by the team. Prisma 7.10.1 differs from the manuscript's 6. Verify each version before install. | Scaffold request | Decided |
| D-08 | Free tiers for development and evaluation. Paid tiers (Vercel Pro, Supabase Pro, paid Gemini) for production. The owner pays and takes over the accounts. | Free tiers conflict with commercial use, backups, uptime and chat data use. Provider terms are unverified. | N34, N35, N36, N38 | Provisional. Owner has not agreed to the cost. |
| D-09 | No vector store. The chatbot reads live database content into the prompt each turn. Call it grounding by retrieval from the store's database, not RAG. | The data is small. A vector store adds cost and complexity. | N51 | Decided |

## Scope and product

| ID | Decision | Reason | Source | Status |
| --- | --- | --- | --- | --- |
| D-10 | Build the **transaction core first**. The 3D viewer runs in parallel and ships small. | The e-commerce and service flows are the store's core value. The manuscript's "3D first" plan risks leaving nothing built if the viewer runs long. | N62 | Decided |
| D-11 | The 3D viewer is **procedural**, generated in code with React Three Fiber. No stored model files. No Blender. | The team cannot model pieces. The stack already supports it. Size and stone changes update the geometry directly. | N1, N2 | Decided |
| D-12 | Version 1 covers **rings only**: plain band, solitaire, side stones. Pendants if time allows. Bracelets and necklaces are future work. | Rings are the simplest procedural geometry and ring size is well defined. | N96 | Provisional until the owner says which type sells most (N99). |
| D-13 | Custom orders are limited to what the viewer supports. The owner can enter any other piece as an "Owner-entered, outside the viewer" order. | Keeps the platform honest about what it covers and the records complete. | N101, N106 | Decided |
| D-14 | Weight and price: metal weight = parametric volume x density. Gemstone weight from an owner lookup. Price = metal + stones + labor + finishing, itemized. | The manuscript never gave the formula. | N5 | Provisional until the owner's pricing method is confirmed. |
| D-15 | The final price exists only in the quotation. A declined quotation ends the order. | FR-08, FR-11 and FR-15 conflicted. | N6 | Provisional until the owner interview (N7). |
| D-16 | Chatbot saves a **Draft** only. Submission needs a second explicit confirmation or a viewer submit. The owner sees nothing before submission. | Matches FR-36's rule and the edit-before-review wish. | N8, N11, N12 | Decided |
| D-17 | The chatbot fills option fields from owner-configured options. It never generates geometry. | The FR-36 bar was about geometry. | N8 | Decided |
| D-18 | The chatbot accepts English, Filipino and Taglish. The interface stays English. | The store's customers likely write Taglish. | N39 | Decided |
| D-19 | Service flow is two-stage. The binding quotation comes only after inspection. A preliminary range is optional and non-binding. | The owner inspects before quoting. | N15, N16 | Decided. Quote-without-seeing and inspection fee **Open**. |
| D-20 | Ready-made products have a stock quantity. Orders reserve one unit on owner confirmation and expire after an owner-set deadline. They skip the quotation. | Single-unit pieces need protection against double orders. | N44 to N48 | Decided. Status sequence **Open**. |
| D-21 | Records keep a snapshot of rates and the estimate on submission and on each quotation. Options, products and services are archived, never deleted. Quotations expire after an owner-set validity period. | Rates change often. History must stay readable. | N79 to N82 | Decided |
| D-22 | The system records refund outcomes only. The owner decides. A fixed written policy shows on the quotation page. | The system never moves money. | N25 to N27 | Decided. Policy content **Open**. |
| D-23 | The owner can create profiles and records for customers without accounts. Linking to a later account is manual. | Walk-ins and phone customers are the store's main workflow. | N30, N33 | Decided. Consent capture **Open** (N31). |
| D-24 | Claim code, owner checks code and ID, recorded release, warning on non-zero balance, unclaimed-item reminders. | High-value items need controlled release. | N85 to N88 | Decided. Period and code format **Open**. |
| D-25 | Owner account: created by proponents at handover, TOTP required, backup codes on paper. No delegate role. | One account holds all sensitive data. | N67 to N69 | Decided |
| D-26 | Owner gets email alerts and a daily digest through Resend. No SMS or push (future work). No promised response time. | The owner is often away from the app. | N73 to N76 | Decided |
| D-27 | Keep rating Reliability and Security with reworded items. Report measured evidence separately. Do not average perceived and measured scores. | Respondents can only judge perceived quality. | N91 to N94 | Decided |
| D-28 | Add an owner workload baseline and a timed trial to the evaluation. | The objectives promise reduced workload. | N56, N57 | Decided. Logging commitment **Open**. |
| D-29 | Transfer code, accounts and a maintenance guide to the owner at handover. Bug-fix support for 3 months, no service level. | Clear ownership after the capstone. | N111 to N115 | Provisional. Confirm 3 months with Sir Jonas. |

## Pending decisions

- Deadline, Capstone 1 deliverables, sprint count (ask Sir Jonas).
- Re-grading the 44 Must requirements (N63).
- Draft retention, ready-made status sequence, quotation validity default, claim code format, rate limit numbers, owner session timeout, lost-device recovery.
- Free-tier evaluation versus paid Supabase (N36).
- Holder of Turnstile and GitHub after handover (N70).
