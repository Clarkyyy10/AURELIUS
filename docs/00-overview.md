# AURELIUS Overview

**AURELIUS** is a web platform for Afable's Jewelry Store in Montalban Public Market, Rizal. It combines 3D ring customization, e-commerce, jewelry and watch service management, and an AI chatbot. A single owner runs the store and is the system administrator. This is a BSIT capstone project (FEU Roosevelt Marikina).

> Status: the manuscript is a draft. This overview follows the manuscript plus the grill-me decisions in `manuscript/aurelius-change-notes.md` (N1 to N115). Where they differ, the decisions win. Items still waiting on the owner interview or the adviser are marked **Open**.

## Users

| Role | Notes |
| --- | --- |
| Customer | Registers with a verified email. Customizes rings, orders, requests services, tracks status, uses the chatbot. |
| Owner (administrator) | Single operator. Created by the proponents at handover. Requires TOTP two-factor. No delegate role. |
| Walk-in profile | Created by the owner for customers without accounts. Name and contact number only, no login, no online tracking. |

## Modules

1. **Transaction core (built first):** product catalog, ready-made orders, quotations, payment recording, order and service status tracking, claim codes, release records.
2. **Service management:** service catalog, requests, inspection, binding quotation, status from drop-off to claiming.
3. **3D design customization (built in parallel):** procedural ring viewer in React Three Fiber, version 1 with a plain band, a solitaire and a side-stone style. Estimated weight and price are itemized.
4. **AI chatbot:** Gemini 2.5 Flash. English, Filipino and Taglish. Answers from live database content. Saves drafts only. Never gives binding prices.

## Key rules

- Custom orders are limited to what the viewer supports (rings). The owner can enter any other piece as an "Owner-entered, outside the viewer" order.
- The final price exists only in the quotation. Estimates are non-binding.
- Payments are cash or manual transfer, recorded and verified by the owner. No payment gateway. The system never moves money.
- Customers pick up items in the store. No delivery or courier tracking.
- Submitted designs and issued quotations keep an itemized snapshot of the rates. Records are archived, never hard-deleted.

## Stack

Next.js, React, TypeScript, Tailwind and shadcn/ui, Three.js with React Three Fiber and Drei, Prisma, Supabase (PostgreSQL, Auth, Storage), Gemini API, Resend, Cloudflare Turnstile, Vercel, pnpm, Node 22 LTS. See `05-tech-stack.md`.

## Document map

| File | Content |
| --- | --- |
| `01-requirements.md` | FR-01 to FR-50 and the NFR table |
| `02-architecture.md` | Architecture (3.10, Figure 5) |
| `03-erd.md` | Entity relationship diagram (3.11, Figure 6) |
| `04-flowcharts.md` | Flowcharts (3.12, Figures 7 to 10) |
| `05-tech-stack.md` | Tools and versions (3.13) |
| `06-testing.md` | Testing and evaluation (3.14) |
| `07-ethics-privacy.md` | Ethics and data privacy (3.15) |
| `08-decisions.md` | Decision log |
| `09-owner-data.md` | Owner data template |
| `10-sprint-plan.md` | Scrum phases and sprints |
| `../CONTRIBUTING.md` | Git and review rules |

## Open blockers

- Deadline and Capstone 1 deliverables (ask Sir Jonas).
- Owner interview: pricing method, payment channels, refund policy, hosting cost acceptance, best-selling jewelry type.
- Re-grading the 44 Must requirements into a smaller core.
