"use client";

import type { OutboxSale } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { formatRate } from "@/lib/vat";
import Monogram from "./Monogram";

export default function Receipt({ sale, onClose }: { sale: OutboxSale; onClose: () => void }) {
  const subtotal = sale.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const ref = sale.clientId.slice(0, 8).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-fg/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xs">
        {/* The receipt itself — always paper-white so print stays black-on-white. */}
        <div
          id="receipt"
          className="rounded-2xl bg-white px-6 py-7 text-[#1a1714] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]"
        >
          <div className="flex flex-col items-center text-center">
            <Monogram className="h-11 w-11 text-espresso" />
            <p className="mt-2 text-sm font-semibold tracking-[0.28em] text-[#1a1714]">
              GIBEON EMPIRE
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#a9793f]">Luxury Fashion</p>
          </div>

          <div className="my-4 border-t border-dashed border-[#ddd6ca]" />

          <div className="space-y-0.5 text-[11px] text-[#6b6459]">
            <Meta label="Date" value={new Date(sale.soldAt).toLocaleString()} />
            <Meta label="Receipt" value={`#${ref}`} />
            <Meta label="Payment" value={sale.method} />
          </div>

          <div className="my-4 border-t border-dashed border-[#ddd6ca]" />

          <div className="space-y-2 text-[13px]">
            {sale.items.map((i) => (
              <div key={i.variantId} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 text-[#1a1714]">
                  <span className="truncate">{i.name}</span>
                  <span className="ml-1 text-[#9a9184] tnum">×{i.quantity}</span>
                </span>
                <span className="shrink-0 tnum text-[#1a1714]">
                  {formatMoney(i.unitPrice * i.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="my-4 border-t border-dashed border-[#ddd6ca]" />

          <div className="space-y-1.5 text-[13px]">
            <Row label="Subtotal" value={formatMoney(subtotal)} />
            {sale.discountTotal > 0 && (
              <Row label="Discount" value={`−${formatMoney(sale.discountTotal)}`} />
            )}
            {sale.taxTotal > 0 && (
              <Row label={`VAT (${formatRate(sale.taxRate)})`} value={formatMoney(sale.taxTotal)} />
            )}
            <div className="flex justify-between border-t border-[#eee7db] pt-2 text-base font-semibold text-[#1a1714]">
              <span>Total</span>
              <span className="tnum">{formatMoney(sale.total)}</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[11px] font-medium text-[#1a1714]">
              Thank you for shopping with us.
            </p>
            <p className="mt-1 text-[10px] tracking-wide text-[#9a9184]">gibeonempire.com</p>
          </div>
        </div>

        <div className="no-print mt-4 flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-xl bg-fg py-3 text-sm font-semibold text-bg transition hover:opacity-90 active:scale-[0.99]"
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-line py-3 text-sm font-medium text-fg transition hover:border-gold hover:text-gold active:scale-[0.99]"
          >
            New sale
          </button>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span>{label}</span>
      <span className="text-right text-[#1a1714] tnum">{value}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[#6b6459]">
      <span>{label}</span>
      <span className="tnum">{value}</span>
    </div>
  );
}
