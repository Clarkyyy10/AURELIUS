# Tech Stack

Source: manuscript Section 3.13 (Table 4). The manuscript marks versions as tentative as of Nov 2026. The **Scaffold version** column holds the versions you chose for the scaffold. I have not checked them against the registries. Verify each with `pnpm view <package> version` before the first install.

| Technology / tool | Manuscript version | Scaffold version | Purpose |
| --- | --- | --- | --- |
| Next.js (App Router) | 16.4 | 16.4.6 | Full-stack React framework. Pages and API routes in one project. Turbopack builds. Deploys to Vercel. |
| React | 19.3 | 19.3.1 | Component-based UI. Each module is built from reusable components. |
| TypeScript | 5.9 | 5.9.x | Type checks catch errors before runtime. Easier maintenance for five developers. |
| Tailwind CSS | 4 | 4.3.5 | Utility-first styling. |
| shadcn/ui | 4.23.0 | latest CLI | Accessible prebuilt components. |
| Three.js + React Three Fiber + Drei | r187 / 9 / 10.7.7 | as listed | WebGL rendering of the ring viewer. The ring is generated procedurally in code. |
| Node.js | 22 LTS | 22 LTS | Server runtime for Next.js. |
| PostgreSQL via Supabase | 16 | 16 | Relational database with transactions. |
| Prisma ORM | 6 | **7.10.1** | Type-safe database access with parameterized queries. |
| Supabase Auth + Storage | n/a | n/a | Email verification, password reset, sessions, roles, TOTP for the owner. Private storage for proofs. |
| Cloudflare Turnstile | n/a | n/a | Bot protection on login, registration and password reset. |
| Google Gemini API (Gemini 2.5 Flash) | API | API | Chatbot through a server-side API route. Key stays on the server. |
| Resend | n/a | n/a | Transactional email and owner alerts. |
| pnpm | 12.x | 12.22.0 | Package manager. |
| ESLint + Prettier + Husky | 9 / 3 | 9 / 3 / latest | Lint, format, pre-commit checks. |
| Git + GitHub + GitHub Actions | n/a | n/a | Version control, review, CI. |
| Visual Studio Code | 1.x | 1.x | Editor. |
| React Hook Form + Zod | 4.x | 4.x (Zod) | Forms and server-side validation. |
| Vitest + Playwright | 3.x / 1.65.1 | Vitest 5.1.x installed; Playwright as listed | Unit and browser tests. |
| Vercel | n/a | n/a | Hosting with HTTPS and GitHub deploys. |

## Differences to resolve

- **Prisma 6 vs 7.10.1.** The manuscript says 6 and the scaffold uses 7.10.1. Update Table 4 to match what you ship.
- **Tailwind and shadcn.** The manuscript row "4 / 4.23.0" mixes two products. Split them in Table 4.
- **Three.js, Drei, Vitest, Playwright, shadcn/ui.** The scaffold versions are taken from the manuscript and have not been verified.
- **Table 4 wording.** The manuscript calls Vercel's free tier and Gemini's free tier enough for the system. Production uses paid tiers (N34).
- **3D description.** Table 4 should say the ring geometry is procedural (N3).
- **Supabase Auth.** Add TOTP for the owner (N68).

## Environments

| Environment | Hosting plans |
| --- | --- |
| Development and evaluation | Free tiers |
| Production at handover | Vercel Pro, Supabase Pro, paid Gemini plan. The owner pays the monthly cost (**Open**: owner has not agreed yet, N38). Provider terms are unverified (N35). |

## Not in the stack

No payment gateway, no delivery or courier tracking, no vector store or embeddings service, no SMS or push service. These are decisions, see `08-decisions.md`.
