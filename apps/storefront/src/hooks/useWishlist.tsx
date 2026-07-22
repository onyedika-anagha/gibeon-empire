"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "gibeon.wishlist";
const EVENT = "gibeon:wishlist";

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** Simple localStorage wishlist keyed by product slug, synced across components. */
export function useWishlist() {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    setSlugs(read());
    const sync = () => setSlugs(read());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const toggle = useCallback((slug: string) => {
    const next = read().includes(slug) ? read().filter((s) => s !== slug) : [...read(), slug];
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { slugs, has: (s: string) => slugs.includes(s), toggle };
}
