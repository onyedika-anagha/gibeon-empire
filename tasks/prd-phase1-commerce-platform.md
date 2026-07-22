# PRD: Gibeon Empire — Phase 1 Core Commerce Platform

**Document Version:** 1.0
**Status:** Draft for Review
**Prepared by:** Onyedika Anagha
**Source:** Derived from `Gibeon_Empire_Phase1_Project_Overview_PRD.docx`, re-documented in the team PRD format with confirmed product decisions.
**Audience:** Junior developers implementing the platform. Requirements are explicit and numbered.

---

## 1. Introduction / Overview

Gibeon Empire is a premium women's luxury fashion brand. Today the business has no unified system of record — online and in-store stock, orders, and customers are tracked separately, which causes overselling and manual reconciliation.

Phase 1 delivers a **single commerce platform** that gives the brand a real, usable business system on day one. It deliberately scopes down to the two capabilities that generate revenue — a **customer storefront** and an **in-store Point of Sale (POS)** — both backed by **one shared inventory and one order pipeline**. CRM, marketing automation, loyalty, and BI are explicitly deferred to later phases.

**The goal:** one source of truth for products, inventory, and orders across every sales channel; zero overselling between web and store; and a POS that keeps selling during internet outages.

---

## 2. Goals

1. Give Gibeon Empire a single system of record for inventory across online and in-store sales.
2. Eliminate overselling between the website and the physical store.
3. Allow the store to keep selling during internet outages with zero disruption to cashier or customer.
4. Deliver a fast, SEO-capable, luxury-grade storefront.
5. Establish a shared technical foundation (one backend, one design system) that later phases can extend without a rebuild.

---

## 3. User Stories

**Storefront — Customer**
- As a shopper, I want to browse a catalogue by category and filter by size/colour/price, so I can quickly find pieces I like.
- As a shopper, I want to see accurate live stock ("only 2 left", "sold out"), so I don't try to buy something unavailable.
- As a shopper, I want to check out as a guest without creating an account, so I can buy with minimal friction.
- As a shopper, I want to optionally save my details into an account after purchase, so future orders are faster.
- As a returning customer, I want to log in and see my order history and tracking, so I know where my order is.
- As a shopper, I want a wishlist, so I can save pieces for later.

**POS — Store Staff**
- As a cashier, I want to scan a barcode and add an item to a sale instantly, so checkout is fast.
- As a cashier, I want to look up a customer and apply discounts/coupons, so I can serve them correctly.
- As a cashier, I want to take cash, card, transfer, or split payments and print a receipt.
- As a cashier, I want to keep selling when the internet is down, and have those sales sync automatically when it returns.
- As a store manager, I want to process returns, refunds, and exchanges against past orders.

**Admin — Staff**
- As an admin, I want to create/edit products, variants, and SKUs in one place and have them appear correctly on both storefront and POS.
- As an admin, I want to make manual stock adjustments (corrections, damage, transfers) with an audit trail.
- As a store manager, I want to review the order pipeline and oversee fulfilment.
- As an admin, I want to choose which payment provider (Paystack or Flutterwave) is active from a settings toggle.
- As a manager, I want a review queue for offline sales that oversold stock, so I can decide backorder/substitution/refund.

---

## 4. Functional Requirements

### 4.1 Storefront
1. The system must display a product catalogue organised by categories and brands, with variants (size/colour), images, and video.
2. The system must provide search and filtering (by category, size, colour, price).
3. The system must provide a shopping cart and a wishlist.
4. The system must display live or near-live stock state per variant ("in stock", "only N left", "sold out").
5. The system must support **guest checkout** — a customer can complete a purchase without creating an account.
6. The system must offer **optional account creation after purchase** (e.g. "save your details for next time"), pre-filled from the completed order.
7. The system must support registered customer accounts: registration, login, password recovery, saved addresses, and order history.
8. The system must let logged-in customers track an order against the shared order pipeline (Section 4.3).
9. The system must process checkout payments through the payment provider currently activated in the admin panel (Section 4.5).
10. Product pages must be server-rendered / ISR for SEO and fast first load.

### 4.2 Point of Sale (POS)
11. The system must support barcode scanning via USB/Bluetooth HID scanner, with camera-based scanning as a fallback.
12. The system must support product search and customer lookup.
13. The system must support discounts and coupon application on a sale.
14. The system must support payment methods: cash, card, bank transfer, and split payments.
15. The system must support receipt printing.
16. The system must support returns, refunds, and exchanges against existing orders.
17. The system must remain **fully functional offline** — scanning, selling, discounting, and receipt printing must work with no internet connection (Section 4.6).

### 4.3 Order Pipeline
18. Every order, whether placed on the storefront or at POS, must move through one shared state machine:
    `Received → Payment Confirmed → Inventory Updated → Picking → Packing → Dispatch → Delivered → Completed`.
19. Each state transition must be a **guarded, logged action** (not a free-text status field). Every transition must record a timestamp and the staff member or system action responsible (audit trail).
20. Each order must be tagged by channel (`online` / `pos`).
21. Order notifications (email at minimum for Phase 1) must be dispatched **asynchronously** via a background queue so checkout is never blocked by a third-party service. (WhatsApp/SMS are deferred to Phase 2.)

### 4.4 Inventory
22. Inventory must be owned entirely by the backend API. No frontend may hold business logic for stock.
23. Every sale (web or POS) must deduct stock **inside a database transaction using row-level locking** (`SELECT ... FOR UPDATE`) to prevent two channels overselling the same unit simultaneously.
24. The storefront must be **read-only** for stock and may only trigger a deduction at the moment of checkout, via the API.
25. The admin dashboard must be the **only** place a human creates/edits products, variants, and SKUs, and the only place manual stock adjustments are made.
26. POS must read a cached local snapshot when offline and deduct/restore stock as a side-effect of sales/returns — never used to create or edit product data.
27. The system must support low-stock thresholds and low-stock alerts.

### 4.5 Payments (Provider Toggle)
28. The system must integrate **both Paystack and Flutterwave**.
29. The **active payment provider must be selected via a toggle in the admin panel**. Customers do not choose the provider — checkout uses whichever provider is currently active.
30. Switching the active provider in admin must take effect for new checkouts without a code deploy.
31. Each payment must be recorded per order, tagged by channel and method.

### 4.6 Offline-First POS
32. POS must be a Progressive Web App (PWA). A service worker (Workbox) must precache the entire app shell so the interface loads with zero connectivity.
33. POS must store a cached product/stock snapshot and an **outbox queue of pending offline transactions** in local storage (IndexedDB via Dexie.js).
34. Every offline sale must be written to the outbox **first**, tagged with a **client-generated unique ID**, before it is considered complete — making sync retries idempotent (no duplicate sales).
35. When connectivity returns, the outbox must be replayed to the backend via dedicated sync endpoints (`POST /sync/push`, `POST /sync/pull`).
36. On Android/Chromium, replay should trigger automatically via the Background Sync API. On iPad/Safari (no Background Sync), replay must be achieved via the browser `online` event plus a periodic retry timer while the tab is open.
37. **Reconciliation:** on reconnect, the backend must replay each offline sale in order against authoritative Postgres inventory. If honourable, commit normally. If an item was oversold during the outage, the sale must **not** be silently dropped — it must be **flagged for manual staff review** (manager decides backorder, substitution, or refund).

### 4.7 Admin Dashboard
38. The admin dashboard must provide product/variant/SKU management.
39. The admin dashboard must provide manual stock adjustments with actor + timestamp logging.
40. The admin dashboard must provide staff account management with role-based access control (RBAC).
41. The admin dashboard must provide order oversight across the pipeline.
42. The admin dashboard must expose the payment provider toggle (Req. 29) and the offline-oversell review queue (Req. 37).

---

## 5. Non-Goals (Out of Scope for Phase 1)

1. CRM, lead management, and staff task workflows.
2. Marketing automation, built-in email marketing, WhatsApp/SMS/social integrations.
3. Loyalty points and VIP reward programmes.
4. Business Intelligence / Executive Dashboard and advanced reporting.
5. Native iOS/Android apps, multi-store expansion, vendor marketplace, AI product recommendations.
6. Customer-facing choice of payment provider (the provider is admin-controlled, not shopper-controlled).

---

## 6. Design Considerations

- **Architecture principle:** *One backend, one database, three frontends.* The NestJS API and PostgreSQL DB are the single source of truth. Storefront, admin, and POS are independent apps that read/write through the same API — none contain their own copy of business logic.
- **Monorepo (Turborepo):**
  | Path | App | Description |
  |------|-----|-------------|
  | `apps/storefront` | Storefront | Next.js SSR/ISR customer site (SEO, cart, checkout, accounts, wishlist). |
  | `apps/admin` | Admin | Next.js staff app, RBAC-gated. |
  | `apps/pos` | POS | Offline-first PWA on in-store tablets. |
  | `apps/api` | Backend | NestJS — auth, catalogue, inventory, orders, payments, sync. |
  | `packages/ui` | Shared UI | Shared React component library. |
  | `packages/types` | Shared Types | Shared TS types + API client (one contract). |
- **Why three separate apps:** different auth models (customer vs RBAC staff), different performance needs (storefront needs SEO/speed; admin/POS don't), the offline requirement is POS-specific, and independent deploy risk (an admin bug must never break checkout or a till sale).
- **Storefront visual language (built):** "Editorial Luxury" — warm cream/ink/champagne-gold palette, Fraunces display + Plus Jakarta Sans body, film-grain overlay, scroll-reveal and custom cubic-bezier motion. UI referenced `velaa.framer.website`. Storefront homepage UI is already scaffolded in `apps/storefront`. Frontend code must stay modular per the repo's `code-separation` rule (reusable UI in `/components`, logic in `/hooks`/`/services`/`/utils`).
- **Slugs/codes:** product slugs and any codes must be generated on the backend (slugify + unique suffix) and never exposed as editable form fields, per the repo's `slug-rule`.

---

## 7. Technical Considerations

| Layer | Technology | Notes |
|-------|-----------|-------|
| Storefront | Next.js (React), Tailwind | SSR/ISR for SEO and fast product pages. Already scaffolded. |
| Admin | Next.js (React) | SPA-style, no SEO requirement. |
| POS | Next.js (React) as a PWA | Installed on tablets; works offline via service worker. |
| POS local storage | IndexedDB via Dexie.js | Local product/stock snapshot + outbox queue. |
| Offline shell | Service Worker (Workbox) | Precaches POS app for zero-connectivity load. |
| Backend API | NestJS (Node/TypeScript) | Single API serving all three frontends. Follow `nestjs-best-practices`. |
| Database | PostgreSQL | Single source of truth; row-level locking for stock. |
| Background jobs | BullMQ + Redis | Async side-effects: emails, receipts. |
| Payments | Paystack + Flutterwave | Active provider set via admin toggle. |
| Hosting | Cloud (Railway or equivalent) | Consistent with existing infra. |

**Data model (high level):** `Product`, `Variant` (per-SKU size/colour), `Inventory` (qty per variant per location), `Order` (channel-tagged), `OrderItem` (→ Variant), `Payment` (channel + method), `Customer`, `Staff` (role + permissions).

**Non-functional requirements:**
- **Security:** RBAC, encrypted passwords, SSL/TLS, secure gateway integration, session management with automatic logout.
- **Audit logging:** all inventory changes, price updates, and order modifications logged with actor + timestamp.
- **Performance:** storefront optimised for Core Web Vitals; POS optimised for instant local response regardless of connectivity.
- **Reliability:** no double-charging or duplicate orders on sync retry (idempotent by design).
- **Backup & recovery** on the primary PostgreSQL database.

---

## 8. Success Metrics

1. **Zero overselling incidents** between storefront and POS under normal (online) operation.
2. **POS survives a simulated internet outage** — all offline sales correctly reconciled on reconnect (honoured or flagged for review, never lost or duplicated).
3. **Storefront achieves acceptable Core Web Vitals** for an e-commerce site.
4. **All order-lifecycle transitions are logged and auditable.**
5. **Admin can create/edit a product** and see it reflected correctly on both storefront and POS with no manual intervention.

---

## 9. Open Questions

1. **Reconciliation window:** how long may an offline outbox hold unsynced sales before it must alert staff (e.g. 24h)?
2. **Receipt printing hardware:** WebUSB (Chrome-only) vs a local print-helper agent — depends on the printer model the client selects. Which printer(s)?
3. **Offline card payments:** depend on the physical terminal's store-and-forward capability (hardware/provider feature). Which terminal/provider?
4. **Tablet hardware:** Android (full Background Sync) is recommended over iPad/Safari — is the client flexible on hardware?
5. **Locations/warehouses:** does Phase 1 have a single store+warehouse, or multiple stock locations from day one?
6. **Coupon rules:** what discount/coupon types are needed for launch (percentage, fixed, BOGO, first-order)?
7. **Guest-to-account merge:** if a guest later creates an account with the same email, should prior guest orders be linked automatically?
