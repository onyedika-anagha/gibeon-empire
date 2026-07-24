"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api, type LowStockRow } from "@/lib/api";
import { Badge, Button, Card, PageHeader } from "@/components/ui";

export default function StockList() {
  const [rows, setRows] = useState<LowStockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .lowStock()
      .then(setRows)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load stock"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function restock(row: LowStockRow) {
    const value = drafts[row.variantId];
    if (value == null || value < 0) return;
    setSaving(row.variantId);
    try {
      await api.adjustStock({ variantId: row.variantId, mode: "set", value, reason: "Restock (admin)" });
      toast.success(`${row.productName} ${row.size}/${row.color} set to ${value}`);
      setDrafts((d) => ({ ...d, [row.variantId]: undefined as unknown as number }));
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not adjust stock");
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <PageHeader title="Inventory" subtitle="Items at or below their low-stock threshold." />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Variant</th>
              <th className="px-5 py-3">On hand</th>
              <th className="px-5 py-3">Threshold</th>
              <th className="px-5 py-3">Restock to</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <Empty>Loading…</Empty>
            ) : rows.length === 0 ? (
              <Empty>Everything is well stocked.</Empty>
            ) : (
              rows.map((r) => (
                <tr key={r.variantId} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium text-foreground">{r.productName}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{r.sku}</p>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {r.size} · {r.color}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={r.quantity === 0 ? "danger" : "warn"}>{r.quantity}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{r.lowStockThreshold}</td>
                  <td className="px-5 py-3">
                    <input
                      type="number"
                      min={0}
                      aria-label={`Restock ${r.productName} ${r.size}/${r.color} to`}
                      value={drafts[r.variantId] ?? ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [r.variantId]: Number(e.target.value) }))}
                      className="w-24 rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm outline-none focus-visible:border-ring"
                    />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      variant="ghost"
                      disabled={drafts[r.variantId] == null || saving === r.variantId}
                      onClick={() => restock(r)}
                    >
                      {saving === r.variantId ? "…" : "Save"}
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

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}
