"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";

/**
 * Coupon entry for the till. Validation happens server-side (online only);
 * the parent hook owns the applied coupon and folds it into the sale total.
 */
export default function CouponInput({
  applied,
  onApply,
  onRemove,
}: {
  applied: { code: string; discount: number } | null;
  onApply: (code: string) => Promise<void>;
  onRemove: () => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function apply() {
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    try {
      await onApply(code.trim());
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't apply that code");
    } finally {
      setBusy(false);
    }
  }

  if (applied) {
    return (
      <div className="mt-2 flex items-center justify-between rounded-lg bg-elev/60 px-2.5 py-1.5 text-sm">
        <span className="text-fg">
          <span className="font-medium">{applied.code}</span>
          <span className="text-muted tnum"> · −{formatMoney(applied.discount)}</span>
        </span>
        <button onClick={onRemove} className="text-xs text-muted underline transition hover:text-fg">
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        <input
          data-barcode="ignore"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void apply()}
          placeholder="Coupon code"
          className="min-w-0 flex-1 rounded-lg border border-line bg-elev/60 px-2.5 py-1.5 text-sm uppercase text-fg outline-none transition placeholder:normal-case placeholder:text-faint focus:border-gold"
        />
        <button
          onClick={() => void apply()}
          disabled={busy || !code.trim()}
          className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-gold hover:text-fg disabled:opacity-40"
        >
          {busy ? "…" : "Apply"}
        </button>
      </div>
      {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
