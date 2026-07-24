import Dexie, { type Table } from "dexie";

export interface SnapshotVariant {
  variantId: string;
  sku: string;
  barcode: string | null;
  size: string;
  color: string;
  price: number;
  productId: string;
  productName: string;
  category: string;
  image: string | null; // product cover, cached with the snapshot for offline use
  quantity: number | null;
}

export interface OutboxItem {
  variantId: string;
  quantity: number;
  unitPrice: number;
  name: string;
}

export interface OutboxSale {
  clientId: string; // client-generated — the idempotency key (PRD Req. 34)
  items: OutboxItem[];
  method: "CARD" | "CASH" | "TRANSFER" | "SPLIT";
  discountTotal: number;
  taxTotal: number;
  taxRate: number; // basis points, snapshotted so the receipt stays truthful
  total: number;
  soldAt: string;
  synced: 0 | 1;
  result?: string; // reconciliation outcome once synced
}

class PosDB extends Dexie {
  catalogue!: Table<SnapshotVariant, string>;
  outbox!: Table<OutboxSale, string>;

  constructor() {
    super("gibeon-pos");
    this.version(1).stores({
      catalogue: "variantId, barcode, sku, category",
      outbox: "clientId, synced",
    });
  }
}

export const db = new PosDB();
