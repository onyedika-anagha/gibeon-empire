"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "motion/react";
import { EASE } from "./motion";
import { IconSearch, IconUser, IconHeart, IconBag } from "./icons";

const LINKS = ["New In", "Women", "Collections", "Atelier", "Journal"];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  // Lock scroll while the overlay menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
        className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
      >
        <nav
          className={`flex w-full max-w-6xl items-center justify-between rounded-full px-3 py-2.5 pl-6 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            scrolled
              ? "bg-ivory/70 shadow-[0_18px_60px_-30px_rgba(31,27,23,0.5)] ring-1 ring-ink/5 backdrop-blur-xl"
              : "bg-transparent"
          }`}
        >
          <a href="#" className="font-display text-lg tracking-tight text-ink">
            Gibeon<span className="text-gold"> Empire</span>
          </a>

          <ul className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <li key={l}>
                <a
                  href="#"
                  className="group relative text-[13px] tracking-wide text-stone transition-colors hover:text-ink"
                >
                  {l}
                  <span className="absolute -bottom-1 left-0 h-px w-0 bg-gold transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1">
            <IconButton label="Search"><IconSearch className="h-[18px] w-[18px]" /></IconButton>
            <IconButton label="Account" className="hidden sm:inline-flex"><IconUser className="h-[18px] w-[18px]" /></IconButton>
            <IconButton label="Wishlist" className="hidden sm:inline-flex"><IconHeart className="h-[18px] w-[18px]" /></IconButton>
            <button
              aria-label="Cart"
              className="group relative ml-1 inline-flex items-center gap-2 rounded-full bg-ink py-2 pl-3.5 pr-2 text-ivory transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95"
            >
              <IconBag className="h-[18px] w-[18px]" />
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-ivory/15 px-1.5 text-[11px]">2</span>
            </button>

            <button
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              className="relative ml-1 grid h-10 w-10 place-items-center rounded-full ring-1 ring-ink/10 md:hidden"
            >
              <span className={`absolute h-px w-4 bg-ink transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "rotate-45" : "-translate-y-1"}`} />
              <span className={`absolute h-px w-4 bg-ink transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "-rotate-45" : "translate-y-1"}`} />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-cream/85 px-8 backdrop-blur-2xl md:hidden"
          >
            <motion.ul
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } } }}
              className="space-y-2"
            >
              {LINKS.map((l) => (
                <motion.li
                  key={l}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
                  }}
                >
                  <a
                    href="#"
                    onClick={() => setOpen(false)}
                    className="font-display text-5xl tracking-tight text-ink"
                  >
                    {l}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
            <div className="mt-12 flex gap-6 text-sm text-stone">
              <a href="#">Account</a>
              <a href="#">Wishlist</a>
              <a href="#">Stores</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function IconButton({
  children,
  label,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <button
      aria-label={label}
      className={`grid h-10 w-10 place-items-center rounded-full text-ink/80 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-ink/5 hover:text-ink active:scale-90 ${className}`}
    >
      {children}
    </button>
  );
}
