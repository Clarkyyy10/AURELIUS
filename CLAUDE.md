# AURELIUS — Project Brief for Claude Code

## What this is

AURELIUS is a BSIT capstone web platform for **Afable's Jewelry Store**, a single-owner jewelry and
watch store in Montalban Public Market, Rizal, Philippines. The owner has no employees, so the
system must reduce, never add to, the owner's workload.

Four modules:

1. **3D Design Customization** (FR-01 to FR-11)
2. **E-Commerce**: catalog, orders, quotations, payment records, tracking (FR-12 to FR-24)
3. **Service Management**: service catalog, requests, quotations, down payments, tracking (FR-25 to FR-34)
4. **AI-Powered Chatbot** (FR-35 to FR-40)
   Plus accounts, admin, and notifications (FR-41 to FR-50).

Source of truth:

- **`docs/manuscript-v2.md` — the AURELIUS manuscript, version 2 (Chapters 1–3). Everything built here
  follows it. When any other doc disagrees with the manuscript, the manuscript wins; update the doc.**
- `docs/requirements.md` — every functional and non-functional requirement (Section 3.9 of the manuscript)
- `docs/frontend-spec.md` — pages, components, flows, mock data
- `docs/design/DESIGN.md` (+ `11-ui-screens.md`, `12-ui-components.md`, `13-ux-content-a11y.md`) — the visual design system and content rules (D-30). It overrides the design-system section of frontend-spec.md: monochrome, Cormorant + Inter, no colour-only states, customer-facing name is "Afable's Jewelry Store" only.
- `docs/data-model.md` — entities, statuses, and the pricing formula with test cases
- `docs/backend-plan.md` — Phase 2 (Supabase + Prisma + Gemini API, manuscript §3.10), NOT built in Phase 1

## Current phase: PHASE 1 — FRONT END ONLY

- Build the complete user interface for customers and the owner, working end to end on **mock data**.
- **No Supabase, no real auth, no real API calls, no real emails in Phase 1.**
- All data goes through the repository layer in `src/lib/data/` (interfaces + a mock implementation
  backed by a persisted client store). Phase 2 swaps the implementation for Supabase without
  changing pages or components.
- A **Demo Mode bar** lets testers switch between Guest, Customer, and Owner, and reset demo data.
- The chatbot runs on a scripted mock with the same interface the real Gemini API route will use.

## Stack

- Next.js (latest stable, App Router, `src/` directory) + TypeScript (strict) + Tailwind CSS
- shadcn/ui (Radix) components, lucide-react icons
- react-hook-form + zod for every form (schemas in `src/lib/validation/`, reused by Phase 2 server code)
- zustand (with persist to localStorage) for the mock data store and UI state
- three + @react-three/fiber + @react-three/drei for the 3D viewer
- date-fns for dates; Vitest + Testing Library for tests
- Phase 2 (manuscript §3.10, §3.13): Supabase (PostgreSQL 16 + RLS, Auth, Storage, Realtime), Prisma ORM 6,
  Google Gemini API (Gemini 2.5 Flash) for the chatbot, Resend for email, Cloudflare Turnstile on login,
  registration and password reset, hosted on Vercel; Playwright for browser tests; GitHub Actions CI

## Folder layout (keep modules separate — maintainability requirement)

```
src/
  app/                      routes (see frontend-spec.md §3)
    (public)/ (auth)/ account/ admin/
  components/
    ui/                     shadcn/ui primitives
    layout/                 header, footer, demo bar, admin shell
    customization/          Module 1: 3D viewer, option panels, estimate card
    ecommerce/              Module 2: product cards, order views, quotation, payments
    services/               Module 3: service catalog, request forms, service views
    chatbot/                Module 4: chat widget, draft card
    shared/                 status badge, timeline, empty states, file upload, money, dates
  lib/
    data/                   repository interfaces + mock implementation + seed data
    pricing/                estimate engine (pure functions) + tests
    status/                 status machines (allowed transitions) + tests
    validation/             zod schemas
    chatbot/                mock chatbot engine (Phase 2: API client)
    utils/
  types/                    shared TypeScript types (mirror docs/data-model.md)
```

## Rules

- Plain, clear English in all user-facing text. Error messages say what went wrong and how to fix it.
- Money is Philippine peso: format as `₱24,026` (no decimals for estimates/prices; payments may show centavos).
- Estimates are always labeled: "Estimate only — final price is confirmed by the owner." (FR-06, FR-40)
- Customers see only their own records; owner screens live under `/admin` and require the owner role.
  In Phase 1 enforce this in the route guards/UI; Phase 2 enforces it with Supabase RLS too.
- No payment gateway. Customers submit amount, date, reference number, and a proof image/PDF
  (JPG/PNG/PDF, max 5 MB); the owner verifies or rejects it.
- Estimated weight and price come from owner-set options and rates (FR-47), never hard-coded in
  components. Use the exact formula and rounding in `docs/data-model.md` §6.
- Status changes only through the status machines in `src/lib/status/` (allowed transitions only).
- Chatbot limits (FR-36 to FR-40): store topics only; never binding prices or dates; refer
  out-of-scope questions to the owner. It shows a text draft summary in the chat that the customer
  reviews, edits and explicitly confirms; it never generates or changes 3D designs and never submits
  without that confirmation. A notice in the chat says Gemini processes the chat text and not to type
  sensitive data (manuscript §3.15).
- Data Privacy Act of 2012: privacy notice + consent at registration (FR-45); collect only what is needed.
- Responsive from 360 px wide. Keyboard accessible. Visible focus states. Alt text on images.
- Every list has loading, empty, and error states. Every destructive action asks for confirmation.
- No external image hotlinks. Use local SVG placeholders in `public/placeholders/`.

## How we work

- Reference FR numbers in commits and code comments where a feature implements a requirement.
- Write tests for pure logic (pricing, status transitions, validation) and run them.
- `npm run build`, `npm run lint`, and `npm test` must pass before calling a task done.
- Commit after each working milestone with a clear message.
- After finishing, explain in simple terms what was built and why, so the team can defend it.
