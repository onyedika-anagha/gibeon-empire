# Gibeon Empire — Phase 1 Core Commerce Platform

Premium women's luxury fashion commerce platform. **One backend, one database, three frontends** — a shared NestJS API and PostgreSQL database are the single source of truth for products, inventory, and orders.

See [`tasks/prd-phase1-commerce-platform.md`](tasks/prd-phase1-commerce-platform.md) for the full PRD and [`tasks/tasks-phase1-commerce-platform.md`](tasks/tasks-phase1-commerce-platform.md) for the implementation task list.

## Monorepo layout (Turborepo)

| Path | App | Description |
|------|-----|-------------|
| `apps/storefront` | Storefront | Next.js SSR/ISR customer site — catalogue, cart, checkout, accounts, wishlist. |
| `apps/admin` | Admin | Next.js RBAC-gated staff app — product/stock management, order oversight. |
| `apps/pos` | POS | Offline-first PWA for in-store tablets — works with no connectivity. |
| `apps/api` | Backend | NestJS — auth, catalogue, inventory, orders, payments, offline sync. |
| `packages/types` | Shared Types | Shared TypeScript types + API client (one contract across all apps). |
| `packages/ui` | Shared UI | Shared React component library. |

## Getting started

```bash
npm install          # install all workspaces
npm run dev          # run all apps via Turborepo
```

Run a single app:

```bash
npm run dev --workspace=storefront
```

## Tech stack

Next.js · React · Tailwind · NestJS · PostgreSQL · BullMQ + Redis · Dexie.js + Workbox (offline POS) · Paystack / Flutterwave.

## Conventions

Project rules live in [`.claude/rules/`](.claude/rules/): modular frontend code separation, backend-generated slugs/codes, PRD and task-list workflows.
