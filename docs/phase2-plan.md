# AURELIUS — Phase 2 plan (backend) — FOR APPROVAL

Status: **draft, waiting for the team's approval.** Nothing has been created in any database or
service yet. Source of truth: `docs/manuscript-v2.md` (§3.9–3.15). The draft schema is in
`prisma/schema.prisma` (validated with `prisma validate`, not applied).

---

## 1. How the pieces fit (manuscript §3.10)

```
Browser (Next.js pages, unchanged)
  └─ src/lib/data/index.ts  →  repos = "api" implementation   (mock stays for demos and unit tests)
        └─ fetch("/api/…")  — same Repositories interface as today
Next.js API routes (Node.js 22, Vercel serverless)            src/app/api/**
  ├─ requireUser()/requireOwner()  — Supabase session from cookies (@supabase/ssr)
  ├─ zod validation (the same schemas in src/lib/validation)
  ├─ src/server/<module>/*.ts  — business rules: status machines (src/lib/status), estimate
  │     (src/lib/pricing, recomputed on the server), codes, notifications, email outbox
  └─ Prisma ORM → Supabase PostgreSQL 16, every request inside a transaction that runs as the
        signed-in user, so Row Level Security also applies (see §3)
External, server-only: Gemini 2.5 Flash (chat), Resend (email), Cloudflare Turnstile (bot check)
Browser → Supabase directly: only Realtime (new notifications for the bell, read-only, RLS-protected)
```

Why API routes and not direct database calls from the browser: the manuscript puts all rules in the
application layer (role checks, estimate, transitions), keeps keys on the server, and validates
every input on the server (NFR security).

**The front end does not change**, except these shared pieces:

- `src/lib/data/index.ts` chooses `api` or `mock` from `NEXT_PUBLIC_DATA_SOURCE`.
- `FileDropzone` / `StoredImage` / proof thumbnails upload to `/api/uploads` and show files through
  short-lived signed links (today they use the browser's IndexedDB). `ProofFile` gains a `path`.
- `useQuery` refetches after each change and when a Realtime notification arrives (today it watches
  the mock store).
- The Demo Mode bar and the simulated email outbox only appear when `NEXT_PUBLIC_DATA_SOURCE=mock`.
- The chat widget calls `/api/chat` (same `ChatResult`).

## 2. Database (ERD §3.11) — `prisma/schema.prisma`

| ERD table        | What it holds                                                                                                                                           | Notes                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| users            | role, name, email, contact number, consent time + notice version                                                                                        | `id` = Supabase Auth user id; passwords live in `auth.users` (bcrypt)                                                    |
| products         | catalog (FR-12, FR-13, FR-24)                                                                                                                           | photos are storage references                                                                                            |
| services         | service catalog (FR-25, FR-34)                                                                                                                          |                                                                                                                          |
| design_options   | all 3D options and rates: piece types, materials, finishes, gems, cuts, sizes, fonts, chain styles, clasps, styles/settings/band shapes/shanks/textures | one table with `kind` + validated `attributes`; read back as today's `CustomizationOptions`, so the formula is unchanged |
| orders           | product orders **and** custom-order requests (`kind`)                                                                                                   | one record per request (FR-07); `client_request_id` unique → no duplicates                                               |
| order_items      | product, price, photo at order time                                                                                                                     |                                                                                                                          |
| custom_designs   | every submitted design version                                                                                                                          | estimate recomputed on the server; snapshot in a private bucket                                                          |
| quotations       | order or service quotations                                                                                                                             | re-issued ones kept with `is_current = false`                                                                            |
| payments         | submitted/recorded payments                                                                                                                             | proof in private bucket, signed links only                                                                               |
| service_requests | FR-26 to FR-33                                                                                                                                          | services in `service_request_services`                                                                                   |
| notifications    | in-app bell (FR-49, FR-50)                                                                                                                              | Realtime                                                                                                                 |
| chat_sessions    | **decision needed** (§6)                                                                                                                                |                                                                                                                          |

Support tables (not drawn in the ERD, needed by existing features): `status_history`,
`revision_remarks`, `service_request_services`, `code_counters`, `login_attempts`, `email_outbox`,
`rate_limits`, `faqs`, `store_settings`. Money `numeric(12,2)`, weights `numeric(10,2)`, dates in UTC
with display in Asia/Manila.

The mock's chatbot "drafts" table is **not** carried over: since D-27 drafts live only in the chat.

## 3. Row Level Security (NFR security, manuscript §3.15)

Defence in two layers: (1) every API route checks the role and ownership in code; (2) every query
runs inside a transaction that sets `role authenticated` and the user's JWT claims, so Postgres RLS
policies also apply. Only the seed script, the email job and server-only tables use the privileged
connection.

| Tables                                                                                                                                  | Customer                                                                 | Owner              | Guest               |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------ | ------------------- |
| users                                                                                                                                   | read/update own row (name, contact)                                      | read all           | —                   |
| products, services, design_options, faqs, store_settings                                                                                | read visible/active                                                      | full               | read visible/active |
| orders, order_items, custom_designs, revision_remarks, quotations, payments, service_requests, service_request_services, status_history | read own; insert own; no direct update (changes go through server rules) | full               | —                   |
| notifications                                                                                                                           | read/mark-read own                                                       | read/mark-read own | —                   |
| chat_sessions                                                                                                                           | — (server writes)                                                        | read               | —                   |
| login_attempts, email_outbox, code_counters, rate_limits                                                                                | —                                                                        | —                  | — (server only)     |

Storage buckets: `payment-proofs`, `service-photos`, `design-snapshots` private (owner + uploader,
files under `<user id>/…`, signed links ≤ 5 min); `product-photos` public read, owner write. Server
checks type by file signature (not just extension) and size ≤ 5 MB; files are served with
`Content-Disposition` and never executed.

## 4. API routes (all JSON, zod-validated, role-checked)

- **Auth** `POST /api/auth/{register,login,logout,resend-verification,forgot-password,reset-password}`,
  `GET /auth/confirm` (email links), `GET /api/auth/session`, `PATCH /api/account/profile`,
  `POST /api/account/password`
- **Catalog** `GET/POST /api/products`, `GET/PUT/DELETE /api/products/[id]`, `GET/POST /api/services`,
  `PUT /api/services/[id]`, `POST /api/services/[id]/move`
- **Options** `GET/PUT /api/options`, `GET /api/options/used`
- **Custom orders** `GET/POST /api/custom-orders`, `GET /api/custom-orders/[id]`,
  `POST /api/custom-orders/[id]/{resubmit,review,revision,approve,reject}`
- **Orders** `GET/POST /api/orders`, `GET /api/orders/[id]`, `POST /api/orders/[id]/reject`
- **Service requests** `GET/POST /api/service-requests`, `GET /api/service-requests/[id]`,
  `POST /api/service-requests/[id]/drop-off`
- **Shared** `GET /api/transactions`, `POST /api/transactions/[kind]/[id]/{status,quotation,quotation-response,cancel}`
- **Payments** `POST /api/transactions/[kind]/[id]/payments` (customer, multipart),
  `POST …/payments/record` (owner), `POST …/payments/[pid]/{verify,reject}`
- **Files** `POST /api/uploads`, `GET /api/files?ref=…` (signed-link redirect after an access check)
- **Notifications** `GET /api/notifications`, `POST /api/notifications/[id]/read`, `POST /api/notifications/read-all`
- **Admin** `GET/PUT /api/settings`, `GET/POST /api/faqs`, `PUT/DELETE /api/faqs/[id]`,
  `GET/PUT /api/policies`, `GET /api/customers`, `GET /api/customers/[id]`
- **Chat** `POST /api/chat`
- **Jobs** `GET /api/cron/email-outbox` (Vercel Cron, secret-protected), `GET /api/health`

## 5. Auth details (FR-41 to FR-46, NFR security)

- Supabase Auth (email + password, bcrypt). Sign-in, sign-up and reset go through our API routes
  so the server can check **Turnstile** and the **lockout** (5 failures → blocked 15 minutes, stored
  per email in `login_attempts`; reset on success) before calling Supabase.
- Email verification and reset emails are sent by Supabase Auth through **Resend SMTP** with our
  wording; reset links expire after 1 hour. Orders/requests stay blocked until the email is verified.
- **30-minute idle logout**: `src/proxy.ts` (Next.js 16's name for middleware) keeps a signed
  last-activity cookie; after 30 minutes without activity the session is signed out and the user
  is sent to login with a message. Logout revokes the Supabase session.
- Owner account: you create it in the Supabase dashboard; `pnpm seed:owner` gives it the owner role.
- Consent: registration requires the privacy-notice checkbox; we store the time and notice version.

## 6. Decisions needed before building

1. **chat_sessions vs D-12.** The ERD has `chat_sessions`, but D-12 says chats are never saved.
   - **A.** Save full conversations for signed-in customers (30-day retention, "delete my chats").
   - **B. (recommended)** Save only session metadata (time, message count, drafts sent, referrals
     to the owner, fallback use) — no message text. Meets the ERD with the least personal data.
   - **C.** Drop `chat_sessions` and explain it in the manuscript.
2. **Gemini free tier and privacy.** On the free tier Google may use prompts and answers to improve
   its products, and people may review them. The chat sends no account data, and the notice already
   says Gemini processes the chat, but for the live store the paid tier (pay-as-you-go, low cost at
   this volume) avoids this. Free tier is fine for development and the evaluation if the notice is
   updated to say so.
3. **Email domain.** Resend only delivers to other people's inboxes from a verified domain you own
   (about ₱600–₱900 per year). Without one, emails reach only the Resend account owner's inbox —
   enough for testing, not for customers.
4. **Backups (NFR: daily, kept 7 days, one restore test).** Supabase Free has no daily backups.
   - **A. (recommended, free)** A nightly GitHub Actions job saves a database dump kept 7 days; I
     write and run the restore test.
   - **B.** Supabase Pro (US$25/month) includes daily backups.
5. **Hosting terms.** Vercel Hobby is for non-commercial use: fine for development and the capstone
   evaluation; a live business deployment needs Vercel Pro (US$20/month) or another host. Supabase
   Free pauses a project after a week without activity.
6. **Tooling from the manuscript (§3.13):** switch npm → **pnpm**, add **Prettier + Husky** (checks
   before each commit) and **GitHub Actions**. This needs a **GitHub repository** (none is connected
   yet). Versions: the manuscript lists Prisma 6 and Node.js 22 LTS — I will use exactly those.

## 7. Stages (commit after each; lint, type-check, unit tests and build must pass)

0. **Tooling**: pnpm, Prettier, Husky, GitHub Actions (lint, type-check, tests, build),
   `.env.example`, `engines.node = 22`.
1. **Database**: Prisma migrations, RLS + storage policies (`prisma/sql/`), seed (catalog, services,
   options, FAQs, settings from today's seed files; demo customers and sample transactions **only**
   in the test project), the transaction-as-user helper, the `api` repositories skeleton.
2. **Auth**: routes, Turnstile, lockout, idle logout, verification and reset, consent, owner role,
   route protection in `src/proxy.ts`.
3. **Transactions**: custom orders, product orders, service requests, quotations, cancellations,
   status changes through the status machines, server-side estimate, codes, all-or-nothing writes.
4. **Files**: uploads with signature checks, private buckets, signed links, snapshots.
5. **Notifications**: rows + Realtime bell, email outbox → Resend, daily retry job.
6. **Chatbot**: `/api/chat` with Gemini 2.5 Flash, approved store data only, function call for
   drafts (still confirmed in the chat, D-27), rate limit, scripted fallback if Gemini is slow or
   down (keeps the 5 s target), notice text.
7. **Owner admin**: every admin screen saving to the database; option validation on the server.
8. **Production mode**: Demo bar and simulated outbox only in mock mode; security headers (CSP,
   HSTS, frame-ancestors), HTTPS redirect on Vercel.

## 8. QA plan (before calling it done)

- Unit (Vitest): existing 378 tests + access rules, lockout, idle logic, upload checks, chat guards.
- Integration (Vitest + test Supabase project): every API route as guest / customer A / customer B /
  owner; all-or-nothing writes (forced failure mid-transaction); duplicate submits; Storage uploads.
- Playwright TC-01 to TC-10 (manuscript Table 6), including cross-customer access by URL and by
  edited requests, guest access to protected pages, bad uploads (wrong type, > 5 MB, renamed file).
- Security: OWASP Top 10 checklist with sample attack inputs (SQL injection, XSS, path traversal,
  oversized bodies), security headers, HTTPS redirect (on the Vercel preview).
- Chatbot: ≥ 50-question test set + scoring script (≥ 80% correct, 100% of out-of-scope referred,
  no final prices or dates).
- Performance: Table 7 targets that can be measured (page loads, 3D first load and update, chat
  response, 30 simultaneous users with a small load script against the preview).
- Every bug goes in `docs/test-log.md` (test case, steps, expected, actual, fix, retest); finish with
  zero open major bugs; click through every customer and owner flow at 360 px and desktop widths.

Not testable by me: Safari (no Mac here — the team checks it), real 4G timing, 95% uptime over the
evaluation period.

## 9. What you need to create (I can't create accounts or enter keys)

| Account          | What to create                                                              | Values I need (in `.env.local`, never committed)                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase (free)  | **two** projects: `aurelius-test` (tests, may be wiped) and `aurelius-prod` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (pooler, port 6543), `DIRECT_URL` (port 5432) — for each project |
| Google AI Studio | Gemini API key (decision 2)                                                 | `GEMINI_API_KEY`                                                                                                                                                          |
| Resend           | account (+ verified domain, decision 3) and SMTP set up in Supabase Auth    | `RESEND_API_KEY`, `EMAIL_FROM`                                                                                                                                            |
| Cloudflare       | Turnstile widget for your domain + `localhost`                              | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`                                                                                                                  |
| GitHub           | a private repository to push to (Actions, Vercel)                           | —                                                                                                                                                                         |
| Vercel           | project linked to the GitHub repo (later, before QA on the preview)         | env vars copied in the Vercel dashboard                                                                                                                                   |
| Owner            | sign up once on the test and live sites with the owner's email              | `OWNER_EMAIL`                                                                                                                                                             |

Placeholders are in `.env.example`.
