"use client";

import { useEffect, useState } from "react";
import { api, type Category } from "@/lib/api";

// The category list is fixed and server-owned; fetch it once per page load.
let cached: Promise<Category[]> | null = null;

export function useCategories(): Category[] {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    cached ??= api.categories().catch(() => []);
    let alive = true;
    void cached.then((c) => alive && setCategories(c));
    return () => {
      alive = false;
    };
  }, []);
  return categories;
}
