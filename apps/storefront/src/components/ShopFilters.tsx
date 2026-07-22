"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

const CATEGORIES = ["Dresses", "Outerwear", "Knitwear", "Atelier"];
const SIZES = ["XS", "S", "M", "L", "XL"];

export default function ShopFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`);
  }

  const activeCategory = params.get("category") ?? "";
  const activeSize = params.get("size") ?? "";

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setParam("q", q);
        }}
        className="flex items-center gap-2 rounded-full bg-ivory p-1.5 pl-5 ring-1 ring-ink/8 focus-within:ring-ink/25"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the collection"
          className="w-full bg-transparent text-sm text-ink placeholder:text-taupe focus:outline-none"
        />
        <button type="submit" className="rounded-full bg-ink px-4 py-2 text-[13px] text-ivory active:scale-95">
          Search
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Pill active={!activeCategory} onClick={() => setParam("category", "")}>
          All
        </Pill>
        {CATEGORIES.map((c) => (
          <Pill key={c} active={activeCategory === c} onClick={() => setParam("category", c)}>
            {c}
          </Pill>
        ))}
        <span className="mx-1 h-4 w-px bg-ink/10" />
        {SIZES.map((s) => (
          <Pill key={s} active={activeSize === s} onClick={() => setParam("size", activeSize === s ? "" : s)}>
            {s}
          </Pill>
        ))}
      </div>
    </div>
  );
}

function Pill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-[13px] transition-all duration-400 ${
        active ? "bg-ink text-ivory" : "text-stone ring-1 ring-ink/12 hover:bg-ink/5"
      }`}
    >
      {children}
    </button>
  );
}
