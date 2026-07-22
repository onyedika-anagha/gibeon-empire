# Tasks: Gibeon Empire — Phase 1 Core Commerce Platform

Derived from [`prd-phase1-commerce-platform.md`](./prd-phase1-commerce-platform.md).

## Relevant Files

- `turbo.json` - Turborepo pipeline (build/dev/lint/test task graph).
- `package.json` (root) - npm workspaces config for `apps/*` and `packages/*`.
- `packages/types/src/index.ts` - Shared domain types (Product, Variant, Order, etc.) — single contract.
- `packages/types/src/api-client.ts` - Typed API client consumed by all three frontends.
- `packages/ui/src/` - Shared React component library (buttons, inputs, product primitives).
- `apps/api/src/main.ts` - NestJS bootstrap (CORS, validation pipe, global filter).
- `apps/api/src/db/schema.ts` - Drizzle schema (all tables + enums); migrations in `apps/api/drizzle/`.
- `apps/api/src/db/db.module.ts` - Drizzle provider (postgres-js) + connection lifecycle.
- `apps/api/docker-compose.yml` - Local Postgres (55432) + Redis (56379).
- `apps/api/src/auth/` - Auth module: JWT/session, guards, RBAC decorator + roles.
- `apps/api/src/catalogue/` - Product/variant/SKU CRUD, slug generation, search.
- `apps/api/src/inventory/` - Stock table, transactional deduction (row-level lock), low-stock, adjustments.
- `apps/api/src/orders/` - Order entity, state-machine service, transition guards + audit log.
- `apps/api/src/payments/` - Paystack + Flutterwave adapters, provider-toggle setting, webhooks.
- `apps/api/src/sync/` - `POST /sync/push` + `POST /sync/pull`, idempotency, reconciliation engine.
- `apps/api/src/notifications/` - BullMQ queue + email worker.
- `apps/api/src/**/*.spec.ts` - Jest unit tests alongside each service.
- `apps/storefront/src/` - Customer site (UI scaffolded); catalogue, cart, checkout, account, wishlist, tracking.
- `apps/admin/src/` - RBAC-gated staff app; product/stock mgmt, order oversight, payment toggle, oversell review.
- `apps/pos/src/` - Offline-first PWA; sale screen, Dexie DB, service worker, outbox sync.
- `apps/pos/public/sw.js` (or Workbox config) - Service worker precaching the app shell.

### Notes

- Follow repo rules: `code-separation` (modular frontend), `slug-rule` (backend-generated slugs/codes), `nestjs-best-practices`, `prd-rule`.
- Business logic lives only in `apps/api`. Frontends read/write through the shared API — never duplicate stock/order logic.
- Unit tests live alongside the code they test. Backend: `*.spec.ts` (Jest). Frontend: `*.test.tsx`. Run with `npx jest [path]`.
- The storefront homepage UI already exists; task 5.0 extends it into a functional commerce flow rather than starting from scratch.
- Requirement numbers in parentheses (e.g. _Req. 23_) reference the PRD's Functional Requirements.

## Tasks

- [x] 0.0 Project setup & feature branch
  - [x] 0.1 Run `git init` (repo is not yet initialized) and make an initial commit of the current state (PRD, tasks, scaffolded storefront).
  - [x] 0.2 Create and checkout a feature branch: `git checkout -b feature/phase1-commerce-platform`.
  - [x] 0.3 Add a root `.gitignore` (node_modules, .next, .env, dist, .turbo). _(+ `.gitattributes` for LF normalization.)_
  - [x] 0.4 Add a root `README.md` documenting the monorepo layout and how to run each app.

- [x] 1.0 Turborepo & shared foundation
  - [x] 1.1 Add root `package.json` with npm workspaces (`apps/*`, `packages/*`) and install Turborepo.
  - [x] 1.2 Create `turbo.json` with `build`, `dev`, `lint`, `test` pipelines and correct `dependsOn` ordering.
  - [x] 1.3 Move the existing `apps/storefront` into the workspace; confirm it still runs (HTTP 200; shared `Price` renders). _Note: Next 16's SWC lockfile auto-patcher logs a non-fatal ENOWORKSPACES warning under npm workspaces — cosmetic, revisit if it ever blocks a build._
  - [x] 1.4 Scaffold `packages/types` exporting shared domain types: `Product`, `Variant`, `InventoryRecord`, `Order`, `OrderItem`, `Payment`, `Customer`, `Staff`, enums (`OrderState`, `Channel`, `PaymentMethod`) + offline-sync types.
  - [x] 1.5 Scaffold `packages/ui` with shared tsconfig + `Price`/`cn` primitives; storefront `ProductCard` now consumes `Price` (cross-app reuse proven).
  - [x] 1.6 Add a typed API-client (`@gibeon/types/api-client`) that all frontends import.
  - [x] 1.7 Wire shared tsconfig-base + Prettier at root; `turbo typecheck` passes across all 3 workspaces. _(ESLint kept per-app for now — Next ships its own flat config; add a shared config when admin/POS land.)_

- [x] 2.0 Backend API core: NestJS, PostgreSQL, data model, auth & RBAC
  - [x] 2.1 Scaffold `apps/api` (NestJS), add PostgreSQL + **Drizzle ORM** and a local Postgres+Redis via docker-compose. _(Drizzle per user preference; host ports 55432/56379 to avoid clashes.)_
  - [x] 2.2 Define the schema for all entities (`src/db/schema.ts`): Product, ProductMedia, Variant, Location, Inventory, Order, OrderItem, OrderEvent, Payment, Customer, Address, PasswordReset, Staff, Setting, AuditLog. Initial migration generated + applied (15 tables, 7 enums).
  - [x] 2.3 Global validation pipe (class-validator DTOs, whitelist + forbidNonWhitelisted) and a standard error envelope (`HttpExceptionFilter`).
  - [x] 2.4 Auth: customer registration/login/password-recovery + staff login; short-lived JWT = auto-logout; bcrypt (12 rounds). Verified end-to-end incl. full reset cycle.
  - [x] 2.5 RBAC: `roleEnum` + `@Roles()` decorator + global `RolesGuard`; seeded Admin/Store Manager/Cashier staff.
  - [x] 2.6 Global `AuditService` (actor + timestamp + entity + change), transaction-aware; verified logging the password reset.
  - [x] 2.7 Unit tests for auth and RBAC guard — `auth.service.spec.ts`, `roles.guard.spec.ts` (9 tests, all pass).

- [x] 3.0 Catalogue & Inventory service
  - [x] 3.1 Catalogue CRUD: products, variants, SKUs, categories, brands, media — admin-only writes (`CatalogueService`/`CatalogueController`, `@Roles`).
  - [x] 3.2 Backend slug + SKU generation (slugify + random suffix, regenerate on unique collision, slug immutable on update) — `common/slug.ts`, per `slug-rule`.
  - [x] 3.3 Storefront-facing reads: public list with category/size/colour/price filters + name search; get-by-slug (Req. 1, 2, 10).
  - [x] 3.4 Inventory read endpoint exposing stock state ("in_stock"/"low_stock"+remaining/"sold_out") — never raw qty (Req. 4, 24).
  - [x] 3.5 Transactional deduction with row-level locking (`.for("update")`) — the anti-oversell core (Req. 23).
  - [x] 3.6 Manual stock adjustments (set/delta + reason) with audit logging (Req. 25, 39); restore for returns.
  - [x] 3.7 Low-stock threshold + alert (audit `inventory.low_stock` on threshold crossing; `GET /inventory/low-stock`) (Req. 27).
  - [x] 3.8 Concurrency test (`inventory.concurrency.spec.ts`) against real Postgres — two buyers, last unit, exactly one wins, qty never < 0. **Success Metric 1 proven.** (10 tests pass.)

- [x] 4.0 Order pipeline & payments
  - [x] 4.1 Order state machine (`order-state.ts`): guarded transitions Received→…→Completed; illegal jumps rejected with 409.
  - [x] 4.2 Every transition logged to `order_events` (from/to/actor/timestamp) + audit log; orders tagged by channel `ONLINE`/`POS` (Req. 19, 20).
  - [x] 4.3 Payment provider abstraction: Paystack + Flutterwave adapters behind one `PaymentProviderAdapter` interface (Req. 28, 31).
  - [x] 4.4 Admin `activePaymentProvider` toggle (`SettingsService`, `PATCH /payments/provider`); checkout uses active provider; verified switch with no redeploy (Req. 29, 30).
  - [x] 4.5 `POST /payments/initialize` + signature-verified `POST /payments/webhook/:provider` (+ dev `simulate-success`); on success → PAYMENT_CONFIRMED → deduct stock → INVENTORY_UPDATED.
  - [x] 4.6 BullMQ + Redis queue + `NotificationsProcessor`; order-confirmation email dispatched async (verified worker log), never blocking checkout (Req. 21).
  - [x] 4.7 Unit tests — `order-state.spec.ts` (state machine), `payments.service.spec.ts` (provider selection + webhook HMAC). 20 tests pass total.

- [x] 5.0 Storefront: catalogue → checkout → account
  - [x] 5.1 `/shop` list + `/products/[slug]` PDP (SSR) wired to the catalogue API via `lib/api.ts`; placeholder data replaced (Req. 1, 10).
  - [x] 5.2 Search + category/size filter UI (`ShopFilters`, URL-driven) backed by the API (Req. 2).
  - [x] 5.3 Live stock badges on cards + PDP ("only N left" / sold-out) (Req. 4).
  - [x] 5.4 Persistent cart (`useCart` context + drawer) and wishlist (`useWishlist`), in `/hooks` per `code-separation` (Req. 3).
  - [x] 5.5 Guest checkout (`CheckoutForm`) — no account required; stock deducts at payment confirm via API (Req. 5, 24).
  - [x] 5.6 Payment step calls `/payments/initialize` using the admin-active provider; confirmation surfaces the pay link (Req. 9).
  - [x] 5.7 Optional post-purchase account creation, links the order to the new customer (Req. 6).
  - [x] 5.8 Account UI (`AccountPanel`): login, register, password recovery + order history (Req. 7). _(Saved-addresses UI deferred — backend model exists.)_
  - [x] 5.9 Order tracking via order-history status timeline (`OrderHistory`) against the shared pipeline (Req. 8).
  - [x] 5.10 Component tests (Vitest + RTL): `useCart.test.tsx`, `CheckoutForm.test.tsx` — 5 tests pass.
  - Backend support added: `OptionalJwtAuthGuard` (attach customer on guest-or-authed checkout) + `GET /orders` (my orders).

- [x] 6.0 Admin dashboard
  - [x] 6.1 `apps/admin` (Next.js, hand-scaffolded), RBAC-gated login via `/auth/staff/login` + `useAdminAuth`; `AdminShell` gates all routes.
  - [x] 6.2 Product/variant management UI (create + inline price edit) — no slug/code fields per `slug-rule` (Req. 38).
  - [x] 6.3 Inventory page: low-stock list with inline restock → `/inventory/adjust` (audited) (Req. 39).
  - [x] 6.4 Staff management UI (list, create, role change) — admin-only; backed by new `/staff` endpoints (Req. 40).
  - [x] 6.5 Order oversight: filterable list + guarded `advance` through the pipeline; new `GET /orders/admin/all` (Req. 41).
  - [x] 6.6 Payment-provider toggle UI (Paystack ⇄ Flutterwave), optimistic (Req. 42, 29).
  - [x] 6.7 Oversell review queue UI + `oversell_reviews` table + `/reviews` endpoints (populated by task 7.8) (Req. 42, 37).
  - [x] 6.8 Component tests (Vitest+RTL): `PaymentProviderToggle` (switch behavior) + `AdminShell` (guarded route). 2 pass.

- [ ] 7.0 POS offline-first PWA
  - [ ] 7.1 Scaffold `apps/pos` (Next.js PWA), staff login (same RBAC identity), tablet-optimized sale screen.
  - [ ] 7.2 Barcode scanning via USB/Bluetooth HID, with camera-based fallback (Req. 11); product search + customer lookup (Req. 12).
  - [ ] 7.3 Sale flow: line items, discounts/coupons (Req. 13), payment methods cash/card/transfer/split (Req. 14), receipt printing (Req. 15).
  - [ ] 7.4 Returns/refunds/exchanges against existing orders (Req. 16).
  - [ ] 7.5 Dexie.js IndexedDB: cached product/stock snapshot + outbox queue; write each offline sale to the outbox first with a client-generated unique ID (Req. 33, 34).
  - [ ] 7.6 Workbox service worker precaching the full app shell for zero-connectivity load (Req. 32).
  - [ ] 7.7 Sync: replay outbox via `POST /sync/push` + `POST /sync/pull`; auto-trigger via Background Sync (Android) and `online` event + retry timer (iPad/Safari) (Req. 35, 36).
  - [ ] 7.8 Backend reconciliation engine: replay offline sales in order against authoritative inventory; commit if honourable, else flag for manual review — never drop or duplicate (Req. 37).
  - [ ] 7.9 Idempotency + reconciliation tests: replaying the same outbox twice creates no duplicate sale; an oversold offline sale lands in the review queue (`sync.service.spec.ts`) (Success Metric 2).

- [ ] 8.0 Non-functional hardening & launch
  - [ ] 8.1 Verify audit logging covers all inventory changes, price updates, and order modifications (Req. 19, NFR).
  - [ ] 8.2 Security pass: SSL/TLS, secure gateway config, session auto-logout, secrets in env, dependency audit (NFR security).
  - [ ] 8.3 PostgreSQL backup & recovery routine (NFR).
  - [ ] 8.4 Storefront Core Web Vitals pass (Lighthouse) — hit acceptable e-commerce scores (Success Metric 3).
  - [ ] 8.5 End-to-end verification of the 5 Success Criteria, incl. a simulated internet-outage POS run (Success Metrics 1–5).
  - [ ] 8.6 Deploy all four apps to cloud hosting (Railway or equivalent) with environment separation.
