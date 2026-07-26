"use client";

import { useEffect, useState } from "react";
import { api, type OrderReportRow } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/format";
import { useAdminAuth } from "@/hooks/useAdminAuth";

/** Trailing 12 months of VAT collected on paid orders — enough to file monthly or sum for the year. */
export default function VatReport() {
  const { token } = useAdminAuth();
  const [rows, setRows] = useState<OrderReportRow[]>([]);

  useEffect(() => {
    if (!token) return;
    api
      .orderReport("year")
      .then(setRows)
      .catch(() => setRows([]));
  }, [token]);

  const taxableTotal = rows.reduce((s, r) => s + r.subtotal, 0);
  const vatTotal = rows.reduce((s, r) => s + r.taxTotal, 0);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>VAT remittance</CardTitle>
        <p className="text-sm text-muted-foreground">
          VAT collected on paid orders, by month — for filing with tax authorities.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Taxable amount</TableHead>
              <TableHead className="text-right">VAT collected</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.period}>
                <TableCell>
                  {new Date(r.period).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
                </TableCell>
                <TableCell className="text-right">{r.orderCount}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(r.subtotal)}</TableCell>
                <TableCell className="text-right font-mono">{formatMoney(r.taxTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="font-medium text-foreground">Last 12 months</span>
          <span className="font-mono font-semibold text-foreground">
            {formatMoney(taxableTotal)} taxable · {formatMoney(vatTotal)} VAT
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
