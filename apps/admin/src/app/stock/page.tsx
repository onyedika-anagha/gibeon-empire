"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge, Button, Card, PageHeader } from "@/components/ui";

interface LowStockRow {
  variantId: string;
  quantity: number;
  lowStockThreshold: number;
}

export default function StockPage() {
  const [rows, setRows] = useState<LowStockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, number>>({});

  const load = useCallback(() => {
    setLoading(true);
    api
      .lowStock()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function restock(variantId: string) {
    const value = drafts[variantId];
    if (value == null || value < 0) return;
    await api.adjustStock({ variantId, mode: "set", value, reason: "Restock (admin)" });
    load();
  }

  return (
    <>
      <PageHeader title="Inventory" subtitle="Items at or below their low-stock threshold." />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-slate">
            <tr>
              <th className="px-5 py-3">Variant</th>
              <th className="px-5 py-3">On hand</th>
              <th className="px-5 py-3">Threshold</th>
              <th className="px-5 py-3">Restock to</th>
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
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate">
                  Everything is well stocked.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.variantId} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-mono text-xs text-slate">{r.variantId.slice(0, 8)}…</td>
                  <td className="px-5 py-3">
                    <Badge tone={r.quantity === 0 ? "danger" : "gold"}>{r.quantity}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate">{r.lowStockThreshold}</td>
                  <td className="px-5 py-3">
                    <input
                      type="number"
                      min={0}
                      value={drafts[r.variantId] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [r.variantId]: Number(e.target.value) }))}
                      className="w-24 rounded-lg border border-line px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" onClick={() => restock(r.variantId)}>
                      Save
                    </Button>
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
