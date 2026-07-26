"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";

export interface AppliedCoupon {
  code: string;
  discount: number;
}

/**
 * Coupon entry for checkout. Validates the code against the current cart via the
 * API (which computes the discount) and reports the applied result upward. The
 * parent owns the applied coupon so it can pass the code on order creation.
 */
export default function CouponField({
  items,
  token,
  applied,
  onApplied,
  onCleared,
}: {
  items: Array<{ variantId: string; quantity: number }>;
  token?: string;
  applied: AppliedCoupon | null;
  onApplied: (c: AppliedCoupon) => void;
  onCleared: () => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.validateCoupon({ code: code.trim(), items }, token);
      onApplied({ code: res.code, discount: res.discount });
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't apply that code");
    } finally {
      setBusy(false);
    }
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-xl bg-ink/5 px-4 py-3 text-[13px]">
        <span className="text-ink">
          <span className="font-medium">{applied.code}</span> applied
          <span className="text-taupe"> · −{formatMoney(applied.discount)}</span>
        </span>
        <button type="button" onClick={onCleared} className="text-taupe underline hover:text-ink">
          Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={apply} className="space-y-1.5">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Discount code"
          className="min-w-0 flex-1 rounded-xl bg-ivory px-4 py-2.5 text-sm uppercase text-ink ring-1 ring-ink/10 placeholder:normal-case placeholder:text-taupe focus:outline-none focus:ring-ink/30"
        />
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="shrink-0 rounded-xl bg-ink px-5 py-2.5 text-sm text-ivory transition-all duration-500 active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "…" : "Apply"}
        </button>
      </div>
      {error && <p className="text-[12px] text-red-700">{error}</p>}
    </form>
  );
}
