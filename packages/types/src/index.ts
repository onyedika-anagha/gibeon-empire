// ── Gibeon Empire · shared domain contract ────────────────────────────
// Single source of type truth across storefront, admin, POS, and the API.
// Mirrors the PRD data model (Section 7).

export type ID = string;
export type ISODate = string;

export type Channel = "online" | "pos";

export type PaymentMethod = "card" | "cash" | "transfer" | "split";

export type PaymentProvider = "paystack" | "flutterwave";

/** Shared order lifecycle — one state machine for web and in-store (PRD Req. 18). */
export const ORDER_STATES = [
  "received",
  "payment_confirmed",
  "inventory_updated",
  "picking",
  "packing",
  "dispatch",
  "delivered",
  "completed",
] as const;
export type OrderState = (typeof ORDER_STATES)[number];

export type Role = "admin" | "store_manager" | "cashier";

export type StockState = "in_stock" | "low_stock" | "sold_out";

// ── Catalogue ─────────────────────────────────────────────────────────
export interface Product {
  id: ID;
  name: string;
  slug: string; // backend-generated, immutable (slug-rule)
  description: string;
  category: string;
  brand: string;
  media: MediaAsset[];
  variants: Variant[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface MediaAsset {
  id: ID;
  url: string;
  kind: "image" | "video";
  alt?: string;
}

export interface Variant {
  id: ID;
  productId: ID;
  sku: string; // backend-generated
  size: string;
  color: string;
  price: number; // minor units (kobo/cents)
  compareAtPrice?: number;
  barcode?: string;
}

// ── Inventory ─────────────────────────────────────────────────────────
export interface InventoryRecord {
  variantId: ID;
  locationId: ID;
  quantity: number;
  lowStockThreshold: number;
}

/** What the storefront may read (never the raw quantity) (PRD Req. 4, 24). */
export interface VariantStock {
  variantId: ID;
  state: StockState;
  /** present only when low, to power "only N left" */
  remaining?: number;
}

// ── Orders ────────────────────────────────────────────────────────────
export interface Order {
  id: ID;
  reference: string; // backend-generated
  channel: Channel;
  state: OrderState;
  customerId?: ID; // absent for guest checkout (PRD Req. 5)
  items: OrderItem[];
  payment?: Payment;
  subtotal: number;
  discountTotal: number;
  total: number;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface OrderItem {
  id: ID;
  variantId: ID;
  nameSnapshot: string; // captured at purchase time
  unitPrice: number;
  quantity: number;
}

export interface OrderTransition {
  from: OrderState | null;
  to: OrderState;
  at: ISODate;
  actor: string; // staff id or "system"
}

// ── Payments ──────────────────────────────────────────────────────────
export interface Payment {
  id: ID;
  orderId: ID;
  provider?: PaymentProvider; // online only
  method: PaymentMethod;
  channel: Channel;
  amount: number;
  status: "pending" | "confirmed" | "failed" | "refunded";
  reference?: string;
}

// ── People ────────────────────────────────────────────────────────────
export interface Customer {
  id: ID;
  email: string;
  firstName: string;
  lastName: string;
  addresses: Address[];
  createdAt: ISODate;
}

export interface Address {
  id: ID;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
}

export interface Staff {
  id: ID;
  email: string;
  name: string;
  role: Role;
}

// ── Offline sync (POS) ────────────────────────────────────────────────
/** An offline sale queued in the POS outbox (PRD Req. 34). */
export interface OutboxSale {
  clientId: ID; // client-generated, guarantees idempotency
  items: Array<{ variantId: ID; quantity: number; unitPrice: number }>;
  method: PaymentMethod;
  discountTotal: number;
  total: number;
  soldAt: ISODate;
}

export type ReconciliationResult =
  | { clientId: ID; status: "committed"; orderId: ID }
  | { clientId: ID; status: "flagged_oversell"; reviewId: ID }
  | { clientId: ID; status: "duplicate_ignored" };
