"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { db, type OutboxSale, type SnapshotVariant } from "@/lib/db";
import { recordSale } from "@/lib/sync";
import { formatMoney } from "@/lib/format";
import { usePos } from "@/hooks/usePos";
import { useBarcode } from "@/hooks/useBarcode";
import Receipt from "./Receipt";

interface CartLine {
  variantId: string;
  name: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
}
const METHODS: OutboxSale["method"][] = ["CASH", "CARD", "TRANSFER", "SPLIT"];

export default function SaleScreen() {
  const { syncNow, lastSync } = usePos();
  const [catalogue, setCatalogue] = useState<SnapshotVariant[]>([]);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState<OutboxSale["method"]>("CASH");
  const [receipt, setReceipt] = useState<OutboxSale | null>(null);
  const [flash, setFlash] = useState("");

  const reload = useCallback(async () => setCatalogue(await db.catalogue.toArray()), []);
  useEffect(() => {
    void reload();
  }, [reload, lastSync]);

  const addLine = useCallback((v: SnapshotVariant) => {
    setCart((prev) => {
      const found = prev.find((l) => l.variantId === v.variantId);
      if (found) return prev.map((l) => (l.variantId === v.variantId ? { ...l, quantity: l.quantity + 1 } : l));
      return [
        ...prev,
        { variantId: v.variantId, name: v.productName, size: v.size, color: v.color, unitPrice: v.price, quantity: 1 },
      ];
    });
  }, []);

  // Barcode scan → look up in the local snapshot and add.
  useBarcode(
    useCallback(
      (code: string) => {
        void db.catalogue
          .where("barcode")
          .equals(code)
          .first()
          .then((v) => {
            if (v) {
              addLine(v);
              setFlash(`Scanned ${v.productName}`);
            } else {
              setFlash(`No match for ${code}`);
            }
            setTimeout(() => setFlash(""), 1500);
          });
      },
      [addLine],
    ),
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? catalogue.filter(
          (v) =>
            v.productName.toLowerCase().includes(q) ||
            v.sku.toLowerCase().includes(q) ||
            (v.barcode ?? "").toLowerCase().includes(q),
        )
      : catalogue;
    return list.slice(0, 24);
  }, [catalogue, query]);

  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  function setQty(variantId: string, qty: number) {
    setCart((prev) =>
      qty <= 0 ? prev.filter((l) => l.variantId !== variantId) : prev.map((l) => (l.variantId === variantId ? { ...l, quantity: qty } : l)),
    );
  }

  async function complete() {
    if (cart.length === 0) return;
    const items = cart.map((c) => ({
      variantId: c.variantId,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      name: `${c.name} — ${c.size}/${c.color}`,
    }));
    const sale = await recordSale(items, method, discount);
    setReceipt(sale);
    setCart([]);
    setDiscount(0);
    void syncNow(); // best-effort push; queued if offline
    await reload();
  }

  return (
    <div className="grid h-[calc(100vh-53px)] grid-cols-[1fr_22rem]">
      {/* Catalogue */}
      <section className="overflow-y-auto border-r border-line p-6">
        <input
          data-barcode="ignore"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search or scan a barcode…"
          className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-ink"
        />
        {flash && <p className="mt-2 text-xs text-gold">{flash}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((v) => {
            const soldOut = v.quantity === 0;
            return (
              <button
                key={v.variantId}
                disabled={soldOut}
                onClick={() => addLine(v)}
                className="rounded-xl border border-line bg-white p-3 text-left transition hover:border-ink disabled:opacity-40"
              >
                <div className="aspect-square rounded-lg bg-gradient-to-br from-mist to-line" />
                <p className="mt-2 line-clamp-1 text-[13px] font-medium text-ink">{v.productName}</p>
                <p className="text-[11px] text-slate">
                  {v.size} · {v.color}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[13px] text-ink">{formatMoney(v.price)}</span>
                  <span className="text-[11px] text-slate">{v.quantity ?? "–"} left</span>
                </div>
              </button>
            );
          })}
        </div>
        {results.length === 0 && (
          <p className="mt-10 text-center text-sm text-slate">
            {catalogue.length === 0 ? "No catalogue yet — connect and sync." : "No matches."}
          </p>
        )}
      </section>

      {/* Sale */}
      <aside className="flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto p-5">
          <h2 className="text-sm font-semibold text-ink">Current sale</h2>
          {cart.length === 0 ? (
            <p className="mt-6 text-sm text-slate">Scan or tap a product to begin.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {cart.map((l) => (
                <li key={l.variantId} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-ink">{l.name}</p>
                    <p className="text-[11px] text-slate">
                      {l.size} · {l.color} · {formatMoney(l.unitPrice)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setQty(l.variantId, l.quantity - 1)} className="h-7 w-7 rounded-md border border-line">
                      −
                    </button>
                    <span className="w-5 text-center">{l.quantity}</span>
                    <button onClick={() => setQty(l.variantId, l.quantity + 1)} className="h-7 w-7 rounded-md border border-line">
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-line p-5">
          <label className="flex items-center justify-between text-sm text-slate">
            Discount
            <input
              data-barcode="ignore"
              type="number"
              min={0}
              value={discount / 100 || ""}
              onChange={(e) => setDiscount(Math.max(0, Math.round(Number(e.target.value) * 100)))}
              className="w-24 rounded-md border border-line px-2 py-1 text-right text-sm"
            />
          </label>
          <div className="mt-3 flex justify-between text-sm text-slate">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-lg font-semibold text-ink">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`rounded-md py-2 text-xs font-medium transition ${
                  method === m ? "bg-ink text-white" : "border border-line text-ink"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={complete}
            disabled={cart.length === 0}
            className="mt-4 w-full rounded-xl bg-ink py-3.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Charge {formatMoney(total)}
          </button>
        </div>
      </aside>

      {receipt && <Receipt sale={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
