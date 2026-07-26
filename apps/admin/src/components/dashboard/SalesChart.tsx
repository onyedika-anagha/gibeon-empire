"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { api, type OrderReportRow } from "@/lib/api";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const RANGES = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
] as const;
type Range = (typeof RANGES)[number]["key"];

const chartConfig = {
  total: { label: "Revenue", color: "var(--gold)" },
} satisfies ChartConfig;

function periodLabel(period: string, range: Range) {
  const d = new Date(period);
  return range === "year"
    ? d.toLocaleDateString("en-NG", { month: "short", year: "2-digit" })
    : d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export default function SalesChart() {
  const { token } = useAdminAuth();
  const [range, setRange] = useState<Range>("month");
  const [rows, setRows] = useState<OrderReportRow[]>([]);

  useEffect(() => {
    if (!token) return;
    api
      .orderReport(range)
      .then(setRows)
      .catch(() => setRows([]));
  }, [token, range]);

  const data = rows.map((r) => ({ ...r, label: periodLabel(r.period, range) }));
  const revenue = rows.reduce((s, r) => s + r.total, 0);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Revenue</CardTitle>
        <p className="text-sm text-muted-foreground">{formatMoney(revenue)} across the selected period</p>
        <CardAction className="flex gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.key}
              variant={range === r.key ? "solid" : "ghost"}
              className="h-8 px-3 text-xs"
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </Button>
          ))}
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-mono font-medium text-foreground">
                        {formatMoney(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="total" name="Revenue" fill="var(--color-total)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
