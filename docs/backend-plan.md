# AURELIUS — Phase 2 Backend Plan (do NOT build during Phase 1)

Phase 2 replaces the mock repositories in `src/lib/data/mock/` with Supabase implementations and
adds the real chatbot. Pages and components should not need to change.

## Steps (one Claude Code session each)
1. **Supabase project + schema.** Tables mirroring `data-model.md` (profiles, store_settings,
   product_type_options, material_options, finish_options, gemstone_options, cut_options,
   size_options, products, service_catalog, custom_order_requests, design_versions,
   revision_remarks, product_orders, service_requests, quotations, payments, status_history,
   notifications, chatbot_knowledge, consent_log). SQL migrations in `supabase/migrations/`, seed
   script from `seed.ts`.
2. **Row Level Security.** Customers: read/write only rows where `customer_id = auth.uid()`, and only
   allowed status changes (cancel, accept/decline, resubmit, submit payment). Owner (`role = 'owner'`
   in profiles): full access. Public: read non-hidden products, services, active options. Test with
   two customer accounts and direct API calls (NFR: direct URL and request manipulation).
3. **Auth.** Supabase Auth email + password: email confirmation required (FR-41), password reset
   (FR-43), minimum 8 characters. Middleware protects `/account` and `/admin`. Owner role assigned
   manually. Add: idle logout after 30 minutes, and a login-attempt table + check that blocks login
   for 15 minutes after 5 failures (NFR). Record consent timestamp at sign-up (FR-45).
4. **Status changes on the server.** Next.js server actions (or Postgres functions) that validate
   transitions with `src/lib/status/` and write the record + status_history + notifications in one
   transaction (NFR transaction integrity). Re-validate all inputs with the same zod schemas.
5. **Storage.** Private buckets: `payment-proofs` (JPG/PNG/PDF ≤ 5 MB, checked on the server, served
   via signed URLs to the owner and the uploader only), `service-photos`; public bucket
   `product-photos`; `models` for future `.glb` files (≤ 5 MB each).
6. **Notifications.** Insert rows server-side; Supabase Realtime subscription updates the bell.
   Customer emails (FR-49) through an email provider (e.g. Resend or Supabase SMTP) from the same
   server action.
7. **Chatbot (Claude API).** Route `POST /api/chat` (server only; API key in env). System prompt =
   store scope, rules (no binding prices/dates, refer out-of-scope to the owner, plain English) +
   active options and services + `chatbot_knowledge` entries. One tool, `create_draft_request`
   (kind, fields) → returns a draft the UI shows as the draft card. Never send customer personal data;
   send only the conversation text. Use a current Claude Haiku model for speed and cost; set a monthly
   spend limit in the Anthropic Console; rate-limit per user. Keep the `ChatResult` interface from
   the front-end spec. Build the ≥ 50-query test set in `tests/chatbot/` and a script that scores it.
8. **Hardening.** Security headers, HTTPS, OWASP Top 10 checklist, input sanitization, error logging.
9. **Deploy.** Vercel + Supabase. Check plan terms for a live business deployment (Vercel Hobby is for
   non-commercial use; Supabase Free pauses after a week of inactivity). Enable daily backups (≥ 7 days)
   and perform one restore test (NFR).
10. **Real 3D models (optional upgrade).** Replace procedural models with optimized `.glb` files
    (meshes named `metal` and `stone*`, Draco/meshopt compressed, ≤ 5 MB) via `modelUrl`.
