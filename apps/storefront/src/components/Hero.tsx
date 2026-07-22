"use client";

import { motion } from "motion/react";
import { EASE } from "./motion";
import { IconArrowUpRight } from "./icons";

const rise = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1, ease: EASE, delay: 0.25 + i * 0.12 },
  }),
};

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-36 pb-16 md:pt-44 md:pb-24">
      {/* ambient light */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-[38rem] w-[38rem] animate-drift rounded-full bg-blush/50 blur-[120px]" />
      <div className="pointer-events-none absolute top-24 right-0 h-[30rem] w-[30rem] animate-drift rounded-full bg-gold-soft/25 blur-[130px]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[1.05fr_0.95fr]">
        {/* copy */}
        <div>
          <motion.span
            custom={0}
            variants={rise}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-stone ring-1 ring-ink/5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gold" /> Autumn Atelier · 2025
          </motion.span>

          <motion.h1
            custom={1}
            variants={rise}
            initial="hidden"
            animate="show"
            className="mt-6 font-display text-[15vw] leading-[0.92] tracking-[-0.03em] text-ink sm:text-7xl md:text-[5.4rem]"
          >
            Effortless luxury,
            <br />
            <span className="italic text-gold">thoughtfully</span> made.
          </motion.h1>

          <motion.p
            custom={2}
            variants={rise}
            initial="hidden"
            animate="show"
            className="mt-6 max-w-md text-[15px] leading-relaxed text-stone"
          >
            Modern essentials in refined tones and timeless cuts — the quiet
            confidence of pieces designed to feel as good as they look.
          </motion.p>

          <motion.div
            custom={3}
            variants={rise}
            initial="hidden"
            animate="show"
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <a
              href="#collections"
              className="group inline-flex items-center gap-3 rounded-full bg-ink py-2.5 pl-6 pr-2.5 text-sm text-ivory transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]"
            >
              Shop the edit
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ivory/15 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <IconArrowUpRight className="h-4 w-4" />
              </span>
            </a>
            <a
              href="#"
              className="rounded-full px-5 py-2.5 text-sm text-ink ring-1 ring-ink/15 transition-colors duration-500 hover:bg-ink/5"
            >
              Discover the house
            </a>
          </motion.div>

          <motion.div
            custom={4}
            variants={rise}
            initial="hidden"
            animate="show"
            className="mt-12 flex items-center gap-8"
          >
            {[
              ["10M+", "Members worldwide"],
              ["24 yrs", "In fine tailoring"],
              ["5", "Flagship ateliers"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-2xl text-ink">{n}</div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-taupe">{l}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* layered lookbook */}
        <div className="relative h-[26rem] sm:h-[32rem] md:h-[38rem]">
          <FabricCard
            className="absolute right-0 top-0 h-[80%] w-[68%] rotate-[3deg]"
            tone={["#e2cfd0", "#b58f92"]}
            delay={0.4}
            label="Aria Bias Gown"
          />
          <FabricCard
            className="absolute bottom-0 left-0 h-[62%] w-[54%] -rotate-[4deg]"
            tone={["#e9ddc9", "#c8b088"]}
            delay={0.58}
            label="Verona Knit"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.8 }}
            className="absolute left-6 top-8 z-20 rounded-full bg-ivory/80 px-4 py-2 text-[11px] tracking-wide text-ink shadow-[0_16px_40px_-24px_rgba(31,27,23,0.6)] ring-1 ring-ink/5 backdrop-blur-md"
          >
            ✶ Hand-finished in the atelier
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FabricCard({
  className,
  tone,
  delay,
  label,
}: {
  className: string;
  tone: [string, string];
  delay: number;
  label: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.1, ease: EASE, delay }}
      className={`group overflow-hidden rounded-[2rem] p-1.5 ring-1 ring-ink/5 shadow-[0_40px_80px_-40px_rgba(31,27,23,0.55)] ${className}`}
      style={{ background: "rgba(255,255,255,0.35)" }}
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-[calc(2rem-0.375rem)]"
        style={{ backgroundImage: `linear-gradient(150deg, ${tone[0]}, ${tone[1]})` }}
      >
        <div className="absolute inset-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]" />
        <span className="absolute bottom-4 left-4 rounded-full bg-ink/25 px-3 py-1 text-[11px] text-ivory backdrop-blur-sm">
          {label}
        </span>
      </div>
    </motion.div>
  );
}
