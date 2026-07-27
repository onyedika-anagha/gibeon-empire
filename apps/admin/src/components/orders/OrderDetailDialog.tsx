"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui";
import { api, type AdminOrderDetail } from "@/lib/api";
import { formatMoney } from "@/lib/format";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

export default function OrderDetailDialog({
  reference,
  onOpenChange,
}: {
  reference: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);

  useEffect(() => {
    if (!reference) return;
    setOrder(null);
    api.order(reference).then(setOrder);
  }, [reference]);

  return (
    <Dialog open={Boolean(reference)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{reference}</DialogTitle>
          <DialogDescription>Order details for fulfilment.</DialogDescription>
        </DialogHeader>

        {!order ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="flex flex-col gap-5 text-sm">
            <div className="flex items-center justify-between">
              <Badge tone={order.state === "COMPLETED" ? "ok" : "warn"}>{order.state.replace(/_/g, " ")}</Badge>
              <span className="text-muted-foreground">{formatDate(order.createdAt)}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
              <span>Channel</span>
              <span className="text-right text-foreground">{order.channel}</span>
              {order.contactEmail && (
                <>
                  <span>Contact</span>
                  <span className="text-right text-foreground">{order.contactEmail}</span>
                </>
              )}
            </div>

            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Items</p>
              <div className="flex flex-col gap-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <span className="text-foreground">
                      {item.quantity}× {item.nameSnapshot}
                    </span>
                    <span className="text-muted-foreground">{formatMoney(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatMoney(order.subtotal)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount</span>
                  <span>-{formatMoney(order.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatMoney(order.taxTotal)}</span>
              </div>
              <div className="mt-1 flex justify-between font-medium text-foreground">
                <span>Total</span>
                <span>{formatMoney(order.total)}</span>
              </div>
            </div>

            {order.events.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Timeline</p>
                <div className="flex flex-col gap-1.5">
                  {order.events.map((ev) => (
                    <div key={ev.id} className="flex justify-between text-muted-foreground">
                      <span>{ev.toState.replace(/_/g, " ")}</span>
                      <span>{formatDate(ev.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
