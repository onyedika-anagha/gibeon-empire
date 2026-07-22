"use client";

import type { OutboxSale } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export default function Receipt({ sale, onClose }: { sale: OutboxSale; onClose: () => void }) {
  const subtotal = sale.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
      <div className="w-full max-w-xs rounded-2xl bg-white p-6">
        <div id="receipt" className="text-center">
          <p className="font-semibold tracking-tight text-ink">GIBEON EMPIRE</p>
          <p className="text-[11px] text-slate">Sale receipt</p>
          <p className="mt-1 text-[11px] text-slate">{new Date(sale.soldAt).toLocaleString()}</p>
          <p className="text-[11px] text-slate">Ref: {sale.clientId.slice(0, 8).toUpperCase()}</p>

          <div className="my-4 border-t border-dashed border-line" />
          <div className="space-y-1 text-left text-[13px]">
            {sale.items.map((i) => (
              <div key={i.variantId} className="flex justify-between">
                <span className="text-ink">
                  {i.name} ×{i.quantity}
                </span>
                <span className="text-ink">{formatMoney(i.unitPrice * i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="my-4 border-t border-dashed border-line" />

          <div className="space-y-1 text-left text-[13px]">
            <Row label="Subtotal" value={formatMoney(subtotal)} />
            {sale.discountTotal > 0 && <Row label="Discount" value={`−${formatMoney(sale.discountTotal)}`} />}
            <Row label="Total" value={formatMoney(sale.total)} bold />
            <Row label="Paid" value={sale.method} />
          </div>
          <p className="mt-4 text-[11px] text-slate">Thank you.</p>
        </div>

        <div className="no-print mt-6 flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-lg bg-ink py-2.5 text-sm font-medium text-white"
          >
            Print
          </button>
          <button onClick={onClose} className="flex-1 rounded-lg border border-line py-2.5 text-sm text-ink">
            New sale
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-ink" : "text-slate"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
