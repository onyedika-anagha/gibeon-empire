import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq } from "drizzle-orm";
import {
  schema,
  inventory,
  orders,
  orderItems,
  oversellReviews,
  posSales,
  productMedia,
  products,
  variants,
  locations,
} from "../db/schema";
import { SyncService, type OutboxSale } from "./sync.service";
import { AuditService } from "../common/audit/audit.service";
import { SettingsService } from "../settings/settings.service";
import type { DrizzleDB } from "../db/db.module";

// Integration test — needs the docker Postgres running (DATABASE_URL set).
// Proves PRD Success Metric 2: offline sales reconcile correctly, replays are
// idempotent (no duplicate orders), and oversell conflicts are flagged.
const hasDb = !!process.env.DATABASE_URL;
const d = hasDb ? describe : describe.skip;

d("SyncService reconciliation (offline POS)", () => {
  let client: postgres.Sql;
  let db: DrizzleDB;
  let service: SyncService;
  let variantId: string;
  let productId: string;
  let locationId: string;

  beforeAll(async () => {
    client = postgres(process.env.DATABASE_URL as string, { max: 5 });
    db = drizzle(client, { schema }) as unknown as DrizzleDB;
    service = new SyncService(db, new AuditService(db), new SettingsService(db));

    const [loc] = await db.select({ id: locations.id }).from(locations).where(eq(locations.isDefault, true));
    locationId = loc.id;
    const [p] = await db
      .insert(products)
      .values({ name: "POS Test", slug: `postest-${Date.now()}`, category: "test", brand: "test" })
      .returning({ id: products.id });
    productId = p.id;
    const [v] = await db
      .insert(variants)
      .values({ productId, sku: `POS-${Date.now()}`, size: "M", color: "black", price: 5000 })
      .returning({ id: variants.id });
    variantId = v.id;
    await db.insert(inventory).values({ variantId, locationId, quantity: 3 });
  });

  afterAll(async () => {
    // Delete in FK-dependency order: posSales → orders (cascades items/events/
    // payments) → reviews → product (cascades variants/inventory).
    const its = await db.select({ orderId: orderItems.orderId }).from(orderItems).where(eq(orderItems.variantId, variantId));
    const orderIds = [...new Set(its.map((i) => i.orderId))];
    await db.delete(posSales).where(eq(posSales.clientId, "sale-1"));
    await db.delete(posSales).where(eq(posSales.clientId, "sale-oversell"));
    for (const oid of orderIds) await db.delete(orders).where(eq(orders.id, oid));
    await db.delete(oversellReviews).where(eq(oversellReviews.variantId, variantId));
    await db.delete(products).where(eq(products.id, productId));
    await client.end();
  });

  function sale(clientId: string, qty: number): OutboxSale {
    return {
      clientId,
      items: [{ variantId, quantity: qty, unitPrice: 5000 }],
      method: "CASH",
      discountTotal: 0,
      soldAt: new Date().toISOString(),
    };
  }

  it("hands the till a cover image and the VAT rate with the snapshot", async () => {
    // Position 1 is inserted first to prove the lowest position wins.
    await db.insert(productMedia).values([
      { productId, url: "https://cdn.test/second.png", position: 1 },
      { productId, url: "https://cdn.test/cover.png", position: 0 },
    ]);

    const snapshot = await service.pull();
    expect(snapshot.vatRateBps).toBeGreaterThan(0);
    const row = snapshot.variants.find((v) => v.variantId === variantId);
    expect(row?.image).toBe("https://cdn.test/cover.png");
  });

  it("commits a normal offline sale and deducts stock", async () => {
    const [res] = await service.push([sale("sale-1", 2)], "cashier-1");
    expect(res.status).toBe("committed");

    const [inv] = await db
      .select({ quantity: inventory.quantity })
      .from(inventory)
      .where(and(eq(inventory.variantId, variantId), eq(inventory.locationId, locationId)));
    expect(inv.quantity).toBe(1); // 3 - 2
  });

  it("is idempotent — replaying the same clientId creates no second order", async () => {
    const before = (await db.select().from(orders).where(eq(orders.channel, "POS"))).length;
    const [res] = await service.push([sale("sale-1", 2)], "cashier-1");
    expect(res.status).toBe("duplicate_ignored");

    const after = (await db.select().from(orders).where(eq(orders.channel, "POS"))).length;
    expect(after).toBe(before); // no new order, stock unchanged
    const [inv] = await db
      .select({ quantity: inventory.quantity })
      .from(inventory)
      .where(and(eq(inventory.variantId, variantId), eq(inventory.locationId, locationId)));
    expect(inv.quantity).toBe(1);
  });

  it("flags an oversell for manual review instead of dropping the sale", async () => {
    // Only 1 left, but the till sold 3 offline.
    const [res] = await service.push([sale("sale-oversell", 3)], "cashier-1");
    expect(res.status).toBe("flagged_oversell");

    const reviews = await db
      .select()
      .from(oversellReviews)
      .where(eq(oversellReviews.saleClientId, "sale-oversell"));
    expect(reviews).toHaveLength(1);
    expect(reviews[0].quantity).toBe(2); // 3 wanted - 1 available

    const [inv] = await db
      .select({ quantity: inventory.quantity })
      .from(inventory)
      .where(and(eq(inventory.variantId, variantId), eq(inventory.locationId, locationId)));
    expect(inv.quantity).toBe(0); // never negative
  });
});
