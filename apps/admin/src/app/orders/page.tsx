"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type AdminOrder, type OrderState } from "@/lib/api";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { formatMoney } from "@/lib/format";

const NEXT: Partial<Record<OrderState, OrderState>> = {
  INVENTORY_UPDATED: "PICKING",
  PICKING: "PACKING",
  PACKING: "DISPATCH",
  DISPATCH: "DELIVERED",
  DELIVERED: "COMPLETED",
};
const STATES: OrderState[] = [
  "RECEIVED",
  "PAYMENT_CONFIRMED",
  "INVENTORY_UPDATED",
  "PICKING",
  "PACKING",
  "DISPATCH",
  "DELIVERED",
  "COMPLETED",
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .orders(filter || undefined)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(load, [load]);

  async function advance(o: AdminOrder) {
    const to = NEXT[o.state];
    if (!to) return;
    await api.advanceOrder(o.id, to);
    load();
  }

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Every order across web and store, on one pipeline."
        action={
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
          >
            <option value="">All states</option>
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        }
      />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-slate">
            <tr>
              <th className="px-5 py-3">Reference</th>
              <th className="px-5 py-3">Channel</th>
              <th className="px-5 py-3">State</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate">
                  Loading…
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate">
                  No orders.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{o.reference}</td>
                  <td className="px-5 py-3 text-slate">{o.channel}</td>
                  <td className="px-5 py-3">
                    <Badge tone={o.state === "COMPLETED" ? "ok" : "warn"}>{o.state.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-5 py-3 text-ink">{formatMoney(o.total)}</td>
                  <td className="px-5 py-3 text-right">
                    {NEXT[o.state] ? (
                      <Button variant="ghost" onClick={() => advance(o)}>
                        → {NEXT[o.state]!.replace(/_/g, " ")}
                      </Button>
                    ) : (
                      <span className="text-xs text-slate">{o.state === "COMPLETED" ? "Done" : "Awaiting payment"}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
