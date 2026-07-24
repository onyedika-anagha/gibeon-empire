"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, Field } from "@/components/ui";
import { api, type AdminProduct } from "@/lib/api";

const toMinor = (major: string) => Math.round(Number(major) * 100);

/** Add a variant to a product, or edit an existing one. SKU is server-generated. */
export default function VariantDialog({
  open,
  onOpenChange,
  productId,
  variant,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  variant?: AdminProduct["variants"][number];
  onSaved: () => void;
}) {
  const editing = Boolean(variant);
  const [f, setF] = useState({
    size: variant?.size ?? "",
    color: variant?.color ?? "",
    price: variant ? String(variant.price / 100) : "",
    compareAtPrice: variant?.compareAtPrice ? String(variant.compareAtPrice / 100) : "",
    barcode: "",
    initialQuantity: "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const base = {
        size: f.size,
        color: f.color,
        price: toMinor(f.price),
        ...(f.compareAtPrice ? { compareAtPrice: toMinor(f.compareAtPrice) } : {}),
        ...(f.barcode ? { barcode: f.barcode } : {}),
      };
      if (variant) {
        await api.updateVariant(variant.id, base);
        toast.success(`${f.size}/${f.color} updated`);
      } else {
        await api.createVariant(productId, {
          ...base,
          initialQuantity: Number(f.initialQuantity) || 0,
        });
        toast.success(`${f.size}/${f.color} added`);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save variant");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit variant" : "Add variant"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Price changes are recorded in the audit log."
              : "Stock is created at the default location."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Size" value={f.size} onChange={(x) => setF({ ...f, size: x })} required />
          <Field label="Colour" value={f.color} onChange={(x) => setF({ ...f, color: x })} required />
          <Field
            label="Price (₦)"
            type="number"
            value={f.price}
            onChange={(x) => setF({ ...f, price: x })}
            required
          />
          <Field
            label="Compare-at (₦)"
            type="number"
            value={f.compareAtPrice}
            onChange={(x) => setF({ ...f, compareAtPrice: x })}
          />
          <Field label="Barcode" value={f.barcode} onChange={(x) => setF({ ...f, barcode: x })} />
          {!editing && (
            <Field
              label="Initial stock"
              type="number"
              value={f.initialQuantity}
              onChange={(x) => setF({ ...f, initialQuantity: x })}
            />
          )}

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : editing ? "Save changes" : "Add variant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
