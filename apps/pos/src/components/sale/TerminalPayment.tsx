"use client";

import type { TerminalOutcome } from "@/lib/terminal";
import { formatMoney } from "@/lib/format";

const RESULT: Record<TerminalOutcome, { title: string; body: string }> = {
  processed: { title: "Approved", body: "The card payment went through." },
  cancelled: { title: "Cancelled", body: "The payment was cancelled on the terminal." },
  timeout: { title: "No response", body: "The terminal didn’t respond in time." },
};

export default function TerminalPayment({
  status,
  total,
  onRetry,
  onManual,
  onCancel,
}: {
  status: "waiting" | TerminalOutcome;
  total: number;
  onRetry: () => void;
  onManual: () => void;
  onCancel: () => void;
}) {
  const waiting = status === "waiting";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-fg/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Card · terminal</p>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="rounded-lg bg-elev px-2.5 py-1 text-xs font-semibold text-fg">CARD</span>
          <span className="text-3xl font-semibold text-fg tnum">{formatMoney(total)}</span>
        </div>

        {waiting ? (
          <div className="mt-6 flex items-center gap-3 rounded-lg bg-elev px-3 py-3">
            <span className="size-5 shrink-0 animate-spin rounded-full border-2 border-line border-t-fg" />
            <div>
              <p className="text-sm font-medium text-fg">Waiting for the terminal…</p>
              <p className="text-xs text-faint">Ask the customer to tap or insert their card.</p>
            </div>
          </div>
        ) : (
          <p
            className={`mt-6 rounded-lg px-3 py-2.5 text-[13px] ${
              status === "cancelled" || status === "timeout" ? "bg-warn/10 text-warn" : "bg-ok/10 text-ok"
            }`}
          >
            <span className="font-semibold">{RESULT[status].title}.</span> {RESULT[status].body}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          {waiting ? (
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-line py-3 text-sm font-medium text-fg transition hover:border-fg active:scale-[0.99]"
            >
              Cancel
            </button>
          ) : (
            <>
              <button
                onClick={onManual}
                className="flex-1 rounded-xl border border-line py-3 text-sm font-medium text-fg transition hover:border-fg active:scale-[0.99]"
              >
                Enter manually
              </button>
              <button
                onClick={onRetry}
                className="flex-[1.4] rounded-xl bg-fg py-3 text-sm font-semibold text-bg transition hover:opacity-90 active:scale-[0.99]"
              >
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
