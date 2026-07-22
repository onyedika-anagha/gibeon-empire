// Gibeon Empire — Phase 1 data model (PRD Section 7), Drizzle/PostgreSQL.
// PostgreSQL is the single source of truth for products, inventory, orders.
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
  uuid,
} from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["ADMIN", "STORE_MANAGER", "CASHIER"]);
export const channelEnum = pgEnum("channel", ["ONLINE", "POS"]);
export const orderStateEnum = pgEnum("order_state", [
  "RECEIVED",
  "PAYMENT_CONFIRMED",
  "INVENTORY_UPDATED",
  "PICKING",
  "PACKING",
  "DISPATCH",
  "DELIVERED",
  "COMPLETED",
]);
export const paymentMethodEnum = pgEnum("payment_method", ["CARD", "CASH", "TRANSFER", "SPLIT"]);
export const paymentProviderEnum = pgEnum("payment_provider", ["PAYSTACK", "FLUTTERWAVE"]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "CONFIRMED",
  "FAILED",
  "REFUNDED",
]);
export const mediaKindEnum = pgEnum("media_kind", ["IMAGE", "VIDEO"]);

export type Role = (typeof roleEnum.enumValues)[number];
export type Channel = (typeof channelEnum.enumValues)[number];
export type OrderState = (typeof orderStateEnum.enumValues)[number];
export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];
export type PaymentProvider = (typeof paymentProviderEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];

// ── People ────────────────────────────────────────────────────────────
export const staff = pgTable("staff", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("CASHIER"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const addresses = pgTable("addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull(),
  postalCode: text("postal_code"),
  isDefault: boolean("is_default").notNull().default(false),
});

export const passwordResets = pgTable("password_resets", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Catalogue ─────────────────────────────────────────────────────────
export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull().default(""),
    category: text("category").notNull(),
    brand: text("brand").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("products_category_idx").on(t.category)],
);

export const productMedia = pgTable("product_media", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  kind: mediaKindEnum("kind").notNull().default("IMAGE"),
  alt: text("alt"),
  position: integer("position").notNull().default(0),
});

export const variants = pgTable(
  "variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    size: text("size").notNull(),
    color: text("color").notNull(),
    price: integer("price").notNull(), // minor units (kobo/cents)
    compareAtPrice: integer("compare_at_price"),
    barcode: text("barcode").unique(),
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

// ── Inventory ─────────────────────────────────────────────────────────
export const locations = pgTable("locations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => variants.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(3),
  },
  (t) => [uniqueIndex("inventory_variant_location_idx").on(t.variantId, t.locationId)],
);

// ── Orders ────────────────────────────────────────────────────────────
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reference: text("reference").notNull().unique(),
    channel: channelEnum("channel").notNull(),
    state: orderStateEnum("state").notNull().default("RECEIVED"),
    customerId: uuid("customer_id").references(() => customers.id),
    contactEmail: text("contact_email"), // guest checkout has no account (PRD Req. 5)
    subtotal: integer("subtotal").notNull().default(0),
    discountTotal: integer("discount_total").notNull().default(0),
    total: integer("total").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("orders_customer_idx").on(t.customerId), index("orders_state_idx").on(t.state)],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id")
    .notNull()
    .references(() => variants.id),
  nameSnapshot: text("name_snapshot").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
});

// Guarded, logged state transitions (PRD Req. 19).
export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromState: orderStateEnum("from_state"),
    toState: orderStateEnum("to_state").notNull(),
    actor: text("actor").notNull(), // staff id or "system"
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId)],
);

// ── Payments ──────────────────────────────────────────────────────────
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  provider: paymentProviderEnum("provider"),
  method: paymentMethodEnum("method").notNull(),
  channel: channelEnum("channel").notNull(),
  amount: integer("amount").notNull(),
  status: paymentStatusEnum("status").notNull().default("PENDING"),
  reference: text("reference"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── Platform ──────────────────────────────────────────────────────────
// Key/value settings, incl. the active payment provider toggle (PRD Req. 29).
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Audit trail: all inventory, price, and order changes (PRD Req. 19, NFR).
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actor: text("actor").notNull(), // staff id or "system"
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    data: jsonb("data"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("audit_entity_idx").on(t.entity, t.entityId)],
);

export const schema = {
  staff,
  customers,
  addresses,
  passwordResets,
  products,
  productMedia,
  variants,
  locations,
  inventory,
  orders,
  orderItems,
  orderEvents,
  payments,
  settings,
  auditLogs,
};
