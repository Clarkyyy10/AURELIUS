# Contributing to AURELIUS

These rules apply to everyone on the team. Read `docs/00-overview.md` first.

## Core rules

1. `main` is protected. **No direct push to `main`.**
2. Work in a feature branch named `feat/<name>` or `fix/<name>`.
3. Open a pull request for each task.
4. One teammate approval is required before merge. The repository owner may merge their own pull requests without an approval once the required checks pass.
5. Every change is committed with a clear message.
6. Husky runs lint and type check before each commit.
7. GitHub Actions runs lint, type check, unit tests and build on every pull request. A failing check blocks the merge.

## Branching (Gitflow style)

| Branch        | Purpose                                                          |
| ------------- | ---------------------------------------------------------------- |
| `main`        | Always deployable. Protected. Production deploys come from here. |
| `feat/<name>` | New work, for example `feat/ring-viewer-band`.                   |
| `fix/<name>`  | Bug fixes, for example `fix/estimate-rounding`.                  |

Branch from the latest `main`. Use short lowercase names with hyphens. Delete the branch after it merges.

```bash
git switch main
git pull
git switch -c feat/service-quotation
```

## Commits

- Write a clear message in the imperative mood. Start with a type: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`.
- Keep the first line under 72 characters. Add a body when the reason is not obvious.
- One logical change per commit. Commit often.
- Reference the requirement when it helps, for example `FR-18`.
- Never commit secrets, `.env` files, real customer data or private keys.

Examples:

```text
feat(orders): reserve one unit when the owner confirms an order
fix(estimate): round price to the nearest peso (FR-06)
docs: update ERD with release record
```

## Pull requests

- One task per pull request. Keep it small enough to review in one sitting.
- Describe what changed and why. Link the requirement IDs or the backlog item.
- Add screenshots for interface changes.
- State how you tested it. Mention anything you did not test.
- Mark the pull request as a draft until the checks pass.
- The author does not approve their own pull request. One teammate approves before merge.
- Exception: the repository owner (the admin role) may merge their own pull request without an approval. The required checks still apply to everyone. Use the "bypass rules" option only for the missing approval, never to merge a pull request with failing checks.
- Merge with squash or merge commit as the team agrees. Do not rewrite shared history.

## Husky pre-commit hooks

Husky runs these before each commit:

| Check                          | Command          |
| ------------------------------ | ---------------- |
| Lint (ESLint)                  | `pnpm lint`      |
| Type check (TypeScript)        | `pnpm typecheck` |
| Format staged files (Prettier) | `lint-staged`    |

Do not bypass hooks with `--no-verify`. If a hook fails, fix the problem and commit again. Prettier formats staged files through lint-staged, which runs first. `pnpm install` installs the hooks through the `prepare` script.

## GitHub Actions

On every pull request, the workflow runs:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test` (Vitest unit tests)
5. `pnpm build`

Until the first unit tests exist, `pnpm test` passes with no test files (`--passWithNoTests`). Playwright browser tests run when the team enables them. All required checks must pass before merge.

## Branch protection settings (repository owner)

`main` is protected by two active rulesets (Settings, Rules, Rulesets). Both target the default branch.

| Ruleset             | Rules                                                                                                                                                                                          | Bypass                                               |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `protect-main-core` | Require a pull request (0 approvals). Require status check `checks` (the CI job: install, lint, type check, test, build). Require branches to be up to date. Block force pushes and deletions. | None. Applies to everyone, including administrators. |
| `main-approval`     | Require a pull request with 1 approval.                                                                                                                                                        | Repository admin role, for pull requests only.       |

The effect: collaborators need one approval and a green CI run. The repository owner needs a green CI run and may merge their own pull request without an approval. Nobody can push directly to `main`. Collaborators get write access, not admin, so they do not get the bypass.

If you change the CI job name in `.github/workflows/ci.yml`, update the required check in `protect-main-core` as well.

## Local setup

Requirements: Node 22 LTS and pnpm 12.22.0.

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local` and fill in your own development keys. Use only fictitious data when testing.

## Code standards

- TypeScript everywhere. No `any` without a comment explaining why.
- Validate every input on the server with Zod.
- Use Prisma for database access. Never build SQL strings by hand.
- Keep API keys on the server. Never expose them to the browser.
- Keep module code in separate directories: 3D customization, e-commerce, service management, chatbot.
- Write unit tests for logic such as price estimates, status changes and access rules.

## Documentation

When a change alters a requirement, the schema, a flow or a decision, update the matching file in `docs/` in the same pull request. Record new decisions in `docs/08-decisions.md`.
