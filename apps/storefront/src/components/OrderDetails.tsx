"use client";

import { useEffect, useState } from "react";
import { api, type Order } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { ORDER_STATE_LABEL } from "@/lib/orderStates";

/**
 * Lines, totals, and history for one order. The list endpoint returns bare
 * orders, so the full record is fetched when a shopper opens this.
 */
export default function OrderDetails({ reference, token }: { reference: string; token: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api
      .trackOrder(reference, token)
      .then((o) => alive && setOrder(o))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Could not load this order"));
    return () => {
      alive = false;
    };
  }, [reference, token]);

  if (error) return <p className="mt-5 text-[13px] text-red-700">{error}</p>;
  if (!order) return <p className="mt-5 text-[13px] text-taupe">Loading details…</p>;

  const rate = (order.taxRate / 100).toFixed(order.taxRate % 100 === 0 ? 0 : 1);

  return (
    <div className="mt-5 border-t border-ink/8 pt-5">
      <ul className="space-y-2">
        {order.items.map((i) => (
          <li key={i.id} className="flex justify-between gap-3 text-[14px]">
            <span className="text-stone">
              {i.nameSnapshot} <span className="text-taupe">×{i.quantity}</span>
            </span>
            <span className="text-ink">{formatMoney(i.unitPrice * i.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-1.5 border-t border-ink/8 pt-4 text-[13px]">
        <Row label="Subtotal" value={formatMoney(order.subtotal)} />
        {order.discountTotal > 0 && (
          <Row label="Discount" value={`−${formatMoney(order.discountTotal)}`} />
        )}
        {order.taxTotal > 0 && <Row label={`VAT (${rate}%)`} value={formatMoney(order.taxTotal)} />}
        <div className="flex justify-between pt-1 text-[15px] text-ink">
          <span>Total paid</span>
          <span>{formatMoney(order.total)}</span>
        </div>
      </div>

      {order.events.length > 0 && (
        <div className="mt-5 border-t border-ink/8 pt-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-taupe">History</p>
          <ol className="mt-3 space-y-2">
            {order.events.map((e) => (
              <li key={e.id} className="flex justify-between gap-3 text-[13px]">
                <span className="text-stone">{ORDER_STATE_LABEL[e.toState]}</span>
                <span className="text-taupe">
                  {new Date(e.createdAt).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-stone">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
