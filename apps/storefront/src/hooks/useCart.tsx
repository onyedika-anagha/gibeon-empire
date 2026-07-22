"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartItem {
  variantId: string;
  slug: string;
  name: string;
  size: string;
  color: string;
  price: number; // minor units
  quantity: number;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "gibeon.cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore corrupt cart */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartCtx>(() => {
    return {
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
      add: (item, qty = 1) =>
        setItems((prev) => {
          const found = prev.find((i) => i.variantId === item.variantId);
          if (found) {
            return prev.map((i) =>
              i.variantId === item.variantId ? { ...i, quantity: i.quantity + qty } : i,
            );
          }
          return [...prev, { ...item, quantity: qty }];
        }),
      setQty: (variantId, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((i) => i.variantId !== variantId)
            : prev.map((i) => (i.variantId === variantId ? { ...i, quantity: qty } : i)),
        ),
      remove: (variantId) => setItems((prev) => prev.filter((i) => i.variantId !== variantId)),
      clear: () => setItems([]),
      isOpen,
      setOpen,
    };
  }, [items, isOpen]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
