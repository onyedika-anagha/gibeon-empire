"use client";

import Link from "next/link";
import type { ApiProduct } from "@/lib/api";
import { Reveal, Stagger } from "./motion";
import StoreProductCard from "./StoreProductCard";
import { IconArrow } from "./icons";

export default function CollectionSection({
  id,
  eyebrow,
  title,
  blurb,
  products,
  href = "/shop",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  blurb: string;
  products: ApiProduct[];
  href?: string;
}) {
  return (
    <section id={id} className="px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <span className="text-[10px] uppercase tracking-[0.24em] text-taupe">{eyebrow}</span>
            <h2 className="mt-3 max-w-xl font-display text-4xl leading-[1.05] tracking-[-0.02em] text-ink md:text-5xl">
              {title}
            </h2>
            <p className="mt-4 max-w-md text-[15px] text-stone">{blurb}</p>
          </Reveal>

          <Reveal delay={0.1}>
            <Link href={href} className="group inline-flex items-center gap-2 text-sm text-ink">
              View all
              <span className="grid h-8 w-8 place-items-center rounded-full ring-1 ring-ink/15 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-ink group-hover:text-ivory">
                <IconArrow className="h-4 w-4" />
              </span>
            </Link>
          </Reveal>
        </div>

        <Stagger className="mt-12 grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6">
          {products.map((p) => (
            <StoreProductCard key={p.id} p={p} />
          ))}
        </Stagger>
      </div>
    </section>
  );
}
