# AURELIUS — Claude Code Starter Pack

## What's inside

| File                            | Purpose                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `CLAUDE.md`                     | Project brief Claude Code reads at the start of every session                      |
| `docs/requirements.md`          | All 50 functional requirements + non-functional requirements, with phase tags      |
| `docs/frontend-spec.md`         | Every page, component, flow, design token, and the acceptance checklist            |
| `docs/data-model.md`            | Entities, seed options and rates, status machines, pricing formula + test cases    |
| `docs/backend-plan.md`          | Phase 2 (Supabase + Claude API) — for later                                        |
| `PROMPT-1-frontend-one-shot.md` | The one-shot prompt that builds the whole front end                                |
| `PROMPT-2-review-and-fix.md`    | Follow-up prompts: self-review, 3D polish, mobile pass, explanation, Phase 2 start |

## Steps

1. Install **Node.js (LTS)** and **Git for Windows**.
2. Create a folder, e.g. `Documents\aurelius`, and copy **all** of these files into it, keeping the
   `docs` folder.
3. Open the Claude app → **Code** tab → choose the `aurelius` folder.
4. Open `PROMPT-1-frontend-one-shot.md`, copy everything below the line, paste it into Claude Code, send.
5. Approve edits and commands when asked (or allow them for this folder so it can run unattended).
   A full one-shot build is long; if it stops partway, send: "Continue from where you stopped. Check
   the acceptance checklist in docs/frontend-spec.md §9 and keep going."
6. When it finishes: run `npm run dev`, open http://localhost:3000, and use the Demo bar to try the
   flows as Customer and as Owner.
7. Use the prompts in `PROMPT-2-review-and-fix.md` to review, polish, and learn the code.

## Before your panel

- The seed rates in `docs/data-model.md` §3 are **demo values**. Replace them with the owner's real
  rates in **Admin → Customization & Rates**, and recompute the test cases with the owner.
- Phase 1 uses mock data in the browser. Nothing is saved to a server until Phase 2.
