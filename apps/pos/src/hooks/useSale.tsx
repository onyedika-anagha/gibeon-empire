"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { db, type OutboxSale, type SnapshotVariant } from "@/lib/db";
import { recordSale } from "@/lib/sync";
import { usePos } from "@/hooks/usePos";
import { useBarcode } from "@/hooks/useBarcode";

export interface CartLine {
  variantId: string;
  name: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
}

export const METHODS: OutboxSale["method"][] = ["CASH", "CARD", "TRANSFER", "SPLIT"];

/** All till/cart state and operations for the sale screen. */
export function useSale() {
  const { syncNow, lastSync } = usePos();
  const [catalogue, setCatalogue] = useState<SnapshotVariant[]>([]);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState<OutboxSale["method"]>("CASH");
  const [receipt, setReceipt] = useState<OutboxSale | null>(null);
  const [flash, setFlash] = useState("");
  const [confirming, setConfirming] = useState(false);

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
  const count = cart.reduce((s, l) => s + l.quantity, 0);

  const setQty = useCallback((variantId: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((l) => l.variantId !== variantId)
        : prev.map((l) => (l.variantId === variantId ? { ...l, quantity: qty } : l)),
    );
  }, []);

  // Writes the sale to the outbox and resets the till.
  const finalize = useCallback(async () => {
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
    setConfirming(false);
    void syncNow(); // best-effort push; queued if offline
    await reload();
  }, [cart, method, discount, syncNow, reload]);

  // Cash is in hand, so it completes straight away. Electronic methods
  // (transfer/card/split) get an explicit "payment received" confirmation
  // first — the cashier verifies the money actually landed.
  const complete = useCallback(() => {
    if (cart.length === 0) return;
    if (method === "CASH") {
      void finalize();
      return;
    }
    setConfirming(true);
  }, [cart.length, method, finalize]);

  return {
    catalogue,
    query,
    setQuery,
    results,
    flash,
    cart,
    count,
    addLine,
    setQty,
    discount,
    setDiscount,
    method,
    setMethod,
    subtotal,
    total,
    complete,
    confirming,
    confirmPayment: finalize,
    cancelConfirm: () => setConfirming(false),
    receipt,
    clearReceipt: () => setReceipt(null),
  };
}
