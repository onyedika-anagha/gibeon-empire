"use client";

import { useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import ProductImages from "@/components/products/ProductImages";
import ProductDialog from "./ProductDialog";
import VariantDialog from "./VariantDialog";
import { formatMoney } from "@/lib/format";
import type { AdminProduct } from "@/lib/api";

type EditingVariant = AdminProduct["variants"][number] | undefined;

export default function ProductRow({
  product,
  onSaved,
}: {
  product: AdminProduct;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [variantDialog, setVariantDialog] = useState<{ open: boolean; variant: EditingVariant }>({
    open: false,
    variant: undefined,
  });
  const cover = product.media[0];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <button onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
          <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover.url} alt={cover.alt ?? product.name} className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center text-muted-foreground">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">{product.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {product.categoryLabel} · {product.brand} · {product.variants.length} variant(s) ·{" "}
              <span className="font-mono">{product.slug}</span>
            </p>
          </div>
        </button>
        <Button variant="ghost" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <button onClick={() => setOpen((v) => !v)} aria-label="Toggle details" className="text-muted-foreground">
          {open ? "−" : "+"}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <ProductImages productId={product.id} media={product.media} onChanged={onSaved} />

          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Variants</p>
              <Button variant="ghost" onClick={() => setVariantDialog({ open: true, variant: undefined })}>
                Add variant
              </Button>
            </div>
            {product.variants.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{v.sku}</span>
                  <span className="text-foreground">
                    {v.size} · {v.color}
                  </span>
                  <Badge tone={v.stock.state === "sold_out" ? "danger" : "slate"}>{v.stock.state}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums text-foreground">{formatMoney(v.price)}</span>
                  <Button variant="ghost" onClick={() => setVariantDialog({ open: true, variant: v })}>
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keyed so each dialog opens with fresh state rather than a stale draft. */}
      {editing && (
        <ProductDialog
          key={`p-${product.id}`}
          open
          onOpenChange={setEditing}
          product={product}
          onSaved={onSaved}
        />
      )}
      {variantDialog.open && (
        <VariantDialog
          key={`v-${variantDialog.variant?.id ?? "new"}`}
          open
          onOpenChange={(o) => setVariantDialog({ open: o, variant: undefined })}
          productId={product.id}
          variant={variantDialog.variant}
          onSaved={onSaved}
        />
      )}
    </Card>
  );
}
