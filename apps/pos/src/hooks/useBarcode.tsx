"use client";

import { useEffect } from "react";

/**
 * USB/Bluetooth HID barcode scanners act as keyboards: a burst of keystrokes
 * ending in Enter. We buffer fast input and treat a completed burst as a scan
 * (PRD Req. 11). ponytail: camera-based scanning is the documented fallback —
 * not wired here to avoid a decoder dependency; HID covers the primary case.
 */
export function useBarcode(onScan: (code: string) => void) {
  useEffect(() => {
    let buffer = "";
    let last = 0;
    const handler = (e: KeyboardEvent) => {
      const now = Date.now();
      if (now - last > 120) buffer = ""; // gap ⇒ new burst (human typing)
      last = now;
      if (e.key === "Enter") {
        if (buffer.length >= 3) onScan(buffer);
        buffer = "";
        return;
      }
      if (e.key.length === 1) buffer += e.key;
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onScan]);
}
