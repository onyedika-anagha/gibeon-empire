"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Reveal } from "./motion";
import { IconArrowUpRight } from "./icons";

const STATS = [
  ["3", "Sub-houses"],
  ["10M+", "Loyal clients"],
  ["24", "Years in service"],
  ["5", "Countries"],
];

export default function EditorialFeature() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // gentle parallax on the imagery column
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <section className="px-4 py-20 md:py-28">
      <div
        ref={ref}
        className="mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-[2.5rem] bg-espresso p-6 text-ivory ring-1 ring-ink/10 md:grid-cols-2 md:p-12"
      >
        <div>
          <Reveal>
            <span className="text-[10px] uppercase tracking-[0.24em] text-gold-soft">
              The House
            </span>
            <h2 className="mt-4 font-display text-4xl leading-[1.03] tracking-[-0.02em] md:text-[3.25rem]">
              A softer, more deliberate take on modern luxury.
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ivory/70">
              Gibeon Empire is built for the woman who dresses for herself — refined palettes,
              natural textures, and pieces you reach for long after the season turns. Quiet luxury,
              made to last.
            </p>
            <a
              href="#"
              className="group mt-8 inline-flex items-center gap-3 rounded-full bg-ivory py-2.5 pl-6 pr-2.5 text-sm text-ink transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98]"
            >
              Explore the collection
              <span className="grid h-8 w-8 place-items-center rounded-full bg-ink/10 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <IconArrowUpRight className="h-4 w-4" />
              </span>
            </a>
          </Reveal>

          <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
            {STATS.map(([n, l], i) => (
              <Reveal key={l} delay={i * 0.08}>
                <div className="font-display text-3xl text-ivory">{n}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-ivory/50">
                  {l}
                </div>
                -
              </Reveal>
            ))}
          </div>
        </div>

        <motion.div style={{ y }} className="relative h-[24rem] md:h-[30rem]">
          <div
            className="absolute right-0 top-0 h-full w-[78%] overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)] bg-[#d8c6c0] bg-cover bg-center bg-blend-multiply"
            style={{
              backgroundImage:
                // "linear-gradient(160deg,#d8c6c0,#9a7d76 55%,#4c3f3a)"
                "url(https://res.cloudinary.com/diiwcwakk/image/upload/v1784831988/7_jm4mlw.webp)",
            }}
          >
            <div className="absolute inset-0 bg-linear-180 from-transparent to-[#4c3f3ac7]" />
          </div>
          <div
            className="absolute bottom-6 left-0 h-[46%] w-[46%] overflow-hidden rounded-[1.6rem] ring-1 ring-ivory/20 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)] bg-[#e9ddc9] bg-cover bg-center bg-blend-multiply"
            style={{
              backgroundImage:
                "url(https://res.cloudinary.com/diiwcwakk/image/upload/v1784830292/bags_oij0n7.webp)",
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}
