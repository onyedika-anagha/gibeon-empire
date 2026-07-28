"use client";

import { motion } from "motion/react";
import { Stagger, staggerItem } from "./motion";

export type Step = { n: string; title: string; body: string };

/** Numbered process steps — returns flow, ordering process, etc. */
export default function StepList({ steps, columns = 4 }: { steps: Step[]; columns?: 2 | 3 | 4 }) {
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];

  return (
    <Stagger className={`mx-auto grid max-w-5xl gap-8 ${cols}`}>
      {steps.map((s) => (
        <motion.div key={s.n} variants={staggerItem}>
          <div className="font-display text-3xl text-gold">{s.n}</div>
          <h3 className="mt-3 text-[15px] text-ink">{s.title}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-stone">{s.body}</p>
        </motion.div>
      ))}
    </Stagger>
  );
}
