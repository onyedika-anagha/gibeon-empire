"use client";

import { useEffect, useState } from "react";
import { api, type Order, type OrderState } from "@/lib/api";
import { formatMoney } from "@/lib/format";

const STEPS: OrderState[] = [
  "RECEIVED",
  "PAYMENT_CONFIRMED",
  "INVENTORY_UPDATED",
  "PICKING",
  "PACKING",
  "DISPATCH",
  "DELIVERED",
  "COMPLETED",
];
const LABEL: Record<OrderState, string> = {
  RECEIVED: "Received",
  PAYMENT_CONFIRMED: "Payment confirmed",
  INVENTORY_UPDATED: "Preparing",
  PICKING: "Picking",
  PACKING: "Packing",
  DISPATCH: "Dispatched",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
};

export default function OrderHistory({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .myOrders(token)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p className="text-sm text-taupe">Loading your orders…</p>;
  if (orders.length === 0)
    return <p className="text-sm text-taupe">No orders yet — your future favourites will appear here.</p>;

  return (
    <ul className="space-y-4">
      {orders.map((o) => {
        const idx = STEPS.indexOf(o.state);
        return (
          <li key={o.id} className="rounded-[1.5rem] bg-ivory/60 p-6 ring-1 ring-ink/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[14px] text-ink">{o.reference}</span>
              <span className="text-[14px] text-ink">{formatMoney(o.total)}</span>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-taupe">
                <span className="text-gold">{LABEL[o.state]}</span>
                <span>
                  {idx + 1} / {STEPS.length}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/8">
                <div
                  className="h-full rounded-full bg-gold transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ width: `${((idx + 1) / STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
