<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project source of truth for agents

Read this section first. Then read `CONTRIBUTING.md` for the full rules and `docs/` for the project: `00-overview.md` (start here), `01-requirements.md`, `02-architecture.md`, `03-erd.md`, `04-flowcharts.md`, `05-tech-stack.md`, `06-testing.md`, `07-ethics-privacy.md`, `08-decisions.md`, `09-owner-data.md`, `10-sprint-plan.md`, `11-ui-screens.md`, `12-ui-components.md`, `13-ux-content-a11y.md`. The visual system is `DESIGN.md` at the repo root. When a change alters a requirement, the schema, a flow or a decision, update the matching file in `docs/` in the same pull request.

### Stack and pinned versions

Pinned in `package.json`, `pnpm-workspace.yaml` and `.nvmrc`: Next.js 16.4.6, React 19.3.1, Tailwind CSS 4.3.5, pnpm 12.22.0 (`packageManager`), Node 22 LTS (`engines`: `>=22`). Planned, not yet installed: Prisma 7.10.1, Supabase, shadcn/ui, Three.js, Playwright. See `docs/05-tech-stack.md`. Do not add them unless the task asks.

### Commands

| Command          | Purpose                                            |
| ---------------- | -------------------------------------------------- |
| `pnpm dev`       | Start the development server                       |
| `pnpm build`     | Production build                                   |
| `pnpm start`     | Serve the production build                         |
| `pnpm lint`      | ESLint                                             |
| `pnpm typecheck` | `next typegen` then `tsc --noEmit`                 |
| `pnpm test`      | Vitest unit tests (`vitest run --passWithNoTests`) |

### Git rules

- `main` is protected. Never push directly to `main`.
- Work on `feat/<name>` or `fix/<name>`. Open one pull request per task.
- Merging needs the CI check `checks` to pass, for everyone. A teammate approval is also required, with one exception: the repository owner (admin role) may merge their own pull request without an approval. Never use the "bypass rules" option to merge a pull request with failing checks. Agents do not approve or bypass; leave merging to the human.
- `main` is guarded by two rulesets, `protect-main-core` and `main-approval`. See `CONTRIBUTING.md` for the details.
- Commit every change with a typed message: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`.
- Never use `--no-verify`. If a hook fails, fix the problem and commit again.
- Stage files by name. Do not use `git add -A` or `git add .`.
- Never commit secrets, `.env` files or real customer data.

### Checks

- Husky pre-commit hook (`.husky/pre-commit`): `lint-staged` (Prettier on staged files), then `pnpm lint`, then `pnpm typecheck`. `pnpm install` installs the hook through the `prepare` script.
- GitHub Actions (`.github/workflows/ci.yml`) on every pull request: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

### Local agent data

`.agents/` is local agent working data. It is not committed. Do not stage it.
