"use client";

import { useEffect, useState } from "react";
import { api, type Category, type CouponScope, type CouponType, type CouponInput } from "@/lib/api";
import { Button, Card, Field } from "@/components/ui";

// Admin enters human units (%, ₦); the API stores basis points / kobo.
function toApiValue(type: CouponType, raw: string): number {
  const n = Number(raw);
  return type === "PERCENTAGE" ? Math.round(n * 100) : Math.round(n * 100); // %→bps, ₦→kobo
}
const nairaToKobo = (raw: string): number | undefined => (raw ? Math.round(Number(raw) * 100) : undefined);
const toInt = (raw: string): number | undefined => (raw ? Math.max(1, Math.round(Number(raw))) : undefined);

export default function CouponForm({ onCreated }: { onCreated: () => void }) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<CouponType>("PERCENTAGE");
  const [value, setValue] = useState("");
  const [scope, setScope] = useState<Exclude<CouponScope, "PRODUCT">>("ORDER");
  const [categories, setCategories] = useState<Category[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [minSubtotal, setMinSubtotal] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [perCustomerLimit, setPerCustomerLimit] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  function togglePicked(slug: string) {
    setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!(Number(value) > 0)) return setError("Enter a discount value");
    if (type === "PERCENTAGE" && Number(value) > 100) return setError("Percentage can't exceed 100");
    if (scope === "CATEGORY" && picked.length === 0) return setError("Pick at least one category");

    setBusy(true);
    try {
      const body: CouponInput = {
        code: code.trim() || undefined, // blank → server auto-generates
        type,
        value: toApiValue(type, value),
        scope,
        scopeValues: scope === "CATEGORY" ? picked : undefined,
        minSubtotal: nairaToKobo(minSubtotal),
        maxDiscount: type === "PERCENTAGE" ? nairaToKobo(maxDiscount) : undefined,
        usageLimit: toInt(usageLimit),
        perCustomerLimit: toInt(perCustomerLimit),
      };
      await api.createCoupon(body);
      setCode(""); setValue(""); setPicked([]); setMinSubtotal(""); setMaxDiscount(""); setUsageLimit(""); setPerCustomerLimit("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create coupon");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="h-fit p-6">
      <p className="text-sm font-medium text-ink">New coupon</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <Field label="Code (optional)" value={code} onChange={setCode} placeholder="Auto-generated if blank" />

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CouponType)}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
          >
            <option value="PERCENTAGE">Percentage off</option>
            <option value="FIXED">Fixed amount off</option>
          </select>
        </label>

        <Field
          label={type === "PERCENTAGE" ? "Percent off (%)" : "Amount off (₦)"}
          type="number"
          value={value}
          onChange={setValue}
          required
        />

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Applies to</span>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as "ORDER" | "CATEGORY")}
            className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm"
          >
            <option value="ORDER">Whole order</option>
            <option value="CATEGORY">Specific categories</option>
          </select>
        </label>

        {scope === "CATEGORY" && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                type="button"
                key={c.slug}
                onClick={() => togglePicked(c.slug)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  picked.includes(c.slug)
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-line text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Min order (₦)" type="number" value={minSubtotal} onChange={setMinSubtotal} placeholder="0" />
          {type === "PERCENTAGE" && (
            <Field label="Max discount (₦)" type="number" value={maxDiscount} onChange={setMaxDiscount} placeholder="None" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Total uses" type="number" value={usageLimit} onChange={setUsageLimit} placeholder="∞" />
          <Field label="Per customer" type="number" value={perCustomerLimit} onChange={setPerCustomerLimit} placeholder="∞" />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Creating…" : "Create coupon"}
        </Button>
      </form>
    </Card>
  );
}
