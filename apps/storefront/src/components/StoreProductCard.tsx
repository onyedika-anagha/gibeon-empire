"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ApiProduct } from "@/lib/api";
import { formatMoney, toneFor } from "@/lib/format";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { staggerItem } from "./motion";
import { IconBag, IconHeart } from "./icons";

export default function StoreProductCard({ p }: { p: ApiProduct }) {
  const { add, setOpen } = useCart();
  const { has, toggle } = useWishlist();
  const tone = toneFor(p.slug);

  const firstAvailable = p.variants.find((v) => v.stock.state !== "sold_out");
  const soldOut = !firstAvailable;
  const priced = firstAvailable ?? p.variants[0];
  const anyLow = p.variants.some((v) => v.stock.state === "low_stock");
  const image = p.media.find((m) => m.kind === "IMAGE");

  function quickAdd() {
    if (!firstAvailable) return;
    add({
      variantId: firstAvailable.id,
      slug: p.slug,
      name: p.name,
      size: firstAvailable.size,
      color: firstAvailable.color,
      price: firstAvailable.price,
      image: image?.url,
    });
    setOpen(true);
  }

  return (
    <motion.article variants={staggerItem} className="group relative">
      <Link href={`/products/${p.slug}`} className="block">
        <div className="relative overflow-hidden rounded-[1.5rem] p-1.5 ring-1 ring-ink/5 transition-shadow duration-500 group-hover:shadow-[0_40px_70px_-45px_rgba(31,27,23,0.6)]">
          <div
            className="relative aspect-[3/4] overflow-hidden rounded-[calc(1.5rem-0.375rem)]"
            style={{ backgroundImage: `linear-gradient(155deg, ${tone[0]}, ${tone[1]})` }}
          >
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.url}
                alt={image.alt ?? p.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]" />
            <div className="absolute left-3 top-3 flex gap-2">
              {soldOut && (
                <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-ivory backdrop-blur-sm">
                  Sold out
                </span>
              )}
              {!soldOut && anyLow && (
                <span className="rounded-full bg-ivory/85 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-ink backdrop-blur-sm">
                  Low stock
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      <button
        aria-label="Toggle wishlist"
        onClick={() => toggle(p.slug)}
        className={`absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-ivory/80 backdrop-blur-sm transition-all duration-500 hover:bg-ivory active:scale-90 ${
          has(p.slug) ? "text-gold" : "text-ink"
        }`}
      >
        <IconHeart className="h-4 w-4" />
      </button>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] leading-tight text-ink transition-colors group-hover:text-gold">
            <Link href={`/products/${p.slug}`}>{p.name}</Link>
          </h3>
          <p className="mt-0.5 text-[12px] text-taupe">{p.categoryLabel}</p>
        </div>
        <div className="flex shrink-0 items-baseline gap-1.5">
          {priced?.compareAtPrice ? (
            <span className="text-[13px] text-taupe line-through">{formatMoney(priced.compareAtPrice)}</span>
          ) : null}
          <span className="text-[15px] text-ink">{priced ? formatMoney(priced.price) : "—"}</span>
        </div>
      </div>

      <button
        onClick={quickAdd}
        disabled={soldOut}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-ink/12 py-2.5 text-[13px] text-ink transition-all duration-400 hover:bg-ink hover:text-ivory active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink"
      >
        <IconBag className="h-4 w-4" />
        {soldOut ? "Sold out" : "Quick add"}
      </button>
    </motion.article>
  );
}
