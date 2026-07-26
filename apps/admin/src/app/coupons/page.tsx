"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type Coupon } from "@/lib/api";
import { Badge, Card, PageHeader } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import CouponForm from "@/components/coupons/CouponForm";

function discountLabel(c: Coupon): string {
  return c.type === "PERCENTAGE" ? `${c.value / 100}% off` : `${formatMoney(c.value)} off`;
}

function scopeLabel(c: Coupon): string {
  if (c.scope === "ORDER") return "Whole order";
  if (c.scope === "CATEGORY") return `Categories: ${c.scopeValues.join(", ")}`;
  return `${c.scopeValues.length} product(s)`;
}

export default function CouponsPage() {
  const { role } = useAdminAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const load = useCallback(() => {
    api.coupons().then(setCoupons).catch(() => setCoupons([]));
  }, []);
  useEffect(load, [load]);

  async function toggleActive(c: Coupon) {
    await api.updateCoupon(c.id, { active: !c.active });
    load();
  }

  if (role !== "ADMIN" && role !== "STORE_MANAGER") {
    return (
      <>
        <PageHeader title="Coupons" />
        <Card className="p-6 text-sm text-slate">You don’t have access to manage coupons.</Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Coupons" subtitle="Discount codes for storefront and till." />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          {coupons.length === 0 ? (
            <p className="p-6 text-sm text-slate">No coupons yet. Create one on the right.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-slate">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Discount</th>
                  <th className="px-5 py-3">Scope</th>
                  <th className="px-5 py-3">Used</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 font-mono font-medium text-ink">{c.code}</td>
                    <td className="px-5 py-3 text-slate">{discountLabel(c)}</td>
                    <td className="px-5 py-3 text-slate">{scopeLabel(c)}</td>
                    <td className="px-5 py-3 text-slate tabular-nums">
                      {c.timesRedeemed}
                      {c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => toggleActive(c)} className="inline-flex items-center gap-2">
                        <Badge tone={c.active ? "ok" : "slate"}>{c.active ? "Active" : "Inactive"}</Badge>
                        <span className="text-xs text-slate underline hover:text-foreground">
                          {c.active ? "Disable" : "Enable"}
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <CouponForm onCreated={load} />
      </div>
    </>
  );
}
