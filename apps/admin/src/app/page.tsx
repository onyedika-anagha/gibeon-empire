"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui";
import Sparkline from "@/components/Sparkline";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { cn } from "@/lib/utils";

interface Tile {
  label: string;
  value: string | number;
  trend: number[];
  tone: "primary" | "warn" | "danger";
}

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

  const tiles: Tile[] = [
    { label: "Orders", value: stats.orders, trend: [4, 6, 5, 8, 7, 10, 9, 12], tone: "primary" },
    { label: "Pending reviews", value: stats.reviews, trend: [2, 3, 2, 4, 3, 5, 4, 3], tone: stats.reviews > 0 ? "warn" : "primary" },
    { label: "Low-stock items", value: stats.lowStock, trend: [1, 2, 4, 3, 5, 4, 6, 5], tone: stats.lowStock > 0 ? "danger" : "primary" },
    { label: "Payment provider", value: stats.provider, trend: [5, 5, 6, 5, 6, 6, 5, 6], tone: "primary" },
  ];

  const toneColor = {
    primary: "text-primary",
    warn: "text-warn",
    danger: "text-danger",
  } as const;

  return (
    <>
      <PageHeader title="Overview" subtitle="At a glance across the platform." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.label}
                <span className={cn("size-2 rounded-full bg-current", toneColor[t.tone])} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">{t.value}</p>
              <Sparkline points={t.trend} className={cn("mt-4 h-9 w-full", toneColor[t.tone])} />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
