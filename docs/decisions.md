# Decisions log

Decisions made where the specs were silent or where tooling forced a choice. Newest at the bottom.

| ID | Decision | Why |
|---|---|---|
| D-01 | Cache Components and partial prefetching (on by default in Next.js 16.4) are turned off. | Phase 1 runs entirely in the browser on a localStorage mock store, so server caching adds complexity without benefit. Revisit in Phase 2. |
| D-02 | `@types/node` is v24 (not the scaffold's v20). | Matches the installed Node.js 24 and satisfies Vitest 5's peer requirement. |
| D-03 | shadcn/ui uses the Radix base with the "Nova" preset; button and input heights were raised to 40–44 px. | Spec asks for shadcn/ui (Radix). Taller controls meet the 44 px tap-target guideline for 360 px phones. |
| D-04 | The project lives in `C:\dev\aurelius`, not OneDrive. | OneDrive syncing `node_modules` causes slow installs and file locks. |
