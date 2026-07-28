import type { ReactNode } from "react";
import { Reveal } from "./motion";

/** Reusable editorial image/text split panel — Our Story, Sustainability, Ateliers. */
export default function SplitFeature({
  eyebrow,
  title,
  body,
  image,
  reverse = false,
  dark = false,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  reverse?: boolean;
  dark?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className="px-4 py-10 md:py-14">
      <div
        className={`mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-[2.5rem] p-6 ring-1 ring-ink/10 md:grid-cols-2 md:p-12 ${
          dark ? "bg-espresso text-ivory" : "bg-ivory/60"
        }`}
      >
        <div className={reverse ? "md:order-2" : ""}>
          <Reveal>
            <span className={`text-[10px] uppercase tracking-[0.24em] ${dark ? "text-gold-soft" : "text-taupe"}`}>
              {eyebrow}
            </span>
            <h2 className="mt-4 font-display text-4xl leading-[1.03] tracking-[-0.02em] md:text-[2.75rem]">
              {title}
            </h2>
            <p className={`mt-6 max-w-md text-[15px] leading-relaxed ${dark ? "text-ivory/70" : "text-stone"}`}>
              {body}
            </p>
            {children}
          </Reveal>
        </div>

        <Reveal delay={0.1} className={reverse ? "md:order-1" : ""}>
          <div
            className="h-[22rem] overflow-hidden rounded-[1.75rem] bg-cover bg-center shadow-[0_40px_80px_-40px_rgba(31,27,23,0.5)] md:h-[26rem]"
            style={{ backgroundImage: `url(${image})` }}
          />
        </Reveal>
      </div>
    </section>
  );
}
