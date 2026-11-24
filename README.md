# AURELIUS

3D ring customization, e-commerce, and service management platform with an AI chatbot for Afable's Jewelry Store. FEU Roosevelt Marikina BSIT capstone.

## Requirements

- Node 22 LTS (see `.nvmrc`)
- pnpm 12.22.0

## Setup

```bash
pnpm install
cp .env.example .env.local   # fill in your own development keys
pnpm dev
```

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Vitest unit tests |

## Documentation

Start with `docs/00-overview.md`. Contribution rules are in `CONTRIBUTING.md`. Agents read `AGENTS.md`.
