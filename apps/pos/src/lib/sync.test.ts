import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "./db";
import { recordSale, pushOutbox, pendingCount } from "./sync";

vi.mock("./api", () => ({
  api: {
    push: vi.fn(async (sales: Array<{ clientId: string }>) =>
      sales.map((s) => ({ clientId: s.clientId, status: "committed", orderReference: "GE-X" })),
    ),
  },
}));

import { api } from "./api";

const item = { variantId: "v1", quantity: 2, unitPrice: 5000, name: "Silk Slip — S/Ink" };

describe("POS outbox sync", () => {
  beforeEach(async () => {
    await db.outbox.clear();
    await db.catalogue.clear();
    vi.clearAllMocks();
  });

  it("writes the sale to the outbox first, with a client-generated id (Req. 34)", async () => {
    const sale = await recordSale([item], "CASH", 0);
    expect(sale.clientId).toEqual(expect.any(String));
    // ₦100 + 7.5% VAT, charged at the till exactly as the server will re-price it.
    expect(sale.taxTotal).toBe(750);
    expect(sale.total).toBe(10750);

    const rows = await db.outbox.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0].synced).toBe(0);
    expect(rows[0].items[0].variantId).toBe("v1");
  });

  it("pushes pending sales and marks them synced", async () => {
    await recordSale([item], "CASH", 0);
    const n = await pushOutbox();
    expect(n).toBe(1);
    expect(api.push).toHaveBeenCalledTimes(1);
    expect(await pendingCount()).toBe(0);
  });

  it("is idempotent — a second push sends nothing (no duplicate)", async () => {
    await recordSale([item], "CASH", 0);
    await pushOutbox();
    vi.clearAllMocks();

    const n = await pushOutbox();
    expect(n).toBe(0);
    expect(api.push).not.toHaveBeenCalled();
  });

  it("decrements the local snapshot optimistically", async () => {
    await db.catalogue.put({
      variantId: "v1",
      sku: "GE-1",
      barcode: null,
      size: "S",
      color: "Ink",
      price: 5000,
      productId: "p1",
      productName: "Silk Slip",
      category: "party-wear",
      image: null,
      quantity: 5,
    });
    await recordSale([item], "CASH", 0);
    const v = await db.catalogue.get("v1");
    expect(v?.quantity).toBe(3); // 5 - 2
  });
});
