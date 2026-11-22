# Decisions log

Decisions made where the specs were silent or where tooling forced a choice. Newest at the bottom.

| ID | Decision | Why |
|---|---|---|
| D-01 | Cache Components and partial prefetching (on by default in Next.js 16.4) are turned off. | Phase 1 runs entirely in the browser on a localStorage mock store, so server caching adds complexity without benefit. Revisit in Phase 2. |
| D-02 | `@types/node` is v24 (not the scaffold's v20). | Matches the installed Node.js 24 and satisfies Vitest 5's peer requirement. |
| D-03 | shadcn/ui uses the Radix base with the "Nova" preset; button and input heights were raised to 40–44 px. | Spec asks for shadcn/ui (Radix). Taller controls meet the 44 px tap-target guideline for 360 px phones. |
| D-04 | The project lives in `C:\dev\aurelius`, not OneDrive. | OneDrive syncing `node_modules` causes slow installs and file locks. |
| D-05 | Phase 1 login accepts any password of 8+ characters for existing accounts (not only the demo ones). | The spec allows this for demo accounts; storing passwords in localStorage would be worse. Phase 2 uses Supabase Auth hashing. |
| D-06 | For earrings, the stone quantity is per pair: 2 = one stone in each earring; 1 = only the left earring has a stone. | Keeps the 3D view an exact match of what is priced (NFR accuracy). The customizer explains this. |
| D-07 | Marking an order or custom order **Completed** also requires a zero balance (the spec states this for services' **Claimed**). | Completed means the item was handed over, which is when the balance is settled. |
| D-08 | The owner can cancel any request that isn't finished, for all three types, with a required reason. | The spec says so for orders; applied consistently. |
| D-09 | When a service quotation is re-issued after drop-off, accepting it moves the request back to **Item received** (not "Waiting for drop-off"). | The item is already in the store. |
| D-10 | Uploaded files are kept in the browser's IndexedDB and referenced as `idb:<id>`; 3D snapshots are small JPEG data URLs; if no snapshot can be taken (no WebGL), a placeholder image of the piece type is used. | localStorage is limited to ~5 MB. Phase 2 uses Supabase Storage. |
| D-11 | "Request this piece" on a made-to-order product creates a custom order request straight away using the product's 3D design and a note naming the product. "Customize this design" opens the customizer instead. | Both paths create the same record type (FR-07). |
| D-12 | Chat transcripts are kept only in the browser tab (sessionStorage) and are never saved to the database. | Collect only what is needed (Data Privacy Act). |
| D-13 | Piece types and cuts can be renamed, re-priced, or turned off, but not added. | Each is tied to a 3D shape in the procedural models. |
| D-14 | Date checks ("not in the future", "today or later") use the local calendar day, not UTC. | The store is UTC+8; UTC is a day behind every morning, which wrongly blocked today's payments. |
| D-15 | Every `<Suspense>` boundary has a visible loading fallback. If pages stay blank or stuck on "Loading…" in `npm run dev` after many code edits, restart the dev server — production builds are not affected. | Seen during testing with Next.js 16.4 dev server hot reloads. |
| D-16 | Customers may also pay the balance online (GCash/bank) any time before claiming, not only the down payment. | Saves the owner time at the counter; the owner still verifies each payment. |
| D-17 | Shop and home product cards show live 3D models drawn by **one shared WebGL canvas** (drei `View`); the product page uses the full viewer with photos as thumbnails. | Browsers allow ~16 WebGL contexts; one canvas per card would fail and be slow. Only on-screen cards are drawn. |
| D-18 | On cards, mouse drag rotates immediately; scroll-zoom turns on after a click (off again when the pointer leaves). On touch screens, a tap turns on rotate and pinch-zoom. | Otherwise scrolling or swiping over the grid would zoom/rotate models instead of scrolling the page. |
| D-19 | Each product stores its 3D "design" (metal, finish, stones), set by the owner in the product form; if missing it is derived from the category and material name. | Keeps the 3D model consistent with the product without hard-coding; works for older saved data (store migration v2). |
| D-20 | The camera framing is computed from each piece's bounding sphere (not drei `Bounds`). | Bounds framed some pieces too close inside shared views; the sphere fit keeps the piece in frame while it turns. |
| D-21 | **Name pendants** are a sixth piece type. The customer types the name (up to 10 characters: letters, Ñ, accents, space, ' & - .), picks a font and a size (Small/Medium/Large = letter height). Four fonts ship with the app (Great Vibes, Dancing Script, Playfair Display, Montserrat — SIL Open Font License) converted to 3D letter data by `scripts/build-fonts.mjs`; the owner can rename or turn them off (Customization & Rates → Fonts). | Customer request. Bundled fonts keep the no-hotlink rule and work offline. |
| D-22 | Name pendants use the **same estimate formula**; the base weight (2.5 g) assumes a typical name of about 6 letters at Medium size, so name length does not change the estimate. Script fonts join their letters; the serif and block fonts get a connecting bar under the letters. | Keeps the formula in data-model.md §6 unchanged and the NFR accuracy tests valid; the owner confirms the real weight and price in the quotation. |
