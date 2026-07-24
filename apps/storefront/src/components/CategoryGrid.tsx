"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { toneFor } from "@/lib/format";
import type { Category } from "@/lib/api";
import { Reveal, Stagger, staggerItem } from "./motion";
import { IconArrowUpRight } from "./icons";
import { categoryImages } from "@/lib/shop";

// The fixed wardrobe, served by the API so admin and storefront never drift.
export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <section className="px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <span className="text-[10px] uppercase tracking-[0.24em] text-taupe">Wardrobe</span>
          <h2 className="mt-3 font-display text-4xl leading-[1.05] tracking-[-0.02em] text-ink md:text-5xl">
            Find your next signature.
          </h2>
        </Reveal>

        <Stagger className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c, i) => {
            const tone = toneFor(c.slug);
            const imagesObj = categoryImages.find((ctgy) => ctgy.slug === c.slug);
            return (
              <motion.div
                key={c.slug}
                variants={staggerItem}
                className={i === 0 ? "sm:col-span-2" : ""}
              >
                <Link
                  href={`/shop/${c.slug}`}
                  className="group relative flex min-h-[19rem] flex-col justify-end overflow-hidden rounded-[1.75rem] p-6 ring-1 ring-ink/5 bg-cover bg-center bg-blend-multiply"
                  style={{
                    backgroundImage: imagesObj
                      ? `url(${imagesObj.image})`
                      : `linear-gradient(160deg, ${tone[0]}, ${tone[1]})`,
                    backgroundColor: tone[0],
                  }}
                >
                  <div
                    className={`absolute inset-0 bg-linear-to-b from-transparent ${tone[2]}`}
                    // style={{ backgroundImage: `linear-gradient(160deg, ${tone[0]}, ${tone[1]})` }}
                  />
                  <div className="absolute inset-0 bg-ink/0 transition-colors duration-500 group-hover:bg-ink/10" />
                  <div className="absolute inset-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]" />

                  <div className="relative">
                    <h3 className="font-display text-2xl text-ink">{c.label}</h3>
                    <p className="mt-1 text-[13px] text-ink/60">
                      Shop the {c.label.toLowerCase()} edit
                    </p>
                  </div>
                  <span className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-ivory/70 text-ink backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-ivory">
                    <IconArrowUpRight className="h-4 w-4" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
