"use client";

import type { SnapshotVariant } from "@/lib/db";
import { formatMoney } from "@/lib/format";

interface Props {
  results: SnapshotVariant[];
  catalogueEmpty: boolean;
  query: string;
  onQuery: (q: string) => void;
  flash: string;
  onAdd: (v: SnapshotVariant) => void;
}

export default function ProductGrid({ results, catalogueEmpty, query, onQuery, flash, onAdd }: Props) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden border-r border-line">
      <div className="border-b border-line p-5">
        <div className="relative">
          <SearchIcon />
          <input
            data-barcode="ignore"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search or scan a barcode…"
            className="w-full rounded-xl border border-line bg-elev/60 py-3 pl-11 pr-4 text-sm text-fg outline-none transition placeholder:text-faint focus:border-gold"
          />
        </div>
        {flash && <p className="mt-2 text-xs font-medium text-gold">{flash}</p>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {results.map((v) => (
            <ProductCard key={v.variantId} v={v} onAdd={onAdd} />
          ))}
        </div>

        {results.length === 0 && (
          <div className="grid place-items-center py-20 text-center">
            <p className="text-sm text-muted">
              {catalogueEmpty ? "No catalogue yet — connect and sync to load products." : "No matches."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCard({ v, onAdd }: { v: SnapshotVariant; onAdd: (v: SnapshotVariant) => void }) {
  const soldOut = v.quantity === 0;
  const low = !soldOut && (v.quantity ?? 99) <= 3;
  return (
    <button
      disabled={soldOut}
      onClick={() => onAdd(v)}
      className="group relative flex flex-col rounded-xl border border-line bg-panel p-3 text-left transition hover:-translate-y-0.5 hover:border-gold hover:shadow-[0_10px_30px_-14px_rgba(26,23,20,0.35)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-40"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-elev to-line">
        {soldOut && (
          <span className="absolute left-1.5 top-1.5 rounded bg-fg/80 px-1.5 py-0.5 text-[10px] font-medium text-bg">
            Sold out
          </span>
        )}
        {low && (
          <span className="absolute left-1.5 top-1.5 rounded bg-warn/90 px-1.5 py-0.5 text-[10px] font-medium text-white tnum">
            {v.quantity} left
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-1 text-[13px] font-medium text-fg">{v.productName}</p>
      <p className="text-[11px] text-muted">
        {v.size} · {v.color}
      </p>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-fg tnum">{formatMoney(v.price)}</span>
        {!low && !soldOut && <span className="text-[11px] text-faint tnum">{v.quantity ?? "–"}</span>}
      </div>
    </button>
  );
}

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
