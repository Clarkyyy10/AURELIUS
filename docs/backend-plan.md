# AURELIUS — Phase 2 Backend Plan (do NOT build during Phase 1)

Phase 2 replaces the mock repositories in `src/lib/data/mock/` with Supabase implementations and
adds the real chatbot. Pages and components should not need to change.

**Architecture (manuscript V2 §3.10, §3.13):** serverless three-tier app on Vercel. Next.js API routes
(Node.js 22 LTS) enforce roles, validate every input with zod, compute estimates and talk to the
database through **Prisma ORM** (parameterized queries). **Supabase**: PostgreSQL 16, Auth (email
verification, reset, sessions, roles), Storage (private proof-of-payment bucket, signed links only).
External services called only from the server: **Google Gemini API (Gemini 2.5 Flash)** for the
chatbot, **Resend** for email, **Cloudflare Turnstile** on login, registration and password reset.
Tooling: pnpm, ESLint + Prettier + Husky, GitHub Actions (lint, type-check, build), Vitest +
Playwright. The ERD (manuscript §3.11) names: users, custom_designs, orders, order_items, quotations,
payments, service_requests, chat_sessions, notifications, products, design_options, services.

## Steps (one Claude Code session each)
1. **Supabase project + schema.** Tables mirroring `data-model.md` (profiles, store_settings,
   product_type_options, material_options, finish_options, gemstone_options, cut_options,
   size_options, products, service_catalog, custom_order_requests, design_versions,
   revision_remarks, product_orders, service_requests, quotations, payments, status_history,
   notifications, chatbot_knowledge, consent_log, chat_sessions). Schema and migrations with Prisma
   (`prisma/schema.prisma`), matched to the manuscript ERD; seed script from `seed.ts`.
2. **Row Level Security.** Customers: read/write only rows where `customer_id = auth.uid()`, and only
   allowed status changes (cancel, accept/decline, resubmit, submit payment). Owner (`role = 'owner'`
   in profiles): full access. Public: read non-hidden products, services, active options. Test with
   two customer accounts and direct API calls (NFR: direct URL and request manipulation).
3. **Auth.** Supabase Auth email + password: email confirmation required (FR-41), password reset
   (FR-43), minimum 8 characters, Cloudflare Turnstile on all three forms. Middleware protects `/account` and `/admin`. Owner role assigned
   manually. Add: idle logout after 30 minutes, and a login-attempt table + check that blocks login
   for 15 minutes after 5 failures (NFR). Record consent timestamp at sign-up (FR-45).
4. **Status changes on the server.** Next.js server actions (or Postgres functions) that validate
   transitions with `src/lib/status/` and write the record + status_history + notifications in one
   transaction (NFR transaction integrity). Re-validate all inputs with the same zod schemas.
5. **Storage.** Private buckets: `payment-proofs` (JPG/PNG/PDF ≤ 5 MB, checked on the server, served
   via signed URLs to the owner and the uploader only), `service-photos`; public bucket
   `product-photos`; `models` for future `.glb` files (≤ 5 MB each).
6. **Notifications.** Insert rows server-side; Supabase Realtime subscription updates the bell.
   Customer emails (FR-49) through Resend from the same server action.
7. **Chatbot (Gemini API, Gemini 2.5 Flash).** Route `POST /api/chat` (server only; `GEMINI_API_KEY` in env). System prompt =
   store scope, rules (no binding prices/dates, refer out-of-scope to the owner, plain English) +
   active options and services + `chatbot_knowledge` entries. One function, `create_draft_request`
   (kind, fields) → returns a text draft summary shown in the chat; the customer edits it and must
   explicitly confirm in chat before the request is created (FR-36, FR-37). The chatbot never generates
   or changes 3D designs. Never send customer personal data; send only the conversation text. Show the
   Gemini data notice in the chat (§3.15). Stay within the free tier; rate-limit per user. Keep the `ChatResult` interface from
   the front-end spec. Build the ≥ 50-query test set in `tests/chatbot/` and a script that scores it.
8. **Hardening and tests.** Security headers, HTTPS, OWASP Top 10 checklist, input sanitization, error
   logging. Playwright test cases TC-01 to TC-10 (manuscript Table 6); GitHub Actions runs lint,
   type-check and build on each push.
9. **Deploy.** Vercel + Supabase. Check plan terms for a live business deployment (Vercel Hobby is for
   non-commercial use; Supabase Free pauses after a week of inactivity). Enable daily backups (≥ 7 days)
   and perform one restore test (NFR).
10. **Real 3D models (optional upgrade).** Replace procedural models with optimized `.glb` files
    (meshes named `metal` and `stone*`, Draco/meshopt compressed, ≤ 5 MB) via `modelUrl`.
