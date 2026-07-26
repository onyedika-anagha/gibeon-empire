import { api } from "./api";

export type TerminalOutcome = "processed" | "cancelled" | "timeout";

interface PayOpts {
  signal?: AbortSignal;
  pollIntervalMs?: number;
  timeoutMs?: number;
}

/**
 * Push a card sale to the Moniepoint terminal and poll until it resolves.
 * The initial push THROWS on failure (offline mid-sale, terminal not configured)
 * so the caller can fall back to manual confirmation. Once the push is accepted,
 * a slow terminal is reported as "timeout" rather than thrown — the cashier decides.
 */
export async function payViaTerminal(
  reference: string,
  amount: number,
  opts: PayOpts = {},
): Promise<TerminalOutcome> {
  const interval = opts.pollIntervalMs ?? 2500;
  const timeout = opts.timeoutMs ?? 120_000; // ponytail: 2-min ceiling; card prompts resolve well under this

  await api.pushToTerminal(reference, amount, "CARD_PURCHASE"); // throws → caller falls back to manual

  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (opts.signal?.aborted) return "cancelled";
    await sleep(interval, opts.signal);
    if (opts.signal?.aborted) return "cancelled";
    // A polling blip shouldn't abort the sale — treat it as still pending and retry.
    const status = await api
      .terminalStatus(reference)
      .then((r) => r.status)
      .catch(() => "pending" as const);
    if (status === "processed") return "processed";
    if (status === "cancelled") return "cancelled";
  }
  return "timeout";
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });
}
