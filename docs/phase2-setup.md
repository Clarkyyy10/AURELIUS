# Phase 2 setup — accounts, keys and first run

Follow these steps once. Real keys go only in `.env.local` (your computer) and in the Vercel and
GitHub settings — never in the code or in commits. Start from `.env.example`.

## 1. Supabase (free) — two projects

Create **`aurelius-test`** (for testing; it may be wiped) and **`aurelius-prod`** (the live store).
Region: **Southeast Asia (Singapore)**, closest to Rizal.

For **each** project:

1. **Project settings → API**: copy the Project URL, the `anon` key and the `service_role` key into
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
2. **Project settings → Database → Connection string**: copy the **Transaction pooler** string
   (port 6543) into `DATABASE_URL` and add `?pgbouncer=true&connection_limit=1`; copy the
   **Session pooler / direct** string (port 5432) into `DIRECT_URL`.
3. **Authentication → Sign In / Providers → Email**: Email provider **on**, **Confirm email on**,
   minimum password length **8**.
4. **Authentication → URL Configuration**: Site URL = `http://localhost:3000` for test (the live
   address for prod). Redirect URLs: `http://localhost:3000/auth/confirm` and
   `https://<your-domain>/auth/confirm`.
5. **Authentication → Emails → SMTP settings** (after step 3 below): host `smtp.resend.com`,
   port `465`, username `resend`, password = your Resend API key, sender = `no-reply@<your-domain>`,
   name "Afable's Jewelry Store".
6. **Authentication → Emails → Templates** — replace the links so they open our page:
   - _Confirm signup_: `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm my email</a>`
   - _Reset password_: `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Choose a new password</a>`
7. **Authentication → Emails → Email OTP expiration**: `3600` seconds (reset links expire in 1 hour, FR-43).

Then, with `.env.local` pointing at the project:

```bash
corepack pnpm install
corepack pnpm db:migrate
corepack pnpm db:seed
```

Test project only — demo customers (set `SUPABASE_TEST_PROJECT_REF` and `TEST_USER_PASSWORD` first):

```bash
corepack pnpm db:seed -- --demo
```

**Owner account:** open the site, register with the owner's email (`OWNER_EMAIL`), confirm it from
the inbox, then run:

```bash
corepack pnpm db:owner
```

## 2. Google Gemini

Google AI Studio → **Get API key** → `GEMINI_API_KEY`. The free tier is fine for development and
the evaluation (the chat notice says Google may use free-tier chat text). For the live store, turn on
billing so the paid tier applies (decision D-28).

## 3. Resend (email) and the domain

Create a Resend account, add your domain and add the DNS records it shows (SPF, DKIM) at your
domain registrar. When it says _Verified_, create an API key → `RESEND_API_KEY`, and set
`EMAIL_FROM="Afable's Jewelry Store <no-reply@<your-domain>>"`. Without a verified domain Resend
only delivers to the Resend account owner's own inbox.

## 4. Cloudflare Turnstile

Cloudflare dashboard → Turnstile → **Add widget**, mode _Managed_, hostnames `localhost` and your
domain → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.

## 5. The rest of `.env.local`

- `NEXT_PUBLIC_DATA_SOURCE=api`
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (the live address on Vercel)
- `SESSION_SECRET`, `CRON_SECRET`: long random strings, for example from
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`

Start the app with `corepack pnpm dev`.

## 6. GitHub

Create a **private** repository, push this project, and add repository secrets for the nightly
backup: `BACKUP_DATABASE_URL` (the **prod** `DIRECT_URL`) and `BACKUP_PASSPHRASE` (keep a copy in a
safe place — it is needed to restore). The CI workflow needs no secrets.

**Restore test (NFR, once before deployment):** download the latest `database-backup` artifact,
then:

```bash
gpg --decrypt aurelius-YYYY-MM-DD.dump.gpg > restore.dump
pg_restore --clean --if-exists --no-owner --dbname "<TEST project DIRECT_URL>" restore.dump
```

Restore into the **test** project, then open the site against it and check a few records.

## 7. Vercel

Import the GitHub repository, framework **Next.js**, Node.js **22**. Add every variable from
`.env.local` (prod values) in _Settings → Environment Variables_. The daily email-retry job in
`vercel.json` runs automatically. Vercel serves HTTPS and redirects HTTP to HTTPS.
Remember: the Hobby plan is for non-commercial use (fine for the capstone); a live business needs
Pro or another host.
