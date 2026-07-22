import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { schema, inventory, locations, products, variants } from "../db/schema";
import { InventoryService } from "./inventory.service";
import { AuditService } from "../common/audit/audit.service";
import type { DrizzleDB } from "../db/db.module";

// Integration test — needs the docker Postgres running (DATABASE_URL set).
// Proves PRD Success Metric 1: two simultaneous deductions of the last unit,
// exactly one succeeds (row-level lock, SELECT ... FOR UPDATE).
const hasDb = !!process.env.DATABASE_URL;
const d = hasDb ? describe : describe.skip;

d("InventoryService concurrency (row-level locking)", () => {
  let client: postgres.Sql;
  let db: DrizzleDB;
  let service: InventoryService;
  let variantId: string;
  let productId: string;

  beforeAll(async () => {
    client = postgres(process.env.DATABASE_URL as string, { max: 5 });
    db = drizzle(client, { schema }) as unknown as DrizzleDB;
    service = new InventoryService(db, new AuditService(db));

    const locId = await service.getDefaultLocationId();
    const [p] = await db
      .insert(products)
      .values({ name: "Concurrency Test", slug: `ctest-${Date.now()}`, category: "test", brand: "test" })
      .returning({ id: products.id });
    productId = p.id;
    const [v] = await db
      .insert(variants)
      .values({ productId, sku: `CT-${Date.now()}`, size: "M", color: "black", price: 1000 })
      .returning({ id: variants.id });
    variantId = v.id;
    await db.insert(inventory).values({ variantId, locationId: locId, quantity: 1 });
  });

  afterAll(async () => {
    await db.delete(products).where(eq(products.id, productId)); // cascades variants + inventory
    await client.end();
  });

  it("lets exactly one of two concurrent buyers take the last unit", async () => {
    const results = await Promise.allSettled([
      service.deduct(variantId, 1, "buyer-a"),
      service.deduct(variantId, 1, "buyer-b"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const [row] = await db
      .select({ quantity: inventory.quantity })
      .from(inventory)
      .where(eq(inventory.variantId, variantId));
    expect(row.quantity).toBe(0); // never oversold below zero
  });
});
