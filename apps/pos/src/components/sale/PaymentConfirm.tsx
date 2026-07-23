"use client";

import { useState } from "react";
import type { OutboxSale } from "@/lib/db";
import { formatMoney } from "@/lib/format";

// Copy tailored to how each electronic method actually clears.
const PROMPT: Record<OutboxSale["method"], string> = {
  CASH: "Confirm the cash has been collected.",
  TRANSFER: "Verify the transfer has landed in the store account before confirming.",
  CARD: "Confirm the card payment was approved on the terminal.",
  SPLIT: "Confirm every part of the split payment was received.",
};

export default function PaymentConfirm({
  method,
  total,
  count,
  onConfirm,
  onCancel,
}: {
  method: OutboxSale["method"];
  total: number;
  count: number;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-fg/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Confirm payment</p>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="rounded-lg bg-elev px-2.5 py-1 text-xs font-semibold text-fg">{method}</span>
          <span className="text-3xl font-semibold text-fg tnum">{formatMoney(total)}</span>
        </div>
        <p className="mt-1 text-right text-xs text-faint tnum">
          {count} {count === 1 ? "item" : "items"}
        </p>

        <p className="mt-5 rounded-lg bg-warn/10 px-3 py-2.5 text-[13px] text-warn">{PROMPT[method]}</p>

        <div className="mt-6 flex gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-line py-3 text-sm font-medium text-fg transition hover:border-fg active:scale-[0.99] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void confirm()}
            disabled={busy}
            className="flex-[1.4] rounded-xl bg-ok py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
          >
            {busy ? "Completing…" : "Payment received"}
          </button>
        </div>
      </div>
    </div>
  );
}
