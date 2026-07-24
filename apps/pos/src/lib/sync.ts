import { api } from "./api";
import { db, type OutboxItem, type OutboxSale } from "./db";
import { getVatRateBps, setVatRateBps, vatOn } from "./vat";

/** Pull a fresh catalogue/stock snapshot into IndexedDB (PRD Req. 33). */
export async function pullSnapshot(): Promise<number> {
  const { variants, vatRateBps } = await api.pull();
  if (vatRateBps) setVatRateBps(vatRateBps); // keep the till taxing correctly offline
  await db.transaction("rw", db.catalogue, async () => {
    await db.catalogue.clear();
    await db.catalogue.bulkPut(variants);
  });
  return variants.length;
}

/**
 * Record a sale. The outbox row is written FIRST with a client-generated id,
 * before the sale is considered complete — so a later sync retry is idempotent
 * rather than risking a duplicate (PRD Req. 34). Local stock is decremented
 * optimistically so the on-screen snapshot stays believable offline.
 */
export async function recordSale(
  items: OutboxItem[],
  method: OutboxSale["method"],
  discountTotal: number,
): Promise<OutboxSale> {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const taxRate = getVatRateBps();
  const taxable = Math.max(0, subtotal - discountTotal);
  const taxTotal = vatOn(taxable, taxRate);
  const sale: OutboxSale = {
    clientId: crypto.randomUUID(),
    items,
    method,
    discountTotal,
    taxTotal,
    taxRate,
    total: taxable + taxTotal,
    soldAt: new Date().toISOString(),
    synced: 0,
  };

  await db.outbox.add(sale); // outbox first — the sale is now durable
  await db.transaction("rw", db.catalogue, async () => {
    for (const it of items) {
      const v = await db.catalogue.get(it.variantId);
      if (v && v.quantity != null) {
        await db.catalogue.update(it.variantId, { quantity: Math.max(0, v.quantity - it.quantity) });
      }
    }
  });
  return sale;
}

/** Replay every unsynced sale to the server (PRD Req. 35). Safe to call anytime. */
export async function pushOutbox(): Promise<number> {
  const pending = await db.outbox.where("synced").equals(0).toArray();
  if (pending.length === 0) return 0;

  const results = await api.push(pending);
  await db.transaction("rw", db.outbox, async () => {
    for (const r of results) {
      await db.outbox.update(r.clientId, { synced: 1, result: r.status });
    }
  });
  return results.length;
}

export async function pendingCount(): Promise<number> {
  return db.outbox.where("synced").equals(0).count();
}
