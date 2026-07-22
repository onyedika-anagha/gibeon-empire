"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "./ui";

type Provider = "PAYSTACK" | "FLUTTERWAVE";
const PROVIDERS: Provider[] = ["PAYSTACK", "FLUTTERWAVE"];

export default function PaymentProviderToggle() {
  const [active, setActive] = useState<Provider | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getProvider()
      .then((r) => setActive(r.provider))
      .catch(() => setError("Could not load current provider"));
  }, []);

  async function choose(p: Provider) {
    if (p === active || saving) return;
    setSaving(true);
    setError("");
    const previous = active;
    setActive(p); // optimistic
    try {
      await api.setProvider(p);
    } catch {
      setActive(previous);
      setError("Failed to switch provider");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-md p-6">
      <p className="text-sm font-medium text-ink">Active payment provider</p>
      <p className="mt-1 text-sm text-slate">Checkout uses whichever provider is active. Takes effect immediately.</p>
      <div className="mt-4 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Payment provider">
        {PROVIDERS.map((p) => {
          const isActive = active === p;
          return (
            <button
              key={p}
              role="radio"
              aria-checked={isActive}
              disabled={saving}
              onClick={() => choose(p)}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition disabled:opacity-60 ${
                isActive ? "border-primary bg-primary text-primary-foreground" : "border-line text-ink hover:bg-mist"
              }`}
            >
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </Card>
  );
}
