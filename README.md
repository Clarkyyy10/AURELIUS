# AURELIUS — Phase 1 (front end on mock data)

Capstone web platform for **Afable's Jewelry Store** (Montalban Public Market, Rizal): 3D design
customization, e-commerce, service management, and an AI assistant. Phase 1 runs entirely in the
browser on mock data; Phase 2 connects Supabase and the Gemini API (see `docs/backend-plan.md`).

The 3D customizer covers 8 piece types (rings, pendants, name pendants, necklaces, bracelets, earrings,
anklets, toe rings) with 60+ styles, 7 settings, 5 band shapes, 4 shanks, 6 metal textures, 21 chain
styles and 11 stone cuts — see decisions D-21 to D-25 in `docs/decisions.md`.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Other commands:

```bash
npm test          # 370+ unit and flow tests (pricing, status machines, validation, data layer, chatbot)
npm run lint
npm run build && npm start
```

## Demo accounts

Use the **Demo mode** bar at the top to switch between Guest, Customer (Maria Santos) and Owner, read
**Simulated emails** (verification and reset links), turn on **Simulate errors**, or **Reset demo data**.

| Role | Email | Password |
|---|---|---|
| Customer | `maria@demo.ph` | any 8+ characters |
| Customer (unverified) | `ana@demo.ph` | any 8+ characters |
| Owner | `owner@afables.ph` | any 8+ characters |

Data is saved in your browser (localStorage + IndexedDB). Reset it from the Demo bar.

## Where things are

```
src/app/            routes: (public) shop, customize, services · (auth) login, register… · account/ · admin/
src/components/     customization/ (3D) · ecommerce/ · services/ · chatbot/ · admin/ · account/ · shared/ · layout/ · ui/
src/lib/data/       repository interfaces, mock implementation (zustand store), seed data
src/lib/pricing/    estimate engine (FR-06/FR-47) + tests
src/lib/status/     status machines for orders, custom orders, services + tests
src/lib/validation/ zod schemas for every form (re-used by Phase 2 server code)
src/lib/chatbot/    mock assistant engine (same interface as the Phase 2 Gemini API route)
docs/               requirements, specs, data model, decisions log
```

## Troubleshooting

If a page stays blank or stuck on "Loading…" while using `npm run dev` after many code changes,
stop and restart the dev server. Production builds are not affected (see `docs/decisions.md`, D-15).
