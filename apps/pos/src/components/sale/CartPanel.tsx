"use client";

import type { OutboxSale } from "@/lib/db";
import type { CartLine } from "@/hooks/useSale";
import { METHODS } from "@/hooks/useSale";
import { formatMoney } from "@/lib/format";

interface Props {
  cart: CartLine[];
  count: number;
  subtotal: number;
  discount: number;
  total: number;
  method: OutboxSale["method"];
  onQty: (variantId: string, qty: number) => void;
  onDiscount: (minor: number) => void;
  onMethod: (m: OutboxSale["method"]) => void;
  onComplete: () => void;
}

export default function CartPanel({
  cart,
  count,
  subtotal,
  discount,
  total,
  method,
  onQty,
  onDiscount,
  onMethod,
  onComplete,
}: Props) {
  return (
    <aside className="flex min-h-0 flex-col bg-panel">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="text-sm font-semibold text-fg">Current sale</h2>
        {count > 0 && (
          <span className="rounded-full bg-elev px-2.5 py-0.5 text-xs font-medium text-muted tnum">
            {count} {count === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {cart.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <CartIcon />
              <p className="mt-3 text-sm text-muted">Scan or tap a product to begin.</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-1">
            {cart.map((l) => (
              <li key={l.variantId} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 transition hover:bg-elev/60">
                <div className="min-w-0">
                  <p className="truncate text-sm text-fg">{l.name}</p>
                  <p className="text-[11px] text-muted tnum">
                    {l.size} · {l.color} · {formatMoney(l.unitPrice)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-lg border border-line">
                    <StepBtn label="Decrease quantity" onClick={() => onQty(l.variantId, l.quantity - 1)}>
                      −
                    </StepBtn>
                    <span className="w-7 text-center text-sm text-fg tnum">{l.quantity}</span>
                    <StepBtn label="Increase quantity" onClick={() => onQty(l.variantId, l.quantity + 1)}>
                      +
                    </StepBtn>
                  </div>
                  <span className="w-16 text-right text-sm font-medium text-fg tnum">
                    {formatMoney(l.unitPrice * l.quantity)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-line p-5">
        <label className="flex items-center justify-between text-sm text-muted">
          Discount
          <input
            data-barcode="ignore"
            type="number"
            min={0}
            value={discount / 100 || ""}
            onChange={(e) => onDiscount(Math.max(0, Math.round(Number(e.target.value) * 100)))}
            placeholder="0"
            className="w-24 rounded-lg border border-line bg-elev/60 px-2.5 py-1.5 text-right text-sm text-fg outline-none transition focus:border-gold tnum"
          />
        </label>

        <div className="mt-3 flex justify-between text-sm text-muted">
          <span>Subtotal</span>
          <span className="tnum">{formatMoney(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="mt-1 flex justify-between text-sm text-muted">
            <span>Discount</span>
            <span className="tnum text-danger">−{formatMoney(discount)}</span>
          </div>
        )}
        <div className="mt-2 flex items-end justify-between border-t border-dashed border-line pt-3">
          <span className="text-sm font-medium text-muted">Total</span>
          <span className="text-2xl font-semibold text-fg tnum">{formatMoney(total)}</span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-1.5">
          {METHODS.map((m) => (
            <button
              key={m}
              onClick={() => onMethod(m)}
              className={`rounded-lg py-2 text-xs font-semibold transition active:scale-95 ${
                method === m
                  ? "bg-gold text-white shadow-[0_4px_14px_-4px_rgba(169,121,63,0.6)]"
                  : "border border-line text-muted hover:border-gold hover:text-fg"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <button
          onClick={onComplete}
          disabled={cart.length === 0}
          className="mt-4 w-full rounded-xl bg-fg py-4 text-sm font-semibold text-bg transition hover:opacity-90 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40"
        >
          Charge <span className="tnum">{formatMoney(total)}</span>
        </button>
      </div>
    </aside>
  );
}

function StepBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center text-base text-muted transition hover:text-fg active:scale-90"
    >
      {children}
    </button>
  );
}

function CartIcon() {
  return (
    <svg
      className="mx-auto text-faint"
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2 3h2.2l2.1 12.3a1.5 1.5 0 0 0 1.5 1.2h8.9a1.5 1.5 0 0 0 1.5-1.2L21 7H5.4" />
    </svg>
  );
}
