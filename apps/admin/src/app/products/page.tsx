"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type AdminProduct } from "@/lib/api";
import { Badge, Button, Card, Field, PageHeader } from "@/components/ui";
import ImageUploader from "@/components/ImageUploader";
import ProductImages from "@/components/products/ProductImages";
import { formatMoney } from "@/lib/format";

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    api.products().then(setProducts).catch(() => setProducts([]));
  }, []);
  useEffect(load, [load]);

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="The only place products, variants, and SKUs are created."
        action={<Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Close" : "New product"}</Button>}
      />

      {showForm && (
        <NewProductForm
          onDone={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="mt-6 space-y-3">
        {products.map((p) => (
          <ProductRow key={p.id} product={p} onSaved={load} />
        ))}
      </div>
    </>
  );
}

function ProductRow({ product, onSaved }: { product: AdminProduct; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const cover = product.media[0];
  return (
    <Card className="p-5">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-4 text-left">
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
          <p className="text-xs text-muted-foreground">
            {product.category} · {product.brand} · {product.variants.length} variant(s) ·{" "}
            <span className="font-mono">{product.slug}</span>
          </p>
        </div>
        <span className="text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-4 border-t border-border pt-4">
          <ProductImages productId={product.id} media={product.media} onChanged={onSaved} />
          <div className="space-y-2 border-t border-border pt-4">
            {product.variants.map((v) => (
              <VariantEditor key={v.id} variant={v} onSaved={onSaved} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function VariantEditor({
  variant,
  onSaved,
}: {
  variant: AdminProduct["variants"][number];
  onSaved: () => void;
}) {
  const [price, setPrice] = useState(String(variant.price / 100));
  const [saving, setSaving] = useState(false);
  const dirty = Math.round(Number(price) * 100) !== variant.price;

  async function save() {
    setSaving(true);
    try {
      await api.updateVariant(variant.id, { price: Math.round(Number(price) * 100) });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-slate">{variant.sku}</span>
        <span className="text-ink">
          {variant.size} · {variant.color}
        </span>
        <Badge tone={variant.stock.state === "sold_out" ? "danger" : "slate"}>{variant.stock.state}</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-slate">₦</span>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-28 rounded-lg border border-line px-2 py-1.5 text-sm"
        />
        <Button variant="ghost" disabled={!dirty || saving} onClick={save}>
          {saving ? "…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

function NewProductForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ name: "", category: "", brand: "Gibeon", description: "" });
  const [v, setV] = useState({ size: "", color: "", price: "", initialQuantity: "" });
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
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
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" value={f.name} onChange={(x) => setF({ ...f, name: x })} required />
        <Field label="Category" value={f.category} onChange={(x) => setF({ ...f, category: x })} required />
        <Field label="Brand" value={f.brand} onChange={(x) => setF({ ...f, brand: x })} required />
        <Field label="Description" value={f.description} onChange={(x) => setF({ ...f, description: x })} />

        <div className="sm:col-span-2 mt-2 border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Images</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {images.map((url) => (
              <div key={url} className="group relative size-16 overflow-hidden rounded-lg border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                  aria-label="Remove image"
                  className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-background/90 text-danger opacity-0 shadow-sm transition group-hover:opacity-100"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <ImageUploader onUploaded={(url) => setImages((prev) => [...prev, url])} label="Upload" />
          </div>
        </div>

        <div className="sm:col-span-2 mt-2 border-t border-border pt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          First variant
        </div>
        <Field label="Size" value={v.size} onChange={(x) => setV({ ...v, size: x })} required />
        <Field label="Colour" value={v.color} onChange={(x) => setV({ ...v, color: x })} required />
        <Field label="Price (₦)" type="number" value={v.price} onChange={(x) => setV({ ...v, price: x })} required />
        <Field label="Initial stock" type="number" value={v.initialQuantity} onChange={(x) => setV({ ...v, initialQuantity: x })} />
        {error && <p className="sm:col-span-2 text-sm text-danger">{error}</p>}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create product"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
