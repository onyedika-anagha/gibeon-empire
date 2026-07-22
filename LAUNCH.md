# Phase 1 Launch Checklist — Gibeon Empire

## Success criteria (PRD §7)

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Zero overselling between storefront & POS (online) | ✅ Verified | `apps/api/src/inventory/inventory.concurrency.spec.ts` — two concurrent buyers, last unit, exactly one wins, stock never < 0 (row-level `SELECT … FOR UPDATE`). |
| 2 | POS fully operational through an outage; offline sales reconciled | ✅ Verified | `apps/api/src/sync/sync.reconciliation.spec.ts` (commit / idempotent replay / oversell→review) + `apps/pos/src/lib/sync.test.ts` (outbox-first, idempotent). HTTP: replaying a `clientId` → `duplicate_ignored`. |
| 3 | Storefront acceptable Core Web Vitals | ⏳ Pending measurement | SSR/ISR pages, system-font + `next/font`, no blocking JS, GPU-only animations, `prefers-reduced-motion`. Run Lighthouse against the deployed storefront with real product photography. |
| 4 | All order-lifecycle transitions logged & auditable | ✅ Verified | Guarded state machine writes `order_events` (from/to/actor/timestamp); illegal jumps → 409 (`order-state.spec.ts`). Plus `audit_logs`. |
| 5 | Admin creates a product → reflected on storefront & POS, no manual step | ✅ Verified | Created via `POST /products`; appears in public `GET /products` **and** `POST /sync/pull` immediately. |

## Audit logging coverage (Req. 19 / NFR)

`AuditService` (transaction-aware) records actor + timestamp for:
- Inventory: `inventory.deduct`, `inventory.restore`, `inventory.adjust`, `inventory.low_stock`
- Pricing: `price.update` (distinct from `variant.update`)
- Catalogue: `product.create`, `product.update`, `variant.create`
- Orders: `order.create`, `order.transition` + full `order_events` trail
- POS: `pos.reconcile`; Staff: `staff.create`, `staff.update_role`; Reviews: `oversell.resolve`
- Auth: `customer.password_reset`

## Security (NFR)

- RBAC (`@Roles` + global guard); bcrypt (12 rounds); short-lived JWT = auto-logout.
- `helmet` security headers (HSTS, nosniff, frame-options) — verified live.
- Rate limiting (`@nestjs/throttler`): 120/min global, **10/min on auth** — verified (429 after 10 login attempts).
- Validation pipe (whitelist + forbidNonWhitelisted) at every trust boundary.
- Secrets via env only; CORS pinned to the three frontends; TLS terminated at the platform (see `DEPLOYMENT.md`).
- Payment webhooks verified against provider signatures (HMAC).

## Backups (NFR)

`scripts/backup-db.sh` (gzip `pg_dump`, 14-backup retention) + `scripts/restore-db.sh`. Schedule daily with `DATABASE_URL` set.

## Deferred (tracked, not blocking core Phase 1)

- POS returns/refunds/exchanges UI (backend `InventoryService.restore` exists) — task 7.4.
- Camera-based barcode fallback (HID scanning works) — task 7.2.
- Saved-addresses UI on the storefront account (backend `Address` model exists) — task 5.8.
- Real Lighthouse run + actual cloud deploy — require photography + hosting credentials.
