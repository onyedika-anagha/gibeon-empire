"use client";

import { formatMoney } from "@/lib/format";
import { formatRate, useVatRate, vatOn } from "@/hooks/useVatRate";

/** Subtotal → VAT → total, exactly as the API will price the order. */
export default function OrderTotals({ subtotal }: { subtotal: number }) {
  const rate = useVatRate();
  const tax = vatOn(subtotal, rate);

  return (
    <div className="space-y-2">
      <Row label="Subtotal" value={formatMoney(subtotal)} />
      {rate > 0 && <Row label={`VAT (${formatRate(rate)})`} value={formatMoney(tax)} />}
      <div className="flex items-center justify-between border-t border-ink/8 pt-3">
        <span className="text-sm text-ink">Total</span>
        <span className="font-display text-xl text-ink">{formatMoney(subtotal + tax)}</span>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[14px]">
      <span className="text-stone">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
