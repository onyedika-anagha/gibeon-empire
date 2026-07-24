"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { ApiProduct } from "@/lib/api";
import { formatMoney, toneFor } from "@/lib/format";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { EASE } from "./motion";
import { IconBag, IconHeart } from "./icons";

export default function ProductDetail({ product }: { product: ApiProduct }) {
  const { add, setOpen } = useCart();
  const { has, toggle } = useWishlist();
  const tone = toneFor(product.slug);

  const firstAvailable = product.variants.find((v) => v.stock.state !== "sold_out");
  const [selectedId, setSelectedId] = useState(firstAvailable?.id ?? product.variants[0]?.id);
  const selected = product.variants.find((v) => v.id === selectedId);
  const soldOut = !selected || selected.stock.state === "sold_out";

  const images = product.media.filter((m) => m.kind === "IMAGE");
  const [activeImg, setActiveImg] = useState(0);
  const active = images[activeImg] ?? images[0];

  function addToCart() {
    if (!selected || soldOut) return;
    add({
      variantId: selected.id,
      slug: product.slug,
      name: product.name,
      size: selected.size,
      color: selected.color,
      price: selected.price,
      image: images[0]?.url,
    });
    setOpen(true);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:gap-16">
      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        <div className="aspect-[4/5] overflow-hidden rounded-[2rem] p-1.5 ring-1 ring-ink/5">
          <div
            className="relative h-full w-full overflow-hidden rounded-[calc(2rem-0.375rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]"
            style={{ backgroundImage: `linear-gradient(150deg, ${tone[0]}, ${tone[1]})` }}
          >
            {active && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={active.url} alt={active.alt ?? product.name} className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
        </div>

        {images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {images.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setActiveImg(i)}
                aria-label={`View image ${i + 1}`}
                className={`h-16 w-14 shrink-0 overflow-hidden rounded-xl ring-1 transition ${
                  i === activeImg ? "ring-ink" : "ring-ink/10 hover:ring-ink/30"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
        className="flex flex-col justify-center"
      >
        <span className="text-[10px] uppercase tracking-[0.24em] text-taupe">
          {product.brand} · {product.categoryLabel}
        </span>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-[-0.02em] text-ink md:text-5xl">
          {product.name}
        </h1>

        <div className="mt-4 flex items-baseline gap-2">
          {selected?.compareAtPrice ? (
            <span className="text-lg text-taupe line-through">{formatMoney(selected.compareAtPrice)}</span>
          ) : null}
          <span className="font-display text-2xl text-ink">
            {selected ? formatMoney(selected.price) : "—"}
          </span>
        </div>

        {product.description && (
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-stone">{product.description}</p>
        )}

        <div className="mt-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-taupe">Select</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const disabled = v.stock.state === "sold_out";
              return (
                <button
                  key={v.id}
                  disabled={disabled}
                  onClick={() => setSelectedId(v.id)}
                  className={`rounded-full px-4 py-2 text-[13px] transition-all duration-400 ${
                    v.id === selectedId
                      ? "bg-ink text-ivory"
                      : "text-ink ring-1 ring-ink/12 hover:bg-ink/5"
                  } ${disabled ? "cursor-not-allowed line-through opacity-40" : ""}`}
                >
                  {v.size} · {v.color}
                </button>
              );
            })}
          </div>
          {selected?.stock.state === "low_stock" && (
            <p className="mt-3 text-[13px] text-gold">Only {selected.stock.remaining} left — almost gone.</p>
          )}
        </div>

        <div className="mt-9 flex gap-3">
          <button
            onClick={addToCart}
            disabled={soldOut}
            className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm text-ivory transition-all duration-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-ink/30"
          >
            <IconBag className="h-4 w-4" />
            {soldOut ? "Sold out" : "Add to bag"}
          </button>
          <button
            onClick={() => toggle(product.slug)}
            aria-label="Wishlist"
            className={`grid h-[52px] w-[52px] place-items-center rounded-full ring-1 ring-ink/12 transition-all duration-500 hover:bg-ink/5 active:scale-90 ${
              has(product.slug) ? "text-gold" : "text-ink"
            }`}
          >
            <IconHeart className="h-5 w-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
