"use client";

import { useEffect, useState } from "react";
import { api, type ApiProduct } from "@/lib/api";

/** Debounced product typeahead. Terms under 2 chars are not sent. */
export function useProductSearch(term: string, delay = 250) {
  const [results, setResults] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const q = term.trim();

  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    let cancelled = false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      api
        .searchProducts(q, { signal: ctrl.signal })
        .then((r) => !cancelled && setResults(r))
        .catch(() => {}) // aborted or offline — keep showing the last results
        .finally(() => !cancelled && setLoading(false));
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q, delay]);

  return { results, loading, active: q.length >= 2 };
}
