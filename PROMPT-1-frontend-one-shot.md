Paste everything below the line into Claude Code (Code tab), with the `aurelius` folder open.

---

You are building Phase 1 (front end only) of AURELIUS. Read these files completely before doing
anything else: `CLAUDE.md`, `docs/requirements.md`, `docs/frontend-spec.md`, `docs/data-model.md`.
Do not read or build `docs/backend-plan.md` items — no Supabase, no real auth, no API calls in this phase.

Goal: a complete, polished, working front end for customers and the owner that runs end to end on
mock data, exactly as specified in `docs/frontend-spec.md`, and passes the acceptance checklist in §9.

Work autonomously through these milestones without stopping for approval. Commit after each one.

1. **Scaffold.** Create the Next.js app (TypeScript strict, App Router, `src/`, Tailwind, ESLint)
   in the current folder. Install shadcn/ui, lucide-react, react-hook-form, zod, zustand, date-fns,
   three, @react-three/fiber, @react-three/drei, vitest, @testing-library/react. Set up the design
   tokens and fonts from frontend-spec §1 and the folder layout from CLAUDE.md. `git init` if needed.
2. **Core logic + tests.** Types (`src/types/`), pricing engine with all required test cases
   (data-model §6, ≥ 20 cases), status machines with tests (§7), zod schemas. Run `npm test`.
3. **Mock data layer.** Repository interfaces, mock implementations on a persisted zustand store,
   seed data covering every status, idempotent submits, simulated latency, SVG placeholders.
4. **Shells and shared components.** Public header/footer, Demo Mode bar (role switcher, simulated
   emails, reset), owner admin shell, route guards, all shared components in frontend-spec §4.
5. **Auth screens and privacy** (§5.8).
6. **Module 1 — 3D Customizer** (§5.4): procedural models for all five piece types and all cuts,
   materials/finishes/gems from the options store, estimate bar with breakdown, WebGL fallback,
   snapshot capture, submit flow, revision mode, draft mode.
7. **Module 2 — Shop, product detail, orders** (§5.2, §5.3) and the customer account pages (§5.6, §5.7).
8. **Module 3 — Services** catalog and request form (§5.5) and service detail pages.
9. **Module 4 — Chatbot widget** with the mock engine (§5.9).
10. **Owner pages** (§5.10–§5.20), including Customization & Rates with the formula preview.
11. **Notifications** (§7) wired to every event.
12. **Verification.** Run `npm run lint`, `npm test`, and `npm run build`, and fix every error. Then
    start the dev server and walk through every item of the acceptance checklist in frontend-spec §9
    yourself (use the Demo bar to switch roles). Fix anything that fails. Check layouts at 360 px,
    768 px, and 1280 px widths.

Rules while working:

- Follow the specs exactly; where they are silent, choose the simplest option that a first-time user
  would understand, and note the decision in `docs/decisions.md`.
- Keep each module's code in its own folder. No hard-coded rates or options in components.
- Plain-English UI text and error messages. Peso formatting. Accessible, responsive, keyboard-friendly.
- Do not skip loading, empty, and error states.

When everything passes, reply with:

1. what was built (by module, with FR numbers),
2. how to run it (`npm install`, `npm run dev`, demo accounts),
3. a short demo script for the panel (custom order flow and service flow),
4. anything not finished or any spec decision you made, from `docs/decisions.md`.
