"use client";

import { motion } from "motion/react";
import { Stagger, staggerItem } from "./motion";

export type StatGridItem = { title: string; lines: string[] };

/** Small reveal-animated fact cards — shipping rates, size notes, etc. */
export default function StatGrid({ items, columns = 3 }: { items: StatGridItem[]; columns?: 2 | 3 | 4 }) {
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];

  return (
    <Stagger className={`mx-auto grid max-w-4xl gap-4 ${cols}`}>
      {items.map((item) => (
        <motion.div
          key={item.title}
          variants={staggerItem}
          className="rounded-[1.5rem] bg-ivory/60 p-6 ring-1 ring-ink/5"
        >
          <h3 className="text-[15px] text-ink">{item.title}</h3>
          {item.lines.map((line) => (
            <p key={line} className="mt-1.5 text-[13px] leading-relaxed text-stone">
              {line}
            </p>
          ))}
        </motion.div>
      ))}
    </Stagger>
  );
}
