import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, inArray, lte, sql } from "drizzle-orm";
import { DRIZZLE, type DrizzleDB } from "../db/db.module";
import { inventory, locations, products, variants } from "../db/schema";
import { AuditService } from "../common/audit/audit.service";

export type StockState = "in_stock" | "low_stock" | "sold_out";

export interface VariantStock {
  variantId: string;
  state: StockState;
  remaining?: number; // only when low, powers "only N left"
}

function toState(qty: number, threshold: number): VariantStock["state"] {
  if (qty <= 0) return "sold_out";
  if (qty <= threshold) return "low_stock";
  return "in_stock";
}

@Injectable()
export class InventoryService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly audit: AuditService,
  ) {}

  private defaultLocationId?: string;

  async getDefaultLocationId(): Promise<string> {
    if (this.defaultLocationId) return this.defaultLocationId;
    const [loc] = await this.db
      .select({ id: locations.id })
      .from(locations)
      .where(eq(locations.isDefault, true))
      .limit(1);
    if (!loc) throw new NotFoundException("No default location configured");
    this.defaultLocationId = loc.id;
    return loc.id;
  }

  /**
   * Storefront-facing stock read (PRD Req. 4, 24). Returns state per variant —
   * never the raw quantity, except the "N left" hint once stock is low.
   */
  async getStockStates(variantIds: string[]): Promise<VariantStock[]> {
    if (variantIds.length === 0) return [];
    const rows = await this.db
      .select({
        variantId: inventory.variantId,
        qty: sql<number>`sum(${inventory.quantity})::int`,
        threshold: sql<number>`min(${inventory.lowStockThreshold})::int`,
      })
      .from(inventory)
      .where(inArray(inventory.variantId, variantIds))
      .groupBy(inventory.variantId);

    return rows.map((r) => {
      const state = toState(r.qty, r.threshold);
      return state === "low_stock"
        ? { variantId: r.variantId, state, remaining: r.qty }
        : { variantId: r.variantId, state };
    });
  }

  /**
   * The anti-oversell core (PRD Req. 23): deduct inside a transaction, taking a
   * row-level lock (SELECT ... FOR UPDATE) so two channels can never sell the
   * same unit at once. Throws 409 if stock is insufficient.
   */
  async deduct(
    variantId: string,
    quantity: number,
    actor: string,
    locationId?: string,
  ): Promise<{ remaining: number }> {
    const locId = locationId ?? (await this.getDefaultLocationId());

    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .select({ id: inventory.id, quantity: inventory.quantity, threshold: inventory.lowStockThreshold })
        .from(inventory)
        .where(and(eq(inventory.variantId, variantId), eq(inventory.locationId, locId)))
        .for("update");

      if (!row) throw new NotFoundException("No inventory record for variant");
      if (row.quantity < quantity) {
        throw new ConflictException("Insufficient stock");
      }

      const remaining = row.quantity - quantity;
      await tx.update(inventory).set({ quantity: remaining }).where(eq(inventory.id, row.id));

      await this.audit.record(
        {
          actor,
          action: "inventory.deduct",
          entity: "inventory",
          entityId: variantId,
          data: { quantity, remaining, locationId: locId },
        },
        tx as unknown as DrizzleDB,
      );

      // Low-stock alert trigger (PRD Req. 27): log when a deduction crosses the threshold.
      if (remaining > 0 && remaining <= row.threshold) {
        await this.audit.record(
          {
            actor: "system",
            action: "inventory.low_stock",
            entity: "inventory",
            entityId: variantId,
            data: { remaining, threshold: row.threshold, locationId: locId },
          },
          tx as unknown as DrizzleDB,
        );
      }

      return { remaining };
    });
  }

  /** Restore stock on a return/refund/cancel (PRD Req. 16). */
  async restore(
    variantId: string,
    quantity: number,
    actor: string,
    locationId?: string,
  ): Promise<{ quantity: number }> {
    const locId = locationId ?? (await this.getDefaultLocationId());
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .select({ id: inventory.id, quantity: inventory.quantity })
        .from(inventory)
        .where(and(eq(inventory.variantId, variantId), eq(inventory.locationId, locId)))
        .for("update");
      if (!row) throw new NotFoundException("No inventory record for variant");

      const next = row.quantity + quantity;
      await tx.update(inventory).set({ quantity: next }).where(eq(inventory.id, row.id));
      await this.audit.record(
        {
          actor,
          action: "inventory.restore",
          entity: "inventory",
          entityId: variantId,
          data: { quantity, result: next, locationId: locId },
        },
        tx as unknown as DrizzleDB,
      );
      return { quantity: next };
    });
  }

  /** Manual stock adjustment by staff — corrections, damage, transfers (PRD Req. 25, 39). */
  async adjust(
    variantId: string,
    mode: "set" | "delta",
    value: number,
    reason: string,
    actor: string,
    locationId?: string,
  ): Promise<{ quantity: number }> {
    const locId = locationId ?? (await this.getDefaultLocationId());
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .select({ id: inventory.id, quantity: inventory.quantity })
        .from(inventory)
        .where(and(eq(inventory.variantId, variantId), eq(inventory.locationId, locId)))
        .for("update");
      if (!row) throw new NotFoundException("No inventory record for variant");

      const next = mode === "set" ? value : row.quantity + value;
      if (next < 0) throw new ConflictException("Adjustment would drive stock negative");

      await tx.update(inventory).set({ quantity: next }).where(eq(inventory.id, row.id));
      await this.audit.record(
        {
          actor,
          action: "inventory.adjust",
          entity: "inventory",
          entityId: variantId,
          data: { mode, value, from: row.quantity, to: next, reason, locationId: locId },
        },
        tx as unknown as DrizzleDB,
      );
      return { quantity: next };
    });
  }

  /**
   * Rows at or below their low-stock threshold (PRD Req. 27), joined with the
   * catalogue — a restock screen showing bare ids is unusable.
   */
  async listLowStock() {
    return this.db
      .select({
        variantId: inventory.variantId,
        locationId: inventory.locationId,
        quantity: inventory.quantity,
        lowStockThreshold: inventory.lowStockThreshold,
        sku: variants.sku,
        size: variants.size,
        color: variants.color,
        productName: products.name,
        productSlug: products.slug,
      })
      .from(inventory)
      .innerJoin(variants, eq(variants.id, inventory.variantId))
      .innerJoin(products, eq(products.id, variants.productId))
      .where(lte(inventory.quantity, inventory.lowStockThreshold))
      .orderBy(products.name, variants.size);
  }
}
