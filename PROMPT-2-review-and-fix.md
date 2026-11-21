Use these follow-up prompts in Claude Code after the one-shot build, one at a time, as needed.

---

**A. Self-review against the spec**
Review the app against `docs/frontend-spec.md` and `docs/requirements.md`. Make a table of every
FR (FR-01 to FR-50) and every acceptance checklist item with status: Done / Partial / Missing, and
where it is in the code. Then fix every Partial and Missing item that belongs to Phase 1. Run lint,
tests, and build again.

**B. 3D viewer polish**
Open the customizer and check every piece type × material × finish × gemstone × cut × size
combination at least once. Make the procedural models look like real jewelry (proportions, prong
settings, chain links, stone facets, reflections). Keep option changes under 300 ms. Make sure the
viewer matches the selected options exactly (NFR accuracy) and the no-WebGL fallback works.

**C. Mobile pass**
Check every customer and owner page at 360 px width. Fix overflow, tiny tap targets (< 44 px), tables
that should become cards, and the customizer layout. List what you changed.

**D. Explain it to me**
Explain the project structure, the data flow from a page to the mock repository, how the pricing
formula and status machines work, and what Phase 2 will replace. Use simple language so I can
defend it in front of the panel.

**E. Start Phase 2 (only when Phase 1 is approved)**
Read `docs/backend-plan.md`. Plan step 1 (Supabase schema and migrations) and show me the schema
before creating anything.
