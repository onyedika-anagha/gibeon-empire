"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { EASE } from "./motion";
import { IconSearch } from "./icons";
import { useProductSearch } from "@/hooks/useProductSearch";
import { formatMoney, toneFor } from "@/lib/format";

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const { results, loading, active } = useProductSearch(open ? term : "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Enter hands off to /shop, which owns the full filtered grid.
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = term.trim();
    if (!q) return;
    onClose();
    router.push(`/shop?q=${encodeURIComponent(q)}`);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
          className="fixed inset-0 z-[60] bg-cream/90 px-4 pt-28 backdrop-blur-2xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto max-w-2xl"
          >
            <form
              onSubmit={submit}
              className="flex items-center gap-3 rounded-full bg-ivory p-2 pl-5 ring-1 ring-ink/8 focus-within:ring-ink/25"
            >
              <IconSearch className="h-[18px] w-[18px] shrink-0 text-taupe" />
              <input
                ref={inputRef}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search pieces, brands, categories"
                className="w-full bg-transparent text-[15px] text-ink placeholder:text-taupe focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-ink px-5 py-2 text-[13px] text-ivory active:scale-95"
              >
                Search
              </button>
            </form>

            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              {!active ? (
                <p className="px-5 py-6 text-[13px] text-taupe">Type at least two characters.</p>
              ) : results.length === 0 ? (
                <p className="px-5 py-6 text-[13px] text-taupe">
                  {loading ? "Searching…" : "Nothing matches that search."}
                </p>
              ) : (
                <ul className="space-y-1">
                  {results.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/products/${p.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-4 rounded-2xl px-3 py-2.5 transition-colors hover:bg-ink/5"
                      >
                        <Thumb product={p} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] text-ink">{p.name}</span>
                          <span className="block text-[12px] text-taupe">{p.categoryLabel}</span>
                        </span>
                        <span className="shrink-0 text-[13px] text-ink">
                          {p.variants[0] ? formatMoney(p.variants[0].price) : "—"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Thumb({ product }: { product: { slug: string; name: string; media: Array<{ url: string; kind: string; alt?: string | null }> } }) {
  const image = product.media.find((m) => m.kind === "IMAGE");
  const tone = toneFor(product.slug);
  return (
    <span
      className="grid h-12 w-10 shrink-0 place-items-center overflow-hidden rounded-lg"
      style={{ backgroundImage: `linear-gradient(155deg, ${tone[0]}, ${tone[1]})` }}
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt={image.alt ?? product.name} loading="lazy" className="h-full w-full object-cover" />
      )}
    </span>
  );
}
