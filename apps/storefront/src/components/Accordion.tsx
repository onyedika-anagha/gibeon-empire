"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EASE, Stagger, staggerItem } from "./motion";
import { IconPlus } from "./icons";

export type AccordionItem = { q: string; a: string };

/** Shared expand/collapse list — used by FAQ, Shipping, and Returns. */
export default function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Stagger className="mx-auto max-w-3xl divide-y divide-ink/8 border-y border-ink/8">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <motion.div key={item.q} variants={staggerItem}>
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-6 py-5 text-left"
            >
              <span className="text-[15px] text-ink">{item.q}</span>
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/5 text-ink transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "rotate-45" : ""}`}
              >
                <IconPlus className="h-4 w-4" />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className="pb-6 pr-14 text-[14px] leading-relaxed text-stone">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </Stagger>
  );
}
