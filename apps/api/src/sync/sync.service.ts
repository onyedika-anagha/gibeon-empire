import { Inject, Injectable } from "@nestjs/common";
import { and, eq, inArray } from "drizzle-orm";
import { DRIZZLE, type DrizzleDB } from "../db/db.module";
import {
  inventory,
  locations,
  orderEvents,
  orderItems,
  orders,
  oversellReviews,
  payments,
  posSales,
  productMedia,
  products,
  variants,
  type PaymentMethod,
} from "../db/schema";
import { AuditService } from "../common/audit/audit.service";
import { generateReference } from "../common/reference";
import { SettingsService, vatOn } from "../settings/settings.service";

export interface OutboxSale {
  clientId: string; // client-generated, guarantees idempotency
  items: Array<{ variantId: string; quantity: number; unitPrice: number }>;
  method: PaymentMethod;
  discountTotal: number;
  soldAt: string;
}

export type ReconciliationResult =
  | { clientId: string; status: "committed"; orderReference: string }
  | { clientId: string; status: "flagged_oversell"; orderReference: string }
  | { clientId: string; status: "duplicate_ignored" };

@Injectable()
export class SyncService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly audit: AuditService,
    private readonly settings: SettingsService,
  ) {}

  private locationId?: string;
  private async defaultLocation() {
    if (this.locationId) return this.locationId;
    const [loc] = await this.db.select({ id: locations.id }).from(locations).where(eq(locations.isDefault, true));
    this.locationId = loc.id;
    return loc.id;
  }

  /** POS pulls a fresh sellable snapshot to cache locally (PRD Req. 33). */
  async pull() {
    const locationId = await this.defaultLocation();
    const rows = await this.db
      .select({
        variantId: variants.id,
        sku: variants.sku,
        barcode: variants.barcode,
        size: variants.size,
        color: variants.color,
        price: variants.price,
        productId: products.id,
        productName: products.name,
        category: products.category,
        quantity: inventory.quantity,
      })
      .from(variants)
      .innerJoin(products, eq(products.id, variants.productId))
      .leftJoin(inventory, and(eq(inventory.variantId, variants.id), eq(inventory.locationId, locationId)));

    // Cover image per product, so the till grid isn't a wall of grey placeholders.
    const media = await this.db
      .select({ productId: productMedia.productId, url: productMedia.url, position: productMedia.position })
      .from(productMedia)
      .where(eq(productMedia.kind, "IMAGE"));
    const cover = new Map<string, { url: string; position: number }>();
    for (const m of media) {
      const seen = cover.get(m.productId);
      if (!seen || m.position < seen.position) cover.set(m.productId, m);
    }

    // The till needs the VAT rate cached too — it prices sales while offline.
    const vatRateBps = await this.settings.getVatRateBps();
    return {
      syncedAt: new Date().toISOString(),
      vatRateBps,
      variants: rows.map((r) => ({ ...r, image: cover.get(r.productId)?.url ?? null })),
    };
  }

  /** Replay the offline outbox (PRD Req. 35, 37). Idempotent + oversell-safe. */
  async push(sales: OutboxSale[], actor: string): Promise<ReconciliationResult[]> {
    const locationId = await this.defaultLocation();
    const taxRate = await this.settings.getVatRateBps();
    const results: ReconciliationResult[] = [];
    // Sequential: preserves the real-world order of offline sales.
    for (const sale of sales) {
      results.push(await this.reconcileSale(sale, actor, locationId, taxRate));
    }
    return results;
  }

  private async reconcileSale(
    sale: OutboxSale,
    actor: string,
    locationId: string,
    taxRate: number,
  ): Promise<ReconciliationResult> {
    return this.db.transaction(async (tx) => {
      // 1. Claim the client id — a duplicate replay conflicts and is ignored.
      const claim = await tx
        .insert(posSales)
        .values({ clientId: sale.clientId, status: "COMMITTED" })
        .onConflictDoNothing()
        .returning({ id: posSales.id });
      if (claim.length === 0) {
        return { clientId: sale.clientId, status: "duplicate_ignored" };
      }
      const posSaleId = claim[0].id;

      // 2. Snapshot names + totals (server recomputes; never trusts client totals).
      const ids = sale.items.map((i) => i.variantId);
      const meta = await tx
        .select({ id: variants.id, name: products.name, size: variants.size, color: variants.color })
        .from(variants)
        .innerJoin(products, eq(products.id, variants.productId))
        .where(inArray(variants.id, ids));
      const byId = new Map(meta.map((m) => [m.id, m]));

      const subtotal = sale.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      // Same VAT rule as online checkout; the till charged this at the point of sale.
      const taxable = Math.max(0, subtotal - sale.discountTotal);
      const taxTotal = vatOn(taxable, taxRate);
      const total = taxable + taxTotal;
      const reference = generateReference();

      const [order] = await tx
        .insert(orders)
        .values({
          reference,
          channel: "POS",
          subtotal,
          discountTotal: sale.discountTotal,
          taxTotal,
          taxRate,
          total,
        })
        .returning({ id: orders.id });

      await tx.insert(orderItems).values(
        sale.items.map((i) => ({
          orderId: order.id,
          variantId: i.variantId,
          nameSnapshot: byId.get(i.variantId)
            ? `${byId.get(i.variantId)!.name} — ${byId.get(i.variantId)!.size}/${byId.get(i.variantId)!.color}`
            : "Unknown item",
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
      );
      await tx.insert(orderEvents).values({ orderId: order.id, toState: "RECEIVED", actor });

      // 3. Deduct against authoritative stock, taking a row lock. The sale
      //    already happened offline, so we take what's available and flag any
      //    shortfall for manual review rather than dropping the sale (Req. 37).
      let oversold = false;
      for (const item of sale.items) {
        const [inv] = await tx
          .select({ id: inventory.id, quantity: inventory.quantity })
          .from(inventory)
          .where(and(eq(inventory.variantId, item.variantId), eq(inventory.locationId, locationId)))
          .for("update");
        const available = inv?.quantity ?? 0;
        const take = Math.min(available, item.quantity);
        if (inv) await tx.update(inventory).set({ quantity: available - take }).where(eq(inventory.id, inv.id));

        const shortfall = item.quantity - take;
        if (shortfall > 0) {
          oversold = true;
          await tx.insert(oversellReviews).values({
            variantId: item.variantId,
            quantity: shortfall,
            saleClientId: sale.clientId,
            orderReference: reference,
          });
        }
      }

      // 4. Payment was taken at the till; advance the order through the pipeline.
      await tx.insert(payments).values({
        orderId: order.id,
        method: sale.method,
        channel: "POS",
        amount: total,
        status: "CONFIRMED",
      });
      await tx.update(orders).set({ state: "INVENTORY_UPDATED", updatedAt: new Date() }).where(eq(orders.id, order.id));
      await tx.insert(orderEvents).values([
        { orderId: order.id, fromState: "RECEIVED", toState: "PAYMENT_CONFIRMED", actor },
        { orderId: order.id, fromState: "PAYMENT_CONFIRMED", toState: "INVENTORY_UPDATED", actor },
      ]);

      const status = oversold ? "FLAGGED" : "COMMITTED";
      await tx.update(posSales).set({ status, orderId: order.id }).where(eq(posSales.id, posSaleId));
      await this.audit.record(
        { actor, action: "pos.reconcile", entity: "order", entityId: order.id, data: { clientId: sale.clientId, status } },
        tx as unknown as DrizzleDB,
      );

      return {
        clientId: sale.clientId,
        status: oversold ? "flagged_oversell" : "committed",
        orderReference: reference,
      };
    });
  }
}
