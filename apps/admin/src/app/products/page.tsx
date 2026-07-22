"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type AdminProduct } from "@/lib/api";
import { Badge, Button, Card, Field, PageHeader } from "@/components/ui";
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
  return (
    <Card className="p-5">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <div>
          <p className="font-medium text-ink">{product.name}</p>
          <p className="text-xs text-slate">
            {product.category} · {product.brand} · {product.variants.length} variant(s) ·{" "}
            <span className="font-mono">{product.slug}</span>
          </p>
        </div>
        <span className="text-slate">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-2 border-t border-line pt-4">
          {product.variants.map((v) => (
            <VariantEditor key={v.id} variant={v} onSaved={onSaved} />
          ))}
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.createProduct({
        ...f,
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
        <div className="sm:col-span-2 mt-2 border-t border-line pt-4 text-xs font-medium uppercase tracking-wide text-slate">
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
