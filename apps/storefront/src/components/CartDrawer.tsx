"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "@/hooks/useCart";
import { formatMoney } from "@/lib/format";
import OrderTotals from "./OrderTotals";
import { EASE } from "./motion";

export default function CartDrawer() {
  const { items, subtotal, setQty, remove, isOpen, setOpen } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[70] bg-ink/30 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="fixed right-0 top-0 z-[71] flex h-full w-full max-w-md flex-col bg-ivory shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-ink/8 px-6 py-5">
              <h2 className="font-display text-xl text-ink">Your bag</h2>
              <button onClick={() => setOpen(false)} className="text-sm text-stone hover:text-ink">
                Close
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <p className="mt-16 text-center text-sm text-taupe">Your bag is empty.</p>
              ) : (
                <ul className="space-y-5">
                  {items.map((i) => (
                    <li key={i.variantId} className="flex gap-4">
                      {/* Gradient stands in for products without photography. */}
                      <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-sand to-blush">
                        {i.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between gap-2">
                          <p className="text-[14px] leading-tight text-ink">{i.name}</p>
                          <button onClick={() => remove(i.variantId)} className="text-xs text-taupe hover:text-ink">
                            ✕
                          </button>
                        </div>
                        <p className="mt-0.5 text-[12px] text-taupe">
                          {i.size} · {i.color}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2 rounded-full ring-1 ring-ink/10">
                            <button onClick={() => setQty(i.variantId, i.quantity - 1)} className="grid h-7 w-7 place-items-center text-ink/70">
                              −
                            </button>
                            <span className="w-4 text-center text-sm">{i.quantity}</span>
                            <button onClick={() => setQty(i.variantId, i.quantity + 1)} className="grid h-7 w-7 place-items-center text-ink/70">
                              +
                            </button>
                          </div>
                          <span className="text-[14px] text-ink">{formatMoney(i.price * i.quantity)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <footer className="border-t border-ink/8 px-6 py-5">
              <div className="mb-4">
                <OrderTotals subtotal={subtotal} />
              </div>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                aria-disabled={items.length === 0}
                className={`block rounded-full py-3.5 text-center text-sm text-ivory transition-all duration-500 ${
                  items.length === 0 ? "pointer-events-none bg-ink/30" : "bg-ink active:scale-[0.98]"
                }`}
              >
                Proceed to checkout
              </Link>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
