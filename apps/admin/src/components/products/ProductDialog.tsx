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
import ImageUploader from "@/components/ImageUploader";
import CategorySelect from "./CategorySelect";
import { api, type AdminProduct } from "@/lib/api";

/**
 * One dialog for both jobs: with a product it edits details, without one it
 * creates a product plus its first variant. Slug and SKU stay server-generated.
 */
export default function ProductDialog({
  open,
  onOpenChange,
  product,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: AdminProduct;
  onSaved: () => void;
}) {
  const editing = Boolean(product);
  const [f, setF] = useState({
    name: product?.name ?? "",
    category: product?.category ?? "",
    brand: product?.brand ?? "Gibeon",
    description: product?.description ?? "",
  });
  const [v, setV] = useState({ size: "", color: "", price: "", initialQuantity: "" });
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (product) {
        await api.updateProduct(product.id, f);
        toast.success(`${f.name} updated`);
      } else {
        await api.createProduct({
          ...f,
          media: images.map((url) => ({ url })),
          variants: [
            {
              size: v.size,
              color: v.color,
              price: Math.round(Number(v.price) * 100),
              initialQuantity: Number(v.initialQuantity) || 0,
            },
          ],
        });
        toast.success(`${f.name} created`);
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save product");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Details only — images and variants are managed on the product row."
              : "Creates the product with its first variant and starting stock."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={f.name} onChange={(x) => setF({ ...f, name: x })} required />
          <CategorySelect value={f.category} onChange={(x) => setF({ ...f, category: x })} required />
          <Field label="Brand" value={f.brand} onChange={(x) => setF({ ...f, brand: x })} required />
          <Field
            label="Description"
            value={f.description}
            onChange={(x) => setF({ ...f, description: x })}
          />

          {!editing && (
            <>
              <div className="mt-2 border-t border-border pt-4 sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Images
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {images.map((url) => (
                    <div
                      key={url}
                      className="group relative size-16 overflow-hidden rounded-lg border border-border bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                        aria-label="Remove image"
                        className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-background/90 text-danger opacity-0 shadow-sm transition group-hover:opacity-100"
                      >
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                        >
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <ImageUploader onUploaded={(url) => setImages((prev) => [...prev, url])} label="Upload" />
                </div>
              </div>

              <div className="mt-2 border-t border-border pt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:col-span-2">
                First variant
              </div>
              <Field label="Size" value={v.size} onChange={(x) => setV({ ...v, size: x })} required />
              <Field label="Colour" value={v.color} onChange={(x) => setV({ ...v, color: x })} required />
              <Field
                label="Price (₦)"
                type="number"
                value={v.price}
                onChange={(x) => setV({ ...v, price: x })}
                required
              />
              <Field
                label="Initial stock"
                type="number"
                value={v.initialQuantity}
                onChange={(x) => setV({ ...v, initialQuantity: x })}
              />
            </>
          )}

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : editing ? "Save changes" : "Create product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
