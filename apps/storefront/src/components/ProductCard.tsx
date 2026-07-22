"use client";

import { motion } from "motion/react";
import { Price } from "@gibeon/ui";
import type { Product } from "@/lib/products";
import { EASE, staggerItem } from "./motion";
import { IconBag, IconHeart } from "./icons";

export default function ProductCard({ p }: { p: Product }) {
  return (
    <motion.article variants={staggerItem} className="group">
      <div className="relative overflow-hidden rounded-[1.5rem] p-1.5 ring-1 ring-ink/5 transition-shadow duration-500 group-hover:shadow-[0_40px_70px_-45px_rgba(31,27,23,0.6)]">
        <div
          className="relative aspect-[3/4] overflow-hidden rounded-[calc(1.5rem-0.375rem)]"
          style={{ backgroundImage: `linear-gradient(155deg, ${p.tone[0]}, ${p.tone[1]})` }}
        >
          <div className="absolute inset-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]" />

          {/* subtle zoom of the "fabric" on hover */}
          <div className="absolute inset-0 scale-100 transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
            style={{ backgroundImage: `radial-gradient(120% 90% at 30% 10%, rgba(255,255,255,0.25), transparent 55%)` }}
          />

          {/* tags */}
          <div className="absolute left-3 top-3 flex gap-2">
            {p.soldOut && (
              <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-ivory backdrop-blur-sm">
                Sold out
              </span>
            )}
            {p.tag && !p.soldOut && (
              <span className="rounded-full bg-ivory/85 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-ink backdrop-blur-sm">
                {p.tag}
              </span>
            )}
          </div>

          {/* wishlist */}
          <button
            aria-label="Add to wishlist"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-ivory/80 text-ink opacity-0 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100 hover:bg-ivory active:scale-90"
          >
            <IconHeart className="h-4 w-4" />
          </button>

          {/* quick add — slides up on hover */}
          <div className="absolute inset-x-3 bottom-3 translate-y-[130%] transition-transform duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0">
            <button
              disabled={p.soldOut}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-[13px] text-ivory transition-all duration-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-ink/40"
            >
              <IconBag className="h-4 w-4" />
              {p.soldOut ? "Notify me" : "Quick add"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <h3 className="text-[15px] leading-tight text-ink transition-colors group-hover:text-gold">
          {p.name}
        </h3>
        <Price value={p.price} compareAt={p.compareAt} />
      </div>
    </motion.article>
  );
}

export { EASE };
