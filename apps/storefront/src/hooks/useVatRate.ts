"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

/** VAT added on top of the discounted amount — mirrors the API's rule exactly. */
export function vatOn(amount: number, rateBps: number): number {
  return Math.round((amount * rateBps) / 10_000);
}

// One fetch per page load, shared by every component that shows a total.
let cached: Promise<number> | null = null;
function load(): Promise<number> {
  cached ??= (async () => {
    try {
      return (await api.taxRate()).vatRateBps;
    } catch {
      return 0; // API down: show no VAT line rather than a wrong one
    }
  })();
  return cached;
}

export function useVatRate(): number {
  const [bps, setBps] = useState(0);
  useEffect(() => {
    let alive = true;
    void load().then((v) => alive && setBps(v));
    return () => {
      alive = false;
    };
  }, []);
  return bps;
}

export function formatRate(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;
}
