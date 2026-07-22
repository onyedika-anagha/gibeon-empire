"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, PageHeader } from "@/components/ui";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function Overview() {
  const { token } = useAdminAuth();
  const [stats, setStats] = useState({ orders: 0, reviews: 0, lowStock: 0, provider: "—" });

  useEffect(() => {
    if (!token) return;
    Promise.allSettled([api.orders(), api.reviews(), api.lowStock(), api.getProvider()]).then(
      ([o, r, l, p]) => {
        setStats({
          orders: o.status === "fulfilled" ? o.value.length : 0,
          reviews: r.status === "fulfilled" ? r.value.length : 0,
          lowStock: l.status === "fulfilled" ? l.value.length : 0,
          provider: p.status === "fulfilled" ? p.value.provider : "—",
        });
      },
    );
  }, [token]);

  const tiles = [
    ["Orders", stats.orders],
    ["Pending reviews", stats.reviews],
    ["Low-stock items", stats.lowStock],
    ["Payment provider", stats.provider],
  ] as const;

  return (
    <>
      <PageHeader title="Overview" subtitle="At a glance across the platform." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map(([label, value]) => (
          <Card key={label} className="p-6">
            <p className="text-xs uppercase tracking-wide text-slate">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
