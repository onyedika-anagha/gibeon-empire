"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Reveal, EASE } from "./motion";
import { IconArrow } from "./icons";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section className="px-4 py-20 md:py-28">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-blush/60 p-8 ring-1 ring-ink/5 md:p-16">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-gold-soft/30 blur-[90px]" />
        <div className="relative mx-auto max-w-xl text-center">
          <Reveal>
            <span className="text-[10px] uppercase tracking-[0.24em] text-stone">The list</span>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] tracking-[-0.02em] text-ink md:text-5xl">
              Join the house.
              <span className="italic text-gold"> Enjoy 20% off.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-stone">
              Early access to collections, atelier notes, and a welcome code for
              your first order. We treat your details with care.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email) setSent(true);
              }}
              className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-full bg-ivory p-1.5 pl-5 ring-1 ring-ink/8 focus-within:ring-ink/25 transition-all duration-500"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                aria-label="Email address"
                className="w-full bg-transparent text-sm text-ink placeholder:text-taupe focus:outline-none"
              />
              <button
                type="submit"
                className="group grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-ivory transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-90"
                aria-label="Subscribe"
              >
                <IconArrow className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5" />
              </button>
            </form>
          </Reveal>

          {sent && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="mt-4 text-[13px] text-gold"
            >
              Welcome to Gibeon Empire — check your inbox for your code. ✶
            </motion.p>
          )}
        </div>
      </div>
    </section>
  );
}
